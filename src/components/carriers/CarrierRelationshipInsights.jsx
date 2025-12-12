import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, AlertTriangle, CheckCircle, Target, 
  Zap, MessageSquare, Loader2, Shield, Award, TrendingDown
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function CarrierRelationshipInsights({ carrierId, carrierName }) {
  const [analysis, setAnalysis] = useState(null);

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('aiCarrierRelationshipAnalyzer', {
        carrierId
      });
      return response.data;
    },
    onSuccess: (data) => {
      setAnalysis(data);
      toast.success('Analysis complete');
    },
    onError: () => {
      toast.error('Analysis failed');
    }
  });

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'high': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      case 'medium': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'low': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-amber-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-slate-500';
    }
  };

  if (!analysis && !analyzeMutation.isPending) {
    return (
      <Card className="clay-morphism border-0">
        <CardContent className="py-12 text-center">
          <TrendingUp className="w-12 h-12 mx-auto text-teal-600 mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            AI Carrier Relationship Analysis
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Get AI-powered insights on carrier performance, renewal risks, and optimization opportunities
          </p>
          <Button
            onClick={() => analyzeMutation.mutate()}
            className="bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700"
          >
            <Zap className="w-4 h-4 mr-2" />
            Analyze {carrierName || 'Carrier'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (analyzeMutation.isPending) {
    return (
      <Card className="clay-morphism border-0">
        <CardContent className="py-12 text-center">
          <Loader2 className="w-12 h-12 mx-auto text-teal-600 animate-spin mb-4" />
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Analyzing carrier relationship...
          </p>
        </CardContent>
      </Card>
    );
  }

  const data = analysis.analysis;

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="clay-subtle border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Performance Score</p>
                  <p className={`text-3xl font-bold ${getScoreColor(data.performance_score)}`}>
                    {data.performance_score}
                  </p>
                </div>
                <TrendingUp className={`w-10 h-10 ${getScoreColor(data.performance_score)}`} />
              </div>
              <Progress value={data.performance_score} className="mt-3" />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="clay-subtle border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Compliance Score</p>
                  <p className={`text-3xl font-bold ${getScoreColor(data.compliance_score)}`}>
                    {data.compliance_score}
                  </p>
                </div>
                <Shield className={`w-10 h-10 ${getScoreColor(data.compliance_score)}`} />
              </div>
              <Progress value={data.compliance_score} className="mt-3" />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="clay-subtle border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Growth Potential</p>
                  <p className={`text-3xl font-bold ${getScoreColor(data.growth_potential?.score || 0)}`}>
                    {data.growth_potential?.score || 0}
                  </p>
                </div>
                <Award className={`w-10 h-10 ${getScoreColor(data.growth_potential?.score || 0)}`} />
              </div>
              <Progress value={data.growth_potential?.score || 0} className="mt-3" />
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Performance Summary */}
      <Card className="clay-morphism border-0">
        <CardHeader>
          <CardTitle>Performance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-700 dark:text-slate-300">{data.performance_summary}</p>
        </CardContent>
      </Card>

      {/* Alerts */}
      {data.alerts?.length > 0 && (
        <Card className="clay-morphism border-0 border-l-4 border-l-red-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Critical Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.alerts.map((alert, idx) => (
              <div key={idx} className="p-4 rounded-lg clay-subtle border-l-4" style={{ borderLeftColor: alert.severity === 'critical' ? '#ef4444' : '#f59e0b' }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={getSeverityColor(alert.severity)}>
                        {alert.severity}
                      </Badge>
                      <p className="font-semibold text-slate-900 dark:text-white">{alert.title}</p>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{alert.description}</p>
                    <p className="text-sm font-medium text-teal-600 dark:text-teal-400">
                      Action: {alert.action_required}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Detailed Tabs */}
      <Tabs defaultValue="renewals" className="space-y-4">
        <TabsList className="clay-morphism">
          <TabsTrigger value="renewals">Renewal Risks</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="communication">Communication</TabsTrigger>
          <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
          <TabsTrigger value="growth">Growth</TabsTrigger>
        </TabsList>

        <TabsContent value="renewals">
          <Card className="clay-morphism border-0">
            <CardHeader>
              <CardTitle>Contract Renewal Risk Assessment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.renewal_risks?.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 mx-auto text-green-600 mb-3" />
                  <p className="text-slate-600 dark:text-slate-400">No renewal risks identified</p>
                </div>
              ) : (
                data.renewal_risks?.map((risk, idx) => (
                  <div key={idx} className="p-4 rounded-lg clay-subtle">
                    <div className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full mt-2 ${getRiskColor(risk.risk_level)}`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getSeverityColor(risk.risk_level)}>
                            {risk.risk_level} risk
                          </Badge>
                          <span className="text-sm text-slate-500">
                            {risk.days_until_expiration} days until expiration
                          </span>
                        </div>
                        <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
                          <strong>Reason:</strong> {risk.reason}
                        </p>
                        <p className="text-sm text-teal-600 dark:text-teal-400">
                          <strong>Recommended Action:</strong> {risk.recommended_action}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance">
          <Card className="clay-morphism border-0">
            <CardHeader>
              <CardTitle>Compliance Assessment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Overall Compliance Score
                    </span>
                    <span className={`text-2xl font-bold ${getScoreColor(data.compliance_score)}`}>
                      {data.compliance_score}%
                    </span>
                  </div>
                  <Progress value={data.compliance_score} />
                </div>

                {data.compliance_issues?.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                      Issues Identified:
                    </p>
                    <ul className="space-y-2">
                      {data.compliance_issues.map((issue, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                          <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                          {issue}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="communication">
          <Card className="clay-morphism border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-teal-600" />
                Communication Strategy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg clay-subtle">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Last Contact Assessment
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {data.communication_insights?.last_contact_assessment}
                </p>
              </div>

              <div className="p-4 rounded-lg clay-subtle">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Recommended Frequency
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {data.communication_insights?.recommended_frequency}
                </p>
              </div>

              <div className="p-4 rounded-lg clay-subtle">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                  Suggested Discussion Topics
                </p>
                <ul className="space-y-2">
                  {data.communication_insights?.suggested_topics?.map((topic, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <CheckCircle className="w-4 h-4 text-teal-600 mt-0.5 shrink-0" />
                      {topic}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="opportunities">
          <Card className="clay-morphism border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-teal-600" />
                Optimization Opportunities
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.optimization_opportunities?.map((opp, idx) => (
                <div key={idx} className="p-4 rounded-lg clay-subtle border-l-4 border-l-teal-500">
                  <Badge className="mb-2">{opp.category}</Badge>
                  <p className="font-semibold text-slate-900 dark:text-white mb-2">{opp.opportunity}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                    <strong>Potential Impact:</strong> {opp.potential_impact}
                  </p>
                  <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Action Items:
                    </p>
                    <ul className="space-y-1">
                      {opp.action_items?.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                          <CheckCircle className="w-4 h-4 text-teal-600 mt-0.5 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="growth">
          <Card className="clay-morphism border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-teal-600" />
                Growth Potential
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-900/20 dark:to-emerald-900/20">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Growth Score</p>
                <p className="text-4xl font-bold text-teal-600 dark:text-teal-400">
                  {data.growth_potential?.score || 0}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                  Growth Areas:
                </p>
                <div className="space-y-2">
                  {data.growth_potential?.areas?.map((area, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-3 rounded-lg clay-subtle">
                      <Award className="w-5 h-5 text-teal-600 shrink-0" />
                      <span className="text-sm text-slate-700 dark:text-slate-300">{area}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                  Recommendations:
                </p>
                <ul className="space-y-2">
                  {data.growth_potential?.recommendations?.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <Zap className="w-4 h-4 text-teal-600 mt-0.5 shrink-0" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Re-analyze Button */}
      <div className="flex justify-center">
        <Button
          onClick={() => analyzeMutation.mutate()}
          variant="outline"
          disabled={analyzeMutation.isPending}
        >
          {analyzeMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 mr-2" />
              Re-analyze Relationship
            </>
          )}
        </Button>
      </div>
    </div>
  );
}