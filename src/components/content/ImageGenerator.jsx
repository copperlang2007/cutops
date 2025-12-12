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
import { 
  Image as ImageIcon, Sparkles, Loader2, Download, Save,
  Palette, Sun, Layout, RefreshCw, Copy, Check
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const styles = [
  'Photorealistic', 'Minimalist', 'Bold & Colorful', 'Vintage/Retro',
  'Luxury', 'Corporate', 'Playful', 'Dark & Moody', 'Natural/Organic',
  'Tech/Futuristic', 'Hand-drawn', 'Abstract'
];

const moods = [
  'Energetic', 'Calm', 'Professional', 'Warm', 'Cool',
  'Exciting', 'Trustworthy', 'Innovative', 'Friendly', 'Sophisticated'
];

const aspectRatios = [
  { id: '1:1', name: 'Square (1:1)', platforms: 'Instagram, Facebook' },
  { id: '16:9', name: 'Landscape (16:9)', platforms: 'YouTube, Twitter' },
  { id: '9:16', name: 'Portrait (9:16)', platforms: 'TikTok, Stories' },
  { id: '4:5', name: 'Portrait (4:5)', platforms: 'Instagram Feed' },
  { id: '2:3', name: 'Pinterest (2:3)', platforms: 'Pinterest' },
];

export default function ImageGenerator({ onSave }) {
  const [formData, setFormData] = useState({
    concept: '',
    style: 'Photorealistic',
    platform: 'instagram',
    dimensions: '1:1',
    mood: 'Professional',
    colorScheme: '',
    includeText: '',
    brandElements: ''
  });
  const [generatedContent, setGeneratedContent] = useState(null);
  const [copied, setCopied] = useState(false);

  const generateMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('geminiContentCreator', {
        action: 'generateImage',
        params: formData
      });
      return response.data;
    },
    onSuccess: (data) => {
      setGeneratedContent(data.data);
      toast.success('Image concept generated!');
    },
    onError: (error) => {
      toast.error('Failed to generate: ' + error.message);
    }
  });

  const handleSave = async () => {
    if (!generatedContent) return;
    
    try {
      await base44.entities.AdContent.create({
        title: `Image - ${formData.concept.slice(0, 50)}`,
        content_type: 'image',
        platform: formData.platform,
        generated_content: generatedContent,
        status: 'draft',
        tags: [formData.style, formData.mood]
      });
      toast.success('Image saved!');
      onSave?.();
    } catch (error) {
      toast.error('Failed to save');
    }
  };

  const handleCopyArtDirection = () => {
    const text = JSON.stringify(generatedContent?.artDirection, null, 2);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Copied to clipboard!');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Input Form */}
      <Card className="border-0 shadow-sm dark:bg-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-pink-500" />
            AI Image Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Image Concept *</Label>
            <Textarea
              value={formData.concept}
              onChange={(e) => setFormData({ ...formData, concept: e.target.value })}
              placeholder="Describe the advertising image you want to create... e.g., 'Happy senior couple reviewing healthcare documents at kitchen table, warm morning light'"
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Visual Style</Label>
              <Select value={formData.style} onValueChange={(v) => setFormData({ ...formData, style: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {styles.map(style => (
                    <SelectItem key={style} value={style}>{style}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Mood</Label>
              <Select value={formData.mood} onValueChange={(v) => setFormData({ ...formData, mood: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {moods.map(mood => (
                    <SelectItem key={mood} value={mood}>{mood}</SelectItem>
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
                  onClick={() => setFormData({ ...formData, dimensions: ratio.id })}
                  className={`p-3 rounded-lg border-2 transition-all text-left ${
                    formData.dimensions === ratio.id
                      ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  <p className="font-medium text-sm text-slate-800 dark:text-white">{ratio.name}</p>
                  <p className="text-xs text-slate-500">{ratio.platforms}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label>Color Scheme (optional)</Label>
            <Input
              value={formData.colorScheme}
              onChange={(e) => setFormData({ ...formData, colorScheme: e.target.value })}
              placeholder="e.g., Blue and white, warm earth tones, brand colors #1A73E8"
            />
          </div>

          <div>
            <Label>Text Overlay (optional)</Label>
            <Input
              value={formData.includeText}
              onChange={(e) => setFormData({ ...formData, includeText: e.target.value })}
              placeholder="e.g., 'Get Your Free Quote' or leave blank for no text"
            />
          </div>

          <div>
            <Label>Brand Elements (optional)</Label>
            <Input
              value={formData.brandElements}
              onChange={(e) => setFormData({ ...formData, brandElements: e.target.value })}
              placeholder="e.g., Logo placement, specific brand icons, mascot"
            />
          </div>

          <Button
            onClick={() => generateMutation.mutate()}
            disabled={!formData.concept || generateMutation.isPending}
            className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700"
          >
            {generateMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating with Gemini AI...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Image
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Content */}
      <Card className="border-0 shadow-sm dark:bg-slate-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-pink-500" />
              Generated Image
            </CardTitle>
            {generatedContent && (
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
          {!generatedContent ? (
            <div className="text-center py-12">
              <ImageIcon className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
              <p className="text-slate-500 dark:text-slate-400">
                Describe your image concept and generate AI-powered advertising visuals
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Generated Image */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-xl overflow-hidden border dark:border-slate-700"
              >
                {generatedContent.image?.type === 'image' ? (
                  <div className="relative">
                    <img 
                      src={generatedContent.image.content} 
                      alt="Generated ad" 
                      className="w-full"
                    />
                    <Button
                      size="sm"
                      className="absolute bottom-4 right-4"
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = generatedContent.image.content;
                        link.download = 'ad-image.png';
                        link.click();
                      }}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </Button>
                  </div>
                ) : (
                  <div className="p-6 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800">
                    <Badge className="mb-3 bg-amber-100 text-amber-700">Visual Description</Badge>
                    <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                      {generatedContent.image?.content}
                    </p>
                  </div>
                )}
              </motion.div>

              {/* Art Direction */}
              {generatedContent.artDirection && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                      <Layout className="w-4 h-4" />
                      Art Direction Guide
                    </h3>
                    <Button size="sm" variant="outline" onClick={handleCopyArtDirection}>
                      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>

                  {generatedContent.artDirection.composition && (
                    <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                      <p className="text-xs font-medium text-slate-500 mb-1">Composition</p>
                      <p className="text-sm text-slate-700 dark:text-slate-300">
                        {generatedContent.artDirection.composition}
                      </p>
                    </div>
                  )}

                  {generatedContent.artDirection.colorPalette && (
                    <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                      <p className="text-xs font-medium text-slate-500 mb-2">Color Palette</p>
                      <div className="flex gap-2 flex-wrap">
                        {generatedContent.artDirection.colorPalette.map((color, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <div 
                              className="w-8 h-8 rounded-lg border dark:border-slate-600"
                              style={{ backgroundColor: color.hex }}
                            />
                            <div>
                              <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{color.name}</p>
                              <p className="text-xs text-slate-500">{color.hex}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {generatedContent.artDirection.lighting && (
                    <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                      <p className="text-xs font-medium text-slate-500 mb-1 flex items-center gap-1">
                        <Sun className="w-3 h-3" /> Lighting
                      </p>
                      <p className="text-sm text-slate-700 dark:text-slate-300">
                        {generatedContent.artDirection.lighting}
                      </p>
                    </div>
                  )}

                  {generatedContent.artDirection.moodKeywords && (
                    <div className="flex flex-wrap gap-2">
                      {generatedContent.artDirection.moodKeywords.map((keyword, idx) => (
                        <Badge key={idx} variant="outline">{keyword}</Badge>
                      ))}
                    </div>
                  )}

                  {generatedContent.artDirection.stockSearchTerms && (
                    <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                      <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-2">Stock Photo Search Terms</p>
                      <div className="flex flex-wrap gap-2">
                        {generatedContent.artDirection.stockSearchTerms.map((term, idx) => (
                          <Badge key={idx} className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                            {term}
                          </Badge>
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