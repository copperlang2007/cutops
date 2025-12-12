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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Sparkles, Copy, Check, Loader2, RefreshCw, 
  Facebook, Instagram, Linkedin, Twitter, Youtube,
  Tv, Radio, PanelTop, Newspaper, Mail, Search,
  Download, Save, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const platforms = [
  { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'bg-blue-600' },
  { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'bg-gradient-to-br from-purple-600 to-pink-500' },
  { id: 'google', name: 'Google Ads', icon: Search, color: 'bg-green-600' },
  { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: 'bg-blue-700' },
  { id: 'twitter', name: 'X / Twitter', icon: Twitter, color: 'bg-slate-800' },
  { id: 'tiktok', name: 'TikTok', icon: Zap, color: 'bg-black' },
  { id: 'youtube', name: 'YouTube', icon: Youtube, color: 'bg-red-600' },
  { id: 'tv', name: 'TV Commercial', icon: Tv, color: 'bg-purple-600' },
  { id: 'radio', name: 'Radio', icon: Radio, color: 'bg-amber-600' },
  { id: 'billboard', name: 'Billboard/OOH', icon: PanelTop, color: 'bg-teal-600' },
  { id: 'print', name: 'Print', icon: Newspaper, color: 'bg-slate-600' },
  { id: 'email', name: 'Email', icon: Mail, color: 'bg-indigo-600' },
];

const tones = [
  'Professional', 'Friendly', 'Urgent', 'Humorous', 'Inspirational',
  'Luxury', 'Casual', 'Bold', 'Empathetic', 'Educational'
];

const adTypes = [
  'Awareness', 'Consideration', 'Conversion', 'Retargeting',
  'Product Launch', 'Sale/Promotion', 'Brand Story', 'Testimonial'
];

