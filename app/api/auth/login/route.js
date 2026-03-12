import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPostAuthRedirect, updateAgencyNameIfPlaceholder } from '@/lib/agency';

export async function POST(request) {
  const contentType = request.headers.get('content-type') || '';
  let email = '';
  let password = '';
  let agencyNameFallback = '';

  if (contentType.includes('application/json')) {
    const body = await request.json();
    email = String(body.email || '').trim();
    password = String(body.password || '');
    agencyNameFallback = String(body.agency_name_fallback || '').trim();
  } else {
    const formData = await request.formData();
    email = String(formData.get('email') || '').trim();
    password = String(formData.get('password') || '');
    agencyNameFallback = String(formData.get('agency_name_fallback') || '').trim();
  }

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  let usedAgencyNameFallback = false;
  const agencyNameFromMetadata = String(data.user?.user_metadata?.agency_name || '').trim();
  const agencyNameCandidate = agencyNameFallback || agencyNameFromMetadata;

  if (agencyNameCandidate) {
    const updateResult = await updateAgencyNameIfPlaceholder(supabase, agencyNameCandidate, email);
    usedAgencyNameFallback = updateResult.updated;
  }

  const redirectPath = await getPostAuthRedirect(supabase, data.user);
  return NextResponse.json({
    ok: true,
    redirectTo: redirectPath,
    usedAgencyNameFallback
  });
}
