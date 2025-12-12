import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Search, Shield, Calendar, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function SecureDocumentCenter({ portalUserId, clientId }) {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: policies = [], isLoading: policiesLoading } = useQuery({
    queryKey: ['clientPolicies', clientId],
    queryFn: () => clientId
      ? base44.entities.Policy.filter({ client_id: clientId })
      : [],
    enabled: !!clientId
  });

  const { data: documents = [], isLoading: documentsLoading } = useQuery({
    queryKey: ['clientDocuments', clientId],
    queryFn: () => clientId
      ? base44.entities.Document.filter({ client_id: clientId })
      : [],
    enabled: !!clientId
  });

  const handleDownload = async (fileUrl, fileName) => {
    try {
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = fileName || 'document';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Download started');
    } catch (error) {
      toast.error('Failed to download document');
    }
  };

  const allItems = [
    ...policies.map(p => ({
      id: p.id,
      type: 'policy',
      title: `${p.policy_type} - ${p.carrier}`,
      date: p.effective_date || p.created_date,
      status: p.status,
      fileUrl: null,
      details: `Policy #${p.policy_number || 'N/A'}`
    })),
    ...documents.map(d => ({
      id: d.id,
      type: 'document',
      title: d.name,
      date: d.created_date,
      status: d.verification_status,
      fileUrl: d.file_url,
      details: d.document_type?.replace(/_/g, ' ')
    }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  const filteredItems = allItems.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.details?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTypeColor = (type) => {
    return type === 'policy' 
      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
      : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'verified': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'pending': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'expired': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-400';
    }
  };

  if (policiesLoading || documentsLoading) {
    return (
      <Card className="clay-morphism border-0">
        <CardContent className="py-12 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full mx-auto" />
          <p className="text-slate-500 mt-3">Loading documents...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="clay-morphism border-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-teal-600" />
              Secure Document Center
            </CardTitle>
            <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
              <Shield className="w-3 h-3 mr-1" />
              Encrypted
            </Badge>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
            Access your policies and important documents securely
          </p>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500 dark:text-slate-400">
                {searchQuery ? 'No documents found' : 'No documents available yet'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredItems.map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className="clay-subtle border-0 hover:shadow-lg transition-all">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shrink-0">
                            <FileText className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-slate-900 dark:text-white">
                              {item.title}
                            </h4>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              {item.details}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge className={getTypeColor(item.type)}>
                                {item.type}
                              </Badge>
                              {item.status && (
                                <Badge className={getStatusColor(item.status)}>
                                  {item.status}
                                </Badge>
                              )}
                              {item.date && (
                                <span className="text-xs text-slate-500 flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {format(new Date(item.date), 'MMM d, yyyy')}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {item.fileUrl ? (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(item.fileUrl, '_blank')}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleDownload(item.fileUrl, item.title)}
                                className="bg-teal-600 hover:bg-teal-700"
                              >
                                <Download className="w-4 h-4 mr-1" />
                                Download
                              </Button>
                            </>
                          ) : (
                            <Badge variant="outline" className="text-xs">
                              Contact Agent
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}