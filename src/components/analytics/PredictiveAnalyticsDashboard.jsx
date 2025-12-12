import { useState, useMemo } from 'react'
import { base44 } from '@/api/base44Client'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell
} from 'recharts';
import { 
  Brain, Sparkles, Loader2, TrendingUp, TrendingDown, Users,
  DollarSign, Shield, AlertTriangle, Calendar, Target, Zap
} from 'lucide-react';
import { format, subMonths, differenceInDays } from 'date-fns'
import { toast } from 'sonner'

const COLORS = ['#0d9488', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function PredictiveAnalyticsDashboard({ 
  agents, 
  licenses, 
  contracts, 
  commissions,
  checklistItems,
  tasks,
  alerts
}) {
  const [predictions, setPredictions] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Calculate current metrics
  const currentMetrics = useMemo(() => {
    const now = new Date();
    const readyToSell = agents.filter(a => a.onboarding_status === 'ready_to_sell').length;
    const activeLicenses = licenses.filter(l => l.status === 'active').length;
    const activeContracts = contracts.filter(c => ['active', 'contract_signed'].includes(c.contract_status)).length;
    const totalCommission = commissions.reduce((sum, c) => sum + (c.amount || 0), 0);
    
    // Expiring items
    const expiringLicenses30 = licenses.filter(l => {
      if (!l.expiration_date) return false;
      const days = differenceInDays(new Date(l.expiration_date), now);
      return days > 0 && days <= 30;
    }).length;

    const expiringContracts60 = contracts.filter(c => {
      if (!c.expiration_date) return false;
      const days = differenceInDays(new Date(c.expiration_date), now);
      return days > 0 && days <= 60;
    }).length;

    // Onboarding velocity
    const recentAgents = agents.filter(a => 
      differenceInDays(now, new Date(a.created_date)) <= 30
    ).length;

    const completedOnboarding = agents.filter(a => 
      a.onboarding_status === 'ready_to_sell' &&
      differenceInDays(now, new Date(a.created_date)) <= 30
    ).length;

    return {
      totalAgents: agents.length,
      readyToSell,
      activeLicenses,
      activeContracts,
      totalCommission,
      expiringLicenses30,
      expiringContracts60,
      recentAgents,
      completedOnboarding,
      conversionRate: recentAgents > 0 ? Math.round((completedOnboarding / recentAgents) * 100) : 0
    };
  }, [agents, licenses, contracts, commissions]);

  // Generate trend data for charts
  const trendData = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(new Date(), i);
      const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

      const monthAgents = agents.filter(a => new Date(a.created_date) <= monthEnd).length;
      const monthRTS = agents.filter(a => 
        a.onboarding_status === 'ready_to_sell' && 
        new Date(a.created_date) <= monthEnd
      ).length;
      const monthCommissions = commissions
        .filter(c => c.payment_date && new Date(c.payment_date) >= monthStart && new Date(c.payment_date) <= monthEnd)
        .reduce((sum, c) => sum + (c.amount || 0), 0);

      months.push({
        month: format(monthDate, 'MMM'),
        agents: monthAgents,
        readyToSell: monthRTS,
        commissions: monthCommissions
      });
    }
    return months;
  }, [agents, commissions]);

  const generatePredictions = async () => {
    setIsAnalyzing(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this insurance agency data and generate predictive forecasts:

CURRENT STATE (${format(new Date(), 'MMM yyyy')}):
- Total Agents: ${currentMetrics.totalAgents}
- Ready to Sell: ${currentMetrics.readyToSell} (${Math.round((currentMetrics.readyToSell / Math.max(currentMetrics.totalAgents, 1)) * 100)}%)
- Active Licenses: ${currentMetrics.activeLicenses}
- Active Contracts: ${currentMetrics.activeContracts}
- Total Commission YTD: $${currentMetrics.totalCommission.toLocaleString()}
- Licenses Expiring (30 days): ${currentMetrics.expiringLicenses30}
- Contracts Expiring (60 days): ${currentMetrics.expiringContracts60}
- New Agents (30 days): ${currentMetrics.recentAgents}
- Onboarding Conversion: ${currentMetrics.conversionRate}%

HISTORICAL TREND:
${trendData.map(d => `${d.month}: ${d.agents} agents, ${d.readyToSell} RTS, $${d.commissions} commission`).join('\n')}

Generate predictions for the next 3 months including:
1. Agent growth forecast
2. Commission projection
3. Attrition/churn risk assessment
4. Compliance risk forecast (license/contract issues)
5. Peak performance periods
6. Resource allocation recommendations
7. Key risks and opportunities`,
        response_json_schema: {
          type: "object",
          properties: {
            agent_forecast: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  month: { type: "string" },
                  predicted_total: { type: "number" },
                  predicted_rts: { type: "number" },
                  confidence: { type: "number" }
                }
              }
            },
            commission_forecast: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  month: { type: "string" },
                  predicted_amount: { type: "number" },
                  low_estimate: { type: "number" },
                  high_estimate: { type: "number" }
                }
              }
            },
            attrition_risk: {
              type: "object",
              properties: {
                overall_risk: { type: "number" },
                high_risk_count: { type: "number" },
                factors: { type: "array", items: { type: "string" } },
                mitigation: { type: "array", items: { type: "string" } }
              }
            },
            compliance_forecast: {
              type: "object",
              properties: {
                license_renewals_needed: { type: "number" },
                contract_renewals_needed: { type: "number" },
                risk_score: { type: "number" },
                action_items: { type: "array", items: { type: "string" } }
              }
            },
            peak_periods: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  period: { type: "string" },
                  activity: { type: "string" },
                  recommendation: { type: "string" }
                }
              }
            },
            key_insights: { type: "array", items: { type: "string" } },
            opportunities: { type: "array", items: { type: "string" } },
            risks: { type: "array", items: { type: "string" } }
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

  // Combine historical and predicted data for charts
  const forecastChartData = useMemo(() => {
    if (!predictions?.agent_forecast) return trendData;
    
    return [
      ...trendData,
      ...predictions.agent_forecast.map(p => ({
        month: p.month,
        agents: p.predicted_total,
        readyToSell: p.predicted_rts,
        predicted: true
      }))
    ];
  }, [trendData, predictions]);

  const commissionForecastData = useMemo(() => {
    if (!predictions?.commission_forecast) return [];
    
    const historical = trendData.map(d => ({
      month: d.month,
      actual: d.commissions
    }));

    const forecast = predictions.commission_forecast.map(p => ({
      month: p.month,
      predicted: p.predicted_amount,
      low: p.low_estimate,
      high: p.high_estimate
    }));

    return [...historical, ...forecast];
  }, [trendData, predictions]);

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            AI Predictive Analytics
          </CardTitle>
          <Button
            size="sm"
            onClick={generatePredictions}
            disabled={isAnalyzing}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span className="ml-1">Generate Forecast</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview">
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="agents">Agent Forecast</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="risks">Risks</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            {/* Current Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <div className="p-3 bg-teal-50 rounded-lg text-center">
                <Users className="w-5 h-5 mx-auto text-teal-600 mb-1" />
                <p className="text-xl font-bold text-teal-700">{currentMetrics.totalAgents}</p>
                <p className="text-xs text-teal-600">Total Agents</p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-lg text-center">
                <Target className="w-5 h-5 mx-auto text-emerald-600 mb-1" />
                <p className="text-xl font-bold text-emerald-700">{currentMetrics.conversionRate}%</p>
                <p className="text-xs text-emerald-600">Conversion Rate</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg text-center">
                <DollarSign className="w-5 h-5 mx-auto text-blue-600 mb-1" />
                <p className="text-xl font-bold text-blue-700">${(currentMetrics.totalCommission / 1000).toFixed(0)}k</p>
                <p className="text-xs text-blue-600">Commission YTD</p>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg text-center">
                <AlertTriangle className="w-5 h-5 mx-auto text-amber-600 mb-1" />
                <p className="text-xl font-bold text-amber-700">{currentMetrics.expiringLicenses30}</p>
                <p className="text-xs text-amber-600">Expiring Soon</p>
              </div>
            </div>

            {/* Key Insights */}
            {predictions && (
              <div className="space-y-4">
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <h4 className="text-sm font-medium text-purple-800 mb-2 flex items-center gap-1">
                    <Sparkles className="w-4 h-4" />
                    Key Insights
                  </h4>
                  <ul className="space-y-1">
                    {predictions.key_insights?.map((insight, i) => (
                      <li key={i} className="text-xs text-purple-700">• {insight}</li>
                    ))}
                  </ul>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <h4 className="text-sm font-medium text-emerald-800 mb-1">Opportunities</h4>
                    <ul className="space-y-1">
                      {predictions.opportunities?.slice(0, 3).map((opp, i) => (
                        <li key={i} className="text-xs text-emerald-700">• {opp}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <h4 className="text-sm font-medium text-red-800 mb-1">Risks</h4>
                    <ul className="space-y-1">
                      {predictions.risks?.slice(0, 3).map((risk, i) => (
                        <li key={i} className="text-xs text-red-700">• {risk}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {!predictions && (
              <p className="text-sm text-slate-400 text-center py-8">
                Click "Generate Forecast" to see AI-powered predictions
              </p>
            )}
          </TabsContent>

          <TabsContent value="agents">
            <div className="h-64 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={forecastChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="agents" 
                    stroke="#0d9488" 
                    fill="#0d9488" 
                    fillOpacity={0.3}
                    name="Total Agents"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="readyToSell" 
                    stroke="#10b981" 
                    fill="#10b981" 
                    fillOpacity={0.3}
                    name="Ready to Sell"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {predictions?.agent_forecast && (
              <div className="grid grid-cols-3 gap-3">
                {predictions.agent_forecast.map((f, i) => (
                  <div key={i} className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-500">{f.month}</p>
                    <p className="text-lg font-bold text-slate-700">{f.predicted_total} agents</p>
                    <p className="text-xs text-emerald-600">{f.predicted_rts} RTS</p>
                    <Badge variant="outline" className="text-[10px] mt-1">
                      {f.confidence}% confidence
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="revenue">
            {commissionForecastData.length > 0 && (
              <div className="h-64 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={commissionForecastData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v) => `$${v.toLocaleString()}`} />
                    <Legend />
                    <Bar dataKey="actual" fill="#0d9488" name="Actual" />
                    <Bar dataKey="predicted" fill="#8b5cf6" name="Predicted" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {predictions?.commission_forecast && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-sm font-medium text-blue-800 mb-2">Revenue Forecast Summary</h4>
                <div className="grid grid-cols-3 gap-3">
                  {predictions.commission_forecast.map((f, i) => (
                    <div key={i}>
                      <p className="text-xs text-blue-600">{f.month}</p>
                      <p className="text-sm font-bold text-blue-800">${f.predicted_amount?.toLocaleString()}</p>
                      <p className="text-xs text-blue-500">
                        Range: ${f.low_estimate?.toLocaleString()} - ${f.high_estimate?.toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="risks">
            {predictions?.attrition_risk && (
              <div className="space-y-4">
                {/* Attrition Risk */}
                <div className={`p-4 rounded-lg ${
                  predictions.attrition_risk.overall_risk <= 30 ? 'bg-emerald-50 border border-emerald-200' :
                  predictions.attrition_risk.overall_risk <= 60 ? 'bg-amber-50 border border-amber-200' :
                  'bg-red-50 border border-red-200'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium">Attrition Risk</h4>
                    <span className="text-xl font-bold">{predictions.attrition_risk.overall_risk}%</span>
                  </div>
                  <Progress value={predictions.attrition_risk.overall_risk} className="h-2 mb-2" />
                  <p className="text-xs mb-2">
                    {predictions.attrition_risk.high_risk_count} agents at high risk
                  </p>
                  <div className="text-xs space-y-1">
                    <p className="font-medium">Risk Factors:</p>
                    {predictions.attrition_risk.factors?.map((f, i) => (
                      <p key={i}>• {f}</p>
                    ))}
                  </div>
                </div>

                {/* Compliance Forecast */}
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <h4 className="text-sm font-medium text-amber-800 mb-2">Compliance Forecast</h4>
                  <div className="grid grid-cols-2 gap-3 mb-2">
                    <div>
                      <p className="text-xs text-amber-600">License Renewals</p>
                      <p className="text-lg font-bold text-amber-800">
                        {predictions.compliance_forecast.license_renewals_needed}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-amber-600">Contract Renewals</p>
                      <p className="text-lg font-bold text-amber-800">
                        {predictions.compliance_forecast.contract_renewals_needed}
                      </p>
                    </div>
                  </div>
                  <div className="text-xs text-amber-700">
                    <p className="font-medium mb-1">Action Items:</p>
                    {predictions.compliance_forecast.action_items?.map((item, i) => (
                      <p key={i}>• {item}</p>
                    ))}
                  </div>
                </div>

                {/* Peak Periods */}
                {predictions.peak_periods?.length > 0 && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-800 mb-2">Peak Periods</h4>
                    {predictions.peak_periods.map((p, i) => (
                      <div key={i} className="mb-2 last:mb-0">
                        <p className="text-xs font-medium text-blue-700">{p.period}</p>
                        <p className="text-xs text-blue-600">{p.activity}</p>
                        <p className="text-xs text-blue-500">→ {p.recommendation}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {!predictions && (
              <p className="text-sm text-slate-400 text-center py-8">
                Generate predictions to see risk analysis
              </p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}