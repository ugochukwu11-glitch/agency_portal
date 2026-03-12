import { redirect } from 'next/navigation';

export function isAgencyNamePlaceholder(name) {
  if (!name) return true;
  const trimmed = name.trim();
  if (!trimmed) return true;
  const normalized = trimmed.toLowerCase();
  return /placeholder/i.test(trimmed) || normalized === 'new agency';
}

function emailLocalPart(email) {
  if (typeof email !== 'string') return '';
  const at = email.indexOf('@');
  if (at <= 0) return '';
  return email.slice(0, at).trim().toLowerCase();
}

export function isAgencyNameDerivedFromEmail(name, email) {
  const trimmed = typeof name === 'string' ? name.trim().toLowerCase() : '';
  const local = emailLocalPart(email);
  if (!trimmed || !local) return false;
  return trimmed === local;
}

export async function getCurrentAgency(supabase) {
  const { data, error } = await supabase
    .from('agencies')
    .select('id,name,status,phone,city,address,onboarding_completed,onboarding_completed_at')
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load agency: ${error.message}`);
  }

  return data;
}

export async function loadAgency(supabase) {
  return getCurrentAgency(supabase);
}

export async function updateAgencyNameIfPlaceholder(supabase, agencyName, userEmail = '') {
  const trimmedName = typeof agencyName === 'string' ? agencyName.trim() : '';
  if (!trimmedName) {
    return { updated: false, agency: await getCurrentAgency(supabase) };
  }

  const agency = await getCurrentAgency(supabase);
  const shouldReplaceName =
    agency && (isAgencyNamePlaceholder(agency.name) || isAgencyNameDerivedFromEmail(agency.name, userEmail));

  if (!shouldReplaceName) {
    return { updated: false, agency };
  }

  const { data, error } = await supabase
    .from('agencies')
    .update({ name: trimmedName, updated_at: new Date().toISOString() })
    .eq('id', agency.id)
    .select('id,name,status,phone,city,address,onboarding_completed,onboarding_completed_at')
    .single();

  if (error) {
    throw new Error(`Failed to update agency name: ${error.message}`);
  }

  return { updated: true, agency: data };
}

export async function getCurrentUserOrRedirect(supabase) {
  const user = await getCurrentUser(supabase);

  if (!user) {
    redirect('/login');
  }

  return user;
}

export async function requireSession(supabase) {
  return getCurrentUserOrRedirect(supabase);
}

export async function getCurrentUser(supabase) {
  const {
    data: { user }
  } = await supabase.auth.getUser();

  return user;
}

export async function getActiveAgencyOrRedirect(supabase) {
  const user = await getCurrentUserOrRedirect(supabase);
  const agency = await getActiveAgencyForUser(supabase, user);

  if (!agency || agency.status !== 'active') {
    redirect('/login?message=Please%20verify%20your%20email%20before%20continuing.');
  }

  return agency;
}

// Agencies are created as `pending` at signup. We only activate after
// the user has verified email and completed a successful login.
export async function ensureAgencyActiveForVerifiedUser(supabase, user, agency) {
  if (!agency || agency.status !== 'pending') {
    return agency;
  }

  if (!user?.email_confirmed_at) {
    return agency;
  }

  const { data, error } = await supabase
    .from('agencies')
    .update({ status: 'active', updated_at: new Date().toISOString() })
    .eq('id', agency.id)
    .eq('status', 'pending')
    .select('id,name,status,phone,city,address,onboarding_completed,onboarding_completed_at')
    .single();

  if (error) {
    throw new Error(`Failed to activate agency: ${error.message}`);
  }

  return data;
}

export async function getActiveAgencyForUser(supabase, user) {
  let agency = await getCurrentAgency(supabase);
  agency = await ensureAgencyActiveForVerifiedUser(supabase, user, agency);
  return agency;
}

export async function getPostAuthRedirect(supabase, userFromCaller = null) {
  const user = userFromCaller || (await getCurrentUser(supabase));
  const agency = await getActiveAgencyForUser(supabase, user);

  if (!agency || agency.status !== 'active') {
    return '/login?message=Please%20verify%20your%20email%20before%20continuing.';
  }

  if (!agency || agency.onboarding_completed !== true || isAgencyNamePlaceholder(agency.name)) {
    return '/onboarding';
  }

  return '/listings';
}
