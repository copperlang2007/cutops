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
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { 
  Video, Sparkles, Loader2, Play, Clock, Camera,
  Volume2, Music, Type, RefreshCw, Save, Download,
  ChevronDown, ChevronUp, Film
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const durations = [
  { value: '6', label: '6 sec', name: 'Bumper Ad' },
  { value: '15', label: '15 sec', name: 'Pre-roll' },
  { value: '30', label: '30 sec', name: 'Standard Spot' },
  { value: '60', label: '60 sec', name: 'Extended' },
  { value: '90', label: '90 sec', name: 'Long-form' },
  { value: '120', label: '2 min', name: 'Feature' },
];

const platforms = [
  'YouTube Pre-roll', 'YouTube In-stream', 'TikTok', 'Instagram Reels',
  'Facebook Video', 'LinkedIn Video', 'TV Commercial', 'Connected TV (CTV)',
  'Cinema', 'Digital Billboard'
];

const styles = [
  'Cinematic', 'Documentary', 'Testimonial', 'Product Demo',
  'Animation', 'Motion Graphics', 'Lifestyle', 'Comedy',
  'Emotional/Inspirational', 'Fast-paced/Energetic'
];

const musicStyles = [
  'Upbeat Pop', 'Corporate/Professional', 'Emotional Piano',
  'Electronic/Modern', 'Acoustic/Organic', 'Epic/Orchestral',
  'Hip Hop/Urban', 'Jazz/Sophisticated', 'No Music'
];

export default function VideoScriptGenerator({ onSave, onGenerateStoryboard }) {
  const [formData, setFormData] = useState({
    productName: '',
    productDescription: '',
    duration: '30',
    platform: 'YouTube Pre-roll',
    style: 'Cinematic',
    targetAudience: '',
    keyMessages: '',
    tone: 'Professional',
    includeVoiceover: true,
    musicStyle: 'Upbeat Pop'
  });
  const [generatedScript, setGeneratedScript] = useState(null);
  const [expandedScenes, setExpandedScenes] = useState({});

  const generateMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('geminiContentCreator', {
        action: 'generateVideoScript',
        params: formData
      });
      return response.data;
    },
    onSuccess: (data) => {
      setGeneratedScript(data.data);
      toast.success('Video script generated!');
    },
    onError: (error) => {
      toast.error('Failed to generate: ' + error.message);
    }
  });

  const handleSave = async () => {
    if (!generatedScript) return;
    
    try {
      await base44.entities.AdContent.create({
        title: `${formData.productName} - ${formData.duration}s Video Script`,
        content_type: 'video_script',
        platform: formData.platform.toLowerCase().replace(/\s+/g, '_'),
        product_name: formData.productName,
        product_description: formData.productDescription,
        target_audience: formData.targetAudience,
        generated_content: generatedScript,
        status: 'draft',
        tags: [formData.style, `${formData.duration}s`, formData.platform]
      });
      toast.success('Script saved!');
      onSave?.();
    } catch (error) {
      toast.error('Failed to save');
    }
  };

  const toggleScene = (idx) => {
    setExpandedScenes(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const selectedDuration = durations.find(d => d.value === formData.duration);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Input Form */}
      <Card className="border-0 shadow-sm dark:bg-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="w-5 h-5 text-red-500" />
            Video Script Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Product/Service Name *</Label>
            <Input
              value={formData.productName}
              onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
              placeholder="e.g., Medicare Advantage Plan"
            />
          </div>

          <div>
            <Label>Description *</Label>
            <Textarea
              value={formData.productDescription}
              onChange={(e) => setFormData({ ...formData, productDescription: e.target.value })}
              placeholder="Describe your product/service..."
              rows={3}
            />
          </div>

          <div>
            <Label>Video Duration *</Label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {durations.map((dur) => (
                <button
                  key={dur.value}
                  onClick={() => setFormData({ ...formData, duration: dur.value })}
                  className={`p-3 rounded-lg border-2 transition-all text-center ${
                    formData.duration === dur.value
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  <p className="font-bold text-lg text-slate-800 dark:text-white">{dur.label}</p>
                  <p className="text-xs text-slate-500">{dur.name}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Platform</Label>
              <Select value={formData.platform} onValueChange={(v) => setFormData({ ...formData, platform: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {platforms.map(p => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Visual Style</Label>
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
            <Label>Target Audience</Label>
            <Input
              value={formData.targetAudience}
              onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
              placeholder="e.g., Adults 65+, Medicare-eligible seniors"
            />
          </div>

          <div>
            <Label>Key Messages (comma-separated)</Label>
            <Input
              value={formData.keyMessages}
              onChange={(e) => setFormData({ ...formData, keyMessages: e.target.value })}
              placeholder="e.g., $0 premium, dental included, easy enrollment"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Music Style</Label>
              <Select value={formData.musicStyle} onValueChange={(v) => setFormData({ ...formData, musicStyle: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {musicStyles.map(m => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between pt-6">
              <Label>Include Voiceover</Label>
              <Switch
                checked={formData.includeVoiceover}
                onCheckedChange={(c) => setFormData({ ...formData, includeVoiceover: c })}
              />
            </div>
          </div>

          <Button
            onClick={() => generateMutation.mutate()}
            disabled={!formData.productName || !formData.productDescription || generateMutation.isPending}
            className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
          >
            {generateMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating Script...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Video Script
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Script */}
      <Card className="border-0 shadow-sm dark:bg-slate-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Film className="w-5 h-5 text-red-500" />
              Generated Script
            </CardTitle>
            {generatedScript && (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => generateMutation.mutate()}>
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Regenerate
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => onGenerateStoryboard?.(generatedScript)}
                >
                  <Camera className="w-4 h-4 mr-1" />
                  Storyboard
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
          {!generatedScript ? (
            <div className="text-center py-12">
              <Video className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
              <p className="text-slate-500 dark:text-slate-400">
                Configure your video and generate a professional script
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header Info */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 text-white">
                <h3 className="font-bold text-lg">{generatedScript.title || formData.productName}</h3>
                <div className="flex items-center gap-4 mt-2 text-sm text-red-100">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {generatedScript.totalDuration || formData.duration}s
                  </span>
                  <span>{generatedScript.format || selectedDuration?.name}</span>
                </div>
              </div>

              {/* Opening Hook */}
              {generatedScript.openingHook && (
                <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                  <p className="text-xs font-medium text-amber-700 dark:text-amber-300 mb-1">Opening Hook (First 3 seconds)</p>
                  <p className="text-sm text-amber-800 dark:text-amber-200">{generatedScript.openingHook}</p>
                </div>
              )}

              {/* Scenes */}
              <div className="space-y-3">
                {generatedScript.scenes?.map((scene, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="border dark:border-slate-700 rounded-lg overflow-hidden"
                  >
                    <button
                      onClick={() => toggleScene(idx)}
                      className="w-full p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
                          <span className="font-bold text-red-600">{scene.sceneNumber || idx + 1}</span>
                        </div>
                        <div className="text-left">
                          <p className="font-medium text-slate-800 dark:text-white">Scene {scene.sceneNumber || idx + 1}</p>
                          <p className="text-xs text-slate-500">{scene.duration}s • {scene.cameraWork || 'Standard shot'}</p>
                        </div>
                      </div>
                      {expandedScenes[idx] ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>

                    <AnimatePresence>
                      {expandedScenes[idx] && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t dark:border-slate-700"
                        >
                          <div className="p-4 space-y-4">
                            {/* Visual */}
                            <div className="flex gap-3">
                              <Camera className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                              <div>
                                <p className="text-xs font-medium text-blue-600 mb-1">Visual</p>
                                <p className="text-sm text-slate-700 dark:text-slate-300">{scene.visual}</p>
                              </div>
                            </div>

                            {/* Audio */}
                            {scene.audio && (
                              <div className="flex gap-3">
                                <Volume2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-xs font-medium text-green-600 mb-1">Audio</p>
                                  {scene.audio.voiceover && (
                                    <p className="text-sm text-slate-700 dark:text-slate-300 mb-1">
                                      <span className="font-medium">VO:</span> "{scene.audio.voiceover}"
                                    </p>
                                  )}
                                  {scene.audio.musicCue && (
                                    <p className="text-xs text-slate-500">
                                      <Music className="w-3 h-3 inline mr-1" />
                                      {scene.audio.musicCue}
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* On-screen Text */}
                            {scene.onScreenText && (
                              <div className="flex gap-3">
                                <Type className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-xs font-medium text-purple-600 mb-1">On-Screen Text</p>
                                  <p className="text-sm text-slate-700 dark:text-slate-300">{scene.onScreenText}</p>
                                </div>
                              </div>
                            )}

                            {/* Direction */}
                            {scene.direction && (
                              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                                <p className="text-xs font-medium text-slate-500 mb-1">Direction Notes</p>
                                <p className="text-sm text-slate-600 dark:text-slate-400">{scene.direction}</p>
                              </div>
                            )}

                            {/* Transition */}
                            {scene.transition && (
                              <div className="text-right">
                                <Badge variant="outline">{scene.transition}</Badge>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>

              {/* End Card */}
              {generatedScript.endCard && (
                <div className="p-4 rounded-lg bg-slate-100 dark:bg-slate-900/50 border dark:border-slate-700">
                  <p className="font-medium text-slate-800 dark:text-white mb-2">End Card ({generatedScript.endCard.duration}s)</p>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {generatedScript.endCard.elements?.map((el, idx) => (
                      <Badge key={idx} variant="outline">{el}</Badge>
                    ))}
                  </div>
                  {generatedScript.endCard.voiceover && (
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      VO: "{generatedScript.endCard.voiceover}"
                    </p>
                  )}
                </div>
              )}

              {/* Production Notes */}
              {generatedScript.productionNotes && (
                <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <p className="font-medium text-blue-700 dark:text-blue-300 mb-3">Production Notes</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {generatedScript.productionNotes.castingNotes && (
                      <div>
                        <p className="text-xs text-blue-600 mb-1">Casting</p>
                        <p className="text-slate-700 dark:text-slate-300">{generatedScript.productionNotes.castingNotes}</p>
                      </div>
                    )}
                    {generatedScript.productionNotes.estimatedBudget && (
                      <div>
                        <p className="text-xs text-blue-600 mb-1">Budget Tier</p>
                        <Badge className="bg-blue-100 text-blue-700">{generatedScript.productionNotes.estimatedBudget}</Badge>
                      </div>
                    )}
                  </div>
                  {generatedScript.productionNotes.locationSuggestions?.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs text-blue-600 mb-1">Location Suggestions</p>
                      <div className="flex flex-wrap gap-2">
                        {generatedScript.productionNotes.locationSuggestions.map((loc, idx) => (
                          <Badge key={idx} variant="outline" className="border-blue-300">{loc}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}