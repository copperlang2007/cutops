import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Video, Sparkles, Loader2, Play, Download, Save,
  RefreshCw, Clock, Film, Wand2, AlertCircle, CheckCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const durations = [
  { value: '5', label: '5 seconds' },
  { value: '10', label: '10 seconds' },
  { value: '15', label: '15 seconds' },
  { value: '30', label: '30 seconds' },
];

const styles = [
  'Cinematic', 'Commercial', 'Motion Graphics', 'Lifestyle',
  'Product Showcase', 'Testimonial', 'Animated', 'Documentary'
];

const aspectRatios = [
  { id: '16:9', name: 'Landscape (16:9)' },
  { id: '9:16', name: 'Portrait (9:16)' },
  { id: '1:1', name: 'Square (1:1)' },
];

export default function VideoGenerator({ script, onSave }) {
  const [formData, setFormData] = useState({
    concept: '',
    duration: '5',
    style: 'Commercial',
    aspectRatio: '16:9'
  });
  const [generatedVideo, setGeneratedVideo] = useState(null);

  const generateMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('geminiContentCreator', {
        action: 'generateVideo',
        params: {
          ...formData,
          script: script
        }
      });
      return response.data;
    },
    onSuccess: (data) => {
      setGeneratedVideo(data.data);
      toast.success('Video generation complete!');
    },
    onError: (error) => {
      toast.error('Failed to generate: ' + error.message);
    }
  });

  const handleSave = async () => {
    if (!generatedVideo) return;
    
    try {
      await base44.entities.AdContent.create({
        title: `Video - ${formData.concept.slice(0, 50) || 'Generated Video'}`,
        content_type: 'video',
        generated_content: generatedVideo,
        status: 'draft',
        tags: [formData.style, `${formData.duration}s`, formData.aspectRatio]
      });
      toast.success('Video saved!');
      onSave?.();
    } catch (error) {
      toast.error('Failed to save');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Input Form */}
      <Card className="border-0 shadow-sm dark:bg-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-violet-500" />
            AI Video Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-lg bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-violet-600 mt-0.5" />
              <div>
                <p className="font-medium text-violet-700 dark:text-violet-300">Powered by Google Veo 2</p>
                <p className="text-sm text-violet-600 dark:text-violet-400">
                  Generate high-quality video content from text descriptions
                </p>
              </div>
            </div>
          </div>

          <div>
            <Label>Video Concept *</Label>
            <Textarea
              value={formData.concept}
              onChange={(e) => setFormData({ ...formData, concept: e.target.value })}
              placeholder="Describe the video you want to create... e.g., 'A happy senior couple walking through a sunny park, looking at each other and smiling, cinematic quality'"
              rows={4}
            />
          </div>

          {script && (
            <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <p className="text-sm font-medium text-green-700 dark:text-green-300">Script Attached</p>
              </div>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                The video will be generated based on your script
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Duration</Label>
              <Select value={formData.duration} onValueChange={(v) => setFormData({ ...formData, duration: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {durations.map(d => (
                    <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Style</Label>
              <Select value={formData.style} onValueChange={(v) => setFormData({ ...formData, style: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {styles.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Aspect Ratio</Label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {aspectRatios.map((ratio) => (
                <button
                  key={ratio.id}
                  onClick={() => setFormData({ ...formData, aspectRatio: ratio.id })}
                  className={`p-3 rounded-lg border-2 transition-all text-center ${
                    formData.aspectRatio === ratio.id
                      ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  <p className="font-medium text-sm text-slate-800 dark:text-white">{ratio.name}</p>
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={() => generateMutation.mutate()}
            disabled={!formData.concept || generateMutation.isPending}
            className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
          >
            {generateMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating Video...
              </>
            ) : (
              <>
                <Video className="w-4 h-4 mr-2" />
                Generate Video
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Video */}
      <Card className="border-0 shadow-sm dark:bg-slate-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Film className="w-5 h-5 text-violet-500" />
              Generated Video
            </CardTitle>
            {generatedVideo && (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => generateMutation.mutate()}>
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Regenerate
                </Button>
                <Button size="sm" onClick={handleSave} className="bg-teal-600 hover:bg-teal-700">
                  <Save className="w-4 h-4 mr-1" />
                  Save
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {generateMutation.isPending ? (
            <div className="py-12 text-center">
              <div className="relative w-24 h-24 mx-auto mb-4">
                <div className="absolute inset-0 rounded-full border-4 border-violet-200 dark:border-violet-800" />
                <div className="absolute inset-0 rounded-full border-4 border-violet-500 border-t-transparent animate-spin" />
                <Video className="absolute inset-0 m-auto w-10 h-10 text-violet-500" />
              </div>
              <p className="font-medium text-slate-800 dark:text-white mb-2">Generating Video</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                This may take a moment...
              </p>
              <Progress value={45} className="mt-4 max-w-xs mx-auto" />
            </div>
          ) : !generatedVideo ? (
            <div className="text-center py-12">
              <Video className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
              <p className="text-slate-500 dark:text-slate-400">
                Enter a concept and generate AI-powered video content
              </p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Video Preview */}
              {generatedVideo.type === 'video' && generatedVideo.content ? (
                <div className="rounded-xl overflow-hidden border dark:border-slate-700">
                  <video 
                    controls 
                    className="w-full"
                    poster="/api/placeholder/640/360"
                  >
                    <source src={generatedVideo.content} type="video/mp4" />
                    Your browser does not support video playback.
                  </video>
                  <div className="p-3 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        {formData.duration}s • {formData.aspectRatio}
                      </span>
                    </div>
                    <Button size="sm" variant="outline">
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-amber-700 dark:text-amber-300">Video Specification Generated</p>
                        <p className="text-sm text-amber-600 dark:text-amber-400">
                          Direct video generation is in preview. Here's a detailed production specification.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Production Spec */}
                  <div className={`rounded-xl overflow-hidden border dark:border-slate-700 bg-gradient-to-br from-slate-800 to-slate-900 ${
                    formData.aspectRatio === '9:16' ? 'aspect-[9/16] max-w-xs mx-auto' :
                    formData.aspectRatio === '1:1' ? 'aspect-square' : 'aspect-video'
                  } flex items-center justify-center`}>
                    <div className="text-center text-white p-6">
                      <Play className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p className="text-sm opacity-70">Video Preview</p>
                      <p className="text-xs opacity-50 mt-1">{formData.duration}s • {formData.style}</p>
                    </div>
                  </div>

                  {/* Prompt Used */}
                  {generatedVideo.prompt && (
                    <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                      <p className="text-xs font-medium text-slate-500 mb-2">AI Prompt</p>
                      <p className="text-sm text-slate-700 dark:text-slate-300">{generatedVideo.prompt}</p>
                    </div>
                  )}

                  {/* Specification Details */}
                  {generatedVideo.content && typeof generatedVideo.content === 'object' && !generatedVideo.content.raw && (
                    <div className="space-y-3">
                      {generatedVideo.content.shots && (
                        <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                          <p className="font-medium text-slate-700 dark:text-slate-300 mb-2">Shot Breakdown</p>
                          <div className="space-y-2">
                            {generatedVideo.content.shots.map((shot, idx) => (
                              <div key={idx} className="flex gap-3 text-sm">
                                <Badge variant="outline">{idx + 1}</Badge>
                                <span className="text-slate-600 dark:text-slate-400">{shot}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {generatedVideo.content.visualEffects && (
                        <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                          <p className="font-medium text-blue-700 dark:text-blue-300 mb-2">Visual Effects</p>
                          <p className="text-sm text-slate-700 dark:text-slate-300">
                            {generatedVideo.content.visualEffects}
                          </p>
                        </div>
                      )}

                      {generatedVideo.content.colorGrading && (
                        <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                          <p className="font-medium text-purple-700 dark:text-purple-300 mb-2">Color Grading</p>
                          <p className="text-sm text-slate-700 dark:text-slate-300">
                            {generatedVideo.content.colorGrading}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Raw content fallback */}
                  {generatedVideo.content?.raw && (
                    <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                      <p className="text-xs font-medium text-slate-500 mb-2">Production Specification</p>
                      <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                        {generatedVideo.content.raw}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}