import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Sparkles, AlertTriangle, TrendingUp, MessageSquare,
  Target, GraduationCap, Clock, Phone, Mail,
  Video, User, DollarSign, Loader2, RefreshCw,
  CheckCircle, ArrowUpRight, Lightbulb
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export default function ClientInsightsPanel({ clientId, clientName }) {
  const [insights, setInsights] = useState(null);

  const generateInsightsMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('aiClientInsights', {
        client_id: clientId
      });
      return response.data;
    },
    onSuccess: async (data) => {
      setInsights(data.insights);
      
      // Auto-generate tasks based on insights
      try {
        const taskResult = await base44.functions.invoke('aiTaskAutomation', {
          trigger_type: 'client_insights',
          entity_id: clientId,
          insights: data.insights
        });
        
        if (taskResult.data.tasks_created > 0) {
          toast.success(`Generated ${taskResult.data.tasks_created} prioritized task(s)`);
        }
      } catch (error) {
        console.error('Failed to auto-generate tasks:', error);
      }
    }
  });

  const getRiskColor = (level) => {
    switch (level) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-amber-600 bg-amber-50 border-amber-200';
      default: return 'text-green-600 bg-green-50 border-green-200';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  const getChannelIcon = (channel) => {
    switch (channel) {
      case 'phone': return Phone;
      case 'email': return Mail;
      case 'video_call': return Video;
      default: return MessageSquare;
    }
  };

  return (
    <div className="space-y-4">
      <Card className="border-0 shadow-lg dark:bg-slate-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              AI Client Insights
            </CardTitle>
            <Button
              size="sm"
              onClick={() => generateInsightsMutation.mutate()}
              disabled={generateInsightsMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {generateInsightsMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Generate Insights
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!insights && !generateInsightsMutation.isPending && (
            <div className="text-center py-12">
              <Sparkles className="w-12 h-12 mx-auto text-slate-300 mb-4" />
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                Generate AI-powered insights for {clientName}
              </p>
              <p className="text-sm text-slate-500">
                Analyze churn risk, identify opportunities, and get personalized coaching
              </p>
            </div>
          )}

          {generateInsightsMutation.isPending && (
            <div className="text-center py-12">
              <Loader2 className="w-12 h-12 mx-auto text-purple-600 mb-4 animate-spin" />
              <p className="text-slate-600 dark:text-slate-400 mb-2">
                Analyzing client data with AI...
              </p>
              <p className="text-sm text-slate-500">
                This may take a few seconds
              </p>
            </div>
          )}

          <AnimatePresence>
            {insights && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Overall Health Score */}
                <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      Overall Health Score
                    </p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
                      {insights.overall_health_score}/100
                    </p>
                  </div>
                  <div className="w-24 h-24">
                    <svg className="transform -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="#e2e8f0"
                        strokeWidth="8"
                        fill="none"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke={
                          insights.overall_health_score >= 80 ? '#10b981' :
                          insights.overall_health_score >= 60 ? '#f59e0b' : '#ef4444'
                        }
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={`${insights.overall_health_score * 2.51} 251`}
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                </div>

                {/* Key Insights */}
                {insights.key_insights && insights.key_insights.length > 0 && (
                  <div className="p-4 rounded-lg border border-purple-200 bg-purple-50 dark:bg-purple-900/20 dark:border-purple-700">
                    <h4 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-purple-600" />
                      Key Insights
                    </h4>
                    <ul className="space-y-2">
                      {insights.key_insights.map((insight, idx) => (
                        <li key={idx} className="text-sm text-slate-700 dark:text-slate-300 flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                          <span>{insight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Tabs for Different Insights */}
                <Tabs defaultValue="churn" className="space-y-4">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="churn">
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Churn Risk
                    </TabsTrigger>
                    <TabsTrigger value="actions">
                      <Target className="w-4 h-4 mr-2" />
                      Actions
                    </TabsTrigger>
                    <TabsTrigger value="opportunities">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Opportunities
                    </TabsTrigger>
                    <TabsTrigger value="coaching">
                      <GraduationCap className="w-4 h-4 mr-2" />
                      Coaching
                    </TabsTrigger>
                  </TabsList>

                  {/* Churn Risk Tab */}
                  <TabsContent value="churn" className="space-y-4">
                    <Card className="border-0 shadow-sm dark:bg-slate-900">
                      <CardHeader>
                        <CardTitle className="text-lg">Churn Risk Analysis</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Risk Score</span>
                            <Badge className={getRiskColor(insights.churn_risk.level)}>
                              {insights.churn_risk.level.toUpperCase()}
                            </Badge>
                          </div>
                          <Progress value={insights.churn_risk.score} className="h-2" />
                          <p className="text-xs text-slate-500 mt-1">
                            {insights.churn_risk.score}/100
                          </p>
                        </div>

                        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                          <p className="text-sm text-slate-700 dark:text-slate-300">
                            {insights.churn_risk.reasoning}
                          </p>
                        </div>

                        {insights.churn_risk.indicators.length > 0 && (
                          <div>
                            <h5 className="font-medium text-sm mb-2">Risk Indicators</h5>
                            <div className="space-y-2">
                              {insights.churn_risk.indicators.map((indicator, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-start gap-2 p-2 rounded bg-red-50 dark:bg-red-900/20 text-sm"
                                >
                                  <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                                  <span className="text-slate-700 dark:text-slate-300">{indicator}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Follow-up Actions Tab */}
                  <TabsContent value="actions" className="space-y-4">
                    {insights.follow_up_recommendations.map((rec, idx) => {
                      const ChannelIcon = getChannelIcon(rec.communication_channel);
                      return (
                        <Card key={idx} className="border-0 shadow-sm dark:bg-slate-900">
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <Badge className={getPriorityColor(rec.priority)}>
                                  {rec.priority.toUpperCase()}
                                </Badge>
                                <Badge variant="outline" className="flex items-center gap-1">
                                  <ChannelIcon className="w-3 h-3" />
                                  {rec.communication_channel.replace('_', ' ')}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-1 text-xs text-slate-500">
                                <Clock className="w-3 h-3" />
                                {rec.suggested_timing}
                              </div>
                            </div>

                            <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                              {rec.action}
                            </h4>

                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                              {rec.reason}
                            </p>

                            {rec.talking_points && rec.talking_points.length > 0 && (
                              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                <p className="text-xs font-medium text-blue-900 dark:text-blue-300 mb-2">
                                  Talking Points:
                                </p>
                                <ul className="space-y-1">
                                  {rec.talking_points.map((point, pidx) => (
                                    <li key={pidx} className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2">
                                      <ArrowUpRight className="w-3 h-3 text-blue-600 mt-0.5 flex-shrink-0" />
                                      {point}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </TabsContent>

                  {/* Opportunities Tab */}
                  <TabsContent value="opportunities" className="space-y-4">
                    {insights.opportunities.cross_sell.length > 0 && (
                      <Card className="border-0 shadow-sm dark:bg-slate-900">
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-green-600" />
                            Cross-Sell Opportunities
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {insights.opportunities.cross_sell.map((opp, idx) => (
                            <div key={idx} className="p-4 rounded-lg border dark:border-slate-700">
                              <div className="flex items-start justify-between mb-2">
                                <h5 className="font-semibold text-slate-900 dark:text-white">
                                  {opp.product}
                                </h5>
                                <Badge className={
                                  opp.likelihood === 'high' ? 'bg-green-100 text-green-700' :
                                  opp.likelihood === 'medium' ? 'bg-amber-100 text-amber-700' :
                                  'bg-blue-100 text-blue-700'
                                }>
                                  {opp.likelihood} likelihood
                                </Badge>
                              </div>
                              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                                {opp.reasoning}
                              </p>
                              {opp.estimated_value && (
                                <div className="flex items-center gap-2 text-sm text-green-600">
                                  <DollarSign className="w-4 h-4" />
                                  {opp.estimated_value}
                                </div>
                              )}
                              <div className="mt-3 p-2 bg-green-50 dark:bg-green-900/20 rounded text-xs">
                                <strong>Approach:</strong> {opp.approach}
                              </div>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    )}

                    {insights.opportunities.up_sell.length > 0 && (
                      <Card className="border-0 shadow-sm dark:bg-slate-900">
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <ArrowUpRight className="w-5 h-5 text-blue-600" />
                            Up-Sell Opportunities
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {insights.opportunities.up_sell.map((opp, idx) => (
                            <div key={idx} className="p-4 rounded-lg border dark:border-slate-700">
                              <div className="mb-3">
                                <p className="text-xs text-slate-500">Current Plan</p>
                                <p className="font-medium text-slate-900 dark:text-white">{opp.current_plan}</p>
                              </div>
                              <div className="mb-3">
                                <p className="text-xs text-slate-500">Recommended Plan</p>
                                <p className="font-semibold text-blue-600">{opp.recommended_plan}</p>
                              </div>
                              {opp.benefits && opp.benefits.length > 0 && (
                                <div className="mb-3">
                                  <p className="text-xs font-medium mb-1">Additional Benefits:</p>
                                  <ul className="space-y-1">
                                    {opp.benefits.map((benefit, bidx) => (
                                      <li key={bidx} className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-1">
                                        <CheckCircle className="w-3 h-3 text-green-600 mt-0.5" />
                                        {benefit}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs">
                                <strong>Value:</strong> {opp.value_proposition}
                              </div>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    )}

                    {insights.opportunities.cross_sell.length === 0 && insights.opportunities.up_sell.length === 0 && (
                      <Card className="border-0 shadow-sm dark:bg-slate-900">
                        <CardContent className="pt-12 pb-12 text-center">
                          <TrendingUp className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                          <p className="text-slate-500">No immediate opportunities identified</p>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>

                  {/* Coaching Tab */}
                  <TabsContent value="coaching" className="space-y-4">
                    <Card className="border-0 shadow-sm dark:bg-slate-900">
                      <CardHeader>
                        <CardTitle className="text-lg">Agent Coaching Insights</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {insights.agent_coaching.strengths.length > 0 && (
                          <div>
                            <h5 className="font-medium text-sm mb-2 flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              Strengths
                            </h5>
                            <div className="space-y-2">
                              {insights.agent_coaching.strengths.map((strength, idx) => (
                                <div key={idx} className="p-2 bg-green-50 dark:bg-green-900/20 rounded text-sm text-slate-700 dark:text-slate-300">
                                  {strength}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {insights.agent_coaching.improvement_areas.length > 0 && (
                          <div>
                            <h5 className="font-medium text-sm mb-2 flex items-center gap-2">
                              <Target className="w-4 h-4 text-amber-600" />
                              Areas for Improvement
                            </h5>
                            <div className="space-y-2">
                              {insights.agent_coaching.improvement_areas.map((area, idx) => (
                                <div key={idx} className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded text-sm text-slate-700 dark:text-slate-300">
                                  {area}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {insights.agent_coaching.tips.length > 0 && (
                          <div>
                            <h5 className="font-medium text-sm mb-2 flex items-center gap-2">
                              <GraduationCap className="w-4 h-4 text-purple-600" />
                              Coaching Tips
                            </h5>
                            <div className="space-y-3">
                              {insights.agent_coaching.tips.map((tip, idx) => (
                                <div key={idx} className="p-3 rounded-lg border dark:border-slate-700">
                                  <Badge className="mb-2" variant="outline">
                                    {tip.category}
                                  </Badge>
                                  <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
                                    {tip.tip}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    <strong>Expected Impact:</strong> {tip.expected_impact}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}