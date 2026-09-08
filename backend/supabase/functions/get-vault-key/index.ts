// ============================================================
// EDGE FUNCTION: get-vault-key
// Purpose: Securely retrieve BYO API keys from Supabase Vault
// Called by: BullMQ workers when executing nodes that need API keys
// ============================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { integration_id, workspace_id } = await req.json()

    if (!integration_id || !workspace_id) {
      throw new Error('Missing integration_id or workspace_id')
    }

    // Verify the integration belongs to this workspace
    const { data: integration, error } = await supabaseAdmin
      .from('integrations')
      .select('vault_key_id, provider, status')
      .eq('id', integration_id)
      .eq('workspace_id', workspace_id)
      .single()

    if (error || !integration) {
      throw new Error('Integration not found')
    }

    if (integration.status !== 'active') {
      throw new Error(`Integration is ${integration.status}`)
    }

    // Retrieve the decrypted secret from Vault
    const { data: vaultData, error: vaultError } = await supabaseAdmin.rpc(
      'decrypt_vault_secret',
      { secret_id: integration.vault_key_id }
    )

    if (vaultError || !vaultData) {
      throw new Error('Failed to retrieve vault secret')
    }

    // Return the API key (only to authenticated workers)
    return new Response(
      JSON.stringify({
        success: true,
        provider: integration.provider,
        api_key: vaultData,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
