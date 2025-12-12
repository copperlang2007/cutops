import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Sparkles, FileText, MessageSquare, Loader2, Copy, Check } from 'lucide-react'
import { base44 } from '@/api/base44Client'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

export default function AIMessageAssistant({ messages = [], conversationName, onInsertSummary }) {
  const [summary, setSummary] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(null);
  const [copied, setCopied] = useState(false);

  const generateSummary = async () => {
    if (messages.length < 3) {
      toast.error('Need at least 3 messages to summarize');
      return;
    }
    
    setIsLoading(true);
    setActiveTab('summary');
    
    try {
      const conversationText = messages
        .slice(-50)
        .map(m => `${m.sender_name}: ${m.content}`)
        .join('\n');

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Summarize this conversation concisely, highlighting key points, decisions made, and any action items:

Conversation: "${conversationName || 'Team Chat'}"

${conversationText}

Provide a clear, professional summary.`,
        response_json_schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            key_points: { type: "array", items: { type: "string" } },
            action_items: { type: "array", items: { type: "string" } }
          }
        }
      });
      
      setSummary(result);
    } catch (err) {
      toast.error('Failed to generate summary');
    } finally {
      setIsLoading(false);
    }
  };

  const generateReplySuggestions = async () => {
    if (messages.length < 1) {
      toast.error('No messages to analyze');
      return;
    }
    
    setIsLoading(true);
    setActiveTab('suggestions');
    
    try {
      const recentMessages = messages.slice(-10).map(m => `${m.sender_name}: ${m.content}`).join('\n');

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Based on this conversation, suggest 3 different professional reply options:

${recentMessages}

Provide varied suggestions - one brief/casual, one detailed/formal, and one with a question or call-to-action.`,
        response_json_schema: {
          type: "object",
          properties: {
            suggestions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  style: { type: "string" },
                  text: { type: "string" }
                }
              }
            }
          }
        }
      });
      
      setSuggestions(result.suggestions || []);
    } catch (err) {
      toast.error('Failed to generate suggestions');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Copied to clipboard');
  };

  return (
    <div className="border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
      <div className="flex items-center gap-2 p-2 border-b border-slate-200 dark:border-slate-700">
        <Sparkles className="w-4 h-4 text-purple-500" />
        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">AI Assistant</span>
        <div className="flex-1" />
        <Button
          variant="ghost"
          size="sm"
          onClick={generateSummary}
          disabled={isLoading}
          className="text-xs h-7"
        >
          <FileText className="w-3 h-3 mr-1" />
          Summarize
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={generateReplySuggestions}
          disabled={isLoading}
          className="text-xs h-7"
        >
          <MessageSquare className="w-3 h-3 mr-1" />
          Suggest Replies
        </Button>
      </div>

      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="p-4 flex items-center justify-center"
          >
            <Loader2 className="w-5 h-5 animate-spin text-purple-500 mr-2" />
            <span className="text-sm text-slate-500">AI is analyzing...</span>
          </motion.div>
        )}

        {!isLoading && activeTab === 'summary' && summary && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="p-4 space-y-3"
          >
            <Card className="border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20">
              <CardContent className="p-3">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-sm font-semibold text-purple-800 dark:text-purple-200">Summary</h4>
                  <div className="flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6"
                      onClick={() => copyToClipboard(summary.summary)}
                    >
                      {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 text-xs"
                      onClick={() => onInsertSummary?.(summary.summary)}
                    >
                      Share
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-purple-700 dark:text-purple-300">{summary.summary}</p>
                
                {summary.key_points?.length > 0 && (
                  <div className="mt-3">
                    <h5 className="text-xs font-semibold text-purple-800 dark:text-purple-200 mb-1">Key Points:</h5>
                    <ul className="text-xs text-purple-700 dark:text-purple-300 space-y-1">
                      {summary.key_points.map((point, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-purple-400">•</span>
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {summary.action_items?.length > 0 && (
                  <div className="mt-3">
                    <h5 className="text-xs font-semibold text-purple-800 dark:text-purple-200 mb-1">Action Items:</h5>
                    <ul className="text-xs text-purple-700 dark:text-purple-300 space-y-1">
                      {summary.action_items.map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-purple-400">☐</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {!isLoading && activeTab === 'suggestions' && suggestions.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="p-4 space-y-2"
          >
            {suggestions.map((suggestion, i) => (
              <Card key={i} className="border-slate-200 dark:border-slate-700 hover:border-teal-300 dark:hover:border-teal-700 transition-colors cursor-pointer group">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider">{suggestion.style}</span>
                      <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">{suggestion.text}</p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-7"
                      onClick={() => copyToClipboard(suggestion.text)}
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      Use
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}