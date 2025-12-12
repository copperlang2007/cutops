import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Coins, TrendingUp, Flame, Calendar, Target, 
  CheckCircle, Star, Gift, Zap
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

const POINT_VALUES = {
  client_added: { points: 10, label: 'Client Added' },
  interaction_logged: { points: 5, label: 'Interaction Logged' },
  policy_sold: { points: 100, label: 'Policy Sold' },
  task_completed: { points: 15, label: 'Task Completed' },
  training_completed: { points: 50, label: 'Training Completed' },
  referral_received: { points: 75, label: 'Referral Received' },
  perfect_satisfaction: { points: 25, label: 'Perfect Client Rating' },
  daily_login: { points: 5, label: 'Daily Login' }
};

export default function PointsTracker({ 
  agentPoints,
  recentActivities = []
}) {
  const points = agentPoints || {};
  const level = points.level || 1;
  const currentPoints = points.points || 0;
  const monthlyPoints = points.monthly_points || 0;
  const streak = points.current_streak || 0;
  const longestStreak = points.longest_streak || 0;

  const pointsForLevel = level * 1000;
  const pointsProgress = ((currentPoints % 1000) / 1000) * 100;

  // Goals
  const monthlyGoal = 500;
  const monthlyProgress = Math.min((monthlyPoints / monthlyGoal) * 100, 100);

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Coins className="w-5 h-5 text-amber-500" />
            Points & Progress
          </CardTitle>
          <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-white">
            Level {level}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* Current Points Display */}
        <div className="text-center mb-6 p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Coins className="w-8 h-8 text-amber-500" />
            <span className="text-4xl font-bold text-amber-600">{currentPoints.toLocaleString()}</span>
          </div>
          <p className="text-sm text-amber-700">Current Points</p>
          <div className="mt-3">
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>Progress to Level {level + 1}</span>
              <span>{1000 - (currentPoints % 1000)} pts needed</span>
            </div>
            <Progress value={pointsProgress} className="h-2 [&>div]:bg-gradient-to-r [&>div]:from-amber-400 [&>div]:to-orange-500" />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="p-3 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-slate-500">This Month</span>
            </div>
            <p className="text-xl font-bold text-slate-800">{monthlyPoints}</p>
            <Progress value={monthlyProgress} className="h-1.5 mt-2 [&>div]:bg-blue-500" />
            <p className="text-xs text-slate-400 mt-1">{monthlyGoal - monthlyPoints} to monthly goal</p>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="text-xs text-slate-500">Current Streak</span>
            </div>
            <p className="text-xl font-bold text-slate-800">{streak} days</p>
            <div className="flex items-center gap-1 mt-2 text-xs text-slate-400">
              <Star className="w-3 h-3" />
              Best: {longestStreak} days
            </div>
          </div>
        </div>

        {/* Point Values Reference */}
        <div>
          <h4 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
            <Gift className="w-4 h-4 text-purple-500" />
            Earn Points
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(POINT_VALUES).slice(0, 6).map(([key, { points, label }]) => (
              <div key={key} className="flex items-center justify-between p-2 bg-slate-50 rounded text-xs">
                <span className="text-slate-600">{label}</span>
                <span className="font-medium text-amber-600">+{points}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        {recentActivities.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-slate-700 mb-2">Recent Activity</h4>
            <div className="space-y-2">
              {recentActivities.slice(0, 5).map((activity, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs p-2 bg-emerald-50 rounded">
                  <span className="text-slate-600">{activity.description}</span>
                  <span className="font-medium text-emerald-600">+{activity.points}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}