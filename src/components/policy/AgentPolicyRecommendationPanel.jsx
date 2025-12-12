import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Award, CheckCircle, XCircle, Loader2, RefreshCw, 
  TrendingUp, Shield, AlertCircle, Sparkles, DollarSign,
  MessageSquare, Calendar, Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function AgentPolicyRecommendationPanel({ clientId }) {
  const queryClient = useQueryClient();
  const [editingNotes, setEditingNotes] = useState({});
  const [noteValues, setNoteValues] = useState({});

  const { data: recommendations = [], isLoading } = useQuery({
    queryKey: ['agentPolicyRecommendations', clientId],
    queryFn: async () => {
      return await base44.entities.PolicyRecommendation.filter(
        { client_id: clientId },
        '-generated_date'
      );
    },
    enabled: !!clientId
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      return await base44.functions.invoke('aiPolicyRecommender', { client_id: clientId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['agentPolicyRecommendations']);
      toast.success('Policy recommendations generated successfully');
    },
    onError: (error) => {
      toast.error('Failed to generate recommendations: ' + error.message);
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, agent_notes }) => {
      return await base44.entities.PolicyRecommendation.update(id, {
        status,
        action_taken_date: new Date().toISOString(),
        ...(agent_notes !== undefined && { agent_notes })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['agentPolicyRecommendations']);
      toast.success('Recommendation updated');
      setEditingNotes({});
      setNoteValues({});
    }
  });

  const handleSaveNotes = (recId) => {
    const notes = noteValues[recId] || '';
    updateStatusMutation.mutate({ 
      id: recId, 
      status: recommendations.find(r => r.id === recId)?.status || 'suggested',
      agent_notes: notes 
    });
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
      case 'critical': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-300';
      case 'low': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-300';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'suggested': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'viewed': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      case 'discussed': return 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400';
      case 'applied': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'declined': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
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

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg dark:bg-slate-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-teal-600" />
                AI Policy Recommendations & Gap Analysis
              </CardTitle>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                AI-powered personalized policy recommendations based on client profile, risks, and needs
              </p>
            </div>
            <Button
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {generateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Generate Recommendations
                </>
              )}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {recommendations.length === 0 ? (
        <Card className="border-0 shadow-lg dark:bg-slate-800">
          <CardContent className="py-12 text-center">
            <Award className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">
              No Recommendations Generated
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
              Click "Generate Recommendations" to analyze this client's profile and identify policy opportunities and gaps.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Badge className="bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400">
                {recommendations.length} Total
              </Badge>
              <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                {recommendations.filter(r => r.priority === 'critical').length} Critical
              </Badge>
              <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                {recommendations.filter(r => r.priority === 'high').length} High
              </Badge>
            </div>
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
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className={`border-2 shadow-lg dark:bg-slate-800 ${rec.priority === 'critical' || rec.priority === 'high' ? 'border-red-200 dark:border-red-800' : 'border-transparent'}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shrink-0">
                            <TypeIcon className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                              {rec.policy_details.product_name}
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              {rec.policy_details.product_type}
                              {rec.policy_details.carrier && ` • ${rec.policy_details.carrier}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getPriorityColor(rec.priority)}>
                            {rec.priority}
                          </Badge>
                          <Badge className={getStatusColor(rec.status)}>
                            {rec.status}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Fit Score & Gap */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
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
                        <div className="flex items-center gap-2">
                          <Badge className={getTypeColor(rec.recommendation_type)}>
                            {rec.recommendation_type.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>

                      {/* Gap Identified */}
                      {rec.gap_identified && (
                        <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                            <div>
                              <p className="text-xs font-semibold text-amber-900 dark:text-amber-100 mb-1">
                                Coverage Gap
                              </p>
                              <p className="text-xs text-amber-700 dark:text-amber-300">
                                {rec.gap_identified}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* AI Reasoning */}
                      <div>
                        <h4 className="text-xs font-semibold text-slate-800 dark:text-white mb-1">
                          AI Analysis
                        </h4>
                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                          {rec.reasoning}
                        </p>
                      </div>

                      {/* Key Benefits */}
                      {rec.policy_details.key_benefits && rec.policy_details.key_benefits.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold text-slate-800 dark:text-white mb-2">
                            Key Benefits
                          </h4>
                          <div className="grid grid-cols-2 gap-2">
                            {rec.policy_details.key_benefits.map((benefit, idx) => (
                              <div key={idx} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                                <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 shrink-0" />
                                <span>{benefit}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Premium Impact */}
                      {rec.policy_details.estimated_premium_impact && (
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                          <DollarSign className="w-4 h-4 text-slate-400" />
                          <span className="text-xs text-slate-600 dark:text-slate-300">
                            Est. Premium Impact: 
                            <span className="font-semibold ml-1">
                              ${Math.abs(rec.policy_details.estimated_premium_impact)}/mo
                              {rec.policy_details.estimated_premium_impact > 0 ? ' additional' : ' savings'}
                            </span>
                          </span>
                        </div>
                      )}

                      {/* Potential Impact */}
                      <div className="p-3 rounded-lg bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800">
                        <p className="text-xs font-semibold text-teal-900 dark:text-teal-100 mb-1">
                          Potential Impact
                        </p>
                        <p className="text-xs text-teal-700 dark:text-teal-300">
                          {rec.potential_impact}
                        </p>
                      </div>

                      {/* Call to Action */}
                      <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                        <p className="text-xs text-slate-600 dark:text-slate-300">
                          <strong>Next Step:</strong> {rec.call_to_action}
                        </p>
                      </div>

                      {/* Agent Notes */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-xs font-semibold text-slate-800 dark:text-white">
                            Agent Notes
                          </h4>
                          {!editingNotes[rec.id] && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingNotes({ ...editingNotes, [rec.id]: true });
                                setNoteValues({ ...noteValues, [rec.id]: rec.agent_notes || '' });
                              }}
                              className="h-7 px-2 text-xs"
                            >
                              <MessageSquare className="w-3 h-3 mr-1" />
                              {rec.agent_notes ? 'Edit' : 'Add'}
                            </Button>
                          )}
                        </div>
                        {editingNotes[rec.id] ? (
                          <div className="space-y-2">
                            <Textarea
                              value={noteValues[rec.id] || ''}
                              onChange={(e) => setNoteValues({ ...noteValues, [rec.id]: e.target.value })}
                              placeholder="Add notes about this recommendation..."
                              className="text-xs"
                              rows={3}
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleSaveNotes(rec.id)}
                                className="h-7 text-xs bg-teal-600 hover:bg-teal-700"
                              >
                                Save Notes
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingNotes({ ...editingNotes, [rec.id]: false })}
                                className="h-7 text-xs"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                            {rec.agent_notes || 'No notes added yet'}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="pt-3 border-t dark:border-slate-700 flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => updateStatusMutation.mutate({ id: rec.id, status: 'discussed' })}
                          disabled={rec.status === 'discussed' || updateStatusMutation.isPending}
                          variant="outline"
                          className="flex-1 text-xs h-8"
                        >
                          <MessageSquare className="w-3 h-3 mr-1" />
                          Mark Discussed
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => updateStatusMutation.mutate({ id: rec.id, status: 'applied' })}
                          disabled={rec.status === 'applied' || updateStatusMutation.isPending}
                          className="flex-1 text-xs h-8 bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Mark Applied
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => updateStatusMutation.mutate({ id: rec.id, status: 'declined' })}
                          disabled={rec.status === 'declined' || updateStatusMutation.isPending}
                          variant="ghost"
                          className="text-xs h-8 text-red-600 hover:text-red-700"
                        >
                          <XCircle className="w-3 h-3" />
                        </Button>
                      </div>

                      {/* Meta Info */}
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(rec.generated_date), 'MMM d, yyyy')}
                        </div>
                        {rec.action_taken_date && (
                          <div className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            Action: {format(new Date(rec.action_taken_date), 'MMM d')}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}