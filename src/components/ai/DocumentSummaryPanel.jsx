import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Sparkles, Loader2, Calendar, AlertCircle, CheckCircle, Target } from 'lucide-react';
import { toast } from 'sonner';

export default function DocumentSummaryPanel({ documentUrl, documentName, documentType, contentText }) {
  const [summary, setSummary] = useState(null);

  const summarizeMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('aiDocumentSummarizer', {
        document_url: documentUrl,
        document_name: documentName,
        document_type: documentType,
        content_text: contentText
      });
      return response.data;
    },
    onSuccess: (data) => {
      setSummary(data.summary);
      toast.success('Document summarized');
    },
    onError: () => {
      toast.error('Failed to summarize document');
    }
  });

  if (!summary && !summarizeMutation.isPending) {
    return (
      <Card className="border-purple-200 bg-purple-50 dark:bg-purple-900/20">
        <CardContent className="pt-6 text-center">
          <Sparkles className="w-12 h-12 mx-auto text-purple-600 mb-3" />
          <h3 className="font-semibold text-slate-900 dark:text-white mb-2">AI Document Summary</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Get key insights and talking points instantly
          </p>
          <Button
            onClick={() => summarizeMutation.mutate()}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Generate Summary
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (summarizeMutation.isPending) {
    return (
      <Card className="border-purple-200">
        <CardContent className="pt-6 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-600 mb-2" />
          <p className="text-sm text-slate-600 dark:text-slate-400">Analyzing document...</p>
        </CardContent>
      </Card>
    );
  }

  const getHealthColor = (health) => {
    const colors = {
      excellent: 'bg-green-100 text-green-700',
      good: 'bg-blue-100 text-blue-700',
      fair: 'bg-amber-100 text-amber-700',
      concerning: 'bg-orange-100 text-orange-700',
      critical: 'bg-red-100 text-red-700'
    };
    return colors[health] || 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="space-y-4">
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            AI Document Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Executive Summary */}
          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <p className="text-sm font-medium text-purple-900 dark:text-purple-200">
              {summary.executive_summary}
            </p>
          </div>

          {/* Key Points */}
          {summary.key_points && summary.key_points.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-teal-600" />
                Key Points
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

          {/* Important Dates */}
          {summary.important_dates && summary.important_dates.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-600" />
                Important Dates
              </h4>
              <div className="space-y-1">
                {summary.important_dates.map((date, idx) => (
                  <Badge key={idx} variant="outline" className="mr-2">
                    {date}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Action Items */}
          {summary.action_items && summary.action_items.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <Target className="w-4 h-4 text-blue-600" />
                Action Items
              </h4>
              <ul className="space-y-1">
                {summary.action_items.map((action, idx) => (
                  <li key={idx} className="text-sm text-slate-700 dark:text-slate-300 flex items-start gap-2">
                    <span className="text-blue-600 mt-1">→</span>
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Compliance Notes */}
          {summary.compliance_notes && summary.compliance_notes.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                Compliance Notes
              </h4>
              <ul className="space-y-1">
                {summary.compliance_notes.map((note, idx) => (
                  <li key={idx} className="text-sm text-red-700 dark:text-red-300 flex items-start gap-2">
                    <span className="text-red-600 mt-1">⚠</span>
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Quick Reference */}
          {summary.quick_reference && (
            <div className="grid grid-cols-3 gap-3">
              {summary.quick_reference.coverage && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Coverage</p>
                  <p className="text-xs text-slate-900 dark:text-white">{summary.quick_reference.coverage}</p>
                </div>
              )}
              {summary.quick_reference.premiums && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Premiums</p>
                  <p className="text-xs text-slate-900 dark:text-white">{summary.quick_reference.premiums}</p>
                </div>
              )}
              {summary.quick_reference.exclusions && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Exclusions</p>
                  <p className="text-xs text-slate-900 dark:text-white">{summary.quick_reference.exclusions}</p>
                </div>
              )}
            </div>
          )}

          {/* Talking Points */}
          {summary.recommended_talking_points && summary.recommended_talking_points.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Recommended Talking Points</h4>
              <div className="space-y-2">
                {summary.recommended_talking_points.map((point, idx) => (
                  <div key={idx} className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-sm text-blue-900 dark:text-blue-200">
                    {point}
                  </div>
                ))}
              </div>
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
        </CardContent>
      </Card>
    </div>
  );
}