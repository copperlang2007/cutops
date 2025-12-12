import { useState } from 'react'
import { base44 } from '@/api/base44Client'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  FileSearch, Sparkles, Loader2, AlertTriangle, CheckCircle, 
  Calendar, DollarSign, FileText, Flag, CheckSquare, Shield, Scale
} from 'lucide-react';
import { toast } from 'sonner'

export default function ContractAIAnalyzer({ contract, document, onCreateTask }) {
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeContract = async () => {
    setIsAnalyzing(true);
    try {
      let extractedData = null;
      
      // Try to extract data from document if available
      if (document?.file_url) {
        try {
          const extraction = await base44.integrations.Core.ExtractDataFromUploadedFile({
            file_url: document.file_url,
            json_schema: {
              type: "object",
              properties: {
                carrier_name: { type: "string" },
                effective_date: { type: "string" },
                expiration_date: { type: "string" },
                commission_rate: { type: "string" },
                commission_structure: { type: "string" },
                states_covered: { type: "array", items: { type: "string" } },
                termination_clause: { type: "string" },
                renewal_terms: { type: "string" },
                exclusivity_clause: { type: "string" },
                payment_terms: { type: "string" }
              }
            }
          });
          if (extraction.status === 'success') {
            extractedData = extraction.output;
          }
        } catch (err) {
          console.log('Document extraction failed, using contract data');
        }
      }

      // Analyze with AI - Enhanced risk assessment
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Perform a comprehensive risk assessment and analysis of this carrier contract:

CONTRACT INFORMATION:
- Carrier: ${contract.carrier_name}
- Status: ${contract.contract_status}
- Effective Date: ${contract.effective_date || 'Not specified'}
- Expiration Date: ${contract.expiration_date || 'Not specified'}
- Writing Number: ${contract.writing_number || 'Not assigned'}
- Commission Level: ${contract.commission_level || 'Not specified'}
- States: ${contract.states?.join(', ') || 'Not specified'}

${extractedData ? `EXTRACTED FROM DOCUMENT:
${JSON.stringify(extractedData, null, 2)}` : ''}

ANALYZE FOR COMMON UNFAVORABLE TERMS:
1. Termination clauses - Look for ambiguous language, short notice periods, termination without cause
2. Non-compete/Non-solicitation - Identify restrictive geographic or time limitations
3. Liability limits - Check for unfavorable indemnification or liability caps
4. Commission clawbacks - Look for extended chargeback periods or unfair clawback terms
5. Exclusivity requirements - Identify restrictions on working with other carriers
6. Assignment restrictions - Check if contract can be transferred
7. Dispute resolution - Look for mandatory arbitration or unfavorable venue clauses
8. Auto-renewal traps - Identify automatic renewals with difficult opt-out procedures

Calculate a CONTRACT RISK SCORE from 0-100 where:
- 0-30: Low Risk (favorable terms)
- 31-60: Moderate Risk (some concerns)
- 61-80: High Risk (significant unfavorable terms)
- 81-100: Critical Risk (major red flags)

Provide detailed analysis.`,
        response_json_schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            risk_score: { type: "number" },
            risk_level: { type: "string" },
            key_terms: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  term: { type: "string" },
                  value: { type: "string" },
                  importance: { type: "string" }
                }
              }
            },
            commission_details: {
              type: "object",
              properties: {
                structure: { type: "string" },
                rates: { type: "string" },
                payment_schedule: { type: "string" }
              }
            },
            important_dates: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  date: { type: "string" },
                  event: { type: "string" },
                  action_required: { type: "string" }
                }
              }
            },
            clause_analysis: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  clause_type: { type: "string" },
                  finding: { type: "string" },
                  risk_level: { type: "string" },
                  explanation: { type: "string" },
                  negotiation_tip: { type: "string" }
                }
              }
            },
            risks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  risk: { type: "string" },
                  severity: { type: "string" },
                  impact: { type: "string" },
                  mitigation: { type: "string" }
                }
              }
            },
            recommendations: { type: "array", items: { type: "string" } },
            negotiation_points: { type: "array", items: { type: "string" } },
            suggested_tasks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  priority: { type: "string" },
                  due_days: { type: "number" }
                }
              }
            }
          }
        }
      });

      setAnalysis(result);
      toast.success('Contract analysis complete');
    } catch (err) {
      console.error('Analysis failed:', err);
      toast.error('Failed to analyze contract');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCreateTasks = async () => {
    if (!analysis?.suggested_tasks || !onCreateTask) return;
    
    for (const task of analysis.suggested_tasks) {
      await onCreateTask({
        title: task.title,
        task_type: 'contract_renewal',
        priority: task.priority || 'medium',
        agent_id: contract.agent_id,
        related_entity_type: 'contract',
        related_entity_id: contract.id,
        auto_generated: true
      });
    }
    toast.success(`Created ${analysis.suggested_tasks.length} tasks`);
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileSearch className="w-5 h-5 text-purple-600" />
            AI Contract Analysis
          </CardTitle>
          <Button
            size="sm"
            onClick={analyzeContract}
            disabled={isAnalyzing}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-1" />
                Analyze
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!analysis && !isAnalyzing && (
          <p className="text-sm text-slate-400 text-center py-6">
            Click analyze to extract key terms and identify risks
          </p>
        )}

        {analysis && (
          <div className="space-y-4">
            {/* Risk Score */}
            {analysis.risk_score !== undefined && (
              <div className={`p-4 rounded-lg border ${
                analysis.risk_score <= 30 ? 'bg-emerald-50 border-emerald-200' :
                analysis.risk_score <= 60 ? 'bg-amber-50 border-amber-200' :
                analysis.risk_score <= 80 ? 'bg-orange-50 border-orange-200' :
                'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Scale className={`w-5 h-5 ${
                      analysis.risk_score <= 30 ? 'text-emerald-600' :
                      analysis.risk_score <= 60 ? 'text-amber-600' :
                      analysis.risk_score <= 80 ? 'text-orange-600' :
                      'text-red-600'
                    }`} />
                    <span className="font-medium text-slate-800">Contract Risk Score</span>
                  </div>
                  <Badge className={
                    analysis.risk_score <= 30 ? 'bg-emerald-100 text-emerald-700' :
                    analysis.risk_score <= 60 ? 'bg-amber-100 text-amber-700' :
                    analysis.risk_score <= 80 ? 'bg-orange-100 text-orange-700' :
                    'bg-red-100 text-red-700'
                  }>
                    {analysis.risk_level || (
                      analysis.risk_score <= 30 ? 'Low Risk' :
                      analysis.risk_score <= 60 ? 'Moderate Risk' :
                      analysis.risk_score <= 80 ? 'High Risk' :
                      'Critical Risk'
                    )}
                  </Badge>
                </div>
                <div className="flex items-center gap-3">
                  <Progress 
                    value={analysis.risk_score} 
                    className={`h-3 flex-1 ${
                      analysis.risk_score <= 30 ? '[&>div]:bg-emerald-500' :
                      analysis.risk_score <= 60 ? '[&>div]:bg-amber-500' :
                      analysis.risk_score <= 80 ? '[&>div]:bg-orange-500' :
                      '[&>div]:bg-red-500'
                    }`}
                  />
                  <span className={`text-lg font-bold ${
                    analysis.risk_score <= 30 ? 'text-emerald-700' :
                    analysis.risk_score <= 60 ? 'text-amber-700' :
                    analysis.risk_score <= 80 ? 'text-orange-700' :
                    'text-red-700'
                  }`}>{analysis.risk_score}/100</span>
                </div>
              </div>
            )}

            {/* Summary */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <h4 className="text-sm font-medium text-slate-700 mb-1">Summary</h4>
              <p className="text-xs text-slate-600">{analysis.summary}</p>
            </div>

            {/* Clause Analysis */}
            {analysis.clause_analysis?.length > 0 && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <h4 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-1">
                  <Shield className="w-4 h-4" /> Clause-by-Clause Analysis
                </h4>
                <div className="space-y-3">
                  {analysis.clause_analysis.map((clause, i) => (
                    <div key={i} className={`p-2 rounded border ${
                      clause.risk_level === 'high' ? 'bg-red-50 border-red-200' :
                      clause.risk_level === 'medium' ? 'bg-amber-50 border-amber-200' :
                      'bg-emerald-50 border-emerald-200'
                    }`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-slate-700">{clause.clause_type}</span>
                        <Badge variant="outline" className={`text-[10px] ${
                          clause.risk_level === 'high' ? 'bg-red-100 text-red-700' :
                          clause.risk_level === 'medium' ? 'bg-amber-100 text-amber-700' :
                          'bg-emerald-100 text-emerald-700'
                        }`}>
                          {clause.risk_level} risk
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-600 mb-1">{clause.finding}</p>
                      <p className="text-xs text-slate-500 italic">{clause.explanation}</p>
                      {clause.negotiation_tip && (
                        <p className="text-xs text-blue-600 mt-1">💡 {clause.negotiation_tip}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Key Terms */}
            {analysis.key_terms?.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-slate-700 mb-2">Key Terms</h4>
                <div className="space-y-2">
                  {analysis.key_terms.map((term, i) => (
                    <div key={i} className="flex items-start justify-between p-2 bg-slate-50 rounded">
                      <div>
                        <p className="text-xs font-medium text-slate-700">{term.term}</p>
                        <p className="text-xs text-slate-500">{term.value}</p>
                      </div>
                      <Badge variant="outline" className={
                        term.importance === 'high' ? 'bg-red-100 text-red-700' :
                        term.importance === 'medium' ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-100'
                      }>
                        {term.importance}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Commission Details */}
            {analysis.commission_details && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                <h4 className="text-sm font-medium text-emerald-800 mb-2 flex items-center gap-1">
                  <DollarSign className="w-4 h-4" /> Commission Structure
                </h4>
                <div className="space-y-1 text-xs text-emerald-700">
                  <p><strong>Structure:</strong> {analysis.commission_details.structure}</p>
                  <p><strong>Rates:</strong> {analysis.commission_details.rates}</p>
                  <p><strong>Payment:</strong> {analysis.commission_details.payment_schedule}</p>
                </div>
              </div>
            )}

            {/* Important Dates */}
            {analysis.important_dates?.length > 0 && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-sm font-medium text-blue-800 mb-2 flex items-center gap-1">
                  <Calendar className="w-4 h-4" /> Important Dates
                </h4>
                <div className="space-y-2">
                  {analysis.important_dates.map((item, i) => (
                    <div key={i} className="text-xs text-blue-700">
                      <p><strong>{item.date}:</strong> {item.event}</p>
                      {item.action_required && (
                        <p className="text-blue-600 ml-2">→ {item.action_required}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Risks */}
            {analysis.risks?.length > 0 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="text-sm font-medium text-red-800 mb-2 flex items-center gap-1">
                  <Flag className="w-4 h-4" /> Identified Risks
                </h4>
                <div className="space-y-2">
                  {analysis.risks.map((risk, i) => (
                    <div key={i} className="text-xs p-2 bg-white rounded border border-red-100">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className={`w-3 h-3 ${
                          risk.severity === 'high' ? 'text-red-600' : 'text-amber-600'
                        }`} />
                        <p className="font-medium text-red-700">{risk.risk}</p>
                        <Badge variant="outline" className="text-[10px] ml-auto">{risk.severity}</Badge>
                      </div>
                      {risk.impact && <p className="text-red-600 mb-1">Impact: {risk.impact}</p>}
                      <p className="text-red-600">Mitigation: {risk.mitigation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Negotiation Points */}
            {analysis.negotiation_points?.length > 0 && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-sm font-medium text-blue-800 mb-2">Negotiation Points</h4>
                <ul className="space-y-1">
                  {analysis.negotiation_points.map((point, i) => (
                    <li key={i} className="text-xs text-blue-700">• {point}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {analysis.recommendations?.length > 0 && (
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <h4 className="text-sm font-medium text-purple-800 mb-2">Recommendations</h4>
                <ul className="space-y-1">
                  {analysis.recommendations.map((rec, i) => (
                    <li key={i} className="text-xs text-purple-700">• {rec}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Suggested Tasks */}
            {analysis.suggested_tasks?.length > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-amber-800 flex items-center gap-1">
                    <CheckSquare className="w-4 h-4" /> Suggested Tasks
                  </h4>
                  {onCreateTask && (
                    <Button size="sm" variant="outline" className="h-6 text-xs" onClick={handleCreateTasks}>
                      Create All
                    </Button>
                  )}
                </div>
                <ul className="space-y-1">
                  {analysis.suggested_tasks.map((task, i) => (
                    <li key={i} className="text-xs text-amber-700 flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">{task.priority}</Badge>
                      {task.title}
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