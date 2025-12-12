import { useState } from 'react'
import { base44 } from '@/api/base44Client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { 
  FileText, Download, Eye, Search, 
  File, FileImage, Folder,
  Shield, Calendar, Upload, X, Loader2,
  ArrowUpDown, SortAsc, SortDesc, Filter
} from 'lucide-react';
import { format } from 'date-fns'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

const documentCategories = [
  { id: 'policy', label: 'Policy Documents', icon: Shield },
  { id: 'enrollment', label: 'Enrollment Forms', icon: FileText },
  { id: 'benefits', label: 'Benefits Guide', icon: File },
  { id: 'id_cards', label: 'ID Cards', icon: FileImage },
  { id: 'other', label: 'Other', icon: Folder }
];

const resourceLibrary = [
  {
    id: 1,
    title: 'Understanding Your Medicare Advantage Plan',
    description: 'A complete guide to your benefits and how to use them.',
    category: 'benefits',
    type: 'PDF',
    planType: 'medicare_advantage'
  },
  {
    id: 2,
    title: 'Prescription Drug Coverage Guide',
    description: 'Learn about your drug formulary and pharmacy network.',
    category: 'benefits',
    type: 'PDF',
    planType: 'medicare_advantage'
  },
  {
    id: 3,
    title: 'Finding In-Network Providers',
    description: 'How to search for doctors and specialists in your network.',
    category: 'benefits',
    type: 'Guide',
    planType: 'medicare_advantage'
  },
  {
    id: 4,
    title: 'Understanding Your Medigap Policy',
    description: 'What your supplement plan covers and how it works with Medicare.',
    category: 'benefits',
    type: 'PDF',
    planType: 'supplement'
  },
  {
    id: 5,
    title: 'Part D Formulary Guide',
    description: 'Complete list of covered medications and tiers.',
    category: 'benefits',
    type: 'PDF',
    planType: 'pdp'
  },
  {
    id: 6,
    title: 'Annual Enrollment Period FAQ',
    description: 'Important dates and what you need to know about AEP.',
    category: 'enrollment',
    type: 'Article'
  },
  {
    id: 7,
    title: 'How to Request a New ID Card',
    description: 'Steps to get a replacement insurance ID card.',
    category: 'id_cards',
    type: 'Guide'
  }
];

function ClientPortalDocuments({ client }) {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadCategory, setUploadCategory] = useState('other');
  const [uploadName, setUploadName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  
  // My Documents filters
  const [myDocsSearch, setMyDocsSearch] = useState('');
  const [myDocsSort, setMyDocsSort] = useState('date_desc');
  const [myDocsTypeFilter, setMyDocsTypeFilter] = useState('all');

  const { data: uploadedDocs = [] } = useQuery({
    queryKey: ['clientDocuments', client?.id],
    queryFn: async () => {
      if (!client?.id) return [];
      const docs = await base44.entities.Document.filter({ 
        related_entity_type: 'client',
        related_entity_id: client.id 
      });
      return docs;
    },
    enabled: !!client?.id
  });

  const uploadDocumentMutation = useMutation({
    mutationFn: async ({ file, name, category }) => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.Document.create({
        agent_id: client.agent_id,
        name: name || file.name,
        document_type: category,
        file_url,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        related_entity_type: 'client',
        related_entity_id: client.id,
        status: 'pending_verification'
      });
    },
    onSuccess: () => {
      toast.success('Document uploaded successfully!');
      queryClient.invalidateQueries(['clientDocuments', client?.id]);
      setShowUploadModal(false);
      setUploadFile(null);
      setUploadName('');
      setUploadCategory('other');
    },
    onError: (error) => {
      toast.error('Failed to upload document');
      console.error(error);
    }
  });

  const handleUpload = async () => {
    if (!uploadFile) {
      toast.error('Please select a file');
      return;
    }
    setIsUploading(true);
    await uploadDocumentMutation.mutateAsync({
      file: uploadFile,
      name: uploadName || uploadFile.name,
      category: uploadCategory
    });
    setIsUploading(false);
  };

  const getFileExtension = (filename) => {
    return filename?.split('.').pop()?.toLowerCase() || '';
  };

  const getFileTypeLabel = (doc) => {
    const ext = getFileExtension(doc.file_name);
    if (['pdf'].includes(ext)) return 'PDF';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'Image';
    if (['doc', 'docx'].includes(ext)) return 'Word';
    if (['xls', 'xlsx'].includes(ext)) return 'Excel';
    return 'Other';
  };

  // Filter and sort My Documents
  const filteredAndSortedDocs = [...uploadedDocs]
    .filter(doc => {
      const matchesSearch = myDocsSearch === '' || 
        doc.name?.toLowerCase().includes(myDocsSearch.toLowerCase()) ||
        doc.file_name?.toLowerCase().includes(myDocsSearch.toLowerCase());
      const matchesType = myDocsTypeFilter === 'all' || getFileTypeLabel(doc) === myDocsTypeFilter;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      switch (myDocsSort) {
        case 'date_desc':
          return new Date(b.created_date) - new Date(a.created_date);
        case 'date_asc':
          return new Date(a.created_date) - new Date(b.created_date);
        case 'name_asc':
          return (a.name || a.file_name || '').localeCompare(b.name || b.file_name || '');
        case 'name_desc':
          return (b.name || b.file_name || '').localeCompare(a.name || a.file_name || '');
        case 'type':
          return getFileTypeLabel(a).localeCompare(getFileTypeLabel(b));
        default:
          return 0;
      }
    });

  const filteredResources = resourceLibrary.filter(resource => {
    const matchesSearch = searchTerm === '' || 
      resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || resource.category === selectedCategory;
    const matchesPlanType = !resource.planType || resource.planType === client?.plan_type;
    
    return matchesSearch && matchesCategory && matchesPlanType;
  });

  const getFileIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'pdf':
      case 'image':
        return FileText;
      default:
        return FileText;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Card className="border-0 shadow-sm dark:bg-slate-800">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={selectedCategory === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory('all')}
                  className={selectedCategory === 'all' ? 'bg-teal-600 hover:bg-teal-700' : ''}
                >
                  All
                </Button>
                {documentCategories.slice(0, 3).map(cat => (
                  <Button
                    key={cat.id}
                    variant={selectedCategory === cat.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={selectedCategory === cat.id ? 'bg-teal-600 hover:bg-teal-700' : ''}
                  >
                    {cat.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm dark:bg-slate-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-5 h-5 text-teal-600" />
              Resource Library
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredResources.length === 0 ? (
              <div className="text-center py-8">
                <Folder className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                <p className="text-slate-500 dark:text-slate-400">No documents found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredResources.map((resource, index) => {
                  const FileIcon = getFileIcon(resource.type);
                  return (
                    <motion.div
                      key={resource.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-start gap-4 p-4 rounded-xl border dark:border-slate-700 hover:border-teal-300 dark:hover:border-teal-600 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all group cursor-pointer"
                    >
                      <div className="w-12 h-12 rounded-lg bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center shrink-0">
                        <FileIcon className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-slate-800 dark:text-white group-hover:text-teal-700 dark:group-hover:text-teal-400 transition-colors">
                          {resource.title}
                        </h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                          {resource.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary" className="text-xs">{resource.type}</Badge>
                          <Badge variant="outline" className="text-xs">
                            {documentCategories.find(c => c.id === resource.category)?.label || resource.category}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button size="sm" variant="ghost" className="text-slate-400 hover:text-teal-600">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-slate-400 hover:text-teal-600">
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* My Documents Section */}
        <Card className="border-0 shadow-sm dark:bg-slate-800">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Folder className="w-5 h-5 text-blue-600" />
                My Documents
                {uploadedDocs.length > 0 && (
                  <Badge variant="secondary" className="ml-2">{uploadedDocs.length}</Badge>
                )}
              </CardTitle>
              <Button 
                size="sm" 
                onClick={() => setShowUploadModal(true)}
                className="bg-teal-600 hover:bg-teal-700"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {uploadedDocs.length > 0 && (
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search my documents..."
                    value={myDocsSearch}
                    onChange={(e) => setMyDocsSearch(e.target.value)}
                    className="pl-10 h-9"
                  />
                </div>
                <Select value={myDocsSort} onValueChange={setMyDocsSort}>
                  <SelectTrigger className="w-[140px] h-9">
                    <ArrowUpDown className="w-3 h-3 mr-2" />
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date_desc">Newest First</SelectItem>
                    <SelectItem value="date_asc">Oldest First</SelectItem>
                    <SelectItem value="name_asc">Name A-Z</SelectItem>
                    <SelectItem value="name_desc">Name Z-A</SelectItem>
                    <SelectItem value="type">File Type</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={myDocsTypeFilter} onValueChange={setMyDocsTypeFilter}>
                  <SelectTrigger className="w-[120px] h-9">
                    <Filter className="w-3 h-3 mr-2" />
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="PDF">PDF</SelectItem>
                    <SelectItem value="Image">Image</SelectItem>
                    <SelectItem value="Word">Word</SelectItem>
                    <SelectItem value="Excel">Excel</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {filteredAndSortedDocs.length === 0 ? (
              <div className="text-center py-8">
                <Folder className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                <p className="text-slate-500 dark:text-slate-400 mb-2">
                  {uploadedDocs.length === 0 ? 'No documents uploaded yet' : 'No documents match your filters'}
                </p>
                {uploadedDocs.length === 0 && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setShowUploadModal(true)}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Your First Document
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredAndSortedDocs.map((doc) => {
                  const fileType = getFileTypeLabel(doc);
                  return (
                    <motion.div 
                      key={doc.id} 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        fileType === 'PDF' ? 'bg-red-100 dark:bg-red-900/40' :
                        fileType === 'Image' ? 'bg-purple-100 dark:bg-purple-900/40' :
                        fileType === 'Word' ? 'bg-blue-100 dark:bg-blue-900/40' :
                        fileType === 'Excel' ? 'bg-green-100 dark:bg-green-900/40' :
                        'bg-slate-200 dark:bg-slate-700'
                      }`}>
                        <FileText className={`w-5 h-5 ${
                          fileType === 'PDF' ? 'text-red-600' :
                          fileType === 'Image' ? 'text-purple-600' :
                          fileType === 'Word' ? 'text-blue-600' :
                          fileType === 'Excel' ? 'text-green-600' :
                          'text-slate-500'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-800 dark:text-white text-sm truncate">
                          {doc.name || doc.file_name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" className="text-xs">{fileType}</Badge>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {format(new Date(doc.created_date), 'MMM d, yyyy')}
                          </span>
                          {doc.file_size && (
                            <span className="text-xs text-slate-400">
                              {(doc.file_size / 1024).toFixed(0)} KB
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {doc.file_url && (
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => window.open(doc.file_url, '_blank')}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        )}
                        {doc.file_url && (
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => {
                              const a = document.createElement('a');
                              a.href = doc.file_url;
                              a.download = doc.file_name || doc.name;
                              a.click();
                            }}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="border-0 shadow-sm dark:bg-slate-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Quick Access</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {documentCategories.map((cat) => {
                const IconComponent = cat.icon;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                      selectedCategory === cat.id
                        ? 'bg-teal-50 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-700'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    <IconComponent className={`w-5 h-5 ${selectedCategory === cat.id ? 'text-teal-600' : 'text-slate-400'}`} />
                    <span className={`text-sm font-medium ${selectedCategory === cat.id ? 'text-teal-700 dark:text-teal-400' : 'text-slate-700 dark:text-slate-300'}`}>
                      {cat.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm dark:bg-slate-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileImage className="w-5 h-5 text-purple-500" />
              Your ID Card
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="aspect-[1.6/1] rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 p-4 flex flex-col justify-between text-white">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-slate-300">Insurance ID</p>
                  <p className="font-mono text-sm">
                    {client?.medicare_id ? `****-${client.medicare_id.slice(-4)}` : '••••-••••'}
                  </p>
                </div>
                <Shield className="w-6 h-6 text-teal-400" />
              </div>
              <div>
                <p className="text-xs text-slate-300">Member</p>
                <p className="font-medium">{client?.first_name} {client?.last_name}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full mt-3">
              <Download className="w-4 h-4 mr-2" />
              Download ID Card
            </Button>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm dark:bg-slate-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-500" />
              Important Dates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50">
              <p className="text-xs text-slate-500 dark:text-slate-400">Annual Enrollment Period</p>
              <p className="font-medium text-slate-800 dark:text-white text-sm">Oct 15 - Dec 7</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50">
              <p className="text-xs text-slate-500 dark:text-slate-400">Open Enrollment Period</p>
              <p className="font-medium text-slate-800 dark:text-white text-sm">Jan 1 - Mar 31</p>
            </div>
            {client?.renewal_date && (
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800">
                <p className="text-xs text-amber-600 dark:text-amber-400">Your Renewal Date</p>
                <p className="font-medium text-amber-700 dark:text-amber-300 text-sm">
                  {format(new Date(client.renewal_date), 'MMM d, yyyy')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      {/* Upload Modal */}
      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent className="max-w-md dark:bg-slate-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-teal-600" />
              Upload Document
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">Document Category</Label>
              <Select value={uploadCategory} onValueChange={setUploadCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="id_verification">ID / Verification</SelectItem>
                  <SelectItem value="eo_certificate">Insurance Certificate</SelectItem>
                  <SelectItem value="compliance_training">Compliance Document</SelectItem>
                  <SelectItem value="contract">Contract / Agreement</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">Document Name (Optional)</Label>
              <Input
                placeholder="Enter a name for this document"
                value={uploadName}
                onChange={(e) => setUploadName(e.target.value)}
              />
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">Select File</Label>
              {uploadFile ? (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border dark:border-slate-700">
                  <FileText className="w-5 h-5 text-teal-600" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 dark:text-white truncate">
                      {uploadFile.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {(uploadFile.size / 1024).toFixed(0)} KB
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setUploadFile(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:border-teal-400 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors dark:border-slate-600">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 text-slate-400 mb-2" />
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      PDF, DOC, JPG, PNG up to 10MB
                    </p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.xls,.xlsx"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 10 * 1024 * 1024) {
                          toast.error('File size must be less than 10MB');
                          return;
                        }
                        setUploadFile(file);
                      }
                    }}
                  />
                </label>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadFile(null);
                  setUploadName('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!uploadFile || isUploading}
                className="bg-teal-600 hover:bg-teal-700"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Document
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

export default ClientPortalDocuments;