import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail, MessageSquare, Phone, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function RenewalPipeline({ agentId }) {
  const queryClient = useQueryClient();

  const { data: renewals = [] } = useQuery({
    queryKey: ['renewals', agentId],
    queryFn: () => agentId 
      ? base44.entities.PolicyRenewal.filter({ agent_id: agentId }, '-days_until_renewal')
      : base44.entities.PolicyRenewal.list('-days_until_renewal')
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list()
  });

  const sendReminderMutation = useMutation({
    mutationFn: async (renewalId) => {
      const response = await base44.functions.invoke('sendRenewalReminders', {
        renewal_id: renewalId,
        reminder_type: 'both'
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['renewals']);
      toast.success('Renewal reminders sent');
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.PolicyRenewal.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries(['renewals']);
      toast.success('Status updated');
    }
  });

  const statusGroups = {
    identified: renewals.filter(r => r.status === 'identified'),
    contacted: renewals.filter(r => r.status === 'contacted'),
    in_progress: renewals.filter(r => r.status === 'in_progress'),
    renewed: renewals.filter(r => r.status === 'renewed')
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'high_risk': return 'bg-red-100 text-red-700';
      case 'medium_risk': return 'bg-amber-100 text-amber-700';
      default: return 'bg-green-100 text-green-700';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'bg-red-600';
      case 'high': return 'bg-orange-600';
      case 'medium': return 'bg-amber-600';
      default: return 'bg-blue-600';
    }
  };

  const renderRenewalCard = (renewal) => {
    const client = clients.find(c => c.id === renewal.client_id);
    
    return (
      <Card key={renewal.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="pt-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <p className="font-medium text-slate-900 dark:text-white">
                {client?.first_name} {client?.last_name}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {renewal.current_plan} • ${renewal.current_premium}/mo
              </p>
            </div>
            <Badge className={getPriorityColor(renewal.priority)}>
              {renewal.priority}
            </Badge>
          </div>

          <div className="flex items-center gap-2 mb-3">
            <Badge variant="outline">{renewal.days_until_renewal} days</Badge>
            <Badge className={getRiskColor(renewal.risk_level)}>
              {renewal.risk_level?.replace('_', ' ')}
            </Badge>
          </div>

          {renewal.ai_insights?.talking_points && (
            <div className="mb-3 p-2 rounded bg-blue-50 dark:bg-blue-900/20 text-xs">
              <p className="font-medium text-blue-900 dark:text-blue-200 mb-1">Key Points:</p>
              <ul className="space-y-0.5">
                {renewal.ai_insights.talking_points.slice(0, 2).map((point, i) => (
                  <li key={i} className="text-blue-700 dark:text-blue-300">• {point}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => sendReminderMutation.mutate(renewal.id)}
              disabled={sendReminderMutation.isPending}
            >
              {sendReminderMutation.isPending ? (
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              ) : (
                <Mail className="w-3 h-3 mr-1" />
              )}
              Remind
            </Button>
            {renewal.status === 'identified' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => updateStatusMutation.mutate({ id: renewal.id, status: 'in_progress' })}
              >
                Start
              </Button>
            )}
            {renewal.status === 'in_progress' && (
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700"
                onClick={() => updateStatusMutation.mutate({ id: renewal.id, status: 'renewed' })}
              >
                <CheckCircle className="w-3 h-3 mr-1" />
                Renewed
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="grid grid-cols-4 gap-4">
      {Object.entries(statusGroups).map(([status, items]) => (
        <div key={status}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-900 dark:text-white capitalize">
              {status.replace('_', ' ')}
            </h3>
            <Badge variant="outline">{items.length}</Badge>
          </div>
          <div className="space-y-2">
            {items.map(renewal => renderRenewalCard(renewal))}
          </div>
        </div>
      ))}
    </div>
  );
}