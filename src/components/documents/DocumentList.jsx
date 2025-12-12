import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Upload, Search, Grid, List, FolderOpen } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import DocumentCard from './DocumentCard';

import { DOCUMENT_TYPES as BASE_DOCUMENT_TYPES, ALERT_THRESHOLDS } from '../shared/constants'

const DOCUMENT_TYPES = [
  { value: 'all', label: 'All Types' },
  ...BASE_DOCUMENT_TYPES
];

export default function DocumentList({ 
  documents, 
  onUpload, 
  onDelete, 
  onVerify,
  onReject,
  isLoading,
  title = "Documents",
  showUpload = true 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');

  const warningThresholdMs = ALERT_THRESHOLDS.warningDays * 24 * 60 * 60 * 1000;

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = searchTerm === '' || 
      doc.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.carrier_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || doc.document_type === typeFilter;
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'expiring' && doc.expiration_date && 
        new Date(doc.expiration_date) <= new Date(Date.now() + warningThresholdMs)) ||
      (statusFilter === 'pending' && doc.verification_status === 'pending') ||
      (statusFilter === 'verified' && doc.verification_status === 'verified') ||
      (statusFilter === 'rejected' && doc.verification_status === 'rejected');
    
    return matchesSearch && matchesType && matchesStatus;
  });
  
  const stats = {
    total: documents.length,
    expiring: documents.filter(d => d.expiration_date && 
      new Date(d.expiration_date) <= new Date(Date.now() + warningThresholdMs) &&
      new Date(d.expiration_date) > new Date()
    ).length,
    expired: documents.filter(d => d.expiration_date && 
      new Date(d.expiration_date) < new Date()
    ).length,
    verified: documents.filter(d => d.verification_status === 'verified').length,
    pending: documents.filter(d => d.verification_status === 'pending').length,
    rejected: documents.filter(d => d.verification_status === 'rejected').length
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="border-b">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-teal-600" />
              {title}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-slate-100 text-slate-600">
                {stats.total} total
              </Badge>
              {stats.expiring > 0 && (
                <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                  {stats.expiring} expiring
                </Badge>
              )}
              {stats.expired > 0 && (
                <Badge variant="secondary" className="bg-red-100 text-red-700">
                  {stats.expired} expired
                </Badge>
              )}
            </div>
          </div>
          {showUpload && (
            <Button onClick={onUpload} className="bg-teal-600 hover:bg-teal-700">
              <Upload className="w-4 h-4 mr-2" />
              Upload Document
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-48">
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
            </TabsList>
          </Tabs>

          <div className="flex border rounded-lg overflow-hidden">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              className="rounded-none h-9 w-9"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              className="rounded-none h-9 w-9"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Documents Grid/List */}
        {isLoading ? (
          <div className={`${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'space-y-3'}`}>
            {[1,2,3,4].map(i => (
              <div key={i} className="h-28 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredDocuments.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-12 text-center"
          >
            <FolderOpen className="w-16 h-16 mx-auto text-slate-300 mb-4" />
            {searchTerm || typeFilter !== 'all' || statusFilter !== 'all' ? (
              <>
                <p className="text-slate-600 font-medium">No documents found</p>
                <p className="text-sm text-slate-400 mt-1">Try adjusting your filters</p>
              </>
            ) : (
              <>
                <p className="text-slate-600 font-medium">No documents uploaded yet</p>
                <p className="text-sm text-slate-400 mt-1">Upload your first document to get started</p>
                {showUpload && (
                  <Button onClick={onUpload} className="mt-4 bg-teal-600 hover:bg-teal-700">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Document
                  </Button>
                )}
              </>
            )}
          </motion.div>
        ) : (
          <div className={`${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'space-y-3'}`}>
            <AnimatePresence>
              {filteredDocuments.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  document={doc}
                  onDelete={onDelete}
                  onVerify={onVerify}
                  onReject={onReject}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </CardContent>
    </Card>
  );
}