import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getActiveAgencyForUser, getCurrentUser, isAgencyNamePlaceholder } from '@/lib/agency';
import { normalizePhone } from '@/lib/phone';

export async function POST(request) {
  const supabase = await createClient();
  const user = await getCurrentUser(supabase);
  if (!user) {
    return NextResponse.redirect(new URL('/login?error=Please%20log%20in', request.url));
  }

  const agency = await getActiveAgencyForUser(supabase, user);
  if (!agency || agency.status !== 'active') {
    return NextResponse.redirect(new URL('/login?message=Please%20verify%20your%20email%20before%20continuing.', request.url));
  }

  const formData = await request.formData();
  const name = String(formData.get('name') || '').trim();
  const phone = String(formData.get('phone') || '').trim();
  const city = String(formData.get('city') || '').trim();
  const address = String(formData.get('address') || '').trim();
  const primaryAgentFullName = String(formData.get('primary_agent_full_name') || '').trim();
  const primaryAgentPhone = normalizePhone(formData.get('primary_agent_phone'));
  const primaryAgentEmail = String(formData.get('primary_agent_email') || '').trim();

  if (!name || isAgencyNamePlaceholder(name)) {
    return NextResponse.redirect(new URL('/onboarding?error=Please%20enter%20a%20valid%20agency%20name', request.url));
  }
  if (!phone) {
    return NextResponse.redirect(new URL('/onboarding?error=Phone%20is%20required', request.url));
  }
  if (!city) {
    return NextResponse.redirect(new URL('/onboarding?error=City%20is%20required', request.url));
  }
  if (!primaryAgentFullName) {
    return NextResponse.redirect(new URL('/onboarding?error=Primary%20agent%20name%20is%20required', request.url));
  }
  if (!primaryAgentPhone) {
    return NextResponse.redirect(new URL('/onboarding?error=Primary%20agent%20phone%20is%20required', request.url));
  }

  const { error } = await supabase
    .from('agencies')
    .update({
      name,
      phone,
      city,
      address: address || null,
      onboarding_completed: true,
      onboarding_completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', agency.id);

  if (error) {
    return NextResponse.redirect(new URL(`/onboarding?error=${encodeURIComponent(error.message)}`, request.url));
  }

  const { count, error: countError } = await supabase
    .from('agents')
    .select('*', { count: 'exact', head: true })
    .eq('agency_id', agency.id);

  if (countError) {
    return NextResponse.redirect(new URL(`/onboarding?error=${encodeURIComponent(countError.message)}`, request.url));
  }

  if ((count || 0) === 0) {
    const { error: agentError } = await supabase.from('agents').insert({
      agency_id: agency.id,
      full_name: primaryAgentFullName,
      phone: primaryAgentPhone,
      email: primaryAgentEmail || null,
      role: 'admin',
      is_active: true
    });

    if (agentError) {
      return NextResponse.redirect(new URL(`/onboarding?error=${encodeURIComponent(agentError.message)}`, request.url));
    }
  }

  return NextResponse.redirect(new URL('/listings', request.url));
}
