import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Trophy, Medal, Crown, TrendingUp, DollarSign, Star, 
  Shield, Target, Flame, Award, ChevronUp, ChevronDown, Minus
} from 'lucide-react';
import { motion } from 'framer-motion';

const rankIcons = {
  1: { icon: Crown, color: 'text-amber-500', bg: 'bg-amber-100' },
  2: { icon: Medal, color: 'text-slate-400', bg: 'bg-slate-100' },
  3: { icon: Medal, color: 'text-amber-700', bg: 'bg-amber-50' }
};

const categoryConfig = {
  sales: { icon: DollarSign, label: 'Sales Volume', color: 'text-emerald-600' },
  satisfaction: { icon: Star, label: 'Client Satisfaction', color: 'text-amber-500' },
  compliance: { icon: Shield, label: 'Compliance Score', color: 'text-blue-600' },
  retention: { icon: Target, label: 'Client Retention', color: 'text-purple-600' },
  overall: { icon: Trophy, label: 'Overall Performance', color: 'text-teal-600' }
};

export default function AdvancedLeaderboard({ 
  agents, 
  agentPoints,
  commissions,
  clients,
  licenses,
  currentAgentId 
}) {
  const [category, setCategory] = useState('overall');
  const [timeframe, setTimeframe] = useState('monthly');

  // Calculate rankings for each category
  const calculateRankings = () => {
    return agents.map(agent => {
      const points = agentPoints.find(p => p.agent_id === agent.id) || {};
      const agentCommissions = commissions.filter(c => c.agent_id === agent.id);
      const agentClients = clients.filter(c => c.agent_id === agent.id);
      const agentLicenses = licenses.filter(l => l.agent_id === agent.id && l.status === 'active');

      // Sales score
      const salesTotal = agentCommissions.reduce((sum, c) => sum + (c.amount || 0), 0);
      
      // Satisfaction score (average of client satisfaction)
      const satisfactionScores = agentClients.filter(c => c.satisfaction_score).map(c => c.satisfaction_score);
      const avgSatisfaction = satisfactionScores.length > 0 
        ? satisfactionScores.reduce((a, b) => a + b, 0) / satisfactionScores.length 
        : 0;

      // Compliance score
      const complianceScore = agentLicenses.length * 20 + (agent.ahip_completion_date ? 30 : 0);

      // Retention score
      const activeClients = agentClients.filter(c => c.status === 'active').length;
      const retentionRate = agentClients.length > 0 ? (activeClients / agentClients.length) * 100 : 0;

      // Overall score
      const overallScore = (points.monthly_points || 0) + (salesTotal / 100) + (avgSatisfaction * 10) + complianceScore;

      return {
        agent,
        points: points.monthly_points || 0,
        totalPoints: points.total_earned || 0,
        streak: points.current_streak || 0,
        level: points.level || 1,
        scores: {
          sales: salesTotal,
          satisfaction: avgSatisfaction * 10,
          compliance: complianceScore,
          retention: retentionRate,
          overall: overallScore
        },
        previousRank: points[`rank_${category}`] || 999
      };
    });
  };

  const rankings = calculateRankings()
    .sort((a, b) => b.scores[category] - a.scores[category])
    .map((item, idx) => ({
      ...item,
      rank: idx + 1,
      change: item.previousRank - (idx + 1)
    }));

  const currentAgentRank = rankings.find(r => r.agent.id === currentAgentId);
  const CategoryIcon = categoryConfig[category]?.icon || Trophy;

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            Leaderboard
          </CardTitle>
          <div className="flex gap-2">
            <Select value={timeframe} onValueChange={setTimeframe}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">This Week</SelectItem>
                <SelectItem value="monthly">This Month</SelectItem>
                <SelectItem value="quarterly">This Quarter</SelectItem>
                <SelectItem value="yearly">This Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Category Tabs */}
        <Tabs value={category} onValueChange={setCategory} className="mb-4">
          <TabsList className="grid grid-cols-5 h-auto">
            {Object.entries(categoryConfig).map(([key, config]) => (
              <TabsTrigger key={key} value={key} className="text-xs py-2">
                <config.icon className={`w-3 h-3 mr-1 ${config.color}`} />
                <span className="hidden sm:inline">{config.label.split(' ')[0]}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Current User Highlight */}
        {currentAgentRank && (
          <div className="mb-4 p-3 bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold">
                  #{currentAgentRank.rank}
                </div>
                <div>
                  <p className="font-medium text-slate-800">Your Ranking</p>
                  <p className="text-sm text-slate-500">
                    {Math.round(currentAgentRank.scores[category]).toLocaleString()} pts
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {currentAgentRank.change > 0 && (
                  <Badge className="bg-emerald-100 text-emerald-700">
                    <ChevronUp className="w-3 h-3 mr-1" />
                    +{currentAgentRank.change}
                  </Badge>
                )}
                {currentAgentRank.change < 0 && (
                  <Badge className="bg-red-100 text-red-700">
                    <ChevronDown className="w-3 h-3 mr-1" />
                    {currentAgentRank.change}
                  </Badge>
                )}
                <Badge variant="outline" className="bg-orange-50 text-orange-700">
                  <Flame className="w-3 h-3 mr-1" />
                  {currentAgentRank.streak} day streak
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* Rankings List */}
        <div className="space-y-2">
          {rankings.slice(0, 10).map((item, idx) => {
            const RankIcon = rankIcons[item.rank]?.icon;
            const isCurrentAgent = item.agent.id === currentAgentId;

            return (
              <motion.div
                key={item.agent.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                  isCurrentAgent 
                    ? 'bg-teal-50 border border-teal-200' 
                    : 'bg-slate-50 hover:bg-slate-100'
                }`}
              >
                {/* Rank */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  rankIcons[item.rank] 
                    ? `${rankIcons[item.rank].bg} ${rankIcons[item.rank].color}` 
                    : 'bg-slate-200 text-slate-600'
                }`}>
                  {RankIcon ? <RankIcon className="w-4 h-4" /> : item.rank}
                </div>

                {/* Agent Info */}
                <Avatar className="w-9 h-9">
                  <AvatarFallback className="bg-gradient-to-br from-slate-600 to-slate-800 text-white text-xs">
                    {item.agent.first_name?.[0]}{item.agent.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 truncate">
                    {item.agent.first_name} {item.agent.last_name}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>Level {item.level}</span>
                    <span>•</span>
                    <span>{item.totalPoints.toLocaleString()} total pts</span>
                  </div>
                </div>

                {/* Score */}
                <div className="text-right">
                  <p className="font-bold text-slate-800">
                    {category === 'sales' && '$'}{Math.round(item.scores[category]).toLocaleString()}
                    {category === 'satisfaction' && '/100'}
                    {category === 'retention' && '%'}
                  </p>
                  <div className="flex items-center justify-end gap-1 text-xs">
                    {item.change > 0 && (
                      <span className="text-emerald-600 flex items-center">
                        <ChevronUp className="w-3 h-3" />
                        {item.change}
                      </span>
                    )}
                    {item.change < 0 && (
                      <span className="text-red-600 flex items-center">
                        <ChevronDown className="w-3 h-3" />
                        {Math.abs(item.change)}
                      </span>
                    )}
                    {item.change === 0 && (
                      <span className="text-slate-400 flex items-center">
                        <Minus className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}