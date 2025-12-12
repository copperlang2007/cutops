import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ThumbsUp, ThumbsDown, Star, Eye, ArrowLeft, Download } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function ArticleViewer({ article, onBack }) {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [hasRated, setHasRated] = useState(false);
  const queryClient = useQueryClient();

  const incrementViewMutation = useMutation({
    mutationFn: () => base44.entities.KnowledgeArticle.update(article.id, {
      view_count: (article.view_count || 0) + 1
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['knowledgeArticles']);
    }
  });

  const rateMutation = useMutation({
    mutationFn: async (helpful) => {
      const user = await base44.auth.me();
      await base44.entities.ArticleRating.create({
        article_id: article.id,
        user_email: user.email,
        helpful,
        rating,
        feedback
      });

      const updateData = helpful
        ? { helpful_count: (article.helpful_count || 0) + 1 }
        : { not_helpful_count: (article.not_helpful_count || 0) + 1 };

      if (rating > 0) {
        const totalRatings = (article.helpful_count || 0) + (article.not_helpful_count || 0) + 1;
        const currentTotal = (article.average_rating || 0) * ((article.helpful_count || 0) + (article.not_helpful_count || 0));
        updateData.average_rating = (currentTotal + rating) / totalRatings;
      }

      await base44.entities.KnowledgeArticle.update(article.id, updateData);
    },
    onSuccess: () => {
      setHasRated(true);
      queryClient.invalidateQueries(['knowledgeArticles']);
      toast.success('Thank you for your feedback!');
    }
  });

  React.useEffect(() => {
    incrementViewMutation.mutate();
  }, [article.id]);

  const getCategoryColor = (cat) => {
    const colors = {
      policies: 'bg-blue-100 text-blue-700',
      compliance: 'bg-purple-100 text-purple-700',
      sales_scripts: 'bg-green-100 text-green-700',
      procedures: 'bg-amber-100 text-amber-700'
    };
    return colors[cat] || 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="space-y-4">
      <Button variant="ghost" onClick={onBack}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Search
      </Button>

      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="space-y-3">
            <CardTitle className="text-2xl">{article.title}</CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={getCategoryColor(article.category)}>
                {article.category.replace(/_/g, ' ')}
              </Badge>
              {article.carrier_specific && (
                <Badge variant="outline">{article.carrier_specific}</Badge>
              )}
              {article.state_specific && (
                <Badge variant="outline">{article.state_specific}</Badge>
              )}
              <div className="flex items-center gap-3 text-sm text-slate-500 ml-auto">
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {article.view_count || 0} views
                </span>
                {article.average_rating > 0 && (
                  <span className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    {article.average_rating.toFixed(1)}
                  </span>
                )}
              </div>
            </div>
            {article.summary && (
              <p className="text-slate-600 dark:text-slate-400">{article.summary}</p>
            )}
            {article.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {article.tags.map((tag, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <ReactMarkdown>{article.content}</ReactMarkdown>
          </div>

          {article.attachments?.length > 0 && (
            <div className="pt-4 border-t dark:border-slate-700">
              <p className="font-medium text-slate-900 dark:text-white mb-3">Attachments</p>
              <div className="space-y-2">
                {article.attachments.map((att, i) => (
                  <a
                    key={i}
                    href={att.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 rounded-lg border dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <Download className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">{att.name}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="pt-6 border-t dark:border-slate-700">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
              Last updated: {format(new Date(article.last_updated || article.updated_date), 'MMM d, yyyy')}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              By {article.author_email}
            </p>
          </div>

          {!hasRated && (
            <div className="pt-6 border-t dark:border-slate-700 space-y-4">
              <p className="font-medium text-slate-900 dark:text-white">Was this article helpful?</p>
              
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className={`p-2 rounded-lg border transition-colors ${
                      rating >= star
                        ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/20'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Star className={`w-5 h-5 ${rating >= star ? 'fill-amber-400 text-amber-400' : 'text-slate-400'}`} />
                  </button>
                ))}
              </div>

              <Textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Optional: Share your feedback to help us improve"
                rows={3}
              />

              <div className="flex gap-2">
                <Button
                  onClick={() => rateMutation.mutate(true)}
                  disabled={rateMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <ThumbsUp className="w-4 h-4 mr-2" />
                  Helpful
                </Button>
                <Button
                  onClick={() => rateMutation.mutate(false)}
                  disabled={rateMutation.isPending}
                  variant="outline"
                >
                  <ThumbsDown className="w-4 h-4 mr-2" />
                  Not Helpful
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}