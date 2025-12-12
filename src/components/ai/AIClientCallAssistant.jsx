import { useState } from 'react'
import { base44 } from '@/api/base44Client'
import { useMutation } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Mic, Send, Loader2, Sparkles, Phone, CheckCircle } from 'lucide-react'

export default function AIClientCallAssistant({ clientId, agentId }) {
  const [query, setQuery] = useState('');
  const [responses, setResponses] = useState([]);

  const askAssistantMutation = useMutation({
    mutationFn: async (q) => {
      const response = await base44.functions.invoke('aiClientAssistant', {
        query: q,
        client_id: clientId,
        agent_id: agentId
      });
      return response.data;
    },
    onSuccess: (data) => {
      setResponses(prev => [{
        query,
        response: data.response,
        timestamp: new Date()
      }, ...prev]);
      setQuery('');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      askAssistantMutation.mutate(query.trim());
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'high': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'medium': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      default: return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    }
  };

  return (
    <Card className="border-0 shadow-lg liquid-glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="w-5 h-5 text-teal-600" />
          AI Call Assistant
          <Badge variant="outline" className="ml-auto">
            <Sparkles className="w-3 h-3 mr-1" />
            Real-time
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask about client details, policies, history..."
            disabled={askAssistantMutation.isPending}
          />
          <Button 
            type="submit" 
            disabled={askAssistantMutation.isPending || !query.trim()}
            className="bg-teal-600 hover:bg-teal-700"
          >
            {askAssistantMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>

        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {responses.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              <Mic className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="text-sm">Ask me anything during your call</p>
              <p className="text-xs mt-1">Client info, policy details, interaction history...</p>
            </div>
          )}

          {responses.map((item, idx) => (
            <div key={idx} className="space-y-2">
              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
                  {item.query}
                </p>
              </div>

              <div className="p-4 rounded-lg bg-white dark:bg-slate-800 border dark:border-slate-700">
                <div className="flex items-center justify-between mb-3">
                  <Badge className={getUrgencyColor(item.response.urgency)}>
                    {item.response.urgency} priority
                  </Badge>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-slate-900 dark:text-white font-medium mb-2">
                      {item.response.answer}
                    </p>
                    {item.response.related_info && (
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {item.response.related_info}
                      </p>
                    )}
                  </div>

                  {item.response.quick_facts?.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-slate-500 mb-1">Quick Facts</p>
                      <ul className="space-y-1">
                        {item.response.quick_facts.map((fact, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                            <CheckCircle className="w-3 h-3 text-green-600 mt-0.5 shrink-0" />
                            {fact}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {item.response.suggested_actions?.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-slate-500 mb-1">Suggested Actions</p>
                      <div className="space-y-1">
                        {item.response.suggested_actions.map((action, i) => (
                          <Badge key={i} variant="outline" className="text-xs mr-1">
                            {action}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}