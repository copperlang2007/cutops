import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Target, Plus, Edit, Trash2, Users, Calendar, Award } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import TrainingChallengeModal from './TrainingChallengeModal';

export default function TrainingChallengeManager() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState(null);

  const { data: challenges = [] } = useQuery({
    queryKey: ['trainingChallenges'],
    queryFn: () => base44.entities.TrainingChallenge.list('-created_date')
  });

  const { data: agents = [] } = useQuery({
    queryKey: ['agents'],
    queryFn: () => base44.entities.Agent.list()
  });

  const deleteChallengeMutation = useMutation({
    mutationFn: (id) => base44.entities.TrainingChallenge.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['trainingChallenges']);
      toast.success('Challenge deleted');
    }
  });

  const getChallengeStatus = (challenge) => {
    const now = new Date();
    const start = new Date(challenge.start_date);
    const end = new Date(challenge.end_date);

    if (now < start) return { label: 'Upcoming', color: 'bg-blue-100 text-blue-700' };
    if (now > end) return { label: 'Ended', color: 'bg-slate-100 text-slate-700' };
    return { label: 'Active', color: 'bg-green-100 text-green-700' };
  };

  const getChallengeStats = (challenge) => {
    const participants = challenge.participants || [];
    const completed = participants.filter(p => p.completed).length;
    const avgProgress = participants.length > 0
      ? Math.round(participants.reduce((sum, p) => sum + (p.progress || 0), 0) / participants.length)
      : 0;

    return { totalParticipants: participants.length, completed, avgProgress };
  };

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Training Challenges
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Create competitions and challenges to motivate training completion
              </p>
            </div>
            <Button
              onClick={() => {
                setSelectedChallenge(null);
                setShowModal(true);
              }}
              className="bg-gradient-to-r from-purple-600 to-blue-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Challenge
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {challenges.map((challenge) => {
          const status = getChallengeStatus(challenge);
          const stats = getChallengeStats(challenge);

          return (
            <Card key={challenge.id} className="border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg">{challenge.title}</CardTitle>
                      <Badge className={status.color}>{status.label}</Badge>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {challenge.description}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedChallenge(challenge);
                        setShowModal(true);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteChallengeMutation.mutate(challenge.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 text-sm text-slate-600">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {new Date(challenge.start_date).toLocaleDateString()} - {new Date(challenge.end_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 text-sm">
                    <Users className="w-4 h-4 text-slate-500" />
                    <span className="font-medium">{stats.totalParticipants}</span>
                    <span className="text-slate-500">participants</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <Target className="w-4 h-4 text-green-500" />
                    <span className="font-medium">{stats.completed}</span>
                    <span className="text-slate-500">completed</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-500">Average Progress</span>
                    <span className="font-medium">{stats.avgProgress}%</span>
                  </div>
                  <Progress value={stats.avgProgress} className="h-2" />
                </div>

                {challenge.rewards && (
                  <div className="p-3 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg">
                    <div className="flex items-center gap-2 text-sm">
                      <Award className="w-4 h-4 text-purple-600" />
                      <span className="font-medium text-slate-900 dark:text-white">Rewards:</span>
                      {challenge.rewards.points && (
                        <Badge variant="outline">{challenge.rewards.points} points</Badge>
                      )}
                      {challenge.rewards.badge_name && (
                        <Badge variant="outline">
                          {challenge.rewards.badge_icon} {challenge.rewards.badge_name}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {challenges.length === 0 && (
        <Card className="border-0 shadow-lg">
          <CardContent className="py-12 text-center">
            <Target className="w-12 h-12 mx-auto text-slate-400 mb-3" />
            <p className="text-slate-500">No challenges created yet</p>
          </CardContent>
        </Card>
      )}

      {showModal && (
        <TrainingChallengeModal
          challenge={selectedChallenge}
          agents={agents}
          open={showModal}
          onClose={() => {
            setShowModal(false);
            setSelectedChallenge(null);
          }}
        />
      )}
    </div>
  );
}