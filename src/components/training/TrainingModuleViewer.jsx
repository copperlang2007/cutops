import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';

export default function TrainingModuleViewer({ module, agentId, open, onClose }) {
  const queryClient = useQueryClient();
  const [score, setScore] = useState(0);

  const completeTrainingMutation = useMutation({
    mutationFn: async () => {
      const session = await base44.entities.TrainingSession.create({
        agent_id: agentId,
        module_id: module.id,
        score: 100,
        completed: true,
        completed_date: new Date().toISOString()
      });

      // Award points for completion
      const basePoints = 50;
      const categoryBonus = module.category === 'compliance' ? 25 : 0;
      const totalPoints = basePoints + categoryBonus;

      await base44.functions.invoke('awardTrainingPoints', {
        agent_id: agentId,
        points: totalPoints,
        action: 'module_completion',
        details: `Completed: ${module.title}`
      });

      return session;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['trainingSessions']);
      queryClient.invalidateQueries(['trainingPlans']);
      queryClient.invalidateQueries(['agentPoints']);
      queryClient.invalidateQueries(['agentAchievements']);
      toast.success('Training completed! Points awarded! 🎉');
      onClose();
    }
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {module.title}
            <Badge className="ml-2">{module.category}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {module.description && (
            <p className="text-slate-600 dark:text-slate-400">{module.description}</p>
          )}

          <div className="flex items-center gap-4 text-sm text-slate-500">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{module.duration_minutes} minutes</span>
            </div>
          </div>

          {module.learning_objectives?.length > 0 && (
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                Learning Objectives:
              </h3>
              <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-400">
                {module.learning_objectives.map((obj, idx) => (
                  <li key={idx}>{obj}</li>
                ))}
              </ul>
            </div>
          )}

          {module.content && (
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <ReactMarkdown>{module.content}</ReactMarkdown>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button
              onClick={() => completeTrainingMutation.mutate()}
              disabled={completeTrainingMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              {completeTrainingMutation.isPending ? 'Marking Complete...' : 'Mark as Complete'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}