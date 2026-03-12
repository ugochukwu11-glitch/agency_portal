'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LeadHandoffControls({ leadId, isHumanHandling, currentAssignedAgentId = '', agents = [] }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedAgentId, setSelectedAgentId] = useState(currentAssignedAgentId || '');

  const hasAgentOptions = useMemo(() => Array.isArray(agents) && agents.length > 0, [agents]);

  async function runAction(action) {
    const ok = window.confirm(action === 'takeover' ? 'Take over this lead and pause the bot?' : 'Resume bot for this lead?');
    if (!ok) return;

    setIsLoading(true);
    setError('');

    const response = await fetch(`/api/leads/${leadId}/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body:
        action === 'takeover'
          ? JSON.stringify({ assigned_agent_id: selectedAgentId || null })
          : undefined
    });

    const json = await response.json();
    setIsLoading(false);

    if (!response.ok) {
      setError(json.error || `Failed to ${action}`);
      return;
    }

    router.refresh();
  }

  return (
    <div className="grid" style={{ gap: '0.6rem' }}>
      {hasAgentOptions ? (
        <label>
          Assigned Agent
          <select value={selectedAgentId} onChange={(event) => setSelectedAgentId(event.target.value)}>
            <option value="">Unassigned</option>
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.full_name} ({agent.role})
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <div className="actions">
        {isHumanHandling ? (
          <button disabled={isLoading} type="button" onClick={() => runAction('resume')}>
            {isLoading ? 'Saving...' : 'Resume Bot'}
          </button>
        ) : (
          <button className="btn-danger" disabled={isLoading} type="button" onClick={() => runAction('takeover')}>
            {isLoading ? 'Saving...' : 'Take Over'}
          </button>
        )}
      </div>

      {error ? <p className="alert">{error}</p> : null}
    </div>
  );
}
