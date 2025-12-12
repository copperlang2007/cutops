import { useState } from 'react'
import { base44 } from '@/api/base44Client'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  AlertTriangle, TrendingUp, TrendingDown, Users, Loader2, 
  Mail, Phone, Sparkles, DollarSign, RefreshCw, Target,
  ArrowUpRight, Clock, Star, Send
} from 'lucide-react';
import { differenceInDays } from 'date-fns'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

export default function ClientChurnAnalysis({ 
  clients, 
  interactions,
  agent,
  onSendEmail,
  onCreateTask
}) {
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [draftedEmail, setDraftedEmail] = useState(null);
  const [isDraftingEmail, setIsDraftingEmail] = useState(false);

  const analyzeClients = async () => {
    setIsAnalyzing(true);
    try {
      // Prepare client data with interaction history
      const clientData = clients.map(client => {
        const clientInteractions = interactions?.filter(i => i.client_id === client.id) || [];
        const daysSinceContact = client.last_contact_date 
          ? differenceInDays(new Date(), new Date(client.last_contact_date))
          : 999;
        const daysToRenewal = client.renewal_date
          ? differenceInDays(new Date(client.renewal_date), new Date())
          : null;

        return {
          id: client.id,
          name: `${client.first_name} ${client.last_name}`,
          status: client.status,
          satisfaction: client.satisfaction_score,
          carrier: client.carrier,
          plan_type: client.plan_type,
          premium: client.premium,
          daysSinceContact,
          daysToRenewal,
          interactionCount: clientInteractions.length,
          lastInteractionSentiment: clientInteractions[0]?.sentiment,
          negativeInteractions: clientInteractions.filter(i => i.sentiment === 'negative').length,
          missedFollowups: client.next_follow_up && differenceInDays(new Date(), new Date(client.next_follow_up)) > 0
        };
      });

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this client portfolio for churn risk, upsell opportunities, and engagement strategies:

CLIENT DATA:
${clientData.map(c => `
- ${c.name} (${c.status})
  Satisfaction: ${c.satisfaction || 'N/A'}/10
  Days since contact: ${c.daysSinceContact}
  Days to renewal: ${c.daysToRenewal || 'N/A'}
  Interactions: ${c.interactionCount}
  Negative interactions: ${c.negativeInteractions}
  Last sentiment: ${c.lastInteractionSentiment || 'N/A'}
  Premium: $${c.premium || 0}
  Carrier: ${c.carrier || 'None'}
  Missed follow-ups: ${c.missedFollowups ? 'Yes' : 'No'}
`).join('\n')}

Analyze and provide:
1. Churn risk assessment for each at-risk client
2. Upsell/cross-sell opportunities
3. Clients needing immediate attention
4. Recommended outreach strategies
5. Market trend-based recommendations`,
        response_json_schema: {
          type: "object",
          properties: {
            churn_risk: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  client_name: { type: "string" },
                  client_id: { type: "string" },
                  risk_score: { type: "number" },
                  risk_factors: { type: "array", items: { type: "string" } },
                  retention_strategy: { type: "string" },
                  urgency: { type: "string" }
                }
              }
            },
            upsell_opportunities: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  client_name: { type: "string" },
                  client_id: { type: "string" },
                  current_plan: { type: "string" },
                  recommended_upgrade: { type: "string" },
                  potential_value: { type: "number" },
                  reasoning: { type: "string" },
                  approach: { type: "string" }
                }
              }
            },
            immediate_attention: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  client_name: { type: "string" },
                  client_id: { type: "string" },
                  reason: { type: "string" },
                  action_required: { type: "string" }
                }
              }
            },
            outreach_strategies: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  segment: { type: "string" },
                  clients_count: { type: "number" },
                  strategy: { type: "string" },
                  message_template: { type: "string" }
                }
              }
            },
            market_insights: {
              type: "array",
              items: { type: "string" }
            },
            summary: {
              type: "object",
              properties: {
                total_at_risk: { type: "number" },
                total_upsell_value: { type: "number" },
                immediate_actions: { type: "number" }
              }
            }
          }
        }
      });

      // Map client IDs from names
      result.churn_risk = result.churn_risk?.map(c => ({
        ...c,
        client_id: clientData.find(cd => cd.name === c.client_name)?.id
      })) || [];
      
      result.upsell_opportunities = result.upsell_opportunities?.map(c => ({
        ...c,
        client_id: clientData.find(cd => cd.name === c.client_name)?.id
      })) || [];

      result.immediate_attention = result.immediate_attention?.map(c => ({
        ...c,
        client_id: clientData.find(cd => cd.name === c.client_name)?.id
      })) || [];

      setAnalysis(result);
      toast.success('Client analysis completed');
    } catch (err) {
      console.error('Analysis failed:', err);
      toast.error('Failed to analyze clients');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const draftOutreachEmail = async (client, purpose) => {
    const clientData = clients.find(c => c.id === client.client_id);
    if (!clientData) return;

    setSelectedClient(client);
    setIsDraftingEmail(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Draft a personalized outreach email for this client:

CLIENT: ${clientData.first_name} ${clientData.last_name}
PURPOSE: ${purpose}
CURRENT PLAN: ${clientData.current_plan || 'Unknown'}
CARRIER: ${clientData.carrier || 'Unknown'}
SATISFACTION: ${clientData.satisfaction_score || 'Unknown'}/10
LAST CONTACT: ${clientData.last_contact_date || 'Unknown'}

${purpose === 'retention' ? `RISK FACTORS: ${client.risk_factors?.join(', ')}
RETENTION STRATEGY: ${client.retention_strategy}` : ''}

${purpose === 'upsell' ? `RECOMMENDED UPGRADE: ${client.recommended_upgrade}
REASONING: ${client.reasoning}
APPROACH: ${client.approach}` : ''}

AGENT: ${agent.first_name} ${agent.last_name}

Create a warm, personalized email that:
1. References their specific situation
2. Provides value first
3. Has a clear but soft call-to-action
4. Maintains compliance with insurance regulations`,
        response_json_schema: {
          type: "object",
          properties: {
            subject: { type: "string" },
            body: { type: "string" },
            follow_up_suggestion: { type: "string" },
            call_to_action: { type: "string" }
          }
        }
      });

      setDraftedEmail({
        ...result,
        client: clientData,
        purpose
      });
    } catch (err) {
      toast.error('Failed to draft email');
    } finally {
      setIsDraftingEmail(false);
    }
  };

  const getRiskColor = (score) => {
    if (score >= 70) return 'text-red-600 bg-red-100';
    if (score >= 40) return 'text-amber-600 bg-amber-100';
    return 'text-emerald-600 bg-emerald-100';
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-600" />
            AI Client Intelligence
            <Badge className="bg-gradient-to-r from-teal-500 to-blue-500 text-white ml-2">
              <Sparkles className="w-3 h-3 mr-1" />
              Predictive
            </Badge>
          </CardTitle>
          <Button
            size="sm"
            onClick={analyzeClients}
            disabled={isAnalyzing || clients.length === 0}
            className="bg-teal-600 hover:bg-teal-700"
          >
            {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            <span className="ml-1">{isAnalyzing ? 'Analyzing...' : 'Analyze Clients'}</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!analysis && !isAnalyzing && (
          <div className="text-center py-8 text-slate-400">
            <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Analyze your client portfolio to identify risks and opportunities</p>
          </div>
        )}

        {analysis && (
          <div className="space-y-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-red-50 rounded-lg text-center">
                <AlertTriangle className="w-5 h-5 text-red-500 mx-auto mb-1" />
                <p className="text-2xl font-bold text-red-600">{analysis.summary?.total_at_risk || 0}</p>
                <p className="text-xs text-red-500">At Risk</p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-lg text-center">
                <TrendingUp className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                <p className="text-2xl font-bold text-emerald-600">
                  ${(analysis.summary?.total_upsell_value || 0).toLocaleString()}
                </p>
                <p className="text-xs text-emerald-500">Upsell Value</p>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg text-center">
                <Clock className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                <p className="text-2xl font-bold text-amber-600">{analysis.summary?.immediate_actions || 0}</p>
                <p className="text-xs text-amber-500">Urgent</p>
              </div>
            </div>

            <Tabs defaultValue="churn">
              <TabsList className="grid grid-cols-4 mb-4">
                <TabsTrigger value="churn" className="text-xs">Churn Risk</TabsTrigger>
                <TabsTrigger value="upsell" className="text-xs">Upsell</TabsTrigger>
                <TabsTrigger value="urgent" className="text-xs">Urgent</TabsTrigger>
                <TabsTrigger value="strategies" className="text-xs">Strategies</TabsTrigger>
              </TabsList>

              <TabsContent value="churn" className="space-y-2 max-h-[300px] overflow-y-auto">
                {analysis.churn_risk?.map((client, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="p-3 bg-slate-50 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="text-xs bg-slate-200">
                            {client.client_name?.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{client.client_name}</p>
                          <Badge variant="outline" className={getRiskColor(client.risk_score)}>
                            {client.risk_score}% risk
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7"
                          onClick={() => draftOutreachEmail(client, 'retention')}
                          disabled={isDraftingEmail}
                        >
                          <Mail className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-xs text-slate-500 space-y-1">
                      <p><strong>Risk factors:</strong> {client.risk_factors?.join(', ')}</p>
                      <p><strong>Strategy:</strong> {client.retention_strategy}</p>
                    </div>
                  </motion.div>
                ))}
              </TabsContent>

              <TabsContent value="upsell" className="space-y-2 max-h-[300px] overflow-y-auto">
                {analysis.upsell_opportunities?.map((client, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="p-3 bg-emerald-50 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="text-xs bg-emerald-200">
                            {client.client_name?.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{client.client_name}</p>
                          <div className="flex items-center gap-1">
                            <ArrowUpRight className="w-3 h-3 text-emerald-600" />
                            <span className="text-xs text-emerald-600">{client.recommended_upgrade}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-emerald-600">
                          +${client.potential_value?.toLocaleString()}
                        </p>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 text-xs"
                          onClick={() => draftOutreachEmail(client, 'upsell')}
                          disabled={isDraftingEmail}
                        >
                          <Mail className="w-3 h-3 mr-1" />
                          Draft Email
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-emerald-700">{client.reasoning}</p>
                  </motion.div>
                ))}
              </TabsContent>

              <TabsContent value="urgent" className="space-y-2">
                {analysis.immediate_attention?.map((client, idx) => (
                  <div key={idx} className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-amber-800">{client.client_name}</p>
                        <p className="text-xs text-amber-600">{client.reason}</p>
                      </div>
                      <Badge variant="outline" className="bg-amber-100 text-amber-700">Action Required</Badge>
                    </div>
                    <p className="text-xs text-amber-700 mt-2">
                      <strong>Action:</strong> {client.action_required}
                    </p>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="strategies" className="space-y-3">
                {analysis.outreach_strategies?.map((strategy, idx) => (
                  <div key={idx} className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-blue-800">{strategy.segment}</p>
                      <Badge variant="outline">{strategy.clients_count} clients</Badge>
                    </div>
                    <p className="text-xs text-blue-600 mb-2">{strategy.strategy}</p>
                    <div className="p-2 bg-white rounded text-xs text-slate-600 italic">
                      "{strategy.message_template}"
                    </div>
                  </div>
                ))}

                {analysis.market_insights?.length > 0 && (
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <p className="text-sm font-medium text-purple-800 mb-2">
                      <Target className="w-4 h-4 inline mr-1" />
                      Market Insights
                    </p>
                    <ul className="text-xs text-purple-600 space-y-1">
                      {analysis.market_insights.map((insight, i) => (
                        <li key={i}>• {insight}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {/* Drafted Email Preview */}
            {draftedEmail && (
              <div className="p-4 bg-slate-50 rounded-lg border mt-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium">
                    Email Draft for {draftedEmail.client.first_name} {draftedEmail.client.last_name}
                  </p>
                  <Button size="sm" variant="ghost" onClick={() => setDraftedEmail(null)}>×</Button>
                </div>
                <div className="space-y-2 text-sm">
                  <p><strong>Subject:</strong> {draftedEmail.subject}</p>
                  <div className="p-3 bg-white rounded border">
                    <p className="whitespace-pre-wrap">{draftedEmail.body}</p>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      className="bg-teal-600 hover:bg-teal-700"
                      onClick={() => {
                        onSendEmail?.(draftedEmail);
                        setDraftedEmail(null);
                        toast.success('Email sent');
                      }}
                    >
                      <Send className="w-3 h-3 mr-1" />
                      Send Email
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setDraftedEmail(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}