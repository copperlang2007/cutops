import { useState } from 'react'
import { base44 } from '@/api/base44Client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Zap, Plus, Edit, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

export default function FollowUpSequenceManager({ agentId }) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSequence, setEditingSequence] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    trigger_type: 'no_contact',
    trigger_conditions: { days_since_last_contact: 30 },
    steps: [{ step_number: 1, delay_days: 0, channel: 'email', subject: '', message_template: '' }],
    is_active: true,
    auto_stop_on_response: true
  });

  const queryClient = useQueryClient();

  const { data: sequences = [] } = useQuery({
    queryKey: ['followUpSequences', agentId],
    queryFn: () => base44.entities.FollowUpSequence.filter({ agent_id: agentId }),
    enabled: !!agentId
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.FollowUpSequence.create({ ...data, agent_id: agentId }),
    onSuccess: () => {
      queryClient.invalidateQueries(['followUpSequences']);
      setShowCreateModal(false);
      resetForm();
      toast.success('Sequence created');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.FollowUpSequence.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['followUpSequences']);
      setShowCreateModal(false);
      setEditingSequence(null);
      resetForm();
      toast.success('Sequence updated');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.FollowUpSequence.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['followUpSequences']);
      toast.success('Sequence deleted');
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      trigger_type: 'no_contact',
      trigger_conditions: { days_since_last_contact: 30 },
      steps: [{ step_number: 1, delay_days: 0, channel: 'email', subject: '', message_template: '' }],
      is_active: true,
      auto_stop_on_response: true
    });
  };

  const addStep = () => {
    setFormData({
      ...formData,
      steps: [...formData.steps, { 
        step_number: formData.steps.length + 1, 
        delay_days: 1, 
        channel: 'email', 
        subject: '', 
        message_template: '' 
      }]
    });
  };

  const removeStep = (index) => {
    const newSteps = formData.steps.filter((_, i) => i !== index);
    setFormData({ ...formData, steps: newSteps });
  };

  const updateStep = (index, field, value) => {
    const newSteps = [...formData.steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setFormData({ ...formData, steps: newSteps });
  };

  const handleSubmit = () => {
    if (editingSequence) {
      updateMutation.mutate({ id: editingSequence.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (sequence) => {
    setEditingSequence(sequence);
    setFormData(sequence);
    setShowCreateModal(true);
  };

  const getTriggerLabel = (type) => {
    const labels = {
      policy_renewal: 'Policy Renewal',
      no_contact: 'No Contact',
      negative_sentiment: 'Negative Sentiment',
      onboarding_completion: 'Onboarding Complete',
      anniversary: 'Anniversary',
      birthday: 'Birthday'
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Follow-Up Sequences</h2>
          <p className="text-sm text-slate-500">Automate client communication</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="bg-teal-600 hover:bg-teal-700">
          <Plus className="w-4 h-4 mr-2" />
          New Sequence
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {sequences.map((seq) => (
          <Card key={seq.id} className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{seq.name}</CardTitle>
                  <Badge className={seq.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}>
                    {seq.is_active ? 'Active' : 'Paused'}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button size="icon" variant="ghost" onClick={() => handleEdit(seq)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(seq.id)}>
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">{seq.description}</p>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <Badge variant="outline">
                  <Zap className="w-3 h-3 mr-1" />
                  {getTriggerLabel(seq.trigger_type)}
                </Badge>
                <span className="text-slate-500">{seq.steps.length} steps</span>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-3 border-t dark:border-slate-700">
                <div>
                  <p className="text-xs text-slate-500">Triggered</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">{seq.total_triggered || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Success Rate</p>
                  <p className="text-lg font-bold text-teal-600">{seq.success_rate || 0}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSequence ? 'Edit' : 'Create'} Follow-Up Sequence</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Sequence Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="30-Day Check-in"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Follow up with clients after 30 days of no contact"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Trigger Type</Label>
                <Select value={formData.trigger_type} onValueChange={(v) => setFormData({ ...formData, trigger_type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no_contact">No Contact</SelectItem>
                    <SelectItem value="policy_renewal">Policy Renewal</SelectItem>
                    <SelectItem value="negative_sentiment">Negative Sentiment</SelectItem>
                    <SelectItem value="onboarding_completion">Onboarding Complete</SelectItem>
                    <SelectItem value="birthday">Birthday</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formData.trigger_type === 'no_contact' && (
                <div>
                  <Label>Days Since Last Contact</Label>
                  <Input
                    type="number"
                    value={formData.trigger_conditions.days_since_last_contact}
                    onChange={(e) => setFormData({
                      ...formData,
                      trigger_conditions: { days_since_last_contact: parseInt(e.target.value) }
                    })}
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <Label>Auto-stop on client response</Label>
              <Switch
                checked={formData.auto_stop_on_response}
                onCheckedChange={(checked) => setFormData({ ...formData, auto_stop_on_response: checked })}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Steps</Label>
                <Button size="sm" variant="outline" onClick={addStep}>
                  <Plus className="w-3 h-3 mr-1" />
                  Add Step
                </Button>
              </div>
              {formData.steps.map((step, index) => (
                <Card key={index} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge>Step {index + 1}</Badge>
                      {formData.steps.length > 1 && (
                        <Button size="sm" variant="ghost" onClick={() => removeStep(index)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Delay (days)</Label>
                        <Input
                          type="number"
                          value={step.delay_days}
                          onChange={(e) => updateStep(index, 'delay_days', parseInt(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label>Channel</Label>
                        <Select value={step.channel} onValueChange={(v) => updateStep(index, 'channel', v)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="sms">SMS</SelectItem>
                            <SelectItem value="task">Task</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label>Subject</Label>
                      <Input
                        value={step.subject}
                        onChange={(e) => updateStep(index, 'subject', e.target.value)}
                        placeholder="Checking in on your coverage"
                      />
                    </div>
                    <div>
                      <Label>Message Template</Label>
                      <Textarea
                        value={step.message_template}
                        onChange={(e) => updateStep(index, 'message_template', e.target.value)}
                        placeholder="Hi {first_name}, just wanted to check in..."
                        rows={3}
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        Use: {'{first_name}'}, {'{client_name}'}, {'{plan_name}'}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!formData.name || formData.steps.length === 0 || createMutation.isPending || updateMutation.isPending}
              className="w-full"
            >
              {editingSequence ? 'Update' : 'Create'} Sequence
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}