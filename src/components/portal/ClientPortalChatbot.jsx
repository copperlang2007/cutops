import { useState, useRef, useEffect } from 'react'
import { base44 } from '@/api/base44Client'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Bot, Send, User, Loader2, X, 
  Sparkles, MessageSquare, HelpCircle,
  Shield, Calendar, DollarSign, Phone
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown';

const quickQuestions = [
  { icon: Shield, label: "What's covered?", question: "What does my insurance plan cover?" },
  { icon: DollarSign, label: "My costs", question: "What are my out-of-pocket costs like copays and deductibles?" },
  { icon: Calendar, label: "Important dates", question: "What are the important dates I should know about?" },
  { icon: Phone, label: "Find a doctor", question: "How do I find in-network doctors and specialists?" },
];

export default function ClientPortalChatbot({ open, onClose, client, agent }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (open && messages.length === 0) {
      // Add initial greeting
      setMessages([{
        role: 'assistant',
        content: `Hello${client?.first_name ? `, ${client.first_name}` : ''}! 👋 I'm your AI insurance assistant. I can help you with questions about your coverage, benefits, and more. What would you like to know?`
      }]);
    }
  }, [open, client]);

  const planTypeLabels = {
    medicare_advantage: 'Medicare Advantage',
    supplement: 'Medicare Supplement (Medigap)',
    pdp: 'Prescription Drug Plan (Part D)',
    ancillary: 'Ancillary Coverage',
    other: 'Other Coverage'
  };

  const handleSend = async (question = input) => {
    if (!question.trim() || isLoading) return;

    const userMessage = { role: 'user', content: question };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const clientContext = client ? `
Client Information:
- Name: ${client.first_name} ${client.last_name}
- Plan Type: ${planTypeLabels[client.plan_type] || 'Not specified'}
- Current Plan: ${client.current_plan || 'Not specified'}
- Carrier: ${client.carrier || 'Not specified'}
- Status: ${client.status || 'Active'}
- Effective Date: ${client.effective_date || 'Pending'}
- Renewal Date: ${client.renewal_date || 'N/A'}
- Monthly Premium: $${client.premium || 0}
${agent ? `- Agent: ${agent.first_name} ${agent.last_name}` : ''}
` : 'Client information not available.';

    const systemPrompt = `You are a helpful, friendly AI assistant for a Medicare insurance client portal. You help clients understand their insurance coverage, benefits, and answer common questions.

${clientContext}

Guidelines:
1. Be warm, professional, and empathetic
2. Provide accurate information based on the client's plan type
3. For specific coverage questions, provide general guidance but recommend they contact their agent for personalized answers
4. If asked about something outside your knowledge, suggest they contact their agent
5. Keep responses concise but helpful (2-3 paragraphs max)
6. Use simple language, avoid jargon
7. If the client seems upset or has a complex issue, recommend speaking with their agent

Common topics you can help with:
- General coverage explanations for their plan type
- Understanding copays, deductibles, and premiums
- Annual enrollment and open enrollment periods
- How to find in-network providers
- Prescription drug coverage basics
- Understanding Medicare ID cards
- When to contact their agent vs when to call the carrier

Always be supportive and remember this is about their health coverage, which is important to them.`;

    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `${systemPrompt}\n\nClient's question: ${question}`,
        response_json_schema: {
          type: 'object',
          properties: {
            response: { type: 'string' },
            suggest_agent_contact: { type: 'boolean' },
            related_topics: { type: 'array', items: { type: 'string' } }
          },
          required: ['response']
        }
      });

      let assistantMessage = { 
        role: 'assistant', 
        content: response.response,
        suggestAgentContact: response.suggest_agent_contact,
        relatedTopics: response.related_topics
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chatbot error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I'm sorry, I'm having trouble processing your request right now. Please try again or contact your agent for assistance."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg h-[600px] flex flex-col p-0 gap-0 dark:bg-slate-800">
        {/* Header */}
        <DialogHeader className="p-4 border-b dark:border-slate-700 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-base">AI Insurance Assistant</DialogTitle>
              <p className="text-xs text-slate-500 dark:text-slate-400">Powered by AI • Always here to help</p>
            </div>
          </div>
        </DialogHeader>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <AnimatePresence>
            {messages.map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}
                <div className={`max-w-[80%] ${
                  message.role === 'user'
                    ? 'bg-teal-600 text-white rounded-2xl rounded-tr-sm px-4 py-2'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white rounded-2xl rounded-tl-sm px-4 py-2'
                }`}>
                  {message.role === 'assistant' ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                      
                      {message.suggestAgentContact && (
                        <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-900/30 rounded-lg border border-amber-200 dark:border-amber-700">
                          <p className="text-xs text-amber-700 dark:text-amber-300 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            For personalized assistance, consider contacting your agent.
                          </p>
                        </div>
                      )}
                      
                      {message.relatedTopics && message.relatedTopics.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {message.relatedTopics.slice(0, 3).map((topic, i) => (
                            <button
                              key={i}
                              onClick={() => handleSend(topic)}
                              className="text-xs px-2 py-1 rounded-full bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors"
                            >
                              {topic}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm">{message.content}</p>
                  )}
                </div>
                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-3"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-slate-100 dark:bg-slate-700 rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                  <span className="text-sm text-slate-500 dark:text-slate-400">Thinking...</span>
                </div>
              </div>
            </motion.div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Questions */}
        {messages.length <= 1 && (
          <div className="px-4 pb-2 shrink-0">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Quick questions:</p>
            <div className="grid grid-cols-2 gap-2">
              {quickQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(q.question)}
                  className="flex items-center gap-2 p-2 rounded-lg border dark:border-slate-700 hover:border-teal-300 dark:hover:border-teal-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all text-left"
                >
                  <q.icon className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{q.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t dark:border-slate-700 shrink-0">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about your coverage..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className="bg-teal-600 hover:bg-teal-700 shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-slate-400 mt-2 text-center">
            AI responses are for informational purposes. Contact your agent for personalized advice.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}