export default function AdCopyGenerator({ onSave }) {
  const [formData, setFormData] = useState({
    productName: '',
    productDescription: '',
    targetAudience: '',
    platform: 'facebook',
    tone: 'Professional',
    adType: 'Awareness',
    keyBenefits: '',
    callToAction: '',
    brandVoice: ''
  });
  const [generatedContent, setGeneratedContent] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);

  const generateMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('geminiContentCreator', {
        action: 'generateAdCopy',
        params: formData
      });
      return response.data;
    },
    onSuccess: (data) => {
      setGeneratedContent(data.data);
      toast.success('Ad copy generated successfully!');
    },
    onError: (error) => {
      toast.error('Failed to generate ad copy: ' + error.message);
    }
  });

  const handleCopy = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
    toast.success('Copied to clipboard!');
  };

  const handleSave = async () => {
    if (!generatedContent) return;
    
    try {
      await base44.entities.AdContent.create({
        title: `${formData.productName} - ${formData.platform} Ad Copy`,
        content_type: 'ad_copy',
        platform: formData.platform,
        product_name: formData.productName,
        product_description: formData.productDescription,
        target_audience: formData.targetAudience,
        generated_content: generatedContent,
        status: 'draft',
        tags: [formData.tone, formData.adType, formData.platform]
      });
      toast.success('Ad copy saved!');
      onSave?.();
    } catch (error) {
      toast.error('Failed to save');
    }
  };

  const selectedPlatform = platforms.find(p => p.id === formData.platform);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Input Form */}
      <Card className="border-0 shadow-sm dark:bg-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            Ad Copy Generator
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
              placeholder="Describe your product/service and its key features..."
              rows={3}
            />
          </div>

          <div>
            <Label>Target Audience *</Label>
            <Input
              value={formData.targetAudience}
              onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
              placeholder="e.g., Adults 65+, Medicare-eligible seniors"
            />
          </div>

          <div>
            <Label>Platform *</Label>
            <div className="grid grid-cols-4 gap-2 mt-2">
              {platforms.map((platform) => {
                const Icon = platform.icon;
                return (
                  <button
                    key={platform.id}
                    onClick={() => setFormData({ ...formData, platform: platform.id })}
                    className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${
                      formData.platform === platform.id
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg ${platform.color} flex items-center justify-center`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      {platform.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tone</Label>
              <Select value={formData.tone} onValueChange={(v) => setFormData({ ...formData, tone: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {tones.map(tone => (
                    <SelectItem key={tone} value={tone}>{tone}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Ad Type</Label>
              <Select value={formData.adType} onValueChange={(v) => setFormData({ ...formData, adType: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {adTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Key Benefits (comma-separated)</Label>
            <Input
              value={formData.keyBenefits}
              onChange={(e) => setFormData({ ...formData, keyBenefits: e.target.value })}
              placeholder="e.g., $0 premium, dental included, nationwide coverage"
            />
          </div>

          <div>
            <Label>Preferred Call-to-Action</Label>
            <Input
              value={formData.callToAction}
              onChange={(e) => setFormData({ ...formData, callToAction: e.target.value })}
              placeholder="e.g., Get Your Free Quote, Enroll Now"
            />
          </div>

          <div>
            <Label>Brand Voice Notes</Label>
            <Textarea
              value={formData.brandVoice}
              onChange={(e) => setFormData({ ...formData, brandVoice: e.target.value })}
              placeholder="Describe your brand's personality and communication style..."
              rows={2}
            />
          </div>

          <Button
            onClick={() => generateMutation.mutate()}
            disabled={!formData.productName || !formData.productDescription || generateMutation.isPending}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            {generateMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating with Gemini AI...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Ad Copy
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
              {selectedPlatform && (
                <div className={`w-8 h-8 rounded-lg ${selectedPlatform.color} flex items-center justify-center`}>
                  <selectedPlatform.icon className="w-4 h-4 text-white" />
                </div>
              )}
              Generated Copy
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
              <Sparkles className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
              <p className="text-slate-500 dark:text-slate-400">
                Fill in the form and click generate to create AI-powered ad copy
              </p>
            </div>
          ) : (
            <Tabs defaultValue="headlines" className="space-y-4">
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="headlines">Headlines</TabsTrigger>
                <TabsTrigger value="copy">Copy</TabsTrigger>
                <TabsTrigger value="cta">CTAs</TabsTrigger>
                <TabsTrigger value="abtest">A/B Tests</TabsTrigger>
              </TabsList>

              <TabsContent value="headlines" className="space-y-3">
                <AnimatePresence>
                  {generatedContent.headlines?.map((headline, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border dark:border-slate-700"
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <Badge variant="outline" className="mb-2">Headline {idx + 1}</Badge>
                          <p className="font-semibold text-slate-800 dark:text-white">{headline}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCopy(headline, `h-${idx}`)}
                        >
                          {copiedIndex === `h-${idx}` ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </TabsContent>

              <TabsContent value="copy" className="space-y-3">
                <AnimatePresence>
                  {generatedContent.primaryCopy?.map((copy, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border dark:border-slate-700"
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <Badge variant="outline" className="mb-2">Variant {idx + 1}</Badge>
                          <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{copy}</p>
                          <p className="text-xs text-slate-400 mt-2">{copy.length} characters</p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCopy(copy, `c-${idx}`)}
                        >
                          {copiedIndex === `c-${idx}` ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {generatedContent.hashtags?.length > 0 && (
                  <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                    <p className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-2">Suggested Hashtags</p>
                    <div className="flex flex-wrap gap-2">
                      {generatedContent.hashtags.map((tag, idx) => (
                        <Badge key={idx} className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="cta" className="space-y-3">
                <AnimatePresence>
                  {generatedContent.callToActions?.map((cta, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border dark:border-slate-700 flex justify-between items-center"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold text-sm">
                          {idx + 1}
                        </div>
                        <span className="font-medium text-slate-800 dark:text-white">{cta}</span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCopy(cta, `cta-${idx}`)}
                      >
                        {copiedIndex === `cta-${idx}` ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </TabsContent>

              <TabsContent value="abtest" className="space-y-4">
                {generatedContent.abTestSuggestions?.map((test, idx) => (
                  <Card key={idx} className="border dark:border-slate-700">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Badge className={idx === 0 ? 'bg-blue-500' : 'bg-green-500'}>
                          Variant {String.fromCharCode(65 + idx)}
                        </Badge>
                        {test.angle} Approach
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-slate-700 dark:text-slate-300 mb-3">{test.copy}</p>
                      <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                        <p className="text-xs font-medium text-amber-700 dark:text-amber-300">Hypothesis</p>
                        <p className="text-sm text-amber-600 dark:text-amber-400">{test.hypothesis}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {generatedContent.platformTips && (
                  <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">Platform Tips</p>
                    <p className="text-sm text-blue-600 dark:text-blue-400">{generatedContent.platformTips}</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}