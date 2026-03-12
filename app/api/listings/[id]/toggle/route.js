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
    return NextResponse.redirect(new URL('/login?message=Please%20verify%20your%20email%20before%20continuing.', request.url));
  }

  const { data: row, error: fetchError } = await supabase
    .from('properties')
    .select('id,is_active')
    .eq('id', routeParams.id)
    .eq('agency_id', agency.id)
    .single();

  if (fetchError || !row) {
    return NextResponse.redirect(new URL('/listings?message=Listing%20not%20found', request.url));
  }

  const { error } = await supabase
    .from('properties')
    .update({ is_active: !row.is_active, updated_at: new Date().toISOString() })
    .eq('id', row.id)
    .eq('agency_id', agency.id);

  if (error) {
    return NextResponse.redirect(new URL(`/listings?message=${encodeURIComponent(error.message)}`, request.url));
  }

  return NextResponse.redirect(new URL('/listings?message=Listing%20updated', request.url));
}
