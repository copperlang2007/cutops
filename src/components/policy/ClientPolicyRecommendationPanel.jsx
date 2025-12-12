import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Award, CheckCircle, XCircle, Calendar, DollarSign, 
  Shield, AlertCircle, PhoneCall, Sparkles, TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function ClientPolicyRecommendationPanel({ clientId, portalUserId }) {
  const queryClient = useQueryClient();

  const { data: recommendations = [], isLoading } = useQuery({
    queryKey: ['policyRecommendations', clientId || portalUserId],
    queryFn: async () => {
      const recs = await base44.entities.PolicyRecommendation.filter(
        { client_id: clientId || portalUserId },
        '-generated_date'
      );
      return recs.filter(r => ['suggested', 'viewed'].includes(r.status));
    },
    enabled: !!(clientId || portalUserId)
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      return await base44.entities.PolicyRecommendation.update(id, {
        status,
        action_taken_date: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['policyRecommendations']);
      toast.success('Recommendation updated');
    }
  });

  const handleMarkAsViewed = (recId) => {
    updateStatusMutation.mutate({ id: recId, status: 'viewed' });
  };

  const handleDecline = (recId) => {
    updateStatusMutation.mutate({ id: recId, status: 'declined' });
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'upgrade': return TrendingUp;
      case 'new_offering': return Award;
      case 'cross_sell': return Shield;
      case 'review': return AlertCircle;
      default: return Award;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'upgrade': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'new_offering': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      case 'cross_sell': return 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400';
      case 'review': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'high': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      case 'medium': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'low': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  if (isLoading) {
    return (
      <Card className="border-0 shadow-lg dark:bg-slate-800">
        <CardContent className="py-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto" />
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-4">Loading recommendations...</p>
        </CardContent>
      </Card>
    );
  }

  if (recommendations.length === 0) {
    return (
      <Card className="border-0 shadow-lg dark:bg-slate-800">
        <CardContent className="py-12 text-center">
          <Award className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">
            No Recommendations Yet
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Your insurance agent may provide personalized policy recommendations based on your profile and needs.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Your Policy Recommendations</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            AI-powered recommendations tailored to your needs
          </p>
        </div>
        <Badge className="bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400">
          {recommendations.length} {recommendations.length === 1 ? 'Recommendation' : 'Recommendations'}
        </Badge>
      </div>

      <AnimatePresence>
        {recommendations.map((rec, index) => {
          const TypeIcon = getTypeIcon(rec.recommendation_type);
          
          return (
            <motion.div
              key={rec.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="border-0 shadow-lg dark:bg-slate-800 overflow-hidden hover:shadow-xl transition-shadow">
                <div className="bg-gradient-to-r from-teal-500 to-emerald-600 p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <TypeIcon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          {rec.policy_details.product_name}
                        </h3>
                        <p className="text-sm text-teal-100">{rec.policy_details.product_type}</p>
                      </div>
                    </div>
                    <Badge className={getPriorityColor(rec.priority)}>
                      {rec.priority}
                    </Badge>
                  </div>
                </div>

                <CardContent className="p-6 space-y-4">
                  {/* Fit Score */}
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Client Fit Score
                        </span>
                        <span className="text-sm font-bold text-teal-600">
                          {rec.client_fit_score}/100
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-teal-500 to-emerald-600 h-2 rounded-full transition-all"
                          style={{ width: `${rec.client_fit_score}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Type and Carrier */}
                  <div className="flex gap-2">
                    <Badge className={getTypeColor(rec.recommendation_type)}>
                      {rec.recommendation_type.replace('_', ' ')}
                    </Badge>
                    {rec.policy_details.carrier && (
                      <Badge variant="outline">{rec.policy_details.carrier}</Badge>
                    )}
                  </div>

                  {/* Gap Identified */}
                  {rec.gap_identified && (
                    <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                            Coverage Gap Identified
                          </p>
                          <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                            {rec.gap_identified}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Reasoning */}
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800 dark:text-white mb-2">
                      Why This Recommendation?
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      {rec.reasoning}
                    </p>
                  </div>

                  {/* Key Benefits */}
                  {rec.policy_details.key_benefits && rec.policy_details.key_benefits.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800 dark:text-white mb-2">
                        Key Benefits
                      </h4>
                      <ul className="space-y-1">
                        {rec.policy_details.key_benefits.map((benefit, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                            {benefit}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Premium Impact */}
                  {rec.policy_details.estimated_premium_impact && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                      <DollarSign className="w-5 h-5 text-slate-400" />
                      <span className="text-sm text-slate-600 dark:text-slate-300">
                        Estimated Premium Impact: 
                        <span className="font-semibold ml-1">
                          ${Math.abs(rec.policy_details.estimated_premium_impact)}/month
                          {rec.policy_details.estimated_premium_impact > 0 ? ' additional' : ' savings'}
                        </span>
                      </span>
                    </div>
                  )}

                  {/* Potential Impact */}
                  <div className="p-3 rounded-lg bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800">
                    <div className="flex items-start gap-2">
                      <Sparkles className="w-5 h-5 text-teal-600 dark:text-teal-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-teal-900 dark:text-teal-100">
                          Potential Impact
                        </p>
                        <p className="text-sm text-teal-700 dark:text-teal-300 mt-1">
                          {rec.potential_impact}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Call to Action */}
                  <div className="pt-4 border-t dark:border-slate-700">
                    <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                      <strong>Next Step:</strong> {rec.call_to_action}
                    </p>
                    <div className="flex gap-3">
                      <Button
                        onClick={() => window.location.href = '#appointments'}
                        className="flex-1 bg-teal-600 hover:bg-teal-700"
                      >
                        <PhoneCall className="w-4 h-4 mr-2" />
                        Contact Agent
                      </Button>
                      {rec.status === 'suggested' && (
                        <Button
                          variant="outline"
                          onClick={() => handleMarkAsViewed(rec.id)}
                          className="flex-1"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Mark as Viewed
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        onClick={() => handleDecline(rec.id)}
                        className="text-slate-500 hover:text-red-600"
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Generated Date */}
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Calendar className="w-3 h-3" />
                    Generated {format(new Date(rec.generated_date), 'MMM d, yyyy')}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}