// ============================================================
// API ROUTE: LinkedIn Signal Webhook
// Purpose: Receive signals from Chrome extension
// Endpoint: POST /api/signals/linkedin
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { processLinkedInSignal, validateSignal } from '@/lib/signals/linkedin'

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { workspace_id, signal } = body

    if (!workspace_id || !signal) {
      return NextResponse.json(
        { success: false, error: 'Missing workspace_id or signal' },
        { status: 400 }
      )
    }

    // Verify user is a member of this workspace
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspace_id)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json(
        { success: false, error: 'Not a member of this workspace' },
        { status: 403 }
      )
    }

    // Validate signal structure
    if (!validateSignal(signal)) {
      return NextResponse.json(
        { success: false, error: 'Invalid signal structure' },
        { status: 400 }
      )
    }

    // Process the signal
    const result = await processLinkedInSignal(workspace_id, signal)

    return NextResponse.json({
      success: result.success,
      workflows_triggered: result.workflows_triggered,
      error: result.error,
    })
  } catch (error) {
    console.error('LinkedIn signal webhook error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
