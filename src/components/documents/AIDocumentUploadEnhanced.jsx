import { useState } from 'react'
import { base44 } from '@/api/base44Client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Upload, FileText, Loader2, CheckCircle, AlertCircle, 
  Sparkles, X
} from 'lucide-react';
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

export default function AIDocumentUploadEnhanced({ clientId, onUploadComplete }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [description, setDescription] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [processingStage, setProcessingStage] = useState('idle'); // idle, uploading, processing, complete
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile) throw new Error('No file selected');

      setProcessingStage('uploading');

      // Upload file
      const { file_url } = await base44.integrations.Core.UploadFile({ file: selectedFile });

      // Create document record
      const document = await base44.entities.Document.create({
        client_id: clientId,
        file_name: selectedFile.name,
        file_url,
        document_type: documentType,
        description,
        uploaded_by: (await base44.auth.me()).email
      });

      setProcessingStage('processing');

      // Trigger AI processing
      try {
        await base44.functions.invoke('aiDocumentProcessor', {
          document_id: document.id,
          file_url
        });
      } catch (error) {
        console.error('AI processing failed, but document uploaded:', error);
        // Don't fail the whole operation if AI processing fails
      }

      return document;
    },
    onSuccess: (document) => {
      setProcessingStage('complete');
      queryClient.invalidateQueries(['aiDocuments']);
      queryClient.invalidateQueries(['documents']);
      toast.success('Document uploaded and processed successfully');
      
      setTimeout(() => {
        setSelectedFile(null);
        setDescription('');
        setDocumentType('');
        setProcessingStage('idle');
        if (onUploadComplete) onUploadComplete(document);
      }, 2000);
    },
    onError: (error) => {
      setProcessingStage('idle');
      toast.error('Upload failed: ' + error.message);
    }
  });

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (50MB limit)
      if (file.size > 50 * 1024 * 1024) {
        toast.error('File size must be less than 50MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = () => {
    uploadMutation.mutate();
  };

  return (
    <Card className="border-0 shadow-lg dark:bg-slate-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-teal-600" />
          Upload Document with AI Processing
        </CardTitle>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          AI will automatically categorize, extract information, and tag your document
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {processingStage === 'idle' && (
          <>
            {/* File Input */}
            <div>
              <Label>Select Document</Label>
              <div className="mt-2">
                <label className="flex items-center justify-center w-full h-32 px-4 transition bg-white border-2 border-slate-300 border-dashed rounded-lg appearance-none cursor-pointer hover:border-teal-400 dark:bg-slate-900 dark:border-slate-700 dark:hover:border-teal-600">
                  <div className="flex flex-col items-center space-y-2">
                    <Upload className="w-8 h-8 text-slate-400" />
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {selectedFile ? selectedFile.name : 'Click to upload or drag and drop'}
                    </span>
                    <span className="text-xs text-slate-400">
                      PDF, JPG, PNG, DOCX up to 50MB
                    </span>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png,.docx,.doc"
                    onChange={handleFileSelect}
                  />
                </label>
              </div>
            </div>

            {/* Document Type */}
            <div>
              <Label>Document Type (Optional)</Label>
              <Input
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                placeholder="e.g., Policy Document, ID Card, Medical Record"
              />
            </div>

            {/* Description */}
            <div>
              <Label>Description (Optional)</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add any notes about this document..."
                rows={3}
              />
            </div>

            {/* Upload Button */}
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || uploadMutation.isPending}
              className="w-full bg-teal-600 hover:bg-teal-700"
            >
              {uploadMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload & Process with AI
                </>
              )}
            </Button>
          </>
        )}

        {/* Processing Stages */}
        <AnimatePresence>
          {processingStage !== 'idle' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="py-8"
            >
              <div className="flex flex-col items-center justify-center space-y-4">
                {processingStage === 'uploading' && (
                  <>
                    <Loader2 className="w-12 h-12 text-teal-600 animate-spin" />
                    <div className="text-center">
                      <p className="font-semibold text-slate-800 dark:text-white">
                        Uploading Document
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Please wait...
                      </p>
                    </div>
                  </>
                )}

                {processingStage === 'processing' && (
                  <>
                    <div className="relative">
                      <Loader2 className="w-12 h-12 text-teal-600 animate-spin" />
                      <Sparkles className="w-6 h-6 text-amber-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-slate-800 dark:text-white">
                        AI Processing Document
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Categorizing, extracting information, and generating tags...
                      </p>
                    </div>
                  </>
                )}

                {processingStage === 'complete' && (
                  <>
                    <CheckCircle className="w-12 h-12 text-green-500" />
                    <div className="text-center">
                      <p className="font-semibold text-slate-800 dark:text-white">
                        Upload Complete!
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Document has been processed and categorized by AI
                      </p>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Selected File Info */}
        {selectedFile && processingStage === 'idle' && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50">
            <FileText className="w-8 h-8 text-teal-600" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 dark:text-white truncate">
                {selectedFile.name}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedFile(null)}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}