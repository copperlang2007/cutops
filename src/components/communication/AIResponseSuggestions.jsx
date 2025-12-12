import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, Loader2, Copy, Send, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function AIResponseSuggestions({ client, agentId }) {
  const queryClient = useQueryClient();
  const [incomingMessage, setIncomingMessage] = useState('');
  const [suggestions, setSuggestions] = useState(null);
  const [selectedResponse, setSelectedResponse] = useState('');

  const getSuggestionsMutation = useMutation({
    mutationFn: async (message) => {
      const result = await base44.functions.invoke('aiCommunicationAssistant', {
        action: 'suggest_response',
        client_id: client.id,
        agent_id: agentId,
        message_content: message
      });
      return result.data.suggestions;
    },
    onSuccess: (data) => {
      setSuggestions(data);
      toast.success('Response suggestions generated');
    }
  });

  const sendResponseMutation = useMutation({
    mutationFn: async (content) => {
      await Promise.all([
        base44.integrations.Core.SendEmail({
          to: client.email,
          subject: 'Re: Your Message',
          body: content
        }),
        base44.entities.ClientInteraction.create({
          client_id: client.id,
          agent_id: agentId,
          interaction_type: 'email',
          direction: 'outbound',
          subject: 'Re: Your Message',
          notes: content,
          outcome: 'successful',
          interaction_date: new Date().toISOString()
        }),
        base44.entities.CommunicationLog.create({
          client_id: client.id,
          agent_id: agentId,
          communication_type: 'email',
          direction: 'outbound',
          subject: 'Re: Your Message',
          content: content,
          ai_assisted: true,
          ai_metadata: {
            suggestions_used: ['AI response suggestion']
          },
          sent_date: new Date().toISOString(),
          status: 'sent'
        })
      ]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['clientInteractions']);
      queryClient.invalidateQueries(['communicationLogs']);
      toast.success('Response sent successfully');
      setIncomingMessage('');
      setSuggestions(null);
      setSelectedResponse('');
    }
  });

  const getToneColor = (tone) => {
    const colors = {
      professional: 'bg-blue-100 text-blue-700',
      empathetic: 'bg-purple-100 text-purple-700',
      friendly: 'bg-green-100 text-green-700',
      formal: 'bg-slate-100 text-slate-700'
    };
    return colors[tone] || 'bg-slate-100 text-slate-700';
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-amber-600" />
          AI Response Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
            Client's Incoming Message
          </label>
          <Textarea
            value={incomingMessage}
            onChange={(e) => setIncomingMessage(e.target.value)}
            placeholder="Paste the client's message here..."
            rows={4}
          />
        </div>

        <Button
          onClick={() => getSuggestionsMutation.mutate(incomingMessage)}
          disabled={!incomingMessage || getSuggestionsMutation.isPending}
          className="w-full bg-amber-600 hover:bg-amber-700"
        >
          {getSuggestionsMutation.isPending ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating Suggestions...</>
          ) : (
            <><Lightbulb className="w-4 h-4 mr-2" /> Get AI Response Suggestions</>
          )}
        </Button>

        {suggestions && (
          <div className="space-y-4">
            {/* Warnings */}
            {suggestions.warnings?.length > 0 && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-900 dark:text-red-200 mb-1">
                      Compliance Warnings:
                    </p>
                    <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                      {suggestions.warnings.map((warning, idx) => (
                        <li key={idx}>• {warning}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Talking Points */}
            {suggestions.talking_points?.length > 0 && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
                  Key Talking Points:
                </p>
                <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                  {suggestions.talking_points.map((point, idx) => (
                    <li key={idx}>• {point}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Suggested Responses */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Suggested Responses:
              </p>
              {suggestions.suggested_responses?.map((response, idx) => (
                <div
                  key={idx}
                  className={`p-4 border dark:border-slate-700 rounded-lg cursor-pointer transition-all ${
                    selectedResponse === response.response
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                      : 'hover:border-amber-300'
                  }`}
                  onClick={() => setSelectedResponse(response.response)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Badge className={getToneColor(response.tone)}>
                      {response.tone}
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(response.response);
                        toast.success('Copied to clipboard');
                      }}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300 mb-2 whitespace-pre-wrap">
                    {response.response}
                  </p>
                  <p className="text-xs text-slate-500 mb-2">
                    <strong>Best for:</strong> {response.recommended_use}
                  </p>
                  {response.next_steps?.length > 0 && (
                    <div className="text-xs text-slate-600">
                      <strong>Next steps:</strong>
                      <ul className="mt-1 space-y-0.5">
                        {response.next_steps.map((step, sidx) => (
                          <li key={sidx}>• {step}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {selectedResponse && (
              <Button
                onClick={() => sendResponseMutation.mutate(selectedResponse)}
                disabled={sendResponseMutation.isPending}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {sendResponseMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...</>
                ) : (
                  <><Send className="w-4 h-4 mr-2" /> Send Selected Response</>
                )}
              </Button>
            )}

            {suggestions.compliance_notes && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs text-slate-600 dark:text-slate-400">
                <strong>Compliance Note:</strong> {suggestions.compliance_notes}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}