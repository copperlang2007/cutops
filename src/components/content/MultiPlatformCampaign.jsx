import { useState } from 'react'
import { base44 } from '@/api/base44Client'
import { useMutation } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Sparkles, Loader2, Save, Target, DollarSign, Calendar,
  Facebook, Instagram, Linkedin, Twitter, Youtube, Search,
  BarChart3, TrendingUp, Users, Copy, Check
} from 'lucide-react';
import { motion } from 'framer-motion'
import { toast } from 'sonner'

const platforms = [
  { id: 'facebook', name: 'Facebook', icon: Facebook },
  { id: 'instagram', name: 'Instagram', icon: Instagram },
  { id: 'google', name: 'Google Ads', icon: Search },
  { id: 'linkedin', name: 'LinkedIn', icon: Linkedin },
  { id: 'twitter', name: 'X / Twitter', icon: Twitter },
  { id: 'youtube', name: 'YouTube', icon: Youtube },
];

const budgetTiers = ['Low ($1k-5k)', 'Medium ($5k-20k)', 'High ($20k-50k)', 'Enterprise ($50k+)'];
const campaignGoals = [
  'Brand Awareness', 'Lead Generation', 'Sales/Conversions',
  'Website Traffic', 'App Installs', 'Engagement', 'Video Views'
];

