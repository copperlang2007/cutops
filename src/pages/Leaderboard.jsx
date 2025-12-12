import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { createPageUrl } from '@/utils';
import { differenceInDays } from 'date-fns';
import { 
  Trophy, Medal, TrendingUp, Users, Filter, Sparkles, 
  ChevronUp, ChevronDown, AlertTriangle, CheckCircle, Loader2, Activity, Heart, Zap, Target as TargetIcon
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';
import LeaderboardAIInsights from '../components/leaderboard/LeaderboardAIInsights';
import AICoachingSuggestions from '../components/coaching/AICoachingSuggestions';
import AITrainingGenerator from '../components/training/AITrainingGenerator';
import AdvancedLeaderboard from '../components/gamification/AdvancedLeaderboard';
import AchievementSystem from '../components/gamification/AchievementSystem';
import PointsTracker from '../components/gamification/PointsTracker';
import { useUserRole } from '../components/shared/RoleGuard';

const METRICS = [
  { key: 'overall', label: 'Overall Score' },
  { key: 'healthScore', label: 'Client Health Score' },
  { key: 'retention', label: 'Client Retention' },
  { key: 'engagement', label: 'Proactive Engagement' },
  { key: 'conversion', label: 'Opportunity Conversion' },
  { key: 'onboarding', label: 'Onboarding Progress' },
  { key: 'licenses', label: 'License Compliance' },
  { key: 'contracts', label: 'Contracts Secured' },
  { key: 'tasks', label: 'Tasks Completed' }
];

export default function Leaderboard() {
  const { user, isAdmin } = useUserRole();
  const [sortMetric, setSortMetric] = useState('overall');
  const [sortDirection, setSortDirection] = useState('desc');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedAgent, setSelectedAgent] = useState(null);

  const { data: agents = [] } = useQuery({
    queryKey: ['agents'],
    queryFn: () => base44.entities.Agent.list()
  });

  const { data: licenses = [] } = useQuery({
    queryKey: ['licenses'],
    queryFn: () => base44.entities.License.list()
  });

  const { data: contracts = [] } = useQuery({
    queryKey: ['contracts'],
    queryFn: () => base44.entities.Contract.list()
  });

  const { data: checklistItems = [] } = useQuery({
    queryKey: ['allChecklists'],
    queryFn: () => base44.entities.OnboardingChecklist.list()
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list()
  });

  const { data: commissions = [] } = useQuery({
    queryKey: ['commissions'],
    queryFn: () => base44.entities.Commission.list()
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['allClients'],
    queryFn: () => base44.entities.Client.list()
  });

  const { data: allAgentPoints = [] } = useQuery({
    queryKey: ['allAgentPoints'],
    queryFn: () => base44.entities.AgentPoints.list()
  });

  const { data: allAchievements = [] } = useQuery({
    queryKey: ['allAchievements'],
    queryFn: () => base44.entities.AgentAchievement.list()
  });

  const { data: interactions = [] } = useQuery({
    queryKey: ['allInteractions'],
    queryFn: () => base44.entities.ClientInteraction.list()
  });

  const { data: riskAssessments = [] } = useQuery({
    queryKey: ['riskAssessments'],
    queryFn: () => base44.entities.RiskAssessment.list()
  });

  const { data: proactiveOutreach = [] } = useQuery({
    queryKey: ['proactiveOutreach'],
    queryFn: () => base44.entities.ProactiveOutreach.list()
  });

  // Find current user's agent record
  const currentAgent = agents.find(a => a.email === user?.email);
  const currentAgentPoints = allAgentPoints.find(p => p.agent_id === currentAgent?.id);
  const currentAgentAchievements = allAchievements.filter(a => a.agent_id === currentAgent?.id);

  const agentMetrics = useMemo(() => {
    return agents.map(agent => {
      const agentLicenses = licenses.filter(l => l.agent_id === agent.id);
      const agentContracts = contracts.filter(c => c.agent_id === agent.id);
      const agentChecklist = checklistItems.filter(c => c.agent_id === agent.id);
      const agentTasks = tasks.filter(t => t.agent_id === agent.id);
      const agentCommissions = commissions.filter(c => c.agent_id === agent.id);
      const agentClients = clients.filter(c => c.agent_id === agent.id);
      const agentInteractions = interactions.filter(i => i.agent_id === agent.id);
      const agentRisks = riskAssessments.filter(r => r.agent_id === agent.id);
      const agentOutreach = proactiveOutreach.filter(o => o.agent_id === agent.id);

      // Existing metrics
      const activeLicenses = agentLicenses.filter(l => l.status === 'active').length;
      const totalLicenses = agentLicenses.length || 1;
      const licenseScore = Math.round((activeLicenses / totalLicenses) * 100);

      const activeContracts = agentContracts.filter(c => ['active', 'contract_signed'].includes(c.contract_status)).length;
      const contractScore = Math.min(activeContracts * 20, 100);

      const completedChecklist = agentChecklist.filter(c => c.is_completed).length;
      const totalChecklist = agentChecklist.length || 1;
      const onboardingScore = Math.round((completedChecklist / totalChecklist) * 100);

      const completedTasks = agentTasks.filter(t => t.status === 'completed').length;
      const totalTasks = agentTasks.length || 1;
      const taskScore = Math.round((completedTasks / totalTasks) * 100);

      const totalCommissions = agentCommissions.reduce((sum, c) => sum + (c.amount || 0), 0);

      // NEW: Client Health Score
      const avgHealthScore = agentClients.length > 0
        ? Math.round((agentClients.reduce((sum, c) => sum + ((c.sentiment_score || 0) * 100), 0) / agentClients.length))
        : 0;

      // NEW: Client Retention Rate
      const activeClients = agentClients.filter(c => c.status === 'active').length;
      const churned = agentClients.filter(c => c.status === 'churned').length;
      const retentionRate = agentClients.length > 0 
        ? Math.round(((agentClients.length - churned) / agentClients.length) * 100)
        : 0;

      // NEW: Proactive Engagement Effectiveness
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const recentInteractions = agentInteractions.filter(i => new Date(i.interaction_date) >= thirtyDaysAgo);
      const proactiveInteractions = recentInteractions.filter(i => i.direction === 'outbound').length;
      const successfulOutreach = agentOutreach.filter(o => o.response_received && o.status === 'completed').length;
      const totalOutreach = agentOutreach.length || 1;
      const engagementScore = Math.round(
        ((proactiveInteractions / (agentClients.length || 1)) * 50) + 
        ((successfulOutreach / totalOutreach) * 50)
      );

      // NEW: Opportunity Conversion Rate
      const resolvedRisks = agentRisks.filter(r => r.status === 'resolved').length;
      const totalRisks = agentRisks.length || 1;
      const riskResolutionRate = Math.round((resolvedRisks / totalRisks) * 100);
      
      const completedOpportunityOutreach = agentOutreach.filter(o => 
        ['market_opportunity', 'cost_savings', 'coverage_gap'].includes(o.opportunity_type) && 
        o.status === 'completed'
      ).length;
      const totalOpportunityOutreach = agentOutreach.filter(o => 
        ['market_opportunity', 'cost_savings', 'coverage_gap'].includes(o.opportunity_type)
      ).length || 1;
      const opportunityConversion = Math.round((completedOpportunityOutreach / totalOpportunityOutreach) * 100);

      const conversionScore = Math.round((riskResolutionRate * 0.4) + (opportunityConversion * 0.6));

      // Enhanced Overall Score
      const overallScore = Math.round(
        (licenseScore * 0.15) + 
        (contractScore * 0.15) + 
        (onboardingScore * 0.1) + 
        (taskScore * 0.1) +
        (avgHealthScore * 0.2) +
        (retentionRate * 0.15) +
        (engagementScore * 0.1) +
        (conversionScore * 0.05)
      );

      return {
        ...agent,
        metrics: {
          overall: overallScore,
          onboarding: onboardingScore,
          licenses: licenseScore,
          contracts: contractScore,
          tasks: taskScore,
          healthScore: avgHealthScore,
          retention: retentionRate,
          engagement: engagementScore,
          conversion: conversionScore,
          totalCommissions,
          activeContracts,
          activeLicenses,
          completedTasks,
          totalTasks: agentTasks.length,
          activeClients,
          churned,
          totalClients: agentClients.length,
          proactiveInteractions,
          successfulOutreach: successfulOutreach,
          resolvedRisks,
          completedOpportunities: completedOpportunityOutreach
        }
      };
    });
  }, [agents, licenses, contracts, checklistItems, tasks, commissions, clients, interactions, riskAssessments, proactiveOutreach]);

  const teamAverages = useMemo(() => {
    if (agentMetrics.length === 0) return {};
    const sum = agentMetrics.reduce((acc, a) => ({
      overall: acc.overall + a.metrics.overall,
      onboarding: acc.onboarding + a.metrics.onboarding,
      licenses: acc.licenses + a.metrics.licenses,
      contracts: acc.contracts + a.metrics.contracts,
      tasks: acc.tasks + a.metrics.tasks,
      healthScore: acc.healthScore + a.metrics.healthScore,
      retention: acc.retention + a.metrics.retention,
      engagement: acc.engagement + a.metrics.engagement,
      conversion: acc.conversion + a.metrics.conversion
    }), { overall: 0, onboarding: 0, licenses: 0, contracts: 0, tasks: 0, healthScore: 0, retention: 0, engagement: 0, conversion: 0 });
    
    return {
      overall: Math.round(sum.overall / agentMetrics.length),
      onboarding: Math.round(sum.onboarding / agentMetrics.length),
      licenses: Math.round(sum.licenses / agentMetrics.length),
      contracts: Math.round(sum.contracts / agentMetrics.length),
      tasks: Math.round(sum.tasks / agentMetrics.length),
      healthScore: Math.round(sum.healthScore / agentMetrics.length),
      retention: Math.round(sum.retention / agentMetrics.length),
      engagement: Math.round(sum.engagement / agentMetrics.length),
      conversion: Math.round(sum.conversion / agentMetrics.length)
    };
  }, [agentMetrics]);

  const sortedAgents = useMemo(() => {
    let filtered = agentMetrics;
    if (statusFilter !== 'all') {
      filtered = filtered.filter(a => a.onboarding_status === statusFilter);
    }
    
    return [...filtered].sort((a, b) => {
      const aVal = a.metrics[sortMetric];
      const bVal = b.metrics[sortMetric];
      return sortDirection === 'desc' ? bVal - aVal : aVal - bVal;
    });
  }, [agentMetrics, sortMetric, sortDirection, statusFilter]);

  const toggleSort = (metric) => {
    if (sortMetric === metric) {
      setSortDirection(d => d === 'desc' ? 'asc' : 'desc');
    } else {
      setSortMetric(metric);
      setSortDirection('desc');
    }
  };

  const getRankBadge = (index) => {
    if (index === 0) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (index === 1) return <Medal className="w-5 h-5 text-slate-400" />;
    if (index === 2) return <Medal className="w-5 h-5 text-amber-600" />;
    return <span className="w-5 h-5 flex items-center justify-center text-sm font-medium text-slate-500">{index + 1}</span>;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Team Leaderboard</h1>
            <p className="text-slate-500 mt-1">Compare agent performance across key metrics</p>
          </div>
        </div>

        {/* Team Averages - New AI-Driven Metrics Highlighted */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          <Card className="border-0 shadow-sm bg-gradient-to-br from-teal-50 to-blue-50 dark:from-teal-900/20 dark:to-blue-900/20">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Activity className="w-4 h-4 text-teal-600" />
                <p className="text-xs text-slate-700 font-medium">Client Health</p>
              </div>
              <p className="text-2xl font-bold text-teal-600">{teamAverages.healthScore || 0}%</p>
              <p className="text-xs text-slate-400">Team Avg</p>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Heart className="w-4 h-4 text-green-600" />
                <p className="text-xs text-slate-700 font-medium">Retention</p>
              </div>
              <p className="text-2xl font-bold text-green-600">{teamAverages.retention || 0}%</p>
              <p className="text-xs text-slate-400">Team Avg</p>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Zap className="w-4 h-4 text-purple-600" />
                <p className="text-xs text-slate-700 font-medium">Engagement</p>
              </div>
              <p className="text-2xl font-bold text-purple-600">{teamAverages.engagement || 0}%</p>
              <p className="text-xs text-slate-400">Team Avg</p>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-sm bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TargetIcon className="w-4 h-4 text-orange-600" />
                <p className="text-xs text-slate-700 font-medium">Conversion</p>
              </div>
              <p className="text-2xl font-bold text-orange-600">{teamAverages.conversion || 0}%</p>
              <p className="text-xs text-slate-400">Team Avg</p>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Trophy className="w-4 h-4 text-slate-600" />
                <p className="text-xs text-slate-700 font-medium">Overall</p>
              </div>
              <p className="text-2xl font-bold text-slate-700">{teamAverages.overall || 0}%</p>
              <p className="text-xs text-slate-400">Team Avg</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <Select value={sortMetric} onValueChange={setSortMetric}>
            <SelectTrigger className="w-48">
              <TrendingUp className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {METRICS.map(m => (
                <SelectItem key={m.key} value={m.key}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Agents</SelectItem>
              <SelectItem value="ready_to_sell">Ready to Sell</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortDirection(d => d === 'desc' ? 'asc' : 'desc')}
          >
            {sortDirection === 'desc' ? <ChevronDown className="w-4 h-4 mr-1" /> : <ChevronUp className="w-4 h-4 mr-1" />}
            {sortDirection === 'desc' ? 'Highest First' : 'Lowest First'}
          </Button>
        </div>

        {/* Agent's Personal Stats (for non-admin users) */}
        {!isAdmin && currentAgent && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2">
              <AdvancedLeaderboard
                agents={agents}
                agentPoints={allAgentPoints}
                commissions={commissions}
                clients={clients}
                licenses={licenses}
                currentAgentId={currentAgent?.id}
              />
            </div>
            <div className="space-y-6">
              <AchievementSystem
                achievements={currentAgentAchievements}
                agentPoints={currentAgentPoints}
              />
              <PointsTracker agentPoints={currentAgentPoints} />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Leaderboard */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-0">
                <div className="divide-y divide-slate-100">
                  {sortedAgents.map((agent, index) => {
                    const initials = `${agent.first_name?.[0] || ''}${agent.last_name?.[0] || ''}`;
                    const isAboveAverage = agent.metrics[sortMetric] >= (teamAverages[sortMetric] || 0);
                    
                    return (
                      <motion.div
                        key={agent.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`p-4 hover:bg-slate-50 cursor-pointer ${selectedAgent?.id === agent.id ? 'bg-teal-50' : ''}`}
                        onClick={() => setSelectedAgent(agent)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-8 flex justify-center">
                            {getRankBadge(index)}
                          </div>
                          
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={agent.photo_url} />
                            <AvatarFallback className="bg-slate-200 text-slate-600 text-sm">
                              {initials}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-slate-800">
                                {agent.first_name} {agent.last_name}
                              </span>
                              {isAboveAverage ? (
                                <TrendingUp className="w-4 h-4 text-emerald-500" />
                              ) : (
                                <AlertTriangle className="w-4 h-4 text-amber-500" />
                              )}
                            </div>
                            <div className="flex items-center gap-4 mt-1">
                              <Progress value={agent.metrics[sortMetric]} className="h-2 w-32" />
                              <span className="text-sm font-medium text-slate-600">
                                {agent.metrics[sortMetric]}%
                              </span>
                            </div>
                          </div>

                          <div className="hidden md:flex items-center gap-6 text-xs text-slate-500">
                            {sortMetric === 'healthScore' && (
                              <>
                                <div className="text-center">
                                  <p className="font-medium text-slate-700">{agent.metrics.healthScore}%</p>
                                  <p>Health</p>
                                </div>
                                <div className="text-center">
                                  <p className="font-medium text-slate-700">{agent.metrics.activeClients}</p>
                                  <p>Active</p>
                                </div>
                              </>
                            )}
                            {sortMetric === 'retention' && (
                              <>
                                <div className="text-center">
                                  <p className="font-medium text-slate-700">{agent.metrics.activeClients}</p>
                                  <p>Active</p>
                                </div>
                                <div className="text-center">
                                  <p className="font-medium text-red-600">{agent.metrics.churned}</p>
                                  <p>Churned</p>
                                </div>
                              </>
                            )}
                            {sortMetric === 'engagement' && (
                              <>
                                <div className="text-center">
                                  <p className="font-medium text-slate-700">{agent.metrics.proactiveInteractions}</p>
                                  <p>Proactive</p>
                                </div>
                                <div className="text-center">
                                  <p className="font-medium text-slate-700">{agent.metrics.successfulOutreach}</p>
                                  <p>Success</p>
                                </div>
                              </>
                            )}
                            {sortMetric === 'conversion' && (
                              <>
                                <div className="text-center">
                                  <p className="font-medium text-slate-700">{agent.metrics.resolvedRisks}</p>
                                  <p>Resolved</p>
                                </div>
                                <div className="text-center">
                                  <p className="font-medium text-slate-700">{agent.metrics.completedOpportunities}</p>
                                  <p>Opps</p>
                                </div>
                              </>
                            )}
                            {!['healthScore', 'retention', 'engagement', 'conversion'].includes(sortMetric) && (
                              <>
                                <div className="text-center">
                                  <p className="font-medium text-slate-700">{agent.metrics.activeContracts}</p>
                                  <p>Contracts</p>
                                </div>
                                <div className="text-center">
                                  <p className="font-medium text-slate-700">{agent.metrics.activeLicenses}</p>
                                  <p>Licenses</p>
                                </div>
                                <div className="text-center">
                                  <p className="font-medium text-slate-700">{agent.metrics.completedTasks}/{agent.metrics.totalTasks}</p>
                                  <p>Tasks</p>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Insights & Coaching */}
          <div className="space-y-6">
            <LeaderboardAIInsights 
              agents={sortedAgents} 
              teamAverages={teamAverages}
            />
            
            {selectedAgent && (
              <>
                <AICoachingSuggestions
                  agent={selectedAgent}
                  metrics={selectedAgent.metrics}
                  teamAverages={teamAverages}
                  commissions={commissions}
                />
                <AITrainingGenerator
                  agent={selectedAgent}
                  metrics={selectedAgent.metrics}
                  teamAverages={teamAverages}
                />
              </>
            )}
            
            {!selectedAgent && (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6 text-center text-slate-400">
                  <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Select an agent to view coaching suggestions</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}