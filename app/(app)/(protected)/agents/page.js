import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getActiveAgencyOrRedirect } from '@/lib/agency';

export default async function AgentsPage({ searchParams }) {
  const supabase = await createClient();
  const agency = await getActiveAgencyOrRedirect(supabase);

  const { data: agents, error } = await supabase
    .from('agents')
    .select('id,full_name,phone,email,role,is_active,created_at')
    .eq('agency_id', agency.id)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const params = await searchParams;

  return (
    <div className="grid">
      <div className="actions" style={{ justifyContent: 'space-between' }}>
        <h1>Agents</h1>
        <Link className="btn" href="/agents/new">
          + Add Agent
        </Link>
      </div>

      {params?.message ? <p className="alert success">{decodeURIComponent(params.message)}</p> : null}
      {params?.error ? <p className="alert">{decodeURIComponent(params.error)}</p> : null}

      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {!agents?.length ? (
              <tr>
                <td colSpan={6} className="small">
                  No agents yet.
                </td>
              </tr>
            ) : (
              agents.map((agent) => (
                <tr key={agent.id}>
                  <td>{agent.full_name}</td>
                  <td>{agent.phone}</td>
                  <td>{agent.email || '-'}</td>
                  <td>{agent.role}</td>
                  <td>{agent.is_active ? 'Active' : 'Inactive'}</td>
                  <td>
                    <div className="actions">
                      <Link className="btn btn-ghost" href={`/agents/${agent.id}/edit`}>
                        Edit
                      </Link>
                      <form method="post" action={`/api/agents/${agent.id}/toggle`}>
                        <button className={agent.is_active ? 'btn-danger' : ''} type="submit">
                          {agent.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
