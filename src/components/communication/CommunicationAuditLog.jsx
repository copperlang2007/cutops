import { useState } from 'react'
import { base44 } from '@/api/base44Client'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FileText, Mail, MessageSquare, Phone, Sparkles, User } from 'lucide-react'
import { format } from 'date-fns'

export default function CommunicationAuditLog({ clientId, agentId }) {
  const [typeFilter, setTypeFilter] = useState('all');
  const [aiFilter, setAiFilter] = useState('all');

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['communicationLogs', clientId],
    queryFn: () => base44.entities.CommunicationLog.filter({ client_id: clientId }, '-created_date')
  });

  const filteredLogs = logs.filter(log => {
    const matchesType = typeFilter === 'all' || log.communication_type === typeFilter;
    const matchesAI = aiFilter === 'all' || 
      (aiFilter === 'ai_generated' && log.ai_generated) ||
      (aiFilter === 'ai_assisted' && log.ai_assisted) ||
      (aiFilter === 'manual' && !log.ai_generated && !log.ai_assisted);
    return matchesType && matchesAI;
  });

  const getTypeIcon = (type) => {
    switch (type) {
      case 'email': return <Mail className="w-4 h-4" />;
      case 'sms': return <MessageSquare className="w-4 h-4" />;
      case 'chat': return <MessageSquare className="w-4 h-4" />;
      case 'call_notes': return <Phone className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'urgent': return 'bg-red-100 text-red-700';
      case 'high': return 'bg-orange-100 text-orange-700';
      case 'medium': return 'bg-amber-100 text-amber-700';
      case 'low': return 'bg-blue-100 text-blue-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-slate-600" />
            Communication Audit Log
          </CardTitle>
          <div className="flex gap-2">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
                <SelectItem value="chat">Chat</SelectItem>
              </SelectContent>
            </Select>
            <Select value={aiFilter} onValueChange={setAiFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="ai_generated">AI Generated</SelectItem>
                <SelectItem value="ai_assisted">AI Assisted</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {filteredLogs.map((log) => (
            <div key={log.id} className="p-4 border dark:border-slate-700 rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getTypeIcon(log.communication_type)}
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {log.subject || 'No subject'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {format(new Date(log.sent_date || log.created_date), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  {log.ai_generated && (
                    <Badge className="bg-purple-100 text-purple-700">
                      <Sparkles className="w-3 h-3 mr-1" />
                      AI Generated
                    </Badge>
                  )}
                  {log.ai_assisted && (
                    <Badge className="bg-blue-100 text-blue-700">
                      <Sparkles className="w-3 h-3 mr-1" />
                      AI Assisted
                    </Badge>
                  )}
                  {!log.ai_generated && !log.ai_assisted && (
                    <Badge variant="outline">
                      <User className="w-3 h-3 mr-1" />
                      Manual
                    </Badge>
                  )}
                  <Badge variant="outline">
                    {log.direction}
                  </Badge>
                </div>
              </div>

              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                {log.content?.substring(0, 150)}...
              </p>

              {log.ai_metadata && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {log.ai_metadata.sentiment_detected && (
                    <Badge variant="outline" className="text-xs">
                      Sentiment: {log.ai_metadata.sentiment_detected}
                    </Badge>
                  )}
                  {log.ai_metadata.urgency_level && (
                    <Badge className={`text-xs ${getUrgencyColor(log.ai_metadata.urgency_level)}`}>
                      {log.ai_metadata.urgency_level}
                    </Badge>
                  )}
                  {log.ai_metadata.draft_version && (
                    <Badge variant="outline" className="text-xs">
                      {log.ai_metadata.draft_version}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          ))}

          {filteredLogs.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              No communications logged yet
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}