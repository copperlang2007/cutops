import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Award, Trophy, Star, Target, Zap, Crown, Lock, CheckCircle,
  TrendingUp, Users, Shield, DollarSign, Flame, Gift
} from 'lucide-react';
import { format } from 'date-fns'
import { motion } from 'framer-motion'

const ACHIEVEMENT_DEFINITIONS = {
  first_sale: { name: 'First Sale', description: 'Close your first policy', icon: DollarSign, points: 100, tier: 'bronze' },
  sales_5: { name: 'Rising Seller', description: 'Close 5 policies', icon: TrendingUp, points: 250, tier: 'bronze' },
  sales_10: { name: 'Sales Pro', description: 'Close 10 policies', icon: Trophy, points: 500, tier: 'silver' },
  sales_25: { name: 'Sales Expert', description: 'Close 25 policies', icon: Star, points: 1000, tier: 'gold' },
  sales_50: { name: 'Sales Master', description: 'Close 50 policies', icon: Crown, points: 2500, tier: 'platinum' },
  sales_100: { name: 'Sales Legend', description: 'Close 100 policies', icon: Crown, points: 5000, tier: 'diamond' },
  perfect_compliance: { name: 'Perfect Compliance', description: 'Maintain 100% compliance score', icon: Shield, points: 500, tier: 'gold' },
  client_champion: { name: 'Client Champion', description: 'Achieve 9+ satisfaction rating', icon: Star, points: 750, tier: 'gold' },
  quick_closer: { name: 'Quick Closer', description: 'Close a sale within 24 hours', icon: Zap, points: 300, tier: 'silver' },
  retention_master: { name: 'Retention Master', description: '95%+ client retention', icon: Target, points: 1000, tier: 'platinum' },
  top_performer: { name: 'Top Performer', description: 'Rank #1 in any category', icon: Trophy, points: 1500, tier: 'platinum' },
  rising_star: { name: 'Rising Star', description: 'Improve ranking by 10+ spots', icon: TrendingUp, points: 400, tier: 'silver' },
  streak_7: { name: 'Weekly Warrior', description: '7-day activity streak', icon: Flame, points: 200, tier: 'bronze' },
  streak_30: { name: 'Monthly Champion', description: '30-day activity streak', icon: Flame, points: 1000, tier: 'gold' },
  streak_90: { name: 'Streak Legend', description: '90-day activity streak', icon: Flame, points: 3000, tier: 'platinum' },
  referral_pro: { name: 'Referral Pro', description: 'Receive 10 client referrals', icon: Users, points: 800, tier: 'gold' },
  five_star_service: { name: 'Five Star Service', description: '10 perfect satisfaction scores', icon: Star, points: 600, tier: 'silver' },
  training_complete: { name: 'Trained Professional', description: 'Complete all training modules', icon: Award, points: 500, tier: 'silver' }
};

const tierColors = {
  bronze: 'from-amber-600 to-amber-800',
  silver: 'from-slate-400 to-slate-600',
  gold: 'from-yellow-400 to-amber-500',
  platinum: 'from-cyan-300 to-blue-500',
  diamond: 'from-violet-400 to-purple-600'
};

const tierBg = {
  bronze: 'bg-amber-100 border-amber-300',
  silver: 'bg-slate-100 border-slate-300',
  gold: 'bg-yellow-100 border-yellow-300',
  platinum: 'bg-cyan-50 border-cyan-300',
  diamond: 'bg-violet-100 border-violet-300'
};

export default function AchievementSystem({ 
  achievements, 
  agentPoints,
  onViewAll 
}) {
  const [selectedTier, setSelectedTier] = useState('all');

  const earnedTypes = new Set(achievements.map(a => a.achievement_type));
  const totalPoints = achievements.reduce((sum, a) => sum + (a.points_awarded || 0), 0);
  const level = agentPoints?.level || Math.floor(totalPoints / 1000) + 1;
  const pointsToNextLevel = (level * 1000) - totalPoints;
  const levelProgress = ((totalPoints % 1000) / 1000) * 100;

  const allAchievements = Object.entries(ACHIEVEMENT_DEFINITIONS).map(([type, def]) => ({
    type,
    ...def,
    earned: earnedTypes.has(type),
    earnedData: achievements.find(a => a.achievement_type === type)
  }));

  const filteredAchievements = selectedTier === 'all' 
    ? allAchievements 
    : allAchievements.filter(a => a.tier === selectedTier);

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Award className="w-5 h-5 text-purple-600" />
            Achievements
          </CardTitle>
          <Badge variant="outline" className="bg-purple-50 text-purple-700">
            {achievements.length}/{Object.keys(ACHIEVEMENT_DEFINITIONS).length} Earned
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* Level Progress */}
        <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-center">
                <span className="text-xl font-bold text-white">{level}</span>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">Level {level}</p>
                <p className="text-xs text-slate-500">{totalPoints.toLocaleString()} total points</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-purple-700">{pointsToNextLevel} pts to Level {level + 1}</p>
            </div>
          </div>
          <Progress value={levelProgress} className="h-2 [&>div]:bg-gradient-to-r [&>div]:from-purple-500 [&>div]:to-indigo-600" />
        </div>

        {/* Tier Filter */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          <Button
            size="sm"
            variant={selectedTier === 'all' ? 'default' : 'outline'}
            onClick={() => setSelectedTier('all')}
            className="whitespace-nowrap"
          >
            All
          </Button>
          {['bronze', 'silver', 'gold', 'platinum', 'diamond'].map(tier => (
            <Button
              key={tier}
              size="sm"
              variant={selectedTier === tier ? 'default' : 'outline'}
              onClick={() => setSelectedTier(tier)}
              className="whitespace-nowrap capitalize"
            >
              {tier}
            </Button>
          ))}
        </div>

        {/* Achievements Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {filteredAchievements.map((achievement, idx) => {
            const Icon = achievement.icon;
            return (
              <motion.div
                key={achievement.type}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.03 }}
                className={`relative p-3 rounded-lg border-2 ${
                  achievement.earned 
                    ? tierBg[achievement.tier] 
                    : 'bg-slate-50 border-slate-200 opacity-50'
                }`}
              >
                {/* Badge Icon */}
                <div className={`w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center ${
                  achievement.earned 
                    ? `bg-gradient-to-r ${tierColors[achievement.tier]} text-white` 
                    : 'bg-slate-200 text-slate-400'
                }`}>
                  {achievement.earned ? <Icon className="w-5 h-5" /> : <Lock className="w-4 h-4" />}
                </div>

                {/* Name & Description */}
                <p className="text-xs font-medium text-slate-700 text-center truncate">
                  {achievement.name}
                </p>
                <p className="text-[10px] text-slate-500 text-center mt-0.5 line-clamp-2">
                  {achievement.description}
                </p>

                {/* Points */}
                <div className="flex items-center justify-center gap-1 mt-2">
                  <Gift className="w-3 h-3 text-purple-500" />
                  <span className="text-xs font-medium text-purple-600">{achievement.points} pts</span>
                </div>

                {/* Earned Date */}
                {achievement.earned && achievement.earnedData && (
                  <p className="text-[10px] text-slate-400 text-center mt-1">
                    {format(new Date(achievement.earnedData.earned_date), 'MMM d, yyyy')}
                  </p>
                )}

                {/* Earned Checkmark */}
                {achievement.earned && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                    <CheckCircle className="w-3 h-3 text-white" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}