export default function MultiPlatformCampaign({ onSave }) {
  const [formData, setFormData] = useState({
    productName: '',
    productDescription: '',
    targetAudience: '',
    platforms: ['facebook', 'instagram', 'google'],
    budget: 'Medium ($5k-20k)',
    campaignGoal: 'Lead Generation'
  });
  const [campaign, setCampaign] = useState(null);
  const [copiedItem, setCopiedItem] = useState(null);

  const generateMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('geminiContentCreator', {
        action: 'generateMultiPlatformAds',
        params: formData
      });
      return response.data;
    },
    onSuccess: (data) => {
      setCampaign(data.data);
      toast.success('Campaign strategy generated!');
    },
    onError: (error) => {
      toast.error('Failed to generate: ' + error.message);
    }
  });

  const togglePlatform = (platformId) => {
    setFormData(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platformId)
        ? prev.platforms.filter(p => p !== platformId)
        : [...prev.platforms, platformId]
    }));
  };

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(key);
    setTimeout(() => setCopiedItem(null), 2000);
    toast.success('Copied!');
  };

  const handleSave = async () => {
    if (!campaign) return;
    
    try {
      await base44.entities.AdContent.create({
        title: `${formData.productName} - Multi-Platform Campaign`,
        content_type: 'multi_platform',
        platform: 'multi',
        product_name: formData.productName,
        product_description: formData.productDescription,
        target_audience: formData.targetAudience,
        generated_content: campaign,
        status: 'draft',
        tags: formData.platforms
      });
      toast.success('Campaign saved!');
      onSave?.();
    } catch (error) {
      toast.error('Failed to save');
    }
  };

  return (
    <div className="space-y-6">
      {/* Input Form */}
      <Card className="border-0 shadow-sm dark:bg-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-500" />
            Multi-Platform Campaign Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Product/Service Name *</Label>
              <Input
                value={formData.productName}
                onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                placeholder="e.g., Medicare Advantage Plan"
              />
            </div>
            <div>
              <Label>Target Audience *</Label>
              <Input
                value={formData.targetAudience}
                onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                placeholder="e.g., Adults 65+, Medicare-eligible"
              />
            </div>
          </div>

          <div>
            <Label>Description *</Label>
            <Textarea
              value={formData.productDescription}
              onChange={(e) => setFormData({ ...formData, productDescription: e.target.value })}
              placeholder="Describe your product/service and its key benefits..."
              rows={3}
            />
          </div>

          <div>
            <Label className="mb-2 block">Select Platforms *</Label>
            <div className="flex flex-wrap gap-3">
              {platforms.map((platform) => {
                const Icon = platform.icon;
                const selected = formData.platforms.includes(platform.id);
                return (
                  <button
                    key={platform.id}
                    onClick={() => togglePlatform(platform.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                      selected
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${selected ? 'text-indigo-600' : 'text-slate-500'}`} />
                    <span className={`text-sm font-medium ${selected ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-300'}`}>
                      {platform.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Budget Tier</Label>
              <Select value={formData.budget} onValueChange={(v) => setFormData({ ...formData, budget: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {budgetTiers.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Campaign Goal</Label>
              <Select value={formData.campaignGoal} onValueChange={(v) => setFormData({ ...formData, campaignGoal: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {campaignGoals.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => generateMutation.mutate()}
              disabled={!formData.productName || !formData.productDescription || formData.platforms.length === 0 || generateMutation.isPending}
              className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
            >
              {generateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating Campaign...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Campaign Strategy
                </>
              )}
            </Button>
            {campaign && (
              <Button onClick={handleSave} className="bg-teal-600 hover:bg-teal-700">
                <Save className="w-4 h-4 mr-1" />
                Save
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Generated Campaign */}
      {campaign && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Campaign Overview */}
          <Card className="border-0 shadow-sm dark:bg-slate-800 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
              <h2 className="text-xl font-bold">{campaign.campaignName || formData.productName + ' Campaign'}</h2>
              <p className="text-indigo-200 mt-1">{campaign.campaignObjective || formData.campaignGoal}</p>
            </div>
            <CardContent className="p-6">
              {/* Budget Allocation */}
              {campaign.totalBudgetAllocation && (
                <div className="mb-6">
                  <h3 className="font-medium text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Budget Allocation
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(campaign.totalBudgetAllocation).map(([platform, percent]) => (
                      <div key={platform} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 text-center">
                        <p className="text-2xl font-bold text-indigo-600">{percent}%</p>
                        <p className="text-xs text-slate-500 capitalize">{platform}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Cross-Platform Guidelines */}
              {campaign.crossPlatformGuidelines && (
                <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <p className="font-medium text-blue-700 dark:text-blue-300 mb-2">Cross-Platform Guidelines</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300">{campaign.crossPlatformGuidelines}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Platform-Specific Content */}
          {campaign.platforms && (
            <Card className="border-0 shadow-sm dark:bg-slate-800">
              <CardHeader>
                <CardTitle className="text-base">Platform-Specific Content</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue={Object.keys(campaign.platforms)[0]} className="space-y-4">
                  <TabsList className="flex-wrap h-auto gap-1">
                    {Object.keys(campaign.platforms).map(platformKey => {
                      const platform = platforms.find(p => p.id === platformKey);
                      const Icon = platform?.icon || Target;
                      return (
                        <TabsTrigger key={platformKey} value={platformKey} className="gap-2">
                          <Icon className="w-4 h-4" />
                          <span className="capitalize">{platformKey}</span>
                        </TabsTrigger>
                      );
                    })}
                  </TabsList>

                  {Object.entries(campaign.platforms).map(([platformKey, platformData]) => (
                    <TabsContent key={platformKey} value={platformKey} className="space-y-4">
                      {/* Ad Formats */}
                      {platformData.adFormats && (
                        <div className="flex flex-wrap gap-2">
                          <span className="text-sm text-slate-500">Recommended Formats:</span>
                          {platformData.adFormats.map((format, idx) => (
                            <Badge key={idx} variant="outline">{format}</Badge>
                          ))}
                        </div>
                      )}

                      {/* Copy Variations */}
                      {platformData.copyVariations && (
                        <div className="space-y-3">
                          <p className="font-medium text-slate-700 dark:text-slate-300">Copy Variations</p>
                          {platformData.copyVariations.map((copy, idx) => (
                            <div key={idx} className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border dark:border-slate-700">
                              <div className="flex justify-between items-start gap-4">
                                <div className="flex-1">
                                  <Badge variant="outline" className="mb-2">Variant {idx + 1}</Badge>
                                  <p className="text-sm text-slate-700 dark:text-slate-300">{copy}</p>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleCopy(copy, `${platformKey}-${idx}`)}
                                >
                                  {copiedItem === `${platformKey}-${idx}` ? (
                                    <Check className="w-4 h-4 text-green-500" />
                                  ) : (
                                    <Copy className="w-4 h-4" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Visual Direction */}
                      {platformData.visualDirection && (
                        <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                          <p className="text-xs font-medium text-purple-600 mb-1">Visual Direction</p>
                          <p className="text-sm text-slate-700 dark:text-slate-300">{platformData.visualDirection}</p>
                        </div>
                      )}

                      {/* Targeting */}
                      {platformData.targeting && (
                        <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
                          <p className="text-xs font-medium text-green-600 mb-2">Targeting Suggestions</p>
                          <div className="text-sm text-slate-700 dark:text-slate-300">
                            {typeof platformData.targeting === 'object' 
                              ? JSON.stringify(platformData.targeting, null, 2)
                              : platformData.targeting
                            }
                          </div>
                        </div>
                      )}

                      {/* KPIs */}
                      {platformData.kpis && (
                        <div>
                          <p className="text-xs font-medium text-slate-500 mb-2 flex items-center gap-1">
                            <BarChart3 className="w-3 h-3" /> KPIs to Track
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {platformData.kpis.map((kpi, idx) => (
                              <Badge key={idx} className="bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                                {kpi}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          )}

          {/* Content Calendar */}
          {campaign.contentCalendar && campaign.contentCalendar.length > 0 && (
            <Card className="border-0 shadow-sm dark:bg-slate-800">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-amber-500" />
                  Content Calendar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {campaign.contentCalendar.map((item, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-600 font-bold">
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-800 dark:text-white">{item.title || item.content || item}</p>
                        {item.platform && <Badge variant="outline" className="mt-1">{item.platform}</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Retargeting Strategy */}
          {campaign.retargetingStrategy && (
            <Card className="border-0 shadow-sm dark:bg-slate-800">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  Retargeting Strategy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-700 dark:text-slate-300">{campaign.retargetingStrategy}</p>
              </CardContent>
            </Card>
          )}
        </motion.div>
      )}
    </div>
  );
}