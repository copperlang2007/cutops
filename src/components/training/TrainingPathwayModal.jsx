import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X } from 'lucide-react';
import { toast } from 'sonner';

export default function TrainingPathwayModal({ pathway, modules, open, onClose }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    plan_name: '',
    target_completion_date: '',
    recommended_modules: []
  });

  useEffect(() => {
    if (pathway) {
      setFormData({
        plan_name: pathway.plan_name || '',
        target_completion_date: pathway.target_completion_date || '',
        recommended_modules: pathway.recommended_modules || []
      });
    }
  }, [pathway]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (pathway) {
        return await base44.entities.TrainingPlan.update(pathway.id, data);
      }
      return await base44.entities.TrainingPlan.create({
        ...data,
        status: 'active'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['trainingPathways']);
      toast.success(pathway ? 'Pathway updated' : 'Pathway created');
      onClose();
    }
  });

  const addModule = () => {
    setFormData({
      ...formData,
      recommended_modules: [
        ...formData.recommended_modules,
        { module_id: '', priority: 'medium' }
      ]
    });
  };

  const removeModule = (index) => {
    const newModules = [...formData.recommended_modules];
    newModules.splice(index, 1);
    setFormData({ ...formData, recommended_modules: newModules });
  };

  const updateModule = (index, field, value) => {
    const newModules = [...formData.recommended_modules];
    newModules[index] = { ...newModules[index], [field]: value };
    setFormData({ ...formData, recommended_modules: newModules });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{pathway ? 'Edit Pathway' : 'Create Learning Pathway'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Pathway Name *</Label>
            <Input
              value={formData.plan_name}
              onChange={(e) => setFormData({ ...formData, plan_name: e.target.value })}
              placeholder="e.g., New Agent Onboarding"
              required
            />
          </div>

          <div>
            <Label>Target Completion Date</Label>
            <Input
              type="date"
              value={formData.target_completion_date}
              onChange={(e) => setFormData({ ...formData, target_completion_date: e.target.value })}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Training Modules</Label>
              <Button type="button" size="sm" onClick={addModule}>
                <Plus className="w-4 h-4 mr-1" />
                Add Module
              </Button>
            </div>
            <div className="space-y-3">
              {formData.recommended_modules.map((mod, idx) => (
                <div key={idx} className="flex gap-2">
                  <div className="flex-1">
                    <Select
                      value={mod.module_id}
                      onValueChange={(v) => updateModule(idx, 'module_id', v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select module" />
                      </SelectTrigger>
                      <SelectContent>
                        {modules.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Select
                    value={mod.priority}
                    onValueChange={(v) => updateModule(idx, 'priority', v)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => removeModule(idx)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving...' : 'Save Pathway'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}