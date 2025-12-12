import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Sparkles, Loader2, AlertTriangle, TrendingUp, DollarSign, Target, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function PolicyGapAnalysis({ clientId }) {
  const [gapAnalysis, setGapAnalysis] = useState(null);

  const analyzeGapsMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('aiPolicyGapAnalysis', {
        clientId
      });
      return response.data;
    },
    onSuccess: (data) => {
      setGapAnalysis(data.gap_analysis);
      toast.success(`Gap analysis complete. ${data.policies_analyzed} policies analyzed.`);
    },
    onError: () => toast.error('Gap analysis failed')
  });

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'high': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      case 'medium': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'low': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-4">
      <Card className="clay-morphism border-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-600" />
              Coverage Gap Analysis
            </CardTitle>
            <Button
              onClick={() => analyzeGapsMutation.mutate()}
              disabled={analyzeGapsMutation.isPending}
              className="bg-gradient-to-r from-indigo-500 to-purple-600"
            >
              {analyzeGapsMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Analyzing...</>
              ) : (
                <><Sparkles className="w-4 h-4 mr-2" />Run Gap Analysis</>
              )}
            </Button>
          </div>
        </CardHeader>

        {gapAnalysis && (
          <CardContent className="space-y-4">
            {/* Overall Summary */}
            <div className="p-4 clay-subtle rounded-xl">
              <h3 className="font-bold text-slate-900 dark:text-white mb-3">Coverage Adequacy</h3>
              <div className="mb-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Overall Score</span>
                  <Badge className="bg-green-100 text-green-700">{gapAnalysis.adequacy_assessment?.overall_score}/100</Badge>
                </div>
                <Progress value={gapAnalysis.adequacy_assessment?.overall_score || 0} className="h-2" />
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300">{gapAnalysis.recommendations_summary}</p>
            </div>

            {/* Coverage Gaps */}
            {gapAnalysis.coverage_gaps?.length > 0 && (
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Coverage Gaps ({gapAnalysis.coverage_gaps.length})
                </h3>
                <div className="space-y-2">
                  {gapAnalysis.coverage_gaps.map((gap, i) => (
                    <div key={i} className={`p-4 clay-subtle rounded-xl border-l-4 ${
                      gap.severity === 'critical' || gap.severity === 'high' ? 'border-l-red-500' :
                      gap.severity === 'medium' ? 'border-l-amber-500' : 'border-l-blue-500'
                    }`}>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-white">{gap.gap_type}</h4>
                          <Badge className={`${getSeverityColor(gap.severity)} mt-1`}>{gap.severity}</Badge>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-500">Est. Cost</p>
                          <p className="text-lg font-bold text-slate-900 dark:text-white">${gap.estimated_cost}</p>
                        </div>
                      </div>
                      <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">{gap.description}</p>
                      <div className="space-y-1">
                        <p className="text-xs text-slate-500">Impact: <span className="text-red-600">{gap.impact}</span></p>
                        <p className="text-xs text-slate-500">Recommended: <span className="text-green-600">{gap.recommended_solution}</span></p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Policy Overlaps */}
            {gapAnalysis.policy_overlaps?.length > 0 && (
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  Policy Overlaps ({gapAnalysis.policy_overlaps.length})
                </h3>
                <div className="space-y-2">
                  {gapAnalysis.policy_overlaps.map((overlap, i) => (
                    <div key={i} className="p-4 clay-subtle rounded-xl border-l-4 border-l-blue-500">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-bold text-slate-900 dark:text-white">{overlap.overlap_type}</h4>
                        <div className="text-right">
                          <p className="text-xs text-slate-500">Potential Savings</p>
                          <p className="text-lg font-bold text-green-600">${overlap.potential_savings}</p>
                        </div>
                      </div>
                      <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">{overlap.description}</p>
                      <p className="text-xs text-blue-600 dark:text-blue-400">💡 {overlap.recommendation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Financial Summary */}
            {gapAnalysis.financial_summary && (
              <div className="p-4 clay-subtle rounded-xl">
                <h3 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Financial Impact
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-slate-500">Current Premium</p>
                    <p className="text-xl font-bold text-slate-900 dark:text-white">${gapAnalysis.financial_summary.current_total_premium}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Potential Savings</p>
                    <p className="text-xl font-bold text-green-600">${gapAnalysis.financial_summary.potential_savings}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">New Coverage Cost</p>
                    <p className="text-xl font-bold text-amber-600">${gapAnalysis.financial_summary.recommended_additions_cost}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Net Change</p>
                    <p className={`text-xl font-bold ${gapAnalysis.financial_summary.net_change >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {gapAnalysis.financial_summary.net_change >= 0 ? '+' : ''}${gapAnalysis.financial_summary.net_change}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Priority */}
            {gapAnalysis.action_priority?.length > 0 && (
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white mb-2">Recommended Actions (Priority Order)</h3>
                <div className="space-y-2">
                  {gapAnalysis.action_priority.map((action, i) => (
                    <div key={i} className="p-3 clay-subtle rounded-lg flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                        {action.priority}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-sm text-slate-900 dark:text-white">{action.action}</h4>
                        <p className="text-xs text-slate-600 dark:text-slate-400">{action.reason}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}