import { base44 } from '@/api/base44Client'
import { useMutation } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  CheckCircle, Circle, Clock, ArrowRight, 
  Mail, Phone, FileText, Calendar, Shield, 
  Star, Rocket
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

const taskTypeIcons = {
  welcome_email: Mail,
  intro_call: Phone,
  document_collection: FileText,
  plan_review: Shield,
  benefits_overview: Star,
  provider_setup: Calendar,
  pharmacy_setup: FileText,
  first_checkup: Calendar,
  satisfaction_survey: Star,
  referral_request: Mail
};

export default function ClientPortalOnboarding({ client, tasks = [], onTaskComplete }) {
  const updateTaskMutation = useMutation({
    mutationFn: async (task) => {
      await base44.entities.ClientOnboardingTask.update(task.id, {
        status: 'completed',
        completed_date: new Date().toISOString()
      });
    },
    onSuccess: () => {
      toast.success('Task marked as complete!');
      onTaskComplete?.();
    }
  });

  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const totalTasks = tasks.length;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const pendingTasks = tasks.filter(t => t.status !== 'completed' && t.status !== 'skipped');
  const completedTasksList = tasks.filter(t => t.status === 'completed');

  const getTaskStatus = (task) => {
    if (task.status === 'completed') return 'completed';
    if (task.status === 'skipped') return 'skipped';
    if (task.due_date && differenceInDays(new Date(task.due_date), new Date()) < 0) return 'overdue';
    if (task.status === 'in_progress') return 'in_progress';
    return 'pending';
  };

  const statusConfig = {
    completed: { color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400', icon: CheckCircle },
    in_progress: { color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400', icon: Clock },
    pending: { color: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300', icon: Circle },
    overdue: { color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400', icon: Clock },
    skipped: { color: 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400', icon: Circle }
  };

  if (tasks.length === 0) {
    return (
      <Card className="border-0 shadow-sm dark:bg-slate-800">
        <CardContent className="py-12 text-center">
          <Rocket className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">
            Onboarding Not Started
          </h3>
          <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Your personalized onboarding journey will appear here once your agent sets it up. 
            Contact your agent if you have any questions.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        {/* Progress Overview */}
        <Card className="border-0 shadow-sm overflow-hidden dark:bg-slate-800">
          <div className="bg-gradient-to-r from-teal-500 to-emerald-600 p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold">Your Onboarding Journey</h2>
                <p className="text-teal-100 text-sm mt-1">
                  {completedTasks} of {totalTasks} tasks completed
                </p>
              </div>
              <div className="text-right">
                <p className="text-4xl font-bold">{progress}%</p>
                <p className="text-teal-100 text-sm">Complete</p>
              </div>
            </div>
            <Progress value={progress} className="h-3 bg-white/20" />
          </div>
          <CardContent className="p-6">
            {progress === 100 ? (
              <div className="text-center py-4">
                <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-3" />
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-1">
                  Congratulations! 🎉
                </h3>
                <p className="text-slate-500 dark:text-slate-400">
                  You've completed all onboarding tasks. Welcome aboard!
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center">
                  <Rocket className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                </div>
                <div>
                  <p className="font-medium text-slate-800 dark:text-white">Keep going!</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Complete your remaining tasks to get fully set up with your coverage.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Tasks */}
        {pendingTasks.length > 0 && (
          <Card className="border-0 shadow-sm dark:bg-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-500" />
                Tasks To Complete
                <Badge variant="secondary" className="ml-2">{pendingTasks.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingTasks.map((task, index) => {
                  const status = getTaskStatus(task);
                  const config = statusConfig[status];
                  const TaskIcon = taskTypeIcons[task.task_type] || FileText;

                  return (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`p-4 rounded-xl border ${
                        status === 'overdue' 
                          ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                          status === 'overdue' 
                            ? 'bg-red-100 dark:bg-red-900/40'
                            : 'bg-slate-100 dark:bg-slate-800'
                        }`}>
                          <TaskIcon className={`w-5 h-5 ${
                            status === 'overdue' ? 'text-red-600' : 'text-slate-600 dark:text-slate-400'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-medium text-slate-800 dark:text-white">
                              {task.title}
                            </h4>
                            <Badge className={config.color} variant="secondary">
                              {status === 'overdue' ? 'Overdue' : task.priority || 'medium'}
                            </Badge>
                          </div>
                          {task.description && (
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                              {task.description}
                            </p>
                          )}
                          {task.due_date && (
                            <p className={`text-xs mt-2 ${
                              status === 'overdue' ? 'text-red-600' : 'text-slate-400'
                            }`}>
                              Due: {format(new Date(task.due_date), 'MMM d, yyyy')}
                            </p>
                          )}
                        </div>
                        <Button 
                          size="sm"
                          onClick={() => updateTaskMutation.mutate(task)}
                          disabled={updateTaskMutation.isPending}
                          className="bg-teal-600 hover:bg-teal-700 shrink-0"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Complete
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Completed Tasks */}
        {completedTasksList.length > 0 && (
          <Card className="border-0 shadow-sm dark:bg-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Completed Tasks
                <Badge variant="secondary" className="ml-2 bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400">
                  {completedTasksList.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {completedTasksList.map((task) => {
                  const TaskIcon = taskTypeIcons[task.task_type] || FileText;
                  return (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800"
                    >
                      <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-800 dark:text-white text-sm">
                          {task.title}
                        </p>
                        {task.completed_date && (
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Completed {format(new Date(task.completed_date), 'MMM d, yyyy')}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Milestones */}
        <Card className="border-0 shadow-sm dark:bg-slate-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500" />
              Milestones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { label: 'Welcome Complete', threshold: 1, icon: Mail },
                { label: 'Documents Received', threshold: 3, icon: FileText },
                { label: 'Plan Review Done', threshold: 5, icon: Shield },
                { label: 'Fully Onboarded', threshold: totalTasks, icon: Rocket },
              ].map((milestone, idx) => {
                const achieved = completedTasks >= milestone.threshold;
                return (
                  <div key={idx} className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      achieved 
                        ? 'bg-amber-100 dark:bg-amber-900/40'
                        : 'bg-slate-100 dark:bg-slate-800'
                    }`}>
                      <milestone.icon className={`w-5 h-5 ${
                        achieved ? 'text-amber-600' : 'text-slate-400'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${
                        achieved ? 'text-slate-800 dark:text-white' : 'text-slate-400'
                      }`}>
                        {milestone.label}
                      </p>
                      <p className="text-xs text-slate-400">
                        {milestone.threshold} task{milestone.threshold !== 1 ? 's' : ''}
                      </p>
                    </div>
                    {achieved && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Help Card */}
        <Card className="border-0 shadow-sm bg-gradient-to-br from-slate-800 to-slate-900 text-white">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-2">Need Help?</h3>
            <p className="text-slate-300 text-sm mb-4">
              If you have questions about any task or your coverage, your agent is here to help.
            </p>
            <Button variant="secondary" size="sm" className="w-full">
              Contact Agent
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}