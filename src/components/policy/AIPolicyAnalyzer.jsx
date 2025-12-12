import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, Loader2, FileText, AlertTriangle, CheckCircle, DollarSign, Shield, Info } from 'lucide-react';
import { toast } from 'sonner';

export default function AIPolicyAnalyzer({ policy, onAnalysisComplete }) {
  const [analysis, setAnalysis] = useState(policy?.ai_analysis || null);

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('aiPolicyAnalyzer', {
        policyId: policy.id,
        documentUrl: policy.document_url
      });
      return response.data;
    },
    onSuccess: (data) => {
      setAnalysis(data.analysis);
      toast.success('Policy analysis complete');
      if (onAnalysisComplete) onAnalysisComplete(data.analysis);
    },
    onError: () => toast.error('Analysis failed')
  });

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'medium': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'low': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-4">
      <Card className="clay-morphism border-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-600" />
              AI Policy Analysis
            </CardTitle>
            <Button
              onClick={() => analyzeMutation.mutate()}
              disabled={analyzeMutation.isPending}
              className="bg-gradient-to-r from-purple-500 to-pink-600"
            >
              {analyzeMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Analyzing...</>
              ) : (
                <><Sparkles className="w-4 h-4 mr-2" />{analysis ? 'Re-analyze' : 'Analyze Policy'}</>
              )}
            </Button>
          </div>
        </CardHeader>
        
        {analysis && (
          <CardContent className="space-y-4">
            {/* Summary & Score */}
            <div className="p-4 clay-subtle rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-slate-900 dark:text-white">Policy Strength</h3>
                <Badge className="bg-green-100 text-green-700 text-lg px-3 py-1">
                  {analysis.policy_strength_score}/100
                </Badge>
              </div>
              <Progress value={analysis.policy_strength_score} className="h-2 mb-3" />
              <p className="text-sm text-slate-700 dark:text-slate-300">{analysis.summary}</p>
            </div>

            {/* Risk Assessment */}
            {analysis.risk_assessment && (
              <div className="p-4 clay-subtle rounded-xl border-l-4 border-l-purple-500">
                <h3 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Risk Assessment
                </h3>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <p className="text-xs text-slate-500">Overall Risk</p>
                    <Badge className={getSeverityColor(analysis.risk_assessment.overall_risk)}>
                      {analysis.risk_assessment.overall_risk}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Protection Level</p>
                    <Badge variant="outline">{analysis.risk_assessment.client_protection_level}</Badge>
                  </div>
                </div>
                {analysis.risk_assessment.potential_concerns?.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">Concerns:</p>
                    {analysis.risk_assessment.potential_concerns.map((concern, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <AlertTriangle className="w-3 h-3 text-amber-600 mt-0.5 shrink-0" />
                        <span className="text-xs text-slate-700 dark:text-slate-300">{concern}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Detailed Tabs */}
            <Tabs defaultValue="coverage" className="w-full">
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="coverage">Coverage</TabsTrigger>
                <TabsTrigger value="exclusions">Exclusions</TabsTrigger>
                <TabsTrigger value="costs">Costs</TabsTrigger>
                <TabsTrigger value="terms">Terms</TabsTrigger>
              </TabsList>

              <TabsContent value="coverage" className="space-y-3">
                {analysis.coverage_details && (
                  <>
                    <div className="p-3 clay-subtle rounded-lg">
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">Primary Coverage:</p>
                      <div className="space-y-1">
                        {analysis.coverage_details.primary_coverage?.map((cov, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <CheckCircle className="w-3 h-3 text-green-600 mt-0.5 shrink-0" />
                            <span className="text-sm text-slate-700 dark:text-slate-300">{cov}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {analysis.coverage_details.coverage_limits?.length > 0 && (
                      <div className="p-3 clay-subtle rounded-lg">
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">Coverage Limits:</p>
                        <div className="space-y-2">
                          {analysis.coverage_details.coverage_limits.map((limit, i) => (
                            <div key={i} className="text-xs">
                              <span className="font-medium text-slate-900 dark:text-white">{limit.type}:</span>{' '}
                              {limit.amount} ({limit.applies_to})
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>

              <TabsContent value="exclusions" className="space-y-2">
                {analysis.exclusions?.map((exclusion, i) => (
                  <div key={i} className={`p-3 clay-subtle rounded-lg border-l-4 ${
                    exclusion.severity === 'high' ? 'border-l-red-500' :
                    exclusion.severity === 'medium' ? 'border-l-amber-500' :
                    'border-l-blue-500'
                  }`}>
                    <div className="flex items-start justify-between mb-1">
                      <h4 className="font-medium text-sm text-slate-900 dark:text-white">{exclusion.exclusion}</h4>
                      <Badge className={getSeverityColor(exclusion.severity)}>{exclusion.severity}</Badge>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">{exclusion.reason}</p>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="costs" className="space-y-3">
                {analysis.cost_structure && (
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(analysis.cost_structure).map(([key, value]) => (
                      <div key={key} className="p-3 clay-subtle rounded-lg">
                        <p className="text-xs text-slate-500 mb-1">{key.replace(/_/g, ' ').toUpperCase()}</p>
                        <p className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          {value}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="terms" className="space-y-2">
                {analysis.key_terms?.map((term, i) => (
                  <div key={i} className="p-3 clay-subtle rounded-lg">
                    <div className="flex items-start justify-between mb-1">
                      <h4 className="font-medium text-sm text-slate-900 dark:text-white">{term.term}</h4>
                      <Badge variant="outline" className="text-xs">{term.importance}</Badge>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">{term.definition}</p>
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          </CardContent>
        )}
      </Card>
    </div>
  );
}