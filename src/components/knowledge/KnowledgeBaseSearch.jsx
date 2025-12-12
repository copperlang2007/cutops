import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Loader2, Sparkles, TrendingUp, Eye, Star } from 'lucide-react';

export default function KnowledgeBaseSearch({ onArticleSelect, context }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [results, setResults] = useState(null);

  const searchMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('aiKnowledgeBaseSearch', {
        query,
        context,
        category,
        limit: 10
      });
      return response.data;
    },
    onSuccess: (data) => {
      setResults(data);
    }
  });

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      searchMutation.mutate();
    }
  };

  const getCategoryColor = (cat) => {
    const colors = {
      policies: 'bg-blue-100 text-blue-700',
      compliance: 'bg-purple-100 text-purple-700',
      sales_scripts: 'bg-green-100 text-green-700',
      procedures: 'bg-amber-100 text-amber-700',
      product_guides: 'bg-teal-100 text-teal-700',
      carrier_info: 'bg-indigo-100 text-indigo-700'
    };
    return colors[cat] || 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="policies">Policies</SelectItem>
            <SelectItem value="compliance">Compliance</SelectItem>
            <SelectItem value="sales_scripts">Sales Scripts</SelectItem>
            <SelectItem value="procedures">Procedures</SelectItem>
            <SelectItem value="product_guides">Product Guides</SelectItem>
            <SelectItem value="carrier_info">Carrier Info</SelectItem>
          </SelectContent>
        </Select>
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search knowledge base..."
          className="flex-1"
        />
        <Button type="submit" disabled={searchMutation.isPending || !query.trim()}>
          {searchMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </Button>
      </form>

      {searchMutation.isPending && (
        <div className="text-center py-8">
          <Loader2 className="w-8 h-8 mx-auto mb-2 text-teal-600 animate-spin" />
          <p className="text-sm text-slate-500">Searching with AI...</p>
        </div>
      )}

      {results && (
        <div className="space-y-4">
          {results.quick_answer && (
            <Card className="border-0 shadow-sm bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-900/20 dark:to-emerald-900/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-teal-600" />
                  <p className="font-medium text-teal-900 dark:text-teal-200">Quick Answer</p>
                </div>
                <p className="text-sm text-teal-700 dark:text-teal-300">{results.quick_answer}</p>
              </CardContent>
            </Card>
          )}

          {results.results?.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <p>No articles found matching your query</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-slate-600">
                Found {results.results?.length} relevant articles
              </p>
              {results.results?.map((result) => (
                <Card
                  key={result.article_id}
                  className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => onArticleSelect?.(result.article)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                          {result.article.title}
                        </h3>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getCategoryColor(result.article.category)}>
                            {result.article.category.replace(/_/g, ' ')}
                          </Badge>
                          <div className="flex items-center gap-3 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              {result.article.view_count || 0}
                            </span>
                            {result.article.average_rating > 0 && (
                              <span className="flex items-center gap-1">
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                {result.article.average_rating.toFixed(1)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        {result.relevance_score}%
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                      {result.key_excerpt}
                    </p>
                    <p className="text-xs text-teal-600 dark:text-teal-400">
                      {result.relevance_reason}
                    </p>
                    {result.article.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {result.article.tags.slice(0, 5).map((tag, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {results.suggested_search_terms?.length > 0 && (
            <div className="pt-4 border-t dark:border-slate-700">
              <p className="text-sm text-slate-600 mb-2">Try searching for:</p>
              <div className="flex flex-wrap gap-2">
                {results.suggested_search_terms.map((term, i) => (
                  <Button
                    key={i}
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setQuery(term);
                      searchMutation.mutate();
                    }}
                  >
                    {term}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}