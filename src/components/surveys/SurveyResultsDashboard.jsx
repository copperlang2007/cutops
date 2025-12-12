import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Star, TrendingUp, Users, Send, CheckCircle, 
  AlertCircle, MessageSquare, BarChart3, Sparkles
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function SurveyResultsDashboard({ agentId }) {
  const queryClient = useQueryClient();
  const [selectedSurvey, setSelectedSurvey] = useState(null);

  const { data: surveys = [], isLoading } = useQuery({
    queryKey: ['clientSurveys', agentId],
    queryFn: () => agentId
      ? base44.entities.ClientSurvey.filter({ agent_id: agentId }, '-created_date')
      : [],
    enabled: !!agentId
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients', agentId],
    queryFn: () => agentId
      ? base44.entities.Client.filter({ agent_id: agentId })
      : [],
    enabled: !!agentId
  });

  const sendSurveyMutation = useMutation({
    mutationFn: async ({ clientId, surveyType }) => {
      const response = await base44.functions.invoke('automatedSurveyEngine', {
        action: 'send_survey',
        clientId,
        agentId,
        surveyType
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['clientSurveys']);
      toast.success('Survey sent successfully');
    },
    onError: () => {
      toast.error('Failed to send survey');
    }
  });

  const autoTriggerMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('automatedSurveyEngine', {
        action: 'auto_trigger',
        agentId
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['clientSurveys']);
      toast.success(`Sent ${data.triggered} surveys`);
    },
    onError: () => {
      toast.error('Failed to trigger surveys');
    }
  });

  const completedSurveys = surveys.filter(s => s.status === 'completed');
  const pendingSurveys = surveys.filter(s => s.status === 'sent');

  // Calculate statistics
  const stats = {
    total: surveys.length,
    completed: completedSurveys.length,
    pending: pendingSurveys.length,
    responseRate: surveys.length > 0 
      ? Math.round((completedSurveys.length / surveys.filter(s => s.status !== 'pending').length) * 100) 
      : 0,
    avgSatisfaction: completedSurveys.length > 0
      ? (completedSurveys.reduce((sum, s) => sum + (s.overall_satisfaction || 0), 0) / completedSurveys.length).toFixed(1)
      : 0,
    avgNPS: completedSurveys.length > 0
      ? (completedSurveys.reduce((sum, s) => sum + (s.likelihood_to_recommend || 0), 0) / completedSurveys.length).toFixed(1)
      : 0,
    needsFollowUp: completedSurveys.filter(s => s.follow_up_required && !s.follow_up_completed).length
  };

  const getSentimentColor = (sentiment) => {
    switch (sentiment) {
      case 'positive': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'neutral': return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-400';
      case 'negative': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    return client ? `${client.first_name} ${client.last_name}` : 'Unknown';
  };

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="clay-subtle border-0">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Avg Satisfaction</p>
                <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">{stats.avgSatisfaction}/10</p>
              </div>
              <Star className="w-8 h-8 text-teal-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="clay-subtle border-0">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Avg NPS</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.avgNPS}/10</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="clay-subtle border-0">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Response Rate</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.responseRate}%</p>
              </div>
              <BarChart3 className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="clay-subtle border-0">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Needs Follow-up</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.needsFollowUp}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card className="clay-morphism border-0">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">Survey Automation</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Auto-send surveys after client interactions
              </p>
            </div>
            <Button
              onClick={() => autoTriggerMutation.mutate()}
              disabled={autoTriggerMutation.isPending}
              className="bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700"
            >
              {autoTriggerMutation.isPending ? 'Sending...' : 'Auto-Send Surveys'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Survey Results */}
      <Tabs defaultValue="completed" className="space-y-4">
        <TabsList className="clay-subtle">
          <TabsTrigger value="completed">
            Completed ({stats.completed})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending ({stats.pending})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="completed" className="space-y-3">
          {completedSurveys.length === 0 ? (
            <Card className="clay-subtle border-0">
              <CardContent className="py-12 text-center">
                <CheckCircle className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                <p className="text-slate-500">No completed surveys yet</p>
              </CardContent>
            </Card>
          ) : (
            completedSurveys.map((survey) => (
              <Card key={survey.id} className="clay-morphism border-0">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white">
                        {getClientName(survey.client_id)}
                      </h4>
                      <p className="text-sm text-slate-500">
                        Completed {format(new Date(survey.completed_date), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="text-2xl font-bold text-teal-600">
                          {survey.overall_satisfaction}/10
                        </div>
                        <Badge className={getSentimentColor(survey.ai_sentiment)}>
                          {survey.ai_sentiment}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-5 gap-2 mb-4">
                    <div className="text-center p-2 clay-subtle rounded">
                      <p className="text-xs text-slate-500">Agent</p>
                      <p className="font-bold text-slate-900 dark:text-white">{survey.agent_rating}/10</p>
                    </div>
                    <div className="text-center p-2 clay-subtle rounded">
                      <p className="text-xs text-slate-500">Comm.</p>
                      <p className="font-bold text-slate-900 dark:text-white">{survey.communication_rating}/10</p>
                    </div>
                    <div className="text-center p-2 clay-subtle rounded">
                      <p className="text-xs text-slate-500">Speed</p>
                      <p className="font-bold text-slate-900 dark:text-white">{survey.service_speed_rating}/10</p>
                    </div>
                    <div className="text-center p-2 clay-subtle rounded">
                      <p className="text-xs text-slate-500">Clarity</p>
                      <p className="font-bold text-slate-900 dark:text-white">{survey.policy_clarity_rating}/10</p>
                    </div>
                    <div className="text-center p-2 clay-subtle rounded">
                      <p className="text-xs text-slate-500">NPS</p>
                      <p className="font-bold text-slate-900 dark:text-white">{survey.likelihood_to_recommend}/10</p>
                    </div>
                  </div>

                  {survey.ai_analysis && (
                    <div className="p-3 bg-teal-50 dark:bg-teal-900/20 rounded-lg border border-teal-200 dark:border-teal-800 mb-3">
                      <div className="flex items-start gap-2">
                        <Sparkles className="w-4 h-4 text-teal-600 mt-0.5" />
                        <p className="text-sm text-slate-700 dark:text-slate-300">{survey.ai_analysis}</p>
                      </div>
                    </div>
                  )}

                  {survey.feedback_comments && (
                    <div className="p-3 clay-subtle rounded-lg mb-3">
                      <div className="flex items-start gap-2">
                        <MessageSquare className="w-4 h-4 text-slate-400 mt-0.5" />
                        <p className="text-sm text-slate-700 dark:text-slate-300 italic">
                          "{survey.feedback_comments}"
                        </p>
                      </div>
                    </div>
                  )}

                  {survey.follow_up_required && !survey.follow_up_completed && (
                    <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                      <div className="flex items-center justify-between">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-amber-900 dark:text-amber-300">Follow-up Required</p>
                            <p className="text-xs text-amber-700 dark:text-amber-400">{survey.follow_up_reason}</p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={async () => {
                            await base44.entities.ClientSurvey.update(survey.id, { follow_up_completed: true });
                            queryClient.invalidateQueries(['clientSurveys']);
                            toast.success('Marked as completed');
                          }}
                        >
                          Mark Complete
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-3">
          {pendingSurveys.length === 0 ? (
            <Card className="clay-subtle border-0">
              <CardContent className="py-12 text-center">
                <Send className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                <p className="text-slate-500">No pending surveys</p>
              </CardContent>
            </Card>
          ) : (
            pendingSurveys.map((survey) => (
              <Card key={survey.id} className="clay-subtle border-0">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white">
                        {getClientName(survey.client_id)}
                      </h4>
                      <p className="text-sm text-slate-500">
                        Sent {format(new Date(survey.sent_date), 'MMM d, yyyy')}
                      </p>
                      <Badge variant="outline" className="mt-2">
                        {survey.survey_type}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-amber-100 text-amber-700">
                        Awaiting Response
                      </Badge>
                      <p className="text-xs text-slate-500 mt-1">
                        Expires {format(new Date(survey.expires_date), 'MMM d')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}