import { useState } from 'react'
import { base44 } from '@/api/base44Client'
import { useMutation } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { 
  Camera, Sparkles, Loader2, Grid3X3, Save, Download,
  RefreshCw, Clock, ChevronLeft, ChevronRight, Film
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

const styles = [
  'Clean Advertising', 'Cinematic', 'Comic Book', 'Sketch/Pencil',
  'Watercolor', 'Digital Illustration', 'Minimalist', 'Photorealistic'
];

const aspectRatios = [
  { id: '16:9', name: 'Widescreen (16:9)' },
  { id: '9:16', name: 'Vertical (9:16)' },
  { id: '1:1', name: 'Square (1:1)' },
  { id: '4:3', name: 'Standard (4:3)' },
];

export default function StoryboardGenerator({ script, onSave }) {
  const [style, setStyle] = useState('Clean Advertising');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [storyboard, setStoryboard] = useState(null);
  const [currentFrame, setCurrentFrame] = useState(0);

  const generateMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('geminiContentCreator', {
        action: 'generateStoryboard',
        params: { script, style, aspectRatio }
      });
      return response.data;
    },
    onSuccess: (data) => {
      setStoryboard(data.data);
      setCurrentFrame(0);
      toast.success('Storyboard generated!');
    },
    onError: (error) => {
      toast.error('Failed to generate: ' + error.message);
    }
  });

  const handleSave = async () => {
    if (!storyboard) return;
    
    try {
      await base44.entities.AdContent.create({
        title: `Storyboard - ${storyboard.projectTitle || 'Video Project'}`,
        content_type: 'storyboard',
        generated_content: storyboard,
        status: 'draft',
        tags: [style, aspectRatio]
      });
      toast.success('Storyboard saved!');
      onSave?.();
    } catch (error) {
      toast.error('Failed to save');
    }
  };

  const frames = storyboard?.frames || [];
  const frame = frames[currentFrame];

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card className="border-0 shadow-sm dark:bg-slate-800">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <Label>Visual Style</Label>
              <Select value={style} onValueChange={setStyle}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {styles.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <Label>Aspect Ratio</Label>
              <Select value={aspectRatio} onValueChange={setAspectRatio}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {aspectRatios.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={() => generateMutation.mutate()}
              disabled={!script || generateMutation.isPending}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
            >
              {generateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Storyboard
                </>
              )}
            </Button>
            {storyboard && (
              <Button onClick={handleSave} className="bg-teal-600 hover:bg-teal-700">
                <Save className="w-4 h-4 mr-1" />
                Save
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {!storyboard && !generateMutation.isPending && (
        <Card className="border-0 shadow-sm dark:bg-slate-800">
          <CardContent className="py-12 text-center">
            <Grid3X3 className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">
              {script ? 'Ready to Generate' : 'No Script Provided'}
            </h3>
            <p className="text-slate-500 dark:text-slate-400">
              {script 
                ? 'Click "Generate Storyboard" to create visual frames from your script'
                : 'First generate a video script, then create a storyboard from it'}
            </p>
          </CardContent>
        </Card>
      )}

      {storyboard && frames.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Frame View */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-sm dark:bg-slate-800 overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="w-5 h-5 text-indigo-500" />
                    Frame {currentFrame + 1} of {frames.length}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCurrentFrame(Math.max(0, currentFrame - 1))}
                      disabled={currentFrame === 0}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCurrentFrame(Math.min(frames.length - 1, currentFrame + 1))}
                      disabled={currentFrame === frames.length - 1}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentFrame}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    className="space-y-4"
                  >
                    {/* Frame Image/Description */}
                    <div className={`rounded-xl overflow-hidden border dark:border-slate-700 ${
                      aspectRatio === '9:16' ? 'aspect-[9/16] max-w-xs mx-auto' :
                      aspectRatio === '1:1' ? 'aspect-square' :
                      aspectRatio === '4:3' ? 'aspect-[4/3]' : 'aspect-video'
                    }`}>
                      {frame.generatedImage?.type === 'image' ? (
                        <img 
                          src={frame.generatedImage.content} 
                          alt={`Frame ${currentFrame + 1}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800 p-6 flex items-center justify-center">
                          <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
                            {frame.visualDescription || frame.generatedImage?.content || 'Frame visualization'}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Frame Details */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                        <p className="text-xs font-medium text-slate-500 mb-1">Shot Type</p>
                        <p className="font-medium text-slate-800 dark:text-white">{frame.shotType}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                        <p className="text-xs font-medium text-slate-500 mb-1">Time Code</p>
                        <p className="font-medium text-slate-800 dark:text-white flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {frame.timeCode}
                        </p>
                      </div>
                    </div>

                    {frame.cameraMovement && (
                      <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                        <p className="text-xs font-medium text-blue-600 mb-1">Camera Movement</p>
                        <p className="text-sm text-slate-700 dark:text-slate-300">{frame.cameraMovement}</p>
                      </div>
                    )}

                    {frame.action && (
                      <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                        <p className="text-xs font-medium text-green-600 mb-1">Action</p>
                        <p className="text-sm text-slate-700 dark:text-slate-300">{frame.action}</p>
                      </div>
                    )}

                    {frame.dialogue && (
                      <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                        <p className="text-xs font-medium text-purple-600 mb-1">Dialogue/VO</p>
                        <p className="text-sm text-slate-700 dark:text-slate-300 italic">"{frame.dialogue}"</p>
                      </div>
                    )}

                    {frame.mood && (
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{frame.mood}</Badge>
                        {frame.colorNotes && <Badge variant="outline">{frame.colorNotes}</Badge>}
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </CardContent>
            </Card>
          </div>

          {/* Thumbnails Sidebar */}
          <div>
            <Card className="border-0 shadow-sm dark:bg-slate-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">All Frames</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {frames.map((f, idx) => (
                    <motion.button
                      key={idx}
                      onClick={() => setCurrentFrame(idx)}
                      className={`w-full p-2 rounded-lg border-2 transition-all flex items-center gap-3 ${
                        currentFrame === idx
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="w-16 h-10 rounded bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0">
                        {f.generatedImage?.type === 'image' ? (
                          <img 
                            src={f.generatedImage.content} 
                            alt="" 
                            className="w-full h-full object-cover rounded"
                          />
                        ) : (
                          <Film className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                      <div className="text-left flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-800 dark:text-white">
                          Frame {f.frameNumber || idx + 1}
                        </p>
                        <p className="text-xs text-slate-500 truncate">{f.shotType}</p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Style Guide */}
            {storyboard.styleGuide && (
              <Card className="border-0 shadow-sm dark:bg-slate-800 mt-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Style Guide</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {storyboard.styleGuide.visualStyle && (
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Visual Style</p>
                      <p className="text-sm text-slate-700 dark:text-slate-300">{storyboard.styleGuide.visualStyle}</p>
                    </div>
                  )}
                  {storyboard.styleGuide.colorPalette?.length > 0 && (
                    <div>
                      <p className="text-xs text-slate-500 mb-2">Color Palette</p>
                      <div className="flex gap-1">
                        {storyboard.styleGuide.colorPalette.map((color, idx) => (
                          <div
                            key={idx}
                            className="w-8 h-8 rounded-lg border dark:border-slate-600"
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}