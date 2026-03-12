import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getActiveAgencyOrRedirect } from '@/lib/agency';

export default async function NewAgentPage({ searchParams }) {
  const supabase = await createClient();
  await getActiveAgencyOrRedirect(supabase);

  const params = await searchParams;

  return (
    <div className="card" style={{ maxWidth: 640, margin: '1rem auto' }}>
      <h1>Add Agent</h1>
      <p className="small">Create an owner-managed agent profile (no separate agent login).</p>
      {params?.error ? <p className="alert">{decodeURIComponent(params.error)}</p> : null}

      <form className="grid" method="post" action="/api/agents">
        <label>
          Full Name
          <input name="full_name" required maxLength={140} />
        </label>
        <label>
          Phone
          <input name="phone" required maxLength={40} placeholder="2348012345678" />
        </label>
        <label>
          Email
          <input name="email" type="email" maxLength={140} />
        </label>
        <label>
          Role
          <select name="role" defaultValue="agent">
            <option value="agent">agent</option>
            <option value="admin">admin</option>
          </select>
        </label>
        <label>
          Status
          <select name="is_active" defaultValue="true">
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </label>
        <div className="actions">
          <button type="submit">Save Agent</button>
          <Link className="btn btn-ghost" href="/agents">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
