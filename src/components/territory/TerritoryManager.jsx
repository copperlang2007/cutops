import { useState, useMemo } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  MapPin, Users, DollarSign, TrendingUp, BarChart3
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const US_REGIONS = {
  northeast: ['CT', 'ME', 'MA', 'NH', 'RI', 'VT', 'NJ', 'NY', 'PA'],
  southeast: ['AL', 'FL', 'GA', 'KY', 'MS', 'NC', 'SC', 'TN', 'VA', 'WV'],
  midwest: ['IL', 'IN', 'IA', 'KS', 'MI', 'MN', 'MO', 'NE', 'ND', 'OH', 'SD', 'WI'],
  southwest: ['AZ', 'NM', 'OK', 'TX'],
  west: ['AK', 'CA', 'CO', 'HI', 'ID', 'MT', 'NV', 'OR', 'UT', 'WA', 'WY']
};

export default function TerritoryManager({ agents, licenses, commissions, contracts }) {
  const [selectedRegion, setSelectedRegion] = useState('all');

  const territoryData = useMemo(() => {
    const stateMetrics = {};

    // Aggregate license data
    licenses.forEach(l => {
      if (!stateMetrics[l.state]) {
        stateMetrics[l.state] = { 
          state: l.state, 
          agents: new Set(), 
          licenses: 0, 
          commission: 0,
          contracts: 0
        };
      }
      stateMetrics[l.state].agents.add(l.agent_id);
      stateMetrics[l.state].licenses++;
    });

    // Add commission data
    commissions.forEach(c => {
      const agent = agents.find(a => a.id === c.agent_id);
      if (agent?.state && stateMetrics[agent.state]) {
        stateMetrics[agent.state].commission += c.amount || 0;
      }
    });

    // Add contract data
    contracts.forEach(c => {
      const agent = agents.find(a => a.id === c.agent_id);
      if (agent?.state && stateMetrics[agent.state]) {
        stateMetrics[agent.state].contracts++;
      }
    });

    // Convert to array and add agent count
    return Object.values(stateMetrics)
      .map(s => ({ ...s, agentCount: s.agents.size }))
      .sort((a, b) => b.agentCount - a.agentCount);
  }, [agents, licenses, commissions, contracts]);

  const filteredData = useMemo(() => {
    if (selectedRegion === 'all') return territoryData;
    const regionStates = US_REGIONS[selectedRegion] || [];
    return territoryData.filter(d => regionStates.includes(d.state));
  }, [territoryData, selectedRegion]);

  const regionTotals = useMemo(() => {
    return {
      totalAgents: new Set(filteredData.flatMap(d => [...d.agents])).size,
      totalLicenses: filteredData.reduce((sum, d) => sum + d.licenses, 0),
      totalCommission: filteredData.reduce((sum, d) => sum + d.commission, 0),
      topState: filteredData[0]?.state || 'N/A'
    };
  }, [filteredData]);

  const chartData = filteredData.slice(0, 10).map(d => ({
    state: d.state,
    agents: d.agentCount,
    commission: d.commission / 1000
  }));

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            Territory Manager
          </CardTitle>
          <Select value={selectedRegion} onValueChange={setSelectedRegion}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Region" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Regions</SelectItem>
              <SelectItem value="northeast">Northeast</SelectItem>
              <SelectItem value="southeast">Southeast</SelectItem>
              <SelectItem value="midwest">Midwest</SelectItem>
              <SelectItem value="southwest">Southwest</SelectItem>
              <SelectItem value="west">West</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {/* Region Summary */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="p-2 bg-blue-50 rounded-lg text-center">
            <Users className="w-4 h-4 mx-auto text-blue-600 mb-1" />
            <p className="text-lg font-bold text-blue-700">{regionTotals.totalAgents}</p>
            <p className="text-xs text-blue-600">Agents</p>
          </div>
          <div className="p-2 bg-teal-50 rounded-lg text-center">
            <MapPin className="w-4 h-4 mx-auto text-teal-600 mb-1" />
            <p className="text-lg font-bold text-teal-700">{filteredData.length}</p>
            <p className="text-xs text-teal-600">States</p>
          </div>
          <div className="p-2 bg-emerald-50 rounded-lg text-center">
            <DollarSign className="w-4 h-4 mx-auto text-emerald-600 mb-1" />
            <p className="text-lg font-bold text-emerald-700">${(regionTotals.totalCommission / 1000).toFixed(0)}k</p>
            <p className="text-xs text-emerald-600">Commission</p>
          </div>
          <div className="p-2 bg-amber-50 rounded-lg text-center">
            <TrendingUp className="w-4 h-4 mx-auto text-amber-600 mb-1" />
            <p className="text-lg font-bold text-amber-700">{regionTotals.topState}</p>
            <p className="text-xs text-amber-600">Top State</p>
          </div>
        </div>

        {/* Chart */}
        {chartData.length > 0 && (
          <div className="h-48 mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="state" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="agents" fill="#3b82f6" name="Agents" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* State List */}
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {filteredData.map((state, i) => (
            <div key={state.state} className="flex items-center justify-between p-2 bg-slate-50 rounded">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono">{state.state}</Badge>
                <span className="text-sm text-slate-600">{state.agentCount} agents</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span>{state.licenses} licenses</span>
                <span>${state.commission.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>

        {filteredData.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-4">No data for selected region</p>
        )}
      </CardContent>
    </Card>
  );
}