import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy, Medal, Award, TrendingUp, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const RANK_CONFIG = {
  1: { icon: Trophy, color: 'text-amber-500', bg: 'bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30', border: 'border-amber-300' },
  2: { icon: Medal, color: 'text-slate-400', bg: 'bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-700/50 dark:to-slate-600/50', border: 'border-slate-300' },
  3: { icon: Award, color: 'text-amber-700', bg: 'bg-gradient-to-r from-amber-50 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20', border: 'border-amber-200' }
};

export default function OnboardingLeaderboard({ agents = [], badges = [], checklistItems = [], currentAgentId }) {
  // Calculate scores for each agent
  const leaderboardData = agents.map(agent => {
    const agentBadges = badges.filter(b => b.agent_id === agent.id);
    const agentChecklist = checklistItems.filter(c => c.agent_id === agent.id);
    const completedItems = agentChecklist.filter(c => c.is_completed).length;
    const totalItems = agentChecklist.length || 10;
    const progressPercent = Math.round((completedItems / totalItems) * 100);
    const badgePoints = agentBadges.reduce((sum, b) => sum + (b.points || 0), 0);
    const progressPoints = progressPercent * 5; // 5 points per percent
    const totalScore = badgePoints + progressPoints;

    return {
      ...agent,
      badges: agentBadges,
      badgeCount: agentBadges.length,
      progressPercent,
      totalScore,
      isCurrentAgent: agent.id === currentAgentId
    };
  }).sort((a, b) => b.totalScore - a.totalScore);

  const currentAgentRank = leaderboardData.findIndex(a => a.id === currentAgentId) + 1;

  return (
    <Card className="border-0 shadow-premium dark:bg-slate-800/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2 dark:text-white">
            <Trophy className="w-5 h-5 text-amber-500" />
            Onboarding Leaderboard
          </CardTitle>
          {currentAgentRank > 0 && (
            <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-400">
              Your Rank: #{currentAgentRank}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {leaderboardData.slice(0, 10).map((agent, index) => {
          const rank = index + 1;
          const rankConfig = RANK_CONFIG[rank];
          const initials = `${agent.first_name?.[0] || ''}${agent.last_name?.[0] || ''}`.toUpperCase();
          const RankIcon = rankConfig?.icon;

          return (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                agent.isCurrentAgent 
                  ? 'bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-900/30 dark:to-emerald-900/30 border-2 border-teal-200 dark:border-teal-700' 
                  : rankConfig 
                    ? `${rankConfig.bg} border ${rankConfig.border}` 
                    : 'bg-slate-50 dark:bg-slate-700/30 border border-transparent hover:border-slate-200 dark:hover:border-slate-600'
              }`}
            >
              {/* Rank */}
              <div className="w-8 text-center">
                {RankIcon ? (
                  <RankIcon className={`w-6 h-6 mx-auto ${rankConfig.color}`} />
                ) : (
                  <span className="text-lg font-bold text-slate-400 dark:text-slate-500">#{rank}</span>
                )}
              </div>

              {/* Avatar */}
              <Avatar className="w-10 h-10 border-2 border-white dark:border-slate-600 shadow-sm">
                <AvatarImage src={agent.photo_url} />
                <AvatarFallback className="bg-gradient-to-br from-slate-600 to-slate-800 text-white text-sm font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`font-semibold truncate ${agent.isCurrentAgent ? 'text-teal-700 dark:text-teal-400' : 'text-slate-700 dark:text-slate-200'}`}>
                    {agent.first_name} {agent.last_name}
                  </span>
                  {agent.isCurrentAgent && (
                    <Badge className="bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-400 text-[10px]">You</Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  <span className="flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-500" />
                    {agent.badgeCount} badges
                  </span>
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-emerald-500" />
                    {agent.progressPercent}% complete
                  </span>
                </div>
              </div>

              {/* Score */}
              <div className="text-right">
                <div className="text-lg font-bold text-slate-800 dark:text-white">{agent.totalScore.toLocaleString()}</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">points</div>
              </div>
            </motion.div>
          );
        })}

        {leaderboardData.length === 0 && (
          <div className="text-center py-8 text-slate-400">
            <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No agents on the leaderboard yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}