import { useState } from 'react'
import { base44 } from '@/api/base44Client'
import { useQuery } from '@tanstack/react-query'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  History, Download, Search, Filter, FileText, User,
  Edit, Trash2, Eye, CheckCircle, LogIn
} from 'lucide-react';
import { format } from 'date-fns'

const actionIcons = {
  create: <FileText className="w-3 h-3 text-emerald-500" />,
  update: <Edit className="w-3 h-3 text-blue-500" />,
  delete: <Trash2 className="w-3 h-3 text-red-500" />,
  view: <Eye className="w-3 h-3 text-slate-500" />,
  approval: <CheckCircle className="w-3 h-3 text-emerald-500" />,
  login: <LogIn className="w-3 h-3 text-blue-500" />,
  verification: <CheckCircle className="w-3 h-3 text-purple-500" />,
  export: <Download className="w-3 h-3 text-amber-500" />
};

export default function AuditTrailViewer({ agentId, entityType }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  const { data: auditLogs = [], isLoading } = useQuery({
    queryKey: ['auditLogs', agentId, entityType],
    queryFn: () => {
      const filters = {};
      if (agentId) filters.agent_id = agentId;
      if (entityType) filters.entity_type = entityType;
      return Object.keys(filters).length > 0 
        ? base44.entities.AuditLog.filter(filters, '-created_date', 100)
        : base44.entities.AuditLog.list('-created_date', 100);
    }
  });

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = searchTerm === '' || 
      log.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user_email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = actionFilter === 'all' || log.action_type === actionFilter;
    return matchesSearch && matchesAction;
  });

  const exportAuditLog = () => {
    const csv = [
      ['Date', 'Action', 'Entity Type', 'User', 'Description'].join(','),
      ...filteredLogs.map(log => [
        format(new Date(log.created_date), 'yyyy-MM-dd HH:mm:ss'),
        log.action_type,
        log.entity_type,
        log.user_email,
        `"${log.description?.replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <History className="w-5 h-5 text-slate-600" />
            Audit Trail
          </CardTitle>
          <Button size="sm" variant="outline" onClick={exportAuditLog}>
            <Download className="w-4 h-4 mr-1" />
            Export
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex gap-2 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 text-sm"
            />
          </div>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="create">Create</SelectItem>
              <SelectItem value="update">Update</SelectItem>
              <SelectItem value="delete">Delete</SelectItem>
              <SelectItem value="verification">Verification</SelectItem>
              <SelectItem value="approval">Approval</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Logs */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredLogs.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">No audit logs found</p>
          ) : (
            filteredLogs.map((log, i) => (
              <div key={i} className="p-2 bg-slate-50 rounded-lg flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-white border flex items-center justify-center mt-0.5">
                  {actionIcons[log.action_type] || <FileText className="w-3 h-3" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Badge variant="outline" className="text-[10px]">{log.action_type}</Badge>
                    <Badge variant="outline" className="text-[10px] bg-slate-100">{log.entity_type}</Badge>
                  </div>
                  <p className="text-xs text-slate-700">{log.description}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                    <User className="w-3 h-3" />
                    <span>{log.user_email || 'System'}</span>
                    <span>•</span>
                    <span>{format(new Date(log.created_date), 'MMM d, h:mm a')}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}