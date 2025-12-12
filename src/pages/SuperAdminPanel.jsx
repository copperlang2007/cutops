import { useState } from 'react'
import { base44 } from '@/api/base44Client'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  Shield, Eye, Database, Users, Settings, Activity,
  Search, RefreshCw, AlertTriangle, CheckCircle, Server
} from 'lucide-react';
import { toast } from 'sonner'
import RoleGuard from '../components/shared/RoleGuard';

export default function SuperAdminPanel() {
  const queryClient = useQueryClient();
  const [viewAsEmail, setViewAsEmail] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: async () => {
      return await base44.entities.User.list();
    }
  });

  const { data: allPermissions = [] } = useQuery({
    queryKey: ['allPermissions'],
    queryFn: async () => {
      return await base44.entities.UserPermission.list();
    }
  });

  const { data: allAgencies = [] } = useQuery({
    queryKey: ['allAgencies'],
    queryFn: async () => {
      return await base44.entities.Agency.list();
    }
  });

  const { data: systemStats } = useQuery({
    queryKey: ['systemStats'],
    queryFn: async () => {
      const [agents, clients, carriers, contracts] = await Promise.all([
        base44.entities.Agent.list(),
        base44.entities.Client.list(),
        base44.entities.Carrier.list(),
        base44.entities.Contract.list()
      ]);
      return {
        agents: agents.length,
        clients: clients.length,
        carriers: carriers.length,
        contracts: contracts.length
      };
    }
  });

  const handleViewAs = () => {
    if (!viewAsEmail) {
      toast.error('Please enter an email address');
      return;
    }
    localStorage.setItem('viewAsUser', viewAsEmail);
    toast.success(`Now viewing as: ${viewAsEmail}`);
    window.location.reload();
  };

  const handleClearViewAs = () => {
    localStorage.removeItem('viewAsUser');
    toast.success('Returned to super admin view');
    window.location.reload();
  };

  const currentViewAs = localStorage.getItem('viewAsUser');

  const filteredUsers = allUsers.filter(user => 
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <RoleGuard requiredRole="super_admin">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                <Shield className="w-8 h-8 text-purple-600" />
                Super Admin Panel
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">
                System management and troubleshooting
              </p>
            </div>
            <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 px-3 py-1">
              Super Admin Access
            </Badge>
          </div>

          {/* View As Feature */}
          {currentViewAs && (
            <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                    <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                      Currently viewing as: <span className="font-bold">{currentViewAs}</span>
                    </p>
                  </div>
                  <Button onClick={handleClearViewAs} variant="outline" size="sm">
                    Return to Admin View
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* System Stats */}
          <div className="grid grid-cols-4 gap-4">
            <Card className="border-0 shadow-sm dark:bg-slate-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Total Agents</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                      {systemStats?.agents || 0}
                    </p>
                  </div>
                  <Users className="w-8 h-8 text-teal-600" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm dark:bg-slate-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Total Clients</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                      {systemStats?.clients || 0}
                    </p>
                  </div>
                  <Shield className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm dark:bg-slate-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Carriers</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                      {systemStats?.carriers || 0}
                    </p>
                  </div>
                  <Database className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm dark:bg-slate-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Contracts</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                      {systemStats?.contracts || 0}
                    </p>
                  </div>
                  <Server className="w-8 h-8 text-emerald-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="viewas" className="space-y-4">
            <TabsList className="bg-white dark:bg-slate-800 shadow-sm">
              <TabsTrigger value="viewas" className="gap-2">
                <Eye className="w-4 h-4" />
                View As
              </TabsTrigger>
              <TabsTrigger value="users" className="gap-2">
                <Users className="w-4 h-4" />
                Users & Permissions
              </TabsTrigger>
              <TabsTrigger value="agencies" className="gap-2">
                <Database className="w-4 h-4" />
                Agencies
              </TabsTrigger>
              <TabsTrigger value="system" className="gap-2">
                <Settings className="w-4 h-4" />
                System
              </TabsTrigger>
            </TabsList>

            <TabsContent value="viewas">
              <Card className="border-0 shadow-lg dark:bg-slate-800">
                <CardHeader>
                  <CardTitle>View As User</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Impersonate any user to troubleshoot issues or test permissions.
                  </p>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <Label>User Email</Label>
                      <Input
                        value={viewAsEmail}
                        onChange={(e) => setViewAsEmail(e.target.value)}
                        placeholder="user@example.com"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button onClick={handleViewAs} className="bg-purple-600 hover:bg-purple-700">
                        <Eye className="w-4 h-4 mr-2" />
                        View As
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users">
              <Card className="border-0 shadow-lg dark:bg-slate-800">
                <CardHeader>
                  <CardTitle>User Management</CardTitle>
                  <div className="mt-4">
                    <Input
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="max-w-sm"
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {filteredUsers.map(user => {
                      const userPerm = allPermissions.find(p => p.user_email === user.email);
                      return (
                        <div key={user.id} className="flex items-center justify-between p-3 rounded-lg border dark:border-slate-700">
                          <div>
                            <p className="font-medium text-slate-900 dark:text-white">{user.full_name}</p>
                            <p className="text-sm text-slate-500">{user.email}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              {userPerm?.role_type || user.role || 'user'}
                            </Badge>
                            {userPerm?.active && (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="agencies">
              <Card className="border-0 shadow-lg dark:bg-slate-800">
                <CardHeader>
                  <CardTitle>Agency Hierarchy</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {allAgencies.map(agency => (
                      <div key={agency.id} className="flex items-center justify-between p-3 rounded-lg border dark:border-slate-700">
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">{agency.name}</p>
                          <p className="text-sm text-slate-500">{agency.agency_code}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Level {agency.hierarchy_level}</Badge>
                          <Badge className={
                            agency.status === 'active' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-slate-100 text-slate-600'
                          }>
                            {agency.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="system">
              <Card className="border-0 shadow-lg dark:bg-slate-800">
                <CardHeader>
                  <CardTitle>System Management</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button onClick={() => queryClient.invalidateQueries()} className="w-full" variant="outline">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh All Data
                  </Button>
                  <Button onClick={() => toast.info('Feature coming soon')} className="w-full" variant="outline">
                    <Activity className="w-4 h-4 mr-2" />
                    View System Logs
                  </Button>
                  <Button onClick={() => toast.info('Feature coming soon')} className="w-full" variant="outline">
                    <Database className="w-4 h-4 mr-2" />
                    Database Management
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </RoleGuard>
  );
}