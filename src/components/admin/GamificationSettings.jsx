import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Trophy, Star, Target, Zap, Medal, Crown, Gift, 
  Save, RefreshCw, Plus, Trash2, Edit, Award
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const DEFAULT_POINT_VALUES = {
  client_added: { points: 10, label: 'Add New Client' },
  policy_sold: { points: 50, label: 'Sell Policy' },
  checklist_complete: { points: 5, label: 'Complete Checklist Item' },
  document_uploaded: { points: 5, label: 'Upload Document' },
  task_completed: { points: 10, label: 'Complete Task' },
  training_completed: { points: 25, label: 'Complete Training' },
  referral_received: { points: 30, label: 'Receive Referral' },
  five_star_review: { points: 20, label: 'Get 5-Star Review' },
  perfect_compliance: { points: 100, label: 'Perfect Compliance Month' },
  daily_login: { points: 2, label: 'Daily Login' }
};

const DEFAULT_LEVELS = [
  { level: 1, name: 'Rookie', minPoints: 0, color: 'bg-slate-400' },
  { level: 2, name: 'Rising Star', minPoints: 100, color: 'bg-blue-400' },
  { level: 3, name: 'Pro Agent', minPoints: 500, color: 'bg-green-500' },
  { level: 4, name: 'Elite', minPoints: 1000, color: 'bg-purple-500' },
  { level: 5, name: 'Champion', minPoints: 2500, color: 'bg-amber-500' },
  { level: 6, name: 'Legend', minPoints: 5000, color: 'bg-red-500' },
  { level: 7, name: 'Master', minPoints: 10000, color: 'bg-gradient-to-r from-amber-400 to-amber-600' }
];

const DEFAULT_LEADERBOARDS = [
  { id: 'sales', name: 'Top Sellers', metric: 'policies_sold', period: 'monthly', enabled: true },
  { id: 'satisfaction', name: 'Client Champions', metric: 'satisfaction_score', period: 'monthly', enabled: true },
  { id: 'compliance', name: 'Compliance Stars', metric: 'compliance_score', period: 'monthly', enabled: true },
  { id: 'points', name: 'Points Leaders', metric: 'total_points', period: 'all_time', enabled: true },
  { id: 'streaks', name: 'Streak Masters', metric: 'current_streak', period: 'current', enabled: true }
];

const DEFAULT_ACHIEVEMENTS = [
  { id: 'first_sale', name: 'First Sale', description: 'Close your first policy', points: 50, tier: 'bronze', enabled: true },
  { id: 'sales_10', name: 'Closer', description: 'Close 10 policies', points: 100, tier: 'silver', enabled: true },
  { id: 'sales_50', name: 'Sales Machine', description: 'Close 50 policies', points: 250, tier: 'gold', enabled: true },
  { id: 'streak_7', name: 'Consistent', description: '7-day activity streak', points: 25, tier: 'bronze', enabled: true },
  { id: 'streak_30', name: 'Dedicated', description: '30-day activity streak', points: 100, tier: 'gold', enabled: true },
  { id: 'perfect_month', name: 'Perfect Month', description: '100% compliance for a month', points: 200, tier: 'platinum', enabled: true },
  { id: 'five_star_agent', name: '5-Star Agent', description: 'Get 10 five-star reviews', points: 150, tier: 'gold', enabled: true }
];

export default function GamificationSettings() {
  const [pointValues, setPointValues] = useState(DEFAULT_POINT_VALUES);
  const [levels, setLevels] = useState(DEFAULT_LEVELS);
  const [leaderboards, setLeaderboards] = useState(DEFAULT_LEADERBOARDS);
  const [achievements, setAchievements] = useState(DEFAULT_ACHIEVEMENTS);
  const [globalSettings, setGlobalSettings] = useState({
    gamification_enabled: true,
    show_leaderboards: true,
    show_achievements: true,
    show_points: true,
    weekly_reset: false,
    celebration_animations: true
  });

  const handlePointChange = (key, value) => {
    setPointValues({
      ...pointValues,
      [key]: { ...pointValues[key], points: parseInt(value) || 0 }
    });
  };

  const handleLevelChange = (idx, field, value) => {
    const updated = [...levels];
    updated[idx][field] = field === 'minPoints' ? parseInt(value) || 0 : value;
    setLevels(updated);
  };

  const handleLeaderboardToggle = (idx) => {
    const updated = [...leaderboards];
    updated[idx].enabled = !updated[idx].enabled;
    setLeaderboards(updated);
  };

  const handleAchievementToggle = (idx) => {
    const updated = [...achievements];
    updated[idx].enabled = !updated[idx].enabled;
    setAchievements(updated);
  };

  const saveSettings = () => {
    toast.success('Gamification settings saved');
  };

  const getTierColor = (tier) => {
    switch (tier) {
      case 'bronze': return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'silver': return 'bg-slate-100 text-slate-600 border-slate-300';
      case 'gold': return 'bg-amber-100 text-amber-700 border-amber-300';
      case 'platinum': return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'diamond': return 'bg-cyan-100 text-cyan-700 border-cyan-300';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Global Settings */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              Gamification Settings
            </CardTitle>
            <Button onClick={saveSettings} className="bg-purple-600 hover:bg-purple-700">
              <Save className="w-4 h-4 mr-2" />
              Save All Settings
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(globalSettings).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <Label className="text-sm text-slate-700 capitalize">
                  {key.replace(/_/g, ' ')}
                </Label>
                <Switch
                  checked={value}
                  onCheckedChange={(v) => setGlobalSettings({ ...globalSettings, [key]: v })}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="points" className="space-y-4">
        <TabsList className="bg-white shadow-sm p-1 rounded-xl">
          <TabsTrigger value="points" className="rounded-lg">
            <Star className="w-4 h-4 mr-2" />
            Point Values
          </TabsTrigger>
          <TabsTrigger value="levels" className="rounded-lg">
            <Zap className="w-4 h-4 mr-2" />
            Levels
          </TabsTrigger>
          <TabsTrigger value="leaderboards" className="rounded-lg">
            <Crown className="w-4 h-4 mr-2" />
            Leaderboards
          </TabsTrigger>
          <TabsTrigger value="achievements" className="rounded-lg">
            <Medal className="w-4 h-4 mr-2" />
            Achievements
          </TabsTrigger>
        </TabsList>

        <TabsContent value="points">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Point Values for Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(pointValues).map(([key, config]) => (
                  <div key={key} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                        <Star className="w-5 h-5 text-amber-600" />
                      </div>
                      <span className="text-sm font-medium text-slate-700">{config.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={config.points}
                        onChange={(e) => handlePointChange(key, e.target.value)}
                        className="w-20 text-center"
                      />
                      <span className="text-xs text-slate-400">pts</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="levels">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Level Configuration</CardTitle>
                <Button size="sm" variant="outline">
                  <Plus className="w-4 h-4 mr-1" />
                  Add Level
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {levels.map((level, idx) => (
                  <motion.div
                    key={level.level}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg"
                  >
                    <div className={`w-10 h-10 rounded-full ${level.color} flex items-center justify-center text-white font-bold`}>
                      {level.level}
                    </div>
                    <Input
                      value={level.name}
                      onChange={(e) => handleLevelChange(idx, 'name', e.target.value)}
                      className="w-32"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">Min Points:</span>
                      <Input
                        type="number"
                        value={level.minPoints}
                        onChange={(e) => handleLevelChange(idx, 'minPoints', e.target.value)}
                        className="w-24"
                      />
                    </div>
                    <Button variant="ghost" size="icon" className="ml-auto text-red-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leaderboards">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Leaderboard Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {leaderboards.map((board, idx) => (
                  <div key={board.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <Switch
                        checked={board.enabled}
                        onCheckedChange={() => handleLeaderboardToggle(idx)}
                      />
                      <div>
                        <p className="font-medium text-slate-800">{board.name}</p>
                        <p className="text-xs text-slate-500">
                          Metric: {board.metric.replace(/_/g, ' ')} • Period: {board.period}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Select defaultValue={board.period}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                          <SelectItem value="all_time">All Time</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="ghost" size="icon">
                        <Edit className="w-4 h-4 text-slate-400" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="achievements">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Achievement Badges</CardTitle>
                <Button size="sm" variant="outline">
                  <Plus className="w-4 h-4 mr-1" />
                  Add Achievement
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {achievements.map((achievement, idx) => (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`p-4 rounded-lg border ${achievement.enabled ? 'bg-white' : 'bg-slate-50 opacity-60'}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <Switch
                          checked={achievement.enabled}
                          onCheckedChange={() => handleAchievementToggle(idx)}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-slate-800">{achievement.name}</p>
                            <Badge variant="outline" className={getTierColor(achievement.tier)}>
                              {achievement.tier}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">{achievement.description}</p>
                          <p className="text-xs text-amber-600 mt-1">
                            <Star className="w-3 h-3 inline mr-1" />
                            {achievement.points} points
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Edit className="w-4 h-4 text-slate-400" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}