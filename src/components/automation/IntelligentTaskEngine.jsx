import { useState } from 'react'
import { base44 } from '@/api/base44Client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Zap, Settings, Plus, Play, Pause, CheckCircle, AlertTriangle,
  Clock, Users, FileText, Shield, TrendingDown, Calendar
} from 'lucide-react';
import { differenceInDays, addDays } from 'date-fns'
import { toast } from 'sonner'

// Default automation rules
const DEFAULT_RULES = [
  {
    id: 'license_expiring',
    name: 'License Expiration Warning',
    trigger: 'license_expiring_30_days',
    description: 'Create task when license expires within 30 days',
    task_type: 'license_renewal',
    priority: 'high',
    assign_to: 'manager',
    enabled: true,
    icon: Shield
  },
  {
    id: 'churn_risk',
    name: 'High Churn Risk Follow-up',
    trigger: 'churn_risk_high',
    description: 'Create follow-up task for agents with high churn risk',
    task_type: 'follow_up',
    priority: 'urgent',
    assign_to: 'manager',
    enabled: true,
    icon: TrendingDown
  },
  {
    id: 'onboarding_stalled',
    name: 'Stalled Onboarding Check-in',
    trigger: 'onboarding_no_progress_7_days',
    description: 'Create task when agent has no onboarding progress for 7 days',
    task_type: 'onboarding',
    priority: 'medium',
    assign_to: 'agent',
    enabled: true,
    icon: Clock
  },
  {
    id: 'contract_expiring',
    name: 'Contract Renewal Reminder',
    trigger: 'contract_expiring_60_days',
    description: 'Create renewal task when contract expires within 60 days',
    task_type: 'contract_renewal',
    priority: 'medium',
    assign_to: 'manager',
    enabled: true,
    icon: FileText
  },
  {
    id: 'compliance_alert',
    name: 'Critical Compliance Issue',
    trigger: 'critical_alert_created',
    description: 'Create immediate review task for critical compliance alerts',
    task_type: 'compliance',
    priority: 'urgent',
    assign_to: 'manager',
    enabled: true,
    icon: AlertTriangle
  },
  {
    id: 'new_agent_welcome',
    name: 'New Agent Welcome Call',
    trigger: 'agent_created',
    description: 'Create welcome call task when new agent is added',
    task_type: 'follow_up',
    priority: 'medium',
    assign_to: 'manager',
    enabled: true,
    icon: Users
  }
];

export default function IntelligentTaskEngine({ 
  agents, 
  licenses, 
  contracts, 
  alerts,
  checklistItems,
  onTaskCreated 
}) {
  const queryClient = useQueryClient();
  const [rules, setRules] = useState(DEFAULT_RULES);
  const [showConfig, setShowConfig] = useState(false);
  const [generatedTasks, setGeneratedTasks] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const createTaskMutation = useMutation({
    mutationFn: (taskData) => base44.entities.Task.create(taskData),
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks']);
      onTaskCreated?.();
    }
  });

  const processAutomationRules = async () => {
    setIsProcessing(true);
    const newTasks = [];

    try {
      for (const rule of rules.filter(r => r.enabled)) {
        switch (rule.trigger) {
          case 'license_expiring_30_days':
            licenses.forEach(license => {
              if (license.expiration_date) {
                const daysUntil = differenceInDays(new Date(license.expiration_date), new Date());
                if (daysUntil > 0 && daysUntil <= 30) {
                  const agent = agents.find(a => a.id === license.agent_id);
                  newTasks.push({
                    title: `Renew ${license.state} license for ${agent?.first_name} ${agent?.last_name}`,
                    description: `License ${license.license_number} expires on ${license.expiration_date}. Initiate renewal process.`,
                    task_type: rule.task_type,
                    priority: rule.priority,
                    agent_id: license.agent_id,
                    due_date: addDays(new Date(), 14).toISOString().split('T')[0],
                    auto_generated: true,
                    related_entity_type: 'license',
                    related_entity_id: license.id
                  });
                }
              }
            });
            break;

          case 'contract_expiring_60_days':
            contracts.forEach(contract => {
              if (contract.expiration_date) {
                const daysUntil = differenceInDays(new Date(contract.expiration_date), new Date());
                if (daysUntil > 0 && daysUntil <= 60) {
                  const agent = agents.find(a => a.id === contract.agent_id);
                  newTasks.push({
                    title: `Renew ${contract.carrier_name} contract for ${agent?.first_name} ${agent?.last_name}`,
                    description: `Contract expires on ${contract.expiration_date}. Begin renewal negotiations.`,
                    task_type: rule.task_type,
                    priority: rule.priority,
                    agent_id: contract.agent_id,
                    due_date: addDays(new Date(), 30).toISOString().split('T')[0],
                    auto_generated: true,
                    related_entity_type: 'contract',
                    related_entity_id: contract.id
                  });
                }
              }
            });
            break;

          case 'onboarding_no_progress_7_days':
            agents.forEach(agent => {
              if (agent.onboarding_status === 'in_progress' || agent.onboarding_status === 'pending') {
                const agentChecklist = checklistItems.filter(c => c.agent_id === agent.id);
                const lastCompleted = agentChecklist
                  .filter(c => c.completed_date)
                  .sort((a, b) => new Date(b.completed_date) - new Date(a.completed_date))[0];
                
                const daysSinceProgress = lastCompleted 
                  ? differenceInDays(new Date(), new Date(lastCompleted.completed_date))
                  : differenceInDays(new Date(), new Date(agent.created_date));

                if (daysSinceProgress >= 7) {
                  newTasks.push({
                    title: `Check in with ${agent.first_name} ${agent.last_name} - Stalled onboarding`,
                    description: `No onboarding progress in ${daysSinceProgress} days. Reach out to identify blockers.`,
                    task_type: rule.task_type,
                    priority: rule.priority,
                    agent_id: agent.id,
                    due_date: addDays(new Date(), 2).toISOString().split('T')[0],
                    auto_generated: true,
                    related_entity_type: 'agent',
                    related_entity_id: agent.id
                  });
                }
              }
            });
            break;

          case 'critical_alert_created':
            alerts.filter(a => !a.is_resolved && a.severity === 'critical').forEach(alert => {
              const agent = agents.find(a => a.id === alert.agent_id);
              newTasks.push({
                title: `URGENT: Review critical alert for ${agent?.first_name} ${agent?.last_name}`,
                description: `Critical alert: ${alert.title}. ${alert.message}`,
                task_type: rule.task_type,
                priority: rule.priority,
                agent_id: alert.agent_id,
                due_date: new Date().toISOString().split('T')[0],
                auto_generated: true,
                related_entity_type: 'alert',
                related_entity_id: alert.id
              });
            });
            break;
        }
      }

      setGeneratedTasks(newTasks);
      
      if (newTasks.length > 0) {
        toast.success(`Found ${newTasks.length} tasks to create`);
      } else {
        toast.info('No new tasks needed based on current data');
      }
    } catch (err) {
      toast.error('Failed to process automation rules');
    } finally {
      setIsProcessing(false);
    }
  };

  const createAllTasks = async () => {
    for (const task of generatedTasks) {
      await createTaskMutation.mutateAsync(task);
    }
    setGeneratedTasks([]);
    toast.success(`Created ${generatedTasks.length} tasks`);
  };

  const toggleRule = (ruleId) => {
    setRules(prev => prev.map(r => 
      r.id === ruleId ? { ...r, enabled: !r.enabled } : r
    ));
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            Intelligent Task Automation
          </CardTitle>
          <div className="flex gap-2">
            <Dialog open={showConfig} onOpenChange={setShowConfig}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Settings className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Automation Rules</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {rules.map((rule) => (
                    <div key={rule.id} className="p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <rule.icon className="w-4 h-4 text-slate-600" />
                          <span className="text-sm font-medium">{rule.name}</span>
                        </div>
                        <Switch
                          checked={rule.enabled}
                          onCheckedChange={() => toggleRule(rule.id)}
                        />
                      </div>
                      <p className="text-xs text-slate-500">{rule.description}</p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline" className="text-[10px]">
                          Priority: {rule.priority}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">
                          Assign: {rule.assign_to}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
            <Button
              size="sm"
              onClick={processAutomationRules}
              disabled={isProcessing}
              className="bg-amber-500 hover:bg-amber-600"
            >
              {isProcessing ? (
                <Clock className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              <span className="ml-1">Run Rules</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Active Rules Summary */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {rules.filter(r => r.enabled).map(rule => (
            <Badge key={rule.id} variant="outline" className="text-xs">
              <rule.icon className="w-3 h-3 mr-1" />
              {rule.name}
            </Badge>
          ))}
        </div>

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
                  <p className="text-xs text-amber-700">{task.description}</p>
                  <p className="text-xs text-amber-600 mt-1">Due: {task.due_date}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-400 text-center py-4">
            Run automation rules to generate tasks based on current data
          </p>
        )}
      </CardContent>
    </Card>
  );
}