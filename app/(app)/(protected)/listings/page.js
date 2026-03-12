import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getActiveAgencyOrRedirect } from '@/lib/agency';

async function getListings(supabase, agencyId) {
  const { data, error } = await supabase
    .from('properties')
    .select('id,title,area,city,price_ngn,is_active,updated_at,property_images(count)')
    .eq('agency_id', agencyId)
    .order('updated_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}

export default async function ListingsPage({ searchParams }) {
  const supabase = await createClient();
  const agency = await getActiveAgencyOrRedirect(supabase);

  const params = await searchParams;
  const rows = await getListings(supabase, agency.id);

  return (
    <div className="grid">
      <div className="actions" style={{ justifyContent: 'space-between' }}>
        <h1>My listings</h1>
        <Link className="btn" href="/listings/new">
          + Create listing
        </Link>
      </div>
      {params?.message ? <p className="alert success">{decodeURIComponent(params.message)}</p> : null}
      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Area</th>
              <th>City</th>
              <th>Price (NGN)</th>
              <th>Status</th>
              <th>Updated</th>
              <th>Images</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="small">
                  No listings yet.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.title}</td>
                  <td>{row.area}</td>
                  <td>{row.city}</td>
                  <td>{Number(row.price_ngn || 0).toLocaleString()}</td>
                  <td>{row.is_active ? 'Active' : 'Inactive'}</td>
                  <td>{new Date(row.updated_at).toLocaleString()}</td>
                  <td>{row.property_images?.[0]?.count ?? 0}</td>
                  <td>
                    <div className="actions">
                      <Link className="btn btn-ghost" href={`/listings/${row.id}/edit`}>
                        Edit
                      </Link>
                      <form method="post" action={`/api/listings/${row.id}/toggle`}>
                        <button className={row.is_active ? 'btn-danger' : ''} type="submit">
                          {row.is_active ? 'Deactivate' : 'Activate'}
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
