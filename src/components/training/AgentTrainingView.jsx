import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, CheckCircle, Clock, AlertCircle, Play, Award, Trophy, Target } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import TrainingModuleViewer from './TrainingModuleViewer';
import CertificateViewer from './CertificateViewer';

export default function AgentTrainingView({ agentId }) {
  const [selectedModule, setSelectedModule] = useState(null);

  const { data: plans = [] } = useQuery({
    queryKey: ['trainingPlans', agentId],
    queryFn: () => base44.entities.TrainingPlan.filter({ agent_id: agentId })
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ['trainingSessions', agentId],
    queryFn: () => base44.entities.TrainingSession.filter({ agent_id: agentId }, '-created_date')
  });

  const { data: allModules = [] } = useQuery({
    queryKey: ['trainingModules'],
    queryFn: () => base44.entities.TrainingModule.list()
  });

  const { data: achievements = [] } = useQuery({
    queryKey: ['agentAchievements', agentId],
    queryFn: () => base44.entities.AgentAchievement.filter({ agent_id: agentId })
  });

  const { data: agentPoints = [] } = useQuery({
    queryKey: ['agentPoints', agentId],
    queryFn: () => base44.entities.AgentPoints.filter({ agent_id: agentId })
  });

  const { data: challenges = [] } = useQuery({
    queryKey: ['trainingChallenges'],
    queryFn: () => base44.entities.TrainingChallenge.list()
  });

  const activePlan = plans.find(p => ['active', 'in_progress'].includes(p.status));

  const assignedModuleIds = new Set();
  plans.forEach(plan => {
    plan.recommended_modules?.forEach(mod => assignedModuleIds.add(mod.module_id));
  });

  const assignedModules = allModules.filter(m => assignedModuleIds.has(m.id));
  const completedSessions = sessions.filter(s => s.completed);
  const inProgressSessions = sessions.filter(s => !s.completed);

  const getModuleSession = (moduleId) => {
    return sessions.find(s => s.module_id === moduleId);
  };

  const currentPoints = agentPoints[0]?.total_points || 0;
  const activeChallenges = challenges.filter(c => {
    const now = new Date();
    return c.is_active && new Date(c.start_date) <= now && new Date(c.end_date) >= now;
  });
  const myChallenges = activeChallenges.filter(c => 
    c.participants?.some(p => p.agent_id === agentId)
  );

  return (
    <div className="space-y-6">
      {/* Points & Achievements Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-0 shadow-lg bg-gradient-to-r from-slate-900 to-black text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-100 text-sm">Total Points</p>
                <p className="text-4xl font-bold">{currentPoints}</p>
              </div>
              <Award className="w-12 h-12 text-slate-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-r from-amber-600 to-orange-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-sm">Badges Earned</p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-4xl font-bold">{achievements.length}</p>
                  <div className="flex -space-x-1">
                    {achievements.slice(0, 3).map((ach, idx) => (
                      <div key={idx} className="text-2xl">{ach.badge_icon}</div>
                    ))}
                  </div>
                </div>
              </div>
              <Trophy className="w-12 h-12 text-amber-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Challenges */}
      {myChallenges.length > 0 && (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-slate-900" />
              Active Challenges
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {myChallenges.map((challenge) => {
              const myProgress = challenge.participants?.find(p => p.agent_id === agentId);
              return (
                <div key={challenge.id} className="p-3 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900/20 dark:to-slate-800/20 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-slate-900 dark:text-white">{challenge.title}</h4>
                    {myProgress?.completed && (
                      <Badge className="bg-green-100 text-green-700">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Completed
                      </Badge>
                    )}
                  </div>
                  <Progress value={myProgress?.progress || 0} className="mb-2" />
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">{myProgress?.progress || 0}% complete</span>
                    {challenge.rewards?.points && (
                      <span className="text-slate-900 font-medium">
                        Reward: {challenge.rewards.points} pts
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Assigned</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {assignedModules.length}
                </p>
              </div>
              <BookOpen className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">In Progress</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {inProgressSessions.length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Completed</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {completedSessions.length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Avg Score</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {completedSessions.length > 0
                    ? Math.round(completedSessions.reduce((sum, s) => sum + (s.score || 0), 0) / completedSessions.length)
                    : 0}%
                </p>
              </div>
              <Award className="w-8 h-8 text-slate-900" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Learning Plan */}
      {activePlan && (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Active Learning Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg text-slate-900 dark:text-white mb-2">
                  {activePlan.plan_name}
                </h3>
                <div className="flex items-center gap-2 mb-3">
                  <Progress value={activePlan.completion_percentage || 0} className="flex-1" />
                  <span className="text-sm font-medium">{activePlan.completion_percentage || 0}%</span>
                </div>
              </div>
              {activePlan.ai_insights && (
                <p className="text-sm text-slate-600 dark:text-slate-400 italic">
                  {activePlan.ai_insights}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="assigned" className="space-y-4">
        <TabsList>
          <TabsTrigger value="assigned">Assigned Training</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="certificates">
            <Award className="w-4 h-4 mr-2" />
            Certificates
          </TabsTrigger>
          <TabsTrigger value="library">Browse Library</TabsTrigger>
        </TabsList>

        <TabsContent value="assigned" className="space-y-4">
          {assignedModules.map((module) => {
            const session = getModuleSession(module.id);
            return (
              <Card key={module.id} className="border-0 shadow-lg">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg text-slate-900 dark:text-white">
                          {module.title}
                        </h3>
                        {session?.completed && (
                          <Badge className="bg-green-100 text-green-700">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Completed
                          </Badge>
                        )}
                        {session && !session.completed && (
                          <Badge className="bg-amber-100 text-amber-700">
                            <Clock className="w-3 h-3 mr-1" />
                            In Progress
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                        {module.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span>{module.duration_minutes} minutes</span>
                        <span>•</span>
                        <span>{module.category}</span>
                      </div>
                    </div>
                    <Button
                      onClick={() => setSelectedModule(module)}
                      className="bg-slate-900 hover:bg-black"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      {session?.completed ? 'Review' : session ? 'Continue' : 'Start'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {assignedModules.length === 0 && (
            <Card className="border-0 shadow-lg">
              <CardContent className="py-12 text-center">
                <AlertCircle className="w-12 h-12 mx-auto text-slate-400 mb-3" />
                <p className="text-slate-500">No training assigned yet</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completedSessions.map((session) => {
            const module = allModules.find(m => m.id === session.module_id);
            if (!module) return null;
            return (
              <Card key={session.id} className="border-0 shadow-lg">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-slate-900 dark:text-white mb-2">
                        {module.title}
                      </h3>
                      <div className="flex items-center gap-4 text-sm">
                        <Badge className="bg-green-100 text-green-700">
                          Score: {session.score || 0}%
                        </Badge>
                        <span className="text-slate-500">
                          Completed {new Date(session.completed_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedModule(module)}
                    >
                      Review
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="certificates">
          <CertificateViewer agentId={agentId} />
        </TabsContent>

        <TabsContent value="library" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allModules.filter(m => !assignedModuleIds.has(m.id)).map((module) => (
              <Card key={module.id} className="border-0 shadow-lg">
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                    {module.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                    {module.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">{module.category}</Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedModule(module)}
                    >
                      View
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {selectedModule && (
        <TrainingModuleViewer
          module={selectedModule}
          agentId={agentId}
          open={!!selectedModule}
          onClose={() => setSelectedModule(null)}
        />
      )}
    </div>
  );
}