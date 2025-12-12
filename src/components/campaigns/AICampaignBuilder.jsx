import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { 
  Sparkles, Send, Target, Users, Calendar, TrendingUp,
  Mail, MessageSquare, Clock, CheckCircle, Loader2,
  BarChart3, Zap, AlertTriangle, Heart, DollarSign
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export default function AICampaignBuilder() {
  const queryClient = useQueryClient();
  const [selectedType, setSelectedType] = useState('');
  const [targetSegment, setTargetSegment] = useState({});
  const [generatedCampaign, setGeneratedCampaign] = useState(null);
  const [generating, setGenerating] = useState(false);

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => base44.entities.Campaign.list('-created_date', 20)
  });

  const generateCampaignMutation = useMutation({
    mutationFn: async ({ campaignType, targetSegment }) => {
      const response = await base44.functions.invoke('aiCampaignGenerator', {
        campaignType,
        targetSegment
      });
      return response.data;
    },
    onSuccess: (data) => {
      setGeneratedCampaign(data);
      queryClient.invalidateQueries(['campaigns']);
      toast.success(`Campaign "${data.campaign.name}" generated successfully!`);
      setGenerating(false);
    },
    onError: (error) => {
      toast.error('Failed to generate campaign');
      console.error(error);
      setGenerating(false);
    }
  });

  const updateCampaignMutation = useMutation({
    mutationFn: ({ campaignId, status }) => 
      base44.entities.Campaign.update(campaignId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries(['campaigns']);
      toast.success('Campaign status updated');
    }
  });

  const campaignTypes = [
    {
      id: 'risk_mitigation',
      name: 'Risk Mitigation',
      description: 'Proactive outreach for policy inadequacy or churn risk',
      icon: AlertTriangle,
      color: 'from-red-500 to-orange-600',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
      textColor: 'text-red-700 dark:text-red-400'
    },
    {
      id: 'upsell',
      name: 'Upsell & Cross-sell',
      description: 'Product recommendations based on client needs',
      icon: DollarSign,
      color: 'from-green-500 to-emerald-600',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      textColor: 'text-green-700 dark:text-green-400'
    },
    {
      id: 're_engagement',
      name: 'Re-engagement',
      description: 'Win back inactive or disengaged clients',
      icon: Heart,
      color: 'from-purple-500 to-pink-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
      textColor: 'text-purple-700 dark:text-purple-400'
    }
  ];

  const handleGenerateCampaign = () => {
    if (!selectedType) {
      toast.error('Please select a campaign type');
      return;
    }
    setGenerating(true);
    generateCampaignMutation.mutate({ 
      campaignType: selectedType, 
      targetSegment 
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
      scheduled: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      completed: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      paused: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
    };
    return colors[status] || colors.draft;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="clay-morphism border-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">AI Campaign Builder</CardTitle>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Generate personalized campaigns based on risk profiles and life stages
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="create" className="space-y-4">
        <TabsList className="clay-morphism p-1.5 rounded-2xl">
          <TabsTrigger value="create" className="rounded-xl data-[state=active]:clay-morphism data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg">
            <Sparkles className="w-4 h-4 mr-2" />
            Create Campaign
          </TabsTrigger>
          <TabsTrigger value="existing" className="rounded-xl data-[state=active]:clay-morphism data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg">
            <BarChart3 className="w-4 h-4 mr-2" />
            Active Campaigns
          </TabsTrigger>
        </TabsList>

        {/* Create Campaign Tab */}
        <TabsContent value="create" className="space-y-6">
          {/* Campaign Type Selection */}
          <Card className="clay-morphism border-0">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="w-5 h-5 text-indigo-600" />
                Select Campaign Type
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {campaignTypes.map((type) => {
                  const Icon = type.icon;
                  const isSelected = selectedType === type.id;
                  
                  return (
                    <motion.button
                      key={type.id}
                      onClick={() => setSelectedType(type.id)}
                      whileHover={{ y: -4 }}
                      whileTap={{ scale: 0.98 }}
                      className={`p-6 rounded-2xl text-left transition-all ${
                        isSelected 
                          ? 'clay-morphism border-2 border-indigo-500 shadow-lg' 
                          : 'clay-subtle hover:shadow-lg'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${type.color} flex items-center justify-center mb-4 shadow-lg`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="font-bold text-slate-900 dark:text-white mb-2">{type.name}</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{type.description}</p>
                      {isSelected && (
                        <div className="mt-3">
                          <Badge className="bg-indigo-600 text-white">Selected</Badge>
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {/* Target Segment Options */}
              {selectedType && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="pt-4 border-t border-slate-200 dark:border-slate-700"
                >
                  <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 block">
                    <Users className="w-4 h-4 inline mr-2" />
                    Target Segment (Optional)
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-slate-600 dark:text-slate-400">Client Status</Label>
                      <select
                        className="w-full mt-1 px-3 py-2 clay-subtle rounded-lg text-sm"
                        value={targetSegment.status || ''}
                        onChange={(e) => setTargetSegment({...targetSegment, status: e.target.value})}
                      >
                        <option value="">All Statuses</option>
                        <option value="active">Active</option>
                        <option value="prospect">Prospect</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs text-slate-600 dark:text-slate-400">Sentiment</Label>
                      <select
                        className="w-full mt-1 px-3 py-2 clay-subtle rounded-lg text-sm"
                        value={targetSegment.sentiment || ''}
                        onChange={(e) => setTargetSegment({...targetSegment, sentiment: e.target.value})}
                      >
                        <option value="">All Sentiments</option>
                        <option value="very_positive">Very Positive</option>
                        <option value="positive">Positive</option>
                        <option value="neutral">Neutral</option>
                        <option value="negative">Negative</option>
                        <option value="very_negative">Very Negative</option>
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}

              <div className="flex justify-end pt-4">
                <Button
                  onClick={handleGenerateCampaign}
                  disabled={!selectedType || generating}
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-xl"
                  size="lg"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Generating Campaign...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Generate Campaign with AI
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Generated Campaign Preview */}
          <AnimatePresence>
            {generatedCampaign && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                {/* Campaign Overview */}
                <Card className="clay-morphism border-0 border-l-4 border-l-indigo-500">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-2xl mb-2">{generatedCampaign.campaign.name}</CardTitle>
                        <p className="text-slate-600 dark:text-slate-400">{generatedCampaign.aiGenerated.campaign_objective}</p>
                      </div>
                      <Badge className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                        <Zap className="w-3 h-3 mr-1" />
                        AI Generated
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="clay-subtle p-4 rounded-xl">
                        <Users className="w-5 h-5 text-indigo-600 mb-2" />
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">{generatedCampaign.campaign.target_count}</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">Target Clients</p>
                      </div>
                      <div className="clay-subtle p-4 rounded-xl">
                        <Mail className="w-5 h-5 text-indigo-600 mb-2" />
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">{generatedCampaign.aiGenerated.email_templates?.length || 0}</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">Email Templates</p>
                      </div>
                      <div className="clay-subtle p-4 rounded-xl">
                        <MessageSquare className="w-5 h-5 text-indigo-600 mb-2" />
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">{generatedCampaign.aiGenerated.in_app_message_templates?.length || 0}</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">In-App Messages</p>
                      </div>
                    </div>

                    {/* Messaging Strategy */}
                    <div className="p-4 clay-subtle rounded-xl">
                      <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-2">MESSAGING STRATEGY</p>
                      <p className="text-sm text-slate-700 dark:text-slate-300">{generatedCampaign.aiGenerated.messaging_strategy}</p>
                    </div>

                    {/* Target Persona */}
                    <div className="p-4 clay-subtle rounded-xl">
                      <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-2">TARGET PERSONA</p>
                      <p className="text-sm text-slate-700 dark:text-slate-300">{generatedCampaign.aiGenerated.target_persona}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Email Templates */}
                <Card className="clay-morphism border-0">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="w-5 h-5 text-indigo-600" />
                      Email Templates
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {generatedCampaign.aiGenerated.email_templates?.map((template, idx) => (
                      <div key={idx} className="p-4 clay-subtle rounded-xl space-y-3">
                        <div className="flex items-center justify-between">
                          <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            Email {idx + 1}
                          </Badge>
                          <Badge variant="outline">{template.tone}</Badge>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Subject Line:</p>
                          <p className="font-semibold text-slate-900 dark:text-white">{template.subject}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Body:</p>
                          <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{template.body}</p>
                        </div>
                        <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                          <Button size="sm" variant="outline" className="clay-morphism">
                            <Send className="w-4 h-4 mr-2" />
                            {template.cta}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Schedule & Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="clay-morphism border-0">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Calendar className="w-5 h-5 text-indigo-600" />
                        Suggested Schedule
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label className="text-xs text-slate-600 dark:text-slate-400">Initial Send</Label>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{generatedCampaign.aiGenerated.suggested_schedule?.initial_send}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-slate-600 dark:text-slate-400">Follow-up Intervals</Label>
                        <div className="flex gap-2 mt-1">
                          {generatedCampaign.aiGenerated.suggested_schedule?.follow_up_intervals?.map((interval, idx) => (
                            <Badge key={idx} variant="outline">Day {interval}</Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-slate-600 dark:text-slate-400">Best Send Times</Label>
                        <div className="flex gap-2 mt-1 flex-wrap">
                          {generatedCampaign.aiGenerated.suggested_schedule?.best_send_times?.map((time, idx) => (
                            <Badge key={idx} className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                              <Clock className="w-3 h-3 mr-1" />
                              {time}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="clay-morphism border-0">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <TrendingUp className="w-5 h-5 text-indigo-600" />
                        Success Metrics
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600 dark:text-slate-400">Open Rate Target</span>
                        <span className="font-bold text-slate-900 dark:text-white">{generatedCampaign.aiGenerated.success_metrics?.open_rate_target}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600 dark:text-slate-400">Response Rate Target</span>
                        <span className="font-bold text-slate-900 dark:text-white">{generatedCampaign.aiGenerated.success_metrics?.response_rate_target}%</span>
                      </div>
                      <div className="p-3 clay-subtle rounded-lg">
                        <Label className="text-xs text-slate-600 dark:text-slate-400 block mb-1">Conversion Goal</Label>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{generatedCampaign.aiGenerated.success_metrics?.conversion_goal}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Actions */}
                <Card className="clay-morphism border-0">
                  <CardContent className="pt-6">
                    <div className="flex gap-3 justify-end">
                      <Button variant="outline" className="clay-morphism">
                        Edit Campaign
                      </Button>
                      <Button 
                        className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                        onClick={() => updateCampaignMutation.mutate({ 
                          campaignId: generatedCampaign.campaign.id, 
                          status: 'scheduled' 
                        })}
                      >
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Schedule Campaign
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </TabsContent>

        {/* Active Campaigns Tab */}
        <TabsContent value="existing" className="space-y-4">
          {isLoading ? (
            <Card className="clay-morphism border-0">
              <CardContent className="py-12 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600 mb-2" />
                <p className="text-sm text-slate-600 dark:text-slate-400">Loading campaigns...</p>
              </CardContent>
            </Card>
          ) : campaigns.length === 0 ? (
            <Card className="clay-morphism border-0">
              <CardContent className="py-12 text-center">
                <Target className="w-12 h-12 mx-auto text-slate-400 mb-3" />
                <p className="text-slate-600 dark:text-slate-400">No campaigns created yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {campaigns.map((campaign, idx) => (
                <motion.div
                  key={campaign.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className="clay-morphism border-0 hover:shadow-xl transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{campaign.name}</h3>
                            <Badge className={getStatusColor(campaign.status)}>
                              {campaign.status}
                            </Badge>
                            {campaign.ai_generated && (
                              <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                                <Zap className="w-3 h-3 mr-1" />
                                AI
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400">{campaign.campaign_type}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-indigo-600">{campaign.target_count || 0}</p>
                          <p className="text-xs text-slate-500">Target Clients</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="clay-morphism">
                          View Details
                        </Button>
                        {campaign.status === 'draft' && (
                          <Button 
                            size="sm" 
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => updateCampaignMutation.mutate({ 
                              campaignId: campaign.id, 
                              status: 'scheduled' 
                            })}
                          >
                            Schedule
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}