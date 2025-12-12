import { useState } from 'react'
import { base44 } from '@/api/base44Client'
import { useMutation } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Sparkles, Loader2, AlertTriangle, CheckCircle, 
  FileText, Target, Shield, TrendingUp 
} from 'lucide-react';
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

export default function AIContractAnalyzer({ contract, onAnalysisComplete }) {
  const [analysis, setAnalysis] = useState(null);
  const [checklist, setChecklist] = useState(null);

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('aiContractIntelligence', {
        action: 'analyze_contract',
        contractId: contract.id
      });
      return response.data;
    },
    onSuccess: (data) => {
      setAnalysis(data.analysis);
      toast.success('Contract analysis complete');
      if (onAnalysisComplete) onAnalysisComplete(data.analysis);
    },
    onError: () => {
      toast.error('Failed to analyze contract');
    }
  });

  const checklistMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('aiContractIntelligence', {
        action: 'renewal_checklist',
        contractId: contract.id
      });
      return response.data;
    },
    onSuccess: (data) => {
      setChecklist(data.checklist);
      toast.success('Renewal checklist generated');
    },
    onError: () => {
      toast.error('Failed to generate checklist');
    }
  });

  const getHealthColor = (health) => {
    switch (health) {
      case 'healthy': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'needs_attention': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'critical': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-amber-600';
      case 'low': return 'text-slate-600';
      default: return 'text-slate-500';
    }
  };

  return (
    <Card className="clay-morphism border-0">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            AI Contract Intelligence
          </CardTitle>
          <div className="flex gap-2">
            <Button
              onClick={() => analyzeMutation.mutate()}
              disabled={analyzeMutation.isPending}
              variant="outline"
              size="sm"
            >
              {analyzeMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Analyze'
              )}
            </Button>
            <Button
              onClick={() => checklistMutation.mutate()}
              disabled={checklistMutation.isPending}
              variant="outline"
              size="sm"
            >
              {checklistMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Renewal Checklist'
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <AnimatePresence mode="wait">
          {!analysis && !checklist && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-8"
            >
              <Sparkles className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500 dark:text-slate-400">
                Click Analyze to extract key terms and compliance insights
              </p>
            </motion.div>
          )}

          {(analysis || checklist) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Tabs defaultValue="analysis" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="analysis" disabled={!analysis}>
                    Analysis
                  </TabsTrigger>
                  <TabsTrigger value="checklist" disabled={!checklist}>
                    Renewal Checklist
                  </TabsTrigger>
                </TabsList>

                {analysis && (
                  <TabsContent value="analysis" className="space-y-4">
                    {/* Overall Health */}
                    <div className="flex items-center justify-between p-4 clay-subtle rounded-xl">
                      <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Contract Health</p>
                        <Badge className={`mt-1 ${getHealthColor(analysis.overall_health)}`}>
                          {analysis.overall_health.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                      {analysis.overall_health === 'healthy' ? (
                        <CheckCircle className="w-8 h-8 text-green-600" />
                      ) : (
                        <AlertTriangle className="w-8 h-8 text-amber-600" />
                      )}
                    </div>

                    {/* Key Terms */}
                    {analysis.key_terms?.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          Key Terms
                        </h4>
                        <div className="space-y-2">
                          {analysis.key_terms.map((term, i) => (
                            <div key={i} className="p-3 clay-subtle rounded-lg">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="font-medium text-slate-900 dark:text-white">{term.term}</p>
                                  <p className="text-sm text-slate-600 dark:text-slate-400">{term.description}</p>
                                </div>
                                <Badge variant="outline" className="ml-2">
                                  {term.importance}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Risk Factors */}
                    {analysis.risk_factors?.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                          <Shield className="w-4 h-4" />
                          Risk Factors
                        </h4>
                        <div className="space-y-2">
                          {analysis.risk_factors.map((risk, i) => (
                            <div key={i} className="p-3 clay-subtle rounded-lg">
                              <div className="flex items-start gap-2">
                                <AlertTriangle className={`w-4 h-4 mt-0.5 ${getSeverityColor(risk.severity)}`} />
                                <div className="flex-1">
                                  <p className="font-medium text-slate-900 dark:text-white">{risk.risk}</p>
                                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                    <span className="font-medium">Mitigation:</span> {risk.mitigation}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Items */}
                    {analysis.action_items?.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                          <Target className="w-4 h-4" />
                          Action Items
                        </h4>
                        <div className="space-y-2">
                          {analysis.action_items.map((item, i) => (
                            <div key={i} className="p-3 clay-subtle rounded-lg flex items-start justify-between">
                              <div className="flex-1">
                                <p className="font-medium text-slate-900 dark:text-white">{item.action}</p>
                                {item.due_date && (
                                  <p className="text-xs text-slate-500 mt-1">Due: {item.due_date}</p>
                                )}
                              </div>
                              <Badge variant={item.priority === 'urgent' ? 'destructive' : 'outline'}>
                                {item.priority}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Compliance Requirements */}
                    {analysis.compliance_requirements?.length > 0 && (
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
                          Compliance Requirements
                        </h4>
                        <ul className="space-y-1">
                          {analysis.compliance_requirements.map((req, i) => (
                            <li key={i} className="text-sm text-blue-700 dark:text-blue-400 flex items-start gap-2">
                              <span className="text-blue-500">•</span>
                              {req}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </TabsContent>
                )}

                {checklist && (
                  <TabsContent value="checklist" className="space-y-4">
                    {/* Pre-Renewal Tasks */}
                    {checklist.pre_renewal_tasks?.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white mb-3">
                          Pre-Renewal (60-90 days before)
                        </h4>
                        <div className="space-y-2">
                          {checklist.pre_renewal_tasks.map((task, i) => (
                            <div key={i} className="p-3 clay-subtle rounded-lg flex items-start gap-3">
                              <div className="w-5 h-5 rounded border-2 border-slate-300 mt-0.5" />
                              <div className="flex-1">
                                <p className="text-sm text-slate-900 dark:text-white">{task.task}</p>
                                <p className="text-xs text-slate-500">
                                  {task.deadline_days_before} days before expiration
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Mid-Renewal Tasks */}
                    {checklist.mid_renewal_tasks?.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white mb-3">
                          Mid-Renewal (30-60 days before)
                        </h4>
                        <div className="space-y-2">
                          {checklist.mid_renewal_tasks.map((task, i) => (
                            <div key={i} className="p-3 clay-subtle rounded-lg flex items-start gap-3">
                              <div className="w-5 h-5 rounded border-2 border-slate-300 mt-0.5" />
                              <div className="flex-1">
                                <p className="text-sm text-slate-900 dark:text-white">{task.task}</p>
                                <p className="text-xs text-slate-500">
                                  {task.deadline_days_before} days before expiration
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Final Renewal Tasks */}
                    {checklist.final_renewal_tasks?.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white mb-3">
                          Final Renewal (0-30 days before)
                        </h4>
                        <div className="space-y-2">
                          {checklist.final_renewal_tasks.map((task, i) => (
                            <div key={i} className="p-3 clay-subtle rounded-lg flex items-start gap-3">
                              <div className="w-5 h-5 rounded border-2 border-slate-300 mt-0.5" />
                              <div className="flex-1">
                                <p className="text-sm text-slate-900 dark:text-white">{task.task}</p>
                                <p className="text-xs text-slate-500">
                                  {task.deadline_days_before} days before expiration
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Documents & Negotiation */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {checklist.documents_needed?.length > 0 && (
                        <div className="p-4 bg-teal-50 dark:bg-teal-900/20 rounded-lg border border-teal-200 dark:border-teal-800">
                          <h4 className="font-semibold text-teal-900 dark:text-teal-300 mb-2">
                            Documents Needed
                          </h4>
                          <ul className="space-y-1">
                            {checklist.documents_needed.map((doc, i) => (
                              <li key={i} className="text-sm text-teal-700 dark:text-teal-400">• {doc}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {checklist.negotiation_points?.length > 0 && (
                        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                          <h4 className="font-semibold text-purple-900 dark:text-purple-300 mb-2">
                            Negotiation Points
                          </h4>
                          <ul className="space-y-1">
                            {checklist.negotiation_points.map((point, i) => (
                              <li key={i} className="text-sm text-purple-700 dark:text-purple-400">• {point}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                )}
              </Tabs>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}