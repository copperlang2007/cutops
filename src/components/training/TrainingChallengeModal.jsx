import { useState, useEffect } from 'react'
import { base44 } from '@/api/base44Client'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

export default function TrainingChallengeModal({ challenge, agents, open, onClose }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    challenge_type: 'module_completion',
    target_metric: {
      target_value: 5
    },
    start_date: '',
    end_date: '',
    rewards: {
      points: 500,
      badge_name: '',
      badge_icon: '🏆'
    },
    is_active: true
  });

  const { data: modules = [] } = useQuery({
    queryKey: ['trainingModules'],
    queryFn: () => base44.entities.TrainingModule.list()
  });

  useEffect(() => {
    if (challenge) {
      setFormData(challenge);
    }
  }, [challenge]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (challenge) {
        return await base44.entities.TrainingChallenge.update(challenge.id, data);
      }
      return await base44.entities.TrainingChallenge.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['trainingChallenges']);
      toast.success(challenge ? 'Challenge updated' : 'Challenge created');
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
          <DialogTitle>{challenge ? 'Edit Challenge' : 'Create Training Challenge'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Challenge Title *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Complete 5 Modules in 30 Days"
              required
            />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Challenge Type *</Label>
              <Select
                value={formData.challenge_type}
                onValueChange={(v) => setFormData({ ...formData, challenge_type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="module_completion">Module Completion</SelectItem>
                  <SelectItem value="pathway_completion">Pathway Completion</SelectItem>
                  <SelectItem value="high_score">High Score Achievement</SelectItem>
                  <SelectItem value="speed_completion">Speed Completion</SelectItem>
                  <SelectItem value="streak">Learning Streak</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Target Value *</Label>
              <Input
                type="number"
                value={formData.target_metric?.target_value || 5}
                onChange={(e) => setFormData({
                  ...formData,
                  target_metric: { ...formData.target_metric, target_value: parseInt(e.target.value) }
                })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Start Date *</Label>
              <Input
                type="date"
                value={formData.start_date?.split('T')[0] || ''}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
              />
            </div>

            <div>
              <Label>End Date *</Label>
              <Input
                type="date"
                value={formData.end_date?.split('T')[0] || ''}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">Rewards</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Points</Label>
                <Input
                  type="number"
                  value={formData.rewards?.points || 0}
                  onChange={(e) => setFormData({
                    ...formData,
                    rewards: { ...formData.rewards, points: parseInt(e.target.value) }
                  })}
                />
              </div>

              <div>
                <Label>Badge Icon</Label>
                <Input
                  value={formData.rewards?.badge_icon || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    rewards: { ...formData.rewards, badge_icon: e.target.value }
                  })}
                  placeholder="🏆"
                />
              </div>
            </div>

            <div className="mt-3">
              <Label>Badge Name</Label>
              <Input
                value={formData.rewards?.badge_name || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  rewards: { ...formData.rewards, badge_name: e.target.value }
                })}
                placeholder="e.g., Training Superstar"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving...' : 'Save Challenge'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}