import { useState } from 'react'
import { base44 } from '@/api/base44Client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createPageUrl } from '@/utils'
import { format, differenceInDays } from 'date-fns'
import { 
  CheckSquare, Plus, Filter, Clock, AlertTriangle, CheckCircle,
  Calendar, User, ChevronRight, Sparkles, Loader2
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { motion, AnimatePresence } from 'framer-motion'
import TaskFormModal from '../components/tasks/TaskFormModal';
import { generateAutomatedTasks } from '../components/tasks/taskAutomation'
import RoleGuard from '../components/shared/RoleGuard';

const priorityConfig = {
  urgent: { color: 'bg-red-100 text-red-700 border-red-200', label: 'Urgent' },
  high: { color: 'bg-orange-100 text-orange-700 border-orange-200', label: 'High' },
  medium: { color: 'bg-blue-100 text-blue-700 border-blue-200', label: 'Medium' },
  low: { color: 'bg-slate-100 text-slate-600 border-slate-200', label: 'Low' }
};

const statusConfig = {
  pending: { color: 'bg-amber-100 text-amber-700', icon: Clock },
  in_progress: { color: 'bg-blue-100 text-blue-700', icon: Clock },
  completed: { color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  cancelled: { color: 'bg-slate-100 text-slate-500', icon: CheckSquare }
};

export default function Tasks() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('pending');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list('-created_date')
  });

  const { data: agents = [] } = useQuery({
    queryKey: ['agents'],
    queryFn: () => base44.entities.Agent.list()
  });

  const { data: licenses = [] } = useQuery({
    queryKey: ['licenses'],
    queryFn: () => base44.entities.License.list()
  });

  const { data: contracts = [] } = useQuery({
    queryKey: ['contracts'],
    queryFn: () => base44.entities.Contract.list()
  });

  const { data: checklistItems = [] } = useQuery({
    queryKey: ['allChecklists'],
    queryFn: () => base44.entities.OnboardingChecklist.list()
  });

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Task.update(id, data),
    onSuccess: () => queryClient.invalidateQueries(['tasks'])
  });

  const createTaskMutation = useMutation({
    mutationFn: (data) => base44.entities.Task.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks']);
      setShowTaskForm(false);
    }
  });

  const handleGenerateAutomatedTasks = async () => {
    setIsGenerating(true);
    try {
      const newTasks = await generateAutomatedTasks(
        agents,
        licenses,
        contracts,
        checklistItems,
        tasks,
        currentUser?.email
      );
      
      for (const task of newTasks) {
        await base44.entities.Task.create(task);
      }
      
      queryClient.invalidateQueries(['tasks']);
    } catch (err) {
      console.error('Failed to generate tasks:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToggleComplete = (task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    updateTaskMutation.mutate({
      id: task.id,
      data: {
        status: newStatus,
        completed_date: newStatus === 'completed' ? new Date().toISOString() : null
      }
    });
  };

  const getAgentName = (agentId) => {
    const agent = agents.find(a => a.id === agentId);
    return agent ? `${agent.first_name} ${agent.last_name}` : 'Unknown';
  };

  const filteredTasks = tasks.filter(task => {
    const statusMatch = statusFilter === 'all' || task.status === statusFilter;
    const priorityMatch = priorityFilter === 'all' || task.priority === priorityFilter;
    return statusMatch && priorityMatch;
  });

  const taskCounts = {
    pending: tasks.filter(t => t.status === 'pending').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    overdue: tasks.filter(t => t.due_date && differenceInDays(new Date(t.due_date), new Date()) < 0 && t.status !== 'completed').length
  };

  return (
    <RoleGuard requiredRole="admin" pageName="Tasks">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Tasks</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Manage agent onboarding and compliance tasks</p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleGenerateAutomatedTasks}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Auto-Generate Tasks
                </>
              )}
            </Button>
            <Button onClick={() => setShowTaskForm(true)} className="bg-teal-600 hover:bg-teal-700 shadow-lg hover:shadow-teal-500/30 transition-all duration-300">
              <Plus className="w-4 h-4 mr-2" />
              New Task
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-0 shadow-sm dark:bg-slate-800 p-4 cursor-pointer hover:shadow-xl hover:shadow-amber-500/20 transition-all duration-300 hover:-translate-y-1" onClick={() => setStatusFilter('pending')}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Pending</p>
                <p className="text-2xl font-bold text-amber-600">{taskCounts.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-amber-200" />
            </div>
          </Card>
          <Card className="border-0 shadow-sm dark:bg-slate-800 p-4 cursor-pointer hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-300 hover:-translate-y-1" onClick={() => setStatusFilter('in_progress')}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">{taskCounts.in_progress}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-200" />
            </div>
          </Card>
          <Card className="border-0 shadow-sm dark:bg-slate-800 p-4 cursor-pointer hover:shadow-xl hover:shadow-emerald-500/20 transition-all duration-300 hover:-translate-y-1" onClick={() => setStatusFilter('completed')}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Completed</p>
                <p className="text-2xl font-bold text-emerald-600">{taskCounts.completed}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-emerald-200" />
            </div>
          </Card>
          <Card className="border-0 shadow-sm dark:bg-slate-800 p-4 hover:shadow-xl hover:shadow-red-500/20 transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Overdue</p>
                <p className="text-2xl font-bold text-red-600">{taskCounts.overdue}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-200" />
            </div>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Task List */}
        <Card className="border-0 shadow-sm dark:bg-slate-800 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-400" />
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <CheckSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">No tasks found</p>
                <p className="text-sm mt-1">Create a new task or generate automated tasks</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                <AnimatePresence>
                  {filteredTasks.map(task => {
                    const priority = priorityConfig[task.priority] || priorityConfig.medium;
                    const status = statusConfig[task.status] || statusConfig.pending;
                    const isOverdue = task.due_date && differenceInDays(new Date(task.due_date), new Date()) < 0 && task.status !== 'completed';
                    
                    return (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="p-4 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-start gap-4">
                          <Checkbox
                            checked={task.status === 'completed'}
                            onCheckedChange={() => handleToggleComplete(task)}
                            className="mt-1"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className={`font-medium ${task.status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                                {task.title}
                              </h3>
                              <Badge variant="outline" className={priority.color}>
                                {priority.label}
                              </Badge>
                              <Badge variant="outline" className={status.color}>
                                {task.status.replace('_', ' ')}
                              </Badge>
                              {task.auto_generated && (
                                <Badge variant="outline" className="bg-purple-50 text-purple-600 border-purple-200">
                                  <Sparkles className="w-3 h-3 mr-1" />
                                  Auto
                                </Badge>
                              )}
                              {isOverdue && (
                                <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">
                                  Overdue
                                </Badge>
                              )}
                            </div>
                            {task.description && (
                              <p className="text-sm text-slate-500 mt-1 line-clamp-1">{task.description}</p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                              {task.agent_id && (
                                <span className="flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  {getAgentName(task.agent_id)}
                                </span>
                              )}
                              {task.due_date && (
                                <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-500' : ''}`}>
                                  <Calendar className="w-3 h-3" />
                                  Due: {format(new Date(task.due_date), 'MMM d, yyyy')}
                                </span>
                              )}
                            </div>
                          </div>
                          {task.agent_id && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => window.location.href = createPageUrl('AgentDetail') + `?id=${task.agent_id}`}
                            >
                              <ChevronRight className="w-5 h-5 text-slate-400" />
                            </Button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

        <TaskFormModal
          open={showTaskForm}
          onClose={() => setShowTaskForm(false)}
          agents={agents}
          onSubmit={(data) => createTaskMutation.mutate(data)}
          isLoading={createTaskMutation.isPending}
        />
        </div>
      </RoleGuard>
    );
  }