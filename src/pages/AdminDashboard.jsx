import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, Users, Shield, Trophy, FileText, Activity,
  Lock, Sliders, Bell, Database
} from 'lucide-react';
import { motion } from 'framer-motion';
import RoleGuard from '../components/shared/RoleGuard';
import RolePermissionManager from '../components/admin/RolePermissionManager';
import ComplianceRulesConfig from '../components/admin/ComplianceRulesConfig';
import GamificationSettings from '../components/admin/GamificationSettings';
import AuditLogViewer from '../components/admin/AuditLogViewer';
import SystemSettings from '../components/admin/SystemSettings';

export default function AdminDashboard() {
  const queryClient = useQueryClient();

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list()
  });

  const { data: agents = [] } = useQuery({
    queryKey: ['agents'],
    queryFn: () => base44.entities.Agent.list()
  });

  const { data: auditLogs = [] } = useQuery({
    queryKey: ['auditLogs'],
    queryFn: () => base44.entities.AuditLog.list('-created_date', 100)
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => base44.entities.Alert.list()
  });

  const stats = {
    totalUsers: users.length,
    adminUsers: users.filter(u => u.role === 'admin').length,
    totalAgents: agents.length,
    activeAlerts: alerts.filter(a => !a.is_resolved).length,
    recentLogs: auditLogs.slice(0, 10).length
  };

  return (
    <RoleGuard requiredRole="admin" pageName="AdminDashboard">
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Admin Dashboard</h1>
                <p className="text-slate-500 dark:text-slate-400">System configuration and management</p>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            {[
              { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'blue' },
              { label: 'Admins', value: stats.adminUsers, icon: Lock, color: 'purple' },
              { label: 'Agents', value: stats.totalAgents, icon: Users, color: 'teal' },
              { label: 'Active Alerts', value: stats.activeAlerts, icon: Bell, color: 'amber' },
              { label: 'Recent Logs', value: stats.recentLogs, icon: Activity, color: 'emerald' }
            ].map((stat, idx) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-slate-500">{stat.label}</p>
                        <p className="text-2xl font-bold text-slate-800 dark:text-white">{stat.value}</p>
                      </div>
                      <div className={`w-10 h-10 rounded-lg bg-${stat.color}-100 flex items-center justify-center`}>
                        <stat.icon className={`w-5 h-5 text-${stat.color}-600`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Main Tabs */}
          <Tabs defaultValue="roles" className="space-y-6">
            <TabsList className="bg-white dark:bg-slate-800 shadow-sm p-1 rounded-xl flex-wrap">
              <TabsTrigger value="roles" className="rounded-lg">
                <Lock className="w-4 h-4 mr-2" />
                Roles & Permissions
              </TabsTrigger>
              <TabsTrigger value="compliance" className="rounded-lg">
                <Shield className="w-4 h-4 mr-2" />
                Compliance Rules
              </TabsTrigger>
              <TabsTrigger value="gamification" className="rounded-lg">
                <Trophy className="w-4 h-4 mr-2" />
                Gamification
              </TabsTrigger>
              <TabsTrigger value="audit" className="rounded-lg">
                <FileText className="w-4 h-4 mr-2" />
                Audit Logs
                <Badge variant="secondary" className="ml-2 bg-slate-100">{auditLogs.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="system" className="rounded-lg">
                <Sliders className="w-4 h-4 mr-2" />
                System Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="roles">
              <RolePermissionManager users={users} agents={agents} />
            </TabsContent>

            <TabsContent value="compliance">
              <ComplianceRulesConfig />
            </TabsContent>

            <TabsContent value="gamification">
              <GamificationSettings />
            </TabsContent>

            <TabsContent value="audit">
              <AuditLogViewer logs={auditLogs} />
            </TabsContent>

            <TabsContent value="system">
              <SystemSettings />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </RoleGuard>
  );
}