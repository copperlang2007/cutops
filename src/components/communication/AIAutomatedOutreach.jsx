import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Mail, Sparkles, Loader2, Send, Users, Clock, Trophy, 
  Bell, CheckCircle, AlertTriangle
} from 'lucide-react';
import { differenceInDays, format } from 'date-fns';
import { toast } from 'sonner';

const OUTREACH_TYPES = [
  { id: 'task_reminder', label: 'Task Reminders', icon: Clock, color: 'amber' },
  { id: 'milestone', label: 'Performance Milestones', icon: Trophy, color: 'emerald' },
  { id: 'deadline', label: 'Upcoming Deadlines', icon: AlertTriangle, color: 'red' },
  { id: 'update', label: 'Company Updates', icon: Bell, color: 'blue' }
];

export default function AIAutomatedOutreach({ agents, tasks, licenses, contracts, checklistItems }) {
  const [selectedAgents, setSelectedAgents] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState(['task_reminder']);
  const [generatedMessages, setGeneratedMessages] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const agentsNeedingOutreach = useMemo(() => {
    return agents.map(agent => {
      const agentTasks = tasks.filter(t => t.agent_id === agent.id && t.status !== 'completed');
      const overdueTasks = agentTasks.filter(t => t.due_date && differenceInDays(new Date(t.due_date), new Date()) < 0);
      const agentLicenses = licenses.filter(l => l.agent_id === agent.id);
      const expiringLicenses = agentLicenses.filter(l => {
        if (!l.expiration_date) return false;
        const days = differenceInDays(new Date(l.expiration_date), new Date());
        return days > 0 && days <= 30;
      });
      const agentChecklist = checklistItems.filter(c => c.agent_id === agent.id);
      const completionRate = agentChecklist.length > 0 
        ? Math.round((agentChecklist.filter(c => c.is_completed).length / agentChecklist.length) * 100)
        : 0;
      
      const reasons = [];
      if (overdueTasks.length > 0) reasons.push(`${overdueTasks.length} overdue tasks`);
      if (expiringLicenses.length > 0) reasons.push(`${expiringLicenses.length} expiring licenses`);
      if (completionRate === 100 && agent.onboarding_status !== 'ready_to_sell') reasons.push('Milestone: 100% onboarding');
      if (agentTasks.length > 3) reasons.push(`${agentTasks.length} pending tasks`);

      return {
        ...agent,
        overdueTasks: overdueTasks.length,
        expiringLicenses: expiringLicenses.length,
        pendingTasks: agentTasks.length,
        completionRate,
        reasons,
        needsOutreach: reasons.length > 0
      };
    }).filter(a => a.needsOutreach);
  }, [agents, tasks, licenses, checklistItems]);

  const toggleAgent = (agentId) => {
    setSelectedAgents(prev => 
      prev.includes(agentId) ? prev.filter(id => id !== agentId) : [...prev, agentId]
    );
  };

  const toggleType = (typeId) => {
    setSelectedTypes(prev =>
      prev.includes(typeId) ? prev.filter(id => id !== typeId) : [...prev, typeId]
    );
  };

  const generateMessages = async () => {
    if (selectedAgents.length === 0) {
      toast.error('Select at least one agent');
      return;
    }

    setIsGenerating(true);
    setGeneratedMessages([]);

    try {
      const messages = [];
      
      for (const agentId of selectedAgents) {
        const agent = agentsNeedingOutreach.find(a => a.id === agentId);
        if (!agent) continue;

        const agentTasks = tasks.filter(t => t.agent_id === agentId && t.status !== 'completed');
        const agentLicenses = licenses.filter(l => l.agent_id === agentId);

        const result = await base44.integrations.Core.InvokeLLM({
          prompt: `Generate a personalized outreach email for this agent:

AGENT: ${agent.first_name} ${agent.last_name}
EMAIL: ${agent.email}
STATUS: ${agent.onboarding_status}
ONBOARDING COMPLETION: ${agent.completionRate}%

CONTEXT:
- Overdue Tasks: ${agent.overdueTasks}
- Pending Tasks: ${agent.pendingTasks}
- Expiring Licenses: ${agent.expiringLicenses}
- Reasons for outreach: ${agent.reasons.join(', ')}

OUTREACH TYPES TO INCLUDE: ${selectedTypes.join(', ')}

Generate a warm, professional email that:
1. Acknowledges their progress
2. Addresses urgent items if any
3. Provides clear action items
4. Offers support

Keep it concise and actionable.`,
          response_json_schema: {
            type: "object",
            properties: {
              subject: { type: "string" },
              body: { type: "string" },
              priority: { type: "string" }
            }
          }
        });

        messages.push({
          agent,
          ...result
        });
      }

      setGeneratedMessages(messages);
    } catch (err) {
      console.error('Failed to generate messages:', err);
      toast.error('Failed to generate messages');
    } finally {
      setIsGenerating(false);
    }
  };

  const sendAllMessages = async () => {
    setIsSending(true);
    try {
      for (const msg of generatedMessages) {
        await base44.integrations.Core.SendEmail({
          to: msg.agent.email,
          subject: msg.subject,
          body: msg.body
        });
      }
      toast.success(`Sent ${generatedMessages.length} emails successfully`);
      setGeneratedMessages([]);
      setSelectedAgents([]);
    } catch (err) {
      toast.error('Failed to send some emails');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Mail className="w-5 h-5 text-teal-600" />
          AI Automated Outreach
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Outreach Types */}
        <div>
          <p className="text-sm font-medium text-slate-700 mb-2">Outreach Types</p>
          <div className="flex flex-wrap gap-2">
            {OUTREACH_TYPES.map(type => (
              <Button
                key={type.id}
                variant={selectedTypes.includes(type.id) ? "default" : "outline"}
                size="sm"
                onClick={() => toggleType(type.id)}
                className={selectedTypes.includes(type.id) ? "bg-teal-600" : ""}
              >
                <type.icon className="w-4 h-4 mr-1" />
                {type.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Agents Needing Outreach */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-slate-700">
              Agents Needing Outreach ({agentsNeedingOutreach.length})
            </p>
            {agentsNeedingOutreach.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedAgents(
                  selectedAgents.length === agentsNeedingOutreach.length 
                    ? [] 
                    : agentsNeedingOutreach.map(a => a.id)
                )}
              >
                {selectedAgents.length === agentsNeedingOutreach.length ? 'Deselect All' : 'Select All'}
              </Button>
            )}
          </div>
          
          <div className="max-h-48 overflow-y-auto space-y-2 border rounded-lg p-2">
            {agentsNeedingOutreach.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No agents need outreach</p>
            ) : (
              agentsNeedingOutreach.map(agent => (
                <div 
                  key={agent.id}
                  className={`p-2 rounded-lg border cursor-pointer transition-colors ${
                    selectedAgents.includes(agent.id) ? 'bg-teal-50 border-teal-200' : 'hover:bg-slate-50'
                  }`}
                  onClick={() => toggleAgent(agent.id)}
                >
                  <div className="flex items-center gap-2">
                    <Checkbox checked={selectedAgents.includes(agent.id)} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700">
                        {agent.first_name} {agent.last_name}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {agent.reasons.map((reason, i) => (
                          <Badge key={i} variant="outline" className="text-[10px]">{reason}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Generate Button */}
        <Button
          onClick={generateMessages}
          disabled={isGenerating || selectedAgents.length === 0}
          className="w-full bg-purple-600 hover:bg-purple-700"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating {selectedAgents.length} messages...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Messages ({selectedAgents.length})
            </>
          )}
        </Button>

        {/* Generated Messages Preview */}
        {generatedMessages.length > 0 && (
          <div className="space-y-3 pt-4 border-t">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-700">Generated Messages</p>
              <Button
                size="sm"
                onClick={sendAllMessages}
                disabled={isSending}
                className="bg-teal-600 hover:bg-teal-700"
              >
                {isSending ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-1" />
                )}
                Send All
              </Button>
            </div>
            
            {generatedMessages.map((msg, i) => (
              <div key={i} className="p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-slate-700">
                    To: {msg.agent.first_name} {msg.agent.last_name}
                  </p>
                  <Badge variant="outline" className={
                    msg.priority === 'high' ? 'bg-red-100 text-red-700' : 'bg-slate-100'
                  }>
                    {msg.priority}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 mb-1">Subject: {msg.subject}</p>
                <p className="text-xs text-slate-600 line-clamp-2">{msg.body}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}