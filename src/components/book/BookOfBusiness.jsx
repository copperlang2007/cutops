import React, { useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { 
  Briefcase, TrendingUp, Users, DollarSign, Plus,
  RefreshCw, AlertTriangle
} from 'lucide-react';
import { differenceInDays, format } from 'date-fns';

const COLORS = ['#0d9488', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function BookOfBusiness({ agentId }) {
  const { data: policies = [], isLoading } = useQuery({
    queryKey: ['policies', agentId],
    queryFn: () => agentId 
      ? base44.entities.Policy.filter({ agent_id: agentId })
      : base44.entities.Policy.list(),
  });

  const metrics = useMemo(() => {
    const active = policies.filter(p => p.status === 'active');
    const totalPremium = active.reduce((sum, p) => sum + (p.premium || 0), 0);
    const totalCommission = active.reduce((sum, p) => sum + (p.commission_amount || 0), 0);
    
    // Retention rate (simplified)
    const renewed = policies.filter(p => p.renewal_date && new Date(p.renewal_date) < new Date()).length;
    const retentionRate = policies.length > 0 ? Math.round((renewed / policies.length) * 100) : 0;

    // Renewals coming up
    const upcomingRenewals = active.filter(p => {
      if (!p.renewal_date) return false;
      const days = differenceInDays(new Date(p.renewal_date), new Date());
      return days > 0 && days <= 60;
    });

    // By type
    const byType = active.reduce((acc, p) => {
      acc[p.policy_type] = (acc[p.policy_type] || 0) + 1;
      return acc;
    }, {});

    // By carrier
    const byCarrier = active.reduce((acc, p) => {
      acc[p.carrier_name] = (acc[p.carrier_name] || 0) + 1;
      return acc;
    }, {});

    return {
      totalPolicies: active.length,
      totalPremium,
      totalCommission,
      retentionRate,
      upcomingRenewals,
      byType: Object.entries(byType).map(([name, value]) => ({ name, value })),
      byCarrier: Object.entries(byCarrier).map(([name, count]) => ({ name, count })).slice(0, 5)
    };
  }, [policies]);

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-teal-600" />
            Book of Business
          </CardTitle>
          <Button size="sm" variant="outline">
            <Plus className="w-4 h-4 mr-1" />
            Add Policy
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="p-3 bg-teal-50 rounded-lg text-center">
            <Users className="w-5 h-5 mx-auto text-teal-600 mb-1" />
            <p className="text-xl font-bold text-teal-700">{metrics.totalPolicies}</p>
            <p className="text-xs text-teal-600">Active Policies</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg text-center">
            <DollarSign className="w-5 h-5 mx-auto text-blue-600 mb-1" />
            <p className="text-xl font-bold text-blue-700">${metrics.totalPremium.toLocaleString()}</p>
            <p className="text-xs text-blue-600">Total Premium</p>
          </div>
          <div className="p-3 bg-emerald-50 rounded-lg text-center">
            <TrendingUp className="w-5 h-5 mx-auto text-emerald-600 mb-1" />
            <p className="text-xl font-bold text-emerald-700">{metrics.retentionRate}%</p>
            <p className="text-xs text-emerald-600">Retention Rate</p>
          </div>
          <div className="p-3 bg-amber-50 rounded-lg text-center">
            <RefreshCw className="w-5 h-5 mx-auto text-amber-600 mb-1" />
            <p className="text-xl font-bold text-amber-700">{metrics.upcomingRenewals.length}</p>
            <p className="text-xs text-amber-600">Renewals Due</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Policy by Type */}
          {metrics.byType.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-slate-700 mb-2">By Policy Type</h4>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie
                    data={metrics.byType}
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={60}
                    dataKey="value"
                  >
                    {metrics.byType.map((entry, index) => (
                      <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-2 justify-center">
                {metrics.byType.map((type, i) => (
                  <Badge key={type.name} variant="outline" className="text-xs">
                    <div className="w-2 h-2 rounded-full mr-1" style={{ background: COLORS[i % COLORS.length] }} />
                    {type.name}: {type.value}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* By Carrier */}
          {metrics.byCarrier.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-slate-700 mb-2">By Carrier</h4>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={metrics.byCarrier} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 10 }} />
                  <Bar dataKey="count" fill="#0d9488" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Upcoming Renewals */}
        {metrics.upcomingRenewals.length > 0 && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <h4 className="text-sm font-medium text-amber-800 mb-2 flex items-center gap-1">
              <AlertTriangle className="w-4 h-4" />
              Upcoming Renewals
            </h4>
            <div className="space-y-1">
              {metrics.upcomingRenewals.slice(0, 5).map((policy, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-amber-700">{policy.client_name}</span>
                  <span className="text-amber-600">{format(new Date(policy.renewal_date), 'MMM d')}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {policies.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-6">
            No policies in book of business yet
          </p>
        )}
      </CardContent>
    </Card>
  );
}