import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Search, FileText, Filter, Calendar, AlertCircle, 
  Download, Eye, Sparkles, X, Tag
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

export default function AIDocumentSearchPanel({ clientId }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTags, setSelectedTags] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['aiDocuments', clientId],
    queryFn: async () => {
      return await base44.entities.Document.filter(
        clientId ? { client_id: clientId } : {},
        '-created_date'
      );
    }
  });

  // Extract unique categories and tags
  const categories = [...new Set(documents.filter(d => d.ai_category).map(d => d.ai_category))];
  const allTags = [...new Set(documents.flatMap(d => d.ai_tags || []))];

  // Smart search function
  const filteredDocuments = documents.filter(doc => {
    // Category filter
    if (selectedCategory !== 'all' && doc.ai_category !== selectedCategory) {
      return false;
    }

    // Tag filter
    if (selectedTags.length > 0) {
      const docTags = doc.ai_tags || [];
      if (!selectedTags.some(tag => docTags.includes(tag))) {
        return false;
      }
    }

    // Search query - smart search across multiple fields
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const searchableText = [
        doc.file_name,
        doc.document_type,
        doc.description,
        doc.ai_summary,
        doc.ai_category,
        ...(doc.ai_tags || []),
        JSON.stringify(doc.ai_extracted_data || {})
      ].filter(Boolean).join(' ').toLowerCase();

      return searchableText.includes(query);
    }

    return true;
  });

  const getCategoryIcon = (category) => {
    const icons = {
      policy_document: '📄',
      identification: '🪪',
      medical_record: '🏥',
      financial: '💰',
      legal: '⚖️',
      correspondence: '✉️',
      claim_document: '📋',
      application: '📝',
      other: '📁'
    };
    return icons[category] || '📄';
  };

  const getCategoryColor = (category) => {
    const colors = {
      policy_document: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      identification: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      medical_record: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      financial: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      legal: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      correspondence: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
      claim_document: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      application: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
      other: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-400'
    };
    return colors[category] || colors.other;
  };

  const toggleTag = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  if (isLoading) {
    return (
      <Card className="border-0 shadow-lg dark:bg-slate-800">
        <CardContent className="py-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto" />
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-4">Loading documents...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg dark:bg-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-teal-600" />
            AI-Powered Document Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Bar */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, content, tags, policy number, dates..."
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? 'bg-teal-50 dark:bg-teal-900/20' : ''}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>

          {/* Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3"
              >
                {/* Category Filter */}
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                    Category
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant={selectedCategory === 'all' ? 'default' : 'outline'}
                      onClick={() => setSelectedCategory('all')}
                      className="h-8"
                    >
                      All
                    </Button>
                    {categories.map(cat => (
                      <Button
                        key={cat}
                        size="sm"
                        variant={selectedCategory === cat ? 'default' : 'outline'}
                        onClick={() => setSelectedCategory(cat)}
                        className="h-8"
                      >
                        {getCategoryIcon(cat)} {cat.replace('_', ' ')}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Tag Filter */}
                {allTags.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                      Tags
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {allTags.slice(0, 15).map(tag => (
                        <Badge
                          key={tag}
                          onClick={() => toggleTag(tag)}
                          className={`cursor-pointer ${
                            selectedTags.includes(tag)
                              ? 'bg-teal-600 text-white'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <Tag className="w-3 h-3 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Clear Filters */}
                {(selectedCategory !== 'all' || selectedTags.length > 0) && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setSelectedCategory('all');
                      setSelectedTags([]);
                    }}
                    className="h-7"
                  >
                    <X className="w-3 h-3 mr-1" />
                    Clear Filters
                  </Button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results Count */}
          <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
            <span>
              {filteredDocuments.length} {filteredDocuments.length === 1 ? 'document' : 'documents'} found
            </span>
            {documents.filter(d => d.ai_processed).length > 0 && (
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                {documents.filter(d => d.ai_processed).length} AI-processed
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      <AnimatePresence>
        {filteredDocuments.map((doc, index) => (
          <motion.div
            key={doc.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="border-0 shadow-lg dark:bg-slate-800 hover:shadow-xl transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-800 dark:text-white truncate">
                        {doc.file_name}
                      </h3>
                      
                      {doc.ai_summary && (
                        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 line-clamp-2">
                          {doc.ai_summary}
                        </p>
                      )}

                      {/* Category and Tags */}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {doc.ai_category && (
                          <Badge className={getCategoryColor(doc.ai_category)}>
                            {getCategoryIcon(doc.ai_category)} {doc.ai_category.replace('_', ' ')}
                          </Badge>
                        )}
                        {doc.ai_tags?.slice(0, 3).map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {doc.ai_processed && (
                          <Badge className="bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400">
                            <Sparkles className="w-3 h-3 mr-1" />
                            AI Processed
                          </Badge>
                        )}
                        {doc.ai_requires_attention && (
                          <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Attention Required
                          </Badge>
                        )}
                      </div>

                      {/* Extracted Data Preview */}
                      {doc.ai_extracted_data && Object.keys(doc.ai_extracted_data).length > 0 && (
                        <div className="mt-3 p-2 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            {Object.entries(doc.ai_extracted_data)
                              .filter(([_, value]) => value)
                              .slice(0, 4)
                              .map(([key, value]) => (
                                <div key={key}>
                                  <span className="text-slate-500 dark:text-slate-400">
                                    {key.replace('_', ' ')}:
                                  </span>
                                  <span className="ml-1 text-slate-700 dark:text-slate-300 font-medium">
                                    {String(value)}
                                  </span>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                      {/* Important Dates */}
                      {doc.ai_important_dates && doc.ai_important_dates.length > 0 && (
                        <div className="mt-2 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <Calendar className="w-3 h-3" />
                          {doc.ai_important_dates[0].description}: {doc.ai_important_dates[0].date}
                        </div>
                      )}

                      {/* Metadata */}
                      <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                        <span>
                          Uploaded {format(new Date(doc.created_date), 'MMM d, yyyy')}
                        </span>
                        {doc.ai_confidence_score && (
                          <span className="flex items-center gap-1">
                            Confidence: {doc.ai_confidence_score}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 ml-4">
                    {doc.file_url && (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => window.open(doc.file_url, '_blank')}
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = doc.file_url;
                            link.download = doc.file_name;
                            link.click();
                          }}
                          className="h-8 w-8 p-0"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>

      {filteredDocuments.length === 0 && (
        <Card className="border-0 shadow-lg dark:bg-slate-800">
          <CardContent className="py-12 text-center">
            <FileText className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">
              No Documents Found
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {searchQuery || selectedCategory !== 'all' || selectedTags.length > 0
                ? 'Try adjusting your search or filters'
                : 'Upload documents to get started'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}