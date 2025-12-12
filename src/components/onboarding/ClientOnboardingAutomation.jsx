import { useState, useEffect } from 'react'
import { base44 } from '@/api/base44Client'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Zap, Mail, Clock, Calendar, Users, TrendingUp,
  Settings, CheckCircle, AlertTriangle, Loader2, RefreshCw,
  Send, Bell, Target, Sparkles
} from 'lucide-react';
import { differenceInDays } from 'date-fns'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

const MILESTONE_EMAILS = {
  day_7: {
    name: '7-Day Check-in',
    description: 'Check how the client is settling in with their new plan',
    trigger: 7
  },
  day_30: {
    name: '30-Day Review',
    description: 'First month review and satisfaction check',
    trigger: 30
  },
  day_60: {
    name: '60-Day Follow-up',
    description: 'Ask for referrals and feedback',
    trigger: 60
  },
  day_90: {
    name: 'Quarterly Check-in',
    description: 'Quarterly review and plan optimization',
    trigger: 90
  },
  renewal_reminder_60: {
    name: 'Renewal Reminder (60 days)',
    description: 'Remind about upcoming renewal',
    trigger: -60,
    triggerField: 'renewal_date'
  },
  renewal_reminder_30: {
    name: 'Renewal Reminder (30 days)',
    description: 'Final renewal reminder',
    trigger: -30,
    triggerField: 'renewal_date'
  }
};

export default function ClientOnboardingAutomation({ 
  clients = [],
  onboardingTasks = [],
  agent 
}) {
  const [automationSettings, setAutomationSettings] = useState({
    autoWelcomeEmail: true,
    autoFollowUps: true,
    autoRenewalReminders: true,
    autoSatisfactionSurveys: true
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingAutomations, setPendingAutomations] = useState([]);

  useEffect(() => {
    checkPendingAutomations();
  }, [clients, onboardingTasks]);

  const checkPendingAutomations = () => {
    const today = new Date();
    const pending = [];

    clients.forEach(client => {
      // Check for clients needing welcome email
      if (!client.welcome_email_sent && client.email && client.status === 'active') {
        pending.push({
          type: 'welcome_email',
          client,
          priority: 'high',
          message: `${client.first_name} ${client.last_name} needs welcome email`
        });
      }

      // Check milestone emails based on onboarding start date
      if (client.onboarding_started_date) {
        const daysSinceStart = differenceInDays(today, new Date(client.onboarding_started_date));
        
        Object.entries(MILESTONE_EMAILS).forEach(([key, milestone]) => {
          if (milestone.triggerField) return; // Skip renewal-based ones here
          
          if (daysSinceStart >= milestone.trigger && daysSinceStart < milestone.trigger + 3) {
            // Check if this milestone email was already sent (would be tracked in milestones)
            const milestones = client.onboarding_milestones || {};
            if (!milestones[key]) {
              pending.push({
                type: key,
                client,
                priority: 'medium',
                message: `${milestone.name} for ${client.first_name} ${client.last_name}`
              });
            }
          }
        });
      }

      // Check renewal reminders
      if (client.renewal_date) {
        const daysToRenewal = differenceInDays(new Date(client.renewal_date), today);
        
        if (daysToRenewal <= 60 && daysToRenewal > 55) {
          const milestones = client.onboarding_milestones || {};
          if (!milestones.renewal_reminder_60) {
            pending.push({
              type: 'renewal_reminder_60',
              client,
              priority: 'high',
              message: `Renewal reminder (60 days) for ${client.first_name} ${client.last_name}`
            });
          }
        }
        
        if (daysToRenewal <= 30 && daysToRenewal > 25) {
          const milestones = client.onboarding_milestones || {};
          if (!milestones.renewal_reminder_30) {
            pending.push({
              type: 'renewal_reminder_30',
              client,
              priority: 'high',
              message: `Renewal reminder (30 days) for ${client.first_name} ${client.last_name}`
            });
          }
        }
      }
    });

    // Check overdue onboarding tasks
    onboardingTasks.forEach(task => {
      if (task.status === 'pending') {
        const dueDate = new Date(task.due_date);
        if (dueDate < today) {
          const client = clients.find(c => c.id === task.client_id);
          if (client) {
            pending.push({
              type: 'overdue_task',
              client,
              task,
              priority: 'high',
              message: `Overdue: ${task.title} for ${client.first_name} ${client.last_name}`
            });
          }
        }
      }
    });

    setPendingAutomations(pending);
  };

  const generateMilestoneEmail = async (client, milestoneType) => {
    const milestone = MILESTONE_EMAILS[milestoneType];
    
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate a professional follow-up email for a Medicare client.

EMAIL TYPE: ${milestone.name}
PURPOSE: ${milestone.description}

CLIENT DETAILS:
- Name: ${client.first_name} ${client.last_name}
- Plan Type: ${client.plan_type?.replace(/_/g, ' ') || 'Medicare'}
- Carrier: ${client.carrier || 'their carrier'}
- Days since enrollment: ${differenceInDays(new Date(), new Date(client.onboarding_started_date || client.effective_date))}

AGENT: ${agent?.first_name} ${agent?.last_name}

Create a warm, personalized email that:
1. Shows genuine care for their wellbeing
2. Asks relevant questions based on the milestone
3. Offers assistance if needed
4. Keeps it concise and professional

For referral requests, make it natural and non-pushy.
For renewal reminders, emphasize the importance of reviewing their options.`,
      response_json_schema: {
        type: "object",
        properties: {
          subject: { type: "string" },
          body: { type: "string" }
        }
      }
    });

    return result;
  };

  const processAutomation = async (automation) => {
    if (!automation.client.email) {
      toast.error('Client has no email address');
      return;
    }

    setIsProcessing(true);
    try {
      let emailContent;
      
      if (automation.type === 'welcome_email') {
        // Use the welcome email generator
        emailContent = await base44.integrations.Core.InvokeLLM({
          prompt: `Generate a warm welcome email for new Medicare client ${automation.client.first_name} ${automation.client.last_name} enrolled in ${automation.client.plan_type || 'Medicare'} with ${automation.client.carrier || 'their carrier'}. Agent: ${agent?.first_name} ${agent?.last_name}. Keep it warm, professional, and under 150 words.`,
          response_json_schema: {
            type: "object",
            properties: {
              subject: { type: "string" },
              body: { type: "string" }
            }
          }
        });
      } else if (MILESTONE_EMAILS[automation.type]) {
        emailContent = await generateMilestoneEmail(automation.client, automation.type);
      }

      if (emailContent) {
        await base44.integrations.Core.SendEmail({
          to: automation.client.email,
          subject: emailContent.subject,
          body: emailContent.body
        });

        // Update client milestones
        const currentMilestones = automation.client.onboarding_milestones || {};
        await base44.entities.Client.update(automation.client.id, {
          onboarding_milestones: {
            ...currentMilestones,
            [automation.type]: {
              sent_date: new Date().toISOString(),
              email_subject: emailContent.subject
            }
          },
          ...(automation.type === 'welcome_email' ? { welcome_email_sent: true } : {})
        });

        toast.success(`Email sent to ${automation.client.first_name}`);
        checkPendingAutomations();
      }
    } catch (err) {
      console.error('Automation failed:', err);
      toast.error('Failed to process automation');
    } finally {
      setIsProcessing(false);
    }
  };

  const processAllPending = async () => {
    setIsProcessing(true);
    let successCount = 0;
    
    for (const automation of pendingAutomations.filter(a => a.type !== 'overdue_task')) {
      try {
        await processAutomation(automation);
        successCount++;
      } catch (err) {
        console.error('Failed automation:', err);
      }
    }
    
    setIsProcessing(false);
    toast.success(`Processed ${successCount} automations`);
  };

  const stats = {
    pendingWelcome: pendingAutomations.filter(a => a.type === 'welcome_email').length,
    pendingFollowups: pendingAutomations.filter(a => a.type.startsWith('day_')).length,
    pendingRenewals: pendingAutomations.filter(a => a.type.startsWith('renewal_')).length,
    overdueTasks: pendingAutomations.filter(a => a.type === 'overdue_task').length
  };

  return (
    <Card className="border-0 shadow-sm dark:bg-slate-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2 text-slate-800 dark:text-white">
            <Zap className="w-5 h-5 text-amber-500" />
            Onboarding Automation
            <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
              <Sparkles className="w-3 h-3 mr-1" />
              Smart
            </Badge>
          </CardTitle>
          {pendingAutomations.length > 0 && (
            <Button
              size="sm"
              onClick={processAllPending}
              disabled={isProcessing}
              className="bg-amber-500 hover:bg-amber-600"
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Send className="w-3 h-3 mr-1" />
                  Process All ({pendingAutomations.filter(a => a.type !== 'overdue_task').length})
                </>
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {[
            { label: 'Welcome', value: stats.pendingWelcome, icon: Mail, color: 'teal' },
            { label: 'Follow-ups', value: stats.pendingFollowups, icon: Clock, color: 'blue' },
            { label: 'Renewals', value: stats.pendingRenewals, icon: Calendar, color: 'amber' },
            { label: 'Overdue', value: stats.overdueTasks, icon: AlertTriangle, color: 'red' }
          ].map((stat, i) => (
            <div key={i} className={`p-2 rounded-lg bg-${stat.color}-50 dark:bg-${stat.color}-900/20 text-center`}>
              <stat.icon className={`w-4 h-4 mx-auto text-${stat.color}-600 dark:text-${stat.color}-400 mb-1`} />
              <p className="text-lg font-bold text-slate-800 dark:text-white">{stat.value}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">{stat.label}</p>
            </div>
          ))}
        </div>

        <Tabs defaultValue="pending" className="space-y-3">
          <TabsList className="grid grid-cols-2 h-8">
            <TabsTrigger value="pending" className="text-xs">Pending Actions</TabsTrigger>
            <TabsTrigger value="settings" className="text-xs">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-2 max-h-[250px] overflow-y-auto">
            {pendingAutomations.length === 0 ? (
              <div className="text-center py-6 text-slate-400 dark:text-slate-500">
                <CheckCircle className="w-10 h-10 mx-auto mb-2 text-emerald-400" />
                <p className="text-sm">All automations up to date!</p>
              </div>
            ) : (
              pendingAutomations.map((automation, idx) => (
                <motion.div
                  key={`${automation.type}-${automation.client.id}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`p-2 rounded-lg border flex items-center justify-between ${
                    automation.priority === 'high' 
                      ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                      : 'bg-slate-50 border-slate-200 dark:bg-slate-900/50 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {automation.type === 'overdue_task' ? (
                      <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                    ) : (
                      <Mail className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
                    )}
                    <span className="text-xs text-slate-700 dark:text-slate-300 truncate">
                      {automation.message}
                    </span>
                  </div>
                  {automation.type !== 'overdue_task' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => processAutomation(automation)}
                      disabled={isProcessing}
                      className="h-6 text-xs shrink-0"
                    >
                      <Send className="w-3 h-3" />
                    </Button>
                  )}
                </motion.div>
              ))
            )}
          </TabsContent>

          <TabsContent value="settings" className="space-y-3">
            {[
              { key: 'autoWelcomeEmail', label: 'Auto Welcome Emails', icon: Mail },
              { key: 'autoFollowUps', label: 'Milestone Follow-ups', icon: Clock },
              { key: 'autoRenewalReminders', label: 'Renewal Reminders', icon: Calendar },
              { key: 'autoSatisfactionSurveys', label: 'Satisfaction Surveys', icon: Target }
            ].map((setting) => (
              <div key={setting.key} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <setting.icon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <Label className="text-sm text-slate-700 dark:text-slate-300">{setting.label}</Label>
                </div>
                <Switch
                  checked={automationSettings[setting.key]}
                  onCheckedChange={(checked) => 
                    setAutomationSettings(prev => ({ ...prev, [setting.key]: checked }))
                  }
                />
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}