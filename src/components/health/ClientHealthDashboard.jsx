import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, Loader2, TrendingUp, Target, Users, Sparkles,
  AlertTriangle, CheckCircle2, BookOpen, MessageSquare
} from 'lucide-react';
import { toast } from 'sonner';
import RequiredTrainingModal from '../training/RequiredTrainingModal';
import ClientHealthScoreCard from './ClientHealthScoreCard';

export default function ClientHealthDashboard({ clientId, agentId }) {
  const [healthData, setHealthData] = useState(null);
  const [showTrainingModal, setShowTrainingModal] = useState(false);

  const analyzeHealthMutation = useMutation({
    mutationFn: async () => {
      const result = await base44.functions.invoke('aiClientHealthScore', { client_id: clientId });
      return result.data.health_score;
    },
    onSuccess: (data) => {
      setHealthData(data);
      toast.success('Client health analysis complete');
    },
    onError: (error) => {
      toast.error('Failed to analyze client health');
      console.error(error);
    }
  });

  const createTaskMutation = useMutation({
    mutationFn: async (taskData) => {
      return await base44.entities.Task.create(taskData);
    },
    onSuccess: () => {
      toast.success('Task created successfully');
    }
  });

  const handleCreateTask = (action) => {
    createTaskMutation.mutate({
      title: action.action,
      description: `${action.reason}\n\nChannel: ${action.channel}\n\nTalking Points:\n${action.talking_points?.map(p => `• ${p}`).join('\n')}`,
      priority: action.urgency === 'immediate' ? 'critical' : action.urgency === 'high' ? 'high' : 'medium',
      status: 'pending',
      agent_id: agentId,
      related_entity_type: 'client',
      related_entity_id: clientId,
      category: 'client_retention',
      auto_generated: true,
      due_date: calculateDueDate(action.urgency)
    });
  };

  const calculateDueDate = (urgency) => {
    const now = new Date();
    const days = urgency === 'immediate' ? 1 : urgency === 'high' ? 3 : 7;
    const dueDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    return dueDate.toISOString().split('T')[0];
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-700 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'medium': return 'bg-amber-100 text-amber-700 border-amber-300';
      case 'low': return 'bg-blue-100 text-blue-700 border-blue-300';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-teal-50 to-blue-50 dark:from-teal-900/20 dark:to-blue-900/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-600 to-blue-600 flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Client Health Analysis
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  AI-powered health scoring and retention intelligence
                </p>
              </div>
            </div>
            <Button
              onClick={() => analyzeHealthMutation.mutate()}
              disabled={analyzeHealthMutation.isPending}
              className="bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-500 hover:to-blue-500"
            >
              {analyzeHealthMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Analyze Health
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Health Score Display */}
      {healthData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ClientHealthScoreCard healthData={healthData} />

          {/* Quick Stats */}
          <div className="lg:col-span-2 grid grid-cols-2 gap-4">
            <Card className="border-0 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Risk Factors</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                      {healthData.risk_factors?.length || 0}
                    </p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Opportunities</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                      {(healthData.opportunities?.upsell?.length || 0) + (healthData.opportunities?.cross_sell?.length || 0)}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Retention Actions</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                      {healthData.retention_strategies?.length || 0}
                    </p>
                  </div>
                  <Target className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Engagement Actions</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                      {healthData.engagement_actions?.length || 0}
                    </p>
                  </div>
                  <MessageSquare className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Detailed Analysis */}
      {healthData && (
        <Tabs defaultValue="retention" className="space-y-4">
          <TabsList>
            <TabsTrigger value="retention">Retention Strategies</TabsTrigger>
            <TabsTrigger value="engagement">Engagement Actions</TabsTrigger>
            <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
            <TabsTrigger value="training">Training</TabsTrigger>
          </TabsList>

          <TabsContent value="retention">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Recommended Retention Strategies</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {healthData.retention_strategies?.map((strategy, idx) => (
                  <div key={idx} className="p-4 border dark:border-slate-700 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-slate-900 dark:text-white">
                            {strategy.strategy}
                          </h4>
                          <Badge className={getSeverityColor(strategy.priority)}>
                            {strategy.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                          {strategy.implementation}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span>Timeline: {strategy.timeline}</span>
                          <span>•</span>
                          <span>Expected: {strategy.expected_outcome}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="engagement">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Recommended Engagement Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {healthData.engagement_actions?.map((action, idx) => (
                  <div key={idx} className="p-4 border dark:border-slate-700 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-slate-900 dark:text-white">
                            {action.action}
                          </h4>
                          <Badge variant="outline">{action.channel}</Badge>
                          <Badge className={getSeverityColor(action.urgency)}>
                            {action.urgency}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                          {action.reason}
                        </p>
                        {action.talking_points?.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                              Talking Points:
                            </p>
                            <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                              {action.talking_points.map((point, pidx) => (
                                <li key={pidx}>• {point}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleCreateTask(action)}
                        disabled={createTaskMutation.isPending}
                      >
                        Create Task
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="opportunities">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    Upsell Opportunities
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {healthData.opportunities?.upsell?.map((opp, idx) => (
                    <div key={idx} className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-slate-900 dark:text-white">
                          {opp.product}
                        </h4>
                        <Badge className="bg-green-100 text-green-700">
                          {opp.confidence}% confidence
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                        {opp.reasoning}
                      </p>
                      <p className="text-xs text-slate-500">
                        <strong>Approach:</strong> {opp.approach}
                      </p>
                      {opp.estimated_value > 0 && (
                        <p className="text-xs text-green-600 font-semibold mt-1">
                          Estimated Value: ${opp.estimated_value}/mo
                        </p>
                      )}
                    </div>
                  ))}
                  {(!healthData.opportunities?.upsell || healthData.opportunities.upsell.length === 0) && (
                    <p className="text-sm text-slate-500 text-center py-4">
                      No upsell opportunities identified
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-blue-600" />
                    Cross-Sell Opportunities
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {healthData.opportunities?.cross_sell?.map((opp, idx) => (
                    <div key={idx} className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-slate-900 dark:text-white">
                          {opp.product}
                        </h4>
                        <Badge className="bg-blue-100 text-blue-700">
                          {opp.confidence}% confidence
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                        {opp.reasoning}
                      </p>
                      <p className="text-xs text-slate-500">
                        <strong>Approach:</strong> {opp.approach}
                      </p>
                    </div>
                  ))}
                  {(!healthData.opportunities?.cross_sell || healthData.opportunities.cross_sell.length === 0) && (
                    <p className="text-sm text-slate-500 text-center py-4">
                      No cross-sell opportunities identified
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="training">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-purple-600" />
                    Recommended Training
                  </span>
                  {healthData.recommended_training?.length > 0 && (
                    <Button
                      onClick={() => setShowTrainingModal(true)}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      View All Training
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {healthData.recommended_training?.map((training, idx) => (
                  <div key={idx} className="p-3 border dark:border-slate-700 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-slate-900 dark:text-white">
                        {training.title}
                      </h4>
                      <Badge variant="outline">{training.category}</Badge>
                      <Badge className={getSeverityColor(training.priority)}>
                        {training.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {training.reason}
                    </p>
                  </div>
                ))}
                {(!healthData.recommended_training || healthData.recommended_training.length === 0) && (
                  <p className="text-sm text-slate-500 text-center py-4">
                    No specific training recommendations
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {showTrainingModal && healthData?.recommended_training && (
        <RequiredTrainingModal
          open={showTrainingModal}
          onClose={() => setShowTrainingModal(false)}
          training={healthData.recommended_training}
          insightId={null}
          agentId={agentId}
        />
      )}
    </div>
  );
}