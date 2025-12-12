import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, BookOpen, Clock, CheckCircle2, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { useUserRole } from '../shared/RoleGuard';

export default function RequiredTrainingModal({ open, onClose, training = [], insightId, agentId }) {
  const queryClient = useQueryClient();
  const { isSuperAdmin, isAgencyAdmin } = useUserRole();
  const isAdmin = isSuperAdmin || isAgencyAdmin;
  
  const [editMode, setEditMode] = useState(false);
  const [trainingItems, setTrainingItems] = useState(training);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const updateTrainingMutation = useMutation({
    mutationFn: async (updatedTraining) => {
      const updated = await base44.entities.AgentPerformanceInsight.update(insightId, {
        recommended_training: updatedTraining
      });
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['performanceInsights']);
      toast.success('Training requirements updated');
      setEditMode(false);
    }
  });

  const createTaskMutation = useMutation({
    mutationFn: async (trainingItem) => {
      const dueDate = trainingItem.due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      return await base44.entities.Task.create({
        title: `Complete Training: ${trainingItem.title}`,
        description: `Required training module: ${trainingItem.title}`,
        task_type: 'onboarding',
        priority: trainingItem.is_required ? 'high' : 'medium',
        status: 'pending',
        agent_id: agentId,
        due_date: typeof dueDate === 'string' ? dueDate : dueDate.toISOString().split('T')[0],
        category: 'compliance',
        auto_generated: true
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks']);
      toast.success('Training task created');
    }
  });

  const toggleRequired = (index) => {
    const updated = [...trainingItems];
    updated[index] = {
      ...updated[index],
      is_required: !updated[index].is_required,
      marked_by: user?.email
    };
    setTrainingItems(updated);
  };

  const updateDueDate = (index, date) => {
    const updated = [...trainingItems];
    updated[index] = { ...updated[index], due_date: date };
    setTrainingItems(updated);
  };

  const handleSave = () => {
    updateTrainingMutation.mutate(trainingItems);
  };

  const handleCreateTask = (item) => {
    createTaskMutation.mutate(item);
  };

  const requiredTraining = trainingItems.filter(t => t.is_required);
  const optionalTraining = trainingItems.filter(t => !t.is_required);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-700 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'medium': return 'bg-amber-100 text-amber-700 border-amber-300';
      case 'low': return 'bg-blue-100 text-blue-700 border-blue-300';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-purple-600" />
              Recommended Training
            </DialogTitle>
            {isAdmin && (
              <Button
                variant={editMode ? "default" : "outline"}
                size="sm"
                onClick={() => editMode ? handleSave() : setEditMode(true)}
                disabled={updateTrainingMutation.isPending}
              >
                {editMode ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    Admin: Edit Requirements
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Required Training */}
          {requiredTraining.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  Required Training ({requiredTraining.length})
                </h3>
              </div>
              <div className="space-y-3">
                {requiredTraining.map((item, idx) => {
                  const originalIndex = trainingItems.findIndex(t => t === item);
                  return (
                    <div key={idx} className="p-4 border-2 border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-900/20">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-slate-900 dark:text-white">{item.title}</p>
                            <Badge className="bg-red-600 text-white">Required</Badge>
                            {item.priority && (
                              <Badge className={getPriorityColor(item.priority)}>{item.priority}</Badge>
                            )}
                          </div>
                          {item.category && (
                            <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                              Category: {item.category}
                            </p>
                          )}
                          {editMode && isAdmin && (
                            <div className="mt-2 space-y-2">
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  id={`required-${idx}`}
                                  checked={item.is_required}
                                  onCheckedChange={() => toggleRequired(originalIndex)}
                                />
                                <Label htmlFor={`required-${idx}`} className="text-sm">
                                  Mark as Required
                                </Label>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-slate-400" />
                                <Input
                                  type="date"
                                  value={item.due_date || ''}
                                  onChange={(e) => updateDueDate(originalIndex, e.target.value)}
                                  className="text-sm"
                                />
                              </div>
                            </div>
                          )}
                          {!editMode && item.due_date && (
                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                              <Clock className="w-3 h-3 inline mr-1" />
                              Due: {new Date(item.due_date).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        {!editMode && (
                          <Button
                            size="sm"
                            onClick={() => handleCreateTask(item)}
                            disabled={createTaskMutation.isPending}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Create Task
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Optional Training */}
          {optionalTraining.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  Recommended Training ({optionalTraining.length})
                </h3>
              </div>
              <div className="space-y-3">
                {optionalTraining.map((item, idx) => {
                  const originalIndex = trainingItems.findIndex(t => t === item);
                  return (
                    <div key={idx} className="p-4 border dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-slate-900 dark:text-white">{item.title}</p>
                            <Badge variant="outline">Optional</Badge>
                            {item.priority && (
                              <Badge className={getPriorityColor(item.priority)}>{item.priority}</Badge>
                            )}
                          </div>
                          {item.category && (
                            <p className="text-xs text-slate-600 dark:text-slate-400">
                              Category: {item.category}
                            </p>
                          )}
                          {editMode && isAdmin && (
                            <div className="mt-2 space-y-2">
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  id={`required-opt-${idx}`}
                                  checked={item.is_required}
                                  onCheckedChange={() => toggleRequired(originalIndex)}
                                />
                                <Label htmlFor={`required-opt-${idx}`} className="text-sm">
                                  Mark as Required
                                </Label>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-slate-400" />
                                <Input
                                  type="date"
                                  value={item.due_date || ''}
                                  onChange={(e) => updateDueDate(originalIndex, e.target.value)}
                                  className="text-sm"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                        {!editMode && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCreateTask(item)}
                            disabled={createTaskMutation.isPending}
                          >
                            Create Task
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {trainingItems.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              <BookOpen className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>No training recommendations available</p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}