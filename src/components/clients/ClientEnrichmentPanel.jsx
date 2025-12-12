import { useState } from 'react'
import { base44 } from '@/api/base44Client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Sparkles, CheckCircle, AlertTriangle, TrendingUp, 
  DollarSign, User, MapPin, Phone, Mail, Loader2,
  Shield, Star, ThumbsUp, ArrowRight
} from 'lucide-react';
import { toast } from 'sonner'
import { motion } from 'framer-motion'

export default function ClientEnrichmentPanel({ clientId, onUpdate }) {
  const queryClient = useQueryClient();
  const [enriching, setEnriching] = useState(false);

  const { data: enrichments = [], isLoading } = useQuery({
    queryKey: ['clientEnrichments', clientId],
    queryFn: () => base44.entities.ClientEnrichment.filter({ client_id: clientId }),
    enabled: !!clientId
  });

  const latestEnrichment = enrichments[0];

  const runEnrichmentMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('aiClientEnrichment', { clientId });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['clientEnrichments', clientId]);
      toast.success(`Enrichment complete! Quality score: ${data.enrichment.data_quality_score}/100`);
      setEnriching(false);
    },
    onError: () => {
      toast.error('Enrichment failed');
      setEnriching(false);
    }
  });

  const applyCorrectioMutation = useMutation({
    mutationFn: async ({ field, newValue }) => {
      // Update client with corrected data
      const updates = { [field]: newValue };
      await base44.entities.Client.update(clientId, updates);
      
      // Track the correction
      const updatedCorrections = [
        ...(latestEnrichment.applied_corrections || []),
        {
          field,
          new_value: newValue,
          applied_date: new Date().toISOString(),
          applied_by: (await base44.auth.me()).email
        }
      ];
      
      await base44.entities.ClientEnrichment.update(latestEnrichment.id, {
        applied_corrections: updatedCorrections,
        status: 'partially_applied'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['clientEnrichments', clientId]);
      queryClient.invalidateQueries(['clients']);
      if (onUpdate) onUpdate();
      toast.success('Correction applied');
    }
  });

  const getQualityColor = (score) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-amber-600';
    return 'text-red-600';
  };

  const getImportanceColor = (importance) => {
    const colors = {
      critical: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      low: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    };
    return colors[importance] || colors.low;
  };

  const handleEnrich = () => {
    setEnriching(true);
    runEnrichmentMutation.mutate();
  };

  if (isLoading) {
    return (
      <Card className="clay-morphism border-0">
        <CardContent className="py-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-600" />
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">Loading enrichment data...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enrichment Header */}
      <Card className="clay-morphism border-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl clay-morphism bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle>AI Profile Enrichment</CardTitle>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Validate data, identify gaps, and discover opportunities
                </p>
              </div>
            </div>
            <Button
              onClick={handleEnrich}
              disabled={enriching}
              className="clay-morphism bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white shadow-xl shadow-purple-500/40 border-0"
            >
              {enriching ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Enriching...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  {latestEnrichment ? 'Re-Enrich' : 'Enrich Profile'}
                </>
              )}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {latestEnrichment ? (
        <>
          {/* Quality Score */}
          <Card className="clay-morphism border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Data Quality Score</p>
                  <div className="flex items-center gap-3">
                    <p className={`text-5xl font-bold ${getQualityColor(latestEnrichment.data_quality_score)}`}>
                      {latestEnrichment.data_quality_score}
                    </p>
                    <span className="text-2xl text-slate-400">/100</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500 mb-2">Last enriched</p>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {new Date(latestEnrichment.enrichment_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="mt-4 h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${latestEnrichment.data_quality_score}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className={`h-full ${
                    latestEnrichment.data_quality_score >= 90 ? 'bg-green-600' :
                    latestEnrichment.data_quality_score >= 70 ? 'bg-amber-600' : 'bg-red-600'
                  }`}
                />
              </div>
            </CardContent>
          </Card>

          {/* Enrichment Details */}
          <Tabs defaultValue="missing" className="space-y-4">
            <TabsList className="clay-morphism p-1.5 rounded-2xl">
              <TabsTrigger value="missing" className="rounded-xl data-[state=active]:clay-morphism data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg">
                Missing Fields ({latestEnrichment.missing_fields?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="validation" className="rounded-xl data-[state=active]:clay-morphism data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg">
                Validations
              </TabsTrigger>
              <TabsTrigger value="products" className="rounded-xl data-[state=active]:clay-morphism data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg">
                Opportunities
              </TabsTrigger>
              <TabsTrigger value="insights" className="rounded-xl data-[state=active]:clay-morphism data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg">
                Insights
              </TabsTrigger>
            </TabsList>

            <TabsContent value="missing" className="space-y-3">
              {latestEnrichment.missing_fields?.map((field, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className="clay-morphism border-0">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium text-slate-800 dark:text-white">
                                {field.field_name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </p>
                              <Badge className={getImportanceColor(field.importance)}>
                                {field.importance}
                              </Badge>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400">{field.reason}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
              {(!latestEnrichment.missing_fields || latestEnrichment.missing_fields.length === 0) && (
                <Card className="clay-morphism border-0">
                  <CardContent className="py-12 text-center">
                    <CheckCircle className="w-12 h-12 mx-auto text-green-600 mb-3" />
                    <p className="text-slate-600 dark:text-slate-400">All required fields complete!</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="validation" className="space-y-3">
              {latestEnrichment.data_validations?.map((validation, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className={`clay-morphism border-0 ${
                    validation.validation_status === 'invalid' ? 'border-l-4 border-l-red-500' : ''
                  }`}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="font-medium text-slate-800 dark:text-white">
                              {validation.field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </p>
                            <Badge variant="outline" className={
                              validation.validation_status === 'valid' ? 'bg-green-100 text-green-700' :
                              validation.validation_status === 'invalid' ? 'bg-red-100 text-red-700' :
                              'bg-amber-100 text-amber-700'
                            }>
                              {validation.validation_status}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {validation.confidence}% confident
                            </Badge>
                          </div>
                          <div className="space-y-1 text-sm">
                            <p className="text-slate-600 dark:text-slate-400">
                              Current: <span className="font-mono">{validation.current_value}</span>
                            </p>
                            {validation.suggested_correction && (
                              <p className="text-green-600 dark:text-green-400">
                                Suggested: <span className="font-mono">{validation.suggested_correction}</span>
                              </p>
                            )}
                          </div>
                        </div>
                        {validation.suggested_correction && validation.validation_status === 'invalid' && (
                          <Button
                            size="sm"
                            onClick={() => applyCorrectioMutation.mutate({
                              field: validation.field,
                              newValue: validation.suggested_correction
                            })}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Apply
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </TabsContent>

            <TabsContent value="products" className="space-y-4">
              {latestEnrichment.recommended_products?.sort((a, b) => b.fit_score - a.fit_score).map((product, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  whileHover={{ y: -4 }}
                >
                  <Card className="clay-morphism border-0 border-l-4 border-l-purple-500">
                    <CardContent className="pt-5">
                      <div className="space-y-4">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                                {product.product_name}
                              </h3>
                              <Badge className={`font-semibold ${
                                product.fit_score >= 80 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                product.fit_score >= 60 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                              }`}>
                                {product.fit_score}% Match
                              </Badge>
                            </div>
                            <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                              {product.product_category || product.product_type}
                            </Badge>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Est. Premium</p>
                            <p className="text-lg font-bold text-slate-900 dark:text-white">
                              {product.estimated_premium_min && product.estimated_premium_max ? (
                                `$${product.estimated_premium_min}-${product.estimated_premium_max}`
                              ) : (
                                `$${product.estimated_premium}`
                              )}
                              <span className="text-xs text-slate-500">/mo</span>
                            </p>
                          </div>
                        </div>

                        {/* Urgency Badge */}
                        {product.urgency && (
                          <div className="flex gap-2">
                            {product.urgency === 'immediate' && (
                              <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                <Shield className="w-3 h-3 mr-1" />
                                Immediate Need
                              </Badge>
                            )}
                            {product.urgency === 'soon' && (
                              <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                Consider Soon
                              </Badge>
                            )}
                          </div>
                        )}

                        {/* Justification */}
                        <div className="p-3 clay-subtle rounded-xl">
                          <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 mb-1">
                            WHY THIS PRODUCT?
                          </p>
                          <p className="text-sm text-slate-700 dark:text-slate-300">
                            {product.justification || product.reasoning}
                          </p>
                        </div>

                        {/* Key Benefits */}
                        {product.key_benefits && product.key_benefits.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                              KEY BENEFITS:
                            </p>
                            <div className="space-y-1.5">
                              {product.key_benefits.map((benefit, bidx) => (
                                <div key={bidx} className="flex items-start gap-2">
                                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
                                  <span className="text-sm text-slate-700 dark:text-slate-300">{benefit}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Fit Score Progress */}
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs text-slate-500">Fit Score</span>
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                              {product.fit_score}/100
                            </span>
                          </div>
                          <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${product.fit_score}%` }}
                              transition={{ duration: 0.8, delay: idx * 0.1 }}
                              className="h-full bg-gradient-to-r from-purple-500 to-indigo-600"
                            />
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-2">
                          <Button 
                            size="sm" 
                            className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white"
                          >
                            <ThumbsUp className="w-4 h-4 mr-2" />
                            Discuss with Client
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="clay-morphism"
                          >
                            Get Quote
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
              {(!latestEnrichment.recommended_products || latestEnrichment.recommended_products.length === 0) && (
                <Card className="clay-morphism border-0">
                  <CardContent className="py-12 text-center">
                    <TrendingUp className="w-12 h-12 mx-auto text-slate-400 mb-3" />
                    <p className="text-slate-600 dark:text-slate-400">No product recommendations yet</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="insights" className="space-y-4">
              {/* Life Stage */}
              {latestEnrichment.life_stage && (
                <Card className="clay-morphism border-0">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <User className="w-5 h-5 text-blue-600" />
                      <CardTitle className="text-lg">Life Stage Analysis</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="p-4 clay-subtle rounded-xl">
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Current Stage</p>
                      <p className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                        {latestEnrichment.life_stage.stage}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {latestEnrichment.life_stage.confidence}% confidence
                      </Badge>
                    </div>
                    {latestEnrichment.life_stage.indicators && latestEnrichment.life_stage.indicators.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                          Key Indicators:
                        </p>
                        <div className="space-y-1">
                          {latestEnrichment.life_stage.indicators.map((indicator, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-sm">
                              <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                              <span className="text-slate-700 dark:text-slate-300">{indicator}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Demographic Insights */}
              {latestEnrichment.demographic_insights && (
                <Card className="clay-morphism border-0">
                  <CardHeader>
                    <CardTitle className="text-lg">Demographic Profile</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {Object.entries(latestEnrichment.demographic_insights).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center">
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:
                        </span>
                        <span className="text-sm font-medium text-slate-800 dark:text-white">
                          {Array.isArray(value) ? value.join(', ') : value}
                        </span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Suggested Actions */}
              {latestEnrichment.suggested_actions?.length > 0 && (
                <Card className="clay-morphism border-0">
                  <CardHeader>
                    <CardTitle className="text-lg">Recommended Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {latestEnrichment.suggested_actions.map((action, idx) => (
                      <div key={idx} className="p-3 clay-subtle rounded-lg">
                        <div className="flex items-start gap-2">
                          <Badge className={
                            action.priority === 'high' ? 'bg-red-100 text-red-700' :
                            action.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                            'bg-blue-100 text-blue-700'
                          }>
                            {action.priority}
                          </Badge>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-slate-800 dark:text-white mb-1">
                              {action.description}
                            </p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">
                              Expected: {action.expected_outcome}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </>
      ) : (
        <Card className="clay-morphism border-0">
          <CardContent className="py-16 text-center">
            <Sparkles className="w-16 h-16 mx-auto text-purple-600 mb-4" />
            <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">
              Enrich This Profile
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
              Use AI to validate data, identify missing information, and discover product opportunities
            </p>
            <Button
              onClick={handleEnrich}
              className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white shadow-xl"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Start Enrichment
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}