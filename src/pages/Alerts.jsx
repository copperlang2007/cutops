import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createPageUrl } from '@/utils';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { SEVERITY_CONFIG, ALERT_TYPES } from '../components/shared/constants';

const severityConfig = {
  critical: { ...SEVERITY_CONFIG.critical, icon: AlertTriangle },
  warning: { ...SEVERITY_CONFIG.warning, icon: AlertTriangle },
  info: { ...SEVERITY_CONFIG.info, icon: Clock }
};

const alertTypeLabels = ALERT_TYPES;

export default function Alerts() {
  const [statusFilter, setStatusFilter] = useState('active');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  
  const queryClient = useQueryClient();

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => base44.entities.Alert.list('-created_date')
  });

  const { data: agents = [] } = useQuery({
    queryKey: ['agents'],
    queryFn: () => base44.entities.Agent.list()
  });

  const resolveAlertMutation = useMutation({
    mutationFn: (alert) => base44.entities.Alert.update(alert.id, { 
      is_resolved: true, 
      resolved_date: new Date().toISOString() 
    }),
    onSuccess: () => queryClient.invalidateQueries(['alerts'])
  });

  const getAgentName = (agentId) => {
    const agent = agents.find(a => a.id === agentId);
    return agent ? `${agent.first_name} ${agent.last_name}` : 'Unknown Agent';
  };

  const filteredAlerts = alerts.filter(alert => {
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && !alert.is_resolved) ||
      (statusFilter === 'resolved' && alert.is_resolved);
    
    const matchesSeverity = severityFilter === 'all' || alert.severity === severityFilter;
    const matchesType = typeFilter === 'all' || alert.alert_type === typeFilter;
    
    return matchesStatus && matchesSeverity && matchesType;
  });

  const stats = {
    total: alerts.length,
    active: alerts.filter(a => !a.is_resolved).length,
    critical: alerts.filter(a => !a.is_resolved && a.severity === 'critical').length,
    warning: alerts.filter(a => !a.is_resolved && a.severity === 'warning').length
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Alerts</h1>
            <p className="text-slate-500 mt-1">{stats.active} active alerts requiring attention</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="bg-red-100 text-red-700">
              <AlertTriangle className="w-3 h-3 mr-1" />
              {stats.critical} Critical
            </Badge>
            <Badge variant="secondary" className="bg-amber-100 text-amber-700">
              {stats.warning} Warnings
            </Badge>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <Tabs value={statusFilter} onValueChange={setStatusFilter} className="flex-1">
              <TabsList>
                <TabsTrigger value="active" className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Active
                </TabsTrigger>
                <TabsTrigger value="resolved" className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  Resolved
                </TabsTrigger>
                <TabsTrigger value="all">All</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex gap-2">
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severity</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Alert Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Object.entries(alertTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Alerts List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="h-24 bg-white rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredAlerts.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-xl p-12 text-center"
          >
            <CheckCircle className="w-16 h-16 mx-auto text-emerald-400 mb-4" />
            <p className="text-slate-600 font-medium text-lg">No alerts found</p>
            <p className="text-slate-400 mt-2">
              {statusFilter === 'active' ? 'All caught up! No active alerts.' : 'Try adjusting your filters.'}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {filteredAlerts.map((alert, index) => {
                const config = severityConfig[alert.severity] || severityConfig.info;
                const Icon = config.icon;

                return (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <Card className={`border ${config.border} ${config.bg} ${alert.is_resolved ? 'opacity-60' : ''}`}>
                      <CardContent className="p-5">
                        <div className="flex items-start gap-4">
                          <div className={`p-2 rounded-lg ${alert.is_resolved ? 'bg-slate-100' : config.bg}`}>
                            {alert.is_resolved ? (
                              <CheckCircle className="w-5 h-5 text-slate-400" />
                            ) : (
                              <Icon className={`w-5 h-5 ${config.iconColor}`} />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <h3 className="font-semibold text-slate-800">{alert.title}</h3>
                              <Badge variant="secondary" className={`text-xs ${config.badge}`}>
                                {alertTypeLabels[alert.alert_type] || alert.alert_type}
                              </Badge>
                              {alert.is_resolved && (
                                <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-500">
                                  Resolved
                                </Badge>
                              )}
                            </div>

                            <p className="text-sm text-slate-600 mb-2">{alert.message}</p>

                            <div className="flex items-center gap-4 text-xs text-slate-500">
                              <span className="font-medium text-slate-700">
                                {getAgentName(alert.agent_id)}
                              </span>
                              {alert.due_date && (
                                <span>Due: {format(new Date(alert.due_date), 'MMM d, yyyy')}</span>
                              )}
                              <span>Created: {format(new Date(alert.created_date), 'MMM d, yyyy')}</span>
                              {alert.resolved_date && (
                                <span>Resolved: {format(new Date(alert.resolved_date), 'MMM d, yyyy')}</span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-teal-600 hover:text-teal-700 hover:bg-teal-50"
                              onClick={() => {
                                window.location.href = createPageUrl('AgentDetail') + `?id=${alert.agent_id}`;
                              }}
                            >
                              View Agent
                            </Button>
                            {!alert.is_resolved && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                onClick={() => resolveAlertMutation.mutate(alert)}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Resolve
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}