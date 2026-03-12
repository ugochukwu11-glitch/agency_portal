import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getActiveAgencyForUser, getCurrentUser } from '@/lib/agency';

export async function POST(request, { params }) {
  const routeParams = await params;
  const supabase = await createClient();
  const user = await getCurrentUser(supabase);
  if (!user) {
    return NextResponse.redirect(new URL('/login?error=Please%20log%20in', request.url));
  }

  const agency = await getActiveAgencyForUser(supabase, user);
  if (!agency || agency.status !== 'active') {
    return NextResponse.redirect(new URL('/login?message=Verify%20your%20email%20to%20continue.', request.url));
  }

  const { data: agent, error: fetchError } = await supabase
    .from('agents')
    .select('id,is_active')
    .eq('id', routeParams.id)
    .eq('agency_id', agency.id)
    .single();

  if (fetchError || !agent) {
    return NextResponse.redirect(new URL('/agents?error=Agent%20not%20found', request.url));
  }

  const { error } = await supabase
    .from('agents')
    .update({ is_active: !agent.is_active })
    .eq('id', agent.id)
    .eq('agency_id', agency.id);

  if (error) {
    return NextResponse.redirect(new URL(`/agents?error=${encodeURIComponent(error.message)}`, request.url));
  }

  return NextResponse.redirect(new URL('/agents?message=Agent%20status%20updated', request.url));
}
