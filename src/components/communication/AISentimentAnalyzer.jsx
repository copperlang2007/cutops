import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tantml/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Loader2, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

export default function AISentimentAnalyzer({ clientId, agentId }) {
  const [message, setMessage] = useState('');
  const [analysis, setAnalysis] = useState(null);

  const analyzeMutation = useMutation({
    mutationFn: async (content) => {
      const result = await base44.functions.invoke('aiCommunicationAssistant', {
        action: 'analyze_sentiment',
        message_content: content
      });
      return result.data.analysis;
    },
    onSuccess: (data) => {
      setAnalysis(data);
      toast.success('Sentiment analyzed');
    }
  });

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'urgent': return 'bg-red-100 text-red-700 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'medium': return 'bg-amber-100 text-amber-700 border-amber-300';
      case 'low': return 'bg-blue-100 text-blue-700 border-blue-300';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getSentimentColor = (sentiment) => {
    if (sentiment.includes('positive')) return 'bg-green-100 text-green-700';
    if (sentiment.includes('negative')) return 'bg-red-100 text-red-700';
    return 'bg-slate-100 text-slate-700';
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-blue-600" />
          Sentiment Analyzer & Message Prioritizer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Paste incoming client message to analyze sentiment and urgency..."
          rows={4}
        />

        <Button
          onClick={() => analyzeMutation.mutate(message)}
          disabled={!message || analyzeMutation.isPending}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {analyzeMutation.isPending ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing...</>
          ) : (
            <><Sparkles className="w-4 h-4 mr-2" /> Analyze Sentiment & Urgency</>
          )}
        </Button>

        {analysis && (
          <div className="p-4 border dark:border-slate-700 rounded-lg space-y-3">
            <div className="flex items-center gap-2">
              <Badge className={getSentimentColor(analysis.sentiment)}>
                {analysis.sentiment}
              </Badge>
              <Badge className={getUrgencyColor(analysis.urgency)}>
                {analysis.urgency} urgency
              </Badge>
              {analysis.action_required && (
                <Badge className="bg-red-100 text-red-700">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Action Required
                </Badge>
              )}
            </div>

            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Summary:
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {analysis.summary}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Emotional Tone:
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {analysis.emotional_tone}
              </p>
            </div>

            {analysis.concerns?.length > 0 && (
              <div>
                <p className="text-sm font-medium text-red-700 dark:text-red-300 mb-1">
                  Client Concerns:
                </p>
                <ul className="text-sm text-red-600 dark:text-red-400 space-y-1">
                  {analysis.concerns.map((concern, idx) => (
                    <li key={idx}>• {concern}</li>
                  ))}
                </ul>
              </div>
            )}

            {analysis.key_topics?.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {analysis.key_topics.map((topic, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {topic}
                  </Badge>
                ))}
              </div>
            )}

            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs">
              <strong>Priority Reason:</strong> {analysis.priority_reason}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}