import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Sparkles, FileText, Calendar, Hash, DollarSign, MapPin, 
  Loader2, CheckCircle, AlertTriangle, RefreshCw, Clock,
  TrendingUp, FileSearch
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, differenceInDays, addMonths } from 'date-fns';

export default function ContractAIAnalysis({ 
  contract, 
  documentUrl,
  onExtractedData,
  agentActivity = {}
}) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [renewalPrediction, setRenewalPrediction] = useState(null);
  const [contractSummary, setContractSummary] = useState(null);
  const [activeTab, setActiveTab] = useState('extract');
  const [error, setError] = useState(null);

  const analyzeDocument = async () => {
    if (!documentUrl) return;
    
    setIsAnalyzing(true);
    setError(null);

    try {
      const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url: documentUrl,
        json_schema: {
          type: "object",
          properties: {
            effective_date: { type: "string", description: "Contract effective/start date in YYYY-MM-DD format" },
            expiration_date: { type: "string", description: "Contract expiration/end date in YYYY-MM-DD format" },
            writing_number: { type: "string", description: "Agent writing number or producer number" },
            commission_level: { type: "string", description: "Commission level, tier, or percentage" },
            states: { type: "array", items: { type: "string" }, description: "List of state abbreviations covered" },
            carrier_name: { type: "string", description: "Insurance carrier name" },
            contract_type: { type: "string", description: "Type of contract (e.g., Broker Agreement, Producer Agreement)" },
            key_terms: { type: "array", items: { type: "string" }, description: "Key contract terms and conditions" }
          }
        }
      });

      if (result.status === 'success' && result.output) {
        setExtractedData(result.output);
        onExtractedData?.(result.output);
      } else {
        setError(result.details || 'Failed to extract data from document');
      }
    } catch (err) {
      setError('Failed to analyze document. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const predictRenewal = async () => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const expirationDate = contract?.expiration_date || extractedData?.expiration_date;
      const daysUntilExpiration = expirationDate 
        ? differenceInDays(new Date(expirationDate), new Date())
        : null;

      const prompt = `Analyze this insurance agent contract and predict renewal needs:

Contract Details:
- Carrier: ${contract?.carrier_name || extractedData?.carrier_name || 'Unknown'}
- Status: ${contract?.contract_status || 'Unknown'}
- Effective Date: ${contract?.effective_date || extractedData?.effective_date || 'Unknown'}
- Expiration Date: ${expirationDate || 'Unknown'}
- Days Until Expiration: ${daysUntilExpiration !== null ? daysUntilExpiration : 'Unknown'}
- Commission Level: ${contract?.commission_level || extractedData?.commission_level || 'Unknown'}
- States: ${(contract?.states || extractedData?.states || []).join(', ') || 'Unknown'}

Agent Activity (Last 90 Days):
- Policies Written: ${agentActivity.policiesWritten || 0}
- Premium Volume: $${agentActivity.premiumVolume || 0}
- Active Clients: ${agentActivity.activeClients || 0}
- Compliance Issues: ${agentActivity.complianceIssues || 0}

Based on this data, provide:
1. Renewal recommendation (Renew, Review Before Renewal, Consider Non-Renewal)
2. Renewal urgency (High, Medium, Low)
3. Key factors affecting renewal decision
4. Recommended actions before renewal
5. Suggested timeline for renewal process`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            recommendation: { type: "string", enum: ["Renew", "Review Before Renewal", "Consider Non-Renewal"] },
            urgency: { type: "string", enum: ["High", "Medium", "Low"] },
            key_factors: { type: "array", items: { type: "string" } },
            recommended_actions: { type: "array", items: { type: "string" } },
            suggested_timeline: { type: "string" },
            risk_score: { type: "number", description: "Risk score 1-10, 10 being highest risk" },
            notes: { type: "string" }
          }
        }
      });

      setRenewalPrediction(result);
    } catch (err) {
      setError('Failed to generate renewal prediction. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const summarizeContract = async () => {
    if (!documentUrl) return;
    
    setIsAnalyzing(true);
    setError(null);

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this insurance carrier contract document and provide a comprehensive summary for quick review. Focus on:
1. Key obligations and responsibilities
2. Compensation structure and commission details
3. Termination clauses and conditions
4. Compliance requirements
5. Important deadlines and timeframes
6. Any unusual or noteworthy provisions
7. Potential risks or concerns

Provide a clear, concise summary that a busy agent or manager can quickly review.`,
        file_urls: [documentUrl],
        response_json_schema: {
          type: "object",
          properties: {
            executive_summary: { type: "string", description: "2-3 sentence overview" },
            key_obligations: { type: "array", items: { type: "string" } },
            compensation: {
              type: "object",
              properties: {
                structure: { type: "string" },
                details: { type: "array", items: { type: "string" } }
              }
            },
            termination_terms: { type: "array", items: { type: "string" } },
            compliance_requirements: { type: "array", items: { type: "string" } },
            important_dates: { type: "array", items: { type: "string" } },
            notable_provisions: { type: "array", items: { type: "string" } },
            risks_concerns: { type: "array", items: { type: "string" } }
          }
        }
      });

      setContractSummary(result);
    } catch (err) {
      setError('Failed to summarize contract. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const urgencyColors = {
    High: 'bg-red-100 text-red-700 border-red-200',
    Medium: 'bg-amber-100 text-amber-700 border-amber-200',
    Low: 'bg-emerald-100 text-emerald-700 border-emerald-200'
  };

  const recommendationColors = {
    'Renew': 'bg-emerald-100 text-emerald-700',
    'Review Before Renewal': 'bg-amber-100 text-amber-700',
    'Consider Non-Renewal': 'bg-red-100 text-red-700'
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          AI Contract Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tab Navigation */}
        <div className="flex gap-2 border-b pb-3">
          <Button
            variant={activeTab === 'extract' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('extract')}
            className={activeTab === 'extract' ? 'bg-purple-600 hover:bg-purple-700' : ''}
          >
            <FileSearch className="w-4 h-4 mr-2" />
            Extract Data
          </Button>
          <Button
            variant={activeTab === 'renewal' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('renewal')}
            className={activeTab === 'renewal' ? 'bg-purple-600 hover:bg-purple-700' : ''}
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Renewal Prediction
          </Button>
          <Button
            variant={activeTab === 'summary' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('summary')}
            className={activeTab === 'summary' ? 'bg-purple-600 hover:bg-purple-700' : ''}
          >
            <FileText className="w-4 h-4 mr-2" />
            Summarize
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span className="text-sm text-red-600">{error}</span>
          </div>
        )}

        {/* Extract Data Tab */}
        <AnimatePresence mode="wait">
          {activeTab === 'extract' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {!documentUrl ? (
                <div className="text-center py-6 text-slate-500">
                  <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Upload a contract document to extract data</p>
                </div>
              ) : !extractedData ? (
                <div className="text-center py-6">
                  <Button
                    onClick={analyzeDocument}
                    disabled={isAnalyzing}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Analyzing Document...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Extract Contract Data
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-emerald-600 flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" />
                      Data Extracted Successfully
                    </span>
                    <Button variant="ghost" size="sm" onClick={analyzeDocument} disabled={isAnalyzing}>
                      <RefreshCw className={`w-4 h-4 mr-1 ${isAnalyzing ? 'animate-spin' : ''}`} />
                      Re-analyze
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {extractedData.effective_date && (
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                          <Calendar className="w-3 h-3" />
                          Effective Date
                        </div>
                        <p className="font-medium text-slate-800">{extractedData.effective_date}</p>
                      </div>
                    )}
                    {extractedData.expiration_date && (
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                          <Calendar className="w-3 h-3" />
                          Expiration Date
                        </div>
                        <p className="font-medium text-slate-800">{extractedData.expiration_date}</p>
                      </div>
                    )}
                    {extractedData.writing_number && (
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                          <Hash className="w-3 h-3" />
                          Writing Number
                        </div>
                        <p className="font-medium text-slate-800">{extractedData.writing_number}</p>
                      </div>
                    )}
                    {extractedData.commission_level && (
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                          <DollarSign className="w-3 h-3" />
                          Commission Level
                        </div>
                        <p className="font-medium text-slate-800">{extractedData.commission_level}</p>
                      </div>
                    )}
                  </div>

                  {extractedData.states?.length > 0 && (
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-2 text-slate-500 text-xs mb-2">
                        <MapPin className="w-3 h-3" />
                        States Covered
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {extractedData.states.map(state => (
                          <Badge key={state} variant="secondary" className="text-xs">
                            {state}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {extractedData.key_terms?.length > 0 && (
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <div className="text-slate-500 text-xs mb-2">Key Terms</div>
                      <ul className="text-sm text-slate-700 space-y-1">
                        {extractedData.key_terms.slice(0, 5).map((term, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-purple-500 mt-1">•</span>
                            {term}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* Renewal Prediction Tab */}
          {activeTab === 'renewal' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {!renewalPrediction ? (
                <div className="text-center py-6">
                  <Button
                    onClick={predictRenewal}
                    disabled={isAnalyzing}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Generate Renewal Prediction
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className={recommendationColors[renewalPrediction.recommendation]}>
                        {renewalPrediction.recommendation}
                      </Badge>
                      <Badge variant="outline" className={urgencyColors[renewalPrediction.urgency]}>
                        <Clock className="w-3 h-3 mr-1" />
                        {renewalPrediction.urgency} Urgency
                      </Badge>
                    </div>
                    <Button variant="ghost" size="sm" onClick={predictRenewal} disabled={isAnalyzing}>
                      <RefreshCw className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>

                  {renewalPrediction.risk_score && (
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-600">Risk Score</span>
                        <span className={`font-bold ${
                          renewalPrediction.risk_score >= 7 ? 'text-red-600' :
                          renewalPrediction.risk_score >= 4 ? 'text-amber-600' : 'text-emerald-600'
                        }`}>
                          {renewalPrediction.risk_score}/10
                        </span>
                      </div>
                      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all ${
                            renewalPrediction.risk_score >= 7 ? 'bg-red-500' :
                            renewalPrediction.risk_score >= 4 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${renewalPrediction.risk_score * 10}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {renewalPrediction.suggested_timeline && (
                    <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                      <div className="text-xs text-purple-600 mb-1">Suggested Timeline</div>
                      <p className="text-sm text-purple-800">{renewalPrediction.suggested_timeline}</p>
                    </div>
                  )}

                  {renewalPrediction.key_factors?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-700 mb-2">Key Factors</h4>
                      <ul className="text-sm text-slate-600 space-y-1">
                        {renewalPrediction.key_factors.map((factor, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-purple-500">•</span>
                            {factor}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {renewalPrediction.recommended_actions?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-700 mb-2">Recommended Actions</h4>
                      <ul className="text-sm text-slate-600 space-y-1">
                        {renewalPrediction.recommended_actions.map((action, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* Summary Tab */}
          {activeTab === 'summary' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {!documentUrl ? (
                <div className="text-center py-6 text-slate-500">
                  <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Upload a contract document to generate summary</p>
                </div>
              ) : !contractSummary ? (
                <div className="text-center py-6">
                  <Button
                    onClick={summarizeContract}
                    disabled={isAnalyzing}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Summarizing...
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4 mr-2" />
                        Summarize Contract
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-end">
                    <Button variant="ghost" size="sm" onClick={summarizeContract} disabled={isAnalyzing}>
                      <RefreshCw className={`w-4 h-4 mr-1 ${isAnalyzing ? 'animate-spin' : ''}`} />
                      Regenerate
                    </Button>
                  </div>

                  {contractSummary.executive_summary && (
                    <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                      <h4 className="text-sm font-medium text-purple-800 mb-2">Executive Summary</h4>
                      <p className="text-sm text-purple-700">{contractSummary.executive_summary}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {contractSummary.key_obligations?.length > 0 && (
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <h4 className="text-xs font-medium text-slate-500 mb-2">Key Obligations</h4>
                        <ul className="text-sm text-slate-700 space-y-1">
                          {contractSummary.key_obligations.slice(0, 4).map((item, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-slate-400">•</span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {contractSummary.compensation && (
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <h4 className="text-xs font-medium text-slate-500 mb-2">Compensation</h4>
                        <p className="text-sm text-slate-700 mb-1">{contractSummary.compensation.structure}</p>
                        {contractSummary.compensation.details?.length > 0 && (
                          <ul className="text-xs text-slate-600 space-y-0.5">
                            {contractSummary.compensation.details.slice(0, 3).map((item, i) => (
                              <li key={i}>• {item}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}

                    {contractSummary.termination_terms?.length > 0 && (
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <h4 className="text-xs font-medium text-slate-500 mb-2">Termination Terms</h4>
                        <ul className="text-sm text-slate-700 space-y-1">
                          {contractSummary.termination_terms.slice(0, 3).map((item, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-slate-400">•</span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {contractSummary.compliance_requirements?.length > 0 && (
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <h4 className="text-xs font-medium text-slate-500 mb-2">Compliance Requirements</h4>
                        <ul className="text-sm text-slate-700 space-y-1">
                          {contractSummary.compliance_requirements.slice(0, 3).map((item, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-slate-400">•</span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {contractSummary.risks_concerns?.length > 0 && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <h4 className="text-xs font-medium text-amber-700 mb-2 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Risks & Concerns
                      </h4>
                      <ul className="text-sm text-amber-800 space-y-1">
                        {contractSummary.risks_concerns.map((item, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-amber-500">•</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}