import { useState, useMemo } from 'react'
import { base44 } from '@/api/base44Client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format, subDays } from 'date-fns'
import { 
  DollarSign, TrendingUp, AlertTriangle, Filter, Download, 
  Sparkles, Loader2, Flag, CheckCircle, Clock
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import CommissionAIAnalysis from '../components/commissions/CommissionAIAnalysis';
import CommissionForecast from '../components/commissions/CommissionForecast';
import CommissionPayoutWorkflow from '../components/commissions/CommissionPayoutWorkflow';
import RoleGuard from '../components/shared/RoleGuard';

const statusConfig = {
  pending: { color: 'bg-amber-100 text-amber-700', label: 'Pending' },
  approved: { color: 'bg-blue-100 text-blue-700', label: 'Approved' },
  paid: { color: 'bg-emerald-100 text-emerald-700', label: 'Paid' },
  disputed: { color: 'bg-red-100 text-red-700', label: 'Disputed' },
  adjusted: { color: 'bg-purple-100 text-purple-700', label: 'Adjusted' }
};

export default function Commissions() {
  const queryClient = useQueryClient();
  const [dateRange, setDateRange] = useState('30');
  const [agentFilter, setAgentFilter] = useState('all');
  const [carrierFilter, setCarrierFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: commissions = [], isLoading } = useQuery({
    queryKey: ['commissions'],
    queryFn: () => base44.entities.Commission.list('-created_date')
  });

  const { data: agents = [] } = useQuery({
    queryKey: ['agents'],
    queryFn: () => base44.entities.Agent.list()
  });

  const { data: contracts = [] } = useQuery({
    queryKey: ['contracts'],
    queryFn: () => base44.entities.Contract.list()
  });

  const updateCommissionMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Commission.update(id, data),
    onSuccess: () => queryClient.invalidateQueries(['commissions'])
  });

  const carriers = useMemo(() => {
    return [...new Set(commissions.map(c => c.carrier_name).filter(Boolean))];
  }, [commissions]);

  const filteredCommissions = useMemo(() => {
    let filtered = commissions;
    
    if (agentFilter !== 'all') {
      filtered = filtered.filter(c => c.agent_id === agentFilter);
    }
    if (carrierFilter !== 'all') {
      filtered = filtered.filter(c => c.carrier_name === carrierFilter);
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter(c => c.status === statusFilter);
    }
    
    const days = parseInt(dateRange);
    if (days) {
      const cutoff = subDays(new Date(), days);
      filtered = filtered.filter(c => new Date(c.created_date) >= cutoff);
    }
    
    return filtered;
  }, [commissions, agentFilter, carrierFilter, statusFilter, dateRange]);

  const metrics = useMemo(() => {
    const total = filteredCommissions.reduce((sum, c) => sum + (c.amount || 0), 0);
    const pending = filteredCommissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + (c.amount || 0), 0);
    const paid = filteredCommissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + (c.amount || 0), 0);
    const flagged = filteredCommissions.filter(c => c.flagged).length;
    
    return { total, pending, paid, flagged };
  }, [filteredCommissions]);

  const trendData = useMemo(() => {
    const grouped = {};
    filteredCommissions.forEach(c => {
      const month = format(new Date(c.created_date), 'MMM yyyy');
      grouped[month] = (grouped[month] || 0) + (c.amount || 0);
    });
    return Object.entries(grouped).map(([month, amount]) => ({ month, amount })).slice(-6);
  }, [filteredCommissions]);

  const agentCommissions = useMemo(() => {
    const grouped = {};
    filteredCommissions.forEach(c => {
      const agent = agents.find(a => a.id === c.agent_id);
      const name = agent ? `${agent.first_name} ${agent.last_name}` : 'Unknown';
      grouped[name] = (grouped[name] || 0) + (c.amount || 0);
    });
    return Object.entries(grouped)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);
  }, [filteredCommissions, agents]);

  const getAgentName = (agentId) => {
    const agent = agents.find(a => a.id === agentId);
    return agent ? `${agent.first_name} ${agent.last_name}` : 'Unknown';
  };

  const exportCSV = () => {
    const rows = [
      ['Agent', 'Carrier', 'Amount', 'Type', 'Status', 'Date'],
      ...filteredCommissions.map(c => [
        getAgentName(c.agent_id),
        c.carrier_name,
        c.amount,
        c.commission_type,
        c.status,
        c.effective_date || c.created_date
      ])
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `commissions-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  return (
    <RoleGuard requiredRole="admin" pageName="Commissions">
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Commission Tracking</h1>
            <p className="text-slate-500 mt-1">Track and analyze agent commissions</p>
          </div>
          <Button variant="outline" onClick={exportCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Total</p>
                  <p className="text-2xl font-bold text-slate-800">${metrics.total.toLocaleString()}</p>
                </div>
                <DollarSign className="w-8 h-8 text-teal-200" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Paid</p>
                  <p className="text-2xl font-bold text-emerald-600">${metrics.paid.toLocaleString()}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-emerald-200" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Pending</p>
                  <p className="text-2xl font-bold text-amber-600">${metrics.pending.toLocaleString()}</p>
                </div>
                <Clock className="w-8 h-8 text-amber-200" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Flagged</p>
                  <p className="text-2xl font-bold text-red-600">{metrics.flagged}</p>
                </div>
                <Flag className="w-8 h-8 text-red-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={agentFilter} onValueChange={setAgentFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Agents" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Agents</SelectItem>
              {agents.map(a => (
                <SelectItem key={a.id} value={a.id}>{a.first_name} {a.last_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={carrierFilter} onValueChange={setCarrierFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Carriers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Carriers</SelectItem>
              {carriers.map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="disputed">Disputed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-white shadow-sm p-1 rounded-xl">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="payouts">Payouts</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="ai-analysis">AI Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="payouts">
            <CommissionPayoutWorkflow
              commissions={filteredCommissions}
              agents={agents}
              contracts={contracts}
              onUpdateCommission={async (id, data) => {
                await updateCommissionMutation.mutateAsync({ id, data });
              }}
            />
          </TabsContent>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Commission Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                      <Line type="monotone" dataKey="amount" stroke="#0d9488" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Top Earners</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={agentCommissions} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={100} />
                      <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                      <Bar dataKey="amount" fill="#0d9488" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="details">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Agent</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Carrier</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Amount</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Type</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredCommissions.slice(0, 50).map(commission => {
                        const status = statusConfig[commission.status] || statusConfig.pending;
                        return (
                          <tr key={commission.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3 text-sm text-slate-800">
                              {getAgentName(commission.agent_id)}
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-600">{commission.carrier_name}</td>
                            <td className="px-4 py-3 text-sm font-medium text-slate-800">
                              ${commission.amount?.toLocaleString()}
                              {commission.flagged && <Flag className="w-3 h-3 text-red-500 inline ml-1" />}
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-600 capitalize">{commission.commission_type}</td>
                            <td className="px-4 py-3">
                              <Badge variant="outline" className={status.color}>{status.label}</Badge>
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-500">
                              {commission.effective_date ? format(new Date(commission.effective_date), 'MMM d, yyyy') : '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai-analysis">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CommissionForecast
                commissions={filteredCommissions}
                agents={agents}
                contracts={contracts}
              />
              <CommissionAIAnalysis 
                commissions={filteredCommissions}
                agents={agents}
                contracts={contracts}
              />
            </div>
          </TabsContent>
        </Tabs>
        </div>
      </div>
    </RoleGuard>
  );
}