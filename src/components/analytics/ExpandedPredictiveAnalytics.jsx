import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, Legend, RadarChart,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { 
  Brain, Sparkles, Loader2, TrendingUp, TrendingDown, Users,
  DollarSign, Shield, AlertTriangle, Calendar, Target, Zap,
  Clock, CheckCircle, Activity
} from 'lucide-react';
import { format, addMonths, subMonths, differenceInDays, startOfMonth, endOfMonth } from 'date-fns';
import { toast } from 'sonner';

export default function ExpandedPredictiveAnalytics({ 
  agents, 
  licenses, 
  contracts, 
  commissions,
  checklistItems,
  tasks,
  alerts,
  onCreateTask
}) {
  const [predictions, setPredictions] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Current metrics calculation
  const currentMetrics = useMemo(() => {
    const now = new Date();
    
    // Compliance risk agents
    const complianceRiskAgents = agents.filter(agent => {
      const agentLicenses = licenses.filter(l => l.agent_id === agent.id);
      const agentContracts = contracts.filter(c => c.agent_id === agent.id);
      
      const expiringLicense = agentLicenses.some(l => {
        if (!l.expiration_date) return false;
        const days = differenceInDays(new Date(l.expiration_date), now);
        return days > 0 && days <= 60;
      });
      
      const expiringContract = agentContracts.some(c => {
        if (!c.expiration_date) return false;
        const days = differenceInDays(new Date(c.expiration_date), now);
        return days > 0 && days <= 60;
      });
      
      return expiringLicense || expiringContract;
    });

    // Historical performance by month
    const monthlyPerformance = [];
    for (let i = 11; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      
      const monthCommissions = commissions.filter(c => {
        if (!c.payment_date) return false;
        const date = new Date(c.payment_date);
        return date >= monthStart && date <= monthEnd;
      }).reduce((sum, c) => sum + (c.amount || 0), 0);
      
      const monthAgents = agents.filter(a => new Date(a.created_date) <= monthEnd).length;
      
      monthlyPerformance.push({
        month: format(monthDate, 'MMM'),
        fullMonth: format(monthDate, 'MMMM yyyy'),
        commissions: monthCommissions,
        agents: monthAgents
      });
    }

    return {
      complianceRiskAgents,
      complianceRiskCount: complianceRiskAgents.length,
      monthlyPerformance,
      totalAgents: agents.length,
      readyToSell: agents.filter(a => a.onboarding_status === 'ready_to_sell').length
    };
  }, [agents, licenses, contracts, commissions]);

  const generatePredictions = async () => {
    setIsAnalyzing(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Perform comprehensive predictive analytics for this insurance agency:

HISTORICAL DATA (12 months):
${currentMetrics.monthlyPerformance.map(m => 
  `${m.fullMonth}: $${m.commissions.toLocaleString()} commission, ${m.agents} agents`
).join('\n')}

CURRENT STATE:
- Total Agents: ${currentMetrics.totalAgents}
- Ready to Sell: ${currentMetrics.readyToSell}
- At Compliance Risk: ${currentMetrics.complianceRiskCount}

AGENTS AT COMPLIANCE RISK:
${currentMetrics.complianceRiskAgents.slice(0, 10).map(a => {
  const agentLicenses = licenses.filter(l => l.agent_id === a.id);
  const expiringLicenses = agentLicenses.filter(l => {
    if (!l.expiration_date) return false;
    const days = differenceInDays(new Date(l.expiration_date), new Date());
    return days > 0 && days <= 60;
  });
  return `- ${a.first_name} ${a.last_name}: ${expiringLicenses.length} expiring licenses, Status: ${a.onboarding_status}`;
}).join('\n')}

Generate comprehensive predictions:

1. PEAK SALES PERIODS: Identify optimal sales periods based on historical patterns (AEP, OEP, etc.)
2. AGENT PERFORMANCE FORECAST: Predict next quarter performance scores for top/bottom agents
3. COMPLIANCE RISK FORECAST: Identify agents at risk before issues arise
4. REVENUE PROJECTIONS: 3-month forecast with confidence intervals
5. MANAGEMENT INTERVENTIONS: Specific proactive recommendations

Be specific with dates, names, and numbers.`,
        response_json_schema: {
          type: "object",
          properties: {
            peak_sales_periods: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  period_name: { type: "string" },
                  start_date: { type: "string" },
                  end_date: { type: "string" },
                  expected_volume_increase: { type: "number" },
                  preparation_tasks: { type: "array", items: { type: "string" } },
                  optimal_activity_times: { type: "array", items: { type: "string" } }
                }
              }
            },
            agent_performance_forecast: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  agent_name: { type: "string" },
                  current_score: { type: "number" },
                  predicted_score: { type: "number" },
                  trend: { type: "string" },
                  key_factors: { type: "array", items: { type: "string" } },
                  recommended_actions: { type: "array", items: { type: "string" } }
                }
              }
            },
            compliance_risk_forecast: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  agent_name: { type: "string" },
                  risk_type: { type: "string" },
                  risk_level: { type: "string" },
                  days_until_issue: { type: "number" },
                  specific_items: { type: "array", items: { type: "string" } },
                  preventive_actions: { type: "array", items: { type: "string" } },
                  auto_task_recommended: { type: "boolean" }
                }
              }
            },
            revenue_forecast: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  month: { type: "string" },
                  predicted_revenue: { type: "number" },
                  low_estimate: { type: "number" },
                  high_estimate: { type: "number" },
                  confidence: { type: "number" },
                  key_drivers: { type: "array", items: { type: "string" } }
                }
              }
            },
            management_interventions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  priority: { type: "string" },
                  intervention_type: { type: "string" },
                  target: { type: "string" },
                  action: { type: "string" },
                  expected_impact: { type: "string" },
                  deadline: { type: "string" },
                  create_task: { type: "boolean" }
                }
              }
            },
            overall_health_score: { type: "number" },
            key_insights: { type: "array", items: { type: "string" } }
          }
        }
      });

      setPredictions(result);
      toast.success('Predictions generated');
    } catch (err) {
      toast.error('Failed to generate predictions');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const createInterventionTask = async (intervention) => {
    const taskData = {
      title: intervention.action,
      description: `Priority: ${intervention.priority}\nTarget: ${intervention.target}\nExpected Impact: ${intervention.expected_impact}`,
      task_type: intervention.intervention_type === 'compliance' ? 'compliance' : 
                 intervention.intervention_type === 'training' ? 'other' : 'follow_up',
      priority: intervention.priority === 'critical' ? 'urgent' : 
                intervention.priority === 'high' ? 'high' : 'medium',
      due_date: intervention.deadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      auto_generated: true
    };
    
    await onCreateTask?.(taskData);
    toast.success('Task created');
  };

  const historicalChartData = currentMetrics.monthlyPerformance.map(m => ({
    ...m,
    commissions: m.commissions / 1000
  }));

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            Expanded Predictive Analytics
          </CardTitle>
          <Button
            size="sm"
            onClick={generatePredictions}
            disabled={isAnalyzing}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span className="ml-1">Generate Predictions</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview">
          <TabsList className="mb-4 flex-wrap">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="peak">Peak Periods</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="compliance">Compliance Risk</TabsTrigger>
            <TabsTrigger value="interventions">Interventions</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            {/* Health Score */}
            {predictions && (
              <div className={`p-4 rounded-lg mb-4 ${
                predictions.overall_health_score >= 70 ? 'bg-emerald-50 border border-emerald-200' :
                predictions.overall_health_score >= 50 ? 'bg-amber-50 border border-amber-200' :
                'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Agency Health Score</span>
                  <span className="text-2xl font-bold">{predictions.overall_health_score}/100</span>
                </div>
                <Progress value={predictions.overall_health_score} className="h-2" />
              </div>
            )}

            {/* Historical Chart */}
            <div className="h-48 mb-4">
              <p className="text-sm font-medium text-slate-700 mb-2">12-Month Performance</p>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={historicalChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `$${v}k`} />
                  <Tooltip formatter={(v) => `$${(v * 1000).toLocaleString()}`} />
                  <Area type="monotone" dataKey="commissions" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Key Insights */}
            {predictions?.key_insights && (
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <h4 className="text-sm font-medium text-purple-800 mb-2">Key Insights</h4>
                <ul className="space-y-1">
                  {predictions.key_insights.map((insight, i) => (
                    <li key={i} className="text-xs text-purple-700">• {insight}</li>
                  ))}
                </ul>
              </div>
            )}

            {!predictions && (
              <p className="text-sm text-slate-400 text-center py-6">
                Click "Generate Predictions" for AI-powered insights
              </p>
            )}
          </TabsContent>

          <TabsContent value="peak">
            {predictions?.peak_sales_periods?.length > 0 ? (
              <div className="space-y-3">
                {predictions.peak_sales_periods.map((period, i) => (
                  <div key={i} className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-amber-800">{period.period_name}</h4>
                        <p className="text-xs text-amber-600">{period.start_date} - {period.end_date}</p>
                      </div>
                      <Badge className="bg-amber-100 text-amber-700">
                        +{period.expected_volume_increase}% Volume
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      <div>
                        <p className="text-xs font-medium text-amber-700 mb-1">Preparation Tasks:</p>
                        <ul className="text-xs text-amber-600">
                          {period.preparation_tasks?.slice(0, 3).map((task, j) => (
                            <li key={j}>• {task}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-amber-700 mb-1">Optimal Activity:</p>
                        <ul className="text-xs text-amber-600">
                          {period.optimal_activity_times?.map((time, j) => (
                            <li key={j}>• {time}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 text-center py-6">Generate predictions to see peak periods</p>
            )}
          </TabsContent>

          <TabsContent value="performance">
            {predictions?.agent_performance_forecast?.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {predictions.agent_performance_forecast.map((agent, i) => (
                  <div key={i} className="p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{agent.agent_name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-500">{agent.current_score}</span>
                        <span className="text-slate-400">→</span>
                        <span className={`text-sm font-bold ${
                          agent.predicted_score > agent.current_score ? 'text-emerald-600' : 'text-red-600'
                        }`}>{agent.predicted_score}</span>
                        {agent.trend === 'up' ? (
                          <TrendingUp className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-slate-600">
                      <p className="mb-1">Key Factors: {agent.key_factors?.join(', ')}</p>
                      <p>Actions: {agent.recommended_actions?.slice(0, 2).join('; ')}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 text-center py-6">Generate predictions to see performance forecast</p>
            )}
          </TabsContent>

          <TabsContent value="compliance">
            {predictions?.compliance_risk_forecast?.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {predictions.compliance_risk_forecast.map((risk, i) => (
                  <div key={i} className={`p-3 rounded-lg border ${
                    risk.risk_level === 'critical' ? 'bg-red-50 border-red-200' :
                    risk.risk_level === 'high' ? 'bg-orange-50 border-orange-200' :
                    'bg-amber-50 border-amber-200'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="font-medium">{risk.agent_name}</span>
                        <Badge className="ml-2" variant="outline">{risk.risk_type}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={
                          risk.risk_level === 'critical' ? 'bg-red-100 text-red-700' :
                          risk.risk_level === 'high' ? 'bg-orange-100 text-orange-700' :
                          'bg-amber-100 text-amber-700'
                        }>{risk.risk_level}</Badge>
                        <span className="text-sm font-medium">{risk.days_until_issue} days</span>
                      </div>
                    </div>
                    <p className="text-xs mb-2">Issues: {risk.specific_items?.join(', ')}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-slate-600">Actions: {risk.preventive_actions?.slice(0, 2).join('; ')}</p>
                      {risk.auto_task_recommended && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-6 text-xs"
                          onClick={() => createInterventionTask({
                            priority: risk.risk_level,
                            intervention_type: 'compliance',
                            target: risk.agent_name,
                            action: risk.preventive_actions?.[0] || 'Review compliance status',
                            expected_impact: 'Prevent compliance violation',
                            deadline: new Date(Date.now() + risk.days_until_issue * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                          })}
                        >
                          Create Task
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 text-center py-6">Generate predictions to see compliance risks</p>
            )}
          </TabsContent>

          <TabsContent value="interventions">
            {predictions?.management_interventions?.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {predictions.management_interventions.map((intervention, i) => (
                  <div key={i} className={`p-3 rounded-lg border ${
                    intervention.priority === 'critical' ? 'bg-red-50 border-red-200' :
                    intervention.priority === 'high' ? 'bg-orange-50 border-orange-200' :
                    'bg-blue-50 border-blue-200'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge className={
                          intervention.priority === 'critical' ? 'bg-red-100 text-red-700' :
                          intervention.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                          'bg-blue-100 text-blue-700'
                        }>{intervention.priority}</Badge>
                        <span className="font-medium text-sm">{intervention.intervention_type}</span>
                      </div>
                      <span className="text-xs text-slate-500">Target: {intervention.target}</span>
                    </div>
                    <p className="text-sm mb-1">{intervention.action}</p>
                    <p className="text-xs text-slate-600 mb-2">Impact: {intervention.expected_impact}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">Deadline: {intervention.deadline}</span>
                      {intervention.create_task && (
                        <Button 
                          size="sm" 
                          className="h-6 text-xs"
                          onClick={() => createInterventionTask(intervention)}
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Create Task
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 text-center py-6">Generate predictions to see interventions</p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}