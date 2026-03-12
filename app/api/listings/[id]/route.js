import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getActiveAgencyForUser, getCurrentUser } from '@/lib/agency';
import { validateListingPayload } from '@/lib/validation';

export async function PATCH(request, { params }) {
  try {
    const routeParams = await params;
    const supabase = await createClient();
    const user = await getCurrentUser(supabase);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const agency = await getActiveAgencyForUser(supabase, user);

    if (!agency || agency.status !== 'active') {
      return NextResponse.json({ error: 'Please verify your email before continuing.' }, { status: 403 });
    }

    const body = await request.json();
    const payload = validateListingPayload(body, { partial: true });
    payload.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from('properties')
      .update(payload)
      .eq('id', routeParams.id)
      .eq('agency_id', agency.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Unexpected error' }, { status: 500 });
  }
}
