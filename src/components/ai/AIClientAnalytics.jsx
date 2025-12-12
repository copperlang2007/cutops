import { useState } from 'react'
import { base44 } from '@/api/base44Client'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  TrendingUp, TrendingDown, Users, Loader2, Sparkles,
  DollarSign, RefreshCw, Target, ArrowUpRight, Send,
  AlertTriangle, Star, Clock, Mail
} from 'lucide-react';
import { differenceInDays } from 'date-fns'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

export default function AIClientAnalytics({ 
  clients, 
  interactions,
  agent,
  onSendEmail,
  onCreateTask,
  onSaveDraft
}) {
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [generatedEmail, setGeneratedEmail] = useState(null);
  const [isGeneratingEmail, setIsGeneratingEmail] = useState(false);

  const analyzeClients = async () => {
    setIsAnalyzing(true);
    try {
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
          email: client.email,
          status: client.status,
          satisfaction: client.satisfaction_score,
          carrier: client.carrier,
          plan_type: client.plan_type,
          premium: client.premium,
          daysSinceContact,
          daysToRenewal,
          interactionCount: clientInteractions.length,
          lastSentiment: clientInteractions[0]?.sentiment,
          negativeInteractions: clientInteractions.filter(i => i.sentiment === 'negative').length
        };
      });

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this client portfolio for an insurance agent and provide comprehensive insights:

CLIENT DATA:
${clientData.map(c => `
- ${c.name} (${c.status})
  Premium: $${c.premium || 0}/mo
  Satisfaction: ${c.satisfaction || 'N/A'}/10
  Days since contact: ${c.daysSinceContact}
  Days to renewal: ${c.daysToRenewal || 'N/A'}
  Interactions: ${c.interactionCount}
  Carrier: ${c.carrier || 'None'}
`).join('\n')}

Provide:
1. Portfolio health score (0-100)
2. Churn risk clients with reasons
3. Upsell opportunities with potential revenue
4. Clients needing immediate outreach
5. Personalized email recommendations for each category
6. Overall portfolio insights and recommendations`,
        response_json_schema: {
          type: "object",
          properties: {
            portfolio_score: { type: "number" },
            portfolio_health: { type: "string" },
            churn_risk: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  client_name: { type: "string" },
                  client_id: { type: "string" },
                  risk_score: { type: "number" },
                  reasons: { type: "array", items: { type: "string" } },
                  recommended_action: { type: "string" }
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
                  recommended_plan: { type: "string" },
                  potential_increase: { type: "number" },
                  approach: { type: "string" }
                }
              }
            },
            immediate_outreach: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  client_name: { type: "string" },
                  client_id: { type: "string" },
                  reason: { type: "string" },
                  urgency: { type: "string" }
                }
              }
            },
            insights: { type: "array", items: { type: "string" } },
            summary: { type: "string" }
          }
        }
      });

      // Map client IDs
      result.churn_risk = result.churn_risk?.map(c => ({
        ...c,
        client_id: clientData.find(cd => cd.name === c.client_name)?.id
      })) || [];
      
      result.upsell_opportunities = result.upsell_opportunities?.map(c => ({
        ...c,
        client_id: clientData.find(cd => cd.name === c.client_name)?.id
      })) || [];

      result.immediate_outreach = result.immediate_outreach?.map(c => ({
        ...c,
        client_id: clientData.find(cd => cd.name === c.client_name)?.id
      })) || [];

      setAnalysis(result);
      toast.success('Analysis complete');
    } catch (err) {
      console.error('Analysis failed:', err);
      toast.error('Failed to analyze clients');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateEmail = async (client, purpose) => {
    const clientData = clients.find(c => c.id === client.client_id);
    if (!clientData) return;

    setIsGeneratingEmail(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Write a personalized ${purpose} email for this client:

CLIENT: ${clientData.first_name} ${clientData.last_name}
EMAIL: ${clientData.email}
STATUS: ${clientData.status}
CURRENT PLAN: ${clientData.current_plan || 'Unknown'}
CARRIER: ${clientData.carrier || 'Unknown'}
SATISFACTION: ${clientData.satisfaction_score || 'Unknown'}/10

PURPOSE: ${purpose === 'churn' ? 'Retention - they are at risk of leaving' : 
          purpose === 'upsell' ? `Upsell - recommend ${client.recommended_plan}` :
          'Follow-up - they need immediate attention'}

${purpose === 'upsell' ? `RECOMMENDED UPGRADE: ${client.recommended_plan}
APPROACH: ${client.approach}` : ''}

AGENT: ${agent?.first_name} ${agent?.last_name}

Write a warm, professional email that:
1. References their specific situation
2. Provides clear value
3. Has a soft call-to-action
4. Complies with CMS marketing guidelines`,
        response_json_schema: {
          type: "object",
          properties: {
            subject: { type: "string" },
            body: { type: "string" },
            follow_up_date: { type: "string" }
          }
        }
      });

      setGeneratedEmail({
        ...result,
        client: clientData,
        purpose
      });
    } catch (err) {
      toast.error('Failed to generate email');
    } finally {
      setIsGeneratingEmail(false);
    }
  };

  const sendEmail = async () => {
    if (!generatedEmail) return;
    
    try {
      await onSendEmail(
        generatedEmail.client.email,
        generatedEmail.subject,
        generatedEmail.body
      );
      setGeneratedEmail(null);
    } catch (err) {
      toast.error('Failed to send email');
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            AI Client Analytics
            <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white ml-2">
              <Sparkles className="w-3 h-3 mr-1" />
              Smart
            </Badge>
          </CardTitle>
          <Button
            size="sm"
            onClick={analyzeClients}
            disabled={isAnalyzing || clients.length === 0}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            <span className="ml-1">{isAnalyzing ? 'Analyzing...' : 'Analyze'}</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!analysis && !isAnalyzing && (
          <div className="text-center py-8 text-slate-400">
            <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Analyze your clients to get AI-powered insights</p>
          </div>
        )}

        {analysis && (
          <div className="space-y-4">
            {/* Portfolio Score */}
            <div className="p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm text-slate-500">Portfolio Health</p>
                  <p className={`text-3xl font-bold ${getScoreColor(analysis.portfolio_score)}`}>
                    {analysis.portfolio_score}%
                  </p>
                </div>
                <Badge className={
                  analysis.portfolio_health === 'Excellent' ? 'bg-emerald-100 text-emerald-700' :
                  analysis.portfolio_health === 'Good' ? 'bg-blue-100 text-blue-700' :
                  analysis.portfolio_health === 'Fair' ? 'bg-amber-100 text-amber-700' :
                  'bg-red-100 text-red-700'
                }>
                  {analysis.portfolio_health}
                </Badge>
              </div>
              <Progress value={analysis.portfolio_score} className="h-2 [&>div]:bg-gradient-to-r [&>div]:from-blue-500 [&>div]:to-purple-500" />
              <p className="text-sm text-slate-600 mt-2">{analysis.summary}</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-red-50 rounded-lg text-center">
                <AlertTriangle className="w-5 h-5 text-red-500 mx-auto mb-1" />
                <p className="text-xl font-bold text-red-600">{analysis.churn_risk?.length || 0}</p>
                <p className="text-xs text-red-500">At Risk</p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-lg text-center">
                <TrendingUp className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                <p className="text-xl font-bold text-emerald-600">{analysis.upsell_opportunities?.length || 0}</p>
                <p className="text-xs text-emerald-500">Upsell</p>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg text-center">
                <Clock className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                <p className="text-xl font-bold text-amber-600">{analysis.immediate_outreach?.length || 0}</p>
                <p className="text-xs text-amber-500">Urgent</p>
              </div>
            </div>

            <Tabs defaultValue="churn">
              <TabsList className="grid grid-cols-4 mb-3">
                <TabsTrigger value="churn" className="text-xs">Risk</TabsTrigger>
                <TabsTrigger value="upsell" className="text-xs">Upsell</TabsTrigger>
                <TabsTrigger value="outreach" className="text-xs">Outreach</TabsTrigger>
                <TabsTrigger value="insights" className="text-xs">Insights</TabsTrigger>
              </TabsList>

              <TabsContent value="churn" className="space-y-2 max-h-[250px] overflow-y-auto">
                {analysis.churn_risk?.map((client, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="p-3 bg-red-50 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="text-xs bg-red-200">
                            {client.client_name?.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium text-red-800">{client.client_name}</p>
                          <Badge variant="outline" className="text-xs bg-red-100 text-red-700">
                            {client.risk_score}% risk
                          </Badge>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7"
                        onClick={() => generateEmail(client, 'churn')}
                        disabled={isGeneratingEmail}
                      >
                        <Mail className="w-3 h-3" />
                      </Button>
                    </div>
                    <p className="text-xs text-red-600">{client.recommended_action}</p>
                  </motion.div>
                ))}
              </TabsContent>

              <TabsContent value="upsell" className="space-y-2 max-h-[250px] overflow-y-auto">
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
                          <p className="text-sm font-medium text-emerald-800">{client.client_name}</p>
                          <div className="flex items-center gap-1">
                            <ArrowUpRight className="w-3 h-3 text-emerald-600" />
                            <span className="text-xs text-emerald-600">{client.recommended_plan}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-emerald-600">+${client.potential_increase}</p>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 text-xs"
                          onClick={() => generateEmail(client, 'upsell')}
                          disabled={isGeneratingEmail}
                        >
                          <Mail className="w-3 h-3 mr-1" />
                          Email
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-emerald-700">{client.approach}</p>
                  </motion.div>
                ))}
              </TabsContent>

              <TabsContent value="outreach" className="space-y-2 max-h-[250px] overflow-y-auto">
                {analysis.immediate_outreach?.map((client, idx) => (
                  <div key={idx} className="p-3 bg-amber-50 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-amber-800">{client.client_name}</p>
                      <p className="text-xs text-amber-600">{client.reason}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={
                        client.urgency === 'high' ? 'bg-red-100 text-red-700' :
                        'bg-amber-100 text-amber-700'
                      }>{client.urgency}</Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7"
                        onClick={() => generateEmail(client, 'outreach')}
                        disabled={isGeneratingEmail}
                      >
                        <Mail className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="insights" className="space-y-2">
                {analysis.insights?.map((insight, idx) => (
                  <div key={idx} className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">💡 {insight}</p>
                  </div>
                ))}
              </TabsContent>
            </Tabs>

            {/* Generated Email Preview */}
            {generatedEmail && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-slate-50 rounded-lg border mt-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium">
                    Email for {generatedEmail.client.first_name} {generatedEmail.client.last_name}
                  </p>
                  <Button size="sm" variant="ghost" onClick={() => setGeneratedEmail(null)}>×</Button>
                </div>
                <div className="space-y-2 text-sm">
                  <p><strong>To:</strong> {generatedEmail.client.email}</p>
                  <p><strong>Subject:</strong> {generatedEmail.subject}</p>
                  <div className="p-3 bg-white rounded border max-h-40 overflow-y-auto">
                    <p className="whitespace-pre-wrap text-sm">{generatedEmail.body}</p>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={sendEmail}>
                      <Send className="w-3 h-3 mr-1" />
                      Send Email
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        onSaveDraft?.({
                          agent_id: agent?.id,
                          client_id: generatedEmail.client.id,
                          email_type: generatedEmail.purpose,
                          recipient_email: generatedEmail.client.email,
                          recipient_name: `${generatedEmail.client.first_name} ${generatedEmail.client.last_name}`,
                          subject: generatedEmail.subject,
                          body: generatedEmail.body,
                          ai_generated: true
                        });
                        toast.success('Draft saved');
                        setGeneratedEmail(null);
                      }}
                    >
                      Save Draft
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}