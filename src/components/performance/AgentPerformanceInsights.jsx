import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, TrendingDown, Minus, Sparkles, Loader2, Award, Target, Lightbulb, BookOpen, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import RequiredTrainingModal from '../training/RequiredTrainingModal';

export default function AgentPerformanceInsights({ agentId, compact = false }) {
  const queryClient = useQueryClient();
  const [period, setPeriod] = useState('monthly');
  const [showTrainingModal, setShowTrainingModal] = useState(false);

  const { data: insights = [], isLoading } = useQuery({
    queryKey: ['performanceInsights', agentId, period],
    queryFn: () => base44.entities.AgentPerformanceInsight.filter({ 
      agent_id: agentId,
      analysis_period: period
    }, '-created_date', 1),
    enabled: !!agentId
  });

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('aiPerformanceAnalyzer', { 
        agent_id: agentId, 
        period 
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['performanceInsights']);
      toast.success('Performance analysis complete');
    }
  });

  const latestInsight = insights[0];

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'declining': return <TrendingDown className="w-4 h-4 text-red-600" />;
      default: return <Minus className="w-4 h-4 text-slate-600" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-700 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'medium': return 'bg-amber-100 text-amber-700 border-amber-300';
      case 'low': return 'bg-blue-100 text-blue-700 border-blue-300';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  if (compact) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              Performance Insights
            </CardTitle>
            <Button
              onClick={() => analyzeMutation.mutate()}
              disabled={analyzeMutation.isPending}
              size="sm"
              variant="outline"
            >
              {analyzeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Analyze'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400" />
          ) : !latestInsight ? (
            <p className="text-sm text-slate-500 text-center py-4">No insights yet</p>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-slate-700 dark:text-slate-300">
                {latestInsight.ai_summary}
              </p>
              {latestInsight.coaching_tips?.slice(0, 2).map((tip, idx) => (
                <div key={idx} className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs">
                  <p className="font-medium text-blue-900 dark:text-blue-200">{tip.tip}</p>
                </div>
              ))}
              {latestInsight.recommended_training?.length > 0 && (
                <Button
                  size="sm"
                  onClick={() => setShowTrainingModal(true)}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  <BookOpen className="w-3 h-3 mr-2" />
                  View Training ({latestInsight.recommended_training.length})
                </Button>
              )}
            </div>
          )}
        </CardContent>
        {latestInsight && showTrainingModal && (
          <RequiredTrainingModal
            open={showTrainingModal}
            onClose={() => setShowTrainingModal(false)}
            training={latestInsight.recommended_training}
            insightId={latestInsight.id}
            agentId={agentId}
          />
        )}
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              AI Performance Analysis
            </CardTitle>
            <div className="flex gap-2">
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="annual">Annual</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={() => analyzeMutation.mutate()}
                disabled={analyzeMutation.isPending}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {analyzeMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing...</>
                ) : (
                  <><Sparkles className="w-4 h-4 mr-2" /> Analyze Performance</>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-400 mb-2" />
              <p className="text-sm text-slate-500">Loading insights...</p>
            </div>
          ) : !latestInsight ? (
            <div className="text-center py-8">
              <Sparkles className="w-12 h-12 mx-auto text-purple-600 mb-3" />
              <p className="text-slate-600 mb-2">No performance insights yet</p>
              <p className="text-sm text-slate-500">Run analysis to get AI-powered coaching</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary */}
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <p className="text-sm font-medium text-purple-900 dark:text-purple-200">
                  {latestInsight.ai_summary}
                </p>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-4 gap-4">
                <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Retention Rate</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">
                    {latestInsight.metrics?.client_retention_rate?.toFixed(1)}%
                  </p>
                  {latestInsight.performance_trends?.retention_trend && (
                    <div className="flex items-center gap-1 mt-1">
                      {getTrendIcon(latestInsight.performance_trends.retention_trend)}
                      <span className="text-xs text-slate-600">
                        {latestInsight.performance_trends.retention_trend}
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Satisfaction</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">
                    {latestInsight.metrics?.client_satisfaction_score?.toFixed(1)}/10
                  </p>
                  {latestInsight.performance_trends?.satisfaction_trend && (
                    <div className="flex items-center gap-1 mt-1">
                      {getTrendIcon(latestInsight.performance_trends.satisfaction_trend)}
                      <span className="text-xs text-slate-600">
                        {latestInsight.performance_trends.satisfaction_trend}
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Upsell Rate</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">
                    {latestInsight.metrics?.upsell_success_rate?.toFixed(1)}%
                  </p>
                </div>
                <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Avg Task Time</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">
                    {latestInsight.metrics?.average_task_completion_time?.toFixed(1)}d
                  </p>
                </div>
              </div>

              {/* Peer Comparison */}
              {latestInsight.peer_comparison && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-slate-900 dark:text-white">Peer Comparison</h4>
                    <Badge className="bg-purple-600">
                      {latestInsight.peer_comparison.percentile}th Percentile
                    </Badge>
                  </div>
                  <Progress value={latestInsight.peer_comparison.percentile} className="h-2 mb-3" />
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {latestInsight.peer_comparison.above_average_areas?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-green-700 dark:text-green-300 mb-1">Above Average:</p>
                        <ul className="text-xs text-green-600 dark:text-green-400 space-y-0.5">
                          {latestInsight.peer_comparison.above_average_areas.map((area, idx) => (
                            <li key={idx}>• {area}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {latestInsight.peer_comparison.below_average_areas?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-red-700 dark:text-red-300 mb-1">Below Average:</p>
                        <ul className="text-xs text-red-600 dark:text-red-400 space-y-0.5">
                          {latestInsight.peer_comparison.below_average_areas.map((area, idx) => (
                            <li key={idx}>• {area}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Strengths */}
              {latestInsight.strengths?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                    <Award className="w-5 h-5 text-green-600" />
                    Your Strengths
                  </h4>
                  <div className="space-y-2">
                    {latestInsight.strengths.map((strength, idx) => (
                      <div key={idx} className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div className="flex items-start justify-between mb-1">
                          <p className="font-medium text-green-900 dark:text-green-200">{strength.area}</p>
                          <Badge variant="outline" className="text-green-700">{strength.score}/100</Badge>
                        </div>
                        <p className="text-sm text-green-800 dark:text-green-300">{strength.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Improvement Areas */}
              {latestInsight.improvement_areas?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                    <Target className="w-5 h-5 text-orange-600" />
                    Areas for Improvement
                  </h4>
                  <div className="space-y-2">
                    {latestInsight.improvement_areas.map((area, idx) => (
                      <div key={idx} className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                        <div className="flex items-start justify-between mb-1">
                          <p className="font-medium text-orange-900 dark:text-orange-200">{area.area}</p>
                          <Badge className={getPriorityColor(area.priority)}>{area.priority}</Badge>
                        </div>
                        <p className="text-sm text-orange-800 dark:text-orange-300">{area.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Coaching Tips */}
              {latestInsight.coaching_tips?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-blue-600" />
                    Personalized Coaching Tips
                  </h4>
                  <div className="space-y-3">
                    {latestInsight.coaching_tips.map((tip, idx) => (
                      <div key={idx} className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <p className="font-medium text-blue-900 dark:text-blue-200">{tip.tip}</p>
                          <Badge variant="outline">{tip.category}</Badge>
                        </div>
                        <div className="mb-2">
                          <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1">Action Items:</p>
                          <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                            {tip.action_items?.map((action, i) => (
                              <li key={i}>• {action}</li>
                            ))}
                          </ul>
                        </div>
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                          <strong>Expected Impact:</strong> {tip.expected_impact}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommended Training */}
              {latestInsight.recommended_training?.length > 0 && (
                <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-purple-600" />
                      Recommended Training ({latestInsight.recommended_training.length})
                    </h4>
                    <Button
                      onClick={() => setShowTrainingModal(true)}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <AlertCircle className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {latestInsight.recommended_training.slice(0, 3).map((training, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-white dark:bg-slate-800 rounded">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-900 dark:text-white">
                            {training.title}
                          </span>
                          {training.is_required && (
                            <Badge className="bg-red-600 text-white">Required</Badge>
                          )}
                          {training.priority && (
                            <Badge variant="outline">{training.priority}</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                    {latestInsight.recommended_training.length > 3 && (
                      <p className="text-xs text-center text-slate-500">
                        +{latestInsight.recommended_training.length - 3} more
                      </p>
                    )}
                  </div>
                </div>
              )}

              {showTrainingModal && (
                <RequiredTrainingModal
                  open={showTrainingModal}
                  onClose={() => setShowTrainingModal(false)}
                  training={latestInsight.recommended_training}
                  insightId={latestInsight.id}
                  agentId={agentId}
                />
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}