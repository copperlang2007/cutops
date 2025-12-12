import { useState } from 'react'
import { base44 } from '@/api/base44Client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { 
  Upload, FileText, DollarSign, Users, Building2, 
  CheckCircle, AlertTriangle, Loader2, FileSpreadsheet,
  FileImage, File, X, Eye, Download, RefreshCw, 
  TrendingUp, Clock, Search, Filter
} from 'lucide-react';
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { format } from 'date-fns'

const documentTypes = [
  { 
    id: 'application', 
    label: 'Agent Applications', 
    icon: Users, 
    color: 'bg-blue-500',
    description: 'Applications submitted by agents'
  },
  { 
    id: 'book_of_business', 
    label: 'Book of Business', 
    icon: FileSpreadsheet, 
    color: 'bg-emerald-500',
    description: 'Carrier reports for reconciliation'
  },
  { 
    id: 'commission_statement', 
    label: 'Commission Statement', 
    icon: DollarSign, 
    color: 'bg-amber-500',
    description: 'Carrier commission statements'
  }
];

const acceptedFileTypes = '.csv,.pdf,.doc,.docx,.jpg,.jpeg,.png';

export default function AgencyCommissions() {
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState('');
  const [selectedCarrier, setSelectedCarrier] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('uploads');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [reconciliationData, setReconciliationData] = useState(null);
  const [selectedDiscrepancy, setSelectedDiscrepancy] = useState(null);
  const [discrepancyModalOpen, setDiscrepancyModalOpen] = useState(false);

  const queryClient = useQueryClient();

  const { data: carriers = [] } = useQuery({
    queryKey: ['carriers'],
    queryFn: () => base44.entities.Carrier.list()
  });

  const { data: uploads = [], isLoading: uploadsLoading } = useQuery({
    queryKey: ['commissionUploads'],
    queryFn: () => base44.entities.CommissionUpload.list('-created_date')
  });

  const { data: parsedRecords = [] } = useQuery({
    queryKey: ['parsedCommissionRecords'],
    queryFn: () => base44.entities.ParsedCommissionRecord.list('-created_date', 100)
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ file, docType, carrier }) => {
      // Upload file
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      // Create upload record
      const upload = await base44.entities.CommissionUpload.create({
        file_url,
        file_name: file.name,
        file_type: file.type,
        document_type: docType,
        carrier_name: carrier,
        status: 'processing',
        uploaded_date: new Date().toISOString()
      });

      // Parse the document
      const parseResult = await base44.functions.invoke('parseCommissionDocument', {
        uploadId: upload.id,
        fileUrl: file_url,
        fileName: file.name,
        fileType: file.type,
        documentType: docType,
        carrierName: carrier
      });

      return { upload, parseResult: parseResult.data };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['commissionUploads']);
      queryClient.invalidateQueries(['parsedCommissionRecords']);
      toast.success(`Document processed: ${data.parseResult?.recordsFound || 0} records found`);
      setUploadModalOpen(false);
      resetUploadForm();
    },
    onError: (error) => {
      toast.error('Failed to process document');
      console.error(error);
    }
  });

  const reconcileMutation = useMutation({
    mutationFn: async () => {
      const result = await base44.functions.invoke('reconcileCommissions', {});
      return result.data;
    },
    onSuccess: (data) => {
      setReconciliationData(data);
      queryClient.invalidateQueries(['parsedCommissionRecords']);
      toast.success(`Reconciliation complete: ${data.summary.matches} matches, ${data.summary.discrepancies} discrepancies found`);
    },
    onError: (error) => {
      toast.error('Failed to reconcile records');
      console.error(error);
    }
  });

  const resolveDiscrepancyMutation = useMutation({
    mutationFn: async ({ recordId, resolution, notes }) => {
      await base44.entities.ParsedCommissionRecord.update(recordId, {
        reconciliation_status: resolution,
        discrepancy_notes: notes
      });
      return recordId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['parsedCommissionRecords']);
      toast.success('Discrepancy resolved');
      setDiscrepancyModalOpen(false);
      setSelectedDiscrepancy(null);
    }
  });

  const resetUploadForm = () => {
    setSelectedFile(null);
    setSelectedDocType('');
    setSelectedCarrier('');
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = () => {
    if (!selectedFile || !selectedDocType) {
      toast.error('Please select a file and document type');
      return;
    }
    uploadMutation.mutate({
      file: selectedFile,
      docType: selectedDocType,
      carrier: selectedCarrier
    });
  };

  const getFileIcon = (fileType) => {
    if (fileType?.includes('csv') || fileType?.includes('spreadsheet')) return FileSpreadsheet;
    if (fileType?.includes('image') || fileType?.includes('jpeg') || fileType?.includes('png')) return FileImage;
    if (fileType?.includes('pdf')) return FileText;
    return File;
  };

  const getStatusBadge = (status) => {
    const configs = {
      processing: { color: 'bg-blue-100 text-blue-700', icon: Loader2, animate: true },
      completed: { color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
      failed: { color: 'bg-red-100 text-red-700', icon: AlertTriangle },
      pending_review: { color: 'bg-amber-100 text-amber-700', icon: Clock }
    };
    const config = configs[status] || configs.pending_review;
    const Icon = config.icon;
    return (
      <Badge className={`${config.color} gap-1`}>
        <Icon className={`w-3 h-3 ${config.animate ? 'animate-spin' : ''}`} />
        {status?.replace('_', ' ')}
      </Badge>
    );
  };

  const filteredUploads = uploads.filter(upload => {
    const matchesSearch = !searchTerm || 
      upload.file_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      upload.carrier_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || upload.document_type === filterType;
    return matchesSearch && matchesType;
  });

  // Stats
  const stats = {
    totalUploads: uploads.length,
    applicationsCount: uploads.filter(u => u.document_type === 'application').length,
    bobCount: uploads.filter(u => u.document_type === 'book_of_business').length,
    commissionCount: uploads.filter(u => u.document_type === 'commission_statement').length,
    totalRecordsParsed: parsedRecords.length,
    pendingReconciliation: parsedRecords.filter(r => r.reconciliation_status === 'pending').length
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Agency Commissions</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Upload and reconcile commission documents</p>
          </div>
          <Button 
            onClick={() => setUploadModalOpen(true)}
            className="bg-teal-600 hover:bg-teal-700 shadow-lg hover:shadow-teal-500/30 transition-all"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Document
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <Card className="border-0 shadow-sm dark:bg-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                  <Upload className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800 dark:text-white">{stats.totalUploads}</p>
                  <p className="text-xs text-slate-500">Total Uploads</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm dark:bg-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800 dark:text-white">{stats.applicationsCount}</p>
                  <p className="text-xs text-slate-500">Applications</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm dark:bg-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800 dark:text-white">{stats.bobCount}</p>
                  <p className="text-xs text-slate-500">Book of Business</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm dark:bg-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800 dark:text-white">{stats.commissionCount}</p>
                  <p className="text-xs text-slate-500">Statements</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm dark:bg-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800 dark:text-white">{stats.totalRecordsParsed}</p>
                  <p className="text-xs text-slate-500">Records Parsed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm dark:bg-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800 dark:text-white">{stats.pendingReconciliation}</p>
                  <p className="text-xs text-slate-500">Pending Review</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white dark:bg-slate-800 shadow-sm p-1 rounded-xl mb-6">
            <TabsTrigger value="uploads" className="rounded-lg gap-2">
              <Upload className="w-4 h-4" />
              Uploads
            </TabsTrigger>
            <TabsTrigger value="applications" className="rounded-lg gap-2">
              <Users className="w-4 h-4" />
              Applications
            </TabsTrigger>
            <TabsTrigger value="reconciliation" className="rounded-lg gap-2">
              <RefreshCw className="w-4 h-4" />
              Reconciliation
            </TabsTrigger>
            <TabsTrigger value="commissions" className="rounded-lg gap-2">
              <DollarSign className="w-4 h-4" />
              Commission Data
            </TabsTrigger>
          </TabsList>

          <TabsContent value="uploads">
            {/* Filters */}
            <Card className="border-0 shadow-sm dark:bg-slate-800 mb-6">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="Search by file name or carrier..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-48">
                      <Filter className="w-4 h-4 mr-2 text-slate-400" />
                      <SelectValue placeholder="Document Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="application">Applications</SelectItem>
                      <SelectItem value="book_of_business">Book of Business</SelectItem>
                      <SelectItem value="commission_statement">Commission Statements</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Uploads List */}
            {uploadsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
              </div>
            ) : filteredUploads.length === 0 ? (
              <Card className="border-0 shadow-sm dark:bg-slate-800">
                <CardContent className="p-12 text-center">
                  <Upload className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">No Documents Uploaded</h3>
                  <p className="text-slate-500 dark:text-slate-400 mb-6">Upload your first commission document to get started</p>
                  <Button onClick={() => setUploadModalOpen(true)} className="bg-teal-600 hover:bg-teal-700">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Document
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredUploads.map((upload, idx) => {
                  const FileIcon = getFileIcon(upload.file_type);
                  const docType = documentTypes.find(d => d.id === upload.document_type);
                  
                  return (
                    <motion.div
                      key={upload.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <Card className="border-0 shadow-sm dark:bg-slate-800 hover:shadow-lg transition-all">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl ${docType?.color || 'bg-slate-500'} flex items-center justify-center`}>
                              <FileIcon className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-slate-800 dark:text-white truncate">{upload.file_name}</h4>
                                {getStatusBadge(upload.status)}
                              </div>
                              <div className="flex items-center gap-4 text-sm text-slate-500">
                                <span className="flex items-center gap-1">
                                  <Building2 className="w-3.5 h-3.5" />
                                  {upload.carrier_name || 'No carrier'}
                                </span>
                                <span>{docType?.label}</span>
                                <span>{upload.uploaded_date ? format(new Date(upload.uploaded_date), 'MMM d, yyyy') : ''}</span>
                              </div>
                              {upload.records_found > 0 && (
                                <p className="text-xs text-teal-600 dark:text-teal-400 mt-1">
                                  {upload.records_found} records extracted
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm" asChild>
                                <a href={upload.file_url} target="_blank" rel="noopener noreferrer">
                                  <Eye className="w-4 h-4" />
                                </a>
                              </Button>
                              <Button variant="ghost" size="sm" asChild>
                                <a href={upload.file_url} download>
                                  <Download className="w-4 h-4" />
                                </a>
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="applications">
            <ApplicationsTab records={parsedRecords.filter(r => r.record_type === 'application')} />
          </TabsContent>

          <TabsContent value="reconciliation">
            <ReconciliationTab 
              records={parsedRecords} 
              reconciliationData={reconciliationData}
              onRunReconciliation={() => reconcileMutation.mutate()}
              isReconciling={reconcileMutation.isPending}
              onViewDiscrepancy={(disc) => {
                setSelectedDiscrepancy(disc);
                setDiscrepancyModalOpen(true);
              }}
            />
          </TabsContent>

          <TabsContent value="commissions">
            <CommissionDataTab records={parsedRecords.filter(r => r.record_type === 'commission')} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Discrepancy Resolution Modal */}
      <Dialog open={discrepancyModalOpen} onOpenChange={setDiscrepancyModalOpen}>
        <DialogContent className="max-w-2xl dark:bg-slate-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Resolve Discrepancy
            </DialogTitle>
          </DialogHeader>

          {selectedDiscrepancy && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-amber-900 dark:text-amber-100 mb-1">
                      {selectedDiscrepancy.type?.replace(/_/g, ' ').toUpperCase()}
                    </p>
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      {selectedDiscrepancy.message}
                    </p>
                  </div>
                  <Badge className={
                    selectedDiscrepancy.severity === 'high' ? 'bg-red-100 text-red-700' :
                    selectedDiscrepancy.severity === 'medium' ? 'bg-amber-100 text-amber-700' :
                    'bg-blue-100 text-blue-700'
                  }>
                    {selectedDiscrepancy.severity} priority
                  </Badge>
                </div>
              </div>

              {selectedDiscrepancy.record && (
                <Card className="dark:bg-slate-900/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Record Details</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-slate-500">Agent:</span>
                        <span className="ml-2 font-medium">{selectedDiscrepancy.record.agent_name || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Client:</span>
                        <span className="ml-2 font-medium">{selectedDiscrepancy.record.client_name || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Carrier:</span>
                        <span className="ml-2 font-medium">{selectedDiscrepancy.record.carrier_name || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Policy #:</span>
                        <span className="ml-2 font-medium">{selectedDiscrepancy.record.policy_number || 'N/A'}</span>
                      </div>
                    </div>
                    {selectedDiscrepancy.expected && selectedDiscrepancy.actual && (
                      <div className="pt-2 border-t dark:border-slate-700 grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-slate-500">Expected Commission:</span>
                          <span className="ml-2 font-medium text-emerald-600">${selectedDiscrepancy.expected.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Actual Commission:</span>
                          <span className="ml-2 font-medium text-rose-600">${selectedDiscrepancy.actual.toFixed(2)}</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <div className="flex gap-3 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setDiscrepancyModalOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => resolveDiscrepancyMutation.mutate({
                    recordId: selectedDiscrepancy.record?.id,
                    resolution: 'matched',
                    notes: 'Manually approved and resolved'
                  })}
                  disabled={!selectedDiscrepancy.record?.id || resolveDiscrepancyMutation.isPending}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                >
                  {resolveDiscrepancyMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  Approve & Match
                </Button>
                <Button 
                  onClick={() => resolveDiscrepancyMutation.mutate({
                    recordId: selectedDiscrepancy.record?.id,
                    resolution: 'unmatched',
                    notes: 'Reviewed - confirmed as unmatched'
                  })}
                  disabled={!selectedDiscrepancy.record?.id || resolveDiscrepancyMutation.isPending}
                  variant="outline"
                  className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                >
                  Mark as Exception
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Upload Modal */}
      <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
        <DialogContent className="max-w-lg dark:bg-slate-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-teal-600" />
              Upload Commission Document
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Document Type Selection */}
            <div>
              <Label className="mb-2 block">Document Type *</Label>
              <div className="grid grid-cols-1 gap-2">
                {documentTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setSelectedDocType(type.id)}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        selectedDocType === type.id
                          ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg ${type.color} flex items-center justify-center`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-800 dark:text-white">{type.label}</p>
                          <p className="text-xs text-slate-500">{type.description}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Carrier Selection */}
            <div>
              <Label className="mb-2 block">Carrier (Optional)</Label>
              <Select value={selectedCarrier} onValueChange={setSelectedCarrier}>
                <SelectTrigger>
                  <SelectValue placeholder="Select carrier..." />
                </SelectTrigger>
                <SelectContent>
                  {carriers.map((carrier) => (
                    <SelectItem key={carrier.id} value={carrier.name}>
                      {carrier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* File Upload */}
            <div>
              <Label className="mb-2 block">File *</Label>
              <div 
                className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
                  selectedFile 
                    ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20' 
                    : 'border-slate-300 dark:border-slate-600 hover:border-slate-400'
                }`}
              >
                {selectedFile ? (
                  <div className="flex items-center justify-center gap-3">
                    <FileText className="w-8 h-8 text-teal-600" />
                    <div className="text-left">
                      <p className="font-medium text-slate-800 dark:text-white">{selectedFile.name}</p>
                      <p className="text-xs text-slate-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedFile(null)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <Upload className="w-10 h-10 mx-auto text-slate-400 mb-2" />
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                      Drag & drop or click to upload
                    </p>
                    <p className="text-xs text-slate-400">CSV, PDF, Word, JPEG (max 10MB)</p>
                  </>
                )}
                <input
                  type="file"
                  accept={acceptedFileTypes}
                  onChange={handleFileSelect}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  style={{ position: 'absolute', top: 0, left: 0 }}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => { setUploadModalOpen(false); resetUploadForm(); }}>
                Cancel
              </Button>
              <Button 
                onClick={handleUpload}
                disabled={!selectedFile || !selectedDocType || uploadMutation.isPending}
                className="bg-teal-600 hover:bg-teal-700"
              >
                {uploadMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload & Process
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Applications Tab Component
function ApplicationsTab({ records }) {
  if (records.length === 0) {
    return (
      <Card className="border-0 shadow-sm dark:bg-slate-800">
        <CardContent className="p-12 text-center">
          <Users className="w-16 h-16 mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">No Applications Parsed</h3>
          <p className="text-slate-500">Upload agent application documents to see them here</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm dark:bg-slate-800">
      <CardHeader>
        <CardTitle className="text-base">Parsed Applications ({records.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b dark:border-slate-700">
                <th className="text-left py-3 px-2 font-medium text-slate-600 dark:text-slate-400">Agent</th>
                <th className="text-left py-3 px-2 font-medium text-slate-600 dark:text-slate-400">Client</th>
                <th className="text-left py-3 px-2 font-medium text-slate-600 dark:text-slate-400">Carrier</th>
                <th className="text-left py-3 px-2 font-medium text-slate-600 dark:text-slate-400">Plan</th>
                <th className="text-left py-3 px-2 font-medium text-slate-600 dark:text-slate-400">Submit Date</th>
                <th className="text-left py-3 px-2 font-medium text-slate-600 dark:text-slate-400">Status</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id} className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <td className="py-3 px-2 text-slate-800 dark:text-white">{record.agent_name || '-'}</td>
                  <td className="py-3 px-2 text-slate-600 dark:text-slate-400">{record.client_name || '-'}</td>
                  <td className="py-3 px-2 text-slate-600 dark:text-slate-400">{record.carrier_name || '-'}</td>
                  <td className="py-3 px-2 text-slate-600 dark:text-slate-400">{record.plan_name || '-'}</td>
                  <td className="py-3 px-2 text-slate-600 dark:text-slate-400">
                    {record.effective_date ? format(new Date(record.effective_date), 'MMM d, yyyy') : '-'}
                  </td>
                  <td className="py-3 px-2">
                    <Badge variant="outline" className="capitalize">{record.status || 'pending'}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// Reconciliation Tab Component
function ReconciliationTab({ records, reconciliationData, onRunReconciliation, isReconciling, onViewDiscrepancy }) {
  const applications = records.filter(r => r.record_type === 'application');
  const bobRecords = records.filter(r => r.record_type === 'book_of_business');
  const commissions = records.filter(r => r.record_type === 'commission');

  const matched = records.filter(r => r.reconciliation_status === 'matched').length;
  const unmatched = records.filter(r => r.reconciliation_status === 'unmatched').length;
  const discrepancies = records.filter(r => r.reconciliation_status === 'discrepancy').length;

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <Card className="border-0 shadow-sm dark:bg-slate-800">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-slate-800 dark:text-white mb-1">Automatic Reconciliation</p>
              <p className="text-sm text-slate-500">Match applications, policies, and commissions to find discrepancies</p>
            </div>
            <Button 
              onClick={onRunReconciliation}
              disabled={isReconciling || records.length === 0}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {isReconciling ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Reconciling...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Run Reconciliation
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="border-0 shadow-sm dark:bg-slate-800">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{applications.length}</p>
            <p className="text-xs text-slate-500">Applications</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm dark:bg-slate-800">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">{bobRecords.length}</p>
            <p className="text-xs text-slate-500">BOB Records</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm dark:bg-slate-800">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{commissions.length}</p>
            <p className="text-xs text-slate-500">Commissions</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm dark:bg-slate-800">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{matched}</p>
            <p className="text-xs text-slate-500">Matched</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm dark:bg-slate-800">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-slate-600">{unmatched}</p>
            <p className="text-xs text-slate-500">Unmatched</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm dark:bg-slate-800">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{discrepancies}</p>
            <p className="text-xs text-slate-500">Discrepancies</p>
          </CardContent>
        </Card>
      </div>

      {/* Reconciliation Results */}
      {reconciliationData ? (
        <div className="space-y-4">
          {/* Summary Card */}
          <Card className="border-0 shadow-sm dark:bg-slate-800 bg-gradient-to-r from-teal-500 to-emerald-500 text-white">
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-teal-100 text-sm mb-1">Matches Found</p>
                  <p className="text-3xl font-bold">{reconciliationData.summary.matches}</p>
                </div>
                <div>
                  <p className="text-teal-100 text-sm mb-1">Discrepancies</p>
                  <p className="text-3xl font-bold">{reconciliationData.summary.discrepancies}</p>
                </div>
                <div>
                  <p className="text-teal-100 text-sm mb-1">Records Updated</p>
                  <p className="text-3xl font-bold">{reconciliationData.summary.updatedRecords}</p>
                </div>
                <div>
                  <p className="text-teal-100 text-sm mb-1">Match Rate</p>
                  <p className="text-3xl font-bold">
                    {reconciliationData.summary.totalRecords > 0 
                      ? Math.round((reconciliationData.summary.matches / reconciliationData.summary.totalRecords) * 100)
                      : 0}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Discrepancies List */}
          {reconciliationData.discrepancies.length > 0 && (
            <Card className="border-0 shadow-sm dark:bg-slate-800">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  Discrepancies Requiring Review ({reconciliationData.discrepancies.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reconciliationData.discrepancies.map((disc, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className={`p-4 rounded-lg border-l-4 ${
                        disc.severity === 'high' ? 'border-red-500 bg-red-50 dark:bg-red-900/10' :
                        disc.severity === 'medium' ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/10' :
                        'border-blue-500 bg-blue-50 dark:bg-blue-900/10'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={
                              disc.severity === 'high' ? 'bg-red-100 text-red-700' :
                              disc.severity === 'medium' ? 'bg-amber-100 text-amber-700' :
                              'bg-blue-100 text-blue-700'
                            }>
                              {disc.type.replace(/_/g, ' ')}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {disc.severity} priority
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-700 dark:text-slate-300 font-medium mb-1">
                            {disc.message}
                          </p>
                          {disc.record && (
                            <div className="flex items-center gap-4 text-xs text-slate-500 mt-2">
                              {disc.record.agent_name && <span>Agent: {disc.record.agent_name}</span>}
                              {disc.record.client_name && <span>Client: {disc.record.client_name}</span>}
                              {disc.record.carrier_name && <span>Carrier: {disc.record.carrier_name}</span>}
                            </div>
                          )}
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => onViewDiscrepancy(disc)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Review
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Agent Statistics */}
          {reconciliationData.agentStats && Object.keys(reconciliationData.agentStats).length > 0 && (
            <Card className="border-0 shadow-sm dark:bg-slate-800">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="w-5 h-5 text-teal-600" />
                  Agent Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b dark:border-slate-700">
                        <th className="text-left py-3 px-2 font-medium text-slate-600 dark:text-slate-400">Agent</th>
                        <th className="text-center py-3 px-2 font-medium text-slate-600 dark:text-slate-400">Applications</th>
                        <th className="text-center py-3 px-2 font-medium text-slate-600 dark:text-slate-400">Policies</th>
                        <th className="text-center py-3 px-2 font-medium text-slate-600 dark:text-slate-400">Commissions</th>
                        <th className="text-center py-3 px-2 font-medium text-slate-600 dark:text-slate-400">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(reconciliationData.agentStats).map(([agent, stats]) => (
                        <tr key={agent} className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                          <td className="py-3 px-2 font-medium text-slate-800 dark:text-white">{agent}</td>
                          <td className="py-3 px-2 text-center text-blue-600">{stats.applications}</td>
                          <td className="py-3 px-2 text-center text-emerald-600">{stats.policies}</td>
                          <td className="py-3 px-2 text-center text-amber-600">{stats.commissions}</td>
                          <td className="py-3 px-2 text-center">
                            {stats.applications > 0 && stats.policies > 0 && stats.commissions > 0 ? (
                              <Badge className="bg-green-100 text-green-700">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Complete
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-amber-600">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                Incomplete
                              </Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <Card className="border-0 shadow-sm dark:bg-slate-800">
          <CardContent className="p-12 text-center">
            <RefreshCw className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">Ready to Reconcile</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6">
              Click "Run Reconciliation" to automatically match and verify your commission data
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Commission Data Tab Component
function CommissionDataTab({ records }) {
  if (records.length === 0) {
    return (
      <Card className="border-0 shadow-sm dark:bg-slate-800">
        <CardContent className="p-12 text-center">
          <DollarSign className="w-16 h-16 mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">No Commission Data</h3>
          <p className="text-slate-500">Upload commission statements to see standardized data here</p>
        </CardContent>
      </Card>
    );
  }

  const totalCommission = records.reduce((sum, r) => sum + (r.commission_amount || 0), 0);

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-sm dark:bg-slate-800 bg-gradient-to-r from-amber-500 to-orange-500 text-white">
        <CardContent className="p-6">
          <p className="text-amber-100 text-sm mb-1">Total Commission (Parsed)</p>
          <p className="text-4xl font-bold">${totalCommission.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm dark:bg-slate-800">
        <CardHeader>
          <CardTitle className="text-base">Standardized Commission Records ({records.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b dark:border-slate-700">
                  <th className="text-left py-3 px-2 font-medium text-slate-600 dark:text-slate-400">Agent</th>
                  <th className="text-left py-3 px-2 font-medium text-slate-600 dark:text-slate-400">Carrier</th>
                  <th className="text-left py-3 px-2 font-medium text-slate-600 dark:text-slate-400">Policy #</th>
                  <th className="text-left py-3 px-2 font-medium text-slate-600 dark:text-slate-400">Client</th>
                  <th className="text-right py-3 px-2 font-medium text-slate-600 dark:text-slate-400">Commission</th>
                  <th className="text-left py-3 px-2 font-medium text-slate-600 dark:text-slate-400">Period</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id} className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="py-3 px-2 text-slate-800 dark:text-white">{record.agent_name || '-'}</td>
                    <td className="py-3 px-2 text-slate-600 dark:text-slate-400">{record.carrier_name || '-'}</td>
                    <td className="py-3 px-2 text-slate-600 dark:text-slate-400">{record.policy_number || '-'}</td>
                    <td className="py-3 px-2 text-slate-600 dark:text-slate-400">{record.client_name || '-'}</td>
                    <td className="py-3 px-2 text-right font-medium text-emerald-600">
                      ${(record.commission_amount || 0).toFixed(2)}
                    </td>
                    <td className="py-3 px-2 text-slate-600 dark:text-slate-400">{record.commission_period || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}