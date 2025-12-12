import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import RoleGuard from '@/components/shared/RoleGuard';
import EnhancedCRMModule from '@/components/crm/EnhancedCRMModule';

export default function CRM() {
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

  if (userLoading || agentsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500">Loading CRM...</p>
        </div>
      </div>
    );
  }

  if (!currentAgent) {
    return null;
  }

  return (
    <RoleGuard pageName="CRM">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-7xl mx-auto">
          <EnhancedCRMModule agentId={currentAgent.id} />
        </div>
      </div>
    </RoleGuard>
  );
}