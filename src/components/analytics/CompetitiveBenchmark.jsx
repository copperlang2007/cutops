import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { 
  Trophy, Sparkles, Loader2, TrendingUp, Users, Target
} from 'lucide-react';
import { toast } from 'sonner';

export default function CompetitiveBenchmark({ agents, licenses, contracts, commissions }) {
  const [benchmark, setBenchmark] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const generateBenchmark = async () => {
    setIsAnalyzing(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate competitive benchmarking analysis for this insurance agency:

AGENCY METRICS:
- Total Agents: ${agents.length}
- Ready to Sell: ${agents.filter(a => a.onboarding_status === 'ready_to_sell').length}
- Active Licenses: ${licenses.filter(l => l.status === 'active').length}
- Active Contracts: ${contracts.filter(c => ['active', 'contract_signed'].includes(c.contract_status)).length}
- Total Commissions: $${commissions.reduce((sum, c) => sum + (c.amount || 0), 0).toLocaleString()}

Compare against industry benchmarks for:
1. Onboarding speed (avg days to ready-to-sell)
2. License per agent ratio
3. Contract acquisition rate
4. Commission per agent
5. Retention metrics

Provide percentile rankings and improvement recommendations.`,
        response_json_schema: {
          type: "object",
          properties: {
            overall_rank: { type: "string" },
            percentile: { type: "number" },
            metrics: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  metric: { type: "string" },
                  your_value: { type: "number" },
                  industry_avg: { type: "number" },
                  top_10_percent: { type: "number" },
                  percentile: { type: "number" }
                }
              }
            },
            strengths: { type: "array", items: { type: "string" } },
            improvement_areas: { type: "array", items: { type: "string" } },
            recommendations: { type: "array", items: { type: "string" } }
          }
        }
      });

      setBenchmark(result);
      toast.success('Benchmark analysis complete');
    } catch (err) {
      toast.error('Failed to generate benchmark');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const radarData = benchmark?.metrics?.map(m => ({
    metric: m.metric.split(' ').slice(0, 2).join(' '),
    value: m.percentile,
    fullMark: 100
  })) || [];

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            Competitive Benchmark
          </CardTitle>
          <Button
            size="sm"
            onClick={generateBenchmark}
            disabled={isAnalyzing}
            className="bg-amber-500 hover:bg-amber-600"
          >
            {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!benchmark && !isAnalyzing && (
          <p className="text-sm text-slate-400 text-center py-6">
            Compare your agency against industry benchmarks
          </p>
        )}

        {benchmark && (
          <div className="space-y-4">
            {/* Overall Rank */}
            <div className="p-4 bg-gradient-to-r from-amber-50 to-amber-100 rounded-lg text-center">
              <Trophy className="w-8 h-8 mx-auto text-amber-600 mb-2" />
              <p className="text-2xl font-bold text-amber-800">{benchmark.overall_rank}</p>
              <p className="text-sm text-amber-700">Top {100 - benchmark.percentile}% of agencies</p>
            </div>

            {/* Radar Chart */}
            {radarData.length > 0 && (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar
                      name="Your Agency"
                      dataKey="value"
                      stroke="#f59e0b"
                      fill="#f59e0b"
                      fillOpacity={0.5}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Metrics */}
            <div className="space-y-2">
              {benchmark.metrics?.map((m, i) => (
                <div key={i} className="p-2 bg-slate-50 rounded">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-slate-700">{m.metric}</span>
                    <Badge variant="outline" className={
                      m.percentile >= 75 ? 'bg-emerald-100 text-emerald-700' :
                      m.percentile >= 50 ? 'bg-blue-100 text-blue-700' :
                      'bg-amber-100 text-amber-700'
                    }>
                      {m.percentile}th percentile
                    </Badge>
                  </div>
                  <Progress value={m.percentile} className="h-1.5" />
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>You: {m.your_value}</span>
                    <span>Avg: {m.industry_avg}</span>
                    <span>Top 10%: {m.top_10_percent}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Strengths & Improvements */}
            <div className="grid grid-cols-2 gap-3">
              {benchmark.strengths?.length > 0 && (
                <div className="p-2 bg-emerald-50 rounded-lg">
                  <p className="text-xs font-medium text-emerald-800 mb-1">Strengths</p>
                  <ul className="space-y-0.5">
                    {benchmark.strengths.slice(0, 3).map((s, i) => (
                      <li key={i} className="text-xs text-emerald-700">• {s}</li>
                    ))}
                  </ul>
                </div>
              )}
              {benchmark.improvement_areas?.length > 0 && (
                <div className="p-2 bg-amber-50 rounded-lg">
                  <p className="text-xs font-medium text-amber-800 mb-1">Focus Areas</p>
                  <ul className="space-y-0.5">
                    {benchmark.improvement_areas.slice(0, 3).map((a, i) => (
                      <li key={i} className="text-xs text-amber-700">• {a}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}