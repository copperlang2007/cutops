import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2, RefreshCw, AlertTriangle, TrendingUp, Flag, DollarSign } from 'lucide-react';

export default function CommissionAIAnalysis({ commissions, agents, contracts }) {
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const totalAmount = commissions.reduce((sum, c) => sum + (c.amount || 0), 0);
      const avgAmount = commissions.length > 0 ? totalAmount / commissions.length : 0;
      const byStatus = commissions.reduce((acc, c) => {
        acc[c.status] = (acc[c.status] || 0) + (c.amount || 0);
        return acc;
      }, {});

      const agentTotals = {};
      commissions.forEach(c => {
        agentTotals[c.agent_id] = (agentTotals[c.agent_id] || 0) + (c.amount || 0);
      });

      const potentialAnomalies = commissions.filter(c => 
        c.amount > avgAmount * 3 || c.amount < avgAmount * 0.1
      ).length;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze commission data for anomalies and insights:

SUMMARY:
- Total Commissions: $${totalAmount.toLocaleString()}
- Average per Transaction: $${avgAmount.toFixed(2)}
- Total Transactions: ${commissions.length}
- Potential Anomalies (>3x or <0.1x average): ${potentialAnomalies}

BY STATUS:
${Object.entries(byStatus).map(([s, a]) => `- ${s}: $${a.toLocaleString()}`).join('\n')}

TOP AGENTS BY COMMISSION:
${Object.entries(agentTotals)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 5)
  .map(([id, amt]) => {
    const agent = agents.find(a => a.id === id);
    return `- ${agent ? `${agent.first_name} ${agent.last_name}` : 'Unknown'}: $${amt.toLocaleString()}`;
  }).join('\n')}

Provide:
1. Anomalies or discrepancies that need review
2. Patterns in commission distribution
3. Recommendations for commission optimization
4. Risk areas to monitor
5. Projected earnings trend`,
        response_json_schema: {
          type: "object",
          properties: {
            anomalies: { type: "array", items: { type: "string" } },
            patterns: { type: "array", items: { type: "string" } },
            recommendations: { type: "array", items: { type: "string" } },
            risk_areas: { type: "array", items: { type: "string" } },
            earnings_projection: { type: "string" }
          }
        }
      });

      setAnalysis(result);
    } catch (err) {
      console.error('Analysis failed:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="border-0 shadow-sm lg:col-span-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              AI Commission Analysis
            </CardTitle>
            <Button
              onClick={runAnalysis}
              disabled={isAnalyzing}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : analysis ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Re-analyze
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Run Analysis
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!analysis && !isAnalyzing && (
            <div className="text-center py-8 text-slate-400">
              <Sparkles className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p>Run AI analysis to detect anomalies and get insights</p>
            </div>
          )}

          {analysis && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="font-medium text-red-800 mb-2 flex items-center gap-2">
                  <Flag className="w-4 h-4" /> Anomalies to Review
                </h4>
                <ul className="space-y-1">
                  {analysis.anomalies?.map((item, i) => (
                    <li key={i} className="text-sm text-red-700">• {item}</li>
                  ))}
                </ul>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" /> Patterns Detected
                </h4>
                <ul className="space-y-1">
                  {analysis.patterns?.map((item, i) => (
                    <li key={i} className="text-sm text-blue-700">• {item}</li>
                  ))}
                </ul>
              </div>

              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                <h4 className="font-medium text-emerald-800 mb-2 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" /> Recommendations
                </h4>
                <ul className="space-y-1">
                  {analysis.recommendations?.map((item, i) => (
                    <li key={i} className="text-sm text-emerald-700">• {item}</li>
                  ))}
                </ul>
              </div>

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <h4 className="font-medium text-amber-800 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> Risk Areas
                </h4>
                <ul className="space-y-1">
                  {analysis.risk_areas?.map((item, i) => (
                    <li key={i} className="text-sm text-amber-700">• {item}</li>
                  ))}
                </ul>
              </div>

              {analysis.earnings_projection && (
                <div className="md:col-span-2 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <h4 className="font-medium text-purple-800 mb-2">Earnings Projection</h4>
                  <p className="text-sm text-purple-700">{analysis.earnings_projection}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}