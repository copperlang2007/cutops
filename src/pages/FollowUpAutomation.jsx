import { base44 } from '@/api/base44Client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Zap, Play, TrendingUp, Users } from 'lucide-react'
import { toast } from 'sonner'
import FollowUpSequenceManager from '../components/followup/FollowUpSequenceManager';
import ActiveFollowUpsPanel from '../components/followup/ActiveFollowUpsPanel';
import ProactiveOutreachPanel from '../components/followup/ProactiveOutreachPanel';
import RoleGuard from '../components/shared/RoleGuard';

export default function FollowUpAutomation() {
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: agents = [] } = useQuery({
    queryKey: ['agents'],
    queryFn: () => base44.entities.Agent.list()
  });

  const currentAgent = agents.find(a => a.email === user?.email) || agents[0];

  const { data: executions = [] } = useQuery({
    queryKey: ['followUpExecutions', currentAgent?.id],
    queryFn: () => base44.entities.FollowUpExecution.filter({ agent_id: currentAgent.id }),
    enabled: !!currentAgent
  });

  const triggerEngineMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('automatedFollowUpEngine', {
        agent_id: currentAgent.id
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['followUpExecutions']);
      toast.success(`Triggered ${data.triggered} follow-ups`);
    }
  });

  const totalExecutions = executions.length;
  const activeExecutions = executions.filter(e => 
    e.status === 'scheduled' || e.status === 'in_progress'
  ).length;
  const completedExecutions = executions.filter(e => e.status === 'completed').length;
  const avgEngagement = executions.length > 0
    ? Math.round(executions.reduce((sum, e) => sum + (e.engagement_score || 0), 0) / executions.length)
    : 0;

  return (
    <RoleGuard pageName="ClientManagement">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Follow-Up Automation</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Automated client engagement and communication sequences
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <Card className="border-0 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Total Executions</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalExecutions}</p>
                  </div>
                  <Users className="w-8 h-8 text-teal-600" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Active</p>
                    <p className="text-2xl font-bold text-amber-600">{activeExecutions}</p>
                  </div>
                  <Zap className="w-8 h-8 text-amber-600" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Completed</p>
                    <p className="text-2xl font-bold text-green-600">{completedExecutions}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Avg Engagement</p>
                    <p className="text-2xl font-bold text-blue-600">{avgEngagement}%</p>
                  </div>
                  <Badge className="bg-blue-100 text-blue-700">Score</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Run Engine */}
          <Card className="border-0 shadow-lg mb-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Check for New Follow-Ups</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Scan clients and trigger automated sequences based on conditions
                  </p>
                </div>
                <Button
                  onClick={() => triggerEngineMutation.mutate()}
                  disabled={triggerEngineMutation.isPending || !currentAgent}
                  className="bg-gradient-to-r from-teal-600 to-emerald-600"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Run Engine
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            {/* AI Proactive Outreach */}
            {currentAgent && <ProactiveOutreachPanel agentId={currentAgent.id} />}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                {currentAgent && <FollowUpSequenceManager agentId={currentAgent.id} />}
              </div>
              <div>
                {currentAgent && <ActiveFollowUpsPanel agentId={currentAgent.id} />}
              </div>
            </div>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}