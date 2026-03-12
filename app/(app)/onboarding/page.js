import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getActiveAgencyForUser, getCurrentUserOrRedirect } from '@/lib/agency';

export default async function OnboardingPage({ searchParams }) {
  const supabase = await createClient();
  const user = await getCurrentUserOrRedirect(supabase);
  const agency = await getActiveAgencyForUser(supabase, user);

  if (!agency || agency.status !== 'active') {
    redirect('/login?message=Verify%20your%20email%20to%20continue.');
  }

  if (agency.onboarding_completed === true) {
    redirect('/listings');
  }

  const params = await searchParams;
  const error = params?.error;

  return (
    <div className="card" style={{ maxWidth: 560, margin: '1rem auto' }}>
      <h1>Agency onboarding</h1>
      <p className="small">Step 1 of 1 - Set up your agency profile</p>
      <p className="small">Signed in as: {user.email || '-'}</p>
      {error ? <p className="alert">{decodeURIComponent(error)}</p> : null}
      <form className="grid" method="post" action="/api/onboarding">
        <label>
          Agency Name
          <input name="name" required minLength={2} maxLength={120} defaultValue={agency.name || ''} />
        </label>
        <label>
          Agency Phone
          <input name="phone" required minLength={7} maxLength={40} defaultValue={agency.phone || ''} />
        </label>
        <label>
          City
          <input name="city" required minLength={2} maxLength={100} defaultValue={agency.city || ''} />
        </label>
        <label>
          Address
          <input name="address" maxLength={240} defaultValue={agency.address || ''} />
        </label>
        <hr style={{ border: 0, borderTop: '1px solid var(--line)', width: '100%' }} />
        <h2 style={{ margin: 0 }}>Primary Agent</h2>
        <label>
          Primary Agent Full Name
          <input name="primary_agent_full_name" required minLength={2} maxLength={140} />
        </label>
        <label>
          Primary Agent Phone
          <input name="primary_agent_phone" required maxLength={40} placeholder="2348012345678" />
        </label>
        <label>
          Primary Agent Email
          <input name="primary_agent_email" type="email" maxLength={140} />
        </label>
        <button type="submit">Save and continue</button>
      </form>
    </div>
  );
}
