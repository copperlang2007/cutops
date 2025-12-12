import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2, RefreshCw, Trophy, AlertTriangle, TrendingUp } from 'lucide-react';

export default function LeaderboardAIInsights({ agents, teamAverages }) {
  const [insights, setInsights] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateInsights = async () => {
    setIsGenerating(true);
    try {
      const topPerformers = agents.slice(0, 3).map(a => ({
        name: `${a.first_name} ${a.last_name}`,
        score: a.metrics.overall,
        contracts: a.metrics.activeContracts,
        onboarding: a.metrics.onboarding
      }));

      const needsSupport = agents.filter(a => a.metrics.overall < teamAverages.overall - 10).slice(0, 3).map(a => ({
        name: `${a.first_name} ${a.last_name}`,
        score: a.metrics.overall,
        weakArea: a.metrics.onboarding < 50 ? 'onboarding' : 
                  a.metrics.licenses < 50 ? 'licenses' : 
                  a.metrics.tasks < 50 ? 'tasks' : 'overall'
      }));

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this team performance data and provide actionable insights:

TOP PERFORMERS:
${JSON.stringify(topPerformers, null, 2)}

AGENTS NEEDING SUPPORT (below team average):
${JSON.stringify(needsSupport, null, 2)}

TEAM AVERAGES:
- Overall: ${teamAverages.overall}%
- Onboarding: ${teamAverages.onboarding}%
- Licenses: ${teamAverages.licenses}%
- Contracts: ${teamAverages.contracts}%
- Tasks: ${teamAverages.tasks}%

Provide:
1. Key insights about top performers (what makes them successful)
2. Specific coaching recommendations for struggling agents
3. Team-wide improvement opportunities
4. Priority actions for managers`,
        response_json_schema: {
          type: "object",
          properties: {
            top_performer_insights: { type: "array", items: { type: "string" } },
            coaching_recommendations: { type: "array", items: { type: "string" } },
            team_opportunities: { type: "array", items: { type: "string" } },
            priority_actions: { type: "array", items: { type: "string" } }
          }
        }
      });

      setInsights(result);
    } catch (err) {
      console.error('Failed to generate insights:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            AI Insights
          </CardTitle>
          <Button
            size="sm"
            onClick={generateInsights}
            disabled={isGenerating}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : insights ? (
              <RefreshCw className="w-4 h-4" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!insights && !isGenerating && (
          <div className="text-center py-6 text-slate-400">
            <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Generate AI insights about team performance</p>
          </div>
        )}

        {insights && (
          <div className="space-y-4">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
              <h4 className="text-sm font-medium text-emerald-800 mb-2 flex items-center gap-1">
                <Trophy className="w-4 h-4" /> Top Performers
              </h4>
              <ul className="space-y-1">
                {insights.top_performer_insights?.slice(0, 3).map((insight, i) => (
                  <li key={i} className="text-xs text-emerald-700">• {insight}</li>
                ))}
              </ul>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <h4 className="text-sm font-medium text-amber-800 mb-2 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" /> Coaching Needed
              </h4>
              <ul className="space-y-1">
                {insights.coaching_recommendations?.slice(0, 3).map((rec, i) => (
                  <li key={i} className="text-xs text-amber-700">• {rec}</li>
                ))}
              </ul>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="text-sm font-medium text-blue-800 mb-2 flex items-center gap-1">
                <TrendingUp className="w-4 h-4" /> Priority Actions
              </h4>
              <ul className="space-y-1">
                {insights.priority_actions?.slice(0, 3).map((action, i) => (
                  <li key={i} className="text-xs text-blue-700">• {action}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}