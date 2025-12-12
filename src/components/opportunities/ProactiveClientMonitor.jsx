import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Sparkles, Loader2, TrendingUp, AlertTriangle, Target, 
  Mail, Phone, MessageSquare, DollarSign, Shield, Send,
  CheckCircle, Copy, ChevronRight, Users
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function ProactiveClientMonitor({ agentId, compact = false }) {
  const queryClient = useQueryClient();
  const [selectedClient, setSelectedClient] = useState(null);
  const [analysisResults, setAnalysisResults] = useState(null);

  const runAnalysisMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('aiProactiveClientAnalysis', {
        agentId
      });
      return response.data;
    },
    onSuccess: (data) => {
      setAnalysisResults(data);
      toast.success(`Analyzed ${data.clients_analyzed} clients`);
      queryClient.invalidateQueries(['proactiveOutreach']);
    },
    onError: () => toast.error('Analysis failed')
  });

  const { data: proactiveOutreach = [] } = useQuery({
    queryKey: ['proactiveOutreach', agentId],
    queryFn: () => base44.entities.ProactiveOutreach.filter({ 
      agent_id: agentId,
      status: { $in: ['identified', 'message_generated'] }
    }, '-created_date'),
    enabled: !!agentId
  });

  const updateOutreachMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      await base44.entities.ProactiveOutreach.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['proactiveOutreach']);
      toast.success('Outreach updated');
    }
  });

  const sendOutreachMutation = useMutation({
    mutationFn: async (outreach) => {
      const clients = await base44.entities.Client.filter({ id: outreach.client_id });
      const client = clients[0];

      await base44.integrations.Core.SendEmail({
        to: client.email,
        subject: outreach.ai_generated_message.subject,
        body: outreach.ai_generated_message.message
      });

      await base44.entities.ProactiveOutreach.update(outreach.id, {
        status: 'sent',
        sent_date: new Date().toISOString()
      });

      await base44.entities.ClientInteraction.create({
        client_id: outreach.client_id,
        agent_id: outreach.agent_id,
        interaction_type: 'email',
        direction: 'outbound',
        subject: outreach.ai_generated_message.subject,
        notes: outreach.ai_generated_message.message,
        interaction_date: new Date().toISOString(),
        ai_generated: true
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['proactiveOutreach']);
      toast.success('Email sent and logged');
    }
  });

  const getChurnColor = (risk) => {
    switch (risk) {
      case 'critical': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'high': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      case 'medium': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'low': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getChannelIcon = (channel) => {
    switch (channel) {
      case 'email': return Mail;
      case 'phone': return Phone;
      case 'text': return MessageSquare;
      default: return Mail;
    }
  };

  if (compact) {
    return (
      <Card className="clay-morphism border-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-600" />
              Proactive Opportunities
            </CardTitle>
            <Button
              size="sm"
              onClick={() => runAnalysisMutation.mutate()}
              disabled={runAnalysisMutation.isPending}
              className="bg-gradient-to-r from-purple-500 to-pink-600"
            >
              {runAnalysisMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {proactiveOutreach.slice(0, 3).map(outreach => (
              <div key={outreach.id} className="p-3 clay-subtle rounded-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-sm text-slate-900 dark:text-white">{outreach.title}</h4>
                    <Badge className="mt-1 text-xs">{outreach.opportunity_type}</Badge>
                  </div>
                  <Badge className={outreach.priority === 'high' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}>
                    {outreach.priority}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="clay-morphism border-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 mb-1">
                <Target className="w-6 h-6 text-purple-600" />
                Proactive Client Intelligence
              </CardTitle>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                AI-powered churn prevention and revenue optimization
              </p>
            </div>
            <Button
              onClick={() => runAnalysisMutation.mutate()}
              disabled={runAnalysisMutation.isPending}
              className="bg-gradient-to-r from-purple-500 to-pink-600"
              size="lg"
            >
              {runAnalysisMutation.isPending ? (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Analyzing Clients...</>
              ) : (
                <><Sparkles className="w-5 h-5 mr-2" />Scan Client Portfolio</>
              )}
            </Button>
          </div>
        </CardHeader>

        {analysisResults && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="p-4 clay-subtle rounded-xl text-center">
                <Users className="w-6 h-6 mx-auto text-blue-600 mb-2" />
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{analysisResults.clients_analyzed}</p>
                <p className="text-xs text-slate-500">Clients Analyzed</p>
              </div>
              <div className="p-4 clay-subtle rounded-xl text-center">
                <AlertTriangle className="w-6 h-6 mx-auto text-red-600 mb-2" />
                <p className="text-2xl font-bold text-red-600">
                  {analysisResults.results.filter(r => r.analysis.churn_analysis.churn_risk === 'high' || r.analysis.churn_analysis.churn_risk === 'critical').length}
                </p>
                <p className="text-xs text-slate-500">At Risk</p>
              </div>
              <div className="p-4 clay-subtle rounded-xl text-center">
                <TrendingUp className="w-6 h-6 mx-auto text-green-600 mb-2" />
                <p className="text-2xl font-bold text-green-600">
                  {analysisResults.results.reduce((sum, r) => sum + (r.analysis.upsell_opportunities?.length || 0), 0)}
                </p>
                <p className="text-xs text-slate-500">Upsell Opps</p>
              </div>
              <div className="p-4 clay-subtle rounded-xl text-center">
                <DollarSign className="w-6 h-6 mx-auto text-purple-600 mb-2" />
                <p className="text-2xl font-bold text-purple-600">
                  ${analysisResults.results.reduce((sum, r) => 
                    sum + (r.analysis.upsell_opportunities?.reduce((s, o) => s + (o.estimated_commission || 0), 0) || 0), 0
                  ).toLocaleString()}
                </p>
                <p className="text-xs text-slate-500">Potential Revenue</p>
              </div>
            </div>

            {/* Results Tabs */}
            <Tabs defaultValue="churn" className="w-full">
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="churn">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Churn Risks
                </TabsTrigger>
                <TabsTrigger value="upsell">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Upsell
                </TabsTrigger>
                <TabsTrigger value="cross-sell">
                  <Target className="w-4 h-4 mr-2" />
                  Cross-sell
                </TabsTrigger>
              </TabsList>

              <TabsContent value="churn" className="space-y-3">
                {analysisResults.results
                  .filter(r => r.analysis.churn_analysis.churn_risk !== 'low')
                  .sort((a, b) => b.analysis.churn_analysis.churn_probability - a.analysis.churn_analysis.churn_probability)
                  .map((result, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="p-4 clay-morphism rounded-xl cursor-pointer hover:scale-[1.01] transition-transform"
                      onClick={() => setSelectedClient(result)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <Link 
                            to={createPageUrl(`ClientDetail?id=${result.client_id}`)}
                            className="font-bold text-slate-900 dark:text-white hover:text-teal-600 hover:underline"
                          >
                            {result.client_name}
                          </Link>
                          <div className="flex gap-2 mt-1">
                            <Badge className={getChurnColor(result.analysis.churn_analysis.churn_risk)}>
                              {result.analysis.churn_analysis.churn_risk} risk
                            </Badge>
                            <Badge variant="outline">{result.analysis.churn_analysis.churn_probability}% probability</Badge>
                          </div>
                        </div>
                        <Badge className="bg-purple-100 text-purple-700">
                          Score: {result.analysis.overall_opportunity_score}
                        </Badge>
                      </div>

                      {result.analysis.churn_analysis.warning_signs?.length > 0 && (
                        <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                          <p className="text-xs font-semibold text-red-600 mb-1">Warning Signs:</p>
                          <ul className="space-y-1">
                            {result.analysis.churn_analysis.warning_signs.slice(0, 3).map((sign, si) => (
                              <li key={si} className="text-xs text-red-700 dark:text-red-400 flex items-start gap-1">
                                <span>•</span> {sign}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="p-3 clay-subtle rounded-lg mb-3">
                        <p className="text-xs font-semibold text-purple-600 mb-2">Recommended Action:</p>
                        <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">{result.analysis.next_best_action}</p>
                        <div className="flex gap-2">
                          <Badge variant="outline" className="text-xs">
                            {React.createElement(getChannelIcon(result.analysis.personalized_outreach.recommended_channel), { className: "w-3 h-3 mr-1 inline" })}
                            {result.analysis.personalized_outreach.recommended_channel}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {result.analysis.personalized_outreach.recommended_timing}
                          </Badge>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedClient(result);
                        }}
                        className="w-full bg-teal-600 hover:bg-teal-700"
                      >
                        View Outreach Strategy
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    </motion.div>
                  ))}
              </TabsContent>

              <TabsContent value="upsell" className="space-y-3">
                {analysisResults.results
                  .filter(r => r.analysis.upsell_opportunities?.length > 0)
                  .sort((a, b) => {
                    const aMax = Math.max(...a.analysis.upsell_opportunities.map(o => o.fit_score));
                    const bMax = Math.max(...b.analysis.upsell_opportunities.map(o => o.fit_score));
                    return bMax - aMax;
                  })
                  .map((result, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="p-4 clay-morphism rounded-xl"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <Link 
                          to={createPageUrl(`ClientDetail?id=${result.client_id}`)}
                          className="font-bold text-slate-900 dark:text-white hover:text-teal-600 hover:underline"
                        >
                          {result.client_name}
                        </Link>
                        <Badge className="bg-green-100 text-green-700">
                          ${result.analysis.upsell_opportunities.reduce((sum, o) => sum + (o.estimated_commission || 0), 0)} potential
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        {result.analysis.upsell_opportunities.map((opp, oi) => (
                          <div key={oi} className="p-3 clay-subtle rounded-lg">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h4 className="font-medium text-sm text-slate-900 dark:text-white">{opp.product_name}</h4>
                                <Badge variant="outline" className="mt-1 text-xs">{opp.opportunity_type}</Badge>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-slate-500">Fit Score</p>
                                <p className="text-lg font-bold text-green-600">{opp.fit_score}</p>
                              </div>
                            </div>
                            <p className="text-xs text-slate-700 dark:text-slate-300 mb-2">{opp.reasoning}</p>
                            <div className="flex gap-2 mb-2">
                              <Badge variant="outline" className="text-xs">+${opp.estimated_premium}/mo</Badge>
                              <Badge variant="outline" className="text-xs">${opp.estimated_commission} commission</Badge>
                              <Badge variant="outline" className="text-xs">{opp.timing}</Badge>
                            </div>
                            <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded text-xs text-green-700 dark:text-green-400">
                              💡 {opp.best_approach}
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
              </TabsContent>

              <TabsContent value="cross-sell" className="space-y-3">
                {analysisResults.results
                  .filter(r => r.analysis.cross_sell_opportunities?.length > 0)
                  .map((result, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="p-4 clay-morphism rounded-xl"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <Link 
                          to={createPageUrl(`ClientDetail?id=${result.client_id}`)}
                          className="font-bold text-slate-900 dark:text-white hover:text-teal-600 hover:underline"
                        >
                          {result.client_name}
                        </Link>
                        <Badge className="bg-blue-100 text-blue-700">
                          ${result.analysis.cross_sell_opportunities.reduce((sum, o) => sum + (o.estimated_value || 0), 0)}/year value
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        {result.analysis.cross_sell_opportunities.map((opp, oi) => (
                          <div key={oi} className="p-3 clay-subtle rounded-lg">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-medium text-sm text-slate-900 dark:text-white">{opp.product_category}</h4>
                              <Badge className="bg-blue-100 text-blue-700">{opp.fit_score} fit</Badge>
                            </div>
                            <p className="text-xs text-slate-700 dark:text-slate-300 mb-2">{opp.reasoning}</p>
                            {opp.life_event_trigger && (
                              <p className="text-xs text-purple-600 dark:text-purple-400 mb-2">
                                🎯 Trigger: {opp.life_event_trigger}
                              </p>
                            )}
                            <div className="flex gap-1 flex-wrap">
                              {opp.specific_products?.map((prod, pi) => (
                                <Badge key={pi} variant="outline" className="text-xs">{prod}</Badge>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
              </TabsContent>
            </Tabs>
          </CardContent>
        )}
      </Card>

      {/* Active Outreach Queue */}
      {proactiveOutreach.length > 0 && (
        <Card className="clay-morphism border-0">
          <CardHeader>
            <CardTitle>Active Outreach Queue ({proactiveOutreach.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {proactiveOutreach.map(outreach => (
              <div key={outreach.id} className="p-4 clay-subtle rounded-xl">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-slate-900 dark:text-white">{outreach.title}</h4>
                    <div className="flex gap-2 mt-1">
                      <Badge>{outreach.opportunity_type}</Badge>
                      <Badge className={outreach.priority === 'high' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}>
                        {outreach.priority}
                      </Badge>
                    </div>
                  </div>
                  <Badge variant="outline">{outreach.status}</Badge>
                </div>

                <p className="text-sm text-slate-700 dark:text-slate-300 mb-3">{outreach.description}</p>

                {outreach.ai_generated_message && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">Draft Message</p>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          navigator.clipboard.writeText(outreach.ai_generated_message.message);
                          toast.success('Message copied');
                        }}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                    <p className="text-xs font-medium text-slate-900 dark:text-white mb-1">
                      {outreach.ai_generated_message.subject}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                      {outreach.ai_generated_message.message}
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => sendOutreachMutation.mutate(outreach)}
                    disabled={sendOutreachMutation.isPending}
                    className="flex-1 bg-teal-600 hover:bg-teal-700"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Send Email
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateOutreachMutation.mutate({ id: outreach.id, data: { status: 'completed' } })}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Complete
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Selected Client Detail Modal */}
      <AnimatePresence>
        {selectedClient && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedClient(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-slate-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-gradient-to-r from-purple-500 to-pink-600 p-6 text-white">
                <h2 className="text-2xl font-bold mb-1">{selectedClient.client_name}</h2>
                <p className="text-purple-100">Complete Outreach Strategy</p>
              </div>

              <div className="p-6 space-y-4">
                {/* Personalized Outreach */}
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white mb-3">📧 Personalized Email</h3>
                  <div className="p-4 clay-subtle rounded-xl space-y-3">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Subject:</p>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {selectedClient.analysis.personalized_outreach.email_subject}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Body:</p>
                      <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap max-h-64 overflow-y-auto">
                        {selectedClient.analysis.personalized_outreach.email_draft}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Call Script */}
                {selectedClient.analysis.personalized_outreach.call_script_opening && (
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white mb-3">📞 Call Script Opening</h3>
                    <div className="p-4 clay-subtle rounded-xl">
                      <p className="text-sm text-slate-700 dark:text-slate-300">
                        {selectedClient.analysis.personalized_outreach.call_script_opening}
                      </p>
                    </div>
                  </div>
                )}

                {/* Priority Actions */}
                {selectedClient.analysis.priority_actions?.length > 0 && (
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white mb-3">Action Plan</h3>
                    <div className="space-y-2">
                      {selectedClient.analysis.priority_actions.map((action, ai) => (
                        <div key={ai} className="p-3 clay-subtle rounded-lg flex items-start gap-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0 ${
                            action.priority === 'urgent' ? 'bg-red-500' :
                            action.priority === 'high' ? 'bg-orange-500' :
                            action.priority === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
                          }`}>
                            {ai + 1}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-1">
                              <h4 className="font-medium text-sm text-slate-900 dark:text-white">{action.action}</h4>
                              <Badge className="text-xs">{action.category}</Badge>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">By: {action.deadline}</p>
                            <p className="text-xs text-green-600">Expected: {action.expected_outcome}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button onClick={() => setSelectedClient(null)} variant="outline" className="flex-1">
                    Close
                  </Button>
                  <Button className="flex-1 bg-teal-600 hover:bg-teal-700">
                    <Send className="w-4 h-4 mr-2" />
                    Execute Strategy
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}