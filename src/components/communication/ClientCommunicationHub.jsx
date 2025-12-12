import React from 'react';
import { base44 } from '@/api/base44Client'
import { useMutation } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { 
  Mail, MessageSquare, Phone, Calendar, TrendingUp, TrendingDown,
  Sparkles, Loader2, Send, Copy, AlertTriangle, CheckCircle, Clock,
  Target, Radio, FileText
} from 'lucide-react';
import { toast } from 'sonner'

export default function ClientCommunicationHub({ client, agentId }) {
  const [emailDraft, setEmailDraft] = React.useState(null);
  const [analysis, setAnalysis] = React.useState(null);
  const [emailPurpose, setEmailPurpose] = React.useState('follow_up');
  const [customContext, setCustomContext] = React.useState('');
  const [channelRec, setChannelRec] = React.useState(null);
  const [conversationNotes, setConversationNotes] = React.useState('');
  const [conversationSummary, setConversationSummary] = React.useState(null);

  const draftEmailMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('aiEmailDrafter', {
        client_id: client.id,
        agent_id: agentId,
        email_purpose: emailPurpose,
        custom_context: customContext
      });
      return response.data;
    },
    onSuccess: (data) => {
      setEmailDraft(data.email);
    }
  });

  const analyzeCommunicationMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('aiCommunicationAnalysis', {
        client_id: client.id,
        agent_id: agentId
      });
      return response.data;
    },
    onSuccess: (data) => {
      setAnalysis(data.analysis);
    }
  });

  const channelRecommendationMutation = useMutation({
    mutationFn: async (params) => {
      const response = await base44.functions.invoke('aiChannelRecommendation', {
        clientId: client.id,
        interactionType: params.interactionType,
        urgency: params.urgency
      });
      return response.data;
    },
    onSuccess: (data) => {
      setChannelRec(data.recommendation);
      toast.success('Channel recommendation generated');
    }
  });

  const conversationSummaryMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('aiConversationSummary', {
        clientId: client.id,
        conversationNotes,
        interactionType: 'call'
      });
      return response.data;
    },
    onSuccess: (data) => {
      setConversationSummary(data.summary);
      toast.success(`Conversation logged. ${data.tasks_created} tasks created.`);
      setConversationNotes('');
    }
  });

  const sendEmailMutation = useMutation({
    mutationFn: async () => {
      await base44.integrations.Core.SendEmail({
        to: client.email,
        subject: emailDraft.subject,
        body: emailDraft.body
      });
      
      // Log interaction
      await base44.entities.ClientInteraction.create({
        client_id: client.id,
        agent_id: agentId,
        interaction_type: 'email',
        direction: 'outbound',
        subject: emailDraft.subject,
        notes: emailDraft.body,
        outcome: 'successful',
        interaction_date: new Date().toISOString()
      });
    },
    onSuccess: () => {
      toast.success('Email sent successfully');
      setEmailDraft(null);
    }
  });

  const getHealthColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  const getChannelIcon = (channel) => {
    switch (channel) {
      case 'email': return Mail;
      case 'phone': return Phone;
      case 'text': return MessageSquare;
      default: return MessageSquare;
    }
  };

  return (
    <div className="space-y-6">
      {/* Communication Analysis */}
      <Card className="border-0 shadow-sm dark:bg-slate-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              Communication Analysis
            </CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={() => analyzeCommunicationMutation.mutate()}
              disabled={analyzeCommunicationMutation.isPending}
            >
              {analyzeCommunicationMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-1" />
                  Analyze
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!analysis && !analyzeCommunicationMutation.isPending && (
            <p className="text-sm text-slate-500 text-center py-4">
              Click "Analyze" to get AI-powered communication insights
            </p>
          )}

          {analyzeCommunicationMutation.isPending && (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 mx-auto mb-2 text-purple-600 animate-spin" />
              <p className="text-sm text-slate-500">Analyzing communication patterns...</p>
            </div>
          )}

          {analysis && (
            <div className="space-y-4">
              {/* Relationship Health */}
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Relationship Health
                  </span>
                  <span className={`text-2xl font-bold ${getHealthColor(analysis.relationship_health.score)}`}>
                    {analysis.relationship_health.score}/100
                  </span>
                </div>
                <Progress value={analysis.relationship_health.score} className="h-2 mb-2" />
                <Badge className={
                  analysis.relationship_health.status === 'strong' ? 'bg-green-100 text-green-700' :
                  analysis.relationship_health.status === 'stable' ? 'bg-blue-100 text-blue-700' :
                  analysis.relationship_health.status === 'at_risk' ? 'bg-amber-100 text-amber-700' :
                  'bg-red-100 text-red-700'
                }>
                  {analysis.relationship_health.status}
                </Badge>
              </div>

              {/* Sentiment & Engagement */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900">
                  <p className="text-xs text-slate-500 mb-1">Sentiment</p>
                  <div className="flex items-center gap-2">
                    <span className={`text-xl font-bold ${getHealthColor(analysis.overall_sentiment.score + 100)}`}>
                      {analysis.overall_sentiment.score > 0 ? '+' : ''}{analysis.overall_sentiment.score}
                    </span>
                    {analysis.overall_sentiment.trend === 'improving' ? (
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    ) : analysis.overall_sentiment.trend === 'declining' ? (
                      <TrendingDown className="w-4 h-4 text-red-600" />
                    ) : null}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    {analysis.overall_sentiment.summary}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900">
                  <p className="text-xs text-slate-500 mb-1">Engagement</p>
                  <div className="flex items-center gap-2">
                    <span className={`text-xl font-bold ${getHealthColor(analysis.engagement_level.score)}`}>
                      {analysis.engagement_level.score}/100
                    </span>
                    {analysis.engagement_level.trend === 'increasing' ? (
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    ) : analysis.engagement_level.trend === 'decreasing' ? (
                      <TrendingDown className="w-4 h-4 text-red-600" />
                    ) : null}
                  </div>
                  <Badge variant="outline" className="mt-1 text-xs">
                    {analysis.engagement_level.interaction_frequency} frequency
                  </Badge>
                </div>
              </div>

              {/* Optimal Follow-up */}
              <div className="p-4 rounded-lg border-2 border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-900/20">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-teal-600" />
                  <span className="font-medium text-slate-900 dark:text-white">Optimal Follow-up</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Next Contact</p>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {analysis.optimal_follow_up.next_contact_date}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Best Time</p>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {analysis.optimal_follow_up.recommended_time}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-slate-500 mb-1">Recommended Channel</p>
                    <Badge className="bg-teal-100 text-teal-700 border-teal-200">
                      {React.createElement(getChannelIcon(analysis.optimal_follow_up.recommended_channel), { className: "w-3 h-3 mr-1 inline" })}
                      {analysis.optimal_follow_up.recommended_channel}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Red Flags */}
              {analysis.red_flags && analysis.red_flags.length > 0 && (
                <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span className="font-medium text-red-700 dark:text-red-400">Red Flags</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1">
                    {analysis.red_flags.map((flag, i) => (
                      <li key={i} className="text-sm text-red-600 dark:text-red-400">{flag}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Suggested Actions */}
              {analysis.suggested_actions && analysis.suggested_actions.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Suggested Actions
                  </p>
                  <div className="space-y-2">
                    {analysis.suggested_actions.map((action, i) => (
                      <div key={i} className="p-3 rounded-lg border dark:border-slate-700">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className="text-sm font-medium text-slate-900 dark:text-white">
                            {action.action}
                          </span>
                          <Badge className={
                            action.priority === 'high' ? 'bg-red-100 text-red-700' :
                            action.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                            'bg-blue-100 text-blue-700'
                          }>
                            {action.priority}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400">{action.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Email Drafter */}
      <Card className="border-0 shadow-sm dark:bg-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-600" />
            AI Email Drafter
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Email Purpose
            </label>
            <Select value={emailPurpose} onValueChange={setEmailPurpose}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="follow_up">Follow-up</SelectItem>
                <SelectItem value="check_in">Check-in</SelectItem>
                <SelectItem value="renewal_reminder">Renewal Reminder</SelectItem>
                <SelectItem value="thank_you">Thank You</SelectItem>
                <SelectItem value="policy_update">Policy Update</SelectItem>
                <SelectItem value="cross_sell">Cross-sell Opportunity</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Additional Context (Optional)
            </label>
            <Textarea
              value={customContext}
              onChange={(e) => setCustomContext(e.target.value)}
              placeholder="Any specific points to mention..."
              rows={2}
            />
          </div>

          <Button
            onClick={() => draftEmailMutation.mutate()}
            disabled={draftEmailMutation.isPending}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
          >
            {draftEmailMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Drafting...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Email
              </>
            )}
          </Button>

          {emailDraft && (
            <div className="mt-4 space-y-3">
              <div className="p-4 rounded-lg border dark:border-slate-700 bg-white dark:bg-slate-900">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-slate-500">Subject</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      navigator.clipboard.writeText(emailDraft.subject);
                      toast.success('Subject copied');
                    }}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  {emailDraft.subject}
                </p>
              </div>

              <div className="p-4 rounded-lg border dark:border-slate-700 bg-white dark:bg-slate-900">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-slate-500">Email Body</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      navigator.clipboard.writeText(emailDraft.body);
                      toast.success('Email copied');
                    }}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
                <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                  {emailDraft.body}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  Tone: {emailDraft.tone}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Best time: {emailDraft.suggested_send_time}
                </Badge>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => sendEmailMutation.mutate()}
                  disabled={sendEmailMutation.isPending}
                  className="flex-1 bg-teal-600 hover:bg-teal-700"
                >
                  {sendEmailMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  Send Email
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setEmailDraft(null)}
                >
                  Discard
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Channel Recommendation */}
      <Card className="clay-morphism border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-indigo-600" />
            Channel Recommendation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Select defaultValue="follow_up" onValueChange={(val) => channelRecommendationMutation.mutate({ interactionType: val, urgency: 'normal' })}>
              <SelectTrigger>
                <SelectValue placeholder="Interaction Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="follow_up">Follow-up</SelectItem>
                <SelectItem value="renewal">Renewal</SelectItem>
                <SelectItem value="issue_resolution">Issue Resolution</SelectItem>
                <SelectItem value="cross_sell">Cross-sell</SelectItem>
                <SelectItem value="check_in">Check-in</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="normal" onValueChange={(val) => channelRecommendationMutation.mutate({ interactionType: 'follow_up', urgency: val })}>
              <SelectTrigger>
                <SelectValue placeholder="Urgency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={() => channelRecommendationMutation.mutate({ interactionType: 'follow_up', urgency: 'normal' })}
            disabled={channelRecommendationMutation.isPending}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600"
          >
            {channelRecommendationMutation.isPending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Analyzing...</>
            ) : (
              <><Target className="w-4 h-4 mr-2" />Get Channel Recommendation</>
            )}
          </Button>

          {channelRec && (
            <div className="space-y-3 mt-4">
              <div className="p-4 clay-subtle rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                      {React.createElement(getChannelIcon(channelRec.primary_channel), { className: "w-3 h-3 mr-1 inline" })}
                      {channelRec.primary_channel}
                    </Badge>
                    <span className="text-xs text-slate-500">Primary</span>
                  </div>
                  <Badge variant="outline">{channelRec.confidence}% confident</Badge>
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">{channelRec.reasoning}</p>
                <div className="flex gap-2 text-xs">
                  <Badge variant="outline">Best: {channelRec.best_time}</Badge>
                  <Badge variant="outline">{channelRec.best_day}</Badge>
                  <Badge variant="outline">{channelRec.expected_response_rate}% response rate</Badge>
                </div>
              </div>

              {channelRec.personalization_tips?.length > 0 && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-2">Tips:</p>
                  <ul className="space-y-1">
                    {channelRec.personalization_tips.map((tip, i) => (
                      <li key={i} className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-1">
                        <CheckCircle className="w-3 h-3 text-blue-600 mt-0.5 shrink-0" />
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {channelRec.backup_channel && (
                <p className="text-xs text-slate-500">
                  Backup: <Badge variant="outline" className="text-xs">
                    {React.createElement(getChannelIcon(channelRec.backup_channel), { className: "w-3 h-3 mr-1 inline" })}
                    {channelRec.backup_channel}
                  </Badge>
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Conversation Summary Generator */}
      <Card className="clay-morphism border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-green-600" />
            Log & Summarize Conversation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={conversationNotes}
            onChange={(e) => setConversationNotes(e.target.value)}
            placeholder="Paste or type conversation notes, key points discussed, client feedback..."
            rows={6}
            className="resize-none"
          />

          <Button
            onClick={() => conversationSummaryMutation.mutate()}
            disabled={conversationSummaryMutation.isPending || !conversationNotes}
            className="w-full bg-gradient-to-r from-green-600 to-teal-600"
          >
            {conversationSummaryMutation.isPending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating Summary...</>
            ) : (
              <><Sparkles className="w-4 h-4 mr-2" />Generate Summary & Log</>
            )}
          </Button>

          {conversationSummary && (
            <div className="space-y-3 mt-4 p-4 clay-subtle rounded-xl">
              <div>
                <p className="text-xs font-semibold text-green-600 dark:text-green-400 mb-2">SUMMARY</p>
                <p className="text-sm text-slate-700 dark:text-slate-300">{conversationSummary.executive_summary}</p>
              </div>

              {conversationSummary.key_points?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Key Points:</p>
                  <ul className="space-y-1">
                    {conversationSummary.key_points.map((point, i) => (
                      <li key={i} className="text-sm text-slate-700 dark:text-slate-300 flex items-start gap-2">
                        <CheckCircle className="w-3 h-3 text-green-600 mt-0.5 shrink-0" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {conversationSummary.action_items?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Action Items Created:</p>
                  <div className="space-y-2">
                    {conversationSummary.action_items.map((item, i) => (
                      <div key={i} className="p-2 bg-white dark:bg-slate-800 rounded-lg border dark:border-slate-700">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-900 dark:text-white">{item.action}</span>
                          <Badge className={
                            item.priority === 'urgent' || item.priority === 'high' ? 'bg-red-100 text-red-700' :
                            item.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                            'bg-blue-100 text-blue-700'
                          }>
                            {item.priority}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Due: {item.due_date}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {conversationSummary.client_concerns?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Client Concerns:</p>
                  <div className="space-y-1">
                    {conversationSummary.client_concerns.map((concern, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <AlertTriangle className="w-3 h-3 text-amber-600 mt-0.5 shrink-0" />
                        <span className="text-sm text-slate-700 dark:text-slate-300">{concern}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t dark:border-slate-700">
                <Badge className={
                  conversationSummary.sentiment?.includes('positive') ? 'bg-green-100 text-green-700' :
                  conversationSummary.sentiment?.includes('negative') ? 'bg-red-100 text-red-700' :
                  'bg-slate-100 text-slate-700'
                }>
                  {conversationSummary.sentiment}
                </Badge>
                <Badge variant="outline">
                  {conversationSummary.priority_level} priority
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}