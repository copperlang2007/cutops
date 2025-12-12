import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function TrainingModuleModal({ module, open, onClose }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'sales',
    duration_minutes: 30,
    content: '',
    learning_objectives: [],
    tags: [],
    is_active: true
  });

  useEffect(() => {
    if (module) {
      setFormData(module);
    }
  }, [module]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (module) {
        return await base44.entities.TrainingModule.update(module.id, data);
      }
      return await base44.entities.TrainingModule.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['trainingModules']);
      toast.success(module ? 'Module updated' : 'Module created');
      onClose();
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{module ? 'Edit Training Module' : 'Create Training Module'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Title *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div>
            <Label>Category *</Label>
            <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sales">Sales</SelectItem>
                <SelectItem value="compliance">Compliance</SelectItem>
                <SelectItem value="product">Product Knowledge</SelectItem>
                <SelectItem value="communication">Communication</SelectItem>
                <SelectItem value="technical">Technical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div>
            <Label>Duration (minutes)</Label>
            <Input
              type="number"
              value={formData.duration_minutes}
              onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
            />
          </div>

          <div>
            <Label>Content (Markdown supported)</Label>
            <Textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={8}
              placeholder="Enter training content..."
            />
          </div>

          <div>
            <Label>Learning Objectives (comma-separated)</Label>
            <Input
              value={formData.learning_objectives?.join(', ') || ''}
              onChange={(e) => setFormData({ 
                ...formData, 
                learning_objectives: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
              })}
              placeholder="Objective 1, Objective 2, Objective 3"
            />
          </div>

          <div>
            <Label>Tags (comma-separated)</Label>
            <Input
              value={formData.tags?.join(', ') || ''}
              onChange={(e) => setFormData({ 
                ...formData, 
                tags: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
              })}
              placeholder="tag1, tag2, tag3"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving...' : 'Save Module'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}