import { useState } from 'react'
import { base44 } from '@/api/base44Client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Upload, FileText, Shield, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function DocumentComplianceScanner({ agentId, onScanComplete }) {
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadedDocument, setUploadedDocument] = useState(null);
  const [scanResult, setScanResult] = useState(null);

  const uploadMutation = useMutation({
    mutationFn: async (file) => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      const document = await base44.entities.Document.create({
        name: file.name,
        document_type: 'other',
        file_url,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        agent_id: agentId,
        status: 'pending_verification'
      });

      return document;
    },
    onSuccess: (document) => {
      setUploadedDocument(document);
      toast.success('Document uploaded successfully');
    },
    onError: (error) => {
      toast.error('Upload failed: ' + error.message);
    }
  });

  const scanMutation = useMutation({
    mutationFn: async (documentId) => {
      const result = await base44.functions.invoke('scanDocumentCompliance', {
        documentId,
        agentId
      });
      return result.data;
    },
    onSuccess: (result) => {
      setScanResult(result);
      queryClient.invalidateQueries(['complianceFlags']);
      queryClient.invalidateQueries(['complianceScans']);
      
      if (result.violations_count === 0) {
        toast.success('Document is compliant!');
      } else {
        toast.warning(`${result.violations_count} violation(s) detected`);
      }
      
      if (onScanComplete) onScanComplete(result);
    },
    onError: (error) => {
      toast.error('Scan failed: ' + error.message);
    }
  });

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setScanResult(null);
      setUploadedDocument(null);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    }
  };

  const handleScan = () => {
    if (uploadedDocument) {
      scanMutation.mutate(uploadedDocument.id);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      compliant: 'bg-green-100 text-green-700',
      warning: 'bg-yellow-100 text-yellow-700',
      violation: 'bg-orange-100 text-orange-700',
      critical: 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };

  const getSeverityColor = (severity) => {
    const colors = {
      low: 'bg-blue-100 text-blue-700',
      medium: 'bg-yellow-100 text-yellow-700',
      high: 'bg-orange-100 text-orange-700',
      critical: 'bg-red-100 text-red-700'
    };
    return colors[severity] || 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-slate-900" />
            Document Compliance Scanner
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* File Upload */}
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-slate-900 transition-colors">
            <input
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              onChange={handleFileSelect}
              className="hidden"
              id="document-upload"
            />
            <label htmlFor="document-upload" className="cursor-pointer">
              <Upload className="w-12 h-12 mx-auto text-slate-400 mb-3" />
              <p className="text-sm text-slate-600 mb-1">
                {selectedFile ? selectedFile.name : 'Click to upload document'}
              </p>
              <p className="text-xs text-slate-400">
                Supports PDF, Word, and Text files
              </p>
            </label>
          </div>

          {/* Action Buttons */}
          {selectedFile && !uploadedDocument && (
            <Button
              onClick={handleUpload}
              disabled={uploadMutation.isPending}
              className="w-full bg-slate-900 hover:bg-black"
            >
              {uploadMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Document
                </>
              )}
            </Button>
          )}

          {uploadedDocument && !scanResult && (
            <Button
              onClick={handleScan}
              disabled={scanMutation.isPending}
              className="w-full bg-slate-900 hover:bg-black"
            >
              {scanMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Scanning for compliance issues...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  Scan for Compliance
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Scan Results */}
      {scanResult && (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                {scanResult.violations_count === 0 ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                )}
                Scan Results
              </CardTitle>
              <Badge className={getStatusColor(scanResult.overall_status)}>
                {scanResult.overall_status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Score */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-600">Compliance Score</span>
                <span className="text-2xl font-bold text-slate-900">
                  {scanResult.compliance_score}%
                </span>
              </div>
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-slate-900 to-black transition-all"
                  style={{ width: `${scanResult.compliance_score}%` }}
                />
              </div>
            </div>

            {/* Summary */}
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-700">{scanResult.summary}</p>
            </div>

            {/* Violations */}
            {scanResult.violations_count > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold text-slate-900">
                  Violations Detected ({scanResult.violations_count})
                </h4>
                {scanResult.violations.map((violation, idx) => (
                  <div key={idx} className="p-4 border border-slate-200 rounded-lg space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getSeverityColor(violation.severity)}>
                            {violation.severity}
                          </Badge>
                          <span className="text-xs text-slate-500">
                            {violation.violation_type}
                          </span>
                        </div>
                        <p className="text-sm text-slate-700 mb-2">
                          <span className="font-medium">Flagged text: </span>
                          "{violation.flagged_text}"
                        </p>
                        {violation.compliant_alternative && (
                          <p className="text-sm text-green-700 bg-green-50 p-2 rounded">
                            <span className="font-medium">Suggestion: </span>
                            "{violation.compliant_alternative}"
                          </p>
                        )}
                      </div>
                    </div>
                    {violation.regulation_reference && (
                      <p className="text-xs text-slate-500">
                        Reference: {violation.regulation_reference}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Actions Created */}
            {(scanResult.flags_created?.length > 0 || scanResult.tasks_created?.length > 0) && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  ✓ {scanResult.flags_created?.length || 0} compliance flag(s) created
                </p>
                {scanResult.tasks_created?.length > 0 && (
                  <p className="text-sm text-blue-800">
                    ✓ {scanResult.tasks_created.length} review task(s) created
                  </p>
                )}
              </div>
            )}

            {/* New Scan Button */}
            <Button
              onClick={() => {
                setSelectedFile(null);
                setUploadedDocument(null);
                setScanResult(null);
              }}
              variant="outline"
              className="w-full"
            >
              <FileText className="w-4 h-4 mr-2" />
              Scan Another Document
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}