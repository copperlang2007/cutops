import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { HeartPulse, RefreshCw, Loader2, Info } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function ClientRelationshipHealthPanel({ clientId }) {
  const queryClient = useQueryClient();

  const { data: health, isLoading } = useQuery({
    queryKey: ['clientRelationshipHealth', clientId],
    queryFn: async () => {
      const results = await base44.entities.ClientRelationshipHealth.filter({ client_id: clientId });
      return results[0];
    },
    enabled: !!clientId
  });

  const analyzeMutation = useMutation({
    mutationFn: () => base44.functions.invoke('aiGenerateClientHealthScore', { clientId }),
    onSuccess: () => {
      queryClient.invalidateQueries(['clientRelationshipHealth', clientId]);
      toast.success('Health score updated successfully');
    },
    onError: () => toast.error('Failed to generate health score')
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'excellent': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'good': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'fair': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'poor': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      case 'critical': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-slate-500';
    }
  };

  if (isLoading) {
    return (
      <Card className="clay-morphism border-0">
        <CardContent className="flex items-center justify-center p-6 min-h-[200px]">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
          <span className="ml-2 text-slate-500">Loading...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="clay-morphism border-0">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <HeartPulse className="w-6 h-6 text-pink-500" />
          Relationship Health
        </CardTitle>
        <Button
          onClick={() => analyzeMutation.mutate()}
          disabled={analyzeMutation.isPending}
          variant="outline"
          size="sm"
        >
          {analyzeMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          {analyzeMutation.isPending ? 'Analyzing...' : 'Analyze'}
        </Button>
      </CardHeader>
      <CardContent>
        {health ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 text-white font-bold text-3xl shadow-lg">
                {health.score}
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Health Status</p>
                <Badge className={getStatusColor(health.status)}>
                  {health.status}
                </Badge>
                <p className="text-xs text-slate-400 mt-1">
                  {new Date(health.last_analyzed_date).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-slate-800 dark:text-white">AI Insights</h3>
              <p className="text-sm text-slate-700 dark:text-slate-300">{health.ai_summary}</p>
              
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="p-2 clay-subtle rounded">
                  <span className="font-medium">Sentiment:</span> {health.sentiment_impact}
                </div>
                <div className="p-2 clay-subtle rounded">
                  <span className="font-medium">Policy:</span> {health.policy_impact}
                </div>
                <div className="p-2 clay-subtle rounded">
                  <span className="font-medium">Service:</span> {health.service_impact}
                </div>
              </div>
            </div>

            {health.suggested_actions?.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-slate-800 dark:text-white">Recommended Actions</h3>
                {health.suggested_actions.map((action, i) => (
                  <div key={i} className="flex items-start p-3 clay-subtle rounded">
                    <Info className={cn("w-4 h-4 mr-3 mt-0.5", getPriorityColor(action.priority))} />
                    <div className="flex-1">
                      <p className={cn("font-medium text-sm", getPriorityColor(action.priority))}>
                        {action.action}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">{action.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <HeartPulse className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 dark:text-slate-400 mb-4">No health data yet</p>
            <Button onClick={() => analyzeMutation.mutate()} className="bg-teal-600 hover:bg-teal-700">
              Run First Analysis
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}