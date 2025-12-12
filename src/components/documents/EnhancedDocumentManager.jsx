import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, Filter, FileText, History, Eye, Download, 
  Loader2, Clock, Tag, ChevronRight, FileSearch
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import DocumentVersionHistory from './DocumentVersionHistory';

export default function EnhancedDocumentManager({ agentId, carrierId, agencyId }) {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('name'); // name, content, tags
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [showVersionHistory, setShowVersionHistory] = useState(false);

  // Fetch documents with filters
  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['enhancedDocuments', agentId, carrierId, agencyId],
    queryFn: async () => {
      let query = { is_latest_version: true };
      if (agentId) query.agent_id = agentId;
      if (carrierId) query.carrier_name = carrierId;
      if (agencyId) query.agency_id = agencyId;
      return await base44.entities.Document.filter(query, '-created_date');
    }
  });

  // OCR processing mutation
  const processOCRMutation = useMutation({
    mutationFn: async (document) => {
      return await base44.functions.invoke('processDocumentOCR', {
        document_id: document.id,
        file_url: document.file_url
      });
    },
    onSuccess: (result, document) => {
      toast.success('Document text extracted successfully');
      queryClient.invalidateQueries(['enhancedDocuments']);
    },
    onError: () => {
      toast.error('Failed to process document');
    }
  });

  // Get all unique tags
  const allTags = [...new Set(documents.flatMap(doc => doc.tags || []))];

  // Advanced filtering
  const filteredDocuments = documents.filter(doc => {
    // Search by name
    if (searchType === 'name' && searchQuery) {
      const matchesName = doc.name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFileName = doc.file_name?.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesName && !matchesFileName) return false;
    }

    // Search by OCR content
    if (searchType === 'content' && searchQuery && doc.ocr_processed) {
      if (!doc.ocr_text?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    }

    // Search by tags
    if (searchType === 'tags' && searchQuery) {
      const hasTags = doc.tags?.some(tag => 
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      );
      const hasAutoTags = Object.values(doc.auto_tags || {}).some(tag =>
        tag?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      if (!hasTags && !hasAutoTags) return false;
    }

    // Filter by selected tags
    if (selectedTags.length > 0) {
      const hasSelectedTag = selectedTags.some(tag => doc.tags?.includes(tag));
      if (!hasSelectedTag) return false;
    }

    return true;
  });

  // Stats
  const stats = {
    total: documents.length,
    processed: documents.filter(d => d.ocr_processed).length,
    pending: documents.filter(d => !d.ocr_processed).length,
    withVersions: documents.filter(d => d.version > 1).length
  };

  const toggleTag = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleViewVersions = (doc) => {
    setSelectedDoc(doc);
    setShowVersionHistory(true);
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm dark:bg-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Total Documents</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
              </div>
              <FileText className="w-8 h-8 text-teal-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm dark:bg-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">OCR Processed</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.processed}</p>
              </div>
              <FileSearch className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm dark:bg-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Pending OCR</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm dark:bg-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">With Versions</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.withVersions}</p>
              </div>
              <History className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter */}
      <Card className="border-0 shadow-sm dark:bg-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Advanced Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={searchType} onValueChange={setSearchType}>
            <TabsList>
              <TabsTrigger value="name">Name</TabsTrigger>
              <TabsTrigger value="content">Content (OCR)</TabsTrigger>
              <TabsTrigger value="tags">Tags</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex gap-3">
            <Input
              placeholder={`Search by ${searchType}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button variant="outline" onClick={() => setSearchQuery('')}>
              Clear
            </Button>
          </div>

          {allTags.length > 0 && (
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Filter by tags:</p>
              <div className="flex flex-wrap gap-2">
                {allTags.map(tag => (
                  <Badge
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`cursor-pointer ${
                      selectedTags.includes(tag)
                        ? 'bg-teal-500 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <Tag className="w-3 h-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card className="border-0 shadow-lg dark:bg-slate-800">
        <CardHeader>
          <CardTitle>Documents ({filteredDocuments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No documents found
            </div>
          ) : (
            <div className="space-y-3">
              {filteredDocuments.map(doc => (
                <div
                  key={doc.id}
                  className="p-4 rounded-lg border dark:border-slate-700 hover:border-teal-300 dark:hover:border-teal-600 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium text-slate-900 dark:text-white">{doc.name}</h3>
                        {doc.version > 1 && (
                          <Badge variant="outline" className="text-xs">v{doc.version}</Badge>
                        )}
                        {doc.ocr_processed && (
                          <Badge className="bg-blue-100 text-blue-700 text-xs">
                            <FileSearch className="w-3 h-3 mr-1" />
                            OCR
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-slate-500 mb-2">{doc.file_name}</p>
                      
                      {/* Tags */}
                      {(doc.tags?.length > 0 || doc.auto_tags) && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {doc.tags?.map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {doc.auto_tags?.carrier && (
                            <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700">
                              {doc.auto_tags.carrier}
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* OCR Preview */}
                      {searchType === 'content' && doc.ocr_text && searchQuery && (
                        <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-xs">
                          <p className="text-slate-600 dark:text-slate-400">
                            ...{doc.ocr_text.substring(
                              Math.max(0, doc.ocr_text.toLowerCase().indexOf(searchQuery.toLowerCase()) - 40),
                              doc.ocr_text.toLowerCase().indexOf(searchQuery.toLowerCase()) + 80
                            )}...
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {!doc.ocr_processed && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => processOCRMutation.mutate(doc)}
                          disabled={processOCRMutation.isPending}
                        >
                          {processOCRMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <FileSearch className="w-4 h-4 mr-1" />
                              Extract Text
                            </>
                          )}
                        </Button>
                      )}
                      {doc.version > 1 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewVersions(doc)}
                        >
                          <History className="w-4 h-4 mr-1" />
                          History
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" asChild>
                        <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                          <Eye className="w-4 h-4" />
                        </a>
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                    <span>Uploaded {format(new Date(doc.created_date), 'MMM d, yyyy')}</span>
                    {doc.expiration_date && (
                      <span>Expires {format(new Date(doc.expiration_date), 'MMM d, yyyy')}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Version History Modal */}
      {showVersionHistory && selectedDoc && (
        <DocumentVersionHistory
          document={selectedDoc}
          open={showVersionHistory}
          onClose={() => {
            setShowVersionHistory(false);
            setSelectedDoc(null);
          }}
        />
      )}
    </div>
  );
}