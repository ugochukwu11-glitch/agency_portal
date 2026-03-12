import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getActiveAgencyForUser, getCurrentUser } from '@/lib/agency';

export async function POST(request, { params }) {
  try {
    const routeParams = await params;
    const supabase = await createClient();
    const user = await getCurrentUser(supabase);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const agency = await getActiveAgencyForUser(supabase, user);
    if (!agency || agency.status !== 'active') {
      return NextResponse.json({ error: 'Agency not active' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const selectedAgentId = body?.assigned_agent_id || null;

    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('id,phone,assigned_agent_id')
      .eq('id', routeParams.id)
      .eq('agency_id', agency.id)
      .single();

    if (leadError || !lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    if (selectedAgentId) {
      const { error: assignError } = await supabase
        .from('leads')
        .update({ assigned_agent_id: selectedAgentId, updated_at: new Date().toISOString() })
        .eq('id', lead.id)
        .eq('agency_id', agency.id);

      if (assignError) {
        return NextResponse.json({ error: assignError.message }, { status: 400 });
      }
    }

    const handoffAgentId = selectedAgentId || lead.assigned_agent_id || null;
    const now = new Date().toISOString();

    const { error: stateError } = await supabase.from('conversation_state').upsert(
      {
        phone: lead.phone,
        is_human_handoff: true,
        handoff_started_at: now,
        handoff_reason: 'portal_manual',
        handoff_agent_id: handoffAgentId,
        updated_at: now
      },
      { onConflict: 'phone' }
    );

    if (stateError) {
      return NextResponse.json({ error: stateError.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Unexpected error' }, { status: 500 });
  }
}
