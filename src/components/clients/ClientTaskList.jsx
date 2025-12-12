import { useState } from 'react'
import { base44 } from '@/api/base44Client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, Calendar, CheckCircle, Clock } from 'lucide-react'
import { format } from 'date-fns'
import TaskFormModal from '../tasks/TaskFormModal';

export default function ClientTaskList({ clientId, tasks }) {
  const queryClient = useQueryClient();
  const [showTaskModal, setShowTaskModal] = useState(false);

  const toggleTaskMutation = useMutation({
    mutationFn: async (task) => {
      const newStatus = task.status === 'completed' ? 'pending' : 'completed';
      return await base44.entities.Task.update(task.id, {
        status: newStatus,
        completed_date: newStatus === 'completed' ? new Date().toISOString() : null
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['clientTasks']);
    }
  });

  const pendingTasks = tasks.filter(t => t.status !== 'completed');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  return (
    <>
      <Card className="border-0 shadow-lg dark:bg-slate-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Tasks & Follow-ups</CardTitle>
          <Button onClick={() => setShowTaskModal(true)} size="sm" className="bg-teal-600 hover:bg-teal-700">
            <Plus className="w-4 h-4 mr-1" />
            Add Task
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Pending Tasks */}
          {pendingTasks.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Open Tasks ({pendingTasks.length})
              </h4>
              <div className="space-y-2">
                {pendingTasks.map(task => (
                  <div
                    key={task.id}
                    className="flex items-start gap-3 p-3 rounded-lg border dark:border-slate-700 hover:border-teal-300 dark:hover:border-teal-600 transition-colors"
                  >
                    <Checkbox
                      checked={false}
                      onCheckedChange={() => toggleTaskMutation.mutate(task)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-slate-900 dark:text-white">{task.title}</p>
                      {task.description && (
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{task.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        {task.due_date && (
                          <Badge variant="outline" className="text-xs">
                            <Calendar className="w-3 h-3 mr-1" />
                            {format(new Date(task.due_date), 'MMM d')}
                          </Badge>
                        )}
                        <Badge className={`text-xs ${
                          task.priority === 'high' ? 'bg-red-100 text-red-700' :
                          task.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {task.priority}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {task.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Completed Tasks */}
          {completedTasks.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Completed ({completedTasks.length})
              </h4>
              <div className="space-y-2">
                {completedTasks.slice(0, 5).map(task => (
                  <div
                    key={task.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50"
                  >
                    <Checkbox
                      checked={true}
                      onCheckedChange={() => toggleTaskMutation.mutate(task)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-slate-500 dark:text-slate-500 line-through">{task.title}</p>
                      {task.completed_date && (
                        <p className="text-xs text-slate-400 mt-1">
                          Completed {format(new Date(task.completed_date), 'MMM d, yyyy')}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tasks.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              No tasks yet
            </div>
          )}
        </CardContent>
      </Card>

      {showTaskModal && (
        <TaskFormModal
          open={showTaskModal}
          onClose={() => setShowTaskModal(false)}
          defaultValues={{
            related_entity_type: 'client',
            related_entity_id: clientId
          }}
        />
      )}
    </>
  );
}