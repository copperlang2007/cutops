import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Trophy, Star, Target, Zap, Award, TrendingUp, Gift,
  Medal, Crown, Flame, Users
} from 'lucide-react';

const BADGES = [
  { id: 'first_sale', name: 'First Sale', icon: Star, description: 'Completed first policy sale', tier: 'bronze' },
  { id: 'license_master', name: 'License Master', icon: Shield, description: 'Licensed in 5+ states', tier: 'silver' },
  { id: 'fast_starter', name: 'Fast Starter', icon: Zap, description: 'Onboarded in under 14 days', tier: 'gold' },
  { id: 'top_producer', name: 'Top Producer', icon: Crown, description: 'Top 10% in commissions', tier: 'platinum' },
  { id: 'compliance_star', name: 'Compliance Star', icon: Shield, description: 'Zero compliance issues', tier: 'silver' },
  { id: 'streak_30', name: '30-Day Streak', icon: Flame, description: 'Active for 30 consecutive days', tier: 'bronze' },
  { id: 'mentor', name: 'Mentor', icon: Users, description: 'Helped onboard 3+ agents', tier: 'gold' }
];

const CHALLENGES = [
  { id: 'weekly_policies', name: 'Weekly Warrior', target: 5, unit: 'policies', reward: 100, timeframe: 'weekly' },
  { id: 'monthly_commission', name: 'Commission Champion', target: 5000, unit: 'commission', reward: 500, timeframe: 'monthly' },
  { id: 'training_complete', name: 'Knowledge Seeker', target: 3, unit: 'courses', reward: 50, timeframe: 'weekly' },
  { id: 'referral_bonus', name: 'Network Builder', target: 2, unit: 'referrals', reward: 200, timeframe: 'monthly' }
];

import { Shield } from 'lucide-react';

export default function AgentGamification({ agent, commissions, licenses, policies, checklistItems }) {
  const [selectedTab, setSelectedTab] = useState('badges');

  const agentStats = useMemo(() => {
    const totalCommission = commissions?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0;
    const licenseCount = licenses?.filter(l => l.status === 'active').length || 0;
    const policiesCount = policies?.length || 0;
    const completedOnboarding = checklistItems?.filter(c => c.is_completed).length || 0;
    const totalOnboarding = checklistItems?.length || 1;

    // Calculate XP
    const xp = (totalCommission / 100) + (licenseCount * 50) + (policiesCount * 25) + (completedOnboarding * 10);
    const level = Math.floor(xp / 500) + 1;
    const xpToNext = 500 - (xp % 500);

    return {
      totalCommission,
      licenseCount,
      policiesCount,
      completedOnboarding,
      totalOnboarding,
      xp: Math.round(xp),
      level,
      xpToNext: Math.round(xpToNext)
    };
  }, [commissions, licenses, policies, checklistItems]);

  const earnedBadges = useMemo(() => {
    const earned = [];
    if (agentStats.policiesCount >= 1) earned.push('first_sale');
    if (agentStats.licenseCount >= 5) earned.push('license_master');
    if (agentStats.completedOnboarding === agentStats.totalOnboarding && agentStats.totalOnboarding > 0) {
      earned.push('fast_starter');
    }
    if (agentStats.totalCommission >= 10000) earned.push('top_producer');
    earned.push('compliance_star'); // Demo
    return earned;
  }, [agentStats]);

  const tierColors = {
    bronze: 'bg-amber-100 text-amber-700 border-amber-300',
    silver: 'bg-slate-100 text-slate-700 border-slate-300',
    gold: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    platinum: 'bg-purple-100 text-purple-700 border-purple-300'
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500" />
          Achievements & Rewards
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Level & XP */}
        <div className="p-4 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg text-white mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-xl font-bold">{agentStats.level}</span>
              </div>
              <div>
                <p className="font-semibold">Level {agentStats.level}</p>
                <p className="text-xs opacity-80">{agentStats.xp} XP Total</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs opacity-80">Next Level</p>
              <p className="text-sm font-medium">{agentStats.xpToNext} XP</p>
            </div>
          </div>
          <Progress value={(500 - agentStats.xpToNext) / 5} className="h-2 bg-white/20" />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <Button 
            size="sm" 
            variant={selectedTab === 'badges' ? 'default' : 'outline'}
            onClick={() => setSelectedTab('badges')}
          >
            <Medal className="w-4 h-4 mr-1" />
            Badges
          </Button>
          <Button 
            size="sm" 
            variant={selectedTab === 'challenges' ? 'default' : 'outline'}
            onClick={() => setSelectedTab('challenges')}
          >
            <Target className="w-4 h-4 mr-1" />
            Challenges
          </Button>
          <Button 
            size="sm" 
            variant={selectedTab === 'rewards' ? 'default' : 'outline'}
            onClick={() => setSelectedTab('rewards')}
          >
            <Gift className="w-4 h-4 mr-1" />
            Rewards
          </Button>
        </div>

        {/* Badges Tab */}
        {selectedTab === 'badges' && (
          <div className="grid grid-cols-2 gap-2">
            {BADGES.map(badge => {
              const isEarned = earnedBadges.includes(badge.id);
              return (
                <div 
                  key={badge.id} 
                  className={`p-3 rounded-lg border ${
                    isEarned ? tierColors[badge.tier] : 'bg-slate-50 border-slate-200 opacity-50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <badge.icon className={`w-5 h-5 ${isEarned ? '' : 'text-slate-400'}`} />
                    <span className="text-sm font-medium">{badge.name}</span>
                  </div>
                  <p className="text-xs opacity-75">{badge.description}</p>
                  {isEarned && (
                    <Badge className="mt-2 text-[10px]" variant="outline">
                      <Star className="w-3 h-3 mr-1" />
                      Earned
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Challenges Tab */}
        {selectedTab === 'challenges' && (
          <div className="space-y-3">
            {CHALLENGES.map(challenge => {
              const progress = Math.min(100, Math.random() * 100); // Demo progress
              return (
                <div key={challenge.id} className="p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium">{challenge.name}</p>
                      <p className="text-xs text-slate-500">
                        {challenge.target} {challenge.unit} ({challenge.timeframe})
                      </p>
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-700">
                      +{challenge.reward} XP
                    </Badge>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <p className="text-xs text-slate-500 mt-1">{Math.round(progress)}% complete</p>
                </div>
              );
            })}
          </div>
        )}

        {/* Rewards Tab */}
        {selectedTab === 'rewards' && (
          <div className="space-y-2">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-800">$50 Gift Card</p>
                  <p className="text-xs text-amber-600">Redeemable at 1000 XP</p>
                </div>
                <Button size="sm" variant="outline" disabled={agentStats.xp < 1000}>
                  {agentStats.xp >= 1000 ? 'Redeem' : `${1000 - agentStats.xp} XP needed`}
                </Button>
              </div>
            </div>
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-800">Premium Training Access</p>
                  <p className="text-xs text-purple-600">Unlock at Level 5</p>
                </div>
                <Button size="sm" variant="outline" disabled={agentStats.level < 5}>
                  {agentStats.level >= 5 ? 'Claim' : `Level ${5 - agentStats.level} more`}
                </Button>
              </div>
            </div>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-800">Commission Bonus 5%</p>
                  <p className="text-xs text-blue-600">Earn Top Producer badge</p>
                </div>
                <Button size="sm" variant="outline" disabled={!earnedBadges.includes('top_producer')}>
                  {earnedBadges.includes('top_producer') ? 'Active' : 'Locked'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}