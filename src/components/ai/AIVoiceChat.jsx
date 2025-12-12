import { useState, useRef, useEffect } from 'react'
import { base44 } from '@/api/base44Client'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  MessageCircle, Send, Loader2, Bot, User, Sparkles
} from 'lucide-react';

export default function AIVoiceChat({ agent, licenses, contracts, checklistItems }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: `Hi ${agent?.first_name || 'there'}! I'm your AI assistant. Ask me about your onboarding status, compliance requirements, or any questions about the process.` }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const completedChecklist = checklistItems?.filter(c => c.is_completed).length || 0;
      const totalChecklist = checklistItems?.length || 0;
      const activeLicenses = licenses?.filter(l => l.status === 'active').length || 0;
      const activeContracts = contracts?.filter(c => ['active', 'contract_signed'].includes(c.contract_status)).length || 0;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a helpful AI assistant for insurance agents. Answer this question based on the agent's data:

AGENT: ${agent?.first_name} ${agent?.last_name}
STATUS: ${agent?.onboarding_status}
ONBOARDING: ${completedChecklist}/${totalChecklist} items completed
LICENSES: ${activeLicenses} active
CONTRACTS: ${activeContracts} active

QUESTION: ${userMessage}

Provide a helpful, concise response. If asked about compliance, give specific guidance. If asked about status, summarize their progress. Be friendly and professional.`,
        response_json_schema: {
          type: "object",
          properties: {
            response: { type: "string" }
          }
        }
      });

      setMessages(prev => [...prev, { role: 'assistant', content: result.response }]);
    } catch (err) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "I'm sorry, I couldn't process that request. Please try again." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-blue-600" />
          AI Assistant
          <Badge variant="outline" className="bg-emerald-100 text-emerald-700 text-xs">24/7</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 overflow-y-auto mb-3 space-y-2 p-2 bg-slate-50 rounded-lg">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : ''}`}>
              {msg.role === 'assistant' && (
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-3 h-3 text-blue-600" />
                </div>
              )}
              <div className={`p-2 rounded-lg max-w-[80%] ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white border border-slate-200'
              }`}>
                <p className="text-xs">{msg.content}</p>
              </div>
              {msg.role === 'user' && (
                <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                  <User className="w-3 h-3 text-slate-600" />
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-2">
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                <Loader2 className="w-3 h-3 text-blue-600 animate-spin" />
              </div>
              <div className="p-2 bg-white border border-slate-200 rounded-lg">
                <p className="text-xs text-slate-400">Thinking...</p>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Ask about your status, compliance..."
            className="text-sm"
          />
          <Button size="sm" onClick={sendMessage} disabled={isLoading}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}