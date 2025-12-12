import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Search, Plus, Users, Settings, Bell, BellOff, 
  MoreVertical, Trash2, Archive, UserPlus, Loader2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

import ConversationList from '../components/messaging/ConversationList';
import MessageList from '../components/messaging/MessageList';
import MessageInput from '../components/messaging/MessageInput';
import NewConversationModal from '../components/messaging/NewConversationModal';
import AIMessageAssistant from '../components/messaging/AIMessageAssistant';

export default function Messages() {
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [showAIAssistant, setShowAIAssistant] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser);
  }, []);

  const { data: conversations = [], isLoading: conversationsLoading } = useQuery({
    queryKey: ['conversations', currentUser?.email],
    queryFn: () => base44.entities.Conversation.list('-last_message_date'),
    enabled: !!currentUser?.email,
    refetchInterval: 10000
  });

  const userConversations = useMemo(() => 
    conversations.filter(c => c.participants?.includes(currentUser?.email)),
    [conversations, currentUser?.email]
  );

  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['messages', selectedConversation?.id],
    queryFn: () => base44.entities.Message.filter({ conversation_id: selectedConversation?.id }, 'created_date'),
    enabled: !!selectedConversation?.id,
    refetchInterval: 5000
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list()
  });

  const { data: agents = [] } = useQuery({
    queryKey: ['agents'],
    queryFn: () => base44.entities.Agent.list()
  });

  // Mark messages as read
  useEffect(() => {
    if (selectedConversation && messages.length > 0 && currentUser?.email) {
      const unreadMessages = messages.filter(
        m => m.sender_email !== currentUser.email && !m.read_by?.includes(currentUser.email)
      );
      
      unreadMessages.forEach(async (msg) => {
        await base44.entities.Message.update(msg.id, {
          read_by: [...(msg.read_by || []), currentUser.email]
        });
      });

      if (unreadMessages.length > 0 && selectedConversation.unread_count?.[currentUser.email]) {
        base44.entities.Conversation.update(selectedConversation.id, {
          unread_count: { ...selectedConversation.unread_count, [currentUser.email]: 0 }
        });
        queryClient.invalidateQueries(['conversations']);
      }
    }
  }, [selectedConversation?.id, messages, currentUser?.email]);

  const sendMessageMutation = useMutation({
    mutationFn: async ({ content, replyToId, fileUrl, fileName }) => {
      const message = await base44.entities.Message.create({
        conversation_id: selectedConversation.id,
        sender_email: currentUser.email,
        sender_name: currentUser.full_name,
        content,
        message_type: fileUrl ? 'file' : 'text',
        file_url: fileUrl,
        file_name: fileName,
        reply_to_id: replyToId,
        read_by: [currentUser.email]
      });

      // Update conversation last message
      const unreadCount = { ...selectedConversation.unread_count };
      selectedConversation.participants?.forEach(p => {
        if (p !== currentUser.email) {
          unreadCount[p] = (unreadCount[p] || 0) + 1;
        }
      });

      await base44.entities.Conversation.update(selectedConversation.id, {
        last_message: content.slice(0, 100),
        last_message_date: new Date().toISOString(),
        last_message_sender: currentUser.email,
        unread_count: unreadCount
      });

      return message;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['messages', selectedConversation?.id]);
      queryClient.invalidateQueries(['conversations']);
    }
  });

  const createDirectConversation = async (user) => {
    // Check if conversation already exists
    const existing = userConversations.find(c => 
      c.type === 'direct' && 
      c.participants?.includes(user.email) && 
      c.participants?.length === 2
    );

    if (existing) {
      setSelectedConversation(existing);
      return;
    }

    const conv = await base44.entities.Conversation.create({
      type: 'direct',
      participants: [currentUser.email, user.email],
      participant_names: {
        [currentUser.email]: currentUser.full_name,
        [user.email]: user.name
      },
      unread_count: {}
    });

    queryClient.invalidateQueries(['conversations']);
    setSelectedConversation(conv);
  };

  const createGroupConversation = async (name, members) => {
    const participants = [currentUser.email, ...members.map(m => m.email)];
    const participantNames = {
      [currentUser.email]: currentUser.full_name,
      ...Object.fromEntries(members.map(m => [m.email, m.name]))
    };

    const conv = await base44.entities.Conversation.create({
      type: 'group',
      name,
      participants,
      participant_names: participantNames,
      unread_count: {}
    });

    // Send system message
    await base44.entities.Message.create({
      conversation_id: conv.id,
      sender_email: currentUser.email,
      sender_name: 'System',
      content: `${currentUser.full_name} created the group "${name}"`,
      message_type: 'system'
    });

    queryClient.invalidateQueries(['conversations']);
    setSelectedConversation(conv);
  };

  const handleInsertSummary = async (summaryText) => {
    await sendMessageMutation.mutateAsync({
      content: `📋 AI Summary:\n\n${summaryText}`,
    });
  };

  const totalUnread = useMemo(() => 
    userConversations.reduce((sum, c) => sum + (c.unread_count?.[currentUser?.email] || 0), 0),
    [userConversations, currentUser?.email]
  );

  const getConversationName = (conv) => {
    if (!conv) return '';
    if (conv.type === 'group') return conv.name || 'Group Chat';
    const otherEmail = conv.participants?.find(p => p !== currentUser?.email);
    return conv.participant_names?.[otherEmail] || otherEmail || 'Unknown';
  };

  const conversationContext = useMemo(() => 
    messages.slice(-20).map(m => `${m.sender_name}: ${m.content}`).join('\n'),
    [messages]
  );

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)] bg-slate-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto h-full p-4">
        <Card className="h-full border-0 shadow-premium dark:bg-slate-800 overflow-hidden flex">
          {/* Sidebar */}
          <div className="w-80 border-r border-slate-200 dark:border-slate-700 flex flex-col bg-white dark:bg-slate-800">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-slate-800 dark:text-white">Messages</h1>
                  {totalUnread > 0 && (
                    <Badge className="bg-red-500 text-white">{totalUnread}</Badge>
                  )}
                </div>
                <Button
                  size="icon"
                  className="bg-teal-600 hover:bg-teal-700"
                  onClick={() => setShowNewConversation(true)}
                >
                  <Plus className="w-5 h-5" />
                </Button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search conversations..."
                  className="pl-10 dark:bg-slate-700"
                />
              </div>
            </div>

            {/* Conversation List */}
            {conversationsLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              </div>
            ) : (
              <ConversationList
                conversations={userConversations}
                selectedId={selectedConversation?.id}
                onSelect={setSelectedConversation}
                currentUserEmail={currentUser?.email}
                searchTerm={searchTerm}
              />
            )}
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-900">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className={`font-semibold ${
                      selectedConversation.type === 'group' 
                        ? 'bg-gradient-to-br from-purple-500 to-violet-600 text-white' 
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                    }`}>
                      {selectedConversation.type === 'group' 
                        ? <Users className="w-5 h-5" /> 
                        : getConversationName(selectedConversation).slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h2 className="font-semibold text-slate-800 dark:text-white">
                      {getConversationName(selectedConversation)}
                    </h2>
                    {selectedConversation.type === 'group' && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {selectedConversation.participants?.length} members
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowAIAssistant(!showAIAssistant)}
                    className={showAIAssistant ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-600' : ''}
                  >
                    <span className="text-lg">✨</span>
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-5 h-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <BellOff className="w-4 h-4 mr-2" />
                        Mute Notifications
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Archive className="w-4 h-4 mr-2" />
                        Archive
                      </DropdownMenuItem>
                      {selectedConversation.type === 'group' && (
                        <DropdownMenuItem>
                          <UserPlus className="w-4 h-4 mr-2" />
                          Add Members
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem className="text-red-600">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Messages */}
                {messagesLoading ? (
                  <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                  </div>
                ) : (
                  <MessageList
                    messages={messages}
                    currentUserEmail={currentUser?.email}
                    onReply={setReplyTo}
                  />
                )}

                {/* AI Assistant */}
                <AnimatePresence>
                  {showAIAssistant && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                    >
                      <AIMessageAssistant
                        messages={messages}
                        conversationName={getConversationName(selectedConversation)}
                        onInsertSummary={handleInsertSummary}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Input */}
                <MessageInput
                  onSend={(content, replyToId, fileUrl, fileName) => 
                    sendMessageMutation.mutate({ content, replyToId, fileUrl, fileName })
                  }
                  replyTo={replyTo}
                  onCancelReply={() => setReplyTo(null)}
                  isLoading={sendMessageMutation.isPending}
                  conversationContext={conversationContext}
                />
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-400 dark:text-slate-500">
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <Users className="w-10 h-10" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-600 dark:text-slate-400">Select a conversation</h3>
                  <p className="text-sm mt-1">Choose from your existing conversations or start a new one</p>
                  <Button
                    className="mt-4 bg-teal-600 hover:bg-teal-700"
                    onClick={() => setShowNewConversation(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Conversation
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      <NewConversationModal
        open={showNewConversation}
        onClose={() => setShowNewConversation(false)}
        users={users}
        agents={agents}
        onCreateDirect={createDirectConversation}
        onCreateGroup={createGroupConversation}
      />
    </div>
  );
}