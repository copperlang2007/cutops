import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Users, DollarSign, Target } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function RenewalAnalytics({ agentId }) {
  const { data: renewals = [] } = useQuery({
    queryKey: ['renewals', agentId],
    queryFn: () => agentId 
      ? base44.entities.PolicyRenewal.filter({ agent_id: agentId })
      : base44.entities.PolicyRenewal.list()
  });

  const { data: agents = [] } = useQuery({
    queryKey: ['agents'],
    queryFn: () => base44.entities.Agent.list()
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list()
  });

  const totalRenewals = renewals.length;
  const renewed = renewals.filter(r => r.status === 'renewed').length;
  const lost = renewals.filter(r => r.status === 'lost').length;
  const successRate = totalRenewals > 0 ? (renewed / totalRenewals * 100) : 0;

  const totalRevenue = renewals
    .filter(r => r.status === 'renewed')
    .reduce((sum, r) => sum + (r.new_premium || r.current_premium || 0), 0);

  // Agent performance
  const agentPerformance = agents.map(agent => {
    const agentRenewals = renewals.filter(r => r.agent_id === agent.id);
    const agentRenewed = agentRenewals.filter(r => r.status === 'renewed').length;
    const agentRate = agentRenewals.length > 0 ? (agentRenewed / agentRenewals.length * 100) : 0;
    
    return {
      name: `${agent.first_name} ${agent.last_name}`,
      renewals: agentRenewed,
      rate: agentRate,
      total: agentRenewals.length
    };
  }).filter(a => a.total > 0).sort((a, b) => b.rate - a.rate);

  // Time-based data
  const next30Days = renewals.filter(r => r.days_until_renewal <= 30 && r.days_until_renewal > 0);
  const next60Days = renewals.filter(r => r.days_until_renewal <= 60 && r.days_until_renewal > 30);
  const next90Days = renewals.filter(r => r.days_until_renewal <= 90 && r.days_until_renewal > 60);

  const timelineData = [
    { period: '0-30 days', count: next30Days.length },
    { period: '31-60 days', count: next60Days.length },
    { period: '61-90 days', count: next90Days.length }
  ];

  // Sentiment analysis for renewals
  const renewalClients = renewals.map(r => clients.find(c => c.id === r.client_id)).filter(Boolean);
  const sentimentBreakdown = {
    very_positive: renewalClients.filter(c => c.current_sentiment === 'very_positive').length,
    positive: renewalClients.filter(c => c.current_sentiment === 'positive').length,
    neutral: renewalClients.filter(c => c.current_sentiment === 'neutral').length,
    negative: renewalClients.filter(c => c.current_sentiment === 'negative').length,
    very_negative: renewalClients.filter(c => c.current_sentiment === 'very_negative').length
  };

  const sentimentData = [
    { sentiment: 'Very Positive', count: sentimentBreakdown.very_positive, fill: '#10b981' },
    { sentiment: 'Positive', count: sentimentBreakdown.positive, fill: '#3b82f6' },
    { sentiment: 'Neutral', count: sentimentBreakdown.neutral, fill: '#94a3b8' },
    { sentiment: 'Negative', count: sentimentBreakdown.negative, fill: '#f59e0b' },
    { sentiment: 'Very Negative', count: sentimentBreakdown.very_negative, fill: '#ef4444' }
  ].filter(d => d.count > 0);

  const avgSentimentScore = renewalClients.length > 0
    ? renewalClients.reduce((sum, c) => sum + (c.sentiment_score || 0), 0) / renewalClients.length
    : 0;

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Success Rate</p>
                <p className="text-2xl font-bold text-green-600">{successRate.toFixed(1)}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Renewed</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{renewed}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Revenue</p>
                <p className="text-2xl font-bold text-purple-600">${totalRevenue.toFixed(0)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">In Pipeline</p>
                <p className="text-2xl font-bold text-amber-600">
                  {renewals.filter(r => ['identified', 'contacted', 'in_progress'].includes(r.status)).length}
                </p>
              </div>
              <Target className="w-8 h-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timeline Chart */}
      <div className="grid grid-cols-2 gap-6">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Renewals by Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#14b8a6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Client Sentiment Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 text-center">
              <p className="text-sm text-slate-500 mb-1">Average Sentiment Score</p>
              <p className={`text-3xl font-bold ${
                avgSentimentScore > 0.3 ? 'text-green-600' :
                avgSentimentScore > -0.3 ? 'text-amber-600' :
                'text-red-600'
              }`}>
                {avgSentimentScore.toFixed(2)}
              </p>
              <p className="text-xs text-slate-500">(-1.0 to 1.0 scale)</p>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={sentimentData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="sentiment" fontSize={12} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Agent Performance */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Agent Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {agentPerformance.slice(0, 10).map((agent, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg border dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <Badge className="bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900">
                    #{i + 1}
                  </Badge>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">{agent.name}</p>
                    <p className="text-sm text-slate-500">{agent.renewals} of {agent.total} renewed</p>
                  </div>
                </div>
                <Badge className={agent.rate >= 80 ? 'bg-green-600' : agent.rate >= 60 ? 'bg-amber-600' : 'bg-red-600'}>
                  {agent.rate.toFixed(0)}%
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}