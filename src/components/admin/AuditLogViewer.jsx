import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  FileText, Search, Filter, Download, Eye, Calendar,
  User, Activity, Database, Settings, Shield, Clock,
  ChevronLeft, ChevronRight, RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

const ACTION_ICONS = {
  create: { icon: Database, color: 'text-emerald-600 bg-emerald-100' },
  update: { icon: Settings, color: 'text-blue-600 bg-blue-100' },
  delete: { icon: Activity, color: 'text-red-600 bg-red-100' },
  view: { icon: Eye, color: 'text-slate-600 bg-slate-100' },
  export: { icon: Download, color: 'text-purple-600 bg-purple-100' },
  login: { icon: User, color: 'text-teal-600 bg-teal-100' },
  verification: { icon: Shield, color: 'text-amber-600 bg-amber-100' },
  approval: { icon: Activity, color: 'text-green-600 bg-green-100' }
};

const ENTITY_TYPES = ['All', 'agent', 'user', 'license', 'contract', 'client', 'commission', 'document', 'task'];
const ACTION_TYPES = ['All', 'create', 'update', 'delete', 'view', 'export', 'login', 'verification', 'approval'];

export default function AuditLogViewer({ logs = [] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [entityFilter, setEntityFilter] = useState('All');
  const [actionFilter, setActionFilter] = useState('All');
  const [dateRange, setDateRange] = useState('all');
  const [selectedLog, setSelectedLog] = useState(null);
  const [page, setPage] = useState(1);
  const perPage = 20;

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch = searchTerm === '' ||
        log.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.entity_type?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesEntity = entityFilter === 'All' || log.entity_type === entityFilter;
      const matchesAction = actionFilter === 'All' || log.action_type === actionFilter;
      
      let matchesDate = true;
      if (dateRange !== 'all' && log.created_date) {
        const logDate = new Date(log.created_date);
        const now = new Date();
        switch (dateRange) {
          case 'today':
            matchesDate = logDate.toDateString() === now.toDateString();
            break;
          case 'week':
            const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
            matchesDate = logDate >= weekAgo;
            break;
          case 'month':
            const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
            matchesDate = logDate >= monthAgo;
            break;
        }
      }
      
      return matchesSearch && matchesEntity && matchesAction && matchesDate;
    });
  }, [logs, searchTerm, entityFilter, actionFilter, dateRange]);

  const paginatedLogs = filteredLogs.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(filteredLogs.length / perPage);

  const exportLogs = () => {
    const csv = [
      ['Date', 'Action', 'Entity', 'User', 'Description'].join(','),
      ...filteredLogs.map(log => [
        log.created_date ? format(new Date(log.created_date), 'yyyy-MM-dd HH:mm:ss') : '',
        log.action_type,
        log.entity_type,
        log.user_email,
        `"${(log.description || '').replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_log_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`;
    a.click();
  };

  const getActionConfig = (actionType) => {
    return ACTION_ICONS[actionType] || ACTION_ICONS.view;
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger className="w-40">
                <Database className="w-4 h-4 mr-2 text-slate-400" />
                <SelectValue placeholder="Entity" />
              </SelectTrigger>
              <SelectContent>
                {ENTITY_TYPES.map(type => (
                  <SelectItem key={type} value={type}>
                    {type === 'All' ? 'All Entities' : type.charAt(0).toUpperCase() + type.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-40">
                <Activity className="w-4 h-4 mr-2 text-slate-400" />
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                {ACTION_TYPES.map(type => (
                  <SelectItem key={type} value={type}>
                    {type === 'All' ? 'All Actions' : type.charAt(0).toUpperCase() + type.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-40">
                <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={exportLogs}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Logs', value: filteredLogs.length, icon: FileText, color: 'blue' },
          { label: 'Creates', value: filteredLogs.filter(l => l.action_type === 'create').length, icon: Database, color: 'emerald' },
          { label: 'Updates', value: filteredLogs.filter(l => l.action_type === 'update').length, icon: Settings, color: 'amber' },
          { label: 'Deletes', value: filteredLogs.filter(l => l.action_type === 'delete').length, icon: Activity, color: 'red' }
        ].map((stat) => (
          <Card key={stat.label} className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
              </div>
              <div className={`w-10 h-10 rounded-lg bg-${stat.color}-100 flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 text-${stat.color}-600`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Logs Table */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Timestamp</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Action</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Entity</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Description</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedLogs.map((log, idx) => {
                  const config = getActionConfig(log.action_type);
                  const Icon = config.icon;
                  
                  return (
                    <motion.tr
                      key={log.id || idx}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.02 }}
                      className="hover:bg-slate-50"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Clock className="w-4 h-4 text-slate-400" />
                          {log.created_date ? format(new Date(log.created_date), 'MMM d, h:mm a') : 'N/A'}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-lg ${config.color} flex items-center justify-center`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className="text-sm font-medium text-slate-700 capitalize">{log.action_type}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="capitalize">{log.entity_type}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-slate-600">{log.user_email || 'System'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-slate-600 line-clamp-1">{log.description}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedLog(log)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-sm text-slate-500">
                Showing {(page - 1) * perPage + 1} to {Math.min(page * perPage, filteredLogs.length)} of {filteredLogs.length}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500">Timestamp</p>
                  <p className="text-sm font-medium">
                    {selectedLog.created_date ? format(new Date(selectedLog.created_date), 'PPpp') : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Action Type</p>
                  <Badge className="capitalize">{selectedLog.action_type}</Badge>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Entity Type</p>
                  <p className="text-sm font-medium capitalize">{selectedLog.entity_type}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Entity ID</p>
                  <p className="text-sm font-medium font-mono">{selectedLog.entity_id || 'N/A'}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500">User</p>
                <p className="text-sm font-medium">{selectedLog.user_email || 'System'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Description</p>
                <p className="text-sm">{selectedLog.description}</p>
              </div>
              {(selectedLog.old_values || selectedLog.new_values) && (
                <div className="grid grid-cols-2 gap-4">
                  {selectedLog.old_values && (
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Old Values</p>
                      <pre className="text-xs bg-red-50 p-2 rounded overflow-auto max-h-32">
                        {JSON.stringify(selectedLog.old_values, null, 2)}
                      </pre>
                    </div>
                  )}
                  {selectedLog.new_values && (
                    <div>
                      <p className="text-xs text-slate-500 mb-1">New Values</p>
                      <pre className="text-xs bg-green-50 p-2 rounded overflow-auto max-h-32">
                        {JSON.stringify(selectedLog.new_values, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
              {selectedLog.ip_address && (
                <div>
                  <p className="text-xs text-slate-500">IP Address</p>
                  <p className="text-sm font-mono">{selectedLog.ip_address}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}