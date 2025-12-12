import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TrendingUp, Sparkles, Loader2, Target, AlertTriangle } from 'lucide-react'
import { base44 } from '@/api/base44Client'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'
import { format } from 'date-fns'

export default function AIPredictiveAnalytics({ agents, commissions, contracts, licenses }) {
  const [predictions, setPredictions] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [forecastPeriod, setForecastPeriod] = useState('3');

  const generatePredictions = async () => {
    setIsLoading(true);
    try {
      const historicalData = {
        totalAgents: agents.length,
        activeAgents: agents.filter(a => a.onboarding_status === 'ready_to_sell').length,
        totalCommissions: commissions.reduce((sum, c) => sum + (c.amount || 0), 0),
        activeContracts: contracts.filter(c => c.contract_status === 'active').length,
        activeLicenses: licenses.filter(l => l.status === 'active').length,
        monthlyTrend: calculateMonthlyTrend(commissions)
      };

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this insurance agency data and provide sales predictions for the next ${forecastPeriod} months.

Current Metrics:
- Total Agents: ${historicalData.totalAgents}
- Active Agents (Ready to Sell): ${historicalData.activeAgents}
- Total Commissions: $${historicalData.totalCommissions.toLocaleString()}
- Active Contracts: ${historicalData.activeContracts}
- Active Licenses: ${historicalData.activeLicenses}
- Monthly Commission Trend: ${JSON.stringify(historicalData.monthlyTrend)}

Provide detailed predictions including:
1. Expected commission growth/decline
2. Agent productivity forecast
3. Market opportunity analysis
4. Risk factors that could impact performance
5. Recommended actions to improve outcomes`,
        response_json_schema: {
          type: "object",
          properties: {
            forecast: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  month: { type: "string" },
                  predicted_commissions: { type: "number" },
                  predicted_policies: { type: "number" },
                  confidence: { type: "number" }
                }
              }
            },
            growth_rate: { type: "number" },
            key_insights: { type: "array", items: { type: "string" } },
            risk_factors: { type: "array", items: { type: "string" } },
            opportunities: { type: "array", items: { type: "string" } },
            recommended_actions: { type: "array", items: { type: "string" } },
            confidence_score: { type: "number" }
          }
        }
      });

      setPredictions(result);
      toast.success('Predictions generated successfully');
    } catch (err) {
      toast.error('Failed to generate predictions');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateMonthlyTrend = (commissions) => {
    const months = {};
    commissions.forEach(c => {
      if (c.created_date) {
        const month = format(new Date(c.created_date), 'yyyy-MM');
        months[month] = (months[month] || 0) + (c.amount || 0);
      }
    });
    return Object.entries(months).slice(-6).map(([month, amount]) => ({ month, amount }));
  };

  return (
    <Card className="border-0 shadow-premium dark:bg-slate-800/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2 dark:text-white">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            AI Predictive Analytics
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={forecastPeriod} onValueChange={setForecastPeriod}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 Months</SelectItem>
                <SelectItem value="6">6 Months</SelectItem>
                <SelectItem value="12">12 Months</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              onClick={generatePredictions}
              disabled={isLoading}
              className="bg-gradient-to-r from-emerald-600 to-teal-600"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
              {isLoading ? 'Analyzing...' : 'Generate Forecast'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!predictions ? (
          <div className="text-center py-12 text-slate-400">
            <TrendingUp className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p>Click "Generate Forecast" to get AI-powered sales predictions</p>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* Confidence & Growth */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                <p className="text-sm text-emerald-600 dark:text-emerald-400">Predicted Growth</p>
                <p className={`text-3xl font-bold ${predictions.growth_rate >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                  {predictions.growth_rate >= 0 ? '+' : ''}{predictions.growth_rate}%
                </p>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <p className="text-sm text-blue-600 dark:text-blue-400">Confidence Score</p>
                <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">{predictions.confidence_score}%</p>
              </div>
            </div>

            {/* Forecast Chart */}
            {predictions.forecast?.length > 0 && (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={predictions.forecast}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="predicted_commissions" stroke="#10b981" fill="#10b981" fillOpacity={0.2} name="Predicted Commissions" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Insights Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl">
                <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                  <Target className="w-4 h-4 text-blue-500" /> Key Insights
                </h4>
                <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                  {predictions.key_insights?.map((insight, i) => (
                    <li key={i}>• {insight}</li>
                  ))}
                </ul>
              </div>
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                <h4 className="font-semibold text-amber-700 dark:text-amber-300 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> Risk Factors
                </h4>
                <ul className="text-sm text-amber-600 dark:text-amber-400 space-y-1">
                  {predictions.risk_factors?.map((risk, i) => (
                    <li key={i}>• {risk}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Recommended Actions */}
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
              <h4 className="font-semibold text-purple-700 dark:text-purple-300 mb-2">Recommended Actions</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {predictions.recommended_actions?.map((action, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-purple-600 dark:text-purple-400">
                    <span className="text-purple-400">→</span> {action}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}