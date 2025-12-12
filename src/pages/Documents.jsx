import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createPageUrl } from '@/utils';
import { FileText, Upload, Search, Users, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import DocumentCard from '../components/documents/DocumentCard';
import DocumentUploadModal from '../components/documents/DocumentUploadModal';
import DocumentVerificationModal from '../components/documents/DocumentVerificationModal';
import EnhancedDocumentManager from '../components/documents/EnhancedDocumentManager';
import { DOCUMENT_TYPES as BASE_DOCUMENT_TYPES, ALERT_THRESHOLDS } from '../components/shared/constants';
import AIDocumentSearchPanel from '../components/documents/AIDocumentSearchPanel';
import AIDocumentUploadEnhanced from '../components/documents/AIDocumentUploadEnhanced';

const DOCUMENT_TYPES = [
  { value: 'all', label: 'All Types' },
  ...BASE_DOCUMENT_TYPES
];

export default function Documents() {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [agentFilter, setAgentFilter] = useState('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedAgentForUpload, setSelectedAgentForUpload] = useState(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);

  const queryClient = useQueryClient();

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: () => base44.entities.Document.list('-created_date')
  });

  const { data: agents = [] } = useQuery({
    queryKey: ['agents'],
    queryFn: () => base44.entities.Agent.list()
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: (doc) => base44.entities.Document.delete(doc.id),
    onSuccess: () => queryClient.invalidateQueries(['documents'])
  });

  const verifyDocumentMutation = useMutation({
    mutationFn: async (doc) => {
      const user = await base44.auth.me();
      return base44.entities.Document.update(doc.id, { 
        verification_status: 'verified',
        status: 'verified',
        verified_by: user.email,
        verified_date: new Date().toISOString() 
      });
    },
    onSuccess: () => queryClient.invalidateQueries(['documents'])
  });

  const rejectDocumentMutation = useMutation({
    mutationFn: async ({ doc, reason }) => {
      const user = await base44.auth.me();
      return base44.entities.Document.update(doc.id, { 
        verification_status: 'rejected',
        status: 'rejected',
        rejection_reason: reason,
        verified_by: user.email,
        verified_date: new Date().toISOString() 
      });
    },
    onSuccess: () => queryClient.invalidateQueries(['documents'])
  });

  const handleVerifyClick = (doc) => {
    setSelectedDocument(doc);
    setShowVerificationModal(true);
  };

  const handleConfirmVerify = async (doc) => {
    await verifyDocumentMutation.mutateAsync(doc);
  };

  const handleRejectDocument = async (doc, reason) => {
    await rejectDocumentMutation.mutateAsync({ doc, reason });
  };

  const getAgentName = (agentId) => {
    const agent = agents.find(a => a.id === agentId);
    return agent ? `${agent.first_name} ${agent.last_name}` : 'Unknown';
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = searchTerm === '' || 
      doc.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.carrier_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getAgentName(doc.agent_id).toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || doc.document_type === typeFilter;
    const matchesAgent = agentFilter === 'all' || doc.agent_id === agentFilter;
    
    const warningThresholdMs = ALERT_THRESHOLDS.warningDays * 24 * 60 * 60 * 1000;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'expiring' && doc.expiration_date && 
        new Date(doc.expiration_date) <= new Date(Date.now() + warningThresholdMs) &&
        new Date(doc.expiration_date) > new Date()) ||
      (statusFilter === 'expired' && doc.expiration_date && 
        new Date(doc.expiration_date) < new Date()) ||
      (statusFilter === 'pending' && doc.verification_status === 'pending') ||
      (statusFilter === 'verified' && doc.verification_status === 'verified') ||
      (statusFilter === 'rejected' && doc.verification_status === 'rejected');
    
    return matchesSearch && matchesType && matchesAgent && matchesStatus;
  });

  const warningThresholdMs = ALERT_THRESHOLDS.warningDays * 24 * 60 * 60 * 1000;
  const stats = {
    total: documents.length,
    expiring: documents.filter(d => d.expiration_date && 
      new Date(d.expiration_date) <= new Date(Date.now() + warningThresholdMs) &&
      new Date(d.expiration_date) > new Date()
    ).length,
    expired: documents.filter(d => d.expiration_date && 
      new Date(d.expiration_date) < new Date()
    ).length,
    pending: documents.filter(d => d.verification_status === 'pending').length,
    verified: documents.filter(d => d.verification_status === 'verified').length
  };

  const handleUploadClick = () => {
    if (agents.length > 0) {
      setSelectedAgentForUpload(agents[0].id);
    }
    setShowUploadModal(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Documents</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Manage all agent documents and certifications</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {stats.expired > 0 && (
                <Badge variant="secondary" className="bg-red-100 text-red-700">
                  {stats.expired} Expired
                </Badge>
              )}
              {stats.expiring > 0 && (
                <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                  {stats.expiring} Expiring
                </Badge>
              )}
            </div>
            <Button onClick={handleUploadClick} className="bg-teal-600 hover:bg-teal-700 shadow-lg hover:shadow-teal-500/30 transition-all duration-300">
              <Upload className="w-4 h-4 mr-2" />
              Upload Document
            </Button>
          </div>
        </div>

        <Tabs defaultValue="classic" className="space-y-6">
          <TabsList className="bg-white dark:bg-slate-800 shadow-sm">
            <TabsTrigger value="classic">Classic View</TabsTrigger>
            <TabsTrigger value="enhanced" className="gap-2">
              <Sparkles className="w-4 h-4" />
              Enhanced Search
            </TabsTrigger>
            <TabsTrigger value="ai-search" className="gap-2">
              <Sparkles className="w-4 h-4" />
              AI Smart Search
            </TabsTrigger>
          </TabsList>

          <TabsContent value="classic">
            <div className="space-y-6">

        {/* Filters */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-4 mb-6 border border-slate-200 dark:border-slate-700 hover:shadow-lg hover:shadow-teal-500/10 transition-all duration-300">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search documents by name, carrier, or agent..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={agentFilter} onValueChange={setAgentFilter}>
              <SelectTrigger className="w-full lg:w-48">
                <Users className="w-4 h-4 mr-2 text-slate-400" />
                <SelectValue placeholder="Select Agent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Agents</SelectItem>
                {agents.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {agent.first_name} {agent.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Document Type" />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Tabs value={statusFilter} onValueChange={setStatusFilter}>
              <TabsList className="bg-slate-100">
                <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                <TabsTrigger value="pending" className="text-xs">
                  Pending
                  {stats.pending > 0 && (
                    <Badge variant="secondary" className="ml-1 bg-amber-100 text-amber-700 text-[10px] px-1">
                      {stats.pending}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="verified" className="text-xs">Verified</TabsTrigger>
                <TabsTrigger value="rejected" className="text-xs">Rejected</TabsTrigger>
                <TabsTrigger value="expiring" className="text-xs">Expiring</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Documents Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="h-32 bg-white rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredDocuments.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-xl p-12 text-center shadow-sm"
          >
            <FileText className="w-16 h-16 mx-auto text-slate-300 mb-4" />
            {searchTerm || typeFilter !== 'all' || agentFilter !== 'all' || statusFilter !== 'all' ? (
              <>
                <p className="text-slate-600 font-medium text-lg">No documents found</p>
                <p className="text-slate-400 mt-2">Try adjusting your filters</p>
              </>
            ) : (
              <>
                <p className="text-slate-600 font-medium text-lg">No documents uploaded yet</p>
                <p className="text-slate-400 mt-2">Upload your first document to get started</p>
                <Button onClick={handleUploadClick} className="mt-6 bg-teal-600 hover:bg-teal-700">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Document
                </Button>
              </>
            )}
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocuments.map((doc) => (
              <div key={doc.id}>
                <DocumentCard
                  document={doc}
                  onDelete={(doc) => deleteDocumentMutation.mutate(doc)}
                  onVerify={handleVerifyClick}
                />
                <p className="text-xs text-slate-500 mt-1 px-2">
                  Agent: {getAgentName(doc.agent_id)}
                </p>
              </div>
            ))}
          </div>
        )}
            </div>
          </TabsContent>

          <TabsContent value="enhanced">
            <EnhancedDocumentManager />
          </TabsContent>

          <TabsContent value="ai-search">
            <div className="space-y-6">
              <AIDocumentUploadEnhanced 
                clientId={null}
                onUploadComplete={() => queryClient.invalidateQueries(['aiDocuments', 'documents'])}
              />
              <AIDocumentSearchPanel clientId={null} />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Upload Modal with Agent Selection */}
      {showUploadModal && (
        <DocumentUploadModal
          open={showUploadModal}
          onClose={() => {
            setShowUploadModal(false);
            setSelectedAgentForUpload(null);
          }}
          agentId={selectedAgentForUpload || agentFilter !== 'all' ? agentFilter : agents[0]?.id}
          onSuccess={() => {
            queryClient.invalidateQueries(['documents']);
            queryClient.invalidateQueries(['alerts']);
          }}
        />
      )}

      {/* Verification Modal */}
      <DocumentVerificationModal
        open={showVerificationModal}
        onClose={() => {
          setShowVerificationModal(false);
          setSelectedDocument(null);
        }}
        document={selectedDocument}
        onVerify={handleConfirmVerify}
        onReject={handleRejectDocument}
      />
    </div>
  );
}