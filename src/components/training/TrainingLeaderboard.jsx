import React, { useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Trophy, Medal, Award, TrendingUp, Zap } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export default function TrainingLeaderboard() {
  const { data: agents = [] } = useQuery({
    queryKey: ['agents'],
    queryFn: () => base44.entities.Agent.list()
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ['trainingSessions'],
    queryFn: () => base44.entities.TrainingSession.list()
  });

  const { data: achievements = [] } = useQuery({
    queryKey: ['agentAchievements'],
    queryFn: () => base44.entities.AgentAchievement.list()
  });

  const { data: agentPoints = [] } = useQuery({
    queryKey: ['agentPoints'],
    queryFn: () => base44.entities.AgentPoints.list()
  });

  const leaderboardData = useMemo(() => {
    return agents.map(agent => {
      const agentSessions = sessions.filter(s => s.agent_id === agent.id);
      const completedSessions = agentSessions.filter(s => s.completed);
      const agentAchievements = achievements.filter(a => a.agent_id === agent.id);
      const points = agentPoints.find(p => p.agent_id === agent.id);

      const avgScore = completedSessions.length > 0
        ? Math.round(completedSessions.reduce((sum, s) => sum + (s.score || 0), 0) / completedSessions.length)
        : 0;

      return {
        ...agent,
        completedModules: completedSessions.length,
        avgScore,
        badges: agentAchievements.length,
        totalPoints: points?.total_points || 0
      };
    }).sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      if (b.completedModules !== a.completedModules) return b.completedModules - a.completedModules;
      return b.avgScore - a.avgScore;
    });
  }, [agents, sessions, achievements, agentPoints]);

  const getRankIcon = (index) => {
    if (index === 0) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (index === 1) return <Medal className="w-5 h-5 text-slate-400" />;
    if (index === 2) return <Medal className="w-5 h-5 text-amber-600" />;
    return <span className="w-5 h-5 flex items-center justify-center text-sm font-medium text-slate-500">{index + 1}</span>;
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-purple-600" />
          Training Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {leaderboardData.map((agent, index) => {
            const initials = `${agent.first_name?.[0] || ''}${agent.last_name?.[0] || ''}`;
            return (
              <div
                key={agent.id}
                className={`flex items-center gap-4 p-3 rounded-lg transition-all ${
                  index < 3 ? 'bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20' : 'bg-slate-50 dark:bg-slate-800'
                }`}
              >
                <div className="w-8 flex justify-center">
                  {getRankIcon(index)}
                </div>

                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-purple-100 text-purple-700">
                    {initials}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900 dark:text-white">
                      {agent.first_name} {agent.last_name}
                    </span>
                    {index < 3 && (
                      <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                        Top {index + 1}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                    <span className="flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      {agent.totalPoints} pts
                    </span>
                    <span>•</span>
                    <span>{agent.completedModules} modules</span>
                    <span>•</span>
                    <span>{agent.avgScore}% avg</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Award className="w-3 h-3" />
                      {agent.badges}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-bold text-purple-600">
                    {agent.totalPoints}
                  </div>
                  <div className="text-xs text-slate-500">points</div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}