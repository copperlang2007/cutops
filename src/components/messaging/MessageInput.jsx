import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Paperclip, Sparkles, X, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function MessageInput({ 
  onSend, 
  replyTo, 
  onCancelReply, 
  isLoading,
  onAISuggest,
  conversationContext 
}) {
  const [message, setMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef(null);

  const handleSend = () => {
    if (!message.trim() || isLoading) return;
    onSend(message.trim(), replyTo?.id);
    setMessage('');
    onCancelReply?.();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      onSend(`[File: ${file.name}]`, null, file_url, file.name);
    } catch (err) {
      toast.error('Failed to upload file');
    }
  };

  const generateAISuggestion = async () => {
    if (!conversationContext) return;
    setIsGenerating(true);
    
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Based on this conversation context, suggest a helpful reply. Be professional and concise.

Conversation:
${conversationContext}

Generate a suggested reply that is helpful and appropriate for a workplace messaging system.`,
        response_json_schema: {
          type: "object",
          properties: {
            suggestion: { type: "string" }
          }
        }
      });
      
      setMessage(result.suggestion);
    } catch (err) {
      toast.error('Failed to generate suggestion');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="border-t border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-900">
      {replyTo && (
        <div className="flex items-center gap-2 mb-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
          <div className="flex-1 text-sm text-slate-600 dark:text-slate-400 truncate">
            <span className="font-medium">Replying to {replyTo.sender_name}:</span> {replyTo.content}
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onCancelReply}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}
      
      <div className="flex items-end gap-2">
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileSelect}
        />
        
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 text-slate-500 hover:text-slate-700 dark:text-slate-400"
          onClick={() => fileInputRef.current?.click()}
        >
          <Paperclip className="w-5 h-5" />
        </Button>
        
        <div className="flex-1 relative">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="resize-none min-h-[44px] max-h-32 pr-12 dark:bg-slate-800"
            rows={1}
          />
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-purple-500 hover:text-purple-700"
            onClick={generateAISuggestion}
            disabled={isGenerating}
          >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          </Button>
        </div>
        
        <Button
          onClick={handleSend}
          disabled={!message.trim() || isLoading}
          className="h-10 w-10 bg-teal-600 hover:bg-teal-700"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        </Button>
      </div>
    </div>
  );
}