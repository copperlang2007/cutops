import React, { useEffect, useRef } from 'react';
import { format, isToday, isYesterday } from 'date-fns';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Bot, FileText, Reply } from 'lucide-react';
import { motion } from 'framer-motion';

function formatMessageDate(date) {
  const d = new Date(date);
  if (isToday(d)) return format(d, 'h:mm a');
  if (isYesterday(d)) return 'Yesterday ' + format(d, 'h:mm a');
  return format(d, 'MMM d, h:mm a');
}

function MessageBubble({ message, isOwn, showAvatar, onReply }) {
  const initials = message.sender_name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : ''} group`}
    >
      {showAvatar ? (
        <Avatar className="w-8 h-8 mt-1">
          <AvatarFallback className={`text-xs font-semibold ${isOwn ? 'bg-teal-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'}`}>
            {message.ai_generated ? <Bot className="w-4 h-4" /> : initials}
          </AvatarFallback>
        </Avatar>
      ) : (
        <div className="w-8" />
      )}
      
      <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
        {showAvatar && !isOwn && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 px-1">
            {message.sender_name}
            {message.ai_generated && <Badge className="ml-2 text-[10px] bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-400">AI</Badge>}
          </p>
        )}
        
        <div className={`relative rounded-2xl px-4 py-2.5 ${
          message.message_type === 'system' 
            ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-center text-sm italic'
            : message.message_type === 'ai_summary'
              ? 'bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/30 dark:to-violet-900/30 border border-purple-200 dark:border-purple-800'
              : isOwn 
                ? 'bg-teal-600 text-white' 
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
        }`}>
          {message.reply_to_id && (
            <div className={`text-xs mb-2 pb-2 border-b ${isOwn ? 'border-teal-500 text-teal-200' : 'border-slate-200 dark:border-slate-600 text-slate-500'}`}>
              <Reply className="w-3 h-3 inline mr-1" />
              Replying to a message
            </div>
          )}
          
          {message.message_type === 'file' ? (
            <a href={message.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:underline">
              <FileText className="w-4 h-4" />
              {message.file_name || 'Attachment'}
            </a>
          ) : (
            <p className={`text-sm whitespace-pre-wrap ${message.message_type === 'ai_summary' ? 'text-purple-800 dark:text-purple-200' : ''}`}>
              {message.content}
            </p>
          )}
          
          <button
            onClick={() => onReply?.(message)}
            className={`absolute -right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity ${
              isOwn ? 'bg-teal-700 text-white' : 'bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300'
            }`}
          >
            <Reply className="w-3 h-3" />
          </button>
        </div>
        
        <p className={`text-[10px] text-slate-400 dark:text-slate-500 mt-1 px-1 ${isOwn ? 'text-right' : ''}`}>
          {formatMessageDate(message.created_date)}
        </p>
      </div>
    </motion.div>
  );
}

export default function MessageList({ messages, currentUserEmail, onReply }) {
  const bottomRef = useRef(null);
  
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  let lastSender = null;
  let lastDate = null;

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      {messages.map((message, idx) => {
        const isOwn = message.sender_email === currentUserEmail;
        const showAvatar = message.sender_email !== lastSender;
        const messageDate = new Date(message.created_date).toDateString();
        const showDateDivider = messageDate !== lastDate;
        
        lastSender = message.sender_email;
        lastDate = messageDate;

        return (
          <React.Fragment key={message.id}>
            {showDateDivider && (
              <div className="flex items-center gap-4 py-4">
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                  {isToday(new Date(message.created_date)) ? 'Today' : 
                   isYesterday(new Date(message.created_date)) ? 'Yesterday' : 
                   format(new Date(message.created_date), 'MMMM d, yyyy')}
                </span>
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
              </div>
            )}
            <MessageBubble 
              message={message} 
              isOwn={isOwn} 
              showAvatar={showAvatar}
              onReply={onReply}
            />
          </React.Fragment>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}