// Training-specific permission matrix
export const TRAINING_PERMISSIONS = {
  super_admin: {
    modules: { view: true, create: true, edit: true, delete: true, assign: true },
    pathways: { view: true, create: true, edit: true, delete: true, assign: true },
    challenges: { view: true, create: true, edit: true, delete: true, manage: true },
    certificates: { view: true, generate: true, revoke: true, viewAll: true },
    simulations: { view: true, create: true, edit: true, delete: true, assign: true },
    reports: { view: true, viewAll: true },
    settings: { manage: true }
  },
  agency_admin: {
    modules: { view: true, create: true, edit: true, delete: true, assign: true },
    pathways: { view: true, create: true, edit: true, delete: true, assign: true },
    challenges: { view: true, create: true, edit: true, delete: false, manage: true },
    certificates: { view: true, generate: true, revoke: false, viewAll: true },
    simulations: { view: true, create: true, edit: true, delete: false, assign: true },
    reports: { view: true, viewAll: true },
    settings: { manage: false }
  },
  manager: {
    modules: { view: true, create: false, edit: false, delete: false, assign: true },
    pathways: { view: true, create: false, edit: false, delete: false, assign: true },
    challenges: { view: true, create: false, edit: false, delete: false, manage: false },
    certificates: { view: true, generate: false, revoke: false, viewAll: true },
    simulations: { view: true, create: false, edit: false, delete: false, assign: true },
    reports: { view: true, viewAll: true },
    settings: { manage: false }
  },
  agency_staff: {
    modules: { view: true, create: false, edit: false, delete: false, assign: false },
    pathways: { view: true, create: false, edit: false, delete: false, assign: false },
    challenges: { view: true, create: false, edit: false, delete: false, manage: false },
    certificates: { view: true, generate: false, revoke: false, viewAll: false },
    simulations: { view: true, create: false, edit: false, delete: false, assign: false },
    reports: { view: true, viewAll: false },
    settings: { manage: false }
  },
  agent: {
    modules: { view: true, create: false, edit: false, delete: false, assign: false },
    pathways: { view: true, create: false, edit: false, delete: false, assign: false },
    challenges: { view: true, create: false, edit: false, delete: false, manage: false },
    certificates: { view: true, generate: false, revoke: false, viewAll: false },
    simulations: { view: true, create: false, edit: false, delete: false, assign: false },
    reports: { view: false, viewAll: false },
    settings: { manage: false }
  },
  agent_staff: {
    modules: { view: true, create: false, edit: false, delete: false, assign: false },
    pathways: { view: true, create: false, edit: false, delete: false, assign: false },
    challenges: { view: true, create: false, edit: false, delete: false, manage: false },
    certificates: { view: true, generate: false, revoke: false, viewAll: false },
    simulations: { view: true, create: false, edit: false, delete: false, assign: false },
    reports: { view: false, viewAll: false },
    settings: { manage: false }
  }
};

export function hasTrainingPermission(roleType, resource, action) {
  if (roleType === 'super_admin') return true;
  
  const permissions = TRAINING_PERMISSIONS[roleType];
  if (!permissions) return false;
  
  return permissions[resource]?.[action] === true;
}

export function canViewTrainingResource(roleType, resource, ownerId, currentUserId) {
  if (roleType === 'super_admin') return true;
  if (roleType === 'agency_admin') return true;
  if (roleType === 'manager') return true;
  
  // Agents and staff can only view their own
  return ownerId === currentUserId;
}

export function getAccessibleAgents(roleType, currentAgentId, allAgents, agency) {
  if (roleType === 'super_admin') return allAgents;
  if (roleType === 'agency_admin') {
    // Agency admins see all agents in their agency
    return allAgents.filter(a => a.agency_id === agency?.id);
  }
  if (roleType === 'manager') {
    // Managers see their downline agents
    return allAgents.filter(a => 
      a.upline_agent_id === currentAgentId || a.id === currentAgentId
    );
  }
  
  // Agents only see themselves
  return allAgents.filter(a => a.id === currentAgentId);
}