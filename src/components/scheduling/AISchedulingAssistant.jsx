import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Calendar, Sparkles, Loader2, RefreshCw, AlertTriangle,
  CheckCircle, Clock, Users, ChevronRight
} from 'lucide-react';
import { format, addDays, startOfWeek, differenceInDays } from 'date-fns';
import { toast } from 'sonner';

export default function AISchedulingAssistant({ 
  agents, 
  licenses, 
  tasks,
  onCreateTask
}) {
  const [schedule, setSchedule] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState('current');
  const [selectedAgents, setSelectedAgents] = useState([]);

  const agentWorkloads = useMemo(() => {
    return agents.map(agent => {
      const agentTasks = tasks.filter(t => t.agent_id === agent.id && t.status !== 'completed');
      const agentLicenses = licenses.filter(l => l.agent_id === agent.id);
      const expiringLicenses = agentLicenses.filter(l => {
        if (!l.expiration_date) return false;
        const days = differenceInDays(new Date(l.expiration_date), new Date());
        return days > 0 && days <= 60;
      });

      return {
        ...agent,
        pendingTasks: agentTasks.length,
        overdueTasks: agentTasks.filter(t => t.due_date && new Date(t.due_date) < new Date()).length,
        expiringLicenses: expiringLicenses.length,
        workloadScore: agentTasks.length * 10 + expiringLicenses.length * 20
      };
    });
  }, [agents, tasks, licenses]);

  const generateSchedule = async () => {
    setIsGenerating(true);
    try {
      const targetAgents = selectedAgents.length > 0 
        ? agentWorkloads.filter(a => selectedAgents.includes(a.id))
        : agentWorkloads;

      const weekStart = selectedWeek === 'current' 
        ? startOfWeek(new Date(), { weekStartsOn: 1 })
        : startOfWeek(addDays(new Date(), 7), { weekStartsOn: 1 });

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate an optimized weekly schedule for insurance agent management:

WEEK: ${format(weekStart, 'MMM d')} - ${format(addDays(weekStart, 6), 'MMM d, yyyy')}

AGENTS TO SCHEDULE:
${targetAgents.map(a => `- ${a.first_name} ${a.last_name}: Status=${a.onboarding_status}, Pending Tasks=${a.pendingTasks}, Overdue=${a.overdueTasks}, Expiring Licenses=${a.expiringLicenses}, Workload Score=${a.workloadScore}`).join('\n')}

CONSIDERATIONS:
1. Balance workload across agents
2. Prioritize agents with compliance deadlines (expiring licenses)
3. Account for agents with overdue tasks
4. Consider onboarding status (pending agents need more attention)
5. Plan review meetings for high-workload agents
6. Schedule compliance check-ins before license expirations
7. Allow buffer time for urgent issues

Generate:
1. Daily schedule for each day of the week
2. Agent assignments with specific activities
3. Conflict alerts (scheduling issues)
4. Optimization suggestions
5. Priority items that must be addressed`,
        response_json_schema: {
          type: "object",
          properties: {
            weekly_schedule: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  day: { type: "string" },
                  date: { type: "string" },
                  activities: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        time: { type: "string" },
                        activity: { type: "string" },
                        agent_name: { type: "string" },
                        priority: { type: "string" },
                        duration: { type: "string" },
                        notes: { type: "string" }
                      }
                    }
                  }
                }
              }
            },
            conflicts: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  issue: { type: "string" },
                  affected_agents: { type: "array", items: { type: "string" } },
                  suggestion: { type: "string" }
                }
              }
            },
            priority_items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  item: { type: "string" },
                  agent: { type: "string" },
                  deadline: { type: "string" },
                  action: { type: "string" }
                }
              }
            },
            optimization_suggestions: { type: "array", items: { type: "string" } },
            workload_summary: {
              type: "object",
              properties: {
                total_activities: { type: "number" },
                high_priority: { type: "number" },
                estimated_hours: { type: "number" }
              }
            }
          }
        }
      });

      setSchedule(result);
      toast.success('Schedule generated successfully');
    } catch (err) {
      console.error('Failed to generate schedule:', err);
      toast.error('Failed to generate schedule');
    } finally {
      setIsGenerating(false);
    }
  };

  const createTasksFromSchedule = async () => {
    if (!schedule?.weekly_schedule || !onCreateTask) return;

    let created = 0;
    for (const day of schedule.weekly_schedule) {
      for (const activity of day.activities || []) {
        if (activity.priority === 'high' || activity.priority === 'urgent') {
          const agent = agents.find(a => 
            `${a.first_name} ${a.last_name}`.toLowerCase() === activity.agent_name?.toLowerCase()
          );
          await onCreateTask({
            title: activity.activity,
            task_type: 'scheduled',
            priority: activity.priority,
            agent_id: agent?.id,
            due_date: day.date,
            notes: activity.notes,
            auto_generated: true
          });
          created++;
        }
      }
    }
    toast.success(`Created ${created} tasks from schedule`);
  };

  const toggleAgent = (agentId) => {
    setSelectedAgents(prev =>
      prev.includes(agentId) ? prev.filter(id => id !== agentId) : [...prev, agentId]
    );
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            AI Scheduling Assistant
          </CardTitle>
          <div className="flex gap-2">
            <Select value={selectedWeek} onValueChange={setSelectedWeek}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">This Week</SelectItem>
                <SelectItem value="next">Next Week</SelectItem>
              </SelectContent>
            </Select>
            <Button
              size="sm"
              onClick={generateSchedule}
              disabled={isGenerating}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : schedule ? (
                <RefreshCw className="w-4 h-4" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Agent Selection */}
        <div>
          <p className="text-sm font-medium text-slate-700 mb-2">Select Agents (optional)</p>
          <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto p-2 bg-slate-50 rounded-lg">
            {agentWorkloads.map(agent => (
              <Badge
                key={agent.id}
                variant="outline"
                className={`cursor-pointer ${
                  selectedAgents.includes(agent.id) ? 'bg-indigo-100 border-indigo-300' : ''
                }`}
                onClick={() => toggleAgent(agent.id)}
              >
                {agent.first_name} {agent.last_name}
                {agent.overdueTasks > 0 && (
                  <AlertTriangle className="w-3 h-3 ml-1 text-red-500" />
                )}
              </Badge>
            ))}
          </div>
        </div>

        {!schedule && !isGenerating && (
          <div className="text-center py-6 text-slate-400">
            <Calendar className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Generate an optimized schedule based on agent workloads</p>
          </div>
        )}

        {schedule && (
          <div className="space-y-4">
            {/* Workload Summary */}
            {schedule.workload_summary && (
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 rounded-lg text-center">
                  <p className="text-lg font-bold text-slate-700">{schedule.workload_summary.total_activities}</p>
                  <p className="text-xs text-slate-500">Activities</p>
                </div>
                <div className="p-3 bg-red-50 rounded-lg text-center">
                  <p className="text-lg font-bold text-red-700">{schedule.workload_summary.high_priority}</p>
                  <p className="text-xs text-red-500">High Priority</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg text-center">
                  <p className="text-lg font-bold text-blue-700">{schedule.workload_summary.estimated_hours}h</p>
                  <p className="text-xs text-blue-500">Est. Hours</p>
                </div>
              </div>
            )}

            {/* Conflicts */}
            {schedule.conflicts?.length > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <h4 className="text-sm font-medium text-amber-800 mb-2 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" /> Scheduling Conflicts
                </h4>
                <div className="space-y-2">
                  {schedule.conflicts.map((conflict, i) => (
                    <div key={i} className="text-xs text-amber-700">
                      <p className="font-medium">{conflict.issue}</p>
                      <p className="text-amber-600">→ {conflict.suggestion}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Priority Items */}
            {schedule.priority_items?.length > 0 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-red-800">Must-Do Items</h4>
                  {onCreateTask && (
                    <Button size="sm" variant="outline" className="h-6 text-xs" onClick={createTasksFromSchedule}>
                      Create Tasks
                    </Button>
                  )}
                </div>
                <div className="space-y-1">
                  {schedule.priority_items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="text-red-700">{item.item}</span>
                      <span className="text-red-600">{item.deadline}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Weekly Schedule */}
            {schedule.weekly_schedule?.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-slate-700 mb-2">Weekly Schedule</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {schedule.weekly_schedule.map((day, i) => (
                    <div key={i} className="p-2 bg-slate-50 rounded-lg">
                      <p className="text-xs font-medium text-slate-700 mb-1">{day.day} - {day.date}</p>
                      <div className="space-y-1">
                        {day.activities?.slice(0, 4).map((activity, j) => (
                          <div key={j} className="flex items-center justify-between text-xs p-1 bg-white rounded">
                            <div className="flex items-center gap-2">
                              <span className="text-slate-400">{activity.time}</span>
                              <span className="text-slate-700">{activity.activity}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-slate-500">{activity.agent_name}</span>
                              <Badge variant="outline" className={`text-[10px] ${
                                activity.priority === 'high' ? 'bg-red-100 text-red-700' :
                                activity.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                                'bg-slate-100'
                              }`}>
                                {activity.priority}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Optimization Suggestions */}
            {schedule.optimization_suggestions?.length > 0 && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-sm font-medium text-blue-800 mb-2">Optimization Tips</h4>
                <ul className="space-y-1">
                  {schedule.optimization_suggestions.map((tip, i) => (
                    <li key={i} className="text-xs text-blue-700">• {tip}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}