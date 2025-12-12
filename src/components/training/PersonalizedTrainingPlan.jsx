import React from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Sparkles, Loader2, Target, Lightbulb, TrendingUp, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function PersonalizedTrainingPlan({ agentId, onSimulationSelect }) {
  const queryClient = useQueryClient();

  const generatePlanMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('aiTrainingPlanGenerator', {
        agent_id: agentId
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['trainingPlans']);
      toast.success('Training plan generated!');
    }
  });

  const plan = generatePlanMutation.data?.analysis;

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-700';
      case 'medium': return 'bg-amber-100 text-amber-700';
      default: return 'bg-blue-100 text-blue-700';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-700';
      case 'high': return 'bg-orange-100 text-orange-700';
      case 'medium': return 'bg-amber-100 text-amber-700';
      default: return 'bg-green-100 text-green-700';
    }
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-600" />
            Personalized Training Plan
          </CardTitle>
          <Button
            onClick={() => generatePlanMutation.mutate()}
            disabled={generatePlanMutation.isPending}
            className="bg-gradient-to-r from-purple-600 to-blue-600"
          >
            {generatePlanMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            Generate Plan
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {generatePlanMutation.isPending && (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 mx-auto mb-2 text-purple-600 animate-spin" />
            <p className="text-sm text-slate-500">Analyzing performance data...</p>
          </div>
        )}

        {plan && (
          <div className="space-y-6">
            {/* Performance Summary */}
            <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <p className="font-medium text-blue-900 dark:text-blue-200">Performance Summary</p>
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-300">{plan.performance_summary}</p>
            </div>

            {/* Performance Gaps */}
            {plan.identified_gaps?.length > 0 && (
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Areas for Improvement</h3>
                <div className="space-y-3">
                  {plan.identified_gaps.map((gap, i) => (
                    <div key={i} className="p-3 rounded-lg border dark:border-slate-700">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="font-medium text-slate-900 dark:text-white">{gap.area}</p>
                        <Badge className={getSeverityColor(gap.severity)}>{gap.severity}</Badge>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">{gap.description}</p>
                      <p className="text-xs text-slate-500">Evidence: {gap.evidence}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommended Modules */}
            {plan.recommended_modules?.length > 0 && (
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Recommended Learning Modules</h3>
                <div className="space-y-3">
                  {plan.recommended_modules.map((module, i) => (
                    <div key={i} className="p-4 rounded-lg border dark:border-slate-700 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 flex-1">
                          <Badge className="bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900">
                            #{i + 1}
                          </Badge>
                          <p className="font-medium text-slate-900 dark:text-white">{module.module_name}</p>
                        </div>
                        <Badge className={getPriorityColor(module.priority)}>{module.priority}</Badge>
                      </div>
                      <p className="text-xs text-slate-500 mb-2">{module.estimated_duration}</p>
                      <div className="mt-3">
                        <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Learning Objectives:</p>
                        <ul className="space-y-1">
                          {module.learning_objectives.map((obj, j) => (
                            <li key={j} className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2">
                              <CheckCircle className="w-3 h-3 text-green-600 mt-0.5 shrink-0" />
                              {obj}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommended Simulations */}
            {plan.recommended_simulations?.length > 0 && (
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Practice Simulations</h3>
                <div className="space-y-2">
                  {plan.recommended_simulations.map((sim, i) => (
                    <div key={i} className="p-3 rounded-lg border dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-slate-900 dark:text-white">{sim.title}</p>
                          <p className="text-xs text-slate-500 mt-1">{sim.why_recommended}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{sim.difficulty}</Badge>
                          <Button size="sm" onClick={() => onSimulationSelect?.(sim)}>
                            Start
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Wins */}
            {plan.quick_wins?.length > 0 && (
              <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="w-4 h-4 text-green-600" />
                  <p className="font-medium text-green-900 dark:text-green-200">Quick Wins</p>
                </div>
                <ul className="space-y-1">
                  {plan.quick_wins.map((win, i) => (
                    <li key={i} className="text-sm text-green-700 dark:text-green-300">• {win}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Coaching Insights */}
            {plan.coaching_insights && (
              <div className="p-4 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <p className="font-medium text-purple-900 dark:text-purple-200">AI Coach Insights</p>
                </div>
                <p className="text-sm text-purple-700 dark:text-purple-300">{plan.coaching_insights}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}