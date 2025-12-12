import { useState } from 'react'
import { base44 } from '@/api/base44Client'
import { useQueryClient } from '@tanstack/react-query'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Rocket, Mail, Phone, FileText, Heart, Building2, Pill,
  Stethoscope, Star, Users, CheckCircle, Clock, Loader2,
  ChevronRight, Sparkles, Send, Calendar
} from 'lucide-react';
import { format, addDays, differenceInDays } from 'date-fns'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

const ONBOARDING_TEMPLATES = {
  medicare_advantage: {
    name: 'Medicare Advantage',
    tasks: [
      { type: 'welcome_email', title: 'Send Welcome Email', days: 0, priority: 'high' },
      { type: 'intro_call', title: 'Introduction Call', days: 1, priority: 'high' },
      { type: 'document_collection', title: 'Collect Required Documents', days: 3, priority: 'high' },
      { type: 'benefits_overview', title: 'Benefits Overview Session', days: 5, priority: 'medium' },
      { type: 'provider_setup', title: 'Help Setup Primary Care Provider', days: 7, priority: 'medium' },
      { type: 'pharmacy_setup', title: 'Pharmacy & Prescription Setup', days: 10, priority: 'medium' },
      { type: 'first_checkup', title: '30-Day Check-in Call', days: 30, priority: 'medium' },
      { type: 'satisfaction_survey', title: 'Satisfaction Survey', days: 45, priority: 'low' },
      { type: 'referral_request', title: 'Request Referrals', days: 60, priority: 'low' }
    ]
  },
  supplement: {
    name: 'Medicare Supplement',
    tasks: [
      { type: 'welcome_email', title: 'Send Welcome Email', days: 0, priority: 'high' },
      { type: 'intro_call', title: 'Welcome Call', days: 1, priority: 'high' },
      { type: 'document_collection', title: 'Collect Policy Documents', days: 3, priority: 'high' },
      { type: 'plan_review', title: 'Coverage Review Session', days: 7, priority: 'medium' },
      { type: 'first_checkup', title: '30-Day Check-in', days: 30, priority: 'medium' },
      { type: 'satisfaction_survey', title: 'Satisfaction Survey', days: 45, priority: 'low' },
      { type: 'referral_request', title: 'Request Referrals', days: 60, priority: 'low' }
    ]
  },
  pdp: {
    name: 'Prescription Drug Plan',
    tasks: [
      { type: 'welcome_email', title: 'Send Welcome Email', days: 0, priority: 'high' },
      { type: 'intro_call', title: 'Welcome Call', days: 1, priority: 'high' },
      { type: 'pharmacy_setup', title: 'Pharmacy Setup Assistance', days: 3, priority: 'high' },
      { type: 'first_checkup', title: '14-Day Check-in', days: 14, priority: 'medium' },
      { type: 'satisfaction_survey', title: 'Satisfaction Survey', days: 30, priority: 'low' }
    ]
  },
  default: {
    name: 'Standard Onboarding',
    tasks: [
      { type: 'welcome_email', title: 'Send Welcome Email', days: 0, priority: 'high' },
      { type: 'intro_call', title: 'Introduction Call', days: 1, priority: 'high' },
      { type: 'plan_review', title: 'Plan Review', days: 7, priority: 'medium' },
      { type: 'first_checkup', title: '30-Day Check-in', days: 30, priority: 'medium' },
      { type: 'satisfaction_survey', title: 'Satisfaction Survey', days: 45, priority: 'low' }
    ]
  }
};

const taskIcons = {
  welcome_email: Mail,
  intro_call: Phone,
  document_collection: FileText,
  plan_review: FileText,
  benefits_overview: Heart,
  provider_setup: Building2,
  pharmacy_setup: Pill,
  first_checkup: Stethoscope,
  satisfaction_survey: Star,
  referral_request: Users
};

const priorityColors = {
  high: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  low: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400'
};

export default function ClientOnboardingFlow({ 
  client, 
  agent,
  onboardingTasks = [],
  onTaskUpdate,
  onStartOnboarding 
}) {
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const template = ONBOARDING_TEMPLATES[client.plan_type] || ONBOARDING_TEMPLATES.default;
  
  const completedTasks = onboardingTasks.filter(t => t.status === 'completed').length;
  const totalTasks = onboardingTasks.length || template.tasks.length;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const generateWelcomeEmail = async () => {
    setIsGenerating(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate a warm, professional welcome email for a new Medicare client.

CLIENT DETAILS:
- Name: ${client.first_name} ${client.last_name}
- Plan Type: ${client.plan_type?.replace(/_/g, ' ') || 'Medicare'}
- Carrier: ${client.carrier || 'their selected carrier'}
- Effective Date: ${client.effective_date || 'upcoming'}

AGENT DETAILS:
- Name: ${agent?.first_name} ${agent?.last_name}
- Phone: ${agent?.phone || 'available upon request'}
- Email: ${agent?.email || ''}

Create a personalized welcome email that:
1. Warmly welcomes them to their new plan
2. Briefly explains next steps
3. Provides agent contact information
4. Sets expectations for the onboarding process
5. Is warm but professional in tone

Keep it concise (under 200 words).`,
        response_json_schema: {
          type: "object",
          properties: {
            subject: { type: "string" },
            body: { type: "string" }
          }
        }
      });

      return result;
    } catch (err) {
      console.error('Failed to generate email:', err);
      toast.error('Failed to generate email');
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const sendWelcomeEmail = async () => {
    if (!client.email) {
      toast.error('Client email is required');
      return;
    }

    setIsSendingEmail(true);
    try {
      const emailContent = await generateWelcomeEmail();
      if (!emailContent) return;

      await base44.integrations.Core.SendEmail({
        to: client.email,
        subject: emailContent.subject,
        body: emailContent.body
      });

      // Update client and task
      await base44.entities.Client.update(client.id, {
        welcome_email_sent: true,
        onboarding_status: 'welcome_sent',
        onboarding_started_date: new Date().toISOString()
      });

      // Mark welcome email task as completed
      const welcomeTask = onboardingTasks.find(t => t.task_type === 'welcome_email');
      if (welcomeTask) {
        await base44.entities.ClientOnboardingTask.update(welcomeTask.id, {
          status: 'completed',
          completed_date: new Date().toISOString()
        });
      }

      queryClient.invalidateQueries(['clients']);
      queryClient.invalidateQueries(['clientOnboardingTasks']);
      toast.success('Welcome email sent successfully!');
    } catch (err) {
      console.error('Failed to send email:', err);
      toast.error('Failed to send welcome email');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const initializeOnboarding = async () => {
    setIsGenerating(true);
    try {
      const startDate = new Date();
      const tasks = template.tasks.map(task => ({
        client_id: client.id,
        agent_id: client.agent_id,
        task_type: task.type,
        title: task.title,
        status: 'pending',
        due_date: format(addDays(startDate, task.days), 'yyyy-MM-dd'),
        days_from_start: task.days,
        priority: task.priority,
        auto_generated: true
      }));

      await base44.entities.ClientOnboardingTask.bulkCreate(tasks);
      
      await base44.entities.Client.update(client.id, {
        onboarding_status: 'in_progress',
        onboarding_started_date: startDate.toISOString()
      });

      queryClient.invalidateQueries(['clients']);
      queryClient.invalidateQueries(['clientOnboardingTasks']);
      toast.success('Onboarding flow initialized!');
      
      if (onStartOnboarding) onStartOnboarding();
    } catch (err) {
      console.error('Failed to initialize onboarding:', err);
      toast.error('Failed to start onboarding');
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleTaskComplete = async (task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    try {
      await base44.entities.ClientOnboardingTask.update(task.id, {
        status: newStatus,
        completed_date: newStatus === 'completed' ? new Date().toISOString() : null
      });

      // Check if all tasks completed
      const updatedTasks = onboardingTasks.map(t => 
        t.id === task.id ? { ...t, status: newStatus } : t
      );
      const allCompleted = updatedTasks.every(t => t.status === 'completed');
      
      if (allCompleted) {
        await base44.entities.Client.update(client.id, {
          onboarding_status: 'completed',
          onboarding_completed_date: new Date().toISOString()
        });
        toast.success('🎉 Onboarding completed!');
      }

      queryClient.invalidateQueries(['clientOnboardingTasks']);
      queryClient.invalidateQueries(['clients']);
      
      if (onTaskUpdate) onTaskUpdate(task, newStatus);
    } catch (err) {
      toast.error('Failed to update task');
    }
  };

  const getTaskStatus = (task) => {
    if (task.status === 'completed') return 'completed';
    const dueDate = new Date(task.due_date);
    const today = new Date();
    if (dueDate < today) return 'overdue';
    if (differenceInDays(dueDate, today) <= 2) return 'due_soon';
    return 'pending';
  };

  // If no onboarding started
  if (!onboardingTasks.length && client.onboarding_status === 'not_started') {
    return (
      <Card className="border-0 shadow-sm dark:bg-slate-800">
        <CardContent className="p-6">
          <div className="text-center py-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-teal-100 to-emerald-100 dark:from-teal-900/40 dark:to-emerald-900/40 flex items-center justify-center">
              <Rocket className="w-8 h-8 text-teal-600 dark:text-teal-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">
              Start Client Onboarding
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 max-w-md mx-auto">
              Initialize a personalized onboarding flow for {client.first_name} based on their 
              {' '}<span className="font-medium">{template.name}</span> plan.
            </p>
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {template.tasks.slice(0, 4).map((task, i) => {
                const Icon = taskIcons[task.type] || CheckCircle;
                return (
                  <Badge key={i} variant="outline" className="text-xs dark:border-slate-600 dark:text-slate-300">
                    <Icon className="w-3 h-3 mr-1" />
                    {task.title}
                  </Badge>
                );
              })}
              {template.tasks.length > 4 && (
                <Badge variant="outline" className="text-xs dark:border-slate-600 dark:text-slate-300">
                  +{template.tasks.length - 4} more
                </Badge>
              )}
            </div>
            <Button 
              onClick={initializeOnboarding}
              disabled={isGenerating}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              Start Onboarding Flow
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm dark:bg-slate-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2 text-slate-800 dark:text-white">
            <Rocket className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            Onboarding Progress
          </CardTitle>
          <Badge className={
            progress === 100 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' :
            progress > 50 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' :
            'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
          }>
            {progress}% Complete
          </Badge>
        </div>
        <Progress value={progress} className="h-2 mt-2" />
      </CardHeader>
      <CardContent className="pt-0">
        {/* Welcome Email Action */}
        {!client.welcome_email_sent && client.email && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-900/30 dark:to-emerald-900/30 rounded-lg border border-teal-200 dark:border-teal-800"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span className="text-sm font-medium text-teal-800 dark:text-teal-300">
                  Send personalized welcome email
                </span>
              </div>
              <Button 
                size="sm" 
                onClick={sendWelcomeEmail}
                disabled={isSendingEmail || isGenerating}
                className="bg-teal-600 hover:bg-teal-700"
              >
                {isSendingEmail ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <>
                    <Send className="w-3 h-3 mr-1" />
                    Send
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        )}

        {/* Task List */}
        <div className="space-y-2 max-h-[350px] overflow-y-auto">
          <AnimatePresence>
            {onboardingTasks.sort((a, b) => a.days_from_start - b.days_from_start).map((task, idx) => {
              const Icon = taskIcons[task.task_type] || CheckCircle;
              const status = getTaskStatus(task);
              
              return (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`p-3 rounded-lg border transition-all ${
                    status === 'completed' 
                      ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800' 
                      : status === 'overdue'
                      ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                      : status === 'due_soon'
                      ? 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800'
                      : 'bg-slate-50 border-slate-200 dark:bg-slate-900/50 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={task.status === 'completed'}
                      onCheckedChange={() => toggleTaskComplete(task)}
                      className="data-[state=checked]:bg-emerald-600"
                    />
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      status === 'completed' ? 'bg-emerald-100 dark:bg-emerald-900/40' : 'bg-slate-100 dark:bg-slate-800'
                    }`}>
                      <Icon className={`w-4 h-4 ${
                        status === 'completed' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${
                        status === 'completed' 
                          ? 'text-emerald-800 dark:text-emerald-300 line-through' 
                          : 'text-slate-800 dark:text-white'
                      }`}>
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          <Calendar className="w-3 h-3 inline mr-1" />
                          {format(new Date(task.due_date), 'MMM d')}
                        </span>
                        {status === 'overdue' && (
                          <Badge className="text-[10px] bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400">
                            Overdue
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Badge className={`text-xs ${priorityColors[task.priority]}`}>
                      {task.priority}
                    </Badge>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}