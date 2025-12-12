import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, RefreshCw, MessageSquare, Copy } from 'lucide-react';
import { toast } from 'sonner';

export default function AIPerformanceSummary({ 
  agent, 
  licenses = [], 
  contracts = [], 
  checklistItems = [] 
}) {
  const [summary, setSummary] = useState(null);
  const [talkingPoints, setTalkingPoints] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateSummary = async () => {
    setIsGenerating(true);
    try {
      const completedChecklist = checklistItems.filter(c => c.is_completed).length;
      const totalChecklist = checklistItems.length;
      const activeLicenses = licenses.filter(l => l.status === 'active').length;
      const activeContracts = contracts.filter(c => ['active', 'contract_signed'].includes(c.contract_status)).length;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate a performance summary and talking points for a manager-agent review meeting.

AGENT INFORMATION:
Name: ${agent.first_name} ${agent.last_name}
Status: ${agent.onboarding_status}
NPN: ${agent.npn}

ONBOARDING PROGRESS:
- Completed Items: ${completedChecklist}/${totalChecklist}
- Completion Rate: ${totalChecklist > 0 ? Math.round((completedChecklist/totalChecklist) * 100) : 0}%

LICENSES:
- Active: ${activeLicenses}
- Total: ${licenses.length}
- States: ${licenses.map(l => l.state).join(', ') || 'None'}

CONTRACTS:
- Active: ${activeContracts}
- Total: ${contracts.length}
- Carriers: ${contracts.map(c => c.carrier_name).join(', ') || 'None'}

Please provide:
1. A brief performance summary (2-3 sentences)
2. Key strengths (2-3 bullet points)
3. Areas for improvement (2-3 bullet points)
4. Talking points for the review meeting (4-5 items)
5. Recommended goals for next quarter (3-4 items)`,
        response_json_schema: {
          type: "object",
          properties: {
            performance_summary: { type: "string" },
            strengths: { type: "array", items: { type: "string" } },
            improvements: { type: "array", items: { type: "string" } },
            talking_points: { type: "array", items: { type: "string" } },
            recommended_goals: { type: "array", items: { type: "string" } }
          }
        }
      });

      setSummary(result);
      setTalkingPoints(result.talking_points);
    } catch (err) {
      console.error('Failed to generate summary:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (!summary) return;
    const text = `
Performance Summary for ${agent.first_name} ${agent.last_name}

${summary.performance_summary}

Strengths:
${summary.strengths?.map(s => `• ${s}`).join('\n')}

Areas for Improvement:
${summary.improvements?.map(i => `• ${i}`).join('\n')}

Talking Points:
${summary.talking_points?.map((t, i) => `${i + 1}. ${t}`).join('\n')}

Recommended Goals:
${summary.recommended_goals?.map(g => `• ${g}`).join('\n')}
    `;
    navigator.clipboard.writeText(text);
    toast.success('Summary copied to clipboard');
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-purple-600" />
            AI Performance Summary
          </CardTitle>
          <div className="flex gap-2">
            {summary && (
              <Button variant="outline" size="sm" onClick={copyToClipboard}>
                <Copy className="w-4 h-4 mr-1" />
                Copy
              </Button>
            )}
            <Button
              onClick={generateSummary}
              disabled={isGenerating}
              size="sm"
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
                  Generate
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!summary && !isGenerating && (
          <div className="text-center py-8 text-slate-400">
            <Sparkles className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Generate an AI-powered performance summary and talking points</p>
          </div>
        )}

        {summary && (
          <div className="space-y-4">
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <h4 className="text-sm font-medium text-purple-800 mb-1">Performance Summary</h4>
              <p className="text-sm text-purple-700">{summary.performance_summary}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                <h4 className="text-sm font-medium text-emerald-800 mb-2">Strengths</h4>
                <ul className="space-y-1">
                  {summary.strengths?.map((s, i) => (
                    <li key={i} className="text-sm text-emerald-700 flex items-start gap-2">
                      <span className="text-emerald-500">•</span>{s}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <h4 className="text-sm font-medium text-amber-800 mb-2">Areas for Improvement</h4>
                <ul className="space-y-1">
                  {summary.improvements?.map((i, idx) => (
                    <li key={idx} className="text-sm text-amber-700 flex items-start gap-2">
                      <span className="text-amber-500">•</span>{i}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="text-sm font-medium text-blue-800 mb-2">Talking Points for Review Meeting</h4>
              <ol className="space-y-1">
                {summary.talking_points?.map((t, i) => (
                  <li key={i} className="text-sm text-blue-700 flex items-start gap-2">
                    <span className="bg-blue-200 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0">
                      {i + 1}
                    </span>
                    {t}
                  </li>
                ))}
              </ol>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <h4 className="text-sm font-medium text-slate-700 mb-2">Recommended Goals</h4>
              <ul className="space-y-1">
                {summary.recommended_goals?.map((g, i) => (
                  <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                    <span className="text-teal-500">•</span>{g}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}