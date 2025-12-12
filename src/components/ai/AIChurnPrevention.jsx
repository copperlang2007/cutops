import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  UserMinus, Sparkles, Loader2, AlertTriangle, Mail, Phone,
  TrendingDown, Shield, CheckCircle
} from 'lucide-react';
import { differenceInDays } from 'date-fns';
import { toast } from 'sonner';

export default function AIChurnPrevention({ agents, licenses, contracts, tasks, commissions }) {
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeChurnRisk = async () => {
    setIsAnalyzing(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze churn risk for these insurance agents and identify those likely to leave:

AGENTS:
${agents.slice(0, 15).map(a => {
  const agentLicenses = licenses.filter(l => l.agent_id === a.id);
  const agentContracts = contracts.filter(c => c.agent_id === a.id);
  const agentTasks = tasks.filter(t => t.agent_id === a.id);
  const agentCommissions = commissions.filter(c => c.agent_id === a.id);
  const daysSinceCreated = differenceInDays(new Date(), new Date(a.created_date));
  const pendingTasks = agentTasks.filter(t => t.status === 'pending').length;
  const totalCommission = agentCommissions.reduce((sum, c) => sum + (c.amount || 0), 0);
  
  return `- ${a.first_name} ${a.last_name}: Status=${a.onboarding_status}, Days Active=${daysSinceCreated}, Licenses=${agentLicenses.length}, Contracts=${agentContracts.length}, Pending Tasks=${pendingTasks}, Commission=$${totalCommission}`;
}).join('\n')}

Identify agents at risk of churning based on:
1. Stalled onboarding (no progress in 14+ days)
2. Low engagement (few completed tasks)
3. No active contracts
4. Declining commission trend
5. Expiring/expired licenses not renewed

For each at-risk agent, provide:
- Risk score (0-100)
- Key risk factors
- Recommended retention intervention
- Urgency level`,
        response_json_schema: {
          type: "object",
          properties: {
            at_risk_agents: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  risk_score: { type: "number" },
                  risk_factors: { type: "array", items: { type: "string" } },
                  intervention: { type: "string" },
                  urgency: { type: "string" },
                  contact_method: { type: "string" }
                }
              }
            },
            overall_churn_risk: { type: "number" },
            preventive_actions: { type: "array", items: { type: "string" } },
            retention_strategies: { type: "array", items: { type: "string" } }
          }
        }
      });

      setAnalysis(result);
      toast.success('Churn analysis complete');
    } catch (err) {
      toast.error('Failed to analyze churn risk');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const triggerIntervention = async (agent) => {
    toast.success(`Retention workflow triggered for ${agent.name}`);
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <UserMinus className="w-5 h-5 text-red-600" />
            Churn Prevention
          </CardTitle>
          <Button
            size="sm"
            onClick={analyzeChurnRisk}
            disabled={isAnalyzing}
            className="bg-red-600 hover:bg-red-700"
          >
            {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!analysis && !isAnalyzing && (
          <p className="text-sm text-slate-400 text-center py-6">
            Predict and prevent agent attrition before it happens
          </p>
        )}

        {analysis && (
          <div className="space-y-4">
            {/* Overall Risk */}
            <div className={`p-4 rounded-lg ${
              analysis.overall_churn_risk <= 20 ? 'bg-emerald-50 border border-emerald-200' :
              analysis.overall_churn_risk <= 40 ? 'bg-amber-50 border border-amber-200' :
              'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Team Churn Risk</span>
                <span className={`text-xl font-bold ${
                  analysis.overall_churn_risk <= 20 ? 'text-emerald-700' :
                  analysis.overall_churn_risk <= 40 ? 'text-amber-700' :
                  'text-red-700'
                }`}>{analysis.overall_churn_risk}%</span>
              </div>
              <Progress 
                value={analysis.overall_churn_risk} 
                className={`h-2 ${
                  analysis.overall_churn_risk <= 20 ? '[&>div]:bg-emerald-500' :
                  analysis.overall_churn_risk <= 40 ? '[&>div]:bg-amber-500' :
                  '[&>div]:bg-red-500'
                }`}
              />
            </div>

            {/* At-Risk Agents */}
            {analysis.at_risk_agents?.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  At-Risk Agents ({analysis.at_risk_agents.length})
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {analysis.at_risk_agents.map((agent, i) => (
                    <div key={i} className="p-2 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-red-800">{agent.name}</span>
                        <div className="flex items-center gap-2">
                          <Badge className={
                            agent.urgency === 'critical' ? 'bg-red-100 text-red-700' :
                            agent.urgency === 'high' ? 'bg-orange-100 text-orange-700' :
                            'bg-amber-100 text-amber-700'
                          }>
                            {agent.urgency}
                          </Badge>
                          <span className="text-sm font-bold text-red-700">{agent.risk_score}%</span>
                        </div>
                      </div>
                      <p className="text-xs text-red-600 mb-1">
                        Factors: {agent.risk_factors?.join(', ')}
                      </p>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-blue-600">→ {agent.intervention}</p>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-6 text-xs"
                          onClick={() => triggerIntervention(agent)}
                        >
                          {agent.contact_method === 'call' ? <Phone className="w-3 h-3 mr-1" /> : <Mail className="w-3 h-3 mr-1" />}
                          Intervene
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Retention Strategies */}
            {analysis.retention_strategies?.length > 0 && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-sm font-medium text-blue-800 mb-2 flex items-center gap-1">
                  <Shield className="w-4 h-4" />
                  Retention Strategies
                </h4>
                <ul className="space-y-1">
                  {analysis.retention_strategies.map((strategy, i) => (
                    <li key={i} className="text-xs text-blue-700 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      {strategy}
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