import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Sparkles, Loader2, TrendingUp, DollarSign, Target, Lightbulb } from 'lucide-react';
import { format, addMonths, subMonths } from 'date-fns';

export default function CommissionForecast({ commissions, agents, contracts }) {
  const [selectedAgent, setSelectedAgent] = useState('all');
  const [forecast, setForecast] = useState(null);
  const [isForecasting, setIsForecasting] = useState(false);

  const historicalData = useMemo(() => {
    const filtered = selectedAgent === 'all' 
      ? commissions 
      : commissions.filter(c => c.agent_id === selectedAgent);

    const monthly = {};
    filtered.forEach(c => {
      const month = format(new Date(c.created_date), 'yyyy-MM');
      monthly[month] = (monthly[month] || 0) + (c.amount || 0);
    });

    return Object.entries(monthly)
      .map(([month, amount]) => ({ month, amount, type: 'historical' }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12);
  }, [commissions, selectedAgent]);

  const currentMonthEarnings = useMemo(() => {
    const thisMonth = format(new Date(), 'yyyy-MM');
    const filtered = selectedAgent === 'all'
      ? commissions
      : commissions.filter(c => c.agent_id === selectedAgent);
    return filtered
      .filter(c => format(new Date(c.created_date), 'yyyy-MM') === thisMonth)
      .reduce((sum, c) => sum + (c.amount || 0), 0);
  }, [commissions, selectedAgent]);

  const generateForecast = async () => {
    setIsForecasting(true);
    try {
      const agentContracts = selectedAgent === 'all'
        ? contracts
        : contracts.filter(c => c.agent_id === selectedAgent);
      
      const activeContracts = agentContracts.filter(c => 
        ['active', 'contract_signed'].includes(c.contract_status)
      ).length;

      const avgMonthly = historicalData.length > 0
        ? historicalData.reduce((sum, d) => sum + d.amount, 0) / historicalData.length
        : 0;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Forecast commission earnings for the next 6 months:

HISTORICAL DATA (last ${historicalData.length} months):
${historicalData.map(d => `${d.month}: $${d.amount.toLocaleString()}`).join('\n')}

CURRENT CONTEXT:
- Active Contracts: ${activeContracts}
- Average Monthly: $${avgMonthly.toFixed(2)}
- Current Month So Far: $${currentMonthEarnings.toLocaleString()}

Based on:
1. Historical trends and seasonality
2. Active contract count
3. Industry patterns (Medicare AEP in Oct-Dec)

Provide:
1. Monthly forecast amounts for next 6 months
2. Confidence level
3. Key factors affecting forecast
4. Recommendations to maximize earnings`,
        response_json_schema: {
          type: "object",
          properties: {
            monthly_forecast: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  month: { type: "string" },
                  amount: { type: "number" },
                  confidence: { type: "number" }
                }
              }
            },
            total_forecast: { type: "number" },
            growth_rate: { type: "number" },
            key_factors: { type: "array", items: { type: "string" } },
            recommendations: { type: "array", items: { type: "string" } },
            risk_factors: { type: "array", items: { type: "string" } }
          }
        }
      });

      // Add forecast months to chart data
      const forecastData = result.monthly_forecast?.map(f => ({
        month: f.month,
        amount: f.amount,
        confidence: f.confidence,
        type: 'forecast'
      })) || [];

      setForecast({
        ...result,
        chartData: [...historicalData, ...forecastData]
      });
    } catch (err) {
      console.error('Forecast failed:', err);
    } finally {
      setIsForecasting(false);
    }
  };

  const getAgentName = (agentId) => {
    const agent = agents.find(a => a.id === agentId);
    return agent ? `${agent.first_name} ${agent.last_name}` : 'Unknown';
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-teal-600" />
            Earnings Forecast
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={selectedAgent} onValueChange={setSelectedAgent}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Agents</SelectItem>
                {agents.map(a => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.first_name} {a.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              onClick={generateForecast}
              disabled={isForecasting}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isForecasting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Current Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-3 bg-slate-50 rounded-lg text-center">
            <DollarSign className="w-5 h-5 mx-auto text-teal-600 mb-1" />
            <p className="text-lg font-bold text-slate-800">${currentMonthEarnings.toLocaleString()}</p>
            <p className="text-xs text-slate-500">This Month</p>
          </div>
          {forecast && (
            <>
              <div className="p-3 bg-emerald-50 rounded-lg text-center">
                <Target className="w-5 h-5 mx-auto text-emerald-600 mb-1" />
                <p className="text-lg font-bold text-emerald-700">${forecast.total_forecast?.toLocaleString()}</p>
                <p className="text-xs text-emerald-600">6-Month Forecast</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg text-center">
                <TrendingUp className="w-5 h-5 mx-auto text-blue-600 mb-1" />
                <p className="text-lg font-bold text-blue-700">{forecast.growth_rate > 0 ? '+' : ''}{forecast.growth_rate}%</p>
                <p className="text-xs text-blue-600">Projected Growth</p>
              </div>
            </>
          )}
        </div>

        {/* Chart */}
        <div className="h-64 mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={forecast?.chartData || historicalData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip 
                formatter={(value, name) => [`$${value.toLocaleString()}`, name === 'amount' ? 'Earnings' : name]}
              />
              <Area 
                type="monotone" 
                dataKey="amount" 
                stroke="#0d9488" 
                fill="#0d948833"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Forecast Insights */}
        {forecast && (
          <div className="space-y-4">
            {/* Key Factors */}
            {forecast.key_factors?.length > 0 && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-sm font-medium text-blue-800 mb-2">Key Factors</h4>
                <ul className="space-y-1">
                  {forecast.key_factors.map((factor, i) => (
                    <li key={i} className="text-xs text-blue-700">• {factor}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {forecast.recommendations?.length > 0 && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                <h4 className="text-sm font-medium text-emerald-800 mb-2 flex items-center gap-1">
                  <Lightbulb className="w-4 h-4" /> Maximize Earnings
                </h4>
                <ul className="space-y-1">
                  {forecast.recommendations.map((rec, i) => (
                    <li key={i} className="text-xs text-emerald-700">• {rec}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Risk Factors */}
            {forecast.risk_factors?.length > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <h4 className="text-sm font-medium text-amber-800 mb-2">Risk Factors</h4>
                <ul className="space-y-1">
                  {forecast.risk_factors.map((risk, i) => (
                    <li key={i} className="text-xs text-amber-700">• {risk}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {!forecast && !isForecasting && (
          <p className="text-sm text-slate-400 text-center py-4">
            Click the sparkle button to generate AI earnings forecast
          </p>
        )}
      </CardContent>
    </Card>
  );
}