import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  FileSearch, Sparkles, Loader2, CheckCircle, Upload, FileText
} from 'lucide-react';
import { toast } from 'sonner';

export default function SmartDocumentOCR({ onDataExtracted, documentType }) {
  const [extractedData, setExtractedData] = useState(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [file, setFile] = useState(null);

  const handleFileUpload = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    
    setFile(selectedFile);
    setIsExtracting(true);

    try {
      // Upload file first
      const { file_url } = await base44.integrations.Core.UploadFile({ file: selectedFile });

      // Define schema based on document type
      const schemas = {
        w9: {
          name: { type: "string" },
          business_name: { type: "string" },
          tax_classification: { type: "string" },
          address: { type: "string" },
          city: { type: "string" },
          state: { type: "string" },
          zip: { type: "string" },
          ssn_last_four: { type: "string" },
          ein: { type: "string" }
        },
        state_license: {
          holder_name: { type: "string" },
          license_number: { type: "string" },
          state: { type: "string" },
          license_type: { type: "string" },
          issue_date: { type: "string" },
          expiration_date: { type: "string" },
          npn: { type: "string" }
        },
        eo_certificate: {
          insured_name: { type: "string" },
          policy_number: { type: "string" },
          carrier: { type: "string" },
          effective_date: { type: "string" },
          expiration_date: { type: "string" },
          coverage_amount: { type: "string" }
        },
        contract: {
          agent_name: { type: "string" },
          carrier_name: { type: "string" },
          effective_date: { type: "string" },
          commission_rate: { type: "string" },
          states_covered: { type: "array", items: { type: "string" } },
          termination_clause: { type: "string" }
        },
        default: {
          document_type: { type: "string" },
          holder_name: { type: "string" },
          date: { type: "string" },
          key_information: { type: "string" }
        }
      };

      const schema = schemas[documentType] || schemas.default;

      const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: {
          type: "object",
          properties: schema
        }
      });

      if (result.status === 'success' && result.output) {
        setExtractedData(result.output);
        onDataExtracted?.(result.output, file_url);
        toast.success('Data extracted successfully');
      } else {
        toast.error('Could not extract data from document');
      }
    } catch (err) {
      console.error('OCR failed:', err);
      toast.error('Failed to process document');
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <FileSearch className="w-5 h-5 text-purple-600" />
          Smart Document OCR
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!extractedData && (
          <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center">
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={handleFileUpload}
              className="hidden"
              id="ocr-upload"
              disabled={isExtracting}
            />
            <label htmlFor="ocr-upload" className="cursor-pointer">
              {isExtracting ? (
                <div className="flex flex-col items-center">
                  <Loader2 className="w-8 h-8 text-purple-600 animate-spin mb-2" />
                  <p className="text-sm text-slate-600">Extracting data...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <Upload className="w-8 h-8 text-slate-400 mb-2" />
                  <p className="text-sm text-slate-600">Upload document to auto-extract data</p>
                  <p className="text-xs text-slate-400 mt-1">PDF, PNG, JPG supported</p>
                </div>
              )}
            </label>
          </div>
        )}

        {extractedData && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span className="text-sm text-emerald-700">Data extracted successfully</span>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(extractedData).map(([key, value]) => (
                value && (
                  <div key={key} className="p-2 bg-slate-50 rounded">
                    <Label className="text-xs text-slate-500 capitalize">
                      {key.replace(/_/g, ' ')}
                    </Label>
                    <p className="text-sm font-medium text-slate-700">
                      {Array.isArray(value) ? value.join(', ') : value}
                    </p>
                  </div>
                )
              ))}
            </div>

            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setExtractedData(null)}
              className="w-full mt-2"
            >
              Upload Another Document
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}