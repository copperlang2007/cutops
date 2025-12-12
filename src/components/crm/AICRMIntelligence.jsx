import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, Loader2, TrendingUp, AlertTriangle, DollarSign, 
  Target, Users, Sparkles, ChevronRight, Shield, Zap
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export default function AICRMIntelligence({ agentId, onCreateTask }) {
  const [analysis, setAnalysis] = React.useState(null);

  const analyzeClientsMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('aiCRMIntelligence', {
        agent_id: agentId,
        analysis_type: 'comprehensive'
      });
      return response.data;
    },
    onSuccess: (data) => {
      setAnalysis(data.analysis);
      toast.success('CRM analysis complete');
    },
    onError: () => {
      toast.error('Analysis failed');
    }
  });

  const handleCreateTask = async (clientId, clientName, action, priority) => {
    if (onCreateTask) {
      await onCreateTask({
        title: action,
        description: `AI-recommended action for ${clientName}`,
        priority,
        related_entity_type: 'client',
        related_entity_id: clientId,
        auto_generated: true,
        category: 'client_retention'
      });
      toast.success('Task created');
    }
  };

  const getRiskColor = (probability) => {
    if (probability >= 70) return 'text-red-600';
    if (probability >= 40) return 'text-amber-600';
    return 'text-green-600';
  };

  const getHealthColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="border-0 shadow-lg liquid-glass">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">AI CRM Intelligence</CardTitle>
                <p className="text-sm text-slate-500 mt-1">
                  Predictive analytics for churn, opportunities & retention
                </p>
              </div>
            </div>
            <Button
              onClick={() => analyzeClientsMutation.mutate()}
              disabled={analyzeClientsMutation.isPending}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {analyzeClientsMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Run Analysis
                </>
              )}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Analysis Results */}
      <AnimatePresence>
        {analysis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Health Score Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="border-0 shadow-sm liquid-glass">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Users className="w-8 h-8 mx-auto mb-2 text-green-600" />
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">
                      {analysis.health_score_summary.healthy_clients}
                    </p>
                    <p className="text-sm text-slate-500">Healthy Clients</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm liquid-glass">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-amber-600" />
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">
                      {analysis.health_score_summary.at_risk_clients}
                    </p>
                    <p className="text-sm text-slate-500">At Risk</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm liquid-glass">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Shield className="w-8 h-8 mx-auto mb-2 text-red-600" />
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">
                      {analysis.health_score_summary.critical_clients}
                    </p>
                    <p className="text-sm text-slate-500">Critical</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm liquid-glass">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Target className="w-8 h-8 mx-auto mb-2 text-teal-600" />
                    <p className={`text-3xl font-bold ${getHealthColor(analysis.health_score_summary.overall_portfolio_health)}`}>
                      {Math.round(analysis.health_score_summary.overall_portfolio_health)}%
                    </p>
                    <p className="text-sm text-slate-500">Portfolio Health</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Tabs */}
            <Tabs defaultValue="churn" className="space-y-4">
              <TabsList className="liquid-glass">
                <TabsTrigger value="churn">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Churn Risk
                </TabsTrigger>
                <TabsTrigger value="opportunities">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Opportunities
                </TabsTrigger>
                <TabsTrigger value="retention">
                  <Shield className="w-4 h-4 mr-2" />
                  Retention
                </TabsTrigger>
                <TabsTrigger value="actions">
                  <Zap className="w-4 h-4 mr-2" />
                  Actions
                </TabsTrigger>
              </TabsList>

              {/* Churn Risk Tab */}
              <TabsContent value="churn" className="space-y-4">
                <Card className="border-0 shadow-sm liquid-glass">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                      High Risk Clients
                      <Badge className="ml-auto bg-red-100 text-red-700">
                        {analysis.churn_risk_analysis.high_risk_clients.length} clients
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {analysis.churn_risk_analysis.high_risk_clients.map((client, idx) => (
                      <div key={idx} className="p-4 rounded-lg border dark:border-slate-700 liquid-glass-subtle">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-slate-900 dark:text-white">
                              {client.client_name}
                            </h4>
                            <p className={`text-2xl font-bold mt-1 ${getRiskColor(client.churn_probability)}`}>
                              {Math.round(client.churn_probability)}% risk
                            </p>
                          </div>
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                            ${client.estimated_revenue_at_risk?.toLocaleString() || 0} at risk
                          </Badge>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div>
                            <p className="font-medium text-slate-700 dark:text-slate-300 mb-1">
                              Risk Factors:
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {client.risk_factors.map((factor, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {factor}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <div className="p-3 rounded bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800">
                            <p className="font-medium text-teal-900 dark:text-teal-300 mb-2">
                              Retention Strategy:
                            </p>
                            <p className="text-teal-700 dark:text-teal-400 text-sm">
                              {client.retention_strategy}
                            </p>
                          </div>

                          <div>
                            <p className="font-medium text-slate-700 dark:text-slate-300 mb-2">
                              Immediate Actions:
                            </p>
                            <div className="space-y-1">
                              {client.immediate_actions.map((action, i) => (
                                <div key={i} className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-800">
                                  <span className="text-sm">{action}</span>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleCreateTask(client.client_id, client.client_name, action, 'high')}
                                  >
                                    <ChevronRight className="w-4 h-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Medium Risk Summary */}
                {analysis.churn_risk_analysis.medium_risk_clients.length > 0 && (
                  <Card className="border-0 shadow-sm liquid-glass">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        Medium Risk Clients
                        <Badge className="ml-auto bg-amber-100 text-amber-700">
                          {analysis.churn_risk_analysis.medium_risk_clients.length} clients
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {analysis.churn_risk_analysis.medium_risk_clients.slice(0, 6).map((client, idx) => (
                          <div key={idx} className="p-3 rounded-lg border dark:border-slate-700">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-sm">{client.client_name}</span>
                              <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700">
                                {Math.round(client.churn_probability)}%
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Opportunities Tab */}
              <TabsContent value="opportunities" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Upsell Opportunities */}
                  <Card className="border-0 shadow-sm liquid-glass">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-emerald-600" />
                        Upsell Opportunities
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {analysis.opportunity_analysis.upsell_opportunities.slice(0, 5).map((opp, idx) => (
                        <div key={idx} className="p-3 rounded-lg border dark:border-slate-700">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-semibold text-sm">{opp.client_name}</h4>
                              <p className="text-xs text-slate-500 mt-1">
                                {opp.recommended_product}
                              </p>
                            </div>
                            <Badge className="bg-emerald-100 text-emerald-700">
                              ${opp.expected_revenue?.toLocaleString() || 0}
                            </Badge>
                          </div>
                          <Progress value={opp.confidence_score} className="h-1 mb-2" />
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            {opp.reasoning}
                          </p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Cross-sell Opportunities */}
                  <Card className="border-0 shadow-sm liquid-glass">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="w-5 h-5 text-blue-600" />
                        Cross-sell Opportunities
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {analysis.opportunity_analysis.cross_sell_opportunities.slice(0, 5).map((opp, idx) => (
                        <div key={idx} className="p-3 rounded-lg border dark:border-slate-700">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-semibold text-sm">{opp.client_name}</h4>
                              <p className="text-xs text-slate-500 mt-1">
                                {opp.recommended_product}
                              </p>
                            </div>
                            <Badge className="bg-blue-100 text-blue-700">
                              {Math.round(opp.confidence_score)}%
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>

                {/* Total Opportunity Value */}
                <Card className="border-0 shadow-sm liquid-glass bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <DollarSign className="w-12 h-12 mx-auto mb-3 text-emerald-600" />
                      <p className="text-4xl font-bold text-emerald-600 mb-2">
                        ${analysis.opportunity_analysis.total_opportunity_value?.toLocaleString() || 0}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Total Identified Opportunity Value
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Retention Strategies Tab */}
              <TabsContent value="retention" className="space-y-4">
                {analysis.retention_strategies.map((strategy, idx) => (
                  <Card key={idx} className="border-0 shadow-sm liquid-glass">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg">{strategy.strategy_name}</CardTitle>
                        <Badge className={
                          strategy.priority === 'high' ? 'bg-red-100 text-red-700' :
                          strategy.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                          'bg-blue-100 text-blue-700'
                        }>
                          {strategy.priority} priority
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-500 mt-1">
                        Target: {strategy.target_segment}
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Implementation Steps:
                        </p>
                        <ol className="list-decimal list-inside space-y-1">
                          {strategy.implementation_steps.map((step, i) => (
                            <li key={i} className="text-sm text-slate-600 dark:text-slate-400">
                              {step}
                            </li>
                          ))}
                        </ol>
                      </div>
                      <div className="p-3 rounded bg-teal-50 dark:bg-teal-900/20">
                        <p className="text-sm font-medium text-teal-900 dark:text-teal-300 mb-1">
                          Expected Impact:
                        </p>
                        <p className="text-sm text-teal-700 dark:text-teal-400">
                          {strategy.expected_impact}
                        </p>
                        <p className="text-xs text-teal-600 dark:text-teal-500 mt-2">
                          Est. Retention Improvement: +{strategy.estimated_retention_improvement}%
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              {/* Engagement Actions Tab */}
              <TabsContent value="actions" className="space-y-3">
                {analysis.engagement_recommendations.map((rec, idx) => (
                  <Card key={idx} className="border-0 shadow-sm liquid-glass">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-slate-900 dark:text-white">
                            {rec.client_name}
                          </h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                            {rec.recommended_action}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={
                            rec.urgency === 'immediate' ? 'bg-red-100 text-red-700' :
                            rec.urgency === 'this_week' ? 'bg-amber-100 text-amber-700' :
                            'bg-blue-100 text-blue-700'
                          }>
                            {rec.urgency}
                          </Badge>
                          <Badge variant="outline">
                            {rec.channel}
                          </Badge>
                        </div>
                      </div>
                      {rec.talking_points && rec.talking_points.length > 0 && (
                        <div className="mt-3 p-3 rounded bg-slate-50 dark:bg-slate-800">
                          <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
                            Talking Points:
                          </p>
                          <ul className="list-disc list-inside space-y-1">
                            {rec.talking_points.map((point, i) => (
                              <li key={i} className="text-xs text-slate-600 dark:text-slate-400">
                                {point}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <Button
                        size="sm"
                        className="mt-3 w-full"
                        onClick={() => handleCreateTask(
                          rec.client_id,
                          rec.client_name,
                          rec.recommended_action,
                          rec.urgency === 'immediate' ? 'urgent' : 'high'
                        )}
                      >
                        Create Task
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}