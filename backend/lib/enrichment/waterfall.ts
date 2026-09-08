// ============================================================
// ENRICHMENT WATERFALL
// Purpose: Fallback chain for data enrichment (Apollo → Clearbit → ScrapingBee)
// Called by: workflow-executor.ts when processing enrichment nodes
// ============================================================

import { createSupabaseAdminClient } from '@/lib/supabase/server'

interface EnrichmentResult {
  success: boolean
  provider: string
  data: Record<string, any>
  cost: number
  error?: string
}

interface EnrichmentInput {
  email?: string
  domain?: string
  company?: string
  linkedin_url?: string
}

/**
 * Enrichment Waterfall
 * Tries providers in order, falls back on failure
 * 
 * Priority:
 * 1. Apollo (best for email enrichment, $0.01/lookup)
 * 2. Clearbit (best for company data, $0.05/lookup)
 * 3. ScrapingBee (fallback for custom scraping, $0.001/request)
 */
export async function enrichmentWaterfall(
  workspaceId: string,
  input: EnrichmentInput
): Promise<EnrichmentResult> {
  const supabase = createSupabaseAdminClient()

  // Get active integrations for this workspace
  const { data: integrations } = await supabase
    .from('integrations')
    .select('id, provider, vault_key_id')
    .eq('workspace_id', workspaceId)
    .eq('category', 'enrichment')
    .eq('status', 'active')
    .in('provider', ['apollo', 'clearbit', 'scrapingbee'])

  if (!integrations || integrations.length === 0) {
    return {
      success: false,
      provider: 'none',
      data: {},
      cost: 0,
      error: 'No enrichment integrations configured',
    }
  }

  // Build provider map
  const providerMap = new Map(integrations.map(i => [i.provider, i]))

  // Try Apollo first (if available)
  if (providerMap.has('apollo') && input.email) {
    const apolloResult = await tryApollo(providerMap.get('apollo')!, input)
    if (apolloResult.success) {
      return apolloResult
    }
  }

  // Try Clearbit (if available)
  if (providerMap.has('clearbit') && (input.email || input.domain)) {
    const clearbitResult = await tryClearbit(providerMap.get('clearbit')!, input)
    if (clearbitResult.success) {
      return clearbitResult
    }
  }

  // Try ScrapingBee as fallback (if available)
  if (providerMap.has('scrapingbee') && input.linkedin_url) {
    const scrapingBeeResult = await tryScrapingBee(providerMap.get('scrapingbee')!, input)
    if (scrapingBeeResult.success) {
      return scrapingBeeResult
    }
  }

  // All providers failed
  return {
    success: false,
    provider: 'all_failed',
    data: {},
    cost: 0,
    error: 'All enrichment providers failed',
  }
}

/**
 * Apollo.io Enrichment
 * Best for: Email → Person data (name, title, company, phone)
 * Cost: ~$0.01 per lookup
 */
async function tryApollo(
  integration: { id: string; vault_key_id: string },
  input: EnrichmentInput
): Promise<EnrichmentResult> {
  try {
    const apiKey = await getVaultSecret(integration.vault_key_id)

    const response = await fetch('https://api.apollo.io/v1/people/match', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'X-Api-Key': apiKey,
      },
      body: JSON.stringify({
        email: input.email,
      }),
    })

    if (response.status === 429) {
      return {
        success: false,
        provider: 'apollo',
        data: {},
        cost: 0,
        error: 'Rate limited (429)',
      }
    }

    if (!response.ok) {
      return {
        success: false,
        provider: 'apollo',
        data: {},
        cost: 0,
        error: `HTTP ${response.status}`,
      }
    }

    const person = await response.json()

    return {
      success: true,
      provider: 'apollo',
      data: {
        first_name: person.first_name,
        last_name: person.last_name,
        name: person.name,
        title: person.title,
        email: person.email,
        phone: person.phone,
        linkedin_url: person.linkedin_url,
        company_name: person.organization_name,
        company_domain: person.organization_website,
        company_industry: person.organization_industry,
        company_size: person.organization_num_employees,
        location: person.city ? `${person.city}, ${person.state || ''} ${person.country || ''}`.trim() : null,
        seniority: person.seniority,
        departments: person.departments,
      },
      cost: 0.01,
    }
  } catch (error) {
    return {
      success: false,
      provider: 'apollo',
      data: {},
      cost: 0,
      error: error.message,
    }
  }
}

/**
 * Clearbit Enrichment
 * Best for: Email/Domain → Company data (funding, tech stack, industry)
 * Cost: ~$0.05 per lookup
 */
async function tryClearbit(
  integration: { id: string; vault_key_id: string },
  input: EnrichmentInput
): Promise<EnrichmentResult> {
  try {
    const apiKey = await getVaultSecret(integration.vault_key_id)

    let endpoint = ''
    let params = {}

    if (input.email) {
      // Person + Company enrichment
      endpoint = 'https://person.clearbit.com/v2/people/find'
      params = { email: input.email }
    } else if (input.domain) {
      // Company-only enrichment
      endpoint = 'https://company.clearbit.com/v2/companies/find'
      params = { domain: input.domain }
    } else {
      return {
        success: false,
        provider: 'clearbit',
        data: {},
        cost: 0,
        error: 'Email or domain required',
      }
    }

    const url = new URL(endpoint)
    Object.entries(params).forEach(([key, value]) => {
      if (value) url.searchParams.append(key, String(value))
    })

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    })

    if (response.status === 429) {
      return {
        success: false,
        provider: 'clearbit',
        data: {},
        cost: 0,
        error: 'Rate limited (429)',
      }
    }

    if (!response.ok) {
      return {
        success: false,
        provider: 'clearbit',
        data: {},
        cost: 0,
        error: `HTTP ${response.status}`,
      }
    }

    const result = await response.json()

    // Person + Company response
    if (input.email && result.person && result.company) {
      return {
        success: true,
        provider: 'clearbit',
        data: {
          first_name: result.person.firstName,
          last_name: result.person.lastName,
          name: `${result.person.firstName} ${result.person.lastName}`,
          title: result.person.employment?.title,
          email: result.person.email,
          linkedin_url: result.person.linkedin,
          company_name: result.company.name,
          company_domain: result.company.domain,
          company_industry: result.company.category?.industry,
          company_size: result.company.metrics?.employees,
          company_funding: result.company.funding?.total,
          company_tech: result.company.tech,
          company_description: result.company.description,
          location: result.person.location,
        },
        cost: 0.05,
      }
    }

    // Company-only response
    if (input.domain && result.name) {
      return {
        success: true,
        provider: 'clearbit',
        data: {
          company_name: result.name,
          company_domain: result.domain,
          company_industry: result.category?.industry,
          company_size: result.metrics?.employees,
          company_funding: result.funding?.total,
          company_tech: result.tech,
          company_description: result.description,
          company_logo: result.logo,
        },
        cost: 0.05,
      }
    }

    return {
      success: false,
      provider: 'clearbit',
      data: {},
      cost: 0,
      error: 'No data returned',
    }
  } catch (error) {
    return {
      success: false,
      provider: 'clearbit',
      data: {},
      cost: 0,
      error: error.message,
    }
  }
}

/**
 * ScrapingBee Enrichment
 * Best for: Custom scraping (LinkedIn profiles, job boards, etc.)
 * Cost: ~$0.001 per request
 */
async function tryScrapingBee(
  integration: { id: string; vault_key_id: string },
  input: EnrichmentInput
): Promise<EnrichmentResult> {
  try {
    const apiKey = await getVaultSecret(integration.vault_key_id)

    if (!input.linkedin_url) {
      return {
        success: false,
        provider: 'scrapingbee',
        data: {},
        cost: 0,
        error: 'LinkedIn URL required',
      }
    }

    const response = await fetch(
      `https://app.scrapingbee.com/api/v1/?api_key=${apiKey}&url=${encodeURIComponent(input.linkedin_url)}&render_js=false`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    if (response.status === 429) {
      return {
        success: false,
        provider: 'scrapingbee',
        data: {},
        cost: 0,
        error: 'Rate limited (429)',
      }
    }

    if (!response.ok) {
      return {
        success: false,
        provider: 'scrapingbee',
        data: {},
        cost: 0,
        error: `HTTP ${response.status}`,
      }
    }

    const html = await response.text()

    // Basic parsing (in production, use a proper HTML parser)
    // This is a simplified example
    const nameMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/)
    const titleMatch = html.match(/<p[^>]*class="[^"]*title[^"]*"[^>]*>([^<]+)<\/p>/)

    return {
      success: true,
      provider: 'scrapingbee',
      data: {
        raw_html: html.substring(0, 10000), // Limit size
        name: nameMatch ? nameMatch[1].trim() : null,
        title: titleMatch ? titleMatch[1].trim() : null,
        linkedin_url: input.linkedin_url,
      },
      cost: 0.001,
    }
  } catch (error) {
    return {
      success: false,
      provider: 'scrapingbee',
      data: {},
      cost: 0,
      error: error.message,
    }
  }
}

/**
 * Retrieve secret from Supabase Vault
 */
async function getVaultSecret(vaultKeyId: string): Promise<string> {
  const supabase = createSupabaseAdminClient()

  const { data, error } = await supabase.rpc('decrypt_vault_secret', {
    secret_id: vaultKeyId,
  })

  if (error || !data) {
    throw new Error('Failed to retrieve vault secret')
  }

  return data
}
