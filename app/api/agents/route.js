import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getActiveAgencyForUser, getCurrentUser } from '@/lib/agency';
import { normalizePhone } from '@/lib/phone';

function parseRole(value) {
  return value === 'admin' ? 'admin' : 'agent';
}

function parseIsActive(value) {
  return value === 'true' || value === 'on' || value === true;
}

export async function POST(request) {
  const supabase = await createClient();
  const user = await getCurrentUser(supabase);
  if (!user) {
    return NextResponse.redirect(new URL('/login?error=Please%20log%20in', request.url));
  }

  const agency = await getActiveAgencyForUser(supabase, user);
  if (!agency || agency.status !== 'active') {
    return NextResponse.redirect(new URL('/login?message=Verify%20your%20email%20to%20continue.', request.url));
  }

  const formData = await request.formData();
  const fullName = String(formData.get('full_name') || '').trim();
  const phone = normalizePhone(formData.get('phone'));
  const emailRaw = String(formData.get('email') || '').trim();
  const role = parseRole(String(formData.get('role') || 'agent'));
  const isActive = parseIsActive(formData.get('is_active'));

  if (!fullName) {
    return NextResponse.redirect(new URL('/agents/new?error=Full%20name%20is%20required', request.url));
  }
  if (!phone) {
    return NextResponse.redirect(new URL('/agents/new?error=Phone%20is%20required', request.url));
  }

  const { error } = await supabase.from('agents').insert({
    agency_id: agency.id,
    full_name: fullName,
    phone,
    email: emailRaw || null,
    role,
    is_active: isActive
  });

  if (error) {
    if (error.code === '23505') {
      return NextResponse.redirect(new URL('/agents/new?error=Phone%20already%20exists%20for%20this%20agency', request.url));
    }
    return NextResponse.redirect(new URL(`/agents/new?error=${encodeURIComponent(error.message)}`, request.url));
  }

  return NextResponse.redirect(new URL('/agents?message=Agent%20created', request.url));
}
