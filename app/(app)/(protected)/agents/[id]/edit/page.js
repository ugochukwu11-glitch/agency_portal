import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getActiveAgencyOrRedirect } from '@/lib/agency';

export default async function EditAgentPage({ params, searchParams }) {
  const routeParams = await params;
  const paramsQ = await searchParams;

  const supabase = await createClient();
  const agency = await getActiveAgencyOrRedirect(supabase);

  const { data: agent, error } = await supabase
    .from('agents')
    .select('id,full_name,phone,email,role,is_active')
    .eq('id', routeParams.id)
    .eq('agency_id', agency.id)
    .single();

  if (error || !agent) {
    notFound();
  }

  return (
    <div className="card" style={{ maxWidth: 640, margin: '1rem auto' }}>
      <h1>Edit Agent</h1>
      {paramsQ?.error ? <p className="alert">{decodeURIComponent(paramsQ.error)}</p> : null}

      <form className="grid" method="post" action={`/api/agents/${agent.id}`}>
        <label>
          Full Name
          <input name="full_name" required maxLength={140} defaultValue={agent.full_name} />
        </label>
        <label>
          Phone
          <input name="phone" required maxLength={40} defaultValue={agent.phone} />
        </label>
        <label>
          Email
          <input name="email" type="email" maxLength={140} defaultValue={agent.email || ''} />
        </label>
        <label>
          Role
          <select name="role" defaultValue={agent.role || 'agent'}>
            <option value="agent">agent</option>
            <option value="admin">admin</option>
          </select>
        </label>
        <label>
          Status
          <select name="is_active" defaultValue={String(agent.is_active)}>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </label>

        <div className="actions">
          <button type="submit">Save Changes</button>
          <Link className="btn btn-ghost" href="/agents">
            Back
          </Link>
        </div>
      </form>
    </div>
  );
}
