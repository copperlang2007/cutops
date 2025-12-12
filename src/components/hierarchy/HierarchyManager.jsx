import { useMemo } from 'react'
import { base44 } from '@/api/base44Client'
import { useQuery } from '@tanstack/react-query'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  Users, ChevronRight, ChevronDown, Plus, DollarSign
} from 'lucide-react';

export default function HierarchyManager({ agents }) {
  const { data: hierarchies = [] } = useQuery({
    queryKey: ['hierarchies'],
    queryFn: () => base44.entities.AgentHierarchy.list()
  });

  const hierarchyTree = useMemo(() => {
    // Build tree structure
    const agentMap = new Map(agents.map(a => [a.id, { ...a, children: [], hierarchy: null }]));
    
    hierarchies.forEach(h => {
      if (agentMap.has(h.agent_id)) {
        agentMap.get(h.agent_id).hierarchy = h;
      }
    });

    // Link children to parents
    hierarchies.forEach(h => {
      if (h.upline_id && agentMap.has(h.upline_id) && agentMap.has(h.agent_id)) {
        agentMap.get(h.upline_id).children.push(agentMap.get(h.agent_id));
      }
    });

    // Find top-level (no upline)
    const topLevel = Array.from(agentMap.values()).filter(a => 
      !a.hierarchy?.upline_id || !agentMap.has(a.hierarchy.upline_id)
    );

    return topLevel;
  }, [agents, hierarchies]);

  const roleColors = {
    agent: 'bg-slate-100 text-slate-700',
    team_lead: 'bg-blue-100 text-blue-700',
    manager: 'bg-purple-100 text-purple-700',
    director: 'bg-amber-100 text-amber-700',
    vp: 'bg-emerald-100 text-emerald-700'
  };

  const renderAgent = (agent, depth = 0) => {
    const role = agent.hierarchy?.role || 'agent';
    const override = agent.hierarchy?.override_percentage || 0;
    const initials = `${agent.first_name?.[0] || ''}${agent.last_name?.[0] || ''}`;

    return (
      <div key={agent.id} className="space-y-1">
        <div 
          className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50"
          style={{ marginLeft: depth * 24 }}
        >
          {agent.children.length > 0 && (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
          {agent.children.length === 0 && depth > 0 && (
            <div className="w-4" />
          )}
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-slate-200 text-xs">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-700 truncate">
              {agent.first_name} {agent.last_name}
            </p>
            <div className="flex items-center gap-2">
              <Badge className={`text-[10px] ${roleColors[role]}`}>{role}</Badge>
              {override > 0 && (
                <span className="text-xs text-slate-500 flex items-center gap-0.5">
                  <DollarSign className="w-3 h-3" />
                  {override}% override
                </span>
              )}
            </div>
          </div>
          <Badge variant="outline" className="text-xs">
            {agent.children.length} downline
          </Badge>
        </div>
        {agent.children.length > 0 && (
          <div className="border-l-2 border-slate-200 ml-4">
            {agent.children.map(child => renderAgent(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const totalOverrides = useMemo(() => {
    return hierarchies.reduce((sum, h) => sum + (h.override_percentage || 0), 0);
  }, [hierarchies]);

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            Hierarchy Manager
          </CardTitle>
          <Button size="sm" variant="outline">
            <Plus className="w-4 h-4 mr-1" />
            Add Relationship
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="p-2 bg-indigo-50 rounded-lg text-center">
            <p className="text-lg font-bold text-indigo-700">{agents.length}</p>
            <p className="text-xs text-indigo-600">Total Agents</p>
          </div>
          <div className="p-2 bg-purple-50 rounded-lg text-center">
            <p className="text-lg font-bold text-purple-700">
              {hierarchies.filter(h => h.role !== 'agent').length}
            </p>
            <p className="text-xs text-purple-600">Leaders</p>
          </div>
          <div className="p-2 bg-emerald-50 rounded-lg text-center">
            <p className="text-lg font-bold text-emerald-700">{totalOverrides}%</p>
            <p className="text-xs text-emerald-600">Total Overrides</p>
          </div>
        </div>

        {/* Tree */}
        <div className="max-h-96 overflow-y-auto">
          {hierarchyTree.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">
              No hierarchy relationships defined
            </p>
          ) : (
            hierarchyTree.map(agent => renderAgent(agent))
          )}
        </div>
      </CardContent>
    </Card>
  );
}