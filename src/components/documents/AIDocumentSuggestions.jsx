import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Sparkles, FileText, CheckCircle2, AlertCircle, 
  Loader2, ChevronRight, Target, Clock, Shield
} from 'lucide-react';
import { base44 } from '@/api/base44Client'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

export default function AIDocumentSuggestions({ 
  agent, 
  existingDocuments = [],
  licenses = [],
  appointments = [],
  contracts = [],
  targetStates = [],
  onRequestDocument
}) {
  const [suggestions, setSuggestions] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeDocumentNeeds = async () => {
    setIsAnalyzing(true);
    try {
      const existingTypes = existingDocuments.map(d => d.document_type);
      const licensedStates = [...new Set(licenses.map(l => l.state))];
      const appointedCarriers = [...new Set(appointments.filter(a => a.appointment_status === 'appointed').map(a => a.carrier_name))];

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze document requirements for this insurance agent and suggest missing documents.

Agent Profile:
- Name: ${agent.first_name} ${agent.last_name}
- Onboarding Status: ${agent.onboarding_status}
- NPN: ${agent.npn}
- State: ${agent.state}
- E&O Expiration: ${agent.e_and_o_expiration || 'Not on file'}
- AHIP Completion: ${agent.ahip_completion_date || 'Not completed'}

Existing Documents: ${existingTypes.join(', ') || 'None'}
Licensed States: ${licensedStates.join(', ') || 'None'}
Target States: ${targetStates.join(', ') || licensedStates.join(', ')}
Appointed Carriers: ${appointedCarriers.join(', ') || 'None'}
Active Contracts: ${contracts.length}

Analyze what documents are:
1. Missing and required for compliance
2. Expiring soon and need renewal
3. Needed for target market expansion
4. Required for specific carriers
5. Recommended for faster onboarding

Prioritize by urgency and impact.`,
        response_json_schema: {
          type: "object",
          properties: {
            completeness_score: { type: "number" },
            required_documents: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  document_type: { type: "string" },
                  document_name: { type: "string" },
                  urgency: { type: "string", enum: ["critical", "high", "medium", "low"] },
                  reason: { type: "string" },
                  deadline: { type: "string" },
                  impact: { type: "string" },
                  how_to_obtain: { type: "string" }
                }
              }
            },
            expiring_documents: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  document_type: { type: "string" },
                  expiration_date: { type: "string" },
                  days_until_expiry: { type: "number" },
                  renewal_steps: { type: "string" }
                }
              }
            },
            state_specific: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  state: { type: "string" },
                  required_documents: { type: "array", items: { type: "string" } },
                  notes: { type: "string" }
                }
              }
            },
            carrier_specific: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  carrier: { type: "string" },
                  required_documents: { type: "array", items: { type: "string" } }
                }
              }
            },
            recommendations: { type: "array", items: { type: "string" } }
          }
        }
      });

      setSuggestions(result);
    } catch (err) {
      toast.error('Failed to analyze document needs');
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    if (agent?.id) {
      analyzeDocumentNeeds();
    }
  }, [agent?.id]);

  const urgencyConfig = {
    critical: { color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: AlertCircle },
    high: { color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', icon: Clock },
    medium: { color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: Target },
    low: { color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: FileText }
  };

  return (
    <Card className="border-0 shadow-premium dark:bg-slate-800/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2 dark:text-white">
            <Target className="w-5 h-5 text-amber-500" />
            AI Document Suggestions
          </CardTitle>
          <Button 
            onClick={analyzeDocumentNeeds} 
            disabled={isAnalyzing}
            size="sm"
            variant="outline"
          >
            {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isAnalyzing && !suggestions ? (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-500 mb-3" />
            <p className="text-sm text-slate-500">Analyzing document requirements...</p>
          </div>
        ) : suggestions ? (
          <div className="space-y-4">
            {/* Completeness Score */}
            <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-amber-700 dark:text-amber-400">Document Completeness</span>
                <span className="text-2xl font-bold text-amber-600">{suggestions.completeness_score}%</span>
              </div>
              <Progress value={suggestions.completeness_score} className="h-2" />
            </div>

            {/* Required Documents */}
            {suggestions.required_documents?.length > 0 && (
              <div>
                <h4 className="font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  Required Documents ({suggestions.required_documents.length})
                </h4>
                <div className="space-y-2">
                  {suggestions.required_documents.map((doc, i) => {
                    const config = urgencyConfig[doc.urgency];
                    const Icon = config?.icon || FileText;
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className={`p-1.5 rounded ${config?.color}`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-medium text-slate-700 dark:text-slate-300">{doc.document_name}</p>
                              <p className="text-xs text-slate-500 mt-0.5">{doc.reason}</p>
                              {doc.deadline && (
                                <p className="text-xs text-slate-400 mt-1">Deadline: {doc.deadline}</p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge className={config?.color}>{doc.urgency}</Badge>
                            {onRequestDocument && (
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="mt-1 h-6 text-xs text-teal-600"
                                onClick={() => onRequestDocument(doc)}
                              >
                                Request <ChevronRight className="w-3 h-3 ml-1" />
                              </Button>
                            )}
                          </div>
                        </div>
                        {doc.how_to_obtain && (
                          <p className="text-xs text-slate-500 mt-2 pl-9">
                            💡 {doc.how_to_obtain}
                          </p>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Expiring Documents */}
            {suggestions.expiring_documents?.length > 0 && (
              <div>
                <h4 className="font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  Expiring Soon
                </h4>
                <div className="space-y-2">
                  {suggestions.expiring_documents.map((doc, i) => (
                    <div key={i} className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-amber-700 dark:text-amber-400">{doc.document_type}</span>
                        <Badge className="bg-amber-200 text-amber-800">
                          {doc.days_until_expiry} days left
                        </Badge>
                      </div>
                      <p className="text-xs text-amber-600 dark:text-amber-300 mt-1">{doc.renewal_steps}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* State-Specific */}
            {suggestions.state_specific?.length > 0 && (
              <div>
                <h4 className="font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-500" />
                  State-Specific Requirements
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {suggestions.state_specific.map((state, i) => (
                    <div key={i} className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline">{state.state}</Badge>
                      </div>
                      <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-0.5">
                        {state.required_documents?.map((doc, j) => (
                          <li key={j}>• {doc}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {suggestions.recommendations?.length > 0 && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                <h4 className="font-medium text-emerald-700 dark:text-emerald-400 mb-2">💡 Recommendations</h4>
                <ul className="text-sm text-emerald-600 dark:text-emerald-300 space-y-1">
                  {suggestions.recommendations.map((rec, i) => (
                    <li key={i}>• {rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Click refresh to analyze document requirements</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}