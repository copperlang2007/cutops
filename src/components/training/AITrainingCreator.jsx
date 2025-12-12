import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Upload, Loader2, FileText } from 'lucide-react';
import { toast } from 'sonner';

export default function AITrainingCreator() {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState('prompt');
  const [prompt, setPrompt] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('sales');
  const [file, setFile] = useState(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState('');

  const uploadFileMutation = useMutation({
    mutationFn: async (file) => {
      const result = await base44.integrations.Core.UploadFile({ file });
      return result.file_url;
    },
    onSuccess: (url) => {
      setUploadedFileUrl(url);
      toast.success('File uploaded');
    }
  });

  const generateTrainingMutation = useMutation({
    mutationFn: async ({ prompt, fileUrl, title, category }) => {
      const fullPrompt = fileUrl
        ? `Create comprehensive training content based on the uploaded document. Title: ${title}. Category: ${category}. Additional context: ${prompt || 'None'}`
        : `Create comprehensive training content on: ${prompt}. Title: ${title}. Category: ${category}`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: fullPrompt,
        file_urls: fileUrl ? [fileUrl] : undefined,
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            content: { type: "string" },
            learning_objectives: { type: "array", items: { type: "string" } },
            duration_minutes: { type: "number" },
            tags: { type: "array", items: { type: "string" } }
          }
        }
      });

      return await base44.entities.TrainingModule.create({
        ...result,
        category,
        is_active: true
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['trainingModules']);
      toast.success('Training module created successfully');
      setPrompt('');
      setTitle('');
      setFile(null);
      setUploadedFileUrl('');
    }
  });

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      uploadFileMutation.mutate(selectedFile);
    }
  };

  const handleGenerate = () => {
    if (!title || (mode === 'prompt' && !prompt) || (mode === 'document' && !uploadedFileUrl)) {
      toast.error('Please fill in all required fields');
      return;
    }

    generateTrainingMutation.mutate({
      prompt,
      fileUrl: mode === 'document' ? uploadedFileUrl : null,
      title,
      category
    });
  };

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            AI Training Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Generate comprehensive training modules using AI from prompts or uploaded documents
          </p>

          <div className="flex gap-2">
            <Button
              variant={mode === 'prompt' ? 'default' : 'outline'}
              onClick={() => setMode('prompt')}
              className="flex-1"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              From Prompt
            </Button>
            <Button
              variant={mode === 'document' ? 'default' : 'outline'}
              onClick={() => setMode('document')}
              className="flex-1"
            >
              <Upload className="w-4 h-4 mr-2" />
              From Document
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg">
        <CardContent className="pt-6 space-y-4">
          <div>
            <Label>Training Title *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Advanced Objection Handling Techniques"
            />
          </div>

          <div>
            <Label>Category *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sales">Sales</SelectItem>
                <SelectItem value="compliance">Compliance</SelectItem>
                <SelectItem value="product">Product Knowledge</SelectItem>
                <SelectItem value="communication">Communication</SelectItem>
                <SelectItem value="technical">Technical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {mode === 'prompt' ? (
            <div>
              <Label>Training Description / Prompt *</Label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={6}
                placeholder="Describe what this training should cover. Be as detailed as possible..."
              />
            </div>
          ) : (
            <div>
              <Label>Upload Document *</Label>
              <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-8 text-center">
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.txt"
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  {uploadFileMutation.isPending ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                      <p className="text-sm text-slate-600">Uploading...</p>
                    </div>
                  ) : uploadedFileUrl ? (
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="w-8 h-8 text-green-600" />
                      <p className="text-sm text-green-600 font-medium">
                        File uploaded successfully
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          setUploadedFileUrl('');
                          setFile(null);
                        }}
                      >
                        Change File
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="w-8 h-8 text-slate-400" />
                      <p className="text-sm text-slate-600">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-slate-400">
                        PDF, DOC, DOCX, TXT (max 10MB)
                      </p>
                    </div>
                  )}
                </label>
              </div>
              {mode === 'document' && (
                <div className="mt-4">
                  <Label>Additional Context (Optional)</Label>
                  <Textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={3}
                    placeholder="Any additional context or instructions..."
                  />
                </div>
              )}
            </div>
          )}

          <Button
            onClick={handleGenerate}
            disabled={generateTrainingMutation.isPending}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500"
            size="lg"
          >
            {generateTrainingMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating Training...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Training Module
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}