import { useState, useEffect } from 'react'
import { base44 } from '@/api/base44Client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Building2, Users, ChevronRight, ChevronDown, 
  TrendingUp, DollarSign, Plus, Edit, Grip 
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { toast } from 'sonner'

export default function AgencyHierarchyChart() {
  const queryClient = useQueryClient();
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [agencyStats, setAgencyStats] = useState({});

  const { data: agencies = [], isLoading } = useQuery({
    queryKey: ['agencies'],
    queryFn: () => base44.entities.Agency.list()
  });

  const { data: agents = [] } = useQuery({
    queryKey: ['agents'],
    queryFn: () => base44.entities.Agent.list()
  });

  const { data: agreements = [] } = useQuery({
    queryKey: ['agencyPartnerAgreements'],
    queryFn: () => base44.entities.AgencyPartnerAgreement.list()
  });

  const updateAgencyMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Agency.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['agencies']);
      toast.success('Agency hierarchy updated');
    }
  });

  useEffect(() => {
    if (agencies.length > 0 && agents.length > 0) {
      calculateAgencyStats();
    }
  }, [agencies, agents, agreements]);

  const calculateAgencyStats = () => {
    const stats = {};

    agencies.forEach(agency => {
      const agentCount = agents.filter(a => a.agency_id === agency.id).length;
      const agreementCount = agreements.filter(a => 
        a.parent_agency_id === agency.id || a.partner_agency_id === agency.id
      ).length;

      // Get all downline agencies
      const downlineAgencies = getDownlineAgencies(agency.id);
      const totalDownlineAgents = downlineAgencies.reduce((sum, downlineId) => {
        return sum + agents.filter(a => a.agency_id === downlineId).length;
      }, 0);

      stats[agency.id] = {
        directAgents: agentCount,
        totalAgents: agentCount + totalDownlineAgents,
        downlineAgencies: downlineAgencies.length,
        agreements: agreementCount,
        level: agency.hierarchy_level || 0
      };
    });

    setAgencyStats(stats);
  };

  const getDownlineAgencies = (parentId, visited = new Set()) => {
    if (visited.has(parentId)) return [];
    visited.add(parentId);

    const children = agencies.filter(a => a.parent_agency_id === parentId);
    let downline = children.map(c => c.id);

    children.forEach(child => {
      downline = [...downline, ...getDownlineAgencies(child.id, visited)];
    });

    return downline;
  };

  const buildHierarchy = () => {
    const topLevel = agencies.filter(a => !a.parent_agency_id || a.hierarchy_level === 0);
    
    const buildChildren = (parentId, level = 0) => {
      return agencies
        .filter(a => a.parent_agency_id === parentId)
        .map(agency => ({
          ...agency,
          children: buildChildren(agency.id, level + 1)
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
    };

    return topLevel.map(agency => ({
      ...agency,
      children: buildChildren(agency.id, 1)
    }));
  };

  const toggleNode = (agencyId) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(agencyId)) {
        newSet.delete(agencyId);
      } else {
        newSet.add(agencyId);
      }
      return newSet;
    });
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const { draggableId, destination } = result;
    const agencyId = draggableId.replace('agency-', '');
    const newParentId = destination.droppableId.replace('agency-children-', '');

    // Don't allow dropping on self or own children
    const agency = agencies.find(a => a.id === agencyId);
    if (!agency) return;

    const downlineIds = getDownlineAgencies(agencyId);
    if (downlineIds.includes(newParentId)) {
      toast.error('Cannot move agency to its own downline');
      return;
    }

    // Calculate new hierarchy level
    const newParent = agencies.find(a => a.id === newParentId);
    const newLevel = newParent ? (newParent.hierarchy_level || 0) + 1 : 0;

    updateAgencyMutation.mutate({
      id: agencyId,
      data: {
        parent_agency_id: newParentId === 'root' ? null : newParentId,
        hierarchy_level: newLevel
      }
    });
  };

  const renderAgencyNode = (agency, level = 0, provided = null, snapshot = null) => {
    const stats = agencyStats[agency.id] || {};
    const hasChildren = agency.children && agency.children.length > 0;
    const isExpanded = expandedNodes.has(agency.id);

    return (
      <div
        ref={provided?.innerRef}
        {...provided?.draggableProps}
        className={`${snapshot?.isDragging ? 'opacity-50' : ''}`}
        style={{
          marginLeft: `${level * 32}px`,
          ...provided?.draggableProps.style
        }}
      >
        <Card className={`mb-2 border-0 shadow-sm dark:bg-slate-800 ${
          snapshot?.isDragging ? 'shadow-lg' : ''
        }`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                {provided && (
                  <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing">
                    <Grip className="w-4 h-4 text-slate-400" />
                  </div>
                )}
                
                {hasChildren && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => toggleNode(agency.id)}
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </Button>
                )}

                <Building2 className="w-5 h-5 text-teal-600" />
                
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-slate-900 dark:text-white">
                      {agency.name}
                    </h4>
                    <Badge variant="outline" className="text-xs">
                      Level {stats.level}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500">{agency.agency_code}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="flex items-center gap-1 text-sm">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span className="font-medium">{stats.directAgents || 0}</span>
                    {stats.totalAgents > stats.directAgents && (
                      <span className="text-slate-400">
                        ({stats.totalAgents} total)
                      </span>
                    )}
                  </div>
                  {stats.downlineAgencies > 0 && (
                    <p className="text-xs text-slate-500">
                      {stats.downlineAgencies} downline
                    </p>
                  )}
                </div>

                {stats.agreements > 0 && (
                  <Badge className="bg-teal-100 text-teal-700 dark:bg-teal-900/30">
                    {stats.agreements} agreements
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {hasChildren && isExpanded && (
          <Droppable droppableId={`agency-children-${agency.id}`} type="agency">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps}>
                {agency.children.map((child, index) => (
                  <Draggable
                    key={child.id}
                    draggableId={`agency-${child.id}`}
                    index={index}
                  >
                    {(provided, snapshot) => 
                      renderAgencyNode(child, level + 1, provided, snapshot)
                    }
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card className="border-0 shadow-sm dark:bg-slate-800">
        <CardContent className="pt-6">
          <div className="space-y-4">
            {[1,2,3].map(i => (
              <div key={i} className="h-20 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const hierarchy = buildHierarchy();

  return (
    <div className="space-y-4">
      <Card className="border-0 shadow-sm dark:bg-slate-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Agency Hierarchy</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Add Agency
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="agency-children-root" type="agency">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps}>
              {hierarchy.map((agency, index) => (
                <Draggable
                  key={agency.id}
                  draggableId={`agency-${agency.id}`}
                  index={index}
                >
                  {(provided, snapshot) => 
                    renderAgencyNode(agency, 0, provided, snapshot)
                  }
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {hierarchy.length === 0 && (
        <Card className="border-0 shadow-sm dark:bg-slate-800">
          <CardContent className="pt-12 pb-12 text-center">
            <Building2 className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500">No agencies yet</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}