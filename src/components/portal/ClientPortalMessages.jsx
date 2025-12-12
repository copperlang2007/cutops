import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, Send, Phone, Mail, 
  Clock, User, ArrowLeft, Plus
} from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function ClientPortalMessages({ client, agent, interactions = [] }) {
  const queryClient = useQueryClient();
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [newMessage, setNewMessage] = useState({ subject: '', message: '' });

  const sendMessageMutation = useMutation({
    mutationFn: async (data) => {
      // Create an interaction record
      await base44.entities.ClientInteraction.create({
        client_id: client.id,
        agent_id: client.agent_id,
        interaction_type: 'email',
        direction: 'inbound',
        subject: data.subject,
        notes: data.message,
        outcome: 'callback_requested'
      });
    },
    onSuccess: () => {
      toast.success('Message sent! Your agent will respond soon.');
      setNewMessage({ subject: '', message: '' });
      setShowNewMessage(false);
      queryClient.invalidateQueries(['clientInteractions']);
    }
  });

  const handleSendMessage = () => {
    if (!newMessage.subject.trim() || !newMessage.message.trim()) {
      toast.error('Please enter a subject and message');
      return;
    }
    sendMessageMutation.mutate(newMessage);
  };

  const getInteractionIcon = (type) => {
    switch (type) {
      case 'call': return Phone;
      case 'email': return Mail;
      default: return MessageSquare;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        {/* New Message Form */}
        {showNewMessage ? (
          <Card className="border-0 shadow-sm dark:bg-slate-800">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-teal-600" />
                  New Message
                </CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowNewMessage(false)}
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">
                  To
                </label>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white text-xs font-semibold">
                    {agent?.first_name?.[0]}{agent?.last_name?.[0]}
                  </div>
                  <span className="font-medium text-slate-800 dark:text-white">
                    {agent ? `${agent.first_name} ${agent.last_name}` : 'Your Agent'}
                  </span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">
                  Subject
                </label>
                <Input
                  placeholder="What is this about?"
                  value={newMessage.subject}
                  onChange={(e) => setNewMessage({ ...newMessage, subject: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">
                  Message
                </label>
                <Textarea
                  placeholder="Type your message here..."
                  rows={6}
                  value={newMessage.message}
                  onChange={(e) => setNewMessage({ ...newMessage, message: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button 
                  variant="outline"
                  onClick={() => setShowNewMessage(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSendMessage}
                  disabled={sendMessageMutation.isPending}
                  className="bg-teal-600 hover:bg-teal-700"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send Message
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Message Header */}
            <Card className="border-0 shadow-sm dark:bg-slate-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold text-slate-800 dark:text-white">Messages</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Communicate securely with your agent
                    </p>
                  </div>
                  <Button 
                    onClick={() => setShowNewMessage(true)}
                    className="bg-teal-600 hover:bg-teal-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Message
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Message History */}
            <Card className="border-0 shadow-sm dark:bg-slate-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="w-5 h-5 text-slate-400" />
                  Communication History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {interactions.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">
                      No Messages Yet
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 mb-4">
                      Start a conversation with your agent
                    </p>
                    <Button 
                      onClick={() => setShowNewMessage(true)}
                      className="bg-teal-600 hover:bg-teal-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Send First Message
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {interactions.map((interaction, index) => {
                      const Icon = getInteractionIcon(interaction.interaction_type);
                      const isInbound = interaction.direction === 'inbound';
                      
                      return (
                        <motion.div
                          key={interaction.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={`p-4 rounded-xl border ${
                            isInbound 
                              ? 'border-teal-200 bg-teal-50 dark:border-teal-800 dark:bg-teal-900/20 ml-8'
                              : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900/50 mr-8'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                              isInbound 
                                ? 'bg-teal-200 dark:bg-teal-800'
                                : 'bg-slate-200 dark:bg-slate-700'
                            }`}>
                              {isInbound ? (
                                <User className="w-4 h-4 text-teal-700 dark:text-teal-300" />
                              ) : (
                                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                                  {agent?.first_name?.[0]}{agent?.last_name?.[0]}
                                </span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className="font-medium text-slate-800 dark:text-white text-sm">
                                  {isInbound ? 'You' : (agent ? `${agent.first_name} ${agent.last_name}` : 'Agent')}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  <Icon className="w-3 h-3 mr-1" />
                                  {interaction.interaction_type}
                                </Badge>
                                <span className="text-xs text-slate-400">
                                  {format(new Date(interaction.created_date), 'MMM d, yyyy h:mm a')}
                                </span>
                              </div>
                              {interaction.subject && (
                                <p className="font-medium text-slate-700 dark:text-slate-200 text-sm mb-1">
                                  {interaction.subject}
                                </p>
                              )}
                              {interaction.notes && (
                                <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
                                  {interaction.notes}
                                </p>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Agent Contact */}
        <Card className="border-0 shadow-sm dark:bg-slate-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Your Agent</CardTitle>
          </CardHeader>
          <CardContent>
            {agent ? (
              <div className="text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white text-xl font-semibold mb-3">
                  {agent.first_name?.[0]}{agent.last_name?.[0]}
                </div>
                <p className="font-semibold text-slate-800 dark:text-white">
                  {agent.first_name} {agent.last_name}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Licensed Insurance Agent</p>
                
                <div className="space-y-2 text-left">
                  {agent.phone && (
                    <a 
                      href={`tel:${agent.phone}`}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm"
                    >
                      <Phone className="w-4 h-4 text-teal-600" />
                      <span className="text-slate-700 dark:text-slate-300">{agent.phone}</span>
                    </a>
                  )}
                  {agent.email && (
                    <a 
                      href={`mailto:${agent.email}`}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm"
                    >
                      <Mail className="w-4 h-4 text-teal-600" />
                      <span className="text-slate-700 dark:text-slate-300 truncate">{agent.email}</span>
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
                Loading agent information...
              </p>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-0 shadow-sm dark:bg-slate-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <button
              onClick={() => {
                setNewMessage({ subject: 'Question about my coverage', message: '' });
                setShowNewMessage(true);
              }}
              className="w-full p-3 rounded-lg border dark:border-slate-700 hover:border-teal-300 dark:hover:border-teal-600 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all text-left"
            >
              <p className="font-medium text-slate-800 dark:text-white text-sm">Coverage Question</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Ask about your benefits</p>
            </button>
            <button
              onClick={() => {
                setNewMessage({ subject: 'Schedule a call', message: '' });
                setShowNewMessage(true);
              }}
              className="w-full p-3 rounded-lg border dark:border-slate-700 hover:border-teal-300 dark:hover:border-teal-600 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all text-left"
            >
              <p className="font-medium text-slate-800 dark:text-white text-sm">Schedule Call</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Request a callback</p>
            </button>
            <button
              onClick={() => {
                setNewMessage({ subject: 'Document request', message: '' });
                setShowNewMessage(true);
              }}
              className="w-full p-3 rounded-lg border dark:border-slate-700 hover:border-teal-300 dark:hover:border-teal-600 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all text-left"
            >
              <p className="font-medium text-slate-800 dark:text-white text-sm">Request Document</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Get policy documents</p>
            </button>
          </CardContent>
        </Card>

        {/* Response Time */}
        <Card className="border-0 shadow-sm bg-gradient-to-br from-teal-500 to-emerald-600 text-white">
          <CardContent className="p-6">
            <Clock className="w-8 h-8 mb-3 text-teal-100" />
            <h3 className="font-semibold mb-1">Quick Response</h3>
            <p className="text-teal-100 text-sm">
              Your agent typically responds within 24 hours during business days.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}