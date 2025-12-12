import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, Search, Plus, Edit, Trash2, Clock, Users, Play } from 'lucide-react';
import { toast } from 'sonner';
import { useUserRole } from '@/components/shared/RoleGuard';
import { hasTrainingPermission } from './trainingPermissions';
import TrainingModuleModal from './TrainingModuleModal';
import TrainingGeneratorPanel from './TrainingGeneratorPanel';

export default function TrainingLibrary() {
  const queryClient = useQueryClient();
  const { roleType } = useUserRole();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedModule, setSelectedModule] = useState(null);

  const canCreate = hasTrainingPermission(roleType, 'modules', 'create');
  const canEdit = hasTrainingPermission(roleType, 'modules', 'edit');
  const canDelete = hasTrainingPermission(roleType, 'modules', 'delete');

  const { data: modules = [], isLoading } = useQuery({
    queryKey: ['trainingModules'],
    queryFn: () => base44.entities.TrainingModule.list('-created_date')
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ['trainingSessions'],
    queryFn: () => base44.entities.TrainingSession.list()
  });

  const deleteModuleMutation = useMutation({
    mutationFn: (id) => base44.entities.TrainingModule.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['trainingModules']);
      toast.success('Training module deleted');
    }
  });

  const filteredModules = modules.filter(m => {
    const matchesSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || m.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getModuleStats = (moduleId) => {
    const moduleSessions = sessions.filter(s => s.module_id === moduleId);
    const completedSessions = moduleSessions.filter(s => s.completed);
    return {
      totalSessions: moduleSessions.length,
      completedSessions: completedSessions.length,
      averageScore: completedSessions.length > 0
        ? Math.round(completedSessions.reduce((sum, s) => sum + (s.score || 0), 0) / completedSessions.length)
        : 0
    };
  };

  const getCategoryColor = (category) => {
    const colors = {
      sales: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      compliance: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      product: 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400',
      communication: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      technical: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
    };
    return colors[category] || 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="space-y-6">
      {/* AI Training Generator */}
      {canCreate && <TrainingGeneratorPanel />}

      {/* Header */}
      <Card className="clay-morphism border-0">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search training modules..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="sales">Sales</SelectItem>
                <SelectItem value="compliance">Compliance</SelectItem>
                <SelectItem value="product">Product Knowledge</SelectItem>
                <SelectItem value="communication">Communication</SelectItem>
                <SelectItem value="technical">Technical</SelectItem>
              </SelectContent>
            </Select>
            {canCreate && (
              <Button
                onClick={() => {
                  setSelectedModule(null);
                  setShowModal(true);
                }}
                className="bg-slate-900 hover:bg-black"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Module
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredModules.map((module) => {
          const stats = getModuleStats(module.id);
          return (
            <Card key={module.id} className="clay-morphism border-0">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{module.title}</CardTitle>
                    <Badge className={`mt-2 ${getCategoryColor(module.category)}`}>
                      {module.category}
                    </Badge>
                  </div>
                  {(canEdit || canDelete) && (
                    <div className="flex gap-1">
                      {canEdit && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedModule(module);
                            setShowModal(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteModuleMutation.mutate(module.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3">
                  {module.description}
                </p>

                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{module.duration_minutes || 30} min</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    <span>{stats.totalSessions} enrolled</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Play className="w-3 h-3" />
                    <span>{stats.completedSessions} completed</span>
                  </div>
                </div>

                {stats.averageScore > 0 && (
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-500">Avg Score</span>
                      <span className="font-medium">{stats.averageScore}%</span>
                    </div>
                    <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-slate-900"
                        style={{ width: `${stats.averageScore}%` }}
                      />
                    </div>
                  </div>
                )}

                {module.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {module.tags.slice(0, 3).map((tag, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredModules.length === 0 && (
        <Card className="border-0 shadow-lg">
          <CardContent className="py-12 text-center">
            <BookOpen className="w-12 h-12 mx-auto text-slate-400 mb-3" />
            <p className="text-slate-500">No training modules found</p>
          </CardContent>
        </Card>
      )}

      {showModal && (
        <TrainingModuleModal
          module={selectedModule}
          open={showModal}
          onClose={() => {
            setShowModal(false);
            setSelectedModule(null);
          }}
        />
      )}
    </div>
  );
}