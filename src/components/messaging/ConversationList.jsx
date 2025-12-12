import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Users, MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';

export default function ConversationList({ 
  conversations, 
  selectedId, 
  onSelect, 
  currentUserEmail,
  searchTerm 
}) {
  const filteredConversations = conversations.filter(conv => {
    if (!searchTerm) return true;
    const name = conv.type === 'group' 
      ? conv.name 
      : Object.values(conv.participant_names || {}).find(n => n !== currentUserEmail);
    return name?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getConversationName = (conv) => {
    if (conv.type === 'group') return conv.name || 'Group Chat';
    const otherEmail = conv.participants?.find(p => p !== currentUserEmail);
    return conv.participant_names?.[otherEmail] || otherEmail || 'Unknown';
  };

  const getInitials = (conv) => {
    const name = getConversationName(conv);
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getUnreadCount = (conv) => {
    return conv.unread_count?.[currentUserEmail] || 0;
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {filteredConversations.length === 0 ? (
        <div className="p-8 text-center text-slate-400 dark:text-slate-500">
          <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No conversations found</p>
        </div>
      ) : (
        filteredConversations.map((conv, idx) => {
          const unread = getUnreadCount(conv);
          const isSelected = conv.id === selectedId;
          
          return (
            <motion.div
              key={conv.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.03 }}
              onClick={() => onSelect(conv)}
              className={`flex items-center gap-3 p-3 cursor-pointer transition-all border-b border-slate-100 dark:border-slate-800 ${
                isSelected 
                  ? 'bg-teal-50 dark:bg-teal-900/20 border-l-4 border-l-teal-500' 
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 border-l-4 border-l-transparent'
              }`}
            >
              <div className="relative">
                <Avatar className={`w-12 h-12 ${conv.type === 'group' ? 'bg-purple-100 dark:bg-purple-900/50' : ''}`}>
                  <AvatarFallback className={`font-semibold ${
                    conv.type === 'group' 
                      ? 'bg-gradient-to-br from-purple-500 to-violet-600 text-white' 
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                  }`}>
                    {conv.type === 'group' ? <Users className="w-5 h-5" /> : getInitials(conv)}
                  </AvatarFallback>
                </Avatar>
                {unread > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className={`font-semibold truncate ${unread > 0 ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                    {getConversationName(conv)}
                  </h3>
                  {conv.last_message_date && (
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 whitespace-nowrap ml-2">
                      {formatDistanceToNow(new Date(conv.last_message_date), { addSuffix: false })}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {conv.type === 'group' && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-400">
                      {conv.participants?.length || 0} members
                    </Badge>
                  )}
                  <p className={`text-sm truncate ${unread > 0 ? 'text-slate-600 dark:text-slate-400 font-medium' : 'text-slate-500 dark:text-slate-500'}`}>
                    {conv.last_message || 'No messages yet'}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })
      )}
    </div>
  );
}