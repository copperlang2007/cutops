import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, Loader2, TrendingUp, AlertCircle, FileText, CheckCircle, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export default function KnowledgeGapSuggestions() {
  const queryClient = useQueryClient();
  const [selectedGap, setSelectedGap] = useState(null);
  const [showDraftDialog, setShowDraftDialog] = useState(false);
  const [draftContent, setDraftContent] = useState(null);

  const { data: gaps = [], isLoading } = useQuery({
    queryKey: ['knowledgeGaps'],
    queryFn: () => base44.entities.KnowledgeGap.filter({ 
      status: { $in: ['identified', 'draft_generated'] } 
    }, '-created_date')
  });

  const analyzeGapsMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('aiKnowledgeGapAnalyzer', {});
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['knowledgeGaps']);
      toast.success(`${data.gaps_identified} knowledge gaps identified`);
    }
  });

  const generateDraftMutation = useMutation({
    mutationFn: async (gapId) => {
      const response = await base44.functions.invoke('aiArticleDrafter', { gap_id: gapId });
      return response.data;
    },
    onSuccess: (data) => {
      setDraftContent(data.draft);
      setShowDraftDialog(true);
      queryClient.invalidateQueries(['knowledgeGaps']);
      toast.success('Draft generated');
    }
  });

  const createArticleMutation = useMutation({
    mutationFn: async (articleData) => {
      await base44.entities.KnowledgeArticle.create(articleData);
      await base44.entities.KnowledgeGap.update(selectedGap.id, {
        status: 'completed',
        completed_date: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['knowledgeGaps']);
      queryClient.invalidateQueries(['knowledgeArticles']);
      setShowDraftDialog(false);
      setDraftContent(null);
      setSelectedGap(null);
      toast.success('Article created');
    }
  });

  const dismissGapMutation = useMutation({
    mutationFn: (gapId) => base44.entities.KnowledgeGap.update(gapId, { status: 'dismissed' }),
    onSuccess: () => {
      queryClient.invalidateQueries(['knowledgeGaps']);
      toast.success('Gap dismissed');
    }
  });

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-700 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'medium': return 'bg-amber-100 text-amber-700 border-amber-300';
      case 'low': return 'bg-blue-100 text-blue-700 border-blue-300';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'missing_content': return FileText;
      case 'outdated_content': return AlertCircle;
      case 'emerging_topic': return TrendingUp;
      default: return Sparkles;
    }
  };

  const handleCreateArticle = () => {
    if (!draftContent) return;

    const currentUser = queryClient.getQueryData(['currentUser']);
    const articleData = {
      title: draftContent.title,
      category: selectedGap.suggested_article?.category || 'general',
      content: draftContent.content,
      summary: draftContent.summary,
      tags: draftContent.tags || [],
      author_email: currentUser?.email,
      status: 'pending_review'
    };

    createArticleMutation.mutate(articleData);
  };

  const identifiedGaps = gaps.filter(g => g.status === 'identified');
  const draftedGaps = gaps.filter(g => g.status === 'draft_generated');

  return (
    <>
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              AI Knowledge Gap Analysis
            </CardTitle>
            <Button
              onClick={() => analyzeGapsMutation.mutate()}
              disabled={analyzeGapsMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {analyzeGapsMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing...</>
              ) : (
                <><Sparkles className="w-4 h-4 mr-2" /> Analyze Gaps</>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="identified">
            <TabsList>
              <TabsTrigger value="identified">
                Identified ({identifiedGaps.length})
              </TabsTrigger>
              <TabsTrigger value="drafted">
                Drafted ({draftedGaps.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="identified" className="space-y-4 mt-4">
              {isLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-400" />
                </div>
              ) : identifiedGaps.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                  <p className="text-slate-500">No gaps identified</p>
                  <p className="text-sm text-slate-400 mt-1">Run analysis to discover content opportunities</p>
                </div>
              ) : (
                identifiedGaps.map(gap => {
                  const Icon = getTypeIcon(gap.gap_type);
                  return (
                    <div key={gap.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <Icon className="w-5 h-5 text-purple-600 mt-0.5" />
                          <div className="flex-1">
                            <h4 className="font-semibold text-slate-900">{gap.topic}</h4>
                            <p className="text-sm text-slate-600 mt-1">{gap.description}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge className={getPriorityColor(gap.priority)}>{gap.priority}</Badge>
                              <Badge variant="outline">{gap.gap_type.replace(/_/g, ' ')}</Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            onClick={() => {
                              setSelectedGap(gap);
                              generateDraftMutation.mutate(gap.id);
                            }}
                            disabled={generateDraftMutation.isPending}
                            size="sm"
                            className="bg-purple-600 hover:bg-purple-700"
                          >
                            {generateDraftMutation.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              'Generate Draft'
                            )}
                          </Button>
                          <Button
                            onClick={() => dismissGapMutation.mutate(gap.id)}
                            size="sm"
                            variant="ghost"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {gap.suggested_article && (
                        <div className="p-3 bg-purple-50 rounded text-sm">
                          <p className="font-medium text-purple-900 mb-1">
                            Suggested: {gap.suggested_article.title}
                          </p>
                          {gap.suggested_article.outline && (
                            <ul className="text-xs text-purple-700 space-y-0.5 mt-2">
                              {gap.suggested_article.outline.slice(0, 3).map((item, idx) => (
                                <li key={idx}>• {item}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}

                      {gap.evidence && (
                        <div className="text-xs text-slate-500">
                          {gap.evidence.market_trends?.length > 0 && (
                            <span>📊 Market trends detected • </span>
                          )}
                          {gap.evidence.query_frequency > 0 && (
                            <span>🔍 {gap.evidence.query_frequency} queries</span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </TabsContent>

            <TabsContent value="drafted" className="space-y-4 mt-4">
              {draftedGaps.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                  <p className="text-slate-500">No drafts available</p>
                </div>
              ) : (
                draftedGaps.map(gap => {
                  const Icon = getTypeIcon(gap.gap_type);
                  return (
                    <div key={gap.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <Icon className="w-5 h-5 text-green-600 mt-0.5" />
                          <div className="flex-1">
                            <h4 className="font-semibold text-slate-900">{gap.topic}</h4>
                            <Badge className="bg-green-100 text-green-700 mt-2">Draft Ready</Badge>
                          </div>
                        </div>
                        <Button
                          onClick={() => {
                            setSelectedGap(gap);
                            setDraftContent(JSON.parse(gap.draft_content));
                            setShowDraftDialog(true);
                          }}
                          size="sm"
                          variant="outline"
                        >
                          Review Draft
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Draft Review Dialog */}
      <Dialog open={showDraftDialog} onOpenChange={setShowDraftDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review AI-Generated Article</DialogTitle>
          </DialogHeader>
          {draftContent && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{draftContent.title}</h3>
                <p className="text-sm text-slate-600 mt-1">{draftContent.summary}</p>
              </div>

              {draftContent.key_takeaways && (
                <div className="p-3 bg-blue-50 rounded">
                  <p className="text-sm font-semibold text-blue-900 mb-2">Key Takeaways:</p>
                  <ul className="text-sm text-blue-800 space-y-1">
                    {draftContent.key_takeaways.map((item, idx) => (
                      <li key={idx}>• {item}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="prose prose-sm max-w-none">
                <div className="p-4 bg-slate-50 rounded whitespace-pre-wrap">
                  {draftContent.content}
                </div>
              </div>

              {draftContent.tags && (
                <div className="flex gap-2 flex-wrap">
                  {draftContent.tags.map((tag, idx) => (
                    <Badge key={idx} variant="outline">{tag}</Badge>
                  ))}
                </div>
              )}

              <div className="flex gap-2 justify-end pt-4 border-t">
                <Button
                  onClick={() => {
                    setShowDraftDialog(false);
                    setDraftContent(null);
                  }}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateArticle}
                  disabled={createArticleMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {createArticleMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  Create Article
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}