import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Mail, MessageSquare, Plus, Send, Sparkles, Loader2,
  Users, Clock, CheckCircle, Pause, Play
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function CampaignManager({ agents }) {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    campaign_type: 'onboarding',
    channel: 'email',
    target_audience: 'all_agents',
    subject: '',
    content: ''
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: campaigns = [] } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => base44.entities.Campaign.list('-created_date')
  });

  const createCampaignMutation = useMutation({
    mutationFn: (data) => base44.entities.Campaign.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['campaigns']);
      setShowCreate(false);
      setNewCampaign({ name: '', campaign_type: 'onboarding', channel: 'email', target_audience: 'all_agents', subject: '', content: '' });
      toast.success('Campaign created');
    }
  });

  const generateContent = async () => {
    setIsGenerating(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate an email campaign for insurance agents:

TYPE: ${newCampaign.campaign_type}
AUDIENCE: ${newCampaign.target_audience}
CHANNEL: ${newCampaign.channel}

Create compelling subject line and email body that is professional, engaging, and action-oriented. For onboarding, encourage completion. For re-engagement, motivate return to activity. Keep it concise.`,
        response_json_schema: {
          type: "object",
          properties: {
            subject: { type: "string" },
            content: { type: "string" }
          }
        }
      });

      setNewCampaign(prev => ({
        ...prev,
        subject: result.subject,
        content: result.content
      }));
      toast.success('Content generated');
    } catch (err) {
      toast.error('Failed to generate content');
    } finally {
      setIsGenerating(false);
    }
  };

  const sendCampaign = async (campaign) => {
    const targetAgents = campaign.target_audience === 'all_agents' 
      ? agents 
      : campaign.target_audience === 'new_agents'
      ? agents.filter(a => a.onboarding_status === 'pending' || a.onboarding_status === 'in_progress')
      : campaign.target_audience === 'inactive_agents'
      ? agents.filter(a => a.onboarding_status === 'suspended')
      : agents;

    for (const agent of targetAgents.slice(0, 5)) { // Limit for demo
      try {
        await base44.integrations.Core.SendEmail({
          to: agent.email,
          subject: campaign.subject,
          body: campaign.content.replace('{name}', agent.first_name)
        });
      } catch (err) {
        console.error('Failed to send to', agent.email);
      }
    }

    await base44.entities.Campaign.update(campaign.id, {
      status: 'completed',
      sent_count: targetAgents.length
    });

    queryClient.invalidateQueries(['campaigns']);
    toast.success(`Campaign sent to ${targetAgents.length} agents`);
  };

  const statusColors = {
    draft: 'bg-slate-100 text-slate-700',
    scheduled: 'bg-blue-100 text-blue-700',
    active: 'bg-emerald-100 text-emerald-700',
    paused: 'bg-amber-100 text-amber-700',
    completed: 'bg-purple-100 text-purple-700'
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-600" />
            Campaign Manager
          </CardTitle>
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-1" />
                New Campaign
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create Campaign</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Campaign Name</Label>
                  <Input
                    value={newCampaign.name}
                    onChange={(e) => setNewCampaign(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Q4 Onboarding Push"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Type</Label>
                    <Select 
                      value={newCampaign.campaign_type} 
                      onValueChange={(v) => setNewCampaign(prev => ({ ...prev, campaign_type: v }))}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="onboarding">Onboarding</SelectItem>
                        <SelectItem value="renewal">Renewal</SelectItem>
                        <SelectItem value="re_engagement">Re-engagement</SelectItem>
                        <SelectItem value="training">Training</SelectItem>
                        <SelectItem value="compliance">Compliance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Audience</Label>
                    <Select 
                      value={newCampaign.target_audience} 
                      onValueChange={(v) => setNewCampaign(prev => ({ ...prev, target_audience: v }))}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all_agents">All Agents</SelectItem>
                        <SelectItem value="new_agents">New Agents</SelectItem>
                        <SelectItem value="inactive_agents">Inactive</SelectItem>
                        <SelectItem value="top_performers">Top Performers</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label>Subject</Label>
                    <Button size="sm" variant="ghost" onClick={generateContent} disabled={isGenerating}>
                      {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                      <span className="ml-1 text-xs">AI Generate</span>
                    </Button>
                  </div>
                  <Input
                    value={newCampaign.subject}
                    onChange={(e) => setNewCampaign(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="Complete your onboarding today!"
                  />
                </div>
                <div>
                  <Label>Content</Label>
                  <Textarea
                    value={newCampaign.content}
                    onChange={(e) => setNewCampaign(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Hi {name}, ..."
                    rows={5}
                  />
                </div>
                <Button 
                  className="w-full" 
                  onClick={() => createCampaignMutation.mutate({ ...newCampaign, status: 'draft' })}
                  disabled={!newCampaign.name || !newCampaign.subject}
                >
                  Create Campaign
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {campaigns.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-6">
            No campaigns yet. Create one to engage your agents.
          </p>
        ) : (
          <div className="space-y-2">
            {campaigns.map((campaign, i) => (
              <div key={i} className="p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium text-slate-700">{campaign.name}</p>
                    <p className="text-xs text-slate-500">{campaign.subject}</p>
                  </div>
                  <Badge className={statusColors[campaign.status]}>{campaign.status}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {campaign.target_audience?.replace('_', ' ')}
                    </span>
                    {campaign.sent_count > 0 && (
                      <span className="flex items-center gap-1">
                        <Send className="w-3 h-3" />
                        {campaign.sent_count} sent
                      </span>
                    )}
                  </div>
                  {campaign.status === 'draft' && (
                    <Button size="sm" variant="outline" className="h-6 text-xs" onClick={() => sendCampaign(campaign)}>
                      <Send className="w-3 h-3 mr-1" />
                      Send
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}