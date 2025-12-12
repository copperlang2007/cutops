import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Loader2, Send, Copy } from 'lucide-react';
import { toast } from 'sonner';

export default function AIEmailDraftingTool({ clientId, clientEmail, agentId }) {
  const [topic, setTopic] = useState('');
  const [purpose, setPurpose] = useState('');
  const [tone, setTone] = useState('friendly');
  const [draft, setDraft] = useState(null);

  const draftMutation = useMutation({
    mutationFn: () => base44.functions.invoke('aiAssistEmailDrafting', {
      clientId,
      agentId,
      topic,
      tone,
      purpose
    }),
    onSuccess: (response) => {
      setDraft(response.data);
      toast.success('Email draft generated!');
    },
    onError: () => toast.error('Failed to generate draft')
  });

  const sendMutation = useMutation({
    mutationFn: () => base44.integrations.Core.SendEmail({
      to: clientEmail,
      subject: draft.subject,
      body: draft.body
    }),
    onSuccess: () => {
      toast.success('Email sent!');
      setDraft(null);
      setTopic('');
      setPurpose('');
    }
  });

  const copyToClipboard = () => {
    navigator.clipboard.writeText(`Subject: ${draft.subject}\n\n${draft.body}`);
    toast.success('Copied to clipboard!');
  };

  return (
    <Card className="clay-morphism border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          AI Email Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!draft ? (
          <>
            <div>
              <Label>Topic</Label>
              <Input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Policy renewal reminder"
              />
            </div>
            <div>
              <Label>Purpose</Label>
              <Textarea
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="What do you want to accomplish with this email?"
                rows={3}
              />
            </div>
            <div>
              <Label>Tone</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="formal">Formal</SelectItem>
                  <SelectItem value="friendly">Friendly</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="empathetic">Empathetic</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={() => draftMutation.mutate()}
              disabled={draftMutation.isPending || !topic || !purpose}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {draftMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating...</>
              ) : (
                <><Sparkles className="w-4 h-4 mr-2" />Generate Draft</>
              )}
            </Button>
          </>
        ) : (
          <>
            <div className="p-3 clay-subtle rounded">
              <p className="text-xs text-slate-500 mb-1">Subject:</p>
              <p className="font-medium text-slate-900 dark:text-white">{draft.subject}</p>
            </div>
            <div className="p-3 clay-subtle rounded">
              <p className="text-xs text-slate-500 mb-2">Body:</p>
              <Textarea
                value={draft.body}
                onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                rows={12}
                className="text-sm"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => sendMutation.mutate()}
                disabled={sendMutation.isPending}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {sendMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending...</>
                ) : (
                  <><Send className="w-4 h-4 mr-2" />Send Email</>
                )}
              </Button>
              <Button variant="outline" onClick={copyToClipboard}>
                <Copy className="w-4 h-4 mr-2" />
                Copy
              </Button>
              <Button variant="outline" onClick={() => setDraft(null)}>
                Clear
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}