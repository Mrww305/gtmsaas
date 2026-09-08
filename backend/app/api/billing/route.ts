// ============================================================
// API ROUTE: Billing
// Purpose: Create checkout sessions, billing portal, check limits
// Endpoint: POST /api/billing/checkout, GET /api/billing/portal, GET /api/billing/limits
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import {
  createCheckoutSession,
  getBillingPortalUrl,
  checkUsageLimits,
  createStripeCustomer,
  PRICES,
} from '@/lib/stripe'

/**
 * POST /api/billing/checkout
 * Create a Stripe Checkout session for subscription
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { workspace_id, plan } = await request.json()

    if (!workspace_id || !plan) {
      return NextResponse.json(
        { success: false, error: 'Missing workspace_id or plan' },
        { status: 400 }
      )
    }

    // Get workspace
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('stripe_customer_id, plan')
      .eq('id', workspace_id)
      .single()

    if (!workspace) {
      return NextResponse.json(
        { success: false, error: 'Workspace not found' },
        { status: 404 }
      )
    }

    // Determine price ID
    const priceId = plan === 'starter' ? PRICES.STARTER : PRICES.GROWTH

    // Create Stripe customer if doesn't exist
    let customerId = workspace.stripe_customer_id
    if (!customerId) {
      customerId = await createStripeCustomer(user.id, user.email!, workspace.name)

      await supabase
        .from('workspaces')
        .update({ stripe_customer_id: customerId })
        .eq('id', workspace_id)
    }

    // Create checkout session
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const checkoutUrl = await createCheckoutSession(
      customerId,
      priceId,
      workspace_id,
      `${baseUrl}/billing/success?workspace_id=${workspace_id}`,
      `${baseUrl}/billing?workspace_id=${workspace_id}`
    )

    return NextResponse.json({
      success: true,
      checkout_url: checkoutUrl,
    })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/billing/portal
 * Get Stripe Billing Portal URL
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspace_id')

    if (!workspaceId) {
      return NextResponse.json(
        { success: false, error: 'Missing workspace_id' },
        { status: 400 }
      )
    }

    // Get workspace
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('stripe_customer_id')
      .eq('id', workspaceId)
      .single()

    if (!workspace || !workspace.stripe_customer_id) {
      return NextResponse.json(
        { success: false, error: 'No billing account found' },
        { status: 404 }
      )
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const portalUrl = await getBillingPortalUrl(
      workspace.stripe_customer_id,
      `${baseUrl}/billing?workspace_id=${workspaceId}`
    )

    return NextResponse.json({
      success: true,
      portal_url: portalUrl,
    })
  } catch (error) {
    console.error('Portal error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create portal session' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/billing/limits
 * Check current usage and limits
 */
export async function GET_LIMITS(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspace_id')

    if (!workspaceId) {
      return NextResponse.json(
        { success: false, error: 'Missing workspace_id' },
        { status: 400 }
      )
    }

    // Get workspace usage
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('plan, monthly_enrichment_count, monthly_enrichment_limit, monthly_workflow_runs, monthly_workflow_run_limit')
      .eq('id', workspaceId)
      .single()

    if (!workspace) {
      return NextResponse.json(
        { success: false, error: 'Workspace not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      usage: {
        plan: workspace.plan,
        enrichments: {
          used: workspace.monthly_enrichment_count,
          limit: workspace.monthly_enrichment_limit,
          percentage: workspace.monthly_enrichment_limit > 0
            ? (workspace.monthly_enrichment_count / workspace.monthly_enrichment_limit) * 100
            : 0,
        },
        workflow_runs: {
          used: workspace.monthly_workflow_runs,
          limit: workspace.monthly_workflow_run_limit,
          percentage: workspace.monthly_workflow_run_limit > 0
            ? (workspace.monthly_workflow_runs / workspace.monthly_workflow_run_limit) * 100
            : 0,
        },
      },
    })
  } catch (error) {
    console.error('Limits error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch usage limits' },
      { status: 500 }
    )
  }
}
