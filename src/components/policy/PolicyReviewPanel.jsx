import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileSearch, TrendingUp, TrendingDown, AlertTriangle,
  CheckCircle, Loader2, BarChart3, DollarSign, Shield,
  ArrowUpCircle, ArrowDownCircle, Minus, Plus, X, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function PolicyReviewPanel({ clientId, onUpdate }) {
  const queryClient = useQueryClient();
  const [reviewing, setReviewing] = useState(false);

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['policyReviews', clientId],
    queryFn: () => base44.entities.PolicyReview.filter({ client_id: clientId }, '-review_date', 5),
    enabled: !!clientId
  });

  const latestReview = reviews[0];

  const runReviewMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('aiPolicyReview', { clientId });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['policyReviews', clientId]);
      toast.success(`Policy review completed with ${data.policyReview.ai_confidence}% confidence`);
      setReviewing(false);
      if (onUpdate) onUpdate();
    },
    onError: () => {
      toast.error('Policy review failed');
      setReviewing(false);
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ reviewId, status, notes }) => 
      base44.entities.PolicyReview.update(reviewId, { 
        review_status: status,
        agent_notes: notes,
        reviewed_by: base44.auth.me().then(u => u.email),
        completed_date: status === 'completed' ? new Date().toISOString() : null
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(['policyReviews', clientId]);
      toast.success('Review status updated');
    }
  });

  const handleRunReview = () => {
    setReviewing(true);
    runReviewMutation.mutate();
  };

  const getRatingColor = (rating) => {
    const colors = {
      optimal: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      above_market: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      at_market: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
      below_market: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
    };
    return colors[rating] || colors.at_market;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      critical: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      low: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    };
    return colors[priority] || colors.medium;
  };

  const getAdjustmentIcon = (type) => {
    const icons = {
      increase_coverage: ArrowUpCircle,
      decrease_coverage: ArrowDownCircle,
      change_deductible: RefreshCw,
      add_rider: Plus,
      remove_rider: X,
      consolidate: Minus,
      replace: RefreshCw
    };
    return icons[type] || RefreshCw;
  };

  if (isLoading) {
    return (
      <Card className="clay-morphism border-0">
        <CardContent className="py-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">Loading policy reviews...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="clay-morphism border-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                <FileSearch className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle>AI Policy Review</CardTitle>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Automated analysis of coverage adequacy and market positioning
                </p>
              </div>
            </div>
            <Button
              onClick={handleRunReview}
              disabled={reviewing}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-xl"
            >
              {reviewing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Reviewing...
                </>
              ) : (
                <>
                  <FileSearch className="w-5 h-5 mr-2" />
                  {latestReview ? 'Re-run Review' : 'Run Policy Review'}
                </>
              )}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {latestReview ? (
        <>
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="clay-morphism border-0">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Market Rating</span>
                  <Badge className={getRatingColor(latestReview.market_comparison?.overall_rating)}>
                    {latestReview.market_comparison?.overall_rating?.replace('_', ' ')}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  {latestReview.market_comparison?.overall_rating === 'optimal' && <TrendingUp className="w-5 h-5 text-green-600" />}
                  {latestReview.market_comparison?.overall_rating === 'below_market' && <TrendingDown className="w-5 h-5 text-amber-600" />}
                  {!['optimal', 'below_market'].includes(latestReview.market_comparison?.overall_rating) && <BarChart3 className="w-5 h-5 text-blue-600" />}
                </div>
              </CardContent>
            </Card>

            <Card className="clay-morphism border-0">
              <CardContent className="pt-6">
                <span className="text-sm text-slate-600 dark:text-slate-400 block mb-2">AI Confidence</span>
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-bold text-slate-900 dark:text-white">{latestReview.ai_confidence}%</span>
                  <div className="h-2 flex-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${latestReview.ai_confidence}%` }}
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-600"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="clay-morphism border-0">
              <CardContent className="pt-6">
                <span className="text-sm text-slate-600 dark:text-slate-400 block mb-2">Issues Found</span>
                <div className="flex gap-2">
                  {latestReview.policy_inadequacy_identified && (
                    <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Inadequacy
                    </Badge>
                  )}
                  {latestReview.policy_overlap_identified && (
                    <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                      Overlap
                    </Badge>
                  )}
                  {!latestReview.policy_inadequacy_identified && !latestReview.policy_overlap_identified && (
                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Good Coverage
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <Tabs defaultValue="summary" className="space-y-4">
            <TabsList className="clay-morphism p-1.5 rounded-2xl">
              <TabsTrigger value="summary" className="rounded-xl data-[state=active]:clay-morphism data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white">
                Summary
              </TabsTrigger>
              <TabsTrigger value="adjustments" className="rounded-xl data-[state=active]:clay-morphism data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white">
                Adjustments ({latestReview.suggested_adjustments?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="products" className="rounded-xl data-[state=active]:clay-morphism data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white">
                New Products ({latestReview.new_product_suggestions?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="market" className="rounded-xl data-[state=active]:clay-morphism data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white">
                Market Analysis
              </TabsTrigger>
            </TabsList>

            {/* Summary Tab */}
            <TabsContent value="summary" className="space-y-4">
              <Card className="clay-morphism border-0">
                <CardHeader>
                  <CardTitle className="text-lg">Review Summary</CardTitle>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {latestReview.recommendation_reason}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                      {latestReview.summary_report}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Adjustments Tab */}
            <TabsContent value="adjustments" className="space-y-3">
              {latestReview.suggested_adjustments?.map((adjustment, idx) => {
                const Icon = getAdjustmentIcon(adjustment.adjustment_type);
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card className="clay-morphism border-0 border-l-4 border-l-blue-500">
                      <CardContent className="pt-5">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                            <Icon className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="flex-1 space-y-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-bold text-slate-900 dark:text-white">{adjustment.policy_type}</h4>
                                  <Badge className={getPriorityColor(adjustment.priority)}>
                                    {adjustment.priority}
                                  </Badge>
                                </div>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                  {adjustment.adjustment_type.replace(/_/g, ' ')}
                                </p>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div className="p-2 clay-subtle rounded-lg">
                                <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Current</span>
                                <span className="font-medium text-slate-900 dark:text-white">{adjustment.current_value}</span>
                              </div>
                              <div className="p-2 clay-subtle rounded-lg">
                                <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Suggested</span>
                                <span className="font-medium text-blue-600">{adjustment.suggested_value}</span>
                              </div>
                            </div>
                            <div className="p-3 clay-subtle rounded-lg">
                              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Justification:</p>
                              <p className="text-sm text-slate-700 dark:text-slate-300">{adjustment.justification}</p>
                            </div>
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                              <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">Expected Impact:</p>
                              <p className="text-sm text-slate-700 dark:text-slate-300">{adjustment.estimated_impact}</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
              {(!latestReview.suggested_adjustments || latestReview.suggested_adjustments.length === 0) && (
                <Card className="clay-morphism border-0">
                  <CardContent className="py-12 text-center">
                    <CheckCircle className="w-12 h-12 mx-auto text-green-600 mb-3" />
                    <p className="text-slate-600 dark:text-slate-400">No policy adjustments recommended</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* New Products Tab */}
            <TabsContent value="products" className="space-y-3">
              {latestReview.new_product_suggestions?.map((product, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className="clay-morphism border-0 border-l-4 border-l-green-500">
                    <CardContent className="pt-5 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="text-lg font-bold text-slate-900 dark:text-white">{product.product_name}</h4>
                            <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                              {product.fit_score}% Match
                            </Badge>
                          </div>
                          <Badge variant="outline">{product.product_type}</Badge>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-500 dark:text-slate-400">Est. Premium</p>
                          <p className="text-xl font-bold text-slate-900 dark:text-white">
                            ${product.estimated_premium}
                            <span className="text-xs text-slate-500">/mo</span>
                          </p>
                        </div>
                      </div>
                      <div className="p-3 clay-subtle rounded-lg">
                        <p className="text-sm text-slate-700 dark:text-slate-300">{product.reasoning}</p>
                      </div>
                      {product.key_benefits && product.key_benefits.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Key Benefits:</p>
                          <div className="space-y-1.5">
                            {product.key_benefits.map((benefit, bidx) => (
                              <div key={bidx} className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                                <span className="text-sm text-slate-700 dark:text-slate-300">{benefit}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
              {(!latestReview.new_product_suggestions || latestReview.new_product_suggestions.length === 0) && (
                <Card className="clay-morphism border-0">
                  <CardContent className="py-12 text-center">
                    <Shield className="w-12 h-12 mx-auto text-slate-400 mb-3" />
                    <p className="text-slate-600 dark:text-slate-400">No new products recommended</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Market Analysis Tab */}
            <TabsContent value="market" className="space-y-4">
              <Card className="clay-morphism border-0">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Market Comparison</CardTitle>
                    <Badge className={getRatingColor(latestReview.market_comparison?.overall_rating)}>
                      {latestReview.market_comparison?.overall_rating?.replace('_', ' ')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 clay-subtle rounded-xl">
                    <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-2">PRICING ANALYSIS</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300">{latestReview.market_comparison?.pricing_analysis}</p>
                  </div>

                  {latestReview.market_comparison?.coverage_gaps?.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Coverage Gaps:</p>
                      <div className="space-y-2">
                        {latestReview.market_comparison.coverage_gaps.map((gap, idx) => (
                          <div key={idx} className="flex items-start gap-2 p-2 clay-subtle rounded-lg">
                            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                            <span className="text-sm text-slate-700 dark:text-slate-300">{gap}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {latestReview.market_comparison?.competitive_advantages?.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Competitive Advantages:</p>
                      <div className="space-y-2">
                        {latestReview.market_comparison.competitive_advantages.map((adv, idx) => (
                          <div key={idx} className="flex items-start gap-2 p-2 clay-subtle rounded-lg">
                            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                            <span className="text-sm text-slate-700 dark:text-slate-300">{adv}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {latestReview.market_comparison?.competitor_comparison?.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Policy-by-Policy Comparison:</p>
                      <div className="space-y-2">
                        {latestReview.market_comparison.competitor_comparison.map((comp, idx) => (
                          <div key={idx} className="p-3 clay-subtle rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-slate-900 dark:text-white">{comp.policy_type}</span>
                              <Badge variant={comp.variance_percentage < 0 ? "default" : "destructive"}>
                                {comp.variance_percentage > 0 ? '+' : ''}{comp.variance_percentage.toFixed(1)}%
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <span className="text-xs text-slate-500 dark:text-slate-400">Market Avg:</span>
                                <p className="font-medium text-slate-700 dark:text-slate-300">${comp.market_average_premium}/mo</p>
                              </div>
                              <div>
                                <span className="text-xs text-slate-500 dark:text-slate-400">Client Premium:</span>
                                <p className="font-medium text-slate-700 dark:text-slate-300">${comp.client_premium}/mo</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Actions */}
          <Card className="clay-morphism border-0">
            <CardContent className="pt-6">
              <div className="flex gap-3 justify-end">
                <Button 
                  variant="outline" 
                  className="clay-morphism"
                  onClick={() => updateStatusMutation.mutate({ 
                    reviewId: latestReview.id, 
                    status: 'dismissed' 
                  })}
                >
                  Dismiss
                </Button>
                <Button 
                  variant="outline" 
                  className="clay-morphism"
                  onClick={() => updateStatusMutation.mutate({ 
                    reviewId: latestReview.id, 
                    status: 'in_progress' 
                  })}
                >
                  Mark In Progress
                </Button>
                <Button 
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                  onClick={() => updateStatusMutation.mutate({ 
                    reviewId: latestReview.id, 
                    status: 'completed' 
                  })}
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Complete Review
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card className="clay-morphism border-0">
          <CardContent className="py-16 text-center">
            <FileSearch className="w-16 h-16 mx-auto text-blue-600 mb-4" />
            <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">
              No Policy Review Yet
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
              Run an AI-powered policy review to identify coverage gaps, overlaps, and market opportunities
            </p>
            <Button
              onClick={handleRunReview}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-xl"
            >
              <FileSearch className="w-5 h-5 mr-2" />
              Run First Policy Review
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}