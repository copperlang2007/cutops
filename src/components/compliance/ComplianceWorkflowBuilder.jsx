import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Zap, Plus, Trash2, Edit, Play, Pause } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function ComplianceWorkflowBuilder() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState(null);
  const [workflowForm, setWorkflowForm] = useState({
    name: '',
    description: '',
    trigger_type: 'license_expiring_30_days',
    trigger_conditions: { days_threshold: 30 },
    actions: [],
    is_active: true,
    auto_execute: true
  });

  const { data: workflows = [] } = useQuery({
    queryKey: ['complianceWorkflows'],
    queryFn: () => base44.entities.ComplianceWorkflow.list('-created_date')
  });

  const createWorkflowMutation = useMutation({
    mutationFn: (data) => base44.entities.ComplianceWorkflow.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['complianceWorkflows']);
      setShowModal(false);
      resetForm();
      toast.success('Workflow created');
    }
  });

  const updateWorkflowMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ComplianceWorkflow.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['complianceWorkflows']);
      toast.success('Workflow updated');
    }
  });

  const deleteWorkflowMutation = useMutation({
    mutationFn: (id) => base44.entities.ComplianceWorkflow.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['complianceWorkflows']);
      toast.success('Workflow deleted');
    }
  });

  const resetForm = () => {
    setWorkflowForm({
      name: '',
      description: '',
      trigger_type: 'license_expiring_30_days',
      trigger_conditions: { days_threshold: 30 },
      actions: [],
      is_active: true,
      auto_execute: true
    });
    setEditingWorkflow(null);
  };

  const addAction = () => {
    setWorkflowForm({
      ...workflowForm,
      actions: [
        ...workflowForm.actions,
        { action_type: 'create_alert', delay_days: 0, config: {} }
      ]
    });
  };

  const removeAction = (index) => {
    setWorkflowForm({
      ...workflowForm,
      actions: workflowForm.actions.filter((_, idx) => idx !== index)
    });
  };

  const updateAction = (index, field, value) => {
    const newActions = [...workflowForm.actions];
    newActions[index] = { ...newActions[index], [field]: value };
    setWorkflowForm({ ...workflowForm, actions: newActions });
  };

  const handleSubmit = () => {
    if (editingWorkflow) {
      updateWorkflowMutation.mutate({ id: editingWorkflow.id, data: workflowForm });
    } else {
      createWorkflowMutation.mutate(workflowForm);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="clay-morphism border-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl clay-morphism bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle>Automated Workflows</CardTitle>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Set up automated actions for compliance issues
                </p>
              </div>
            </div>
            <Button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="clay-morphism bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white shadow-xl shadow-indigo-500/40 border-0"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Workflow
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {workflows.map((workflow, idx) => (
              <motion.div
                key={workflow.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ y: -2 }}
              >
                <Card className="clay-subtle border-0">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-slate-800 dark:text-white">{workflow.name}</h3>
                          <Badge variant="outline" className={workflow.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}>
                            {workflow.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{workflow.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {workflow.trigger_type.replace(/_/g, ' ')}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {workflow.actions?.length || 0} actions
                          </Badge>
                          {workflow.execution_count > 0 && (
                            <Badge variant="outline" className="text-xs">
                              Executed {workflow.execution_count} times
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => updateWorkflowMutation.mutate({
                            id: workflow.id,
                            data: { is_active: !workflow.is_active }
                          })}
                        >
                          {workflow.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteWorkflowMutation.mutate(workflow.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Workflow Builder Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Compliance Workflow</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium">Workflow Name</label>
              <Input
                value={workflowForm.name}
                onChange={(e) => setWorkflowForm({ ...workflowForm, name: e.target.value })}
                placeholder="e.g., License Expiration Alerts"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={workflowForm.description}
                onChange={(e) => setWorkflowForm({ ...workflowForm, description: e.target.value })}
                placeholder="Describe what this workflow does..."
                rows={2}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Trigger</label>
              <Select 
                value={workflowForm.trigger_type}
                onValueChange={(value) => setWorkflowForm({ ...workflowForm, trigger_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="license_expiring_30_days">License Expiring (30 days)</SelectItem>
                  <SelectItem value="license_expiring_60_days">License Expiring (60 days)</SelectItem>
                  <SelectItem value="policy_expiring_30_days">Policy Expiring (30 days)</SelectItem>
                  <SelectItem value="appointment_expiring">Appointment Expiring</SelectItem>
                  <SelectItem value="missing_client_data">Missing Client Data</SelectItem>
                  <SelectItem value="document_missing">Document Missing</SelectItem>
                  <SelectItem value="ce_credits_due">CE Credits Due</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Auto Execute</label>
              <Switch
                checked={workflowForm.auto_execute}
                onCheckedChange={(checked) => setWorkflowForm({ ...workflowForm, auto_execute: checked })}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Actions</label>
                <Button size="sm" onClick={addAction} variant="outline">
                  <Plus className="w-4 h-4 mr-1" />
                  Add Action
                </Button>
              </div>
              
              <div className="space-y-2">
                {workflowForm.actions.map((action, idx) => (
                  <div key={idx} className="p-3 border dark:border-slate-700 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Select
                        value={action.action_type}
                        onValueChange={(value) => updateAction(idx, 'action_type', value)}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="create_alert">Create Alert</SelectItem>
                          <SelectItem value="create_task">Create Task</SelectItem>
                          <SelectItem value="send_email">Send Email</SelectItem>
                          <SelectItem value="escalate">Escalate</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        value={action.delay_days}
                        onChange={(e) => updateAction(idx, 'delay_days', parseInt(e.target.value))}
                        placeholder="Delay (days)"
                        className="w-32"
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeAction(idx)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!workflowForm.name || workflowForm.actions.length === 0}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {editingWorkflow ? 'Update' : 'Create'} Workflow
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}