import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Plus, Search, TrendingUp, CheckCircle, Clock, FileText, Sparkles } from 'lucide-react';
import KnowledgeBaseSearch from '../components/knowledge/KnowledgeBaseSearch';
import ArticleViewer from '../components/knowledge/ArticleViewer';
import ArticleSubmissionForm from '../components/knowledge/ArticleSubmissionForm';
import KnowledgeGapSuggestions from '../components/knowledge/KnowledgeGapSuggestions';
import { toast } from 'sonner';

export default function KnowledgeBase() {
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: articles = [] } = useQuery({
    queryKey: ['knowledgeArticles'],
    queryFn: () => base44.entities.KnowledgeArticle.list('-view_count')
  });

  const { data: pendingArticles = [] } = useQuery({
    queryKey: ['pendingArticles'],
    queryFn: () => base44.entities.KnowledgeArticle.filter({ status: 'pending_review' }),
    enabled: user?.role === 'admin'
  });

  const approveMutation = useMutation({
    mutationFn: async (articleId) => {
      return base44.entities.KnowledgeArticle.update(articleId, {
        status: 'approved',
        reviewed_by: user.email,
        reviewed_date: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['knowledgeArticles']);
      queryClient.invalidateQueries(['pendingArticles']);
      toast.success('Article approved');
    }
  });

  const approvedArticles = articles.filter(a => a.status === 'approved');
  const featuredArticles = approvedArticles.filter(a => a.is_featured).slice(0, 3);
  const popularArticles = approvedArticles.sort((a, b) => (b.view_count || 0) - (a.view_count || 0)).slice(0, 5);
  const recentArticles = approvedArticles.slice(0, 5);

  const getCategoryColor = (cat) => {
    const colors = {
      policies: 'bg-blue-100 text-blue-700',
      compliance: 'bg-purple-100 text-purple-700',
      sales_scripts: 'bg-green-100 text-green-700',
      procedures: 'bg-amber-100 text-amber-700'
    };
    return colors[cat] || 'bg-slate-100 text-slate-700';
  };

  if (selectedArticle) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ArticleViewer article={selectedArticle} onBack={() => setSelectedArticle(null)} />
        </div>
      </div>
    );
  }

  if (showSubmitForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ArticleSubmissionForm onSuccess={() => setShowSubmitForm(false)} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Knowledge Base</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Search and contribute to the team knowledge library
            </p>
          </div>
          <Button onClick={() => setShowSubmitForm(true)} className="bg-teal-600 hover:bg-teal-700">
            <Plus className="w-4 h-4 mr-2" />
            Submit Article
          </Button>
        </div>

        <Tabs defaultValue="search" className="space-y-6">
          <TabsList>
            <TabsTrigger value="search">
              <Search className="w-4 h-4 mr-2" />
              Search
            </TabsTrigger>
            <TabsTrigger value="browse">
              <BookOpen className="w-4 h-4 mr-2" />
              Browse
            </TabsTrigger>
            <TabsTrigger value="featured">
              <TrendingUp className="w-4 h-4 mr-2" />
              Featured
            </TabsTrigger>
            <TabsTrigger value="gaps">
              <Sparkles className="w-4 h-4 mr-2" />
              AI Gaps
            </TabsTrigger>
            {user?.role === 'admin' && (
              <TabsTrigger value="pending">
                <Clock className="w-4 h-4 mr-2" />
                Pending Review
                {pendingArticles.length > 0 && (
                  <Badge className="ml-2 bg-amber-600">{pendingArticles.length}</Badge>
                )}
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="search">
            <KnowledgeBaseSearch onArticleSelect={setSelectedArticle} />
          </TabsContent>

          <TabsContent value="browse">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Recent Articles</h2>
                <div className="space-y-3">
                  {recentArticles.map((article) => (
                    <Card
                      key={article.id}
                      className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => setSelectedArticle(article)}
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                              {article.title}
                            </h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                              {article.summary}
                            </p>
                            <div className="flex items-center gap-2">
                              <Badge className={getCategoryColor(article.category)}>
                                {article.category.replace(/_/g, ' ')}
                              </Badge>
                              <span className="text-xs text-slate-500">{article.view_count || 0} views</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Most Popular</h2>
                <div className="space-y-2">
                  {popularArticles.map((article, idx) => (
                    <Card
                      key={article.id}
                      className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => setSelectedArticle(article)}
                    >
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-3">
                          <Badge className="bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900">
                            #{idx + 1}
                          </Badge>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-slate-900 dark:text-white mb-1">
                              {article.title}
                            </p>
                            <p className="text-xs text-slate-500">{article.view_count} views</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="featured">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredArticles.map((article) => (
                <Card
                  key={article.id}
                  className="border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
                  onClick={() => setSelectedArticle(article)}
                >
                  <CardContent className="pt-6">
                    <div className="mb-4">
                      <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                        Featured
                      </Badge>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                      {article.title}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                      {article.summary}
                    </p>
                    <Badge className={getCategoryColor(article.category)}>
                      {article.category.replace(/_/g, ' ')}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="gaps">
            <KnowledgeGapSuggestions />
          </TabsContent>

          {user?.role === 'admin' && (
            <TabsContent value="pending">
              <div className="space-y-3">
                {pendingArticles.length === 0 ? (
                  <Card className="border-0 shadow-sm">
                    <CardContent className="py-12 text-center">
                      <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-600" />
                      <p className="text-slate-500">No articles pending review</p>
                    </CardContent>
                  </Card>
                ) : (
                  pendingArticles.map((article) => (
                    <Card key={article.id} className="border-0 shadow-sm">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                              {article.title}
                            </h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                              {article.summary}
                            </p>
                            <div className="flex items-center gap-2 mb-3">
                              <Badge className={getCategoryColor(article.category)}>
                                {article.category.replace(/_/g, ' ')}
                              </Badge>
                              <span className="text-xs text-slate-500">By {article.author_email}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => setSelectedArticle(article)}
                            variant="outline"
                          >
                            <FileText className="w-3 h-3 mr-1" />
                            Review
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => approveMutation.mutate(article.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Approve
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}