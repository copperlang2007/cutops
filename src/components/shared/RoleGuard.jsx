import { useQuery } from '@tanstack/react-query'
import { base44 } from '@/api/base44Client'
import { ShieldX, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createPageUrl } from '@/utils'

// Role-based page access configuration
export const PAGE_ACCESS = {
  super_admin: 'all',
  agency_admin: [
    'Dashboard', 'Agents', 'AgentDetail', 'AddAgent', 'ClientManagement',
    'Carriers', 'CarrierDetail', 'Contracts', 'Documents', 'Tasks',
    'Commissions', 'Reports', 'Leaderboard', 'KnowledgeBase', 'Messages',
    'Alerts', 'AgencyManagement', 'StaffManagement', 'AgencyCommissions'
  ],
  agency_staff: [], // Determined by custom permissions
  agent: [
    'Dashboard', 'ClientManagement', 'Leaderboard', 'KnowledgeBase',
    'MyClients', 'MyCommissions', 'StaffManagement'
  ],
  agent_staff: [] // Determined by custom permissions
};

export function useUserRole() {
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: permissions, isLoading: permissionsLoading } = useQuery({
    queryKey: ['userPermissions', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const perms = await base44.entities.UserPermission.filter({ 
        user_email: user.email,
        active: true 
      });
      return perms[0] || null;
    },
    enabled: !!user?.email
  });

  const { data: agency } = useQuery({
    queryKey: ['userAgency', permissions?.agency_id],
    queryFn: async () => {
      if (!permissions?.agency_id) return null;
      const agencies = await base44.entities.Agency.filter({ id: permissions.agency_id });
      return agencies[0] || null;
    },
    enabled: !!permissions?.agency_id
  });

  const isLoading = userLoading || permissionsLoading;

  // Determine effective role type
  const roleType = permissions?.role_type || (user?.role === 'admin' ? 'super_admin' : 'agent');

  return {
    user,
    permissions,
    agency,
    isLoading,
    roleType,
    isSuperAdmin: roleType === 'super_admin',
    isAgencyAdmin: roleType === 'agency_admin',
    isAgencyStaff: roleType === 'agency_staff',
    isAgent: roleType === 'agent',
    isAgentStaff: roleType === 'agent_staff',
    canManageStaff: permissions?.can_manage_staff || roleType === 'super_admin' || roleType === 'agency_admin',
    canViewUpstream: permissions?.can_view_upstream || roleType === 'super_admin'
  };
}

export function canAccessPage(roleType, permissions, pageName) {
  // Super admin has access to everything
  if (roleType === 'super_admin') return true;

  // Check role-based access
  const allowedPages = PAGE_ACCESS[roleType];
  if (allowedPages === 'all') return true;
  if (Array.isArray(allowedPages) && allowedPages.includes(pageName)) return true;

  // For staff roles, check custom permissions
  if ((roleType === 'agency_staff' || roleType === 'agent_staff') && permissions?.permissions) {
    // Map page names to permission categories
    const pagePermissionMap = {
      'Agents': 'agents',
      'AgentDetail': 'agents',
      'AddAgent': 'agents',
      'ClientManagement': 'clients',
      'Carriers': 'carriers',
      'CarrierDetail': 'carriers',
      'AddCarrier': 'carriers',
      'Contracts': 'contracts',
      'Documents': 'documents',
      'Commissions': 'commissions',
      'AgencyCommissions': 'commissions',
      'Reports': 'reports'
    };

    const permissionKey = pagePermissionMap[pageName];
    if (permissionKey && permissions.permissions[permissionKey]?.read) {
      return true;
    }
  }

  return false;
}

export function hasPermission(permissions, roleType, resource, action) {
  if (roleType === 'super_admin') return true;
  if (!permissions?.permissions) return false;
  return permissions.permissions[resource]?.[action] === true;
}

export function canManageEntity(roleType, permissions, entityOwnerId, currentUserId, agency) {
  if (roleType === 'super_admin') return true;
  
  // Agency admins can manage entities within their agency and downline
  if (roleType === 'agency_admin') return true;
  
  // Check if entity owner is within accessible scope
  return entityOwnerId === currentUserId;
}

export default function RoleGuard({ children, requiredRole = null, pageName, requirePermission = null }) {
  const { user, permissions, roleType, isLoading, isSuperAdmin } = useUserRole();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  let hasAccess = false;

  if (isSuperAdmin) {
    hasAccess = true;
  } else if (requiredRole) {
    hasAccess = roleType === requiredRole;
  } else if (pageName) {
    hasAccess = canAccessPage(roleType, permissions, pageName);
  } else if (requirePermission) {
    const [resource, action] = requirePermission.split('.');
    hasAccess = hasPermission(permissions, roleType, resource, action);
  } else {
    hasAccess = true;
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
        <Card className="max-w-md w-full border-0 shadow-lg dark:bg-slate-800">
          <CardContent className="pt-8 pb-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <ShieldX className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">Access Restricted</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6">
              You don't have permission to access this resource. Please contact your administrator.
            </p>
            <Button 
              onClick={() => window.location.href = createPageUrl('Dashboard')}
              className="bg-teal-600 hover:bg-teal-700"
            >
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return children;
}