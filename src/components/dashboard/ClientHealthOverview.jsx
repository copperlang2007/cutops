import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Activity, AlertCircle, TrendingDown, TrendingUp, 
  Users, RefreshCw, Eye, Sparkles, ArrowRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function ClientHealthOverview({ agentId }) {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('all');
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);

  // Fetch clients for this agent
  const { data: clients = [], isLoading: clientsLoading } = useQuery({
    queryKey: ['clients', agentId],
    queryFn: () => agentId 
      ? base44.entities.Client.filter({ agent_id: agentId }, '-created_date')
      : [],
    enabled: !!agentId
  });

  // Fetch health scores for all clients
  const { data: healthScores = [], isLoading: scoresLoading } = useQuery({
    queryKey: ['clientHealthScores', agentId],
    queryFn: async () => {
      const clientIds = clients.map(c => c.id);
      if (clientIds.length === 0) return [];
      
      // Fetch health records for all clients
      const allHealth = await base44.entities.ClientRelationshipHealth.list('-score');
      return allHealth.filter(h => clientIds.includes(h.client_id));
    },
    enabled: clients.length > 0
  });

  // Generate health score for a single client
  const generateHealthMutation = useMutation({
    mutationFn: async (clientId) => {
      const response = await base44.functions.invoke('aiGenerateClientHealthScore', { clientId });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['clientHealthScores']);
      toast.success('Health score updated');
    },
    onError: (error) => {
      toast.error('Failed to generate health score');
      console.error(error);
    }
  });

  // Generate health scores for all clients
  const generateAllHealthScores = async () => {
    setIsGeneratingAll(true);
    try {
      const clientsWithoutScores = clients.filter(c => 
        !healthScores.find(h => h.client_id === c.id)
      );

      for (const client of clientsWithoutScores) {
        await generateHealthMutation.mutateAsync(client.id);
      }

      toast.success(`Generated health scores for ${clientsWithoutScores.length} clients`);
    } catch (error) {
      toast.error('Failed to generate all health scores');
    } finally {
      setIsGeneratingAll(false);
    }
  };

  // Merge clients with their health scores
  const clientsWithHealth = clients.map(client => {
    const health = healthScores.find(h => h.client_id === client.id);
    return {
      ...client,
      healthScore: health?.score || null,
      healthStatus: health?.status || null,
      healthSummary: health?.ai_summary || null,
      lastAnalyzed: health?.last_analyzed_date || null
    };
  });

  // Filter clients based on health status
  const filteredClients = clientsWithHealth.filter(client => {
    if (filter === 'all') return true;
    if (filter === 'critical') return client.healthStatus === 'critical';
    if (filter === 'poor') return client.healthStatus === 'poor';
    if (filter === 'fair') return client.healthStatus === 'fair';
    if (filter === 'at-risk') return ['critical', 'poor'].includes(client.healthStatus);
    if (filter === 'needs-attention') return ['critical', 'poor', 'fair'].includes(client.healthStatus);
    if (filter === 'no-score') return !client.healthScore;
    return true;
  });

  // Sort by health score (lowest first to prioritize at-risk)
  const sortedClients = [...filteredClients].sort((a, b) => {
    if (!a.healthScore && !b.healthScore) return 0;
    if (!a.healthScore) return 1;
    if (!b.healthScore) return -1;
    return a.healthScore - b.healthScore;
  });

  // Calculate statistics
  const stats = {
    total: clientsWithHealth.length,
    critical: clientsWithHealth.filter(c => c.healthStatus === 'critical').length,
    poor: clientsWithHealth.filter(c => c.healthStatus === 'poor').length,
    fair: clientsWithHealth.filter(c => c.healthStatus === 'fair').length,
    good: clientsWithHealth.filter(c => c.healthStatus === 'good').length,
    excellent: clientsWithHealth.filter(c => c.healthStatus === 'excellent').length,
    noScore: clientsWithHealth.filter(c => !c.healthScore).length,
    averageScore: clientsWithHealth.filter(c => c.healthScore).length > 0
      ? Math.round(clientsWithHealth.filter(c => c.healthScore).reduce((sum, c) => sum + c.healthScore, 0) / clientsWithHealth.filter(c => c.healthScore).length)
      : 0
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'excellent': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'good': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'fair': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'poor': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      case 'critical': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-400';
    }
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-600 dark:text-green-400';
    if (score >= 75) return 'text-blue-600 dark:text-blue-400';
    if (score >= 60) return 'text-amber-600 dark:text-amber-400';
    if (score >= 40) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  const isLoading = clientsLoading || scoresLoading;

  return (
    <Card className="clay-morphism border-0 shadow-xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl">Client Health Overview</CardTitle>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                AI-powered relationship health monitoring
              </p>
            </div>
          </div>
          <Button
            onClick={generateAllHealthScores}
            disabled={isGeneratingAll || stats.noScore === 0}
            size="sm"
            className="gap-2 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
          >
            {isGeneratingAll ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate All ({stats.noScore})
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Statistics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="clay-subtle p-4 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-500 dark:text-slate-400">Average Score</p>
              <TrendingUp className="w-4 h-4 text-teal-600" />
            </div>
            <p className={`text-2xl font-bold ${getScoreColor(stats.averageScore)}`}>
              {stats.averageScore}
            </p>
          </div>
          <div className="clay-subtle p-4 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-500 dark:text-slate-400">At Risk</p>
              <AlertCircle className="w-4 h-4 text-red-600" />
            </div>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {stats.critical + stats.poor}
            </p>
          </div>
          <div className="clay-subtle p-4 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-500 dark:text-slate-400">Needs Attention</p>
              <TrendingDown className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {stats.fair}
            </p>
          </div>
          <div className="clay-subtle p-4 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-500 dark:text-slate-400">Healthy</p>
              <Users className="w-4 h-4 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {stats.good + stats.excellent}
            </p>
          </div>
        </div>

        {/* Filters */}
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="clay-subtle border-0">
            <SelectValue placeholder="Filter clients" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Clients ({stats.total})</SelectItem>
            <SelectItem value="at-risk">At Risk ({stats.critical + stats.poor})</SelectItem>
            <SelectItem value="needs-attention">Needs Attention ({stats.fair})</SelectItem>
            <SelectItem value="critical">Critical ({stats.critical})</SelectItem>
            <SelectItem value="poor">Poor ({stats.poor})</SelectItem>
            <SelectItem value="fair">Fair ({stats.fair})</SelectItem>
            <SelectItem value="no-score">No Score ({stats.noScore})</SelectItem>
          </SelectContent>
        </Select>

        {/* Client List */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {isLoading ? (
            [1, 2, 3].map(i => (
              <div key={i} className="clay-subtle p-4 rounded-xl animate-pulse h-20" />
            ))
          ) : sortedClients.length === 0 ? (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              No clients found
            </div>
          ) : (
            sortedClients.slice(0, 10).map((client) => (
              <motion.div
                key={client.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="clay-subtle p-4 rounded-xl hover:bg-white/60 dark:hover:bg-slate-800/60 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-slate-900 dark:text-white truncate">
                        {client.first_name} {client.last_name}
                      </h4>
                      {client.healthStatus && (
                        <Badge className={`${getStatusColor(client.healthStatus)} text-xs`}>
                          {client.healthStatus}
                        </Badge>
                      )}
                    </div>
                    {client.healthScore ? (
                      <>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-2xl font-bold ${getScoreColor(client.healthScore)}`}>
                            {client.healthScore}
                          </span>
                          <span className="text-xs text-slate-500">/100</span>
                        </div>
                        {client.healthSummary && (
                          <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                            {client.healthSummary}
                          </p>
                        )}
                      </>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => generateHealthMutation.mutate(client.id)}
                          disabled={generateHealthMutation.isPending}
                          className="text-xs"
                        >
                          <Sparkles className="w-3 h-3 mr-1" />
                          Generate Score
                        </Button>
                      </div>
                    )}
                  </div>
                  <Link to={`${createPageUrl('ClientDetail')}?id=${client.id}`}>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {sortedClients.length > 10 && (
          <Link to={createPageUrl('ClientManagement')}>
            <Button variant="outline" className="w-full">
              View All {sortedClients.length} Clients
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}