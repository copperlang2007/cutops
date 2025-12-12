import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Sparkles, TrendingDown, AlertCircle, Calendar, DollarSign, 
  Shield, Loader2, Send, Eye, X, MessageSquare
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function ProactiveOutreachPanel({ agentId }) {
  const queryClient = useQueryClient();
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [generatedMessage, setGeneratedMessage] = useState(null);
  const [editedMessage, setEditedMessage] = useState('');
  const [selectedChannel, setSelectedChannel] = useState('email');

  const { data: opportunities = [], isLoading: detectingOpportunities, refetch } = useQuery({
    queryKey: ['proactiveOutreach', agentId],
    queryFn: async () => {
      const response = await base44.functions.invoke('aiProactiveOutreachDetector', { agent_id: agentId });
      return response.data.opportunities || [];
    },
    enabled: !!agentId
  });

  const detectOpportunitiesMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('aiProactiveOutreachDetector', { agent_id: agentId });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['proactiveOutreach', agentId]);
      toast.success('Opportunities detected');
    }
  });

  const generateMessageMutation = useMutation({
    mutationFn: async ({ clientId, opportunity, channel }) => {
      const response = await base44.functions.invoke('aiGenerateOutreachMessage', {
        client_id: clientId,
        opportunity,
        channel,
        agent_id: agentId
      });
      return response.data;
    },
    onSuccess: (data) => {
      setGeneratedMessage(data.outreach_message);
      setEditedMessage(data.outreach_message.message);
      toast.success('Message generated');
    }
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ clientId, message, subject, channel }) => {
      // Log as interaction
      await base44.entities.ClientInteraction.create({
        client_id: clientId,
        agent_id: agentId,
        interaction_type: channel === 'sms' ? 'text_message' : 'email',
        direction: 'outbound',
        subject: subject || 'Proactive Outreach',
        notes: message,
        outcome: 'successful',
        interaction_date: new Date().toISOString()
      });

      // Send via appropriate channel
      if (channel === 'email') {
        const clients = await base44.entities.Client.filter({ id: clientId });
        if (clients[0]?.email) {
          await base44.integrations.Core.SendEmail({
            to: clients[0].email,
            subject: subject,
            body: message
          });
        }
      }

      // Create proactive outreach record
      await base44.entities.ProactiveOutreach.create({
        client_id: clientId,
        agent_id: agentId,
        opportunity_type: selectedOpportunity.opportunity.type,
        title: selectedOpportunity.opportunity.title,
        description: selectedOpportunity.opportunity.description,
        priority: selectedOpportunity.opportunity.priority,
        reason: selectedOpportunity.opportunity.reason,
        status: 'sent',
        ai_generated_message: {
          subject,
          message,
          channel
        },
        sent_date: new Date().toISOString(),
        client_sentiment_at_creation: selectedOpportunity.client_sentiment
      });
    },
    onSuccess: () => {
      toast.success('Outreach sent successfully');
      setSelectedOpportunity(null);
      setGeneratedMessage(null);
      queryClient.invalidateQueries(['proactiveOutreach', agentId]);
    }
  });

  const getOpportunityIcon = (type) => {
    switch (type) {
      case 'sentiment_recovery': return TrendingDown;
      case 'market_opportunity': return AlertCircle;
      case 'policy_review': return Calendar;
      case 'cost_savings': return DollarSign;
      case 'coverage_gap': return Shield;
      default: return Sparkles;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'low': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              AI Proactive Outreach
            </CardTitle>
            <Button
              onClick={() => detectOpportunitiesMutation.mutate()}
              disabled={detectOpportunitiesMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {detectOpportunitiesMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing...</>
              ) : (
                <><Sparkles className="w-4 h-4 mr-2" /> Detect Opportunities</>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {detectingOpportunities ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-600 mb-2" />
              <p className="text-slate-500">Analyzing client opportunities...</p>
            </div>
          ) : opportunities.length === 0 ? (
            <div className="text-center py-8">
              <Sparkles className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500">No proactive outreach opportunities detected</p>
              <Button
                onClick={() => detectOpportunitiesMutation.mutate()}
                variant="outline"
                className="mt-4"
              >
                Run Detection
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {opportunities.map((clientOpp, idx) => (
                <div key={idx} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{clientOpp.client_name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {clientOpp.client_sentiment && (
                          <Badge variant="outline" className="text-xs">
                            {clientOpp.client_sentiment}
                          </Badge>
                        )}
                        {clientOpp.sentiment_trend && (
                          <Badge variant="outline" className="text-xs">
                            Trend: {clientOpp.sentiment_trend}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Badge className={getPriorityColor(clientOpp.opportunities[0].priority)}>
                      {clientOpp.opportunities[0].priority} priority
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    {clientOpp.opportunities.map((opp, oppIdx) => {
                      const Icon = getOpportunityIcon(opp.type);
                      return (
                        <div
                          key={oppIdx}
                          className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                          <Icon className="w-5 h-5 text-purple-600 mt-0.5" />
                          <div className="flex-1">
                            <p className="font-medium text-sm text-slate-900">{opp.title}</p>
                            <p className="text-xs text-slate-600 mt-1">{opp.description}</p>
                            <p className="text-xs text-slate-500 mt-1 italic">{opp.reason}</p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedOpportunity({
                                client_id: clientOpp.client_id,
                                client_name: clientOpp.client_name,
                                client_sentiment: clientOpp.client_sentiment,
                                opportunity: opp
                              });
                              setGeneratedMessage(null);
                            }}
                            className="bg-purple-600 hover:bg-purple-700"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Message Generation Modal */}
      {selectedOpportunity && (
        <Card className="border-2 border-purple-200 shadow-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Compose Outreach - {selectedOpportunity.client_name}</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setSelectedOpportunity(null)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-purple-50 rounded-lg">
              <p className="text-sm font-medium text-purple-900">{selectedOpportunity.opportunity.title}</p>
              <p className="text-xs text-purple-700 mt-1">{selectedOpportunity.opportunity.description}</p>
            </div>

            <div className="flex gap-2">
              {['email', 'sms', 'task'].map(channel => (
                <Button
                  key={channel}
                  variant={selectedChannel === channel ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedChannel(channel)}
                  className={selectedChannel === channel ? 'bg-purple-600' : ''}
                >
                  {channel.toUpperCase()}
                </Button>
              ))}
            </div>

            {!generatedMessage ? (
              <Button
                onClick={() => generateMessageMutation.mutate({
                  clientId: selectedOpportunity.client_id,
                  opportunity: selectedOpportunity.opportunity,
                  channel: selectedChannel
                })}
                disabled={generateMessageMutation.isPending}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {generateMessageMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
                ) : (
                  <><Sparkles className="w-4 h-4 mr-2" /> Generate AI Message</>
                )}
              </Button>
            ) : (
              <div className="space-y-3">
                {generatedMessage.subject && (
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-1">Subject</p>
                    <p className="text-sm text-slate-900 p-2 bg-slate-50 rounded">{generatedMessage.subject}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-1">Message</p>
                  <Textarea
                    value={editedMessage}
                    onChange={(e) => setEditedMessage(e.target.value)}
                    rows={8}
                    className="text-sm"
                  />
                </div>
                <div className="flex gap-2 text-xs text-slate-500">
                  <Badge variant="outline">Tone: {generatedMessage.tone}</Badge>
                  <Badge variant="outline">Best time: {generatedMessage.best_time_to_send}</Badge>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => generateMessageMutation.mutate({
                      clientId: selectedOpportunity.client_id,
                      opportunity: selectedOpportunity.opportunity,
                      channel: selectedChannel
                    })}
                  >
                    Regenerate
                  </Button>
                  <Button
                    onClick={() => sendMessageMutation.mutate({
                      clientId: selectedOpportunity.client_id,
                      message: editedMessage,
                      subject: generatedMessage.subject,
                      channel: selectedChannel
                    })}
                    disabled={sendMessageMutation.isPending}
                    className="flex-1 bg-teal-600 hover:bg-teal-700"
                  >
                    {sendMessageMutation.isPending ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...</>
                    ) : (
                      <><Send className="w-4 h-4 mr-2" /> Send Outreach</>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}