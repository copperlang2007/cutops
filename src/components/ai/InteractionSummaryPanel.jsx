import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageSquare, Sparkles, Loader2, TrendingUp, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

export default function InteractionSummaryPanel({ clientId }) {
  const [summary, setSummary] = useState(null);
  const [timePeriod, setTimePeriod] = useState('last_90_days');

  const summarizeMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('aiInteractionSummarizer', {
        client_id: clientId,
        time_period: timePeriod
      });
      return response.data;
    },
    onSuccess: (data) => {
      setSummary(data.summary);
      toast.success('Interactions summarized');
    },
    onError: () => {
      toast.error('Failed to summarize interactions');
    }
  });

  const getHealthColor = (health) => {
    const colors = {
      excellent: 'bg-green-100 text-green-700 border-green-200',
      good: 'bg-blue-100 text-blue-700 border-blue-200',
      fair: 'bg-amber-100 text-amber-700 border-amber-200',
      concerning: 'bg-orange-100 text-orange-700 border-orange-200',
      critical: 'bg-red-100 text-red-700 border-red-200'
    };
    return colors[health] || 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            Interaction History Summary
          </CardTitle>
          <Select value={timePeriod} onValueChange={setTimePeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last_30_days">Last 30 Days</SelectItem>
              <SelectItem value="last_90_days">Last 90 Days</SelectItem>
              <SelectItem value="last_year">Last Year</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!summary && !summarizeMutation.isPending && (
          <div className="text-center py-8">
            <MessageSquare className="w-12 h-12 mx-auto text-purple-600 mb-3" />
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Generate AI-powered summary of all client interactions
            </p>
            <Button
              onClick={() => summarizeMutation.mutate()}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Summary
            </Button>
          </div>
        )}

        {summarizeMutation.isPending && (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-600 mb-2" />
            <p className="text-sm text-slate-600 dark:text-slate-400">Analyzing interactions...</p>
          </div>
        )}

        {summary && (
          <>
            {/* Relationship Health */}
            {summary.relationship_health && (
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Relationship Health:</p>
                <Badge className={getHealthColor(summary.relationship_health)}>
                  {summary.relationship_health}
                </Badge>
              </div>
            )}

            {/* Executive Summary */}
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <p className="text-sm text-slate-900 dark:text-white">
                {summary.executive_summary}
              </p>
            </div>

            {/* Key Points */}
            {summary.key_points && summary.key_points.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-teal-600" />
                  Key Insights
                </h4>
                <ul className="space-y-1">
                  {summary.key_points.map((point, idx) => (
                    <li key={idx} className="text-sm text-slate-700 dark:text-slate-300 flex items-start gap-2">
                      <span className="text-teal-600 mt-1">•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Timeline */}
            {summary.timeline && summary.timeline.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  Key Milestones
                </h4>
                <div className="space-y-2">
                  {summary.timeline.map((item, idx) => (
                    <div key={idx} className="pl-4 border-l-2 border-blue-200">
                      <p className="text-xs text-slate-500">{item.date}</p>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{item.event}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">{item.significance}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Concerns */}
            {summary.concerns_raised && summary.concerns_raised.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  Concerns Raised
                </h4>
                <div className="space-y-1">
                  {summary.concerns_raised.map((concern, idx) => (
                    <div key={idx} className="p-2 bg-red-50 dark:bg-red-900/20 rounded text-sm text-red-900 dark:text-red-200">
                      {concern}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Positive Highlights */}
            {summary.positive_highlights && summary.positive_highlights.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  Positive Highlights
                </h4>
                <div className="space-y-1">
                  {summary.positive_highlights.map((highlight, idx) => (
                    <div key={idx} className="p-2 bg-green-50 dark:bg-green-900/20 rounded text-sm text-green-900 dark:text-green-200">
                      {highlight}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Outstanding Items */}
            {summary.outstanding_items && summary.outstanding_items.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Outstanding Items</h4>
                <ul className="space-y-1">
                  {summary.outstanding_items.map((item, idx) => (
                    <li key={idx} className="text-sm text-slate-700 dark:text-slate-300 flex items-start gap-2">
                      <span className="text-amber-600 mt-1">□</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Next Steps */}
            {summary.next_steps && summary.next_steps.length > 0 && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">Recommended Next Steps</h4>
                <ul className="space-y-1">
                  {summary.next_steps.map((step, idx) => (
                    <li key={idx} className="text-sm text-blue-900 dark:text-blue-200 flex items-start gap-2">
                      <span className="mt-1">→</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Renewal Readiness */}
            {summary.renewal_readiness && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Renewal Readiness</p>
                <p className="text-sm font-medium text-slate-900 dark:text-white">{summary.renewal_readiness}</p>
              </div>
            )}

            <Button
              onClick={() => summarizeMutation.mutate()}
              variant="outline"
              size="sm"
              className="w-full"
            >
              Regenerate Summary
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}