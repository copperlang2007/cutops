import { useState, useCallback } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Upload, Sparkles, FileText, CheckCircle2, AlertTriangle, 
  Loader2, Eye, RefreshCw, FileCheck, X, Zap, Shield
} from 'lucide-react';
import { base44 } from '@/api/base44Client'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

const DOCUMENT_CATEGORIES = {
  state_license: { label: 'State License', icon: Shield, color: 'text-blue-600 bg-blue-100' },
  eo_certificate: { label: 'E&O Certificate', icon: FileCheck, color: 'text-purple-600 bg-purple-100' },
  ahip_certificate: { label: 'AHIP Certificate', icon: FileText, color: 'text-emerald-600 bg-emerald-100' },
  carrier_certification: { label: 'Carrier Certification', icon: FileText, color: 'text-amber-600 bg-amber-100' },
  background_check: { label: 'Background Check', icon: Shield, color: 'text-slate-600 bg-slate-100' },
  contract: { label: 'Contract', icon: FileText, color: 'text-teal-600 bg-teal-100' },
  w9: { label: 'W-9 Form', icon: FileText, color: 'text-indigo-600 bg-indigo-100' },
  direct_deposit: { label: 'Direct Deposit', icon: FileText, color: 'text-pink-600 bg-pink-100' },
  id_verification: { label: 'ID Verification', icon: Shield, color: 'text-orange-600 bg-orange-100' },
  compliance_training: { label: 'Compliance Training', icon: FileCheck, color: 'text-cyan-600 bg-cyan-100' },
  other: { label: 'Other Document', icon: FileText, color: 'text-slate-500 bg-slate-100' }
};

export default function AIDocumentProcessor({ 
  agent, 
  existingDocuments = [],
  licenses = [],
  onDocumentProcessed,
  onUpdateAgent,
  onCreateAlert 
}) {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [processingResults, setProcessingResults] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState('');

  const handleFileUpload = useCallback((e) => {
    const files = Array.from(e.target.files);
    const newFiles = files.map(file => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      name: file.name,
      size: file.size,
      status: 'pending',
      result: null
    }));
    setUploadedFiles(prev => [...prev, ...newFiles]);
  }, []);

  const processAllDocuments = async () => {
    if (uploadedFiles.length === 0) return;
    
    setIsProcessing(true);
    const results = [];

    for (let i = 0; i < uploadedFiles.length; i++) {
      const fileData = uploadedFiles[i];
      setCurrentStep(`Processing ${i + 1}/${uploadedFiles.length}: ${fileData.name}`);
      
      try {
        // Upload file first
        setUploadedFiles(prev => prev.map(f => 
          f.id === fileData.id ? { ...f, status: 'uploading' } : f
        ));

        const { file_url } = await base44.integrations.Core.UploadFile({ file: fileData.file });

        // Extract data with OCR
        setUploadedFiles(prev => prev.map(f => 
          f.id === fileData.id ? { ...f, status: 'extracting' } : f
        ));

        const extractionResult = await base44.integrations.Core.ExtractDataFromUploadedFile({
          file_url,
          json_schema: {
            type: "object",
            properties: {
              document_type: { type: "string", description: "Type of document (license, certificate, form, etc.)" },
              detected_category: { type: "string", enum: Object.keys(DOCUMENT_CATEGORIES) },
              extracted_data: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  license_number: { type: "string" },
                  state: { type: "string" },
                  issue_date: { type: "string" },
                  expiration_date: { type: "string" },
                  carrier_name: { type: "string" },
                  npn: { type: "string" },
                  certificate_number: { type: "string" },
                  completion_date: { type: "string" },
                  amount: { type: "number" }
                }
              },
              confidence_score: { type: "number" },
              raw_text_summary: { type: "string" }
            }
          }
        });

        // Validate against existing records
        setUploadedFiles(prev => prev.map(f => 
          f.id === fileData.id ? { ...f, status: 'validating' } : f
        ));

        const validationResult = await validateExtractedData(extractionResult.output, file_url);

        setUploadedFiles(prev => prev.map(f => 
          f.id === fileData.id ? { 
            ...f, 
            status: 'complete',
            result: {
              ...extractionResult.output,
              ...validationResult,
              file_url
            }
          } : f
        ));

        results.push({
          fileId: fileData.id,
          fileName: fileData.name,
          ...extractionResult.output,
          ...validationResult,
          file_url
        });

      } catch (err) {
        console.error('Processing error:', err);
        setUploadedFiles(prev => prev.map(f => 
          f.id === fileData.id ? { ...f, status: 'error', error: err.message } : f
        ));
      }
    }

    setProcessingResults(results);
    setIsProcessing(false);
    setCurrentStep('');
    toast.success(`Processed ${results.length} document(s)`);
  };

  const validateExtractedData = async (extractedData, fileUrl) => {
    const validationIssues = [];
    const autoUpdates = [];
    let matchConfidence = 0;

    // Check name match
    if (extractedData?.extracted_data?.name) {
      const extractedName = extractedData.extracted_data.name.toLowerCase();
      const agentName = `${agent.first_name} ${agent.last_name}`.toLowerCase();
      if (extractedName.includes(agent.first_name?.toLowerCase()) || 
          extractedName.includes(agent.last_name?.toLowerCase())) {
        matchConfidence += 30;
      } else {
        validationIssues.push({
          type: 'name_mismatch',
          severity: 'warning',
          message: `Name on document "${extractedData.extracted_data.name}" doesn't match agent "${agent.first_name} ${agent.last_name}"`
        });
      }
    }

    // Check NPN match
    if (extractedData?.extracted_data?.npn) {
      if (extractedData.extracted_data.npn === agent.npn) {
        matchConfidence += 40;
      } else {
        validationIssues.push({
          type: 'npn_mismatch',
          severity: 'critical',
          message: `NPN on document "${extractedData.extracted_data.npn}" doesn't match agent NPN "${agent.npn}"`
        });
      }
    }

    // Check state license exists
    if (extractedData?.detected_category === 'state_license' && extractedData?.extracted_data?.state) {
      const existingLicense = licenses.find(l => l.state === extractedData.extracted_data.state);
      if (existingLicense) {
        matchConfidence += 20;
        // Check if update needed
        if (extractedData.extracted_data.expiration_date && 
            extractedData.extracted_data.expiration_date !== existingLicense.expiration_date) {
          autoUpdates.push({
            entity: 'license',
            id: existingLicense.id,
            field: 'expiration_date',
            oldValue: existingLicense.expiration_date,
            newValue: extractedData.extracted_data.expiration_date
          });
        }
      }
    }

    // Check for expired documents
    if (extractedData?.extracted_data?.expiration_date) {
      const expDate = new Date(extractedData.extracted_data.expiration_date);
      if (expDate < new Date()) {
        validationIssues.push({
          type: 'expired',
          severity: 'critical',
          message: `Document expired on ${extractedData.extracted_data.expiration_date}`
        });
      }
    }

    // AI-powered deeper validation
    const aiValidation = await base44.integrations.Core.InvokeLLM({
      prompt: `Validate this extracted document data against agent profile.

Document Data:
${JSON.stringify(extractedData, null, 2)}

Agent Profile:
- Name: ${agent.first_name} ${agent.last_name}
- NPN: ${agent.npn}
- Email: ${agent.email}
- State: ${agent.state}

Existing Licenses: ${licenses.map(l => `${l.state}: ${l.license_number}`).join(', ')}

Provide validation assessment including:
1. Data quality score (0-100)
2. Any additional discrepancies
3. Suggested profile updates
4. Risk flags`,
      response_json_schema: {
        type: "object",
        properties: {
          data_quality_score: { type: "number" },
          additional_discrepancies: { type: "array", items: { type: "string" } },
          suggested_updates: {
            type: "array",
            items: {
              type: "object",
              properties: {
                field: { type: "string" },
                current_value: { type: "string" },
                suggested_value: { type: "string" },
                reason: { type: "string" }
              }
            }
          },
          risk_flags: { type: "array", items: { type: "string" } },
          recommendation: { type: "string" }
        }
      }
    });

    return {
      validationIssues,
      autoUpdates,
      matchConfidence: Math.min(matchConfidence + (aiValidation.data_quality_score || 0) / 2, 100),
      aiValidation
    };
  };

  const applyAutoUpdate = async (result) => {
    for (const update of result.autoUpdates || []) {
      if (update.entity === 'license') {
        await base44.entities.License.update(update.id, { [update.field]: update.newValue });
      }
    }

    // Create document record
    await onDocumentProcessed({
      agent_id: agent.id,
      name: result.fileName,
      document_type: result.detected_category,
      file_url: result.file_url,
      file_name: result.fileName,
      status: result.validationIssues?.some(i => i.severity === 'critical') ? 'pending_verification' : 'verified',
      issue_date: result.extracted_data?.issue_date,
      expiration_date: result.extracted_data?.expiration_date,
      state: result.extracted_data?.state,
      carrier_name: result.extracted_data?.carrier_name,
      verification_status: result.matchConfidence > 70 ? 'verified' : 'pending'
    });

    // Create alerts for critical issues
    for (const issue of result.validationIssues?.filter(i => i.severity === 'critical') || []) {
      await onCreateAlert({
        agent_id: agent.id,
        alert_type: 'adverse_action',
        severity: 'critical',
        title: 'Document Validation Issue',
        message: issue.message
      });
    }

    toast.success('Document saved and profile updated');
  };

  const removeFile = (id) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
    setProcessingResults(prev => prev.filter(r => r.fileId !== id));
  };

  const getStatusBadge = (status) => {
    const config = {
      pending: { label: 'Pending', className: 'bg-slate-100 text-slate-600' },
      uploading: { label: 'Uploading...', className: 'bg-blue-100 text-blue-600' },
      extracting: { label: 'Extracting...', className: 'bg-purple-100 text-purple-600' },
      validating: { label: 'Validating...', className: 'bg-amber-100 text-amber-600' },
      complete: { label: 'Complete', className: 'bg-emerald-100 text-emerald-600' },
      error: { label: 'Error', className: 'bg-red-100 text-red-600' }
    };
    const c = config[status] || config.pending;
    return <Badge className={c.className}>{c.label}</Badge>;
  };

  return (
    <Card className="border-0 shadow-premium dark:bg-slate-800/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2 dark:text-white">
          <Sparkles className="w-5 h-5 text-violet-500" />
          AI Document Processor
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Area */}
        <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-6 text-center hover:border-violet-400 transition-colors">
          <input
            type="file"
            multiple
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={handleFileUpload}
            className="hidden"
            id="doc-upload"
          />
          <label htmlFor="doc-upload" className="cursor-pointer">
            <Upload className="w-10 h-10 mx-auto text-slate-400 mb-3" />
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Drop documents here or <span className="text-violet-600 font-medium">browse</span>
            </p>
            <p className="text-xs text-slate-400 mt-1">PDF, PNG, JPG up to 10MB</p>
          </label>
        </div>

        {/* Queued Files */}
        {uploadedFiles.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-slate-700 dark:text-slate-300">
                {uploadedFiles.length} Document(s) Queued
              </h4>
              <Button
                onClick={processAllDocuments}
                disabled={isProcessing || uploadedFiles.every(f => f.status === 'complete')}
                className="bg-gradient-to-r from-violet-600 to-purple-600"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    {currentStep}
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Process All with AI
                  </>
                )}
              </Button>
            </div>

            <AnimatePresence>
              {uploadedFiles.map(file => (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  className={`p-3 rounded-lg border ${
                    file.status === 'complete' 
                      ? 'border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20' 
                      : file.status === 'error'
                        ? 'border-red-200 bg-red-50 dark:bg-red-900/20'
                        : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-slate-400" />
                      <div>
                        <p className="font-medium text-sm text-slate-700 dark:text-slate-300">{file.name}</p>
                        <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(file.status)}
                      {file.status !== 'complete' && (
                        <Button size="sm" variant="ghost" onClick={() => removeFile(file.id)}>
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Processing Progress */}
                  {['uploading', 'extracting', 'validating'].includes(file.status) && (
                    <div className="mt-3">
                      <Progress value={
                        file.status === 'uploading' ? 33 :
                        file.status === 'extracting' ? 66 : 90
                      } className="h-1" />
                    </div>
                  )}

                  {/* Results */}
                  {file.status === 'complete' && file.result && (
                    <div className="mt-3 pt-3 border-t border-emerald-200 dark:border-emerald-800">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge className={DOCUMENT_CATEGORIES[file.result.detected_category]?.color}>
                            {DOCUMENT_CATEGORIES[file.result.detected_category]?.label}
                          </Badge>
                          <span className="text-xs text-slate-500">
                            {file.result.matchConfidence?.toFixed(0)}% match confidence
                          </span>
                        </div>
                        <Button 
                          size="sm" 
                          onClick={() => applyAutoUpdate(file.result)}
                          className="bg-emerald-600 hover:bg-emerald-700 h-7 text-xs"
                        >
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Save & Update Profile
                        </Button>
                      </div>

                      {/* Extracted Data */}
                      <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                        {Object.entries(file.result.extracted_data || {}).filter(([_, v]) => v).map(([key, value]) => (
                          <div key={key} className="p-1.5 bg-white dark:bg-slate-800 rounded">
                            <span className="text-slate-500 capitalize">{key.replace(/_/g, ' ')}: </span>
                            <span className="font-medium text-slate-700 dark:text-slate-300">{value}</span>
                          </div>
                        ))}
                      </div>

                      {/* Validation Issues */}
                      {file.result.validationIssues?.length > 0 && (
                        <div className="space-y-1">
                          {file.result.validationIssues.map((issue, i) => (
                            <div 
                              key={i} 
                              className={`p-2 rounded text-xs flex items-start gap-2 ${
                                issue.severity === 'critical' 
                                  ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                  : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                              }`}
                            >
                              <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                              {issue.message}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Auto Updates Available */}
                      {file.result.autoUpdates?.length > 0 && (
                        <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs">
                          <p className="font-medium text-blue-700 dark:text-blue-400 mb-1">Auto-updates available:</p>
                          {file.result.autoUpdates.map((update, i) => (
                            <p key={i} className="text-blue-600 dark:text-blue-300">
                              • {update.field}: {update.oldValue} → {update.newValue}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {file.status === 'error' && (
                    <p className="mt-2 text-xs text-red-600">{file.error}</p>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </CardContent>
    </Card>
  );
}