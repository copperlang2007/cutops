import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2, CheckSquare, Clock, TrendingUp, Lightbulb } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export default function AITaskPrioritizer({ agentId }) {
  const [prioritization, setPrioritization] = useState(null);

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', agentId],
    queryFn: () => base44.entities.Task.filter({ agent_id: agentId }),
    enabled: !!agentId
  });

  const prioritizeMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('aiTaskPrioritization', {
        agent_id: agentId
      });
      return response.data;
    },
    onSuccess: (data) => {
      setPrioritization(data.prioritization);
    }
  });

  const getImpactColor = (impact) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'medium': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      default: return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    }
  };

  const pendingTasks = tasks.filter(t => t.status !== 'completed');

  return (
    <Card className="border-0 shadow-lg liquid-glass">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-blue-600" />
            AI Task Prioritizer
          </CardTitle>
          <Button
            size="sm"
            onClick={() => prioritizeMutation.mutate()}
            disabled={prioritizeMutation.isPending || pendingTasks.length === 0}
            className="bg-gradient-to-r from-blue-600 to-purple-600"
          >
            {prioritizeMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Prioritize
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {pendingTasks.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            <CheckSquare className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="text-sm">No pending tasks</p>
          </div>
        )}

        {prioritizeMutation.isPending && (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 mx-auto mb-2 text-blue-600 animate-spin" />
            <p className="text-sm text-slate-500">Analyzing tasks and priorities...</p>
          </div>
        )}

        {prioritization && (
          <div className="space-y-4">
            {/* Daily Focus */}
            <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <p className="font-medium text-blue-900 dark:text-blue-200">
                  Today's Focus
                </p>
              </div>
              <div className="space-y-2">
                {prioritization.daily_focus.map((task, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">{i + 1}.</span>
                    <span className="text-sm text-blue-800 dark:text-blue-300">{task}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Prioritized Tasks */}
            {prioritization.prioritized_tasks?.length > 0 && (
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                  Prioritized Task List
                </p>
                <div className="space-y-2">
                  {prioritization.prioritized_tasks
                    .sort((a, b) => a.recommended_order - b.recommended_order)
                    .map((task) => {
                      const taskData = tasks.find(t => t.id === task.task_id);
                      return (
                        <div key={task.task_id} className="p-3 rounded-lg border dark:border-slate-700 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2 flex-1">
                              <Badge className="bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900">
                                #{task.recommended_order}
                              </Badge>
                              <p className="text-sm font-medium text-slate-900 dark:text-white">
                                {taskData?.title}
                              </p>
                            </div>
                            {task.should_do_today && (
                              <Badge className="bg-red-100 text-red-700">Today</Badge>
                            )}
                          </div>

                          <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                            {task.urgency_reason}
                          </p>

                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className={getImpactColor(task.impact)} variant="secondary">
                              {task.impact} impact
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              <Clock className="w-3 h-3 mr-1" />
                              {task.estimated_time}
                            </Badge>
                            <div className="flex items-center gap-1 ml-auto">
                              <span className="text-xs text-slate-500">Priority Score</span>
                              <Progress value={task.priority_score} className="h-1 w-16" />
                              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                {task.priority_score}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Postponable Tasks */}
            {prioritization.postponable?.length > 0 && (
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border dark:border-slate-700">
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Can Wait Until Later
                </p>
                <ul className="space-y-1">
                  {prioritization.postponable.map((task, i) => (
                    <li key={i} className="text-xs text-slate-600 dark:text-slate-400">
                      • {task}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Productivity Tips */}
            {prioritization.productivity_tips?.length > 0 && (
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="w-4 h-4 text-amber-600" />
                  <p className="text-xs font-medium text-amber-900 dark:text-amber-200">
                    Productivity Tips
                  </p>
                </div>
                <ul className="space-y-1">
                  {prioritization.productivity_tips.map((tip, i) => (
                    <li key={i} className="text-xs text-amber-700 dark:text-amber-300">
                      • {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}