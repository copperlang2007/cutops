import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Brain, Sparkles, Loader2, Send, MessageSquare, 
  ThumbsUp, ThumbsDown, Copy, RefreshCw, Lightbulb
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const QUICK_QUESTIONS = [
  "What are the AEP dates this year?",
  "How do I explain Part D coverage gap?",
  "What's the difference between HMO and PPO?",
  "Can a client switch plans during SEP?",
  "What documents do I need for enrollment?"
];

export default function AIKnowledgeAssistant() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (question) => {
    const query = question || input;
    if (!query.trim()) return;

    const userMessage = { role: 'user', content: query };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert Medicare insurance knowledge assistant. Answer the following question from an insurance agent clearly and accurately.

Question: ${query}

Provide:
1. A clear, direct answer
2. Key points to remember
3. Any compliance considerations
4. Related topics they might want to explore

Format your response in a helpful, conversational way. Be accurate about Medicare rules and regulations.`,
        response_json_schema: {
          type: "object",
          properties: {
            answer: { type: "string" },
            key_points: { type: "array", items: { type: "string" } },
            compliance_note: { type: "string" },
            related_topics: { type: "array", items: { type: "string" } },
            sources: { type: "array", items: { type: "string" } }
          }
        },
        add_context_from_internet: true
      });

      const assistantMessage = { 
        role: 'assistant', 
        content: result.answer,
        keyPoints: result.key_points,
        complianceNote: result.compliance_note,
        relatedTopics: result.related_topics
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      toast.error('Failed to get answer. Please try again.');
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const rateResponse = (helpful) => {
    toast.success(helpful ? 'Thanks for your feedback!' : 'We\'ll work on improving');
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-600" />
          AI Knowledge Assistant
          <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white ml-2">
            <Sparkles className="w-3 h-3 mr-1" />
            Beta
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Quick Questions */}
        {messages.length === 0 && (
          <div className="mb-4">
            <p className="text-sm text-slate-500 mb-2">Quick questions:</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_QUESTIONS.map((q, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  onClick={() => sendMessage(q)}
                  className="text-xs"
                >
                  <Lightbulb className="w-3 h-3 mr-1 text-amber-500" />
                  {q}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="space-y-4 max-h-[400px] overflow-y-auto mb-4">
          <AnimatePresence>
            {messages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] rounded-lg p-4 ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-slate-100 dark:bg-slate-800'
                }`}>
                  {msg.role === 'user' ? (
                    <p>{msg.content}</p>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-slate-700 dark:text-slate-200">{msg.content}</p>
                      
                      {msg.keyPoints?.length > 0 && (
                        <div className="p-3 bg-white dark:bg-slate-700 rounded-lg">
                          <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-2">Key Points:</p>
                          <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
                            {msg.keyPoints.map((point, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-blue-500">•</span>
                                {point}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {msg.complianceNote && (
                        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                          <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-1">
                            ⚠️ Compliance Note:
                          </p>
                          <p className="text-sm text-amber-600 dark:text-amber-300">{msg.complianceNote}</p>
                        </div>
                      )}

                      {msg.relatedTopics?.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          <span className="text-xs text-slate-500">Related:</span>
                          {msg.relatedTopics.map((topic, i) => (
                            <button
                              key={i}
                              onClick={() => sendMessage(`Tell me about ${topic}`)}
                              className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100"
                            >
                              {topic}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-2 border-t">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => copyToClipboard(msg.content)}
                        >
                          <Copy className="w-3 h-3 mr-1" />
                          Copy
                        </Button>
                        <div className="flex items-center gap-1 ml-auto">
                          <span className="text-xs text-slate-400">Helpful?</span>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => rateResponse(true)}>
                            <ThumbsUp className="w-3 h-3 text-slate-400 hover:text-green-500" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => rateResponse(false)}>
                            <ThumbsDown className="w-3 h-3 text-slate-400 hover:text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-4">
                <div className="flex items-center gap-2 text-slate-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <Input
            placeholder="Ask anything about Medicare, policies, or compliance..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            disabled={isLoading}
          />
          <Button onClick={() => sendMessage()} disabled={isLoading || !input.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>

        {messages.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 text-xs"
            onClick={() => setMessages([])}
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Clear conversation
          </Button>
        )}
      </CardContent>
    </Card>
  );
}