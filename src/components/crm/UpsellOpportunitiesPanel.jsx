import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Sparkles, TrendingUp, Target, DollarSign, MessageSquare, 
  Loader2, Copy, Mail, Phone, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function UpsellOpportunitiesPanel({ agentId }) {
  const [opportunities, setOpportunities] = useState([]);
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);

  const analyzeOpportunitiesMutation = useMutation({
    mutationFn: () => base44.functions.invoke('aiUpsellAnalysis', { agentId }),
    onSuccess: (response) => {
      setOpportunities(response.data.opportunities);
      toast.success('Opportunities identified', {
        description: `Found ${response.data.total_opportunities} opportunities`
      });
    },
    onError: (error) => {
      toast.error('Analysis failed', {
        description: error.message
      });
    }
  });

  const getPriorityColor = (priority) => {
    const colors = {
      urgent: 'bg-red-100 text-red-700 border-red-200',
      high: 'bg-orange-100 text-orange-700 border-orange-200',
      medium: 'bg-amber-100 text-amber-700 border-amber-200',
      low: 'bg-slate-100 text-slate-600 border-slate-200'
    };
    return colors[priority] || colors.medium;
  };

  const getValueColor = (value) => {
    const colors = {
      high: 'bg-emerald-100 text-emerald-700',
      medium: 'bg-teal-100 text-teal-700',
      low: 'bg-slate-100 text-slate-600'
    };
    return colors[value] || colors.medium;
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-600';
    if (score >= 60) return 'text-teal-600';
    if (score >= 40) return 'text-amber-600';
    return 'text-slate-600';
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="clay-morphism border-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">Upsell & Cross-Sell Opportunities</CardTitle>
                <p className="text-sm text-slate-500 mt-1">
                  AI-powered revenue optimization insights
                </p>
              </div>
            </div>
            <Button
              onClick={() => analyzeOpportunitiesMutation.mutate()}
              disabled={analyzeOpportunitiesMutation.isPending}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {analyzeOpportunitiesMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Analyze Opportunities
                </>
              )}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Summary Stats */}
      {opportunities.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="clay-subtle border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Total Opportunities</p>
                  <p className="text-2xl font-bold text-purple-600">{opportunities.length}</p>
                </div>
                <Target className="w-8 h-8 text-purple-600/30" />
              </div>
            </CardContent>
          </Card>

          <Card className="clay-subtle border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 mb-1">High Priority</p>
                  <p className="text-2xl font-bold text-red-600">
                    {opportunities.filter(o => o.priority === 'urgent' || o.priority === 'high').length}
                  </p>
                </div>
                <AlertCircle className="w-8 h-8 text-red-600/30" />
              </div>
            </CardContent>
          </Card>

          <Card className="clay-subtle border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 mb-1">High Value</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    {opportunities.filter(o => o.value_potential === 'high').length}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-emerald-600/30" />
              </div>
            </CardContent>
          </Card>

          <Card className="clay-subtle border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Avg Fit Score</p>
                  <p className="text-2xl font-bold text-teal-600">
                    {Math.round(opportunities.reduce((sum, o) => sum + o.fit_score, 0) / opportunities.length)}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-teal-600/30" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Opportunities List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {opportunities.map((opp, idx) => (
          <Card 
            key={idx} 
            className="clay-morphism border-0 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setSelectedOpportunity(opp)}
          >
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-slate-800">{opp.client_name}</h3>
                  <p className="text-xs text-slate-500">{opp.client_email}</p>
                </div>
                <Badge className={getPriorityColor(opp.priority)}>
                  {opp.priority}
                </Badge>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Opportunity</p>
                  <Badge className="bg-purple-100 text-purple-700">
                    {opp.opportunity_type}
                  </Badge>
                </div>

                <div>
                  <p className="text-xs text-slate-500 mb-1">Recommended Product</p>
                  <p className="font-medium text-sm">{opp.recommended_product}</p>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500">Fit Score</p>
                    <p className={`text-xl font-bold ${getScoreColor(opp.fit_score)}`}>
                      {opp.fit_score}/100
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Value</p>
                    <Badge className={getValueColor(opp.value_potential)}>
                      {opp.value_potential}
                    </Badge>
                  </div>
                </div>

                <div className="pt-3 border-t">
                  <p className="text-xs text-slate-600 line-clamp-2">{opp.reasoning}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Opportunity Detail Modal */}
      {selectedOpportunity && (
        <Dialog open={!!selectedOpportunity} onOpenChange={() => setSelectedOpportunity(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-purple-600" />
                {selectedOpportunity.client_name}
              </DialogTitle>
            </DialogHeader>

            <Tabs defaultValue="outreach" className="mt-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="outreach">Outreach</TabsTrigger>
                <TabsTrigger value="talking">Talking Points</TabsTrigger>
                <TabsTrigger value="objections">Objections</TabsTrigger>
              </TabsList>

              <TabsContent value="outreach" className="space-y-4">
                <div className="flex items-center gap-3">
                  <Badge className={getPriorityColor(selectedOpportunity.priority)}>
                    {selectedOpportunity.priority} Priority
                  </Badge>
                  <Badge className={getValueColor(selectedOpportunity.value_potential)}>
                    {selectedOpportunity.value_potential} Value
                  </Badge>
                  <Badge className="bg-teal-100 text-teal-700">
                    Fit: {selectedOpportunity.fit_score}/100
                  </Badge>
                </div>

                <Card className="border">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Recommended Product</h4>
                      <Badge className="bg-purple-100 text-purple-700">
                        {selectedOpportunity.opportunity_type}
                      </Badge>
                    </div>
                    <p className="text-lg font-semibold text-purple-600">
                      {selectedOpportunity.recommended_product}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border">
                  <CardContent className="pt-4">
                    <h4 className="font-medium mb-2">Why This Recommendation</h4>
                    <p className="text-sm text-slate-600">{selectedOpportunity.reasoning}</p>
                  </CardContent>
                </Card>

                <Card className="border bg-teal-50">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-teal-600" />
                        Personalized Outreach Message
                      </h4>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(selectedOpportunity.outreach_message)}
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        Copy
                      </Button>
                    </div>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">
                      {selectedOpportunity.outreach_message}
                    </p>
                  </CardContent>
                </Card>

                <div className="flex gap-2">
                  <Button className="flex-1 bg-teal-600 hover:bg-teal-700">
                    <Mail className="w-4 h-4 mr-2" />
                    Send Email
                  </Button>
                  <Button className="flex-1 bg-blue-600 hover:bg-blue-700">
                    <Phone className="w-4 h-4 mr-2" />
                    Call Client
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="talking" className="space-y-3">
                <h4 className="font-medium text-slate-800">Key Talking Points</h4>
                {selectedOpportunity.talking_points?.map((point, idx) => (
                  <Card key={idx} className="border">
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
                          <span className="text-xs font-semibold text-teal-600">{idx + 1}</span>
                        </div>
                        <p className="text-sm text-slate-700">{point}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="objections" className="space-y-3">
                <h4 className="font-medium text-slate-800">Anticipated Objections & Responses</h4>
                {selectedOpportunity.objections?.map((obj, idx) => (
                  <Card key={idx} className="border">
                    <CardContent className="pt-4">
                      <div className="mb-3">
                        <Badge className="bg-red-100 text-red-700 mb-2">Objection</Badge>
                        <p className="text-sm font-medium text-slate-800">{obj.objection}</p>
                      </div>
                      <div>
                        <Badge className="bg-emerald-100 text-emerald-700 mb-2">Response</Badge>
                        <p className="text-sm text-slate-700">{obj.response}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}