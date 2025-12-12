import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import RoleGuard from '@/components/shared/RoleGuard';
import AgentPerformanceDashboard from '@/components/analytics/AgentPerformanceDashboard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Analytics() {
  const [selectedAgentId, setSelectedAgentId] = React.useState('');

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: agents = [], isLoading: agentsLoading } = useQuery({
    queryKey: ['agents'],
    queryFn: () => base44.entities.Agent.list(),
    enabled: !!user
  });

  const currentAgent = user ? agents.find(a => a.email === user.email) : null;

  React.useEffect(() => {
    if (currentAgent && !selectedAgentId) {
      setSelectedAgentId(currentAgent.id);
    }
  }, [currentAgent, selectedAgentId]);

  if (userLoading || agentsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!user || !selectedAgentId) {
    return null;
  }

  return (
    <RoleGuard pageName="Analytics">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-7xl mx-auto">
          {user.role === 'admin' && (
            <div className="mb-6">
              <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Select agent..." />
                </SelectTrigger>
                <SelectContent>
                  {agents.map(agent => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.first_name} {agent.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <AgentPerformanceDashboard agentId={selectedAgentId} />
        </div>
      </div>
    </RoleGuard>
  );
}