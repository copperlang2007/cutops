import { useState } from 'react'
import { base44 } from '@/api/base44Client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Users, Shield, Lock, Edit, Save, Search, Plus, 
  Check, X, Eye, FileText, DollarSign, Settings,
  UserCog, Building2, BarChart3, MessageSquare
} from 'lucide-react';
import { toast } from 'sonner'
import { motion } from 'framer-motion'

const PERMISSION_MODULES = {
  agents: {
    label: 'Agent Management',
    icon: Users,
    permissions: ['view', 'create', 'edit', 'delete', 'manage_onboarding']
  },
  clients: {
    label: 'Client Management',
    icon: Users,
    permissions: ['view', 'create', 'edit', 'delete', 'view_all']
  },
  contracts: {
    label: 'Contracts',
    icon: FileText,
    permissions: ['view', 'create', 'edit', 'delete', 'approve']
  },
  commissions: {
    label: 'Commissions',
    icon: DollarSign,
    permissions: ['view', 'create', 'edit', 'approve', 'export']
  },
  compliance: {
    label: 'Compliance',
    icon: Shield,
    permissions: ['view', 'manage_rules', 'resolve_alerts', 'run_audits']
  },
  reports: {
    label: 'Reports & Analytics',
    icon: BarChart3,
    permissions: ['view', 'create', 'export', 'view_all_data']
  },
  carriers: {
    label: 'Carriers',
    icon: Building2,
    permissions: ['view', 'create', 'edit', 'delete', 'manage_integrations']
  },
  messages: {
    label: 'Messaging',
    icon: MessageSquare,
    permissions: ['send', 'view_all', 'moderate']
  },
  admin: {
    label: 'Administration',
    icon: Settings,
    permissions: ['manage_users', 'manage_roles', 'system_settings', 'audit_logs']
  }
};

const ROLE_TEMPLATES = {
  admin: {
    name: 'Administrator',
    description: 'Full system access',
    permissions: Object.fromEntries(
      Object.keys(PERMISSION_MODULES).map(mod => [mod, PERMISSION_MODULES[mod].permissions])
    )
  },
  manager: {
    name: 'Manager',
    description: 'Team management and reporting',
    permissions: {
      agents: ['view', 'edit', 'manage_onboarding'],
      clients: ['view', 'create', 'edit', 'view_all'],
      contracts: ['view', 'create', 'edit', 'approve'],
      commissions: ['view', 'export'],
      compliance: ['view', 'resolve_alerts'],
      reports: ['view', 'create', 'export', 'view_all_data'],
      carriers: ['view'],
      messages: ['send', 'view_all'],
      admin: []
    }
  },
  agent: {
    name: 'Agent',
    description: 'Basic agent access',
    permissions: {
      agents: [],
      clients: ['view', 'create', 'edit'],
      contracts: ['view'],
      commissions: ['view'],
      compliance: ['view'],
      reports: ['view'],
      carriers: ['view'],
      messages: ['send'],
      admin: []
    }
  },
  readonly: {
    name: 'Read Only',
    description: 'View-only access',
    permissions: {
      agents: ['view'],
      clients: ['view'],
      contracts: ['view'],
      commissions: ['view'],
      compliance: ['view'],
      reports: ['view'],
      carriers: ['view'],
      messages: [],
      admin: []
    }
  }
};

export default function RolePermissionManager({ users, agents }) {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [editingPermissions, setEditingPermissions] = useState(null);
  const [showRoleDialog, setShowRoleDialog] = useState(false);

  const updateUserMutation = useMutation({
    mutationFn: ({ userId, data }) => base44.entities.User.update(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      toast.success('User updated');
    }
  });

  const createAuditLog = async (action, details) => {
    try {
      const user = await base44.auth.me();
      await base44.entities.AuditLog.create({
        action_type: action,
        entity_type: 'user',
        user_email: user.email,
        description: details
      });
    } catch (e) {
      console.error('Failed to create audit log:', e);
    }
  };

  // Note: User roles can only be changed by platform admins through the Base44 dashboard
  // This component only manages custom permissions, not the core role

  const handlePermissionToggle = (module, permission) => {
    if (!editingPermissions) return;
    
    const currentPerms = editingPermissions[module] || [];
    const newPerms = currentPerms.includes(permission)
      ? currentPerms.filter(p => p !== permission)
      : [...currentPerms, permission];
    
    setEditingPermissions({
      ...editingPermissions,
      [module]: newPerms
    });
  };

  const saveCustomPermissions = async () => {
    if (!selectedUser || !editingPermissions) return;
    
    await updateUserMutation.mutateAsync({
      userId: selectedUser.id,
      data: { custom_permissions: editingPermissions }
    });
    await createAuditLog('update', `Updated custom permissions for ${selectedUser.email}`);
    setEditingPermissions(null);
    setSelectedUser(null);
  };

  const applyRoleTemplate = (template) => {
    setEditingPermissions(ROLE_TEMPLATES[template].permissions);
  };

  const filteredUsers = users.filter(u => 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Users List */}
      <Card className="lg:col-span-1 border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" />
            Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {filteredUsers.map((user) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedUser?.id === user.id 
                    ? 'bg-purple-50 border-purple-300' 
                    : 'bg-white border-slate-200 hover:border-purple-200'
                }`}
                onClick={() => {
                  setSelectedUser(user);
                  setEditingPermissions(user.custom_permissions || ROLE_TEMPLATES[user.role]?.permissions || {});
                }}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white text-sm">
                      {user.full_name?.[0] || user.email?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{user.full_name || 'No Name'}</p>
                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                  </div>
                  <Badge className={
                    user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'
                  }>
                    {user.role || 'user'}
                  </Badge>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Permission Editor */}
      <Card className="lg:col-span-2 border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-600" />
              Permissions
            </CardTitle>
            {selectedUser && (
              <div className="flex gap-2">
                <Select onValueChange={applyRoleTemplate}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Apply template" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ROLE_TEMPLATES).map(([key, template]) => (
                      <SelectItem key={key} value={key}>{template.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={saveCustomPermissions} disabled={updateUserMutation.isPending}>
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!selectedUser ? (
            <div className="text-center py-12 text-slate-400">
              <UserCog className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Select a user to manage permissions</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* User Info */}
              <div className="p-4 bg-slate-50 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white">
                      {selectedUser.full_name?.[0] || selectedUser.email?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-slate-800">{selectedUser.full_name}</p>
                    <p className="text-sm text-slate-500">{selectedUser.email}</p>
                  </div>
                </div>
                <Badge className={
                  selectedUser.role === 'admin' 
                    ? 'bg-purple-100 text-purple-700 px-3 py-1' 
                    : 'bg-slate-100 text-slate-600 px-3 py-1'
                }>
                  {selectedUser.role === 'admin' ? 'Admin' : 'User'}
                </Badge>
              </div>

              {/* Permission Grid */}
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {Object.entries(PERMISSION_MODULES).map(([moduleKey, module]) => {
                  const Icon = module.icon;
                  const modulePerms = editingPermissions?.[moduleKey] || [];
                  
                  return (
                    <div key={moduleKey} className="p-4 bg-white border rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <Icon className="w-4 h-4 text-slate-600" />
                        <p className="font-medium text-slate-800">{module.label}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {module.permissions.map((perm) => {
                          const isActive = modulePerms.includes(perm);
                          return (
                            <button
                              key={perm}
                              onClick={() => handlePermissionToggle(moduleKey, perm)}
                              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                                isActive 
                                  ? 'bg-purple-100 text-purple-700 border border-purple-300' 
                                  : 'bg-slate-100 text-slate-500 border border-slate-200 hover:border-purple-200'
                              }`}
                            >
                              {isActive && <Check className="w-3 h-3 inline mr-1" />}
                              {perm.replace(/_/g, ' ')}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}