import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Loader2, Send, Copy, Mail, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

export default function ProactiveMessageGenerator({ clientId, clientEmail }) {
  const [outreachReason, setOutreachReason] = useState('');
  const [preferredChannel, setPreferredChannel] = useState('email');
  const [message, setMessage] = useState(null);

  const generateMutation = useMutation({
    mutationFn: () => base44.functions.invoke('aiGenerateProactiveMessage', {
      clientId,
      outreachReason,
      preferredChannel
    }),
    onSuccess: (response) => {
      setMessage(response.data);
      toast.success('Message generated!');
    },
    onError: () => toast.error('Failed to generate message')
  });

  const sendEmailMutation = useMutation({
    mutationFn: () => base44.integrations.Core.SendEmail({
      to: clientEmail,
      subject: message.subject,
      body: message.message_content
    }),
    onSuccess: () => {
      toast.success('Email sent!');
      setMessage(null);
      setOutreachReason('');
    }
  });

  const copyToClipboard = () => {
    const text = preferredChannel === 'email' 
      ? `Subject: ${message.subject}\n\n${message.message_content}`
      : message.message_content;
    navigator.clipboard.writeText(text);
    toast.success('Copied!');
  };

  return (
    <Card className="clay-morphism border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-600" />
          Proactive Outreach Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!message ? (
          <>
            <div>
              <Label>Outreach Reason</Label>
              <Select value={outreachReason} onValueChange={setOutreachReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select reason..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="policy_renewal_approaching">Policy Renewal Approaching</SelectItem>
                  <SelectItem value="recent_churn_risk_flag">Churn Risk Detected</SelectItem>
                  <SelectItem value="new_benefit_opportunity">New Benefit Opportunity</SelectItem>
                  <SelectItem value="policy_anniversary">Policy Anniversary</SelectItem>
                  <SelectItem value="seasonal_checkup">Seasonal Check-up</SelectItem>
                  <SelectItem value="market_change">Market Changes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Channel</Label>
              <Select value={preferredChannel} onValueChange={setPreferredChannel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending || !outreachReason}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
            >
              {generateMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating...</>
              ) : (
                <><Sparkles className="w-4 h-4 mr-2" />Generate Message</>
              )}
            </Button>
          </>
        ) : (
          <>
            {preferredChannel === 'email' && (
              <div className="p-3 clay-subtle rounded">
                <p className="text-xs text-slate-500 mb-1">Subject:</p>
                <p className="font-medium text-slate-900 dark:text-white">{message.subject}</p>
              </div>
            )}
            <div className="p-3 clay-subtle rounded">
              <p className="text-xs text-slate-500 mb-2">Message:</p>
              <Textarea
                value={message.message_content}
                onChange={(e) => setMessage({ ...message, message_content: e.target.value })}
                rows={preferredChannel === 'email' ? 10 : 4}
                className="text-sm"
              />
            </div>
            <div className="flex gap-2">
              {preferredChannel === 'email' && (
                <Button
                  onClick={() => sendEmailMutation.mutate()}
                  disabled={sendEmailMutation.isPending}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {sendEmailMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending...</>
                  ) : (
                    <><Send className="w-4 h-4 mr-2" />Send</>
                  )}
                </Button>
              )}
              <Button variant="outline" onClick={copyToClipboard}>
                <Copy className="w-4 h-4 mr-2" />
                Copy
              </Button>
              <Button variant="outline" onClick={() => setMessage(null)}>
                Clear
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}