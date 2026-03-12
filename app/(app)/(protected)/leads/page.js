import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getActiveAgencyOrRedirect } from '@/lib/agency';
import LeadHandoffControls from '@/components/lead-handoff-controls';

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString();
}

function tempBand(score) {
  const n = Number(score ?? 0);
  if (n >= 80) return 'hot';
  if (n >= 50) return 'warm';
  return 'cold';
}

export default async function LeadsPage({ searchParams }) {
  const supabase = await createClient();
  const agency = await getActiveAgencyOrRedirect(supabase);
  const params = await searchParams;

  const { data: leads, error: leadsError } = await supabase
    .from('leads')
    .select('id,agency_id,assigned_agent_id,phone,name,location_interest,budget,property_type,stage,lead_score,updated_at')
    .eq('agency_id', agency.id)
    .order('updated_at', { ascending: false });

  if (leadsError) throw new Error(leadsError.message);

  const { data: agents, error: agentError } = await supabase
    .from('agents')
    .select('id,full_name,role,is_active')
    .eq('agency_id', agency.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (agentError) throw new Error(agentError.message);

  const phones = [...new Set((leads || []).map((x) => x.phone).filter(Boolean))];
  const { data: states, error: stateError } = phones.length
    ? await supabase
        .from('conversation_state')
        .select(
          'phone,state,last_message,updated_at,selected_property_id,is_human_handoff,handoff_started_at,handoff_agent_id,handoff_reason,last_inbound_at'
        )
        .in('phone', phones)
    : { data: [], error: null };

  if (stateError) throw new Error(stateError.message);

  const stateByPhone = new Map((states || []).map((s) => [s.phone, s]));
  const agentById = new Map((agents || []).map((a) => [a.id, a]));

  let rows = (leads || []).map((lead) => {
    const state = stateByPhone.get(lead.phone);
    const assignedAgent = lead.assigned_agent_id ? agentById.get(lead.assigned_agent_id) : null;
    const band = tempBand(lead.lead_score);
    return {
      ...lead,
      botStatus: state?.is_human_handoff ? 'Human Handling' : 'Bot Active',
      isHumanHandling: Boolean(state?.is_human_handoff),
      assignedAgentName: assignedAgent?.full_name || '-',
      tempBand: band
    };
  });

  const filterBot = params?.bot || 'all';
  const filterTemp = params?.temp || 'all';
  const filterAssign = params?.assignment || 'all';

  rows = rows.filter((row) => {
    const botOk =
      filterBot === 'all' ||
      (filterBot === 'active' && !row.isHumanHandling) ||
      (filterBot === 'human' && row.isHumanHandling);

    const tempOk = filterTemp === 'all' || row.tempBand === filterTemp;

    const assignOk =
      filterAssign === 'all' ||
      (filterAssign === 'assigned' && Boolean(row.assigned_agent_id)) ||
      (filterAssign === 'unassigned' && !row.assigned_agent_id);

    return botOk && tempOk && assignOk;
  });

  return (
    <div className="grid">
      <div className="actions" style={{ justifyContent: 'space-between' }}>
        <h1>Leads</h1>
      </div>

      <form className="card actions" method="get" action="/leads">
        <label>
          Bot Status
          <select name="bot" defaultValue={filterBot}>
            <option value="all">All</option>
            <option value="active">Bot Active</option>
            <option value="human">Human Handling</option>
          </select>
        </label>
        <label>
          Temperature
          <select name="temp" defaultValue={filterTemp}>
            <option value="all">All</option>
            <option value="hot">Hot</option>
            <option value="warm">Warm</option>
            <option value="cold">Cold</option>
          </select>
        </label>
        <label>
          Assignment
          <select name="assignment" defaultValue={filterAssign}>
            <option value="all">All</option>
            <option value="assigned">Assigned</option>
            <option value="unassigned">Unassigned</option>
          </select>
        </label>
        <button type="submit">Apply</button>
      </form>

      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Phone</th>
              <th>Location</th>
              <th>Budget</th>
              <th>Property Type</th>
              <th>Score</th>
              <th>Stage</th>
              <th>Assigned Agent</th>
              <th>Bot Status</th>
              <th>Last Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {!rows.length ? (
              <tr>
                <td colSpan={10} className="small">
                  No leads found.
                </td>
              </tr>
            ) : (
              rows.map((lead) => (
                <tr key={lead.id}>
                  <td>{lead.phone}</td>
                  <td>{lead.location_interest || '-'}</td>
                  <td>{lead.budget || '-'}</td>
                  <td>{lead.property_type || '-'}</td>
                  <td>
                    <span className={`badge badge-${lead.tempBand}`}>{lead.lead_score ?? 0}</span>
                  </td>
                  <td>
                    <span className="badge">{lead.stage || '-'}</span>
                  </td>
                  <td>{lead.assignedAgentName}</td>
                  <td>
                    <span className={`badge ${lead.isHumanHandling ? 'badge-danger' : 'badge-ok'}`}>{lead.botStatus}</span>
                  </td>
                  <td>{formatDate(lead.updated_at)}</td>
                  <td>
                    <div className="grid" style={{ gap: '0.5rem' }}>
                      <Link className="btn btn-ghost" href={`/leads/${lead.id}`}>
                        View
                      </Link>
                      <LeadHandoffControls
                        leadId={lead.id}
                        isHumanHandling={lead.isHumanHandling}
                        currentAssignedAgentId={lead.assigned_agent_id || ''}
                      />
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
