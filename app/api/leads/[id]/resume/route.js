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

    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('id,phone')
      .eq('id', routeParams.id)
      .eq('agency_id', agency.id)
      .single();

    if (leadError || !lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const { error: stateError } = await supabase
      .from('conversation_state')
      .update({
        is_human_handoff: false,
        handoff_reason: null,
        updated_at: new Date().toISOString()
      })
      .eq('phone', lead.phone);

    if (stateError) {
      return NextResponse.json({ error: stateError.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Unexpected error' }, { status: 500 });
  }
}
