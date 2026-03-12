import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getActiveAgencyOrRedirect } from '@/lib/agency';
import LeadHandoffControls from '@/components/lead-handoff-controls';

function val(x) {
  return x ?? '-';
}

export default async function LeadDetailPage({ params }) {
  const routeParams = await params;
  const supabase = await createClient();
  const agency = await getActiveAgencyOrRedirect(supabase);

  const { data: lead, error: leadError } = await supabase
    .from('leads')
    .select('id,agency_id,assigned_agent_id,phone,name,location_interest,budget,property_type,bedrooms,timeline,stage,lead_score,updated_at')
    .eq('id', routeParams.id)
    .eq('agency_id', agency.id)
    .single();

  if (leadError || !lead) {
    notFound();
  }

  const { data: state } = await supabase
    .from('conversation_state')
    .select(
      'phone,state,last_message,selected_property_id,is_human_handoff,handoff_started_at,handoff_agent_id,handoff_reason,last_inbound_at'
    )
    .eq('phone', lead.phone)
    .maybeSingle();

  const { data: agents, error: agentsError } = await supabase
    .from('agents')
    .select('id,full_name,role,is_active')
    .eq('agency_id', agency.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (agentsError) throw new Error(agentsError.message);

  const assignedAgent = agents?.find((a) => a.id === lead.assigned_agent_id);
  const isHumanHandling = Boolean(state?.is_human_handoff);

  return (
    <div className="grid">
      <div className="actions" style={{ justifyContent: 'space-between' }}>
        <h1>Lead Details</h1>
        <Link className="btn btn-ghost" href="/leads">
          Back to Leads
        </Link>
      </div>

      <div className="card grid">
        <h2>Lead Summary</h2>
        <p className="small">Phone: {val(lead.phone)}</p>
        <p className="small">Location: {val(lead.location_interest)}</p>
        <p className="small">Budget: {val(lead.budget)}</p>
        <p className="small">Property Type: {val(lead.property_type)}</p>
        <p className="small">Bedrooms: {val(lead.bedrooms)}</p>
        <p className="small">Timeline: {val(lead.timeline)}</p>
        <p className="small">Stage: {val(lead.stage)}</p>
        <p className="small">Lead Score: {val(lead.lead_score)}</p>
        <p className="small">Assigned Agent: {assignedAgent ? assignedAgent.full_name : 'Unassigned'}</p>
      </div>

      <div className="card grid">
        <h2>Conversation State</h2>
        <p className="small">Current State: {val(state?.state)}</p>
        <p className="small">Last Message: {val(state?.last_message)}</p>
        <p className="small">Selected Property ID: {val(state?.selected_property_id)}</p>
        <p className="small">Human Handoff: {isHumanHandling ? 'Yes' : 'No'}</p>
        <p className="small">Handoff Started: {val(state?.handoff_started_at)}</p>
        <p className="small">Handoff Reason: {val(state?.handoff_reason)}</p>
        <p className="small">Last Inbound At: {val(state?.last_inbound_at)}</p>
      </div>

      <div className="card grid">
        <h2>Handoff Controls</h2>
        <LeadHandoffControls
          leadId={lead.id}
          isHumanHandling={isHumanHandling}
          currentAssignedAgentId={lead.assigned_agent_id || ''}
          agents={agents || []}
        />
      </div>
    </div>
  );
}
