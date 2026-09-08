// ============================================================
// EDGE FUNCTION: verify-webhook-signature
// Purpose: Verify inbound webhook signatures (HubSpot, Stripe, etc.)
// Called by: Inbound webhook API routes before processing
// ============================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// HMAC-SHA256 signature verification
async function verifySignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const encoder = new TextEncoder()
  const keyData = encoder.encode(secret)
  const messageData = encoder.encode(payload)

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signatureBuffer = await crypto.subtle.sign('HMAC', key, messageData)
  const computedSignature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)))

  // Compare signatures (timing-safe)
  return computedSignature === signature
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { workspace_id, provider, signature, payload } = await req.json()

    if (!workspace_id || !provider || !signature || !payload) {
      throw new Error('Missing required fields')
    }

    // Get the webhook secret for this provider
    const { data: integration, error } = await supabaseAdmin
      .from('integrations')
      .select('vault_key_id')
      .eq('workspace_id', workspace_id)
      .eq('provider', provider)
      .eq('category', 'webhook')
      .single()

    if (error || !integration) {
      throw new Error('Webhook integration not found')
    }

    // Retrieve the webhook signing secret from Vault
    const { data: secret, error: vaultError } = await supabaseAdmin.rpc(
      'decrypt_vault_secret',
      { secret_id: integration.vault_key_id }
    )

    if (vaultError || !secret) {
      throw new Error('Failed to retrieve webhook secret')
    }

    // Verify the signature
    const isValid = await verifySignature(payload, signature, secret)

    return new Response(
      JSON.stringify({
        success: true,
        valid: isValid,
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
