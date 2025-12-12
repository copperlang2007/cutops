import { useState } from 'react'
import { base44 } from '@/api/base44Client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Target, Plus, Trash2, Edit } from 'lucide-react'
import { toast } from 'sonner'
import TrainingPathwayModal from './TrainingPathwayModal';

export default function TrainingPathwayBuilder() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [selectedPathway, setSelectedPathway] = useState(null);

  const { data: plans = [] } = useQuery({
    queryKey: ['trainingPathways'],
    queryFn: () => base44.entities.TrainingPlan.filter({ plan_name: { $exists: true } }, '-created_date')
  });

  const { data: modules = [] } = useQuery({
    queryKey: ['trainingModules'],
    queryFn: () => base44.entities.TrainingModule.list()
  });

  const deletePathwayMutation = useMutation({
    mutationFn: (id) => base44.entities.TrainingPlan.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['trainingPathways']);
      toast.success('Pathway deleted');
    }
  });

  const getPathwayModules = (pathway) => {
    if (!pathway.recommended_modules) return [];
    return pathway.recommended_modules
      .map(rec => modules.find(m => m.id === rec.module_id))
      .filter(Boolean);
  };

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Learning Pathways
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Create structured training paths with multiple modules
              </p>
            </div>
            <Button
              onClick={() => {
                setSelectedPathway(null);
                setShowModal(true);
              }}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Pathway
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6">
        {plans.map((pathway) => {
          const pathwayModules = getPathwayModules(pathway);
          return (
            <Card key={pathway.id} className="border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-purple-600" />
                      {pathway.plan_name}
                    </CardTitle>
                    {pathway.target_completion_date && (
                      <p className="text-sm text-slate-500 mt-1">
                        Target: {new Date(pathway.target_completion_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedPathway(pathway);
                        setShowModal(true);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deletePathwayMutation.mutate(pathway.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pathwayModules.map((module, idx) => (
                    <div
                      key={module.id}
                      className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                    >
                      <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                        <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                          {idx + 1}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-900 dark:text-white">
                          {module.title}
                        </p>
                        <p className="text-xs text-slate-500">{module.category}</p>
                      </div>
                      <Badge variant="outline">
                        {pathway.recommended_modules[idx]?.priority || 'medium'}
                      </Badge>
                    </div>
                  ))}
                  {pathwayModules.length === 0 && (
                    <p className="text-sm text-slate-500 text-center py-4">
                      No modules in this pathway
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {showModal && (
        <TrainingPathwayModal
          pathway={selectedPathway}
          modules={modules}
          open={showModal}
          onClose={() => {
            setShowModal(false);
            setSelectedPathway(null);
          }}
        />
      )}
    </div>
  );
}