import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, Target, PlayCircle, TrendingUp, Award } from 'lucide-react';
import PersonalizedTrainingPlan from '../components/training/PersonalizedTrainingPlan';
import InteractiveSimulation from '../components/training/InteractiveSimulation';
import RoleGuard from '../components/shared/RoleGuard';

export default function AgentTraining() {
  const [selectedSimulation, setSelectedSimulation] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: agents = [] } = useQuery({
    queryKey: ['agents'],
    queryFn: () => base44.entities.Agent.list()
  });

  const currentAgent = agents.find(a => a.email === user?.email) || agents[0];

  const { data: simulations = [] } = useQuery({
    queryKey: ['trainingSimulations'],
    queryFn: () => base44.entities.TrainingSimulation.filter({ is_active: true })
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ['trainingSessions', currentAgent?.id],
    queryFn: () => base44.entities.TrainingSession.filter({ agent_id: currentAgent.id }, '-created_date'),
    enabled: !!currentAgent
  });

  const completedSessions = sessions.filter(s => s.completed);
  const avgScore = completedSessions.length > 0
    ? completedSessions.reduce((sum, s) => sum + (s.score || 0), 0) / completedSessions.length
    : 0;

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-700';
      case 'intermediate': return 'bg-amber-100 text-amber-700';
      case 'advanced': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  if (selectedSimulation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <InteractiveSimulation
            simulation={selectedSimulation}
            agentId={currentAgent?.id}
            onComplete={() => setSelectedSimulation(null)}
          />
        </div>
      </div>
    );
  }

  return (
    <RoleGuard>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Agent Training</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              AI-powered personalized training and skill development
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <Card className="border-0 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Completed</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{completedSessions.length}</p>
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
                    <p className="text-2xl font-bold text-purple-600">{avgScore.toFixed(0)}%</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">In Progress</p>
                    <p className="text-2xl font-bold text-amber-600">
                      {sessions.filter(s => !s.completed).length}
                    </p>
                  </div>
                  <PlayCircle className="w-8 h-8 text-amber-600" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Available</p>
                    <p className="text-2xl font-bold text-blue-600">{simulations.length}</p>
                  </div>
                  <Brain className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="plan" className="space-y-6">
            <TabsList>
              <TabsTrigger value="plan">
                <Target className="w-4 h-4 mr-2" />
                My Training Plan
              </TabsTrigger>
              <TabsTrigger value="simulations">
                <PlayCircle className="w-4 h-4 mr-2" />
                Simulations
              </TabsTrigger>
              <TabsTrigger value="progress">
                <Award className="w-4 h-4 mr-2" />
                My Progress
              </TabsTrigger>
            </TabsList>

            <TabsContent value="plan">
              {currentAgent && (
                <PersonalizedTrainingPlan
                  agentId={currentAgent.id}
                  onSimulationSelect={(sim) => {
                    const fullSim = simulations.find(s => s.title === sim.title);
                    if (fullSim) setSelectedSimulation(fullSim);
                  }}
                />
              )}
            </TabsContent>

            <TabsContent value="simulations">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {simulations.map((sim) => (
                  <Card
                    key={sim.id}
                    className="border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
                    onClick={() => setSelectedSimulation(sim)}
                  >
                    <CardContent className="pt-6 space-y-3">
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                          {sim.title}
                        </h3>
                        <Badge className={getDifficultyColor(sim.difficulty)}>
                          {sim.difficulty}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {sim.description}
                      </p>
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>{sim.completion_count || 0} completions</span>
                        {sim.average_score > 0 && (
                          <span className="flex items-center gap-1">
                            <Award className="w-3 h-3" />
                            {sim.average_score.toFixed(0)}% avg
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="progress">
              <div className="space-y-4">
                {completedSessions.length === 0 ? (
                  <Card className="border-0 shadow-sm">
                    <CardContent className="py-12 text-center text-slate-500">
                      <PlayCircle className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                      <p>No completed sessions yet. Start your first simulation!</p>
                    </CardContent>
                  </Card>
                ) : (
                  completedSessions.map((session) => {
                    const sim = simulations.find(s => s.id === session.simulation_id);
                    return (
                      <Card key={session.id} className="border-0 shadow-sm">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between gap-4 mb-4">
                            <div className="flex-1">
                              <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                                {sim?.title}
                              </h3>
                              <p className="text-xs text-slate-500">
                                {new Date(session.completed_date).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-purple-600">{session.score}%</p>
                              <Badge>{session.feedback?.grade}</Badge>
                            </div>
                          </div>
                          {session.feedback && (
                            <div className="space-y-2">
                              <div className="p-2 rounded bg-green-50 dark:bg-green-900/20 text-xs">
                                <p className="font-medium text-green-900 dark:text-green-200 mb-1">Strengths:</p>
                                <p className="text-green-700 dark:text-green-300">
                                  {session.feedback.strengths?.slice(0, 2).join(', ')}
                                </p>
                              </div>
                              <div className="p-2 rounded bg-amber-50 dark:bg-amber-900/20 text-xs">
                                <p className="font-medium text-amber-900 dark:text-amber-200 mb-1">Improvements:</p>
                                <p className="text-amber-700 dark:text-amber-300">
                                  {session.feedback.improvements?.slice(0, 2).join(', ')}
                                </p>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </RoleGuard>
  );
}