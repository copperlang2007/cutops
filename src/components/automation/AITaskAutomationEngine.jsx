import { useState } from 'react'
import { base44 } from '@/api/base44Client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Zap, Plus, Settings, Play, Pause, Loader2, CheckCircle,
  AlertTriangle, Shield, FileText, Users, Clock, Brain,
  RefreshCw, Target, TrendingDown, Calendar
} from 'lucide-react';
import { differenceInDays, addDays } from 'date-fns'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

const TRIGGER_TYPES = [
  { value: 'license_expiring', label: 'License Expiring', icon: Shield, color: 'text-amber-600' },
  { value: 'contract_expiring', label: 'Contract Expiring', icon: FileText, color: 'text-blue-600' },
  { value: 'churn_risk_high', label: 'High Churn Risk', icon: TrendingDown, color: 'text-red-600' },
  { value: 'compliance_issue', label: 'Compliance Issue', icon: AlertTriangle, color: 'text-orange-600' },
  { value: 'nipr_verification_failed', label: 'NIPR Verification Failed', icon: Shield, color: 'text-red-600' },
  { value: 'onboarding_stalled', label: 'Onboarding Stalled', icon: Clock, color: 'text-purple-600' },
  { value: 'performance_decline', label: 'Performance Decline', icon: TrendingDown, color: 'text-amber-600' },
  { value: 'commission_dispute', label: 'Commission Dispute', icon: FileText, color: 'text-emerald-600' },
  { value: 'ce_credits_due', label: 'CE Credits Due', icon: Calendar, color: 'text-blue-600' },
  { value: 'appointment_pending', label: 'Appointment Pending', icon: Users, color: 'text-teal-600' }
];

const ASSIGNMENT_RULES = [
  { value: 'agent_manager', label: 'Agent\'s Manager' },
  { value: 'compliance_team', label: 'Compliance Team' },
  { value: 'specific_user', label: 'Specific User' },
  { value: 'agent_self', label: 'Agent (Self)' },
  { value: 'round_robin', label: 'Round Robin' }
];

export default function AITaskAutomationEngine({ 
  agents = [], 
  licenses = [], 
  contracts = [],
  alerts = [],
  checklistItems = [],
  commissions = [],
  onTaskCreated
}) {
  const queryClient = useQueryClient();
  const [showRuleDialog, setShowRuleDialog] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState(null);
  const [newRule, setNewRule] = useState({
    name: '',
    trigger_type: '',
    trigger_conditions: { days_before: 30 },
    task_template: { title_template: '', description_template: '', priority: 'medium', due_days_from_trigger: 7 },
    assignment_rule: 'agent_manager',
    assigned_user_email: '',
    is_active: true,
    notification_enabled: true,
    ai_enhanced: true
  });

  const { data: automationRules = [] } = useQuery({
    queryKey: ['taskAutomationRules'],
    queryFn: () => base44.entities.TaskAutomationRule.list()
  });

  const createRuleMutation = useMutation({
    mutationFn: (data) => base44.entities.TaskAutomationRule.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['taskAutomationRules']);
      setShowRuleDialog(false);
      resetForm();
      toast.success('Automation rule created');
    }
  });

  const updateRuleMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.TaskAutomationRule.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['taskAutomationRules']);
      toast.success('Rule updated');
    }
  });

  const deleteRuleMutation = useMutation({
    mutationFn: (id) => base44.entities.TaskAutomationRule.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['taskAutomationRules']);
      toast.success('Rule deleted');
    }
  });

  const resetForm = () => {
    setNewRule({
      name: '',
      trigger_type: '',
      trigger_conditions: { days_before: 30 },
      task_template: { title_template: '', description_template: '', priority: 'medium', due_days_from_trigger: 7 },
      assignment_rule: 'agent_manager',
      assigned_user_email: '',
      is_active: true,
      notification_enabled: true,
      ai_enhanced: true
    });
    setEditingRule(null);
  };

  // Scan for events that match automation rules
  const scanForTriggers = async () => {
    setIsScanning(true);
    const results = { triggered: [], created: 0 };
    const now = new Date();

    try {
      for (const rule of automationRules.filter(r => r.is_active)) {
        const matchedAgents = [];
        const daysBefore = rule.trigger_conditions?.days_before || 30;

        switch (rule.trigger_type) {
          case 'license_expiring':
            for (const license of licenses) {
              if (!license.expiration_date) continue;
              const daysUntil = differenceInDays(new Date(license.expiration_date), now);
              if (daysUntil > 0 && daysUntil <= daysBefore) {
                const agent = agents.find(a => a.id === license.agent_id);
                if (agent) matchedAgents.push({ agent, item: license, daysUntil, itemType: 'license' });
              }
            }
            break;

          case 'contract_expiring':
            for (const contract of contracts) {
              if (!contract.expiration_date) continue;
              const daysUntil = differenceInDays(new Date(contract.expiration_date), now);
              if (daysUntil > 0 && daysUntil <= daysBefore) {
                const agent = agents.find(a => a.id === contract.agent_id);
                if (agent) matchedAgents.push({ agent, item: contract, daysUntil, itemType: 'contract' });
              }
            }
            break;

          case 'onboarding_stalled':
            for (const agent of agents) {
              if (agent.onboarding_status === 'in_progress') {
                const agentChecklist = checklistItems.filter(c => c.agent_id === agent.id);
                const completedPercent = agentChecklist.length > 0 
                  ? (agentChecklist.filter(c => c.is_completed).length / agentChecklist.length) * 100 
                  : 0;
                const daysSinceCreation = differenceInDays(now, new Date(agent.created_date));
                if (daysSinceCreation > daysBefore && completedPercent < 75) {
                  matchedAgents.push({ agent, item: { completedPercent, daysSinceCreation }, itemType: 'onboarding' });
                }
              }
            }
            break;

          case 'compliance_issue':
            for (const alert of alerts.filter(a => !a.is_resolved && a.severity === 'critical')) {
              const agent = agents.find(a => a.id === alert.agent_id);
              if (agent) matchedAgents.push({ agent, item: alert, itemType: 'alert' });
            }
            break;
        }

        if (matchedAgents.length > 0) {
          results.triggered.push({ rule, matchedAgents });
        }
      }

      // Generate AI-enhanced tasks if enabled
      for (const trigger of results.triggered) {
        for (const match of trigger.matchedAgents) {
          let taskTitle = trigger.rule.task_template?.title_template || `${trigger.rule.trigger_type} - ${match.agent.first_name} ${match.agent.last_name}`;
          let taskDescription = trigger.rule.task_template?.description_template || '';

          if (trigger.rule.ai_enhanced) {
            try {
              const aiResult = await base44.integrations.Core.InvokeLLM({
                prompt: `Generate a specific, actionable task for this automation trigger:
                
Trigger Type: ${trigger.rule.trigger_type}
Agent: ${match.agent.first_name} ${match.agent.last_name}
Details: ${JSON.stringify(match.item)}

Create a clear, specific task title and detailed description that includes:
1. Exactly what needs to be done
2. Why it's important
3. Any deadlines or urgency factors
4. Specific steps to complete the task`,
                response_json_schema: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    description: { type: "string" },
                    priority: { type: "string" }
                  }
                }
              });
              taskTitle = aiResult.title;
              taskDescription = aiResult.description;
            } catch (e) {
              // Fallback to template
            }
          }

          const taskData = {
            title: taskTitle.replace('{agent_name}', `${match.agent.first_name} ${match.agent.last_name}`),
            description: taskDescription,
            task_type: trigger.rule.trigger_type.includes('license') ? 'license_renewal' : 
                       trigger.rule.trigger_type.includes('contract') ? 'contract_renewal' : 
                       trigger.rule.trigger_type.includes('compliance') ? 'compliance' : 'follow_up',
            priority: trigger.rule.task_template?.priority || 'medium',
            agent_id: match.agent.id,
            due_date: addDays(now, trigger.rule.task_template?.due_days_from_trigger || 7).toISOString().split('T')[0],
            auto_generated: true,
            status: 'pending'
          };

          await base44.entities.Task.create(taskData);
          results.created++;
        }
      }

      setScanResults(results);
      if (results.created > 0) {
        toast.success(`Created ${results.created} automated tasks`);
        onTaskCreated?.();
      } else {
        toast.info('No new automation triggers found');
      }
    } catch (err) {
      toast.error('Failed to scan for triggers');
    } finally {
      setIsScanning(false);
    }
  };

  const handleSaveRule = () => {
    if (!newRule.name || !newRule.trigger_type) {
      toast.error('Please fill in required fields');
      return;
    }
    if (editingRule) {
      updateRuleMutation.mutate({ id: editingRule.id, data: newRule });
    } else {
      createRuleMutation.mutate(newRule);
    }
  };

  const getTriggerIcon = (triggerType) => {
    const trigger = TRIGGER_TYPES.find(t => t.value === triggerType);
    return trigger?.icon || Zap;
  };

  const getTriggerColor = (triggerType) => {
    const trigger = TRIGGER_TYPES.find(t => t.value === triggerType);
    return trigger?.color || 'text-slate-600';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-0 shadow-premium overflow-hidden">
        {/* Premium Header */}
        <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center"
              >
                <Brain className="w-6 h-6 text-white" />
              </motion.div>
              <div>
                <h2 className="text-xl font-bold text-white">AI Task Automation Engine</h2>
                <p className="text-purple-100 text-sm">Intelligent event-driven task generation</p>
              </div>
            </div>
            <div className="flex gap-2">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  size="sm"
                  onClick={scanForTriggers}
                  disabled={isScanning}
                  className="bg-white/20 hover:bg-white/30 text-white border border-white/30"
                >
                  {isScanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  <span className="ml-2">Scan Triggers</span>
                </Button>
              </motion.div>
              <Dialog open={showRuleDialog} onOpenChange={setShowRuleDialog}>
                <DialogTrigger asChild>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      size="sm"
                      className="bg-white text-purple-600 hover:bg-purple-50 shadow-lg"
                      onClick={() => resetForm()}
                    >
                      <Plus className="w-4 h-4" />
                      <span className="ml-2 font-semibold">New Rule</span>
                    </Button>
                  </motion.div>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>{editingRule ? &apos;Edit&apos; : &apos;Create&apos;} Automation Rule</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div>
                      <Label>Rule Name</Label>
                      <Input
                        value={newRule.name}
                        onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                        placeholder="e.g., License Expiration Alert"
                      />
                    </div>
                    <div>
                      <Label>Trigger Event</Label>
                      <Select value={newRule.trigger_type} onValueChange={(v) => setNewRule({ ...newRule, trigger_type: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select trigger..." />
                        </SelectTrigger>
                        <SelectContent>
                          {TRIGGER_TYPES.map(t => (
                            <SelectItem key={t.value} value={t.value}>
                              <div className="flex items-center gap-2">
                                <t.icon className={`w-4 h-4 ${t.color}`} />
                                {t.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Days Before Trigger</Label>
                        <Input
                          type="number"
                          value={newRule.trigger_conditions?.days_before || 30}
                          onChange={(e) => setNewRule({ 
                            ...newRule, 
                            trigger_conditions: { ...newRule.trigger_conditions, days_before: parseInt(e.target.value) } 
                          })}
                        />
                      </div>
                      <div>
                        <Label>Due Days After</Label>
                        <Input
                          type="number"
                          value={newRule.task_template?.due_days_from_trigger || 7}
                          onChange={(e) => setNewRule({ 
                            ...newRule, 
                            task_template: { ...newRule.task_template, due_days_from_trigger: parseInt(e.target.value) } 
                          })}
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Task Priority</Label>
                      <Select 
                        value={newRule.task_template?.priority || 'medium'} 
                        onValueChange={(v) => setNewRule({ 
                          ...newRule, 
                          task_template: { ...newRule.task_template, priority: v } 
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Assignment Rule</Label>
                      <Select value={newRule.assignment_rule} onValueChange={(v) => setNewRule({ ...newRule, assignment_rule: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ASSIGNMENT_RULES.map(r => (
                            <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Brain className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-medium text-purple-700">AI-Enhanced Tasks</span>
                      </div>
                      <Switch
                        checked={newRule.ai_enhanced}
                        onCheckedChange={(v) => setNewRule({ ...newRule, ai_enhanced: v })}
                      />
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Button variant="outline" onClick={() => setShowRuleDialog(false)} className="flex-1">
                        Cancel
                      </Button>
                      <Button onClick={handleSaveRule} className="flex-1 bg-purple-600 hover:bg-purple-700">
                        {editingRule ? 'Update' : 'Create'} Rule
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        <CardContent className="p-6">
          <Tabs defaultValue="rules">
            <TabsList className="mb-4 bg-slate-100/80 p-1 rounded-xl">
              <TabsTrigger value="rules" className="rounded-lg">
                Active Rules
                <Badge className="ml-2 bg-purple-100 text-purple-700">{automationRules.filter(r => r.is_active).length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="results" className="rounded-lg">
                Scan Results
              </TabsTrigger>
            </TabsList>

            <TabsContent value="rules">
              {automationRules.length === 0 ? (
                <div className="text-center py-12">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4"
                  >
                    <Zap className="w-8 h-8 text-purple-400" />
                  </motion.div>
                  <p className="text-slate-500 font-medium">No automation rules configured</p>
                  <p className="text-sm text-slate-400 mt-1">Create your first rule to automate task creation</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {automationRules.map((rule, idx) => {
                    const TriggerIcon = getTriggerIcon(rule.trigger_type);
                    return (
                      <motion.div
                        key={rule.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className={`p-4 rounded-xl border transition-all ${
                          rule.is_active 
                            ? 'bg-gradient-to-r from-white to-purple-50/30 border-purple-200/50 hover:border-purple-300' 
                            : 'bg-slate-50 border-slate-200 opacity-60'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              rule.is_active ? 'bg-purple-100' : 'bg-slate-200'
                            }`}>
                              <TriggerIcon className={`w-5 h-5 ${rule.is_active ? getTriggerColor(rule.trigger_type) : 'text-slate-400'}`} />
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800">{rule.name}</p>
                              <p className="text-xs text-slate-500">
                                Triggers {rule.trigger_conditions?.days_before || 30} days before • 
                                Assigns to {ASSIGNMENT_RULES.find(r => r.value === rule.assignment_rule)?.label}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {rule.ai_enhanced && (
                              <Badge className="bg-purple-100 text-purple-700">
                                <Brain className="w-3 h-3 mr-1" />
                                AI
                              </Badge>
                            )}
                            <Switch
                              checked={rule.is_active}
                              onCheckedChange={(v) => updateRuleMutation.mutate({ id: rule.id, data: { is_active: v } })}
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingRule(rule);
                                setNewRule(rule);
                                setShowRuleDialog(true);
                              }}
                            >
                              <Settings className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="results">
              {!scanResults ? (
                <div className="text-center py-12">
                  <RefreshCw className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">Click "Scan Triggers" to check for automation events</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-6 h-6 text-emerald-600" />
                      <div>
                        <p className="font-semibold text-emerald-800">Scan Complete</p>
                        <p className="text-sm text-emerald-600">{scanResults.created} tasks created from {scanResults.triggered.length} triggered rules</p>
                      </div>
                    </div>
                  </div>
                  {scanResults.triggered.map((trigger, i) => (
                    <div key={i} className="p-3 bg-slate-50 rounded-lg">
                      <p className="font-medium text-slate-700">{trigger.rule.name}</p>
                      <p className="text-sm text-slate-500">{trigger.matchedAgents.length} agents matched</p>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
}