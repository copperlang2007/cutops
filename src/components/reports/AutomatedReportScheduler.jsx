import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Calendar, Clock, Mail, Play, Pause, Trash2, Plus, Settings, Download } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function AutomatedReportScheduler() {
  const queryClient = useQueryClient();
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);

  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ['scheduledReports'],
    queryFn: () => base44.entities.ScheduledReport.list('-created_date')
  });

  const { data: agents = [] } = useQuery({
    queryKey: ['agents'],
    queryFn: () => base44.entities.Agent.list()
  });

  const createScheduleMutation = useMutation({
    mutationFn: (data) => base44.entities.ScheduledReport.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['scheduledReports']);
      setShowScheduleModal(false);
      setEditingSchedule(null);
      toast.success('Schedule created');
    }
  });

  const updateScheduleMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ScheduledReport.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['scheduledReports']);
      setShowScheduleModal(false);
      setEditingSchedule(null);
      toast.success('Schedule updated');
    }
  });

  const deleteScheduleMutation = useMutation({
    mutationFn: (id) => base44.entities.ScheduledReport.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['scheduledReports']);
      toast.success('Schedule deleted');
    }
  });

  const runReportMutation = useMutation({
    mutationFn: async (scheduleId) => {
      const response = await base44.functions.invoke('automatedReportGenerator', {
        schedule_id: scheduleId,
        manual_run: true
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Report generated and sent');
    }
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'paused': return 'bg-amber-100 text-amber-700';
      case 'inactive': return 'bg-slate-100 text-slate-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getFrequencyLabel = (frequency) => {
    return {
      daily: 'Daily',
      weekly: 'Weekly',
      bi_weekly: 'Bi-weekly',
      monthly: 'Monthly',
      quarterly: 'Quarterly'
    }[frequency] || frequency;
  };

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg liquid-glass">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Automated Report Scheduling</CardTitle>
              <p className="text-sm text-slate-500 mt-1">
                Schedule recurring reports with AI-powered insights
              </p>
            </div>
            <Button
              onClick={() => {
                setEditingSchedule(null);
                setShowScheduleModal(true);
              }}
              className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Schedule
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Schedules List */}
      <div className="grid grid-cols-1 gap-4">
        {schedules.map((schedule) => (
          <Card key={schedule.id} className="border-0 shadow-sm liquid-glass">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                      {schedule.name}
                    </h3>
                    <Badge className={getStatusColor(schedule.status)}>
                      {schedule.status}
                    </Badge>
                    <Badge variant="outline">{schedule.report_type.replace('_', ' ')}</Badge>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <Calendar className="w-4 h-4" />
                      <span>{getFrequencyLabel(schedule.frequency)}</span>
                    </div>
                    {schedule.schedule_time && (
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        <Clock className="w-4 h-4" />
                        <span>{schedule.schedule_time}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <Mail className="w-4 h-4" />
                      <span>{schedule.recipients?.length || 0} recipients</span>
                    </div>
                    {schedule.last_run_date && (
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        <Download className="w-4 h-4" />
                        <span>Last: {format(new Date(schedule.last_run_date), 'MMM d')}</span>
                      </div>
                    )}
                  </div>

                  {schedule.next_run_date && (
                    <p className="text-xs text-slate-500 mt-3">
                      Next run: {format(new Date(schedule.next_run_date), 'MMM d, yyyy \'at\' h:mm a')}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => runReportMutation.mutate(schedule.id)}
                    disabled={runReportMutation.isPending}
                  >
                    <Play className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingSchedule(schedule);
                      setShowScheduleModal(true);
                    }}
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateScheduleMutation.mutate({
                      id: schedule.id,
                      data: { status: schedule.status === 'active' ? 'paused' : 'active' }
                    })}
                  >
                    {schedule.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteScheduleMutation.mutate(schedule.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Schedule Creation/Edit Modal */}
      <ScheduleFormModal
        open={showScheduleModal}
        onClose={() => {
          setShowScheduleModal(false);
          setEditingSchedule(null);
        }}
        schedule={editingSchedule}
        agents={agents}
        onSubmit={(data) => {
          if (editingSchedule) {
            updateScheduleMutation.mutate({ id: editingSchedule.id, data });
          } else {
            createScheduleMutation.mutate(data);
          }
        }}
      />
    </div>
  );
}

function ScheduleFormModal({ open, onClose, schedule, agents, onSubmit }) {
  const [formData, setFormData] = useState({
    name: schedule?.name || '',
    report_type: schedule?.report_type || 'agent_performance',
    frequency: schedule?.frequency || 'weekly',
    schedule_time: schedule?.schedule_time || '09:00',
    recipients: schedule?.recipients || [],
    delivery_method: schedule?.delivery_method || 'email',
    format: schedule?.format || 'pdf',
    status: schedule?.status || 'active',
    parameters: schedule?.parameters || {
      agent_ids: [],
      metrics: ['revenue', 'retention', 'task_completion'],
      include_charts: true,
      include_recommendations: true
    }
  });

  const [recipientInput, setRecipientInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const addRecipient = () => {
    if (recipientInput && recipientInput.includes('@')) {
      setFormData(prev => ({
        ...prev,
        recipients: [...(prev.recipients || []), recipientInput]
      }));
      setRecipientInput('');
    }
  };

  const removeRecipient = (email) => {
    setFormData(prev => ({
      ...prev,
      recipients: prev.recipients.filter(r => r !== email)
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{schedule ? 'Edit Schedule' : 'Create Schedule'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Report Name</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Monthly Performance Report"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Report Type</Label>
              <Select
                value={formData.report_type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, report_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="agent_performance">Agent Performance</SelectItem>
                  <SelectItem value="executive_summary">Executive Summary</SelectItem>
                  <SelectItem value="sales_analytics">Sales Analytics</SelectItem>
                  <SelectItem value="retention_analysis">Retention Analysis</SelectItem>
                  <SelectItem value="task_completion">Task Completion</SelectItem>
                  <SelectItem value="commission_summary">Commission Summary</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Frequency</Label>
              <Select
                value={formData.frequency}
                onValueChange={(value) => setFormData(prev => ({ ...prev, frequency: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="bi_weekly">Bi-weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Delivery Time</Label>
              <Input
                type="time"
                value={formData.schedule_time}
                onChange={(e) => setFormData(prev => ({ ...prev, schedule_time: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Format</Label>
              <Select
                value={formData.format}
                onValueChange={(value) => setFormData(prev => ({ ...prev, format: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="html">HTML</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Recipients</Label>
            <div className="flex gap-2">
              <Input
                type="email"
                value={recipientInput}
                onChange={(e) => setRecipientInput(e.target.value)}
                placeholder="email@example.com"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRecipient())}
              />
              <Button type="button" onClick={addRecipient}>Add</Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.recipients?.map((email) => (
                <Badge key={email} variant="secondary" className="flex items-center gap-1">
                  {email}
                  <button
                    type="button"
                    onClick={() => removeRecipient(email)}
                    className="ml-1 hover:text-red-600"
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label>Options</Label>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <span className="text-sm">Include Charts</span>
              <Switch
                checked={formData.parameters?.include_charts}
                onCheckedChange={(checked) => setFormData(prev => ({
                  ...prev,
                  parameters: { ...prev.parameters, include_charts: checked }
                }))}
              />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <span className="text-sm">Include AI Recommendations</span>
              <Switch
                checked={formData.parameters?.include_recommendations}
                onCheckedChange={(checked) => setFormData(prev => ({
                  ...prev,
                  parameters: { ...prev.parameters, include_recommendations: checked }
                }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="bg-teal-600 hover:bg-teal-700">
              {schedule ? 'Update' : 'Create'} Schedule
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}