import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, Sparkles, Loader2, Target, Award, AlertTriangle, BookOpen } from 'lucide-react'
import { base44 } from '@/api/base44Client'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

export default function AIPerformanceInsights({ agent, commissions, policies, licenses, contracts, trainingProgress, teamAverages }) {
  const [insights, setInsights] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzePerformance = async () => {
    setIsAnalyzing(true);
    try {
      const agentMetrics = {
        name: `${agent.first_name} ${agent.last_name}`,
        onboardingStatus: agent.onboarding_status,
        totalCommissions: commissions.reduce((sum, c) => sum + (c.amount || 0), 0),
        commissionCount: commissions.length,
        activeLicenses: licenses.filter(l => l.status === 'active').length,
        activeContracts: contracts.filter(c => ['active', 'contract_signed'].includes(c.contract_status)).length,
        completedTraining: trainingProgress?.filter(t => t.status === 'completed').length || 0,
        teamAvgCommission: teamAverages?.avgCommission || 0,
        teamAvgPolicies: teamAverages?.avgPolicies || 0
      };

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this insurance agent's performance and provide detailed insights.

Agent Profile:
${JSON.stringify(agentMetrics, null, 2)}

Provide:
1. Performance trend analysis (improving, stable, declining)
2. Strengths identified from data
3. Areas for improvement with specific recommendations
4. Skills gap analysis based on licenses and training
5. Personalized coaching recommendations
6. 30/60/90 day action plan
7. Comparison to team averages`,
        response_json_schema: {
          type: "object",
          properties: {
            overall_score: { type: "number" },
            performance_trend: { type: "string", enum: ["improving", "stable", "declining"] },
            trend_analysis: { type: "string" },
            strengths: { type: "array", items: { type: "string" } },
            improvement_areas: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  area: { type: "string" },
                  current_level: { type: "string" },
                  target_level: { type: "string" },
                  recommendation: { type: "string" }
                }
              }
            },
            skills_gaps: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  skill: { type: "string" },
                  gap_severity: { type: "string" },
                  suggested_training: { type: "string" }
                }
              }
            },
            coaching_recommendations: { type: "array", items: { type: "string" } },
            action_plan: {
              type: "object",
              properties: {
                day_30: { type: "array", items: { type: "string" } },
                day_60: { type: "array", items: { type: "string" } },
                day_90: { type: "array", items: { type: "string" } }
              }
            },
            team_comparison: { type: "string" }
          }
        }
      });

      setInsights(result);
      toast.success('Performance analysis complete');
    } catch (err) {
      toast.error('Failed to analyze performance');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const trendConfig = {
    improving: { icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
    stable: { icon: Target, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
    declining: { icon: TrendingDown, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30' }
  };

  return (
    <Card className="border-0 shadow-premium dark:bg-slate-800/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2 dark:text-white">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            AI Performance Insights
          </CardTitle>
          <Button onClick={analyzePerformance} disabled={isAnalyzing} size="sm">
            {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
            {isAnalyzing ? 'Analyzing...' : 'Analyze'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!insights ? (
          <div className="text-center py-8 text-slate-400">
            <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Click "Analyze" to get AI-powered performance insights</p>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* Score & Trend */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-xl">
                <p className="text-sm text-purple-600 dark:text-purple-400">Performance Score</p>
                <p className="text-4xl font-bold text-purple-700 dark:text-purple-300">{insights.overall_score}/100</p>
              </div>
              <div className={`p-4 rounded-xl ${trendConfig[insights.performance_trend]?.bg}`}>
                <p className="text-sm text-slate-600 dark:text-slate-400">Trend</p>
                <div className="flex items-center gap-2">
                  {React.createElement(trendConfig[insights.performance_trend]?.icon, { 
                    className: `w-6 h-6 ${trendConfig[insights.performance_trend]?.color}` 
                  })}
                  <span className={`text-xl font-bold capitalize ${trendConfig[insights.performance_trend]?.color}`}>
                    {insights.performance_trend}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-400">{insights.trend_analysis}</p>

            {/* Strengths */}
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
              <h4 className="font-semibold text-emerald-700 dark:text-emerald-400 mb-2 flex items-center gap-2">
                <Award className="w-4 h-4" /> Strengths
              </h4>
              <ul className="text-sm text-emerald-600 dark:text-emerald-300 space-y-1">
                {insights.strengths?.map((s, i) => <li key={i}>✓ {s}</li>)}
              </ul>
            </div>

            {/* Improvement Areas */}
            <div className="space-y-3">
              <h4 className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Target className="w-4 h-4 text-amber-500" /> Areas for Improvement
              </h4>
              {insights.improvement_areas?.map((area, i) => (
                <div key={i} className="p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-slate-700 dark:text-slate-300">{area.area}</span>
                    <Badge variant="outline">{area.current_level} → {area.target_level}</Badge>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{area.recommendation}</p>
                </div>
              ))}
            </div>

            {/* Skills Gaps */}
            {insights.skills_gaps?.length > 0 && (
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                <h4 className="font-semibold text-amber-700 dark:text-amber-400 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> Skills Gap Analysis
                </h4>
                <div className="space-y-2">
                  {insights.skills_gaps.map((gap, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-amber-700 dark:text-amber-300">{gap.skill}</span>
                      <div className="flex items-center gap-2">
                        <Badge className={gap.gap_severity === 'high' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}>
                          {gap.gap_severity}
                        </Badge>
                        <span className="text-xs text-slate-500">→ {gap.suggested_training}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Coaching Recommendations */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <h4 className="font-semibold text-blue-700 dark:text-blue-400 mb-2 flex items-center gap-2">
                <BookOpen className="w-4 h-4" /> Coaching Recommendations
              </h4>
              <ul className="text-sm text-blue-600 dark:text-blue-300 space-y-1">
                {insights.coaching_recommendations?.map((rec, i) => <li key={i}>• {rec}</li>)}
              </ul>
            </div>

            {/* Action Plan */}
            <div className="grid grid-cols-3 gap-3">
              {['day_30', 'day_60', 'day_90'].map(period => (
                <div key={period} className="p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg">
                  <h5 className="font-medium text-slate-700 dark:text-slate-300 mb-2 text-sm">
                    {period.replace('day_', '')} Days
                  </h5>
                  <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                    {insights.action_plan?.[period]?.map((item, i) => (
                      <li key={i}>• {item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}