import { useState, useEffect, useRef } from 'react'
import { base44 } from '@/api/base44Client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  MessageSquare, Send, Sparkles, Loader2, BookOpen, 
  BarChart3, Bell, User, Bot, X, Minimize2, Maximize2 
} from 'lucide-react';
import { toast } from 'sonner'
import ReactMarkdown from 'react-markdown';

export default function AssistantChat({ isMinimized: externalMinimized, onToggleMinimize }) {
  const [isMinimized, setIsMinimized] = useState(externalMinimized ?? true);
  const [conversation, setConversation] = useState(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  // Initialize conversation
  useEffect(() => {
    const initConversation = async () => {
      try {
        // Check for existing conversation
        const conversations = await base44.agents.listConversations({
          agent_name: 'assistant'
        });

        if (conversations.length > 0) {
          const latest = conversations[0];
          setConversation(latest);
          setMessages(latest.messages || []);
        } else {
          // Create new conversation
          const newConv = await base44.agents.createConversation({
            agent_name: 'assistant',
            metadata: {
              name: `Assistant Chat - ${user?.full_name || 'User'}`,
              description: 'AI Assistant conversation'
            }
          });
          setConversation(newConv);
          setMessages([]);
        }
      } catch (error) {
        console.error('Failed to initialize conversation:', error);
      }
    };

    if (user) {
      initConversation();
    }
  }, [user]);

  // Subscribe to conversation updates
  useEffect(() => {
    if (!conversation?.id) return;

    const unsubscribe = base44.agents.subscribeToConversation(
      conversation.id,
      (data) => {
        setMessages(data.messages || []);
        scrollToBottom();
      }
    );

    return () => unsubscribe();
  }, [conversation?.id]);

  const sendMessageMutation = useMutation({
    mutationFn: async (content) => {
      if (!conversation) throw new Error('No conversation');
      
      await base44.agents.addMessage(conversation, {
        role: 'user',
        content
      });
    },
    onSuccess: () => {
      setMessage('');
    },
    onError: (error) => {
      toast.error(`Failed to send message: ${error.message}`);
    }
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!message.trim() || sendMessageMutation.isPending) return;
    sendMessageMutation.mutate(message);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestedQuestions = [
    { icon: BookOpen, text: 'How do I onboard a new client?', category: 'Tutorial' },
    { icon: BarChart3, text: 'Show me my performance metrics', category: 'Analysis' },
    { icon: Bell, text: 'What alerts do I have?', category: 'Alerts' },
    { icon: BookOpen, text: 'Search compliance guidelines', category: 'Knowledge' }
  ];

  const toggleMinimize = () => {
    const newState = !isMinimized;
    setIsMinimized(newState);
    if (onToggleMinimize) onToggleMinimize(newState);
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={toggleMinimize}
          className="h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-slate-900 to-black hover:from-slate-800 hover:to-slate-900"
          size="icon"
        >
          <MessageSquare className="w-6 h-6" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96">
      <Card className="border-0 shadow-2xl">
        <CardHeader className="bg-gradient-to-r from-slate-900 to-black text-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              <CardTitle className="text-lg">AI Assistant</CardTitle>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMinimize}
                className="text-white hover:bg-white/20"
              >
                <Minimize2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <p className="text-xs text-slate-100 mt-1">
            Your intelligent assistant for tutorials, insights, and more
          </p>
        </CardHeader>

        <CardContent className="p-0">
          <ScrollArea className="h-96 p-4">
            {messages.length === 0 ? (
              <div className="space-y-4">
                <div className="text-center py-8">
                  <Bot className="w-12 h-12 mx-auto text-slate-900 mb-3" />
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                    How can I help you today?
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Ask me anything about the platform, your data, or get tutorials
                  </p>
                </div>

                <div className="space-y-2">
                  {suggestedQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => setMessage(q.text)}
                      className="w-full text-left p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <q.icon className="w-4 h-4 text-slate-900" />
                        <Badge variant="outline" className="text-xs">
                          {q.category}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-700 dark:text-slate-300">
                        {q.text}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex gap-3 ${
                      msg.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center shrink-0">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2 ${
                        msg.role === 'user'
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                      }`}
                    >
                      {msg.role === 'assistant' ? (
                        <ReactMarkdown
                          className="text-sm prose prose-sm dark:prose-invert max-w-none"
                          components={{
                            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                            ul: ({ children }) => <ul className="ml-4 mb-2 list-disc">{children}</ul>,
                            ol: ({ children }) => <ol className="ml-4 mb-2 list-decimal">{children}</ol>,
                            li: ({ children }) => <li className="mb-1">{children}</li>,
                            code: ({ inline, children }) =>
                              inline ? (
                                <code className="bg-slate-200 dark:bg-slate-700 px-1 rounded text-xs">
                                  {children}
                                </code>
                              ) : (
                                <code className="block bg-slate-200 dark:bg-slate-700 p-2 rounded text-xs overflow-x-auto">
                                  {children}
                                </code>
                              )
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      ) : (
                        <p className="text-sm">{msg.content}</p>
                      )}
                    </div>
                    {msg.role === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center shrink-0">
                        <User className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                ))}
                {sendMessageMutation.isPending && (
                  <div className="flex gap-3 justify-start">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-slate-100 dark:bg-slate-800 rounded-lg px-4 py-2">
                      <Loader2 className="w-4 h-4 animate-spin text-slate-900" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          <div className="p-4 border-t border-slate-200 dark:border-slate-700">
            <div className="flex gap-2">
              <Input
                placeholder="Ask me anything..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={sendMessageMutation.isPending}
                className="flex-1"
              />
              <Button
                onClick={handleSend}
                disabled={!message.trim() || sendMessageMutation.isPending}
                className="bg-slate-900 hover:bg-black"
              >
                {sendMessageMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}