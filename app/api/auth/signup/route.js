import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPostAuthRedirect, updateAgencyNameIfPlaceholder } from '@/lib/agency';

export async function POST(request) {
  const contentType = request.headers.get('content-type') || '';
  let email = '';
  let password = '';
  let agencyName = '';

  if (contentType.includes('application/json')) {
    const body = await request.json();
    email = String(body.email || '').trim();
    password = String(body.password || '');
    agencyName = String(body.agency_name || '').trim();
  } else {
    const formData = await request.formData();
    email = String(formData.get('email') || '').trim();
    password = String(formData.get('password') || '');
    agencyName = String(formData.get('agency_name') || '').trim();
  }

  if (!agencyName || !email || !password) {
    return NextResponse.json({ error: 'Agency name, email, and password are required.' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        agency_name: agencyName
      }
    }
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  let agencyNameStored = false;
  if (!data.session) {
    return NextResponse.json({
      ok: true,
      requiresEmailVerification: true,
      agencyNameStored,
      message: 'Account created. Check your email to verify before logging in.'
    });
  }

  const agencyNameUpdate = await updateAgencyNameIfPlaceholder(supabase, agencyName, email);
  agencyNameStored = agencyNameUpdate.updated;

  const redirectPath = await getPostAuthRedirect(supabase, data.user);
  return NextResponse.json({
    ok: true,
    requiresEmailVerification: false,
    agencyNameStored,
    redirectTo: redirectPath
  });
}
