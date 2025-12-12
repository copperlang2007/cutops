import { useState } from 'react'
import { base44 } from '@/api/base44Client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { UserPlus, CheckCircle, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { useUserRole } from '@/components/shared/RoleGuard'
import { getAccessibleAgents } from './trainingPermissions'

export default function TrainingAssignmentManager() {
  const queryClient = useQueryClient();
  const { user, roleType, agency, permissions } = useUserRole();
  const [selectedAgent, setSelectedAgent] = useState('');
  const [selectedPathway, setSelectedPathway] = useState('');

  const { data: allAgents = [] } = useQuery({
    queryKey: ['agents'],
    queryFn: () => base44.entities.Agent.list()
  });

  const { data: currentAgent } = useQuery({
    queryKey: ['currentAgent', user?.email],
    queryFn: async () => {
      const agents = await base44.entities.Agent.filter({ email: user.email });
      return agents[0];
    },
    enabled: !!user?.email
  });

  // Filter agents based on role permissions
  const agents = getAccessibleAgents(roleType, currentAgent?.id, allAgents, agency);

  const { data: pathways = [] } = useQuery({
    queryKey: ['trainingPathways'],
    queryFn: () => base44.entities.TrainingPlan.filter({ plan_name: { $exists: true } })
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ['trainingAssignments'],
    queryFn: () => base44.entities.TrainingPlan.list()
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ['trainingSessions'],
    queryFn: () => base44.entities.TrainingSession.list()
  });

  const assignPathwayMutation = useMutation({
    mutationFn: async ({ agentId, pathwayId }) => {
      const pathway = pathways.find(p => p.id === pathwayId);
      return await base44.entities.TrainingPlan.create({
        agent_id: agentId,
        plan_name: pathway.plan_name,
        recommended_modules: pathway.recommended_modules,
        target_completion_date: pathway.target_completion_date,
        status: 'active',
        completion_percentage: 0
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['trainingAssignments']);
      toast.success('Training pathway assigned');
      setSelectedAgent('');
      setSelectedPathway('');
    }
  });

  const getAgentStats = (agentId) => {
    const agentAssignments = assignments.filter(a => a.agent_id === agentId);
    const agentSessions = sessions.filter(s => s.agent_id === agentId);
    const completed = agentSessions.filter(s => s.completed).length;
    return {
      assigned: agentAssignments.length,
      completed,
      inProgress: agentSessions.length - completed
    };
  };

  return (
    <div className="space-y-6">
      {/* Assignment Form */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-purple-600" />
            Assign Training Pathway
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Select value={selectedAgent} onValueChange={setSelectedAgent}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select agent..." />
              </SelectTrigger>
              <SelectContent>
                {agents.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {agent.first_name} {agent.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedPathway} onValueChange={setSelectedPathway}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select pathway..." />
              </SelectTrigger>
              <SelectContent>
                {pathways.map((pathway) => (
                  <SelectItem key={pathway.id} value={pathway.id}>
                    {pathway.plan_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              onClick={() => assignPathwayMutation.mutate({ 
                agentId: selectedAgent, 
                pathwayId: selectedPathway 
              })}
              disabled={!selectedAgent || !selectedPathway || assignPathwayMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Assign
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Agent Training Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map((agent) => {
          const stats = getAgentStats(agent.id);
          return (
            <Card key={agent.id} className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-base">
                  {agent.first_name} {agent.last_name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Assigned:</span>
                  <Badge variant="outline">{stats.assigned}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">In Progress:</span>
                  <Badge className="bg-amber-100 text-amber-700">
                    <Clock className="w-3 h-3 mr-1" />
                    {stats.inProgress}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Completed:</span>
                  <Badge className="bg-green-100 text-green-700">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    {stats.completed}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}