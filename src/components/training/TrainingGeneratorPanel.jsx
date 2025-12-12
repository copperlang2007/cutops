import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Upload, BookOpen, GraduationCap, FileText, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function TrainingGeneratorPanel() {
  const queryClient = useQueryClient();
  const [type, setType] = useState('class');
  const [prompt, setPrompt] = useState('');
  const [category, setCategory] = useState('sales');
  const [passingScore, setPassingScore] = useState('70');
  const [documentFile, setDocumentFile] = useState(null);
  const [generatedModule, setGeneratedModule] = useState(null);

  const uploadMutation = useMutation({
    mutationFn: async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await base44.integrations.Core.UploadFile({ file });
      return response.file_url;
    }
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      let documentUrl = null;
      if (documentFile) {
        documentUrl = await uploadMutation.mutateAsync(documentFile);
      }

      return base44.functions.invoke('aiTrainingGenerator', {
        type,
        prompt,
        documentUrl,
        category,
        passingScore: parseInt(passingScore)
      });
    },
    onSuccess: (response) => {
      setGeneratedModule(response.data);
      queryClient.invalidateQueries(['trainingModules']);
      toast.success('Training module generated!', {
        description: `Created ${type} with ${response.data.question_count} exam questions`
      });
    },
    onError: (error) => {
      toast.error('Generation failed', { description: error.message });
    }
  });

  const typeInfo = {
    quiz: {
      icon: FileText,
      label: 'Quiz',
      description: '10-15 minutes • 5-10 questions',
      color: 'from-green-500 to-emerald-600'
    },
    class: {
      icon: BookOpen,
      label: 'Class',
      description: '30-45 minutes • 15-20 questions',
      color: 'from-blue-500 to-indigo-600'
    },
    course: {
      icon: GraduationCap,
      label: 'Course',
      description: '60-90 minutes • 25-30 questions',
      color: 'from-purple-500 to-pink-600'
    }
  };

  const TypeIcon = typeInfo[type].icon;

  return (
    <div className="space-y-6">
      <Card className="clay-morphism border-0">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${typeInfo[type].color} flex items-center justify-center`}>
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl">AI Training Generator</CardTitle>
              <p className="text-sm text-slate-500 mt-1">Create custom training modules with AI</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Type Selection */}
          <div>
            <label className="text-sm font-medium mb-3 block">Training Type</label>
            <div className="grid grid-cols-3 gap-3">
              {Object.entries(typeInfo).map(([key, info]) => {
                const Icon = info.icon;
                return (
                  <button
                    key={key}
                    onClick={() => setType(key)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      type === key
                        ? 'border-slate-900 bg-slate-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <Icon className={`w-6 h-6 mx-auto mb-2 ${type === key ? 'text-slate-900' : 'text-slate-400'}`} />
                    <p className="font-semibold text-sm">{info.label}</p>
                    <p className="text-xs text-slate-500 mt-1">{info.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Prompt */}
          <div>
            <label className="text-sm font-medium mb-2 block">Training Topic</label>
            <Textarea
              placeholder="Describe what you want to train agents on... e.g., 'Medicare Advantage enrollment process for 2025'"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Category */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Category</label>
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

            <div>
              <label className="text-sm font-medium mb-2 block">Passing Score (%)</label>
              <Input
                type="number"
                min="0"
                max="100"
                value={passingScore}
                onChange={(e) => setPassingScore(e.target.value)}
              />
            </div>
          </div>

          {/* Document Upload */}
          <div>
            <label className="text-sm font-medium mb-2 block">Reference Document (Optional)</label>
            <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center">
              <input
                type="file"
                id="doc-upload"
                className="hidden"
                accept=".pdf,.doc,.docx,.txt"
                onChange={(e) => setDocumentFile(e.target.files[0])}
              />
              <label htmlFor="doc-upload" className="cursor-pointer">
                <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                <p className="text-sm text-slate-600">
                  {documentFile ? documentFile.name : 'Upload document to use as reference'}
                </p>
                <p className="text-xs text-slate-400 mt-1">PDF, DOC, DOCX, TXT</p>
              </label>
            </div>
          </div>

          <Button
            onClick={() => generateMutation.mutate()}
            disabled={!prompt || generateMutation.isPending}
            className="w-full bg-gradient-to-r from-slate-900 to-black hover:from-slate-800 hover:to-slate-900"
          >
            {generateMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating {type}...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate {typeInfo[type].label}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Module Preview */}
      {generatedModule && (
        <Card className="clay-morphism border-0 border-t-4 border-t-emerald-500">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
              <CardTitle>Training Module Created</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg">{generatedModule.module.title}</h3>
              <p className="text-sm text-slate-600 mt-1">{generatedModule.module.description}</p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500">Duration</p>
                <p className="text-lg font-semibold">{generatedModule.module.duration_minutes} min</p>
              </div>
              <div className="text-center p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500">Questions</p>
                <p className="text-lg font-semibold">{generatedModule.question_count}</p>
              </div>
              <div className="text-center p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500">Pass Score</p>
                <p className="text-lg font-semibold">{generatedModule.module.passing_score}%</p>
              </div>
            </div>

            <div className="pt-3 border-t">
              <p className="text-sm text-emerald-600 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Training module is now available in the library
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}