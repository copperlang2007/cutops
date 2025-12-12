import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { createPageUrl } from '@/utils';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import AgentForm from '../components/agents/AgentForm';

export default function AddAgent() {
  const createAgentMutation = useMutation({
    mutationFn: (data) => base44.entities.Agent.create(data),
    onSuccess: (result) => {
      window.location.href = createPageUrl('AgentDetail') + `?id=${result.id}`;
    }
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link to={createPageUrl('Agents')}>
            <Button variant="ghost" className="mb-4 text-slate-600 hover:text-slate-800">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Agents
            </Button>
          </Link>
        </div>

        <AgentForm
          onSave={(data) => createAgentMutation.mutate(data)}
          onCancel={() => {
            window.location.href = createPageUrl('Agents');
          }}
          isLoading={createAgentMutation.isPending}
        />
      </div>
    </div>
  );
}