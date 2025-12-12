import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Search, Loader2, Sparkles, FileText, Shield } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export default function AIKnowledgeAssist({ context }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);

  const searchMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('aiKnowledgeSearch', {
        query,
        context
      });
      return response.data;
    },
    onSuccess: (data) => {
      setResults(data.results);
    }
  });

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      searchMutation.mutate();
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'policies': return FileText;
      case 'compliance': return Shield;
      default: return BookOpen;
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'policies': return 'bg-blue-100 text-blue-700';
      case 'compliance': return 'bg-purple-100 text-purple-700';
      case 'sales': return 'bg-green-100 text-green-700';
      case 'onboarding': return 'bg-amber-100 text-amber-700';
      case 'claims': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <Card className="border-0 shadow-lg liquid-glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-purple-600" />
          AI Knowledge Assistant
          <Badge variant="outline" className="ml-auto">
            <Sparkles className="w-3 h-3 mr-1" />
            Smart Search
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask about policies, procedures, compliance..."
            disabled={searchMutation.isPending}
          />
          <Button 
            type="submit" 
            disabled={searchMutation.isPending || !query.trim()}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {searchMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </Button>
        </form>

        {searchMutation.isPending && (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 mx-auto mb-2 text-purple-600 animate-spin" />
            <p className="text-sm text-slate-500">Searching knowledge base...</p>
          </div>
        )}

        {results && (
          <div className="space-y-4">
            {/* Direct Answer */}
            <div className="p-4 rounded-lg bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800">
              <p className="text-sm font-medium text-purple-900 dark:text-purple-200 mb-2">
                Direct Answer
              </p>
              <p className="text-sm text-slate-700 dark:text-slate-300">
                {results.direct_answer}
              </p>
            </div>

            {/* Suggested Articles */}
            {results.suggested_articles?.length > 0 && (
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                  Suggested Articles
                </p>
                <div className="space-y-3">
                  {results.suggested_articles.map((article, idx) => {
                    const Icon = getCategoryIcon(article.category);
                    return (
                      <div key={idx} className="p-3 rounded-lg border dark:border-slate-700 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 flex-1">
                            <Icon className="w-4 h-4 text-slate-400 shrink-0" />
                            <p className="text-sm font-medium text-slate-900 dark:text-white">
                              {article.title}
                            </p>
                          </div>
                          <Badge className={getCategoryColor(article.category)} variant="secondary">
                            {article.category}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                          {article.summary}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500">Relevance</span>
                          <Progress value={article.relevance_score} className="h-1 flex-1" />
                          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                            {article.relevance_score}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Talking Points */}
            {results.talking_points?.length > 0 && (
              <div className="p-3 rounded-lg bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800">
                <p className="text-xs font-medium text-teal-900 dark:text-teal-200 mb-2">
                  Key Talking Points
                </p>
                <ul className="space-y-1">
                  {results.talking_points.map((point, i) => (
                    <li key={i} className="text-xs text-teal-700 dark:text-teal-300 flex items-start gap-2">
                      <span className="text-teal-500">•</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Compliance Notes */}
            {results.compliance_notes && (
              <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4 text-purple-600" />
                  <p className="text-xs font-medium text-purple-900 dark:text-purple-200">
                    Compliance Considerations
                  </p>
                </div>
                <p className="text-xs text-purple-700 dark:text-purple-300">
                  {results.compliance_notes}
                </p>
              </div>
            )}
          </div>
        )}

        {!results && !searchMutation.isPending && (
          <div className="text-center py-8 text-slate-500">
            <Search className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="text-sm">Search for policies, procedures, or best practices</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}