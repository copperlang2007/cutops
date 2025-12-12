import { useState } from 'react'
import { base44 } from '@/api/base44Client'
import { useMutation } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { HelpCircle, Sparkles, Loader2, ThumbsUp, ThumbsDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import ReactMarkdown from 'react-markdown';

const commonQuestions = [
  "What does my Medicare Advantage plan cover?",
  "How do I file a claim?",
  "When can I change my plan?",
  "What is the difference between Medicare Advantage and Medigap?",
  "How do prescription drug benefits work?",
  "What are my out-of-pocket costs?",
  "How do I find in-network providers?",
  "What happens if I travel?"
];

export default function AIFAQAssistant({ clientId, planType }) {
  const [question, setQuestion] = useState('');
  const [conversation, setConversation] = useState([]);

  const askMutation = useMutation({
    mutationFn: async (query) => {
      const response = await base44.functions.invoke('aiFAQAssistant', {
        question: query,
        clientId,
        planType,
        conversationHistory: conversation
      });
      return response.data;
    },
    onSuccess: (data) => {
      setConversation([
        ...conversation,
        { role: 'user', content: question },
        { role: 'assistant', content: data.answer, sources: data.sources, confidence: data.confidence }
      ]);
      setQuestion('');
    },
    onError: () => {
      toast.error('Failed to get answer');
    }
  });

  const handleAsk = (q) => {
    if (q.trim()) {
      setQuestion(q);
      askMutation.mutate(q);
    }
  };

  const handleFeedback = async (messageIndex, helpful) => {
    toast.success('Thank you for your feedback!');
  };

  return (
    <Card className="clay-morphism border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          AI FAQ Assistant
        </CardTitle>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Get instant answers to your insurance questions
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Conversation History */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          <AnimatePresence>
            {conversation.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                )}
                <div className={`max-w-[85%] ${msg.role === 'user' ? 'order-first' : ''}`}>
                  <div className={`rounded-2xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-teal-600 text-white'
                      : 'clay-subtle'
                  }`}>
                    {msg.role === 'user' ? (
                      <p className="text-sm">{msg.content}</p>
                    ) : (
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-2 mt-2 ml-2">
                      {msg.confidence && (
                        <Badge variant="outline" className="text-xs">
                          {msg.confidence}% confident
                        </Badge>
                      )}
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleFeedback(idx, true)}
                          className="h-6 px-2"
                        >
                          <ThumbsUp className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleFeedback(idx, false)}
                          className="h-6 px-2"
                        >
                          <ThumbsDown className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Common Questions */}
        {conversation.length === 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Popular Questions
            </p>
            <div className="grid grid-cols-1 gap-2">
              {commonQuestions.slice(0, 4).map((q, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  className="justify-start text-left h-auto py-3 px-4 clay-subtle hover:bg-teal-50 dark:hover:bg-teal-900/20"
                  onClick={() => handleAsk(q)}
                >
                  <HelpCircle className="w-4 h-4 mr-2 text-teal-600 shrink-0" />
                  <span className="text-sm">{q}</span>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="flex gap-2">
          <Input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAsk(question)}
            placeholder="Ask a question about your coverage..."
            disabled={askMutation.isPending}
          />
          <Button
            onClick={() => handleAsk(question)}
            disabled={!question.trim() || askMutation.isPending}
            className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
          >
            {askMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}