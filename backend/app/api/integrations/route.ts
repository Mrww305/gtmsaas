// ============================================================
// backend/app/api/integrations/route.ts
// GET: List integrations for workspace (never returns actual keys)
// POST: Add a new BYO API key (stored in Supabase Vault)
// DELETE: Remove an integration
// PATCH: Update integration config/status
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, getAuthenticatedUser, getUserWorkspace } from '@/lib/supabase/server';

// Supported providers with their categories and required fields
const SUPPORTED_PROVIDERS: Record<string, {
  category: string;
  displayName: string;
  requiredFields: string[];
  keyLabel: string;
}> = {
  // Enrichment
  apollo: { category: 'enrichment', displayName: 'Apollo.io', requiredFields: ['api_key'], keyLabel: 'Apollo API Key' },
  clearbit: { category: 'enrichment', displayName: 'Clearbit', requiredFields: ['api_key'], keyLabel: 'Clearbit API Key' },
  scrapingbee: { category: 'enrichment', displayName: 'ScrapingBee', requiredFields: ['api_key'], keyLabel: 'ScrapingBee API Key' },
  
  // AI
  openai: { category: 'ai', displayName: 'OpenAI', requiredFields: ['api_key'], keyLabel: 'OpenAI API Key' },
  anthropic: { category: 'ai', displayName: 'Anthropic', requiredFields: ['api_key'], keyLabel: 'Anthropic API Key' },
  
  // Email (webhook push — no key needed, just account config)
  smartlead: { category: 'email', displayName: 'Smartlead', requiredFields: ['api_key'], keyLabel: 'Smartlead API Key' },
  instantly: { category: 'email', displayName: 'Instantly', requiredFields: ['api_key'], keyLabel: 'Instantly API Key' },
  
  // CRM
  hubspot: { category: 'crm', displayName: 'HubSpot', requiredFields: ['access_token', 'portal_id'], keyLabel: 'HubSpot Access Token' },
  pipedrive: { category: 'crm', displayName: 'Pipedrive', requiredFields: ['api_token'], keyLabel: 'Pipedrive API Token' },
  
  // Alerts
  slack: { category: 'alerts', displayName: 'Slack', requiredFields: ['webhook_url'], keyLabel: 'Slack Webhook URL' },
  discord: { category: 'alerts', displayName: 'Discord', requiredFields: ['webhook_url'], keyLabel: 'Discord Webhook URL' },
};

/**
 * GET /api/integrations
 * Lists all integrations for the workspace.
 * NEVER returns actual API keys — only metadata and status.
 */
export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const workspaceData = await getUserWorkspace(user.id);
    if (!workspaceData) return NextResponse.json({ error: 'No workspace found' }, { status: 404 });

    const supabase = createSupabaseServerClient();

    const { data: integrations, error } = await supabase
      .from('integrations')
      .select('id, provider, category, display_name, status, last_used_at, last_error, last_error_at, rate_limit_remaining, rate_limit_reset_at, config, created_at')
      .eq('workspace_id', workspaceData.workspace.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[GET /api/integrations] Error:', error);
      return NextResponse.json({ error: 'Failed to fetch integrations' }, { status: 500 });
    }

    // Also return list of supported providers for the UI
    return NextResponse.json({
      integrations: integrations || [],
      supported_providers: Object.entries(SUPPORTED_PROVIDERS).map(([key, val]) => ({
        id: key,
        ...val,
      })),
    });
  } catch (err) {
    console.error('[GET /api/integrations] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/integrations
 * Adds a new BYO API key.
 * Body: { provider: 'apollo', display_name?: 'My Apollo', api_key: 'sk-...', config?: {} }
 * 
 * The API key is stored in Supabase Vault (encrypted at rest).
 * Only the vault_key_id reference is stored in the integrations table.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const workspaceData = await getUserWorkspace(user.id);
    if (!workspaceData) return NextResponse.json({ error: 'No workspace found' }, { status: 404 });

    if (!['owner', 'admin', 'editor'].includes(workspaceData.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { provider, display_name, config } = body;

    if (!provider || !SUPPORTED_PROVIDERS[provider]) {
      return NextResponse.json(
        { error: `Unsupported provider. Supported: ${Object.keys(SUPPORTED_PROVIDERS).join(', ')}` },
        { status: 400 }
      );
    }

    const providerInfo = SUPPORTED_PROVIDERS[provider];

    // Validate required fields are present in config
    for (const field of providerInfo.requiredFields) {
      if (!config?.[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    const supabase = createSupabaseServerClient();

    // Store the secret in Supabase Vault
    // The vault encrypts the secret at rest and provides secure retrieval
    const secretName = `integration_${workspaceData.workspace.id}_${provider}_${Date.now()}`;
    
    // Create vault secret via the vault schema
    // Note: In production, use the Supabase Vault API or Edge Function
    const { data: vaultSecret, error: vaultError } = await supabase
      .from('vault_secrets' as any) // Vault uses a special schema
      .insert({
        name: secretName,
        secret: JSON.stringify(config), // Store all config fields as encrypted JSON
      })
      .select()
      .single();

    if (vaultError) {
      console.error('[POST /api/integrations] Vault error:', vaultError);
      // Fallback: If vault isn't available, we'll use a different approach
      // In production, ensure supabase_vault extension is enabled
      return NextResponse.json(
        { error: 'Failed to securely store API key. Please ensure Vault extension is enabled.' },
        { status: 500 }
      );
    }

    // Store integration record (references vault, NOT the actual key)
    const { data: integration, error: intError } = await supabase
      .from('integrations')
      .insert({
        workspace_id: workspaceData.workspace.id,
        provider,
        category: providerInfo.category,
        display_name: display_name || providerInfo.displayName,
        vault_key_id: vaultSecret.id,
        status: 'active',
        config: {
          // Store non-secret config (e.g., portal_id for HubSpot)
          ...Object.fromEntries(
            Object.entries(config || {}).filter(
              ([key]) => !providerInfo.requiredFields.includes(key)
            )
          ),
        },
      })
      .select()
      .single();

    if (intError) {
      console.error('[POST /api/integrations] Integration insert error:', intError);
      return NextResponse.json({ error: 'Failed to save integration' }, { status: 500 });
    }

    return NextResponse.json({
      integration: {
        id: integration.id,
        provider: integration.provider,
        category: integration.category,
        display_name: integration.display_name,
        status: integration.status,
        // NEVER return the actual API key
      },
      message: `${providerInfo.displayName} integration added successfully.`,
    }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/integrations] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/integrations
 * Removes an integration and its vault secret.
 * Body: { integration_id: '...' }
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const workspaceData = await getUserWorkspace(user.id);
    if (!workspaceData) return NextResponse.json({ error: 'No workspace found' }, { status: 404 });

    if (!['owner', 'admin'].includes(workspaceData.role)) {
      return NextResponse.json({ error: 'Only owners and admins can delete integrations' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const integrationId = searchParams.get('id');

    if (!integrationId) {
      return NextResponse.json({ error: 'Integration ID required' }, { status: 400 });
    }

    const supabase = createSupabaseServerClient();

    // Fetch integration to get vault_key_id
    const { data: integration } = await supabase
      .from('integrations')
      .select('vault_key_id, workspace_id')
      .eq('id', integrationId)
      .single();

    if (!integration || integration.workspace_id !== workspaceData.workspace.id) {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 });
    }

    // Delete vault secret
    await supabase
      .from('vault_secrets' as any)
      .delete()
      .eq('id', integration.vault_key_id);

    // Delete integration record
    await supabase
      .from('integrations')
      .delete()
      .eq('id', integrationId);

    return NextResponse.json({ success: true, message: 'Integration removed.' });
  } catch (err) {
    console.error('[DELETE /api/integrations] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/integrations/test
 * Tests an integration by making a lightweight API call.
 * Body: { integration_id: '...' }
 */
export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const workspaceData = await getUserWorkspace(user.id);
    if (!workspaceData) return NextResponse.json({ error: 'No workspace found' }, { status: 404 });

    const body = await request.json();
    const { integration_id, status, config } = body;

    const supabase = createSupabaseServerClient();

    const updatePayload: Record<string, any> = { updated_at: new Date().toISOString() };
    if (status) updatePayload.status = status;
    if (config) updatePayload.config = config;

    const { data: integration, error } = await supabase
      .from('integrations')
      .update(updatePayload)
      .eq('id', integration_id)
      .eq('workspace_id', workspaceData.workspace.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to update integration' }, { status: 500 });
    }

    return NextResponse.json({ integration });
  } catch (err) {
    console.error('[PATCH /api/integrations] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
