import { useState, useMemo } from 'react'
import { base44 } from '@/api/base44Client'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar
} from 'recharts';
import { 
  TrendingUp, Sparkles, Loader2, RefreshCw, Users, DollarSign,
  AlertTriangle, Calendar, Target, UserMinus, Shield
} from 'lucide-react';
import { toast } from 'sonner'

export default function AIPredictiveAnalytics({ 
  agents, 
  licenses, 
  contracts, 
  commissions,
  checklistItems,
  tasks 
}) {
  const [predictions, setPredictions] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const currentMetrics = useMemo(() => {
    const totalAgents = agents.length;
    const readyToSell = agents.filter(a => a.onboarding_status === 'ready_to_sell').length;
    const activeLicenses = licenses.filter(l => l.status === 'active').length;
    const activeContracts = contracts.filter(c => ['active', 'contract_signed'].includes(c.contract_status)).length;
    const totalCommissions = commissions.reduce((sum, c) => sum + (c.amount || 0), 0);
    const avgOnboarding = checklistItems.length > 0
      ? Math.round((checklistItems.filter(c => c.is_completed).length / checklistItems.length) * 100)
      : 0;

    return {
      totalAgents,
      readyToSell,
      activeLicenses,
      activeContracts,
      totalCommissions,
      avgOnboarding
    };
  }, [agents, licenses, contracts, commissions, checklistItems]);

  const generatePredictions = async () => {
    setIsAnalyzing(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate predictive analytics for this insurance agency:

CURRENT STATE:
- Total Agents: ${currentMetrics.totalAgents}
- Ready to Sell: ${currentMetrics.readyToSell}
- Active Licenses: ${currentMetrics.activeLicenses}
- Active Contracts: ${currentMetrics.activeContracts}
- Total Commissions: $${currentMetrics.totalCommissions.toLocaleString()}
- Avg Onboarding Completion: ${currentMetrics.avgOnboarding}%

AGENT DETAILS:
${agents.slice(0, 10).map(a => `- ${a.first_name} ${a.last_name}: Status=${a.onboarding_status}, Created=${a.created_date}`).join('\n')}

LICENSE EXPIRATIONS (next 90 days):
${licenses.filter(l => l.expiration_date).slice(0, 10).map(l => `- ${l.state}: ${l.expiration_date}`).join('\n')}

CONTRACT STATUS:
${contracts.slice(0, 10).map(c => `- ${c.carrier_name}: ${c.contract_status}`).join('\n')}

Generate predictions for the next 6 months:
1. Agent attrition risk - identify agents likely to leave based on activity patterns
2. Commission forecasts - monthly projections
3. Compliance risk predictions - upcoming issues
4. Peak performance periods - when to expect high/low activity
5. Onboarding completion predictions
6. Resource allocation recommendations`,
        response_json_schema: {
          type: "object",
          properties: {
            attrition_risk: {
              type: "object",
              properties: {
                high_risk_agents: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      risk_score: { type: "number" },
                      factors: { type: "array", items: { type: "string" } },
                      recommended_action: { type: "string" }
                    }
                  }
                },
                overall_attrition_rate: { type: "number" },
                trend: { type: "string" }
              }
            },
            commission_forecast: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  month: { type: "string" },
                  predicted_amount: { type: "number" },
                  confidence: { type: "number" },
                  factors: { type: "array", items: { type: "string" } }
                }
              }
            },
            compliance_predictions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  issue_type: { type: "string" },
                  predicted_date: { type: "string" },
                  affected_agents: { type: "number" },
                  severity: { type: "string" },
                  preventive_action: { type: "string" }
                }
              }
            },
            performance_periods: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  period: { type: "string" },
                  expected_activity: { type: "string" },
                  reason: { type: "string" },
                  recommendations: { type: "array", items: { type: "string" } }
                }
              }
            },
            onboarding_predictions: {
              type: "object",
              properties: {
                expected_completions_30d: { type: "number" },
                expected_completions_90d: { type: "number" },
                bottlenecks: { type: "array", items: { type: "string" } },
                improvement_suggestions: { type: "array", items: { type: "string" } }
              }
            },
            resource_recommendations: { type: "array", items: { type: "string" } },
            key_insights: { type: "array", items: { type: "string" } }
          }
        }
      });

      setPredictions(result);
      toast.success('Predictive analysis complete');
    } catch (err) {
      console.error('Prediction failed:', err);
      toast.error('Failed to generate predictions');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            AI Predictive Analytics
          </CardTitle>
          <Button
            size="sm"
            onClick={generatePredictions}
            disabled={isAnalyzing}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : predictions ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Predictions
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!predictions && !isAnalyzing && (
          <div className="text-center py-8 text-slate-400">
            <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Generate AI predictions for future trends and insights</p>
          </div>
        )}

        {predictions && (
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="w-full grid grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="attrition">Attrition</TabsTrigger>
              <TabsTrigger value="commissions">Commissions</TabsTrigger>
              <TabsTrigger value="compliance">Compliance</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              {/* Key Insights */}
              {predictions.key_insights?.length > 0 && (
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <h4 className="text-sm font-medium text-purple-800 mb-2 flex items-center gap-1">
                    <Sparkles className="w-4 h-4" /> Key Insights
                  </h4>
                  <ul className="space-y-1">
                    {predictions.key_insights.map((insight, i) => (
                      <li key={i} className="text-xs text-purple-700">• {insight}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Performance Periods */}
              {predictions.performance_periods?.length > 0 && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-800 mb-2 flex items-center gap-1">
                    <Calendar className="w-4 h-4" /> Performance Forecast
                  </h4>
                  <div className="space-y-2">
                    {predictions.performance_periods.map((period, i) => (
                      <div key={i} className="p-2 bg-white rounded">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-blue-700">{period.period}</span>
                          <Badge variant="outline" className={
                            period.expected_activity === 'high' ? 'bg-emerald-100 text-emerald-700' :
                            period.expected_activity === 'low' ? 'bg-amber-100 text-amber-700' :
                            'bg-blue-100 text-blue-700'
                          }>
                            {period.expected_activity} activity
                          </Badge>
                        </div>
                        <p className="text-xs text-blue-600">{period.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Onboarding Predictions */}
              {predictions.onboarding_predictions && (
                <div className="p-4 bg-teal-50 border border-teal-200 rounded-lg">
                  <h4 className="text-sm font-medium text-teal-800 mb-2 flex items-center gap-1">
                    <Target className="w-4 h-4" /> Onboarding Forecast
                  </h4>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="p-2 bg-white rounded text-center">
                      <p className="text-lg font-bold text-teal-700">
                        {predictions.onboarding_predictions.expected_completions_30d}
                      </p>
                      <p className="text-xs text-teal-600">Expected in 30 days</p>
                    </div>
                    <div className="p-2 bg-white rounded text-center">
                      <p className="text-lg font-bold text-teal-700">
                        {predictions.onboarding_predictions.expected_completions_90d}
                      </p>
                      <p className="text-xs text-teal-600">Expected in 90 days</p>
                    </div>
                  </div>
                  {predictions.onboarding_predictions.bottlenecks?.length > 0 && (
                    <div className="text-xs text-teal-700">
                      <strong>Bottlenecks:</strong> {predictions.onboarding_predictions.bottlenecks.join(', ')}
                    </div>
                  )}
                </div>
              )}

              {/* Resource Recommendations */}
              {predictions.resource_recommendations?.length > 0 && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                  <h4 className="text-sm font-medium text-slate-700 mb-2">Resource Recommendations</h4>
                  <ul className="space-y-1">
                    {predictions.resource_recommendations.map((rec, i) => (
                      <li key={i} className="text-xs text-slate-600">• {rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </TabsContent>

            <TabsContent value="attrition" className="space-y-4">
              {predictions.attrition_risk && (
                <>
                  <div className={`p-4 rounded-lg border ${
                    predictions.attrition_risk.overall_attrition_rate <= 10 ? 'bg-emerald-50 border-emerald-200' :
                    predictions.attrition_risk.overall_attrition_rate <= 20 ? 'bg-amber-50 border-amber-200' :
                    'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <UserMinus className="w-5 h-5" />
                        <span className="font-medium">Predicted Attrition Rate</span>
                      </div>
                      <span className="text-2xl font-bold">
                        {predictions.attrition_risk.overall_attrition_rate}%
                      </span>
                    </div>
                    <p className="text-sm mt-1">Trend: {predictions.attrition_risk.trend}</p>
                  </div>

                  {predictions.attrition_risk.high_risk_agents?.length > 0 && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <h4 className="text-sm font-medium text-red-800 mb-3">High Risk Agents</h4>
                      <div className="space-y-2">
                        {predictions.attrition_risk.high_risk_agents.map((agent, i) => (
                          <div key={i} className="p-2 bg-white rounded border border-red-100">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-red-700">{agent.name}</span>
                              <Badge className="bg-red-100 text-red-700">
                                Risk: {agent.risk_score}%
                              </Badge>
                            </div>
                            <p className="text-xs text-red-600 mb-1">
                              Factors: {agent.factors?.join(', ')}
                            </p>
                            <p className="text-xs text-blue-600">
                              → {agent.recommended_action}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="commissions" className="space-y-4">
              {predictions.commission_forecast?.length > 0 && (
                <>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={predictions.commission_forecast}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip formatter={(v) => `$${v.toLocaleString()}`} />
                        <Area 
                          type="monotone" 
                          dataKey="predicted_amount" 
                          stroke="#8b5cf6" 
                          fill="#8b5cf633"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="space-y-2">
                    {predictions.commission_forecast.slice(0, 3).map((month, i) => (
                      <div key={i} className="p-3 bg-slate-50 rounded-lg flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-700">{month.month}</p>
                          <p className="text-xs text-slate-500">
                            {month.factors?.join(', ')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-purple-600">
                            ${month.predicted_amount?.toLocaleString()}
                          </p>
                          <p className="text-xs text-slate-500">
                            {month.confidence}% confidence
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="compliance" className="space-y-4">
              {predictions.compliance_predictions?.length > 0 ? (
                <div className="space-y-2">
                  {predictions.compliance_predictions.map((pred, i) => (
                    <div key={i} className={`p-3 rounded-lg border ${
                      pred.severity === 'high' ? 'bg-red-50 border-red-200' :
                      pred.severity === 'medium' ? 'bg-amber-50 border-amber-200' :
                      'bg-blue-50 border-blue-200'
                    }`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{pred.issue_type}</span>
                        <Badge variant="outline" className={
                          pred.severity === 'high' ? 'bg-red-100 text-red-700' :
                          pred.severity === 'medium' ? 'bg-amber-100 text-amber-700' :
                          'bg-blue-100 text-blue-700'
                        }>
                          {pred.severity}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-600">
                        Expected: {pred.predicted_date} | Affects {pred.affected_agents} agents
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        Prevention: {pred.preventive_action}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400 text-center py-4">No compliance issues predicted</p>
              )}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}