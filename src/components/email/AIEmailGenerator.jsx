import { useState } from 'react'
import { base44 } from '@/api/base44Client'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Mail, Sparkles, Loader2, Send, Copy, RefreshCw, 
  Calendar, User, FileText, Clock, CheckCircle
} from 'lucide-react';
import { toast } from 'sonner'

const EMAIL_TEMPLATES = [
  { id: 'follow_up', name: 'Follow-up After Call', icon: '📞' },
  { id: 'renewal_reminder', name: 'Renewal Reminder', icon: '🔄' },
  { id: 'welcome', name: 'Welcome New Client', icon: '👋' },
  { id: 'appointment_confirmation', name: 'Appointment Confirmation', icon: '📅' },
  { id: 'outreach', name: 'Prospect Outreach', icon: '🎯' },
  { id: 'thank_you', name: 'Thank You', icon: '🙏' }
];

export default function AIEmailGenerator({ 
  agent,
  client,
  clients,
  interactions,
  onSendEmail,
  onSaveDraft
}) {
  const [emailType, setEmailType] = useState('follow_up');
  const [selectedClient, setSelectedClient] = useState(client?.id || '');
  const [generatedEmail, setGeneratedEmail] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [customContext, setCustomContext] = useState('');

  const currentClient = clients?.find(c => c.id === selectedClient) || client;

  const generateEmail = async () => {
    if (!currentClient && emailType !== 'outreach') {
      toast.error('Please select a client');
      return;
    }

    setIsGenerating(true);
    try {
      // Get recent interactions for context
      const clientInteractions = interactions?.filter(i => i.client_id === currentClient?.id).slice(0, 5) || [];
      
      const prompt = `Generate a professional, personalized email for an insurance agent to send to a client.

AGENT INFO:
- Name: ${agent.first_name} ${agent.last_name}
- Email: ${agent.email}

${currentClient ? `CLIENT INFO:
- Name: ${currentClient.first_name} ${currentClient.last_name}
- Status: ${currentClient.status}
- Current Plan: ${currentClient.current_plan || 'Not specified'}
- Carrier: ${currentClient.carrier || 'Not specified'}
- Renewal Date: ${currentClient.renewal_date || 'Not specified'}
- Last Contact: ${currentClient.last_contact_date || 'Not available'}
- Satisfaction Score: ${currentClient.satisfaction_score || 'Not rated'}` : 'No specific client - general outreach'}

RECENT INTERACTIONS:
${clientInteractions.map(i => `- ${i.interaction_type}: ${i.subject || i.notes?.substring(0, 50) || 'No details'} (${i.outcome})`).join('\n') || 'No recent interactions'}

EMAIL TYPE: ${EMAIL_TEMPLATES.find(t => t.id === emailType)?.name}

${customContext ? `ADDITIONAL CONTEXT: ${customContext}` : ''}

Generate a warm, professional email that:
1. Is personalized to the client's situation
2. Has a compelling subject line
3. Is concise but effective
4. Includes a clear call-to-action
5. Maintains compliance with insurance marketing regulations`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            subject: { type: "string" },
            body: { type: "string" },
            call_to_action: { type: "string" },
            suggested_send_time: { type: "string" },
            tone_analysis: { type: "string" }
          }
        }
      });

      setGeneratedEmail(result);
      toast.success('Email generated');
    } catch (err) {
      console.error('Failed to generate email:', err);
      toast.error('Failed to generate email');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSend = async () => {
    if (!generatedEmail || !currentClient?.email) {
      toast.error('Missing email or recipient');
      return;
    }

    setIsSending(true);
    try {
      await base44.integrations.Core.SendEmail({
        to: currentClient.email,
        subject: generatedEmail.subject,
        body: generatedEmail.body
      });

      // Save as draft/sent
      if (onSaveDraft) {
        await onSaveDraft({
          agent_id: agent.id,
          client_id: currentClient.id,
          email_type: emailType,
          recipient_email: currentClient.email,
          recipient_name: `${currentClient.first_name} ${currentClient.last_name}`,
          subject: generatedEmail.subject,
          body: generatedEmail.body,
          status: 'sent',
          sent_date: new Date().toISOString(),
          ai_generated: true,
          context: { emailType, customContext }
        });
      }

      toast.success('Email sent successfully');
      setGeneratedEmail(null);
    } catch (err) {
      console.error('Failed to send email:', err);
      toast.error('Failed to send email');
    } finally {
      setIsSending(false);
    }
  };

  const copyToClipboard = () => {
    if (generatedEmail) {
      navigator.clipboard.writeText(`Subject: ${generatedEmail.subject}\n\n${generatedEmail.body}`);
      toast.success('Copied to clipboard');
    }
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Mail className="w-5 h-5 text-blue-600" />
          AI Email Generator
          <Badge className="bg-gradient-to-r from-purple-500 to-blue-500 text-white ml-2">
            <Sparkles className="w-3 h-3 mr-1" />
            AI-Powered
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Email Type Selection */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Email Type</Label>
            <div className="grid grid-cols-3 gap-2">
              {EMAIL_TEMPLATES.map(template => (
                <Button
                  key={template.id}
                  variant={emailType === template.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setEmailType(template.id)}
                  className="justify-start text-xs"
                >
                  <span className="mr-1">{template.icon}</span>
                  {template.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Client Selection */}
          <div>
            <Label>Select Client</Label>
            <Select value={selectedClient} onValueChange={setSelectedClient}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a client..." />
              </SelectTrigger>
              <SelectContent>
                {clients?.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.first_name} {c.last_name} - {c.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Additional Context */}
          <div>
            <Label>Additional Context (optional)</Label>
            <Textarea
              value={customContext}
              onChange={(e) => setCustomContext(e.target.value)}
              placeholder="Any specific details you want to include..."
              rows={2}
            />
          </div>

          {/* Generate Button */}
          <Button
            onClick={generateEmail}
            disabled={isGenerating}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Email
              </>
            )}
          </Button>

          {/* Generated Email Preview */}
          {generatedEmail && (
            <div className="mt-4 p-4 bg-slate-50 rounded-lg border">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-slate-700">Generated Email</h4>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={copyToClipboard}>
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={generateEmail}>
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-slate-500">Subject</Label>
                  <Input
                    value={generatedEmail.subject}
                    onChange={(e) => setGeneratedEmail({ ...generatedEmail, subject: e.target.value })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="text-xs text-slate-500">Body</Label>
                  <Textarea
                    value={generatedEmail.body}
                    onChange={(e) => setGeneratedEmail({ ...generatedEmail, body: e.target.value })}
                    rows={8}
                    className="mt-1 font-mono text-sm"
                  />
                </div>

                {generatedEmail.suggested_send_time && (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Clock className="w-3 h-3" />
                    Suggested send time: {generatedEmail.suggested_send_time}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={handleSend}
                    disabled={isSending || !currentClient?.email}
                    className="flex-1 bg-teal-600 hover:bg-teal-700"
                  >
                    {isSending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 mr-2" />
                    )}
                    Send Email
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (onSaveDraft) {
                        onSaveDraft({
                          agent_id: agent.id,
                          client_id: currentClient?.id,
                          email_type: emailType,
                          recipient_email: currentClient?.email || '',
                          recipient_name: currentClient ? `${currentClient.first_name} ${currentClient.last_name}` : '',
                          subject: generatedEmail.subject,
                          body: generatedEmail.body,
                          status: 'draft',
                          ai_generated: true,
                          context: { emailType, customContext }
                        });
                        toast.success('Draft saved');
                      }
                    }}
                  >
                    Save Draft
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}