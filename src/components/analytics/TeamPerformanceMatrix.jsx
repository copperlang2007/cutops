import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell
} from 'recharts';
import { 
  Users, Star, TrendingUp, TrendingDown, Target
} from 'lucide-react';

export default function TeamPerformanceMatrix({ agents, commissions, licenses, contracts }) {
  const matrixData = useMemo(() => {
    return agents.map(agent => {
      const agentCommissions = commissions?.filter(c => c.agent_id === agent.id) || [];
      const agentLicenses = licenses?.filter(l => l.agent_id === agent.id && l.status === 'active') || [];
      const agentContracts = contracts?.filter(c => c.agent_id === agent.id && ['active', 'contract_signed'].includes(c.contract_status)) || [];

      const totalCommission = agentCommissions.reduce((sum, c) => sum + (c.amount || 0), 0);
      const licenseCount = agentLicenses.length;
      const contractCount = agentContracts.length;

      // Performance score (production)
      const productionScore = Math.min(100, (totalCommission / 10000) * 50 + licenseCount * 10 + contractCount * 15);

      // Potential score (engagement/growth indicators)
      const isNew = new Date() - new Date(agent.created_date) < 90 * 24 * 60 * 60 * 1000;
      const potentialScore = Math.min(100, 
        (agent.onboarding_status === 'ready_to_sell' ? 30 : 15) +
        (licenseCount * 15) +
        (isNew ? 20 : 0) +
        (contractCount * 10) +
        Math.random() * 20 // Simulated engagement score
      );

      // Quadrant classification
      let quadrant;
      if (productionScore >= 50 && potentialScore >= 50) quadrant = 'star';
      else if (productionScore >= 50 && potentialScore < 50) quadrant = 'workhorse';
      else if (productionScore < 50 && potentialScore >= 50) quadrant = 'potential';
      else quadrant = 'developing';

      return {
        id: agent.id,
        name: `${agent.first_name} ${agent.last_name}`,
        production: Math.round(productionScore),
        potential: Math.round(potentialScore),
        commission: totalCommission,
        quadrant
      };
    });
  }, [agents, commissions, licenses, contracts]);

  const quadrantCounts = useMemo(() => ({
    star: matrixData.filter(a => a.quadrant === 'star').length,
    workhorse: matrixData.filter(a => a.quadrant === 'workhorse').length,
    potential: matrixData.filter(a => a.quadrant === 'potential').length,
    developing: matrixData.filter(a => a.quadrant === 'developing').length
  }), [matrixData]);

  const getColor = (quadrant) => {
    switch (quadrant) {
      case 'star': return '#f59e0b';
      case 'workhorse': return '#10b981';
      case 'potential': return '#3b82f6';
      case 'developing': return '#94a3b8';
      default: return '#94a3b8';
    }
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-2 border rounded shadow-lg">
          <p className="text-sm font-medium">{data.name}</p>
          <p className="text-xs text-slate-600">Production: {data.production}%</p>
          <p className="text-xs text-slate-600">Potential: {data.potential}%</p>
          <p className="text-xs text-slate-600">Commission: ${data.commission.toLocaleString()}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Target className="w-5 h-5 text-purple-600" />
          Team Performance Matrix
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Quadrant Summary */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <div className="p-2 bg-amber-50 rounded-lg text-center">
            <Star className="w-4 h-4 mx-auto text-amber-600 mb-1" />
            <p className="text-lg font-bold text-amber-700">{quadrantCounts.star}</p>
            <p className="text-xs text-amber-600">Stars</p>
          </div>
          <div className="p-2 bg-emerald-50 rounded-lg text-center">
            <TrendingUp className="w-4 h-4 mx-auto text-emerald-600 mb-1" />
            <p className="text-lg font-bold text-emerald-700">{quadrantCounts.workhorse}</p>
            <p className="text-xs text-emerald-600">Workhorses</p>
          </div>
          <div className="p-2 bg-blue-50 rounded-lg text-center">
            <Users className="w-4 h-4 mx-auto text-blue-600 mb-1" />
            <p className="text-lg font-bold text-blue-700">{quadrantCounts.potential}</p>
            <p className="text-xs text-blue-600">High Potential</p>
          </div>
          <div className="p-2 bg-slate-100 rounded-lg text-center">
            <TrendingDown className="w-4 h-4 mx-auto text-slate-500 mb-1" />
            <p className="text-lg font-bold text-slate-600">{quadrantCounts.developing}</p>
            <p className="text-xs text-slate-500">Developing</p>
          </div>
        </div>

        {/* Scatter Plot */}
        <div className="h-64 relative">
          {/* Quadrant Labels */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 text-xs text-slate-400 z-10">
            High Potential
          </div>
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-slate-400 z-10">
            Low Potential
          </div>
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -rotate-90 text-xs text-slate-400 z-10">
            Low Production
          </div>
          <div className="absolute right-0 top-1/2 transform -translate-y-1/2 rotate-90 text-xs text-slate-400 z-10">
            High Production
          </div>

          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                type="number" 
                dataKey="production" 
                domain={[0, 100]} 
                tick={{ fontSize: 10 }}
                label={{ value: 'Production', position: 'bottom', fontSize: 10 }}
              />
              <YAxis 
                type="number" 
                dataKey="potential" 
                domain={[0, 100]} 
                tick={{ fontSize: 10 }}
                label={{ value: 'Potential', angle: -90, position: 'left', fontSize: 10 }}
              />
              <Tooltip content={<CustomTooltip />} />
              {/* Quadrant reference lines */}
              <line x1="50%" y1="0" x2="50%" y2="100%" stroke="#e2e8f0" strokeDasharray="5 5" />
              <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#e2e8f0" strokeDasharray="5 5" />
              <Scatter data={matrixData}>
                {matrixData.map((entry, index) => (
                  <Cell key={index} fill={getColor(entry.quadrant)} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-2 mt-4 justify-center">
          <Badge className="bg-amber-100 text-amber-700">★ Stars - High performers with growth potential</Badge>
          <Badge className="bg-emerald-100 text-emerald-700">↑ Workhorses - Consistent producers</Badge>
          <Badge className="bg-blue-100 text-blue-700">◆ Potential - Invest in development</Badge>
          <Badge className="bg-slate-200 text-slate-600">○ Developing - Need coaching</Badge>
        </div>
      </CardContent>
    </Card>
  );
}