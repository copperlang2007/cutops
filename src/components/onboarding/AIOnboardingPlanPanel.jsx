import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Sparkles, Loader2, Mail, BookOpen, CheckSquare, Send } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function AIOnboardingPlanPanel({ clientId, clientEmail }) {
  const queryClient = useQueryClient();

  const { data: plan, isLoading } = useQuery({
    queryKey: ['onboardingPlan', clientId],
    queryFn: async () => {
      const plans = await base44.entities.OnboardingPlan.filter({ client_id: clientId });
      return plans[0];
    },
    enabled: !!clientId
  });

  const generateMutation = useMutation({
    mutationFn: () => base44.functions.invoke('aiGenerateOnboardingPlan', { clientId }),
    onSuccess: () => {
      queryClient.invalidateQueries(['onboardingPlan', clientId]);
      toast.success('Onboarding plan generated!');
    },
    onError: () => toast.error('Failed to generate plan')
  });

  const sendWelcomeMutation = useMutation({
    mutationFn: async () => {
      await base44.integrations.Core.SendEmail({
        to: clientEmail,
        subject: plan.welcome_message_subject,
        body: plan.welcome_message_body
      });
      await base44.entities.OnboardingPlan.update(plan.id, {
        welcome_email_sent: true,
        welcome_email_sent_date: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['onboardingPlan', clientId]);
      toast.success('Welcome email sent!');
    }
  });

  const toggleTaskMutation = useMutation({
    mutationFn: async ({ taskIndex, isCompleted }) => {
      const updatedChecklist = [...plan.personalized_checklist];
      updatedChecklist[taskIndex] = {
        ...updatedChecklist[taskIndex],
        is_completed: isCompleted,
        completion_date: isCompleted ? new Date().toISOString() : null
      };
      
      const completedCount = updatedChecklist.filter(t => t.is_completed).length;
      const allCompleted = completedCount === updatedChecklist.length;

      await base44.entities.OnboardingPlan.update(plan.id, {
        personalized_checklist: updatedChecklist,
        status: allCompleted ? 'completed' : 'in_progress',
        completion_date: allCompleted ? new Date().toISOString() : null
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['onboardingPlan', clientId]);
    }
  });

  if (isLoading) {
    return (
      <Card className="clay-morphism border-0">
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
        </CardContent>
      </Card>
    );
  }

  if (!plan) {
    return (
      <Card className="clay-morphism border-0">
        <CardContent className="text-center py-8">
          <Sparkles className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 mb-4">No onboarding plan yet</p>
          <Button
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            className="bg-teal-600 hover:bg-teal-700"
          >
            {generateMutation.isPending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating...</>
            ) : (
              <><Sparkles className="w-4 h-4 mr-2" />Generate Onboarding Plan</>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const completedTasks = plan.personalized_checklist.filter(t => t.is_completed).length;
  const totalTasks = plan.personalized_checklist.length;
  const progressPercent = (completedTasks / totalTasks) * 100;

  return (
    <div className="space-y-4">
      <Card className="clay-morphism border-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-teal-600" />
              Onboarding Progress
            </CardTitle>
            <Badge className={plan.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}>
              {plan.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-600 dark:text-slate-400">
                {completedTasks} of {totalTasks} tasks completed
              </span>
              <span className="font-bold text-teal-600">{Math.round(progressPercent)}%</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>

          <div className="space-y-2">
            {plan.personalized_checklist.map((task, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-start gap-3 p-3 clay-subtle rounded-lg"
              >
                <Checkbox
                  checked={task.is_completed}
                  onCheckedChange={(checked) => toggleTaskMutation.mutate({ taskIndex: index, isCompleted: checked })}
                  className="mt-1"
                />
                <div className="flex-1">
                  <p className={`font-medium text-sm ${task.is_completed ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                    {task.task}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">{task.description}</p>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">Due: {task.due_date}</Badge>
                    <Badge variant="outline" className="text-xs">{task.assigned_to}</Badge>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="clay-morphism border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-600" />
            Welcome Email
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3 clay-subtle rounded">
            <p className="text-xs text-slate-500 mb-1">Subject:</p>
            <p className="font-medium text-slate-900 dark:text-white">{plan.welcome_message_subject}</p>
          </div>
          <div className="p-3 clay-subtle rounded">
            <p className="text-xs text-slate-500 mb-2">Body:</p>
            <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
              {plan.welcome_message_body.substring(0, 300)}...
            </p>
          </div>
          {plan.welcome_email_sent ? (
            <Badge className="bg-green-100 text-green-700">
              <CheckCircle className="w-3 h-3 mr-1" />
              Sent on {new Date(plan.welcome_email_sent_date).toLocaleDateString()}
            </Badge>
          ) : (
            <Button
              onClick={() => sendWelcomeMutation.mutate()}
              disabled={sendWelcomeMutation.isPending}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {sendWelcomeMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending...</>
              ) : (
                <><Send className="w-4 h-4 mr-2" />Send Welcome Email</>
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      {plan.educational_content_links?.length > 0 && (
        <Card className="clay-morphism border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-600" />
              Educational Resources
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {plan.educational_content_links.map((link, i) => (
              <div key={i} className="p-2 clay-subtle rounded text-sm text-slate-700 dark:text-slate-300">
                {link}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}