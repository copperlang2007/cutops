import { useMemo } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { 
  TrendingUp, DollarSign, Clock, Users, Target, ArrowUp, ArrowDown
} from 'lucide-react';
import { differenceInDays, format, subMonths } from 'date-fns'

export default function ROIDashboard({ agents, commissions, checklistItems }) {
  const metrics = useMemo(() => {
    // Cost per agent onboarded (estimated)
    const estimatedCostPerAgent = 500; // recruitment, training, admin
    const totalAgents = agents.length;
    const totalCost = totalAgents * estimatedCostPerAgent;

    // Time to first sale (using ready-to-sell as proxy)
    const rtsAgents = agents.filter(a => a.onboarding_status === 'ready_to_sell');
    const avgTimeToRTS = rtsAgents.length > 0
      ? Math.round(rtsAgents.reduce((sum, a) => {
          return sum + differenceInDays(new Date(), new Date(a.created_date));
        }, 0) / rtsAgents.length)
      : 0;

    // Revenue generated
    const totalRevenue = commissions.reduce((sum, c) => sum + (c.amount || 0), 0);

    // ROI calculation
    const roi = totalCost > 0 ? Math.round(((totalRevenue - totalCost) / totalCost) * 100) : 0;

    // Per agent metrics
    const revenuePerAgent = totalAgents > 0 ? Math.round(totalRevenue / totalAgents) : 0;

    // Monthly trend (simulated)
    const monthlyData = Array.from({ length: 6 }, (_, i) => {
      const month = subMonths(new Date(), 5 - i);
      const monthAgents = agents.filter(a => 
        new Date(a.created_date) <= month
      ).length;
      const monthCommissions = commissions
        .filter(c => c.payment_date && new Date(c.payment_date) <= month)
        .reduce((sum, c) => sum + (c.amount || 0), 0);
      return {
        month: format(month, 'MMM'),
        agents: monthAgents,
        revenue: monthCommissions,
        roi: monthAgents > 0 ? Math.round((monthCommissions - (monthAgents * estimatedCostPerAgent)) / (monthAgents * estimatedCostPerAgent) * 100) : 0
      };
    });

    return {
      totalAgents,
      totalCost,
      totalRevenue,
      roi,
      revenuePerAgent,
      avgTimeToRTS,
      monthlyData,
      rtsRate: totalAgents > 0 ? Math.round((rtsAgents.length / totalAgents) * 100) : 0
    };
  }, [agents, commissions]);

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-600" />
          ROI Dashboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="p-3 bg-emerald-50 rounded-lg">
            <div className="flex items-center gap-1 mb-1">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span className="text-xs text-emerald-600">Total ROI</span>
            </div>
            <p className={`text-xl font-bold ${metrics.roi >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
              {metrics.roi}%
              {metrics.roi >= 0 ? <ArrowUp className="w-4 h-4 inline ml-1" /> : <ArrowDown className="w-4 h-4 inline ml-1" />}
            </p>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-1 mb-1">
              <Users className="w-4 h-4 text-blue-600" />
              <span className="text-xs text-blue-600">Cost/Agent</span>
            </div>
            <p className="text-xl font-bold text-blue-700">${500}</p>
          </div>
          <div className="p-3 bg-purple-50 rounded-lg">
            <div className="flex items-center gap-1 mb-1">
              <Target className="w-4 h-4 text-purple-600" />
              <span className="text-xs text-purple-600">Revenue/Agent</span>
            </div>
            <p className="text-xl font-bold text-purple-700">${metrics.revenuePerAgent.toLocaleString()}</p>
          </div>
          <div className="p-3 bg-amber-50 rounded-lg">
            <div className="flex items-center gap-1 mb-1">
              <Clock className="w-4 h-4 text-amber-600" />
              <span className="text-xs text-amber-600">Avg Time to RTS</span>
            </div>
            <p className="text-xl font-bold text-amber-700">{metrics.avgTimeToRTS} days</p>
          </div>
        </div>

        {/* ROI Trend */}
        <div className="h-48 mb-4">
          <p className="text-sm font-medium text-slate-700 mb-2">ROI Trend (6 Months)</p>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={metrics.monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey="roi" stroke="#10b981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-lg">
          <div className="text-center">
            <p className="text-xs text-slate-500">Total Investment</p>
            <p className="text-sm font-bold text-slate-700">${metrics.totalCost.toLocaleString()}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-500">Total Revenue</p>
            <p className="text-sm font-bold text-emerald-700">${metrics.totalRevenue.toLocaleString()}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-500">RTS Rate</p>
            <p className="text-sm font-bold text-blue-700">{metrics.rtsRate}%</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}