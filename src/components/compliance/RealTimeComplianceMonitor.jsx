import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Shield, CheckCircle, Copy, X } from 'lucide-react';
import { toast } from 'sonner';

export default function RealTimeComplianceMonitor({ content, onChange, contextType = 'email', agentId, clientId }) {
  const [analysis, setAnalysis] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const checkComplianceMutation = useMutation({
    mutationFn: async (text) => {
      const response = await base44.functions.invoke('aiComplianceMonitor', {
        content: text,
        context_type: contextType,
        agent_id: agentId,
        client_id: clientId
      });
      return response.data;
    },
    onSuccess: (data) => {
      setAnalysis(data);
      if (data.has_violations) {
        setShowSuggestions(true);
      }
    }
  });

  // Auto-check on content change with debounce
  useEffect(() => {
    if (!content || content.length < 50) return;

    const timeoutId = setTimeout(() => {
      checkComplianceMutation.mutate(content);
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [content]);

  const applySuggestion = (replacement) => {
    if (onChange) {
      onChange(replacement);
      toast.success('Compliant text applied');
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-700 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'medium': return 'bg-amber-100 text-amber-700 border-amber-300';
      default: return 'bg-blue-100 text-blue-700 border-blue-300';
    }
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'critical': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-amber-600';
      default: return 'text-green-600';
    }
  };

  if (!content || content.length < 50) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Shield className="w-4 h-4" />
        <span>AI compliance monitoring active</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Status Indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {checkComplianceMutation.isPending ? (
            <>
              <Shield className="w-4 h-4 text-blue-600 animate-pulse" />
              <span className="text-sm text-slate-600">Checking compliance...</span>
            </>
          ) : analysis?.has_violations ? (
            <>
              <AlertTriangle className={`w-4 h-4 ${getRiskColor(analysis.overall_risk_level)}`} />
              <span className="text-sm font-medium text-slate-900">
                {analysis.violations.length} compliance issue{analysis.violations.length !== 1 ? 's' : ''} detected
              </span>
              <Badge className={getSeverityColor(analysis.overall_risk_level)}>
                {analysis.overall_risk_level} risk
              </Badge>
            </>
          ) : analysis ? (
            <>
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-700">No compliance issues detected</span>
            </>
          ) : null}
        </div>
        {analysis?.has_violations && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowSuggestions(!showSuggestions)}
          >
            {showSuggestions ? 'Hide' : 'Show'} Suggestions
          </Button>
        )}
      </div>

      {/* Violations & Suggestions */}
      {showSuggestions && analysis?.has_violations && (
        <div className="space-y-3">
          {analysis.violations.map((violation, i) => (
            <Card key={i} className={`border-2 ${getSeverityColor(violation.severity)}`}>
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={getSeverityColor(violation.severity)}>
                        {violation.severity}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {violation.violation_type.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium text-slate-900 mb-1">
                      {violation.description}
                    </p>
                    <p className="text-xs text-slate-500">
                      {violation.regulation_reference}
                    </p>
                  </div>
                  <Badge variant="outline" className="shrink-0">
                    {violation.confidence_score}% sure
                  </Badge>
                </div>

                {/* Flagged Text */}
                <div className="p-2 rounded bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <p className="text-xs font-medium text-red-900 dark:text-red-200 mb-1">Flagged:</p>
                  <p className="text-sm text-red-700 dark:text-red-300">"{violation.flagged_text}"</p>
                </div>

                {/* Suggested Replacement */}
                {violation.suggested_replacement && (
                  <div className="p-2 rounded bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-medium text-green-900 dark:text-green-200">
                        Suggested Replacement:
                      </p>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          navigator.clipboard.writeText(violation.suggested_replacement);
                          toast.success('Copied to clipboard');
                        }}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      "{violation.suggested_replacement}"
                    </p>
                  </div>
                )}

                {/* Alternative Options */}
                {violation.compliant_options?.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-slate-700 mb-2">Other compliant options:</p>
                    <div className="space-y-2">
                      {violation.compliant_options.map((option, j) => (
                        <div key={j} className="flex items-start gap-2 p-2 rounded bg-slate-50 dark:bg-slate-900 border dark:border-slate-700 text-sm">
                          <p className="flex-1 text-slate-700 dark:text-slate-300">{option}</p>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              navigator.clipboard.writeText(option);
                              toast.success('Copied to clipboard');
                            }}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {/* General Recommendations */}
          {analysis.general_recommendations?.length > 0 && (
            <Card className="border-0 bg-blue-50 dark:bg-blue-900/20">
              <CardContent className="pt-4">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
                  General Recommendations:
                </p>
                <ul className="space-y-1">
                  {analysis.general_recommendations.map((rec, i) => (
                    <li key={i} className="text-sm text-blue-700 dark:text-blue-300">• {rec}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Required Disclaimers */}
          {analysis.required_disclaimers?.length > 0 && (
            <Card className="border-0 bg-purple-50 dark:bg-purple-900/20">
              <CardContent className="pt-4">
                <p className="text-sm font-medium text-purple-900 dark:text-purple-200 mb-2">
                  Required Disclaimers:
                </p>
                <ul className="space-y-1">
                  {analysis.required_disclaimers.map((disc, i) => (
                    <li key={i} className="text-sm text-purple-700 dark:text-purple-300">• {disc}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}