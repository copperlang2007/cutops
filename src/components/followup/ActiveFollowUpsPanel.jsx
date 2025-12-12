import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Play, Pause, StopCircle, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function ActiveFollowUpsPanel({ agentId }) {
  const queryClient = useQueryClient();

  const { data: executions = [] } = useQuery({
    queryKey: ['followUpExecutions', agentId],
    queryFn: () => base44.entities.FollowUpExecution.filter({ agent_id: agentId }, '-trigger_date'),
    enabled: !!agentId
  });

  const { data: sequences = [] } = useQuery({
    queryKey: ['followUpSequences', agentId],
    queryFn: () => base44.entities.FollowUpSequence.filter({ agent_id: agentId }),
    enabled: !!agentId
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients', agentId],
    queryFn: () => base44.entities.Client.filter({ agent_id: agentId }),
    enabled: !!agentId
  });

  const pauseMutation = useMutation({
    mutationFn: (id) => base44.entities.FollowUpExecution.update(id, { status: 'paused' }),
    onSuccess: () => {
      queryClient.invalidateQueries(['followUpExecutions']);
      toast.success('Follow-up paused');
    }
  });

  const resumeMutation = useMutation({
    mutationFn: (id) => base44.entities.FollowUpExecution.update(id, { status: 'in_progress' }),
    onSuccess: () => {
      queryClient.invalidateQueries(['followUpExecutions']);
      toast.success('Follow-up resumed');
    }
  });

  const stopMutation = useMutation({
    mutationFn: ({ id, reason }) => base44.entities.FollowUpExecution.update(id, { 
      status: 'stopped', 
      manually_overridden: true,
      override_reason: reason
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['followUpExecutions']);
      toast.success('Follow-up stopped');
    }
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-700';
      case 'in_progress': return 'bg-amber-100 text-amber-700';
      case 'paused': return 'bg-slate-100 text-slate-700';
      case 'completed': return 'bg-green-100 text-green-700';
      case 'stopped': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const activeExecutions = executions.filter(e => 
    e.status === 'scheduled' || e.status === 'in_progress' || e.status === 'paused'
  );

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-teal-600" />
          Active Follow-Ups
          <Badge variant="outline" className="ml-auto">{activeExecutions.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activeExecutions.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <p className="text-sm">No active follow-ups</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeExecutions.map((execution) => {
              const sequence = sequences.find(s => s.id === execution.sequence_id);
              const client = clients.find(c => c.id === execution.client_id);
              const progress = sequence ? ((execution.current_step / sequence.steps.length) * 100) : 0;
              
              return (
                <div key={execution.id} className="p-4 rounded-lg border dark:border-slate-700">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {client?.first_name} {client?.last_name}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {sequence?.name}
                      </p>
                    </div>
                    <Badge className={getStatusColor(execution.status)}>
                      {execution.status}
                    </Badge>
                  </div>

                  <div className="space-y-2 mb-3">
                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span>Progress</span>
                      <span>{execution.current_step}/{sequence?.steps.length || 0} steps</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>

                  {execution.next_step_date && (
                    <p className="text-xs text-slate-500 mb-3">
                      Next step: {format(new Date(execution.next_step_date), 'MMM d, yyyy')}
                    </p>
                  )}

                  {execution.engagement_score > 0 && (
                    <div className="mb-3">
                      <p className="text-xs text-slate-500 mb-1">Engagement Score</p>
                      <div className="flex items-center gap-2">
                        <Progress value={execution.engagement_score} className="h-1 flex-1" />
                        <span className="text-xs font-medium">{execution.engagement_score}%</span>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {execution.status === 'paused' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => resumeMutation.mutate(execution.id)}
                      >
                        <Play className="w-3 h-3 mr-1" />
                        Resume
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => pauseMutation.mutate(execution.id)}
                      >
                        <Pause className="w-3 h-3 mr-1" />
                        Pause
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600"
                      onClick={() => stopMutation.mutate({ 
                        id: execution.id, 
                        reason: 'Manual override by agent' 
                      })}
                    >
                      <StopCircle className="w-3 h-3 mr-1" />
                      Stop
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}