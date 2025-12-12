import { useState } from 'react'
import { base44 } from '@/api/base44Client'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  FileSearch, Sparkles, Loader2, CheckCircle, AlertTriangle, 
  FileText, Calendar, Shield, Upload, Database, XCircle
} from 'lucide-react';
import { toast } from 'sonner'

export default function AIDocumentAnalyzer({ 
  document, 
  agent,
  onAnalysisComplete,
  onCreateTask,
  onFlagDocument
}) {
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(null);

  const analyzeDocument = async () => {
    if (!document?.file_url) return;
    
    setIsAnalyzing(true);
    setVerificationStatus(null);
    try {
      const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url: document.file_url,
        json_schema: {
          type: "object",
          properties: {
            document_type: { type: "string" },
            holder_name: { type: "string" },
            license_number: { type: "string" },
            state: { type: "string" },
            issue_date: { type: "string" },
            expiration_date: { type: "string" },
            issuing_authority: { type: "string" },
            status: { type: "string" },
            npn: { type: "string" },
            certification_type: { type: "string" }
          }
        }
      });

      if (result.status === 'success' && result.output) {
        // Enhanced validation with regulatory database simulation
        const validation = await base44.integrations.Core.InvokeLLM({
          prompt: `Perform comprehensive validation of this insurance document:

EXTRACTED DATA:
${JSON.stringify(result.output, null, 2)}

DOCUMENT TYPE: ${document.document_type}
ORIGINAL FILENAME: ${document.file_name}
${agent ? `AGENT INFO: ${agent.first_name} ${agent.last_name}, NPN: ${agent.npn}, State: ${agent.state}` : ''}

REGULATORY VERIFICATION CHECKS:
1. Verify the license/certificate number format matches the state's standard format
2. Check if the issuing authority is legitimate for this document type
3. Verify the holder name matches agent records (if available)
4. Check if NPN format is valid (10 digits)
5. Verify dates are logical (issue before expiration, not future-dated)
6. Check for signs of document tampering or inconsistencies
7. Verify the document type matches expected format for the stated authority

COMPLIANCE CHECKS:
- State-specific licensing requirements
- AHIP certification validity periods
- E&O insurance minimum requirements
- Background check authorization validity

Flag any discrepancies between extracted data and expected regulatory standards.`,
          response_json_schema: {
            type: "object",
            properties: {
              is_valid: { type: "boolean" },
              confidence_score: { type: "number" },
              extracted_fields: { type: "object" },
              verification_results: {
                type: "object",
                properties: {
                  license_format_valid: { type: "boolean" },
                  issuing_authority_valid: { type: "boolean" },
                  name_match: { type: "boolean" },
                  npn_format_valid: { type: "boolean" },
                  dates_logical: { type: "boolean" },
                  no_tampering_signs: { type: "boolean" }
                }
              },
              regulatory_status: { type: "string" },
              discrepancies: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    field: { type: "string" },
                    issue: { type: "string" },
                    severity: { type: "string" },
                    action_required: { type: "string" }
                  }
                }
              },
              missing_fields: { type: "array", items: { type: "string" } },
              warnings: { type: "array", items: { type: "string" } },
              recommendations: { type: "array", items: { type: "string" } },
              should_flag: { type: "boolean" },
              flag_reason: { type: "string" }
            }
          }
        });

        setAnalysis({
          ...result.output,
          ...validation
        });

        // Set verification status
        const allChecks = validation.verification_results || {};
        const passedChecks = Object.values(allChecks).filter(v => v === true).length;
        const totalChecks = Object.keys(allChecks).length;
        setVerificationStatus({
          passed: passedChecks,
          total: totalChecks,
          percentage: totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 0
        });

        // Auto-flag if issues detected
        if (validation.should_flag && onFlagDocument) {
          onFlagDocument(document, validation.flag_reason || 'AI detected issues requiring review');
          toast.warning('Document flagged for manual review');
        }
        
        onAnalysisComplete?.(validation);
        
        if (!validation.is_valid) {
          toast.warning('Document has issues that need attention');
        } else {
          toast.success('Document validated successfully');
        }
      }
    } catch (err) {
      console.error('Analysis failed:', err);
      toast.error('Failed to analyze document');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <FileSearch className="w-4 h-4 text-purple-600" />
            AI Document Analysis
          </CardTitle>
          <Button
            size="sm"
            onClick={analyzeDocument}
            disabled={isAnalyzing || !document}
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
          <p className="text-sm text-slate-400 text-center py-4">
            Click analyze to extract and validate document details
          </p>
        )}

        {analysis && (
          <div className="space-y-4">
            {/* Validation Status */}
            <div className={`p-3 rounded-lg flex items-center gap-3 ${
              analysis.is_valid ? 'bg-emerald-50 border border-emerald-200' : 'bg-amber-50 border border-amber-200'
            }`}>
              {analysis.is_valid ? (
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              )}
              <div className="flex-1">
                <p className={`font-medium ${analysis.is_valid ? 'text-emerald-800' : 'text-amber-800'}`}>
                  {analysis.is_valid ? 'Document Valid' : 'Issues Detected'}
                </p>
                <p className="text-xs text-slate-500">
                  Confidence: {Math.round((analysis.confidence_score || 0) * 100)}%
                </p>
              </div>
            </div>

            {/* Regulatory Verification Status */}
            {verificationStatus && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="w-4 h-4 text-slate-600" />
                  <span className="text-sm font-medium text-slate-700">Regulatory Verification</span>
                </div>
                <div className="flex items-center gap-3">
                  <Progress 
                    value={verificationStatus.percentage} 
                    className={`h-2 flex-1 ${
                      verificationStatus.percentage >= 80 ? '[&>div]:bg-emerald-500' :
                      verificationStatus.percentage >= 50 ? '[&>div]:bg-amber-500' :
                      '[&>div]:bg-red-500'
                    }`}
                  />
                  <span className="text-xs text-slate-600">
                    {verificationStatus.passed}/{verificationStatus.total} checks passed
                  </span>
                </div>
                {analysis.verification_results && (
                  <div className="grid grid-cols-2 gap-1 mt-2">
                    {Object.entries(analysis.verification_results).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-1 text-xs">
                        {value ? (
                          <CheckCircle className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <XCircle className="w-3 h-3 text-red-500" />
                        )}
                        <span className={value ? 'text-emerald-700' : 'text-red-700'}>
                          {key.replace(/_/g, ' ')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Regulatory Status */}
            {analysis.regulatory_status && (
              <div className={`p-2 rounded-lg text-center ${
                analysis.regulatory_status === 'compliant' ? 'bg-emerald-100 text-emerald-800' :
                analysis.regulatory_status === 'pending' ? 'bg-amber-100 text-amber-800' :
                'bg-red-100 text-red-800'
              }`}>
                <span className="text-xs font-medium">
                  Regulatory Status: {analysis.regulatory_status.toUpperCase()}
                </span>
              </div>
            )}

            {/* Discrepancies */}
            {analysis.discrepancies?.length > 0 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="text-sm font-medium text-red-800 mb-2 flex items-center gap-1">
                  <XCircle className="w-4 h-4" /> Discrepancies Found
                </h4>
                <div className="space-y-2">
                  {analysis.discrepancies.map((disc, i) => (
                    <div key={i} className="p-2 bg-white rounded border border-red-100">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-red-700">{disc.field}</span>
                        <Badge variant="outline" className={`text-[10px] ${
                          disc.severity === 'high' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {disc.severity}
                        </Badge>
                      </div>
                      <p className="text-xs text-red-600">{disc.issue}</p>
                      {disc.action_required && (
                        <p className="text-xs text-red-500 mt-1">→ {disc.action_required}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Extracted Fields */}
            {analysis.extracted_fields && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-slate-700">Extracted Information</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {Object.entries(analysis.extracted_fields).map(([key, value]) => (
                    value && (
                      <div key={key} className="p-2 bg-slate-50 rounded">
                        <p className="text-slate-500 capitalize">{key.replace(/_/g, ' ')}</p>
                        <p className="font-medium text-slate-700">{value}</p>
                      </div>
                    )
                  ))}
                </div>
              </div>
            )}

            {/* Missing Fields */}
            {analysis.missing_fields?.length > 0 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="text-sm font-medium text-red-800 mb-1">Missing Information</h4>
                <ul className="text-xs text-red-700 space-y-1">
                  {analysis.missing_fields.map((field, i) => (
                    <li key={i}>• {field}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Warnings */}
            {analysis.warnings?.length > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <h4 className="text-sm font-medium text-amber-800 mb-1">Warnings</h4>
                <ul className="text-xs text-amber-700 space-y-1">
                  {analysis.warnings.map((warning, i) => (
                    <li key={i}>• {warning}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {analysis.recommendations?.length > 0 && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-sm font-medium text-blue-800 mb-1">Recommendations</h4>
                <ul className="text-xs text-blue-700 space-y-1">
                  {analysis.recommendations.map((rec, i) => (
                    <li key={i}>• {rec}</li>
                  ))}
                </ul>
                {onCreateTask && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2 text-xs"
                    onClick={() => onCreateTask(analysis.recommendations)}
                  >
                    Create Tasks from Recommendations
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}