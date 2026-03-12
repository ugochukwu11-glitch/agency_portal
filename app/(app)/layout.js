import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getActiveAgencyForUser, getCurrentUserOrRedirect } from '@/lib/agency';
import LogoutButton from '@/components/logout-button';

export const dynamic = 'force-dynamic';

export default async function AppLayout({ children }) {
  const supabase = await createClient();
  const user = await getCurrentUserOrRedirect(supabase);
  const agency = await getActiveAgencyForUser(supabase, user);

  // Defensive guard: verified login should activate agency, but pending is blocked here.
  if (!agency || agency.status === 'pending') {
    return (
      <div className="card" style={{ maxWidth: 640, margin: '1rem auto' }}>
        <h1>Verification required</h1>
        <p className="small">Verify your email to continue.</p>
        <div className="actions">
          <Link className="btn" href="/login">
            Back to login
          </Link>
          <LogoutButton className="btn btn-ghost" label="Logout" />
        </div>
      </div>
    );
  }

  return children;
}
