import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Zap, Settings, Plus, Play, CheckCircle, AlertTriangle,
  Clock, Users, FileText, Shield, TrendingDown, Calendar,
  Brain, Loader2, Sparkles, Bell, Target
} from 'lucide-react';
import { differenceInDays, addDays, format } from 'date-fns';
import { toast } from 'sonner';

const AUTOMATION_RULES = [
  {
    id: 'license_expiring_30',
    category: 'compliance',
    name: 'License Expiring (30 days)',
    trigger: 'license_expiring',
    triggerDays: 30,
    description: 'Create task when license expires within 30 days',
    taskTitle: 'Renew {state} license for {agent_name}',
    task_type: 'license_renewal',
    priority: 'high',
    assign_to: 'manager',
    enabled: true,
    icon: Shield
  },
  {
    id: 'license_expiring_60',
    category: 'compliance',
    name: 'License Expiring (60 days)',
    trigger: 'license_expiring',
    triggerDays: 60,
    description: 'Create early warning task for license renewal',
    taskTitle: 'Plan {state} license renewal for {agent_name}',
    task_type: 'license_renewal',
    priority: 'medium',
    assign_to: 'agent',
    enabled: true,
    icon: Shield
  },
  {
    id: 'churn_risk_high',
    category: 'retention',
    name: 'High Churn Risk Agent',
    trigger: 'churn_prediction',
    riskThreshold: 70,
    description: 'Create retention follow-up for high-risk agents',
    taskTitle: 'URGENT: Retention intervention for {agent_name}',
    task_type: 'follow_up',
    priority: 'urgent',
    assign_to: 'manager',
    enabled: true,
    icon: TrendingDown
  },
  {
    id: 'onboarding_stalled_7',
    category: 'onboarding',
    name: 'Stalled Onboarding (7 days)',
    trigger: 'onboarding_stalled',
    stalledDays: 7,
    description: 'Create check-in task when no onboarding progress',
    taskTitle: 'Check in with {agent_name} - Stalled onboarding',
    task_type: 'onboarding',
    priority: 'medium',
    assign_to: 'manager',
    enabled: true,
    icon: Clock
  },
  {
    id: 'contract_expiring_60',
    category: 'compliance',
    name: 'Contract Expiring (60 days)',
    trigger: 'contract_expiring',
    triggerDays: 60,
    description: 'Create renewal task for expiring contracts',
    taskTitle: 'Renew {carrier_name} contract for {agent_name}',
    task_type: 'contract_renewal',
    priority: 'medium',
    assign_to: 'manager',
    enabled: true,
    icon: FileText
  },
  {
    id: 'critical_alert',
    category: 'compliance',
    name: 'Critical Compliance Alert',
    trigger: 'critical_alert',
    description: 'Create immediate review task for critical alerts',
    taskTitle: 'CRITICAL: Review compliance issue for {agent_name}',
    task_type: 'compliance',
    priority: 'urgent',
    assign_to: 'manager',
    enabled: true,
    icon: AlertTriangle
  },
  {
    id: 'new_agent_welcome',
    category: 'onboarding',
    name: 'New Agent Welcome',
    trigger: 'agent_created',
    description: 'Create welcome call task for new agents',
    taskTitle: 'Welcome call with {agent_name}',
    task_type: 'follow_up',
    priority: 'high',
    assign_to: 'manager',
    enabled: true,
    icon: Users
  },
  {
    id: 'low_performer_coaching',
    category: 'performance',
    name: 'Low Performer Coaching',
    trigger: 'performance_low',
    performanceThreshold: 30,
    description: 'Schedule coaching session for underperforming agents',
    taskTitle: 'Coaching session with {agent_name}',
    task_type: 'review',
    priority: 'medium',
    assign_to: 'manager',
    enabled: true,
    icon: Target
  },
  {
    id: 'commission_anomaly',
    category: 'financial',
    name: 'Commission Anomaly Detected',
    trigger: 'commission_anomaly',
    description: 'Review unusual commission patterns',
    taskTitle: 'Review commission anomaly for {agent_name}',
    task_type: 'review',
    priority: 'high',
    assign_to: 'manager',
    enabled: false,
    icon: AlertTriangle
  }
];

export default function AdvancedTaskAutomation({ 
  agents, 
  licenses, 
  contracts, 
  alerts,
  checklistItems,
  commissions,
  churnPredictions,
  onTaskCreated 
}) {
  const queryClient = useQueryClient();
  const [rules, setRules] = useState(AUTOMATION_RULES);
  const [showConfig, setShowConfig] = useState(false);
  const [generatedTasks, setGeneratedTasks] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [aiSuggestions, setAiSuggestions] = useState([]);

  const createTaskMutation = useMutation({
    mutationFn: (taskData) => base44.entities.Task.create(taskData),
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks']);
      onTaskCreated?.();
    }
  });

  // AI-powered task analysis
  const analyzeAndSuggestTasks = async () => {
    setIsAnalyzing(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this agency data and suggest specific tasks that should be created:

AGENTS (${agents.length} total):
${agents.slice(0, 10).map(a => {
  const agentLicenses = licenses.filter(l => l.agent_id === a.id);
  const agentContracts = contracts.filter(c => c.agent_id === a.id);
  const agentAlerts = alerts.filter(al => al.agent_id === a.id && !al.is_resolved);
  return `- ${a.first_name} ${a.last_name}: Status=${a.onboarding_status}, Licenses=${agentLicenses.length}, Contracts=${agentContracts.length}, Alerts=${agentAlerts.length}`;
}).join('\n')}

EXPIRING LICENSES (next 60 days):
${licenses.filter(l => {
  if (!l.expiration_date) return false;
  const days = differenceInDays(new Date(l.expiration_date), new Date());
  return days > 0 && days <= 60;
}).slice(0, 5).map(l => {
  const agent = agents.find(a => a.id === l.agent_id);
  return `- ${agent?.first_name} ${agent?.last_name}: ${l.state} expires in ${differenceInDays(new Date(l.expiration_date), new Date())} days`;
}).join('\n') || 'None'}

CRITICAL ALERTS:
${alerts.filter(a => !a.is_resolved && a.severity === 'critical').slice(0, 5).map(a => {
  const agent = agents.find(ag => ag.id === a.agent_id);
  return `- ${agent?.first_name} ${agent?.last_name}: ${a.title}`;
}).join('\n') || 'None'}

Suggest 5-10 specific, actionable tasks with:
1. Clear task title
2. Priority (urgent/high/medium/low)
3. Who to assign (manager/agent)
4. Due date recommendation
5. Why this task is important`,
        response_json_schema: {
          type: "object",
          properties: {
            suggested_tasks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  priority: { type: "string" },
                  assign_to: { type: "string" },
                  due_days: { type: "number" },
                  reason: { type: "string" },
                  agent_name: { type: "string" },
                  task_type: { type: "string" }
                }
              }
            },
            insights: { type: "array", items: { type: "string" } }
          }
        }
      });

      setAiSuggestions(result.suggested_tasks || []);
      toast.success(`AI suggested ${result.suggested_tasks?.length || 0} tasks`);
    } catch (err) {
      toast.error('Failed to analyze tasks');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const processAutomationRules = async () => {
    setIsProcessing(true);
    const newTasks = [];

    try {
      for (const rule of rules.filter(r => r.enabled)) {
        switch (rule.trigger) {
          case 'license_expiring':
            licenses.forEach(license => {
              if (license.expiration_date) {
                const daysUntil = differenceInDays(new Date(license.expiration_date), new Date());
                if (daysUntil > 0 && daysUntil <= rule.triggerDays && daysUntil > (rule.triggerDays - 15)) {
                  const agent = agents.find(a => a.id === license.agent_id);
                  if (agent) {
                    newTasks.push({
                      title: rule.taskTitle
                        .replace('{state}', license.state)
                        .replace('{agent_name}', `${agent.first_name} ${agent.last_name}`),
                      description: `License ${license.license_number} expires on ${license.expiration_date}. ${rule.description}`,
                      task_type: rule.task_type,
                      priority: rule.priority,
                      agent_id: license.agent_id,
                      due_date: addDays(new Date(), Math.min(14, daysUntil - 7)).toISOString().split('T')[0],
                      auto_generated: true,
                      related_entity_type: 'license',
                      related_entity_id: license.id,
                      rule_id: rule.id
                    });
                  }
                }
              }
            });
            break;

          case 'contract_expiring':
            contracts.forEach(contract => {
              if (contract.expiration_date) {
                const daysUntil = differenceInDays(new Date(contract.expiration_date), new Date());
                if (daysUntil > 0 && daysUntil <= rule.triggerDays) {
                  const agent = agents.find(a => a.id === contract.agent_id);
                  if (agent) {
                    newTasks.push({
                      title: rule.taskTitle
                        .replace('{carrier_name}', contract.carrier_name)
                        .replace('{agent_name}', `${agent.first_name} ${agent.last_name}`),
                      description: `Contract expires on ${contract.expiration_date}. Begin renewal process.`,
                      task_type: rule.task_type,
                      priority: rule.priority,
                      agent_id: contract.agent_id,
                      due_date: addDays(new Date(), 30).toISOString().split('T')[0],
                      auto_generated: true,
                      related_entity_type: 'contract',
                      related_entity_id: contract.id,
                      rule_id: rule.id
                    });
                  }
                }
              }
            });
            break;

          case 'onboarding_stalled':
            agents.forEach(agent => {
              if (['in_progress', 'pending'].includes(agent.onboarding_status)) {
                const agentChecklist = checklistItems.filter(c => c.agent_id === agent.id);
                const lastCompleted = agentChecklist
                  .filter(c => c.completed_date)
                  .sort((a, b) => new Date(b.completed_date) - new Date(a.completed_date))[0];
                
                const daysSinceProgress = lastCompleted 
                  ? differenceInDays(new Date(), new Date(lastCompleted.completed_date))
                  : differenceInDays(new Date(), new Date(agent.created_date));

                if (daysSinceProgress >= rule.stalledDays) {
                  newTasks.push({
                    title: rule.taskTitle.replace('{agent_name}', `${agent.first_name} ${agent.last_name}`),
                    description: `No onboarding progress in ${daysSinceProgress} days. Reach out to identify blockers.`,
                    task_type: rule.task_type,
                    priority: rule.priority,
                    agent_id: agent.id,
                    due_date: addDays(new Date(), 2).toISOString().split('T')[0],
                    auto_generated: true,
                    related_entity_type: 'agent',
                    related_entity_id: agent.id,
                    rule_id: rule.id
                  });
                }
              }
            });
            break;

          case 'critical_alert':
            alerts.filter(a => !a.is_resolved && a.severity === 'critical').forEach(alert => {
              const agent = agents.find(a => a.id === alert.agent_id);
              if (agent) {
                newTasks.push({
                  title: rule.taskTitle.replace('{agent_name}', `${agent.first_name} ${agent.last_name}`),
                  description: `Critical alert: ${alert.title}. ${alert.message}`,
                  task_type: rule.task_type,
                  priority: rule.priority,
                  agent_id: alert.agent_id,
                  due_date: new Date().toISOString().split('T')[0],
                  auto_generated: true,
                  related_entity_type: 'alert',
                  related_entity_id: alert.id,
                  rule_id: rule.id
                });
              }
            });
            break;

          case 'churn_prediction':
            if (churnPredictions?.length > 0) {
              churnPredictions.filter(p => p.risk_score >= rule.riskThreshold).forEach(prediction => {
                const agent = agents.find(a => `${a.first_name} ${a.last_name}` === prediction.name);
                if (agent) {
                  newTasks.push({
                    title: rule.taskTitle.replace('{agent_name}', prediction.name),
                    description: `Churn risk: ${prediction.risk_score}%. Risk factors: ${prediction.risk_factors?.join(', ')}. Recommended: ${prediction.intervention}`,
                    task_type: rule.task_type,
                    priority: rule.priority,
                    agent_id: agent.id,
                    due_date: addDays(new Date(), 3).toISOString().split('T')[0],
                    auto_generated: true,
                    related_entity_type: 'agent',
                    related_entity_id: agent.id,
                    rule_id: rule.id
                  });
                }
              });
            }
            break;
        }
      }

      // Deduplicate tasks
      const uniqueTasks = newTasks.filter((task, index, self) =>
        index === self.findIndex(t => t.title === task.title && t.agent_id === task.agent_id)
      );

      setGeneratedTasks(uniqueTasks);
      
      if (uniqueTasks.length > 0) {
        toast.success(`Found ${uniqueTasks.length} tasks to create`);
      } else {
        toast.info('No new tasks needed based on current rules');
      }
    } catch (err) {
      toast.error('Failed to process automation rules');
    } finally {
      setIsProcessing(false);
    }
  };

  const createAllTasks = async () => {
    let created = 0;
    for (const task of generatedTasks) {
      try {
        await createTaskMutation.mutateAsync(task);
        created++;
      } catch (err) {
        console.error('Failed to create task:', err);
      }
    }
    setGeneratedTasks([]);
    toast.success(`Created ${created} tasks`);
  };

  const createAISuggestedTask = async (suggestion) => {
    const agent = agents.find(a => 
      `${a.first_name} ${a.last_name}`.toLowerCase() === suggestion.agent_name?.toLowerCase()
    );
    
    await createTaskMutation.mutateAsync({
      title: suggestion.title,
      description: suggestion.description + `\n\nReason: ${suggestion.reason}`,
      task_type: suggestion.task_type || 'other',
      priority: suggestion.priority,
      agent_id: agent?.id,
      due_date: addDays(new Date(), suggestion.due_days || 7).toISOString().split('T')[0],
      auto_generated: true
    });

    setAiSuggestions(prev => prev.filter(s => s.title !== suggestion.title));
    toast.success('Task created');
  };

  const toggleRule = (ruleId) => {
    setRules(prev => prev.map(r => 
      r.id === ruleId ? { ...r, enabled: !r.enabled } : r
    ));
  };

  const updateRule = (ruleId, field, value) => {
    setRules(prev => prev.map(r => 
      r.id === ruleId ? { ...r, [field]: value } : r
    ));
  };

  const categoryColors = {
    compliance: 'bg-red-100 text-red-700',
    retention: 'bg-purple-100 text-purple-700',
    onboarding: 'bg-blue-100 text-blue-700',
    performance: 'bg-amber-100 text-amber-700',
    financial: 'bg-emerald-100 text-emerald-700'
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            AI Task Automation Engine
          </CardTitle>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={analyzeAndSuggestTasks}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
              <span className="ml-1">AI Suggest</span>
            </Button>
            <Dialog open={showConfig} onOpenChange={setShowConfig}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Settings className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Automation Rules Configuration</DialogTitle>
                </DialogHeader>
                <Tabs defaultValue="compliance">
                  <TabsList className="mb-4">
                    <TabsTrigger value="compliance">Compliance</TabsTrigger>
                    <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
                    <TabsTrigger value="retention">Retention</TabsTrigger>
                    <TabsTrigger value="performance">Performance</TabsTrigger>
                  </TabsList>
                  {['compliance', 'onboarding', 'retention', 'performance'].map(category => (
                    <TabsContent key={category} value={category} className="space-y-3">
                      {rules.filter(r => r.category === category).map(rule => (
                        <div key={rule.id} className="p-3 bg-slate-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <rule.icon className="w-4 h-4 text-slate-600" />
                              <span className="text-sm font-medium">{rule.name}</span>
                            </div>
                            <Switch
                              checked={rule.enabled}
                              onCheckedChange={() => toggleRule(rule.id)}
                            />
                          </div>
                          <p className="text-xs text-slate-500 mb-2">{rule.description}</p>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs">Priority</Label>
                              <Select 
                                value={rule.priority} 
                                onValueChange={(v) => updateRule(rule.id, 'priority', v)}
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="urgent">Urgent</SelectItem>
                                  <SelectItem value="high">High</SelectItem>
                                  <SelectItem value="medium">Medium</SelectItem>
                                  <SelectItem value="low">Low</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-xs">Assign To</Label>
                              <Select 
                                value={rule.assign_to} 
                                onValueChange={(v) => updateRule(rule.id, 'assign_to', v)}
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="manager">Manager</SelectItem>
                                  <SelectItem value="agent">Agent</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          {rule.triggerDays && (
                            <div className="mt-2">
                              <Label className="text-xs">Trigger Days Before</Label>
                              <Input
                                type="number"
                                value={rule.triggerDays}
                                onChange={(e) => updateRule(rule.id, 'triggerDays', Number(e.target.value))}
                                className="h-8 text-xs"
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </TabsContent>
                  ))}
                </Tabs>
              </DialogContent>
            </Dialog>
            <Button
              size="sm"
              onClick={processAutomationRules}
              disabled={isProcessing}
              className="bg-amber-500 hover:bg-amber-600"
            >
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              <span className="ml-1">Run Rules</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Active Rules Summary */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {rules.filter(r => r.enabled).map(rule => (
            <Badge key={rule.id} variant="outline" className={`text-xs ${categoryColors[rule.category]}`}>
              <rule.icon className="w-3 h-3 mr-1" />
              {rule.name}
            </Badge>
          ))}
        </div>

        {/* AI Suggestions */}
        {aiSuggestions.length > 0 && (
          <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <h4 className="text-sm font-medium text-purple-800 mb-2 flex items-center gap-1">
              <Sparkles className="w-4 h-4" />
              AI Suggested Tasks ({aiSuggestions.length})
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {aiSuggestions.map((suggestion, i) => (
                <div key={i} className="p-2 bg-white rounded border border-purple-100">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-purple-900">{suggestion.title}</span>
                    <Badge className={
                      suggestion.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                      suggestion.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                      'bg-blue-100 text-blue-700'
                    }>{suggestion.priority}</Badge>
                  </div>
                  <p className="text-xs text-purple-700 mb-1">{suggestion.reason}</p>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-6 text-xs"
                    onClick={() => createAISuggestedTask(suggestion)}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Create Task
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Generated Tasks */}
        {generatedTasks.length > 0 ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">
                {generatedTasks.length} Tasks Ready to Create
              </span>
              <Button size="sm" onClick={createAllTasks}>
                <CheckCircle className="w-4 h-4 mr-1" />
                Create All
              </Button>
            </div>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {generatedTasks.map((task, i) => (
                <div key={i} className="p-2 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-amber-800">{task.title}</span>
                    <Badge className={
                      task.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                      task.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                      'bg-blue-100 text-blue-700'
                    }>{task.priority}</Badge>
                  </div>
                  <p className="text-xs text-amber-700">{task.description?.substring(0, 100)}...</p>
                  <p className="text-xs text-amber-600 mt-1">Due: {task.due_date}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-400 text-center py-4">
            Run automation rules or use AI suggestions to generate tasks
          </p>
        )}
      </CardContent>
    </Card>
  );
}