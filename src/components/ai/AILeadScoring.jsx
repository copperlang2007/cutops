import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Sparkles, Loader2, RefreshCw, TrendingUp, Users, Star,
  AlertTriangle, CheckCircle, Target
} from 'lucide-react';
import { toast } from 'sonner';

export default function AILeadScoring({ agents, licenses, contracts, checklistItems }) {
  const [scores, setScores] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeAgents = async () => {
    setIsAnalyzing(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze these insurance agents and predict their likelihood of success:

AGENTS:
${agents.slice(0, 15).map(a => {
  const agentLicenses = licenses.filter(l => l.agent_id === a.id);
  const agentContracts = contracts.filter(c => c.agent_id === a.id);
  const agentChecklist = checklistItems.filter(c => c.agent_id === a.id);
  const completionRate = agentChecklist.length > 0 
    ? Math.round((agentChecklist.filter(c => c.is_completed).length / agentChecklist.length) * 100)
    : 0;
  return `- ${a.first_name} ${a.last_name}: Status=${a.onboarding_status}, Licenses=${agentLicenses.length}, Contracts=${agentContracts.length}, Onboarding=${completionRate}%, Created=${a.created_date}`;
}).join('\n')}

Score each agent 0-100 based on:
1. Speed of onboarding completion
2. Number of licenses obtained
3. Contract acquisition rate
4. Engagement patterns (early activity signals success)
5. Background indicators (state, prior experience implied by quick progress)

Identify top performers, at-risk agents, and provide actionable recommendations.`,
        response_json_schema: {
          type: "object",
          properties: {
            agent_scores: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  success_score: { type: "number" },
                  risk_level: { type: "string" },
                  strengths: { type: "array", items: { type: "string" } },
                  concerns: { type: "array", items: { type: "string" } },
                  recommendation: { type: "string" }
                }
              }
            },
            top_performers: { type: "array", items: { type: "string" } },
            at_risk_agents: { type: "array", items: { type: "string" } },
            overall_insights: { type: "array", items: { type: "string" } }
          }
        }
      });

      setScores(result);
      toast.success('Lead scoring complete');
    } catch (err) {
      console.error('Scoring failed:', err);
      toast.error('Failed to analyze agents');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500" />
            AI Lead Scoring
          </CardTitle>
          <Button
            size="sm"
            onClick={analyzeAgents}
            disabled={isAnalyzing}
            className="bg-amber-500 hover:bg-amber-600"
          >
            {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!scores && !isAnalyzing && (
          <p className="text-sm text-slate-400 text-center py-6">
            Predict agent success likelihood based on onboarding patterns
          </p>
        )}

        {scores && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-emerald-50 rounded-lg text-center">
                <p className="text-lg font-bold text-emerald-700">{scores.top_performers?.length || 0}</p>
                <p className="text-xs text-emerald-600">Top Performers</p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg text-center">
                <p className="text-lg font-bold text-red-700">{scores.at_risk_agents?.length || 0}</p>
                <p className="text-xs text-red-600">At Risk</p>
              </div>
            </div>

            {/* Agent Scores */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {scores.agent_scores?.map((agent, i) => (
                <div key={i} className="p-2 bg-slate-50 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-700">{agent.name}</span>
                    <span className={`text-lg font-bold ${getScoreColor(agent.success_score)}`}>
                      {agent.success_score}
                    </span>
                  </div>
                  <Progress value={agent.success_score} className="h-1.5 mb-1" />
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={
                      agent.risk_level === 'low' ? 'bg-emerald-100 text-emerald-700' :
                      agent.risk_level === 'medium' ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }>
                      {agent.risk_level} risk
                    </Badge>
                    <span className="text-xs text-slate-500 truncate">{agent.recommendation}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Insights */}
            {scores.overall_insights?.length > 0 && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-sm font-medium text-blue-800 mb-2">Key Insights</h4>
                <ul className="space-y-1">
                  {scores.overall_insights.map((insight, i) => (
                    <li key={i} className="text-xs text-blue-700">• {insight}</li>
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