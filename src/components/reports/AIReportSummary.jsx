import { useState } from 'react'
import { base44 } from '@/api/base44Client'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sparkles, Loader2, RefreshCw, FileText, Users, TrendingUp } from 'lucide-react'

export default function AIReportSummary({ metrics, agents, licenses, contracts }) {
  const [summary, setSummary] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateSummary = async () => {
    setIsGenerating(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an insurance agency operations analyst. Generate a comprehensive executive summary report based on the following data:

AGENT METRICS:
- Total Agents: ${metrics.totalAgents}
- Ready to Sell: ${metrics.readyToSell} (${metrics.readyToSellRate}%)
- In Progress: ${metrics.inProgress}
- Average Onboarding Completion: ${metrics.avgCompletionRate}%

LICENSE COMPLIANCE:
- Active Licenses: ${metrics.activeLicenses}
- Expiring Soon (60 days): ${metrics.expiringLicenses}
- Expired: ${metrics.expiredLicenses}
- Compliance Rate: ${metrics.licenseComplianceRate}%

CONTRACT STATUS:
- Active Contracts: ${metrics.activeContracts}
- Pending Contracts: ${metrics.pendingContracts}
- Requiring Correction: ${metrics.actionRequired}

ALERTS:
- Active Alerts: ${metrics.activeAlerts}
- Critical Alerts: ${metrics.criticalAlerts}

Please provide:
1. Executive Summary (2-3 sentences)
2. Key Highlights (3-4 bullet points)
3. Areas of Concern (2-3 bullet points)
4. Recommended Actions (3-4 prioritized items)
5. Performance Outlook (brief forward-looking statement)

Format the response in clear markdown with headers.`,
        response_json_schema: {
          type: "object",
          properties: {
            executive_summary: { type: "string" },
            key_highlights: { type: "array", items: { type: "string" } },
            areas_of_concern: { type: "array", items: { type: "string" } },
            recommended_actions: { type: "array", items: { type: "string" } },
            performance_outlook: { type: "string" }
          }
        }
      });
      setSummary(result);
    } catch (err) {
      console.error('Failed to generate summary:', err);
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
            AI-Generated Report Summary
          </CardTitle>
          <Button
            onClick={generateSummary}
            disabled={isGenerating}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : summary ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Regenerate
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Summary
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!summary && !isGenerating && (
          <div className="text-center py-12 text-slate-400">
            <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">AI Report Summary</p>
            <p className="text-sm mt-1">Click generate to create an AI-powered analysis of your data</p>
          </div>
        )}

        {summary && (
          <div className="space-y-6">
            {/* Executive Summary */}
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <h3 className="font-medium text-purple-800 mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Executive Summary
              </h3>
              <p className="text-sm text-purple-700">{summary.executive_summary}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Key Highlights */}
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                <h3 className="font-medium text-emerald-800 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Key Highlights
                </h3>
                <ul className="space-y-2">
                  {summary.key_highlights?.map((item, i) => (
                    <li key={i} className="text-sm text-emerald-700 flex items-start gap-2">
                      <span className="text-emerald-500 mt-1">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Areas of Concern */}
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <h3 className="font-medium text-amber-800 mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Areas of Concern
                </h3>
                <ul className="space-y-2">
                  {summary.areas_of_concern?.map((item, i) => (
                    <li key={i} className="text-sm text-amber-700 flex items-start gap-2">
                      <span className="text-amber-500 mt-1">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Recommended Actions */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-medium text-blue-800 mb-3">Recommended Actions</h3>
              <ol className="space-y-2">
                {summary.recommended_actions?.map((item, i) => (
                  <li key={i} className="text-sm text-blue-700 flex items-start gap-2">
                    <span className="bg-blue-200 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0">
                      {i + 1}
                    </span>
                    {item}
                  </li>
                ))}
              </ol>
            </div>

            {/* Performance Outlook */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <h3 className="font-medium text-slate-700 mb-2">Performance Outlook</h3>
              <p className="text-sm text-slate-600">{summary.performance_outlook}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}