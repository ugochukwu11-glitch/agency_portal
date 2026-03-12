import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getActiveAgencyForUser, getCurrentUserOrRedirect } from '@/lib/agency';

export const dynamic = 'force-dynamic';

export default async function ProtectedLayout({ children }) {
  const supabase = await createClient();
  const user = await getCurrentUserOrRedirect(supabase);
  const agency = await getActiveAgencyForUser(supabase, user);

  if (!agency || agency.status !== 'active') {
    redirect('/login?message=Verify%20your%20email%20to%20continue.');
  }

  if (agency.onboarding_completed !== true) {
    redirect('/onboarding');
  }

  return children;
}
