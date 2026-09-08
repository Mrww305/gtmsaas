// ============================================================
// STRIPE BILLING INTEGRATION
// Purpose: Handle Stripe webhooks, customer creation, usage metering
// ============================================================

import Stripe from 'stripe'
import { createSupabaseAdminClient } from '@/lib/supabase/server'

// Initialize Stripe client
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
})

// Price IDs (from Stripe dashboard)
export const PRICES = {
  STARTER: process.env.STRIPE_PRICE_STARTER!, // $249/mo
  GROWTH: process.env.STRIPE_PRICE_GROWTH!,   // $749/mo
}

// Usage limits per plan
export const USAGE_LIMITS = {
  starter: {
    enrichments: 10000,
    workflow_runs: 1000,
  },
  growth: {
    enrichments: 100000,
    workflow_runs: 10000,
  },
  enterprise: {
    enrichments: -1, // unlimited
    workflow_runs: -1, // unlimited
  },
}

/**
 * Create Stripe Customer
 * Called when user creates their first workspace
 */
export async function createStripeCustomer(
  userId: string,
  email: string,
  workspaceName: string
): Promise<string> {
  const customer = await stripe.customers.create({
    email,
    metadata: {
      userId,
      workspaceName,
    },
  })

  return customer.id
}

/**
 * Create Subscription
 * Called when user selects a plan
 */
export async function createSubscription(
  customerId: string,
  priceId: string,
  workspaceId: string
): Promise<string> {
  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    payment_behavior: 'default_incomplete',
    payment_settings: { save_default_payment_method: 'on_subscription' },
    expand: ['latest_invoice.payment_intent'],
    metadata: {
      workspaceId,
    },
  })

  return subscription.id
}

/**
 * Get Plan from Price ID
 */
export function getPlanFromPriceId(priceId: string): 'starter' | 'growth' {
  if (priceId === PRICES.STARTER) return 'starter'
  if (priceId === PRICES.GROWTH) return 'growth'
  throw new Error(`Unknown price ID: ${priceId}`)
}

/**
 * Handle Stripe Webhook Events
 */
export async function handleStripeWebhook(event: Stripe.Event) {
  const supabase = createSupabaseAdminClient()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session

      if (session.subscription && session.metadata?.workspaceId) {
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        )

        const priceId = subscription.items.data[0].price.id
        const plan = getPlanFromPriceId(priceId)
        const limits = USAGE_LIMITS[plan]

        // Update workspace with Stripe IDs and limits
        await supabase
          .from('workspaces')
          .update({
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: subscription.id,
            plan,
            monthly_enrichment_limit: limits.enrichments,
            monthly_workflow_run_limit: limits.workflow_runs,
            billing_cycle_start: new Date(subscription.current_period_start * 1000).toISOString(),
          })
          .eq('id', session.metadata.workspaceId)
      }
      break
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription

      if (subscription.metadata?.workspaceId) {
        const priceId = subscription.items.data[0].price.id
        const plan = getPlanFromPriceId(priceId)
        const limits = USAGE_LIMITS[plan]

        await supabase
          .from('workspaces')
          .update({
            plan,
            monthly_enrichment_limit: limits.enrichments,
            monthly_workflow_run_limit: limits.workflow_runs,
          })
          .eq('id', subscription.metadata.workspaceId)
      }
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription

      if (subscription.metadata?.workspaceId) {
        // Subscription cancelled - downgrade to free tier or disable
        await supabase
          .from('workspaces')
          .update({
            plan: 'cancelled',
            monthly_enrichment_limit: 0,
            monthly_workflow_run_limit: 0,
          })
          .eq('id', subscription.metadata.workspaceId)
      }
      break
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice

      if (invoice.subscription) {
        const subscription = await stripe.subscriptions.retrieve(
          invoice.subscription as string
        )

        if (subscription.metadata?.workspaceId) {
          // Reset usage counters for new billing cycle
          await supabase
            .from('workspaces')
            .update({
              monthly_enrichment_count: 0,
              monthly_workflow_runs: 0,
              billing_cycle_start: new Date().toISOString(),
            })
            .eq('id', subscription.metadata.workspaceId)
        }
      }
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice

      console.error('Payment failed for invoice:', invoice.id)
      // Could send email notification here
      break
    }

    default:
      console.log(`Unhandled Stripe event type: ${event.type}`)
  }
}

/**
 * Create Checkout Session
 * Called from frontend when user clicks "Upgrade"
 */
export async function createCheckoutSession(
  customerId: string,
  priceId: string,
  workspaceId: string,
  successUrl: string,
  cancelUrl: string
): Promise<string> {
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      workspaceId,
    },
  })

  return session.url!
}

/**
 * Get Billing Portal URL
 * Called when user wants to manage their subscription
 */
export async function getBillingPortalUrl(
  customerId: string,
  returnUrl: string
): Promise<string> {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })

  return session.url
}

/**
 * Check Usage Limits
 * Called before executing workflows to ensure user hasn't exceeded limits
 */
export async function checkUsageLimits(
  workspaceId: string
): Promise<{ allowed: boolean; reason?: string }> {
  const supabase = createSupabaseAdminClient()

  const { data: workspace } = await supabase
    .from('workspaces')
    .select('plan, monthly_enrichment_count, monthly_enrichment_limit, monthly_workflow_runs, monthly_workflow_run_limit')
    .eq('id', workspaceId)
    .single()

  if (!workspace) {
    return { allowed: false, reason: 'Workspace not found' }
  }

  // Enterprise plan has unlimited usage
  if (workspace.plan === 'enterprise') {
    return { allowed: true }
  }

  // Check enrichment limit
  if (workspace.monthly_enrichment_count >= workspace.monthly_enrichment_limit) {
    return {
      allowed: false,
      reason: `Enrichment limit reached (${workspace.monthly_enrichment_count}/${workspace.monthly_enrichment_limit})`,
    }
  }

  // Check workflow run limit
  if (workspace.monthly_workflow_runs >= workspace.monthly_workflow_run_limit) {
    return {
      allowed: false,
      reason: `Workflow run limit reached (${workspace.monthly_workflow_runs}/${workspace.monthly_workflow_run_limit})`,
    }
  }

  return { allowed: true }
}
