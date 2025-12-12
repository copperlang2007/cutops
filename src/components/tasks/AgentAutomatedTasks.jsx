import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap, Loader2, CheckCircle, XCircle, Calendar, Phone, Mail, MessageSquare, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';

export default function AgentAutomatedTasks({ agentId, compact = false }) {
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['automatedTasks', agentId],
    queryFn: () => base44.entities.AutomatedTask.filter({ 
      agent_id: agentId,
      status: 'open'
    }, '-priority'),
    enabled: !!agentId
  });

  const generateTasksMutation = useMutation({
    mutationFn: () => base44.functions.invoke('aiAutomatedTaskGenerator', { agentId }),
    onSuccess: () => {
      queryClient.invalidateQueries(['automatedTasks', agentId]);
      toast.success('AI tasks generated!');
    },
    onError: () => toast.error('Failed to generate tasks')
  });

  const completeMutation = useMutation({
    mutationFn: (taskId) => base44.entities.AutomatedTask.update(taskId, {
      status: 'completed',
      completed_date: new Date().toISOString(),
      completed_by: agentId
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['automatedTasks', agentId]);
      toast.success('Task completed!');
    }
  });

  const dismissMutation = useMutation({
    mutationFn: ({ taskId, reason }) => base44.entities.AutomatedTask.update(taskId, {
      status: 'dismissed',
      dismissed_reason: reason
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['automatedTasks', agentId]);
      toast.success('Task dismissed');
    }
  });

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-700 border-l-red-500';
      case 'high': return 'bg-orange-100 text-orange-700 border-l-orange-500';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-l-yellow-500';
      case 'low': return 'bg-green-100 text-green-700 border-l-green-500';
      default: return 'bg-slate-100 text-slate-700 border-l-slate-500';
    }
  };

  const getMethodIcon = (method) => {
    switch (method) {
      case 'call': return <Phone className="w-4 h-4" />;
      case 'email': return <Mail className="w-4 h-4" />;
      case 'sms': return <MessageSquare className="w-4 h-4" />;
      default: return <Mail className="w-4 h-4" />;
    }
  };

  const displayTasks = compact ? tasks.slice(0, 5) : tasks;

  return (
    <Card className="clay-morphism border-0">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-600" />
            AI-Generated Tasks ({tasks.length})
          </CardTitle>
          <Button
            onClick={() => generateTasksMutation.mutate()}
            disabled={generateTasksMutation.isPending}
            size="sm"
            variant="outline"
          >
            {generateTasksMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Zap className="w-4 h-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="text-center py-4">
            <Loader2 className="w-6 h-6 animate-spin text-teal-600 mx-auto" />
          </div>
        ) : displayTasks.length === 0 ? (
          <div className="text-center py-8">
            <Zap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 mb-4">No automated tasks</p>
            <Button
              onClick={() => generateTasksMutation.mutate()}
              disabled={generateTasksMutation.isPending}
              size="sm"
              className="bg-teal-600 hover:bg-teal-700"
            >
              Generate Tasks
            </Button>
          </div>
        ) : (
          displayTasks.map((task, index) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`p-4 clay-subtle rounded-lg border-l-4 ${getPriorityColor(task.priority)}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">{task.title}</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{task.description}</p>
                </div>
                <Badge className={getPriorityColor(task.priority)}>
                  {task.priority}
                </Badge>
              </div>

              <div className="flex gap-2 flex-wrap text-xs text-slate-600 dark:text-slate-400 mt-2">
                <Badge variant="outline" className="text-xs">
                  <Calendar className="w-3 h-3 mr-1" />
                  {task.due_date}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {getMethodIcon(task.suggested_method)}
                  <span className="ml-1">{task.suggested_method}</span>
                </Badge>
                {task.suggested_time && (
                  <Badge variant="outline" className="text-xs">{task.suggested_time}</Badge>
                )}
              </div>

              {task.suggested_action && (
                <p className="text-xs text-teal-700 dark:text-teal-400 mt-2 italic">
                  💡 {task.suggested_action}
                </p>
              )}

              <div className="flex gap-2 mt-3">
                {task.client_id && (
                  <Link to={`${createPageUrl('ClientDetail')}?id=${task.client_id}`}>
                    <Button size="sm" variant="outline">
                      <Eye className="w-3 h-3 mr-1" />
                      View Client
                    </Button>
                  </Link>
                )}
                <Button
                  onClick={() => completeMutation.mutate(task.id)}
                  disabled={completeMutation.isPending}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Complete
                </Button>
                <Button
                  onClick={() => dismissMutation.mutate({ taskId: task.id, reason: 'Not relevant' })}
                  disabled={dismissMutation.isPending}
                  variant="outline"
                  size="sm"
                >
                  <XCircle className="w-3 h-3 mr-1" />
                  Dismiss
                </Button>
              </div>
            </motion.div>
          ))
        )}
      </CardContent>
    </Card>
  );
}