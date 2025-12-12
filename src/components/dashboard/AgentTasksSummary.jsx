import React from 'react';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';
import { format, differenceInDays } from 'date-fns';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckSquare, Clock, AlertTriangle, ChevronRight, Sparkles } from 'lucide-react';

const priorityConfig = {
  urgent: { color: 'bg-red-100 text-red-700', label: 'Urgent' },
  high: { color: 'bg-orange-100 text-orange-700', label: 'High' },
  medium: { color: 'bg-blue-100 text-blue-700', label: 'Medium' },
  low: { color: 'bg-slate-100 text-slate-600', label: 'Low' }
};

export default function AgentTasksSummary({ tasks = [], agentId, compact = false }) {
  const agentTasks = tasks.filter(t => t.agent_id === agentId && t.status !== 'completed');
  const overdueTasks = agentTasks.filter(t => t.due_date && differenceInDays(new Date(t.due_date), new Date()) < 0);

  if (agentTasks.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6 text-center text-slate-400">
          <CheckSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No pending tasks</p>
        </CardContent>
      </Card>
    );
  }

  const displayTasks = compact ? agentTasks.slice(0, 3) : agentTasks;

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-teal-600" />
            Tasks
            <Badge variant="secondary" className="ml-2">{agentTasks.length}</Badge>
          </CardTitle>
          {overdueTasks.length > 0 && (
            <Badge className="bg-red-100 text-red-700">
              <AlertTriangle className="w-3 h-3 mr-1" />
              {overdueTasks.length} Overdue
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {displayTasks.map(task => {
            const priority = priorityConfig[task.priority] || priorityConfig.medium;
            const isOverdue = task.due_date && differenceInDays(new Date(task.due_date), new Date()) < 0;
            
            return (
              <div 
                key={task.id} 
                className={`p-3 rounded-lg border ${isOverdue ? 'border-red-200 bg-red-50' : 'border-slate-100 bg-slate-50'}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-sm font-medium ${isOverdue ? 'text-red-700' : 'text-slate-700'}`}>
                        {task.title}
                      </span>
                      <Badge variant="outline" className={`text-xs ${priority.color}`}>
                        {priority.label}
                      </Badge>
                      {task.auto_generated && (
                        <Sparkles className="w-3 h-3 text-purple-500" />
                      )}
                    </div>
                    {task.due_date && (
                      <p className={`text-xs mt-1 flex items-center gap-1 ${isOverdue ? 'text-red-600' : 'text-slate-500'}`}>
                        <Clock className="w-3 h-3" />
                        Due: {format(new Date(task.due_date), 'MMM d, yyyy')}
                        {isOverdue && ' (Overdue)'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {agentTasks.length > 3 && compact && (
          <Link to={createPageUrl('Tasks')}>
            <Button variant="ghost" size="sm" className="w-full mt-3 text-teal-600">
              View all {agentTasks.length} tasks
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}