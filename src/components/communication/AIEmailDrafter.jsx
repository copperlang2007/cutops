import { useState, useEffect } from 'react'
import { base44 } from '@/api/base44Client'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Mail, Sparkles, Loader2, Send, Copy, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

const EMAIL_TEMPLATES = [
  { value: 'onboarding_reminder', label: 'Onboarding Reminder' },
  { value: 'license_expiring', label: 'License Expiring' },
  { value: 'contract_renewal', label: 'Contract Renewal' },
  { value: 'performance_review', label: 'Performance Review' },
  { value: 'compliance_issue', label: 'Compliance Issue' },
  { value: 'custom', label: 'Custom Message' }
];

export default function AIEmailDrafter({ 
  open, 
  onClose, 
  agent, 
  context = {},
  defaultTemplate = 'custom',
  clientId = null
}) {
  const [template, setTemplate] = useState(defaultTemplate);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [clientSentiment, setClientSentiment] = useState(null);

  // Fetch client sentiment if clientId provided
  useEffect(() => {
    if (clientId) {
      const fetchSentiment = async () => {
        const clients = await base44.entities.Client.filter({ id: clientId });
        if (clients[0]) {
          setClientSentiment(clients[0]);
        }
      };
      fetchSentiment();
    }
  }, [clientId]);

  const generateEmail = async () => {
    setIsGenerating(true);
    try {
      const templatePrompts = {
        onboarding_reminder: `Write a friendly but professional follow-up email to an insurance agent about completing their onboarding.
Incomplete items: ${context.incompleteItems?.join(', ') || 'Various items pending'}
Days since started: ${context.daysSinceStart || 'Unknown'}`,
        license_expiring: `Write an urgent but professional email about an expiring insurance license.
State: ${context.state || 'Unknown'}
Expiration date: ${context.expirationDate || 'Soon'}
Days remaining: ${context.daysRemaining || 'Few'}`,
        contract_renewal: `Write a professional email about an upcoming carrier contract renewal.
Carrier: ${context.carrierName || 'Unknown'}
Expiration date: ${context.expirationDate || 'Soon'}`,
        performance_review: `Write a professional email scheduling a performance review meeting.
Key metrics to discuss: ${context.metrics || 'Overall performance'}`,
        compliance_issue: `Write a professional email addressing a compliance concern.
Issue: ${context.issue || 'Compliance matter requiring attention'}`,
        custom: customPrompt
      };

      const sentimentInfo = clientSentiment ? {
        current_sentiment: clientSentiment.current_sentiment,
        sentiment_score: clientSentiment.sentiment_score,
        sentiment_trend: clientSentiment.sentiment_trend
      } : null;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `${templatePrompts[template]}

Agent Name: ${agent?.first_name} ${agent?.last_name}
Agent Email: ${agent?.email}
${sentimentInfo ? `

Client Sentiment: ${sentimentInfo.current_sentiment}
Score: ${sentimentInfo.sentiment_score}
Trend: ${sentimentInfo.sentiment_trend}

Adapt tone based on sentiment - if negative, be extra empathetic and avoid sales pressure.` : ''}

Generate a professional email with:
1. Subject line
2. Email body

Keep the tone professional but warm. Be concise and action-oriented.`,
        response_json_schema: {
          type: "object",
          properties: {
            subject: { type: "string" },
            body: { type: "string" }
          }
        }
      });

      setSubject(result.subject);
      setBody(result.body);
    } catch (err) {
      console.error('Failed to generate email:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendEmail = async () => {
    if (!agent?.email || !subject || !body) return;
    
    setIsSending(true);
    try {
      await base44.integrations.Core.SendEmail({
        to: agent.email,
        subject: subject,
        body: body
      });
      toast.success('Email sent successfully');
      onClose();
    } catch (err) {
      toast.error('Failed to send email');
    } finally {
      setIsSending(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
    toast.success('Email copied to clipboard');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-teal-600" />
            AI Email Drafter
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Template Selection */}
          <div className="space-y-2">
            <Label>Email Template</Label>
            <Select value={template} onValueChange={setTemplate}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EMAIL_TEMPLATES.map(t => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {template === 'custom' && (
            <div className="space-y-2">
              <Label>What would you like to communicate?</Label>
              <Textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Describe what you want to say in this email..."
                rows={3}
              />
            </div>
          )}

          <Button
            onClick={generateEmail}
            disabled={isGenerating || (template === 'custom' && !customPrompt)}
            className="w-full bg-purple-600 hover:bg-purple-700"
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

          {/* Generated Email */}
          {(subject || body) && (
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <Label className="text-sm text-slate-500">To: {agent?.email}</Label>
                <Button variant="ghost" size="sm" onClick={generateEmail} disabled={isGenerating}>
                  <RefreshCw className={`w-4 h-4 mr-1 ${isGenerating ? 'animate-spin' : ''}`} />
                  Regenerate
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Subject</Label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Body</Label>
                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={10}
                  className="font-mono text-sm"
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={handleCopy}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
                <Button 
                  onClick={handleSendEmail} 
                  disabled={isSending || !subject || !body}
                  className="bg-teal-600 hover:bg-teal-700"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Email
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}