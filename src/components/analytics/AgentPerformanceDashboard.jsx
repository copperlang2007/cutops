import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, TrendingDown, Users, FileCheck, DollarSign, 
  Target, Activity, Clock, Award, BarChart3
} from 'lucide-react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { differenceInDays, startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

export default function AgentPerformanceDashboard({ agentId }) {
  const [timeframe, setTimeframe] = useState('3months');

  const { data: agent } = useQuery({
    queryKey: ['agent', agentId],
    queryFn: async () => {
      const agents = await base44.entities.Agent.filter({ id: agentId });
      return agents[0];
    }
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients', agentId],
    queryFn: () => base44.entities.Client.filter({ agent_id: agentId })
  });

  const { data: leads = [] } = useQuery({
    queryKey: ['leads', agentId],
    queryFn: () => base44.entities.Lead.filter({ assigned_agent_id: agentId })
  });

  const { data: licenses = [] } = useQuery({
    queryKey: ['licenses', agentId],
    queryFn: () => base44.entities.License.filter({ agent_id: agentId })
  });

  const { data: contracts = [] } = useQuery({
    queryKey: ['contracts', agentId],
    queryFn: () => base44.entities.Contract.filter({ agent_id: agentId })
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', agentId],
    queryFn: () => base44.entities.Task.filter({ agent_id: agentId })
  });

  const { data: interactions = [] } = useQuery({
    queryKey: ['interactions', agentId],
    queryFn: () => base44.entities.ClientInteraction.filter({ agent_id: agentId })
  });

  const { data: commissions = [] } = useQuery({
    queryKey: ['commissions', agentId],
    queryFn: () => base44.entities.Commission.filter({ agent_id: agentId })
  });

  // Calculate metrics
  const getTimeframeMonths = () => {
    switch (timeframe) {
      case '1month': return 1;
      case '3months': return 3;
      case '6months': return 6;
      case '12months': return 12;
      default: return 3;
    }
  };

  const months = getTimeframeMonths();
  const cutoffDate = subMonths(new Date(), months);

  const recentClients = clients.filter(c => new Date(c.created_date) >= cutoffDate);
  const activeClients = clients.filter(c => c.status === 'active');
  const retainedClients = clients.filter(c => 
    c.status === 'active' && new Date(c.created_date) < cutoffDate
  );

  const convertedLeads = leads.filter(l => l.status === 'converted' && new Date(l.converted_date) >= cutoffDate);
  const totalLeads = leads.filter(l => new Date(l.created_date) >= cutoffDate);
  const conversionRate = totalLeads.length > 0 ? (convertedLeads.length / totalLeads.length) * 100 : 0;

  const renewedLicenses = licenses.filter(l => 
    l.renewal_date && new Date(l.renewal_date) >= cutoffDate
  );
  const licenseRenewalRate = licenses.length > 0 ? (renewedLicenses.length / licenses.length) * 100 : 0;

  const renewedContracts = contracts.filter(c => 
    c.renewal_date && new Date(c.renewal_date) >= cutoffDate
  );
  const contractRenewalRate = contracts.length > 0 ? (renewedContracts.length / contracts.length) * 100 : 0;

  const completedTasks = tasks.filter(t => 
    t.status === 'completed' && new Date(t.completed_date) >= cutoffDate
  );
  
  const recentInteractions = interactions.filter(i => 
    new Date(i.created_date) >= cutoffDate
  );

  const avgSatisfaction = clients.filter(c => c.satisfaction_score).length > 0
    ? clients.reduce((sum, c) => sum + (c.satisfaction_score || 0), 0) / clients.filter(c => c.satisfaction_score).length
    : 0;

  const totalCommissions = commissions
    .filter(c => new Date(c.payment_date) >= cutoffDate)
    .reduce((sum, c) => sum + (c.amount || 0), 0);

  // Historical data for charts
  const getMonthlyData = () => {
    const monthlyData = [];
    for (let i = months - 1; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(new Date(), i));
      const monthEnd = endOfMonth(monthStart);
      
      const monthClients = clients.filter(c => {
        const date = new Date(c.created_date);
        return date >= monthStart && date <= monthEnd;
      }).length;

      const monthLeads = leads.filter(l => {
        const date = new Date(l.created_date);
        return date >= monthStart && date <= monthEnd;
      }).length;

      const monthConversions = leads.filter(l => {
        const date = new Date(l.converted_date);
        return l.status === 'converted' && date >= monthStart && date <= monthEnd;
      }).length;

      const monthInteractions = interactions.filter(i => {
        const date = new Date(i.created_date);
        return date >= monthStart && date <= monthEnd;
      }).length;

      monthlyData.push({
        month: format(monthStart, 'MMM'),
        clients: monthClients,
        leads: monthLeads,
        conversions: monthConversions,
        interactions: monthInteractions
      });
    }
    return monthlyData;
  };

  const monthlyData = getMonthlyData();

  const activityBreakdown = [
    { name: 'Tasks Completed', value: completedTasks.length, color: '#14b8a6' },
    { name: 'Client Interactions', value: recentInteractions.length, color: '#3b82f6' },
    { name: 'New Clients', value: recentClients.length, color: '#8b5cf6' }
  ];

  const interactionTypes = interactions.reduce((acc, i) => {
    acc[i.interaction_type] = (acc[i.interaction_type] || 0) + 1;
    return acc;
  }, {});

  const interactionData = Object.entries(interactionTypes).map(([type, count]) => ({
    type: type.replace('_', ' ').toUpperCase(),
    count
  }));

  const COLORS = ['#14b8a6', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="clay-morphism border-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-teal-600" />
                Performance Analytics
              </CardTitle>
              <p className="text-sm text-slate-500 mt-1">
                {agent?.first_name} {agent?.last_name} - Comprehensive Performance Metrics
              </p>
            </div>
            <Select value={timeframe} onValueChange={setTimeframe}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1month">Last Month</SelectItem>
                <SelectItem value="3months">Last 3 Months</SelectItem>
                <SelectItem value="6months">Last 6 Months</SelectItem>
                <SelectItem value="12months">Last Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="clay-subtle border-0">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 mb-1">Clients Acquired</p>
                <p className="text-2xl font-bold text-teal-600">{recentClients.length}</p>
                <p className="text-xs text-slate-400 mt-1">Active: {activeClients.length}</p>
              </div>
              <Users className="w-8 h-8 text-teal-600/30" />
            </div>
          </CardContent>
        </Card>

        <Card className="clay-subtle border-0">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 mb-1">Conversion Rate</p>
                <p className="text-2xl font-bold text-blue-600">{conversionRate.toFixed(1)}%</p>
                <p className="text-xs text-slate-400 mt-1">{convertedLeads.length}/{totalLeads.length} leads</p>
              </div>
              <Target className="w-8 h-8 text-blue-600/30" />
            </div>
          </CardContent>
        </Card>

        <Card className="clay-subtle border-0">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 mb-1">Satisfaction Score</p>
                <p className="text-2xl font-bold text-purple-600">{avgSatisfaction.toFixed(1)}/10</p>
                <p className="text-xs text-slate-400 mt-1">Avg client rating</p>
              </div>
              <Award className="w-8 h-8 text-purple-600/30" />
            </div>
          </CardContent>
        </Card>

        <Card className="clay-subtle border-0">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 mb-1">Total Commissions</p>
                <p className="text-2xl font-bold text-emerald-600">${totalCommissions.toLocaleString()}</p>
                <p className="text-xs text-slate-400 mt-1">Last {months} months</p>
              </div>
              <DollarSign className="w-8 h-8 text-emerald-600/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="renewals">Renewals</TabsTrigger>
          <TabsTrigger value="interactions">Interactions</TabsTrigger>
        </TabsList>

        <TabsContent value="trends">
          <Card className="clay-morphism border-0">
            <CardHeader>
              <CardTitle>Client Acquisition & Lead Conversion Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="clients" stroke="#14b8a6" name="New Clients" strokeWidth={2} />
                  <Line type="monotone" dataKey="leads" stroke="#3b82f6" name="New Leads" strokeWidth={2} />
                  <Line type="monotone" dataKey="conversions" stroke="#8b5cf6" name="Conversions" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="clay-morphism border-0">
              <CardHeader>
                <CardTitle>Activity Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={activityBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {activityBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="clay-morphism border-0">
              <CardHeader>
                <CardTitle>Monthly Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="interactions" fill="#14b8a6" name="Interactions" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="renewals">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="clay-morphism border-0">
              <CardHeader>
                <CardTitle>License Renewals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-slate-600">Renewal Rate</span>
                      <span className="text-sm font-semibold">{licenseRenewalRate.toFixed(1)}%</span>
                    </div>
                    <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-teal-600 rounded-full"
                        style={{ width: `${licenseRenewalRate}%` }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="p-3 bg-teal-50 rounded-lg">
                      <p className="text-sm text-slate-600">Total Licenses</p>
                      <p className="text-2xl font-bold text-teal-600">{licenses.length}</p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-slate-600">Renewed</p>
                      <p className="text-2xl font-bold text-blue-600">{renewedLicenses.length}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="clay-morphism border-0">
              <CardHeader>
                <CardTitle>Contract Renewals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-slate-600">Renewal Rate</span>
                      <span className="text-sm font-semibold">{contractRenewalRate.toFixed(1)}%</span>
                    </div>
                    <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-purple-600 rounded-full"
                        style={{ width: `${contractRenewalRate}%` }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <p className="text-sm text-slate-600">Total Contracts</p>
                      <p className="text-2xl font-bold text-purple-600">{contracts.length}</p>
                    </div>
                    <div className="p-3 bg-pink-50 rounded-lg">
                      <p className="text-sm text-slate-600">Renewed</p>
                      <p className="text-2xl font-bold text-pink-600">{renewedContracts.length}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="interactions">
          <Card className="clay-morphism border-0">
            <CardHeader>
              <CardTitle>Interaction Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={interactionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#14b8a6" />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500">Total</p>
                  <p className="text-xl font-bold">{recentInteractions.length}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500">Avg/Month</p>
                  <p className="text-xl font-bold">{Math.round(recentInteractions.length / months)}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500">Tasks Done</p>
                  <p className="text-xl font-bold">{completedTasks.length}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500">Retention</p>
                  <p className="text-xl font-bold">{Math.round((retainedClients.length / clients.length) * 100)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}