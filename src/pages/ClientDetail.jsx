import { useState } from 'react'
import { base44 } from '@/api/base44Client'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams, Link } from 'react-router-dom'
import { createPageUrl } from '@/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
        ArrowLeft, Phone, Mail, MapPin, Calendar, FileText, 
        MessageSquare, CheckSquare, TrendingUp, Edit, User, Sparkles, Activity, FileSearch, Rocket, Star
      } from 'lucide-react';
import { format } from 'date-fns'
import ClientInteractionList from '../components/clients/ClientInteractionList';
import ClientInteractionModal from '../components/clients/ClientInteractionModal';
import ClientTaskList from '../components/clients/ClientTaskList';
import ClientFormModal from '../components/clients/ClientFormModal';
import ClientInsightsPanel from '../components/ai/ClientInsightsPanel';
import ClientCommunicationHub from '../components/communication/ClientCommunicationHub';
import AIClientCallAssistant from '../components/ai/AIClientCallAssistant';
import AIKnowledgeAssist from '../components/ai/AIKnowledgeAssist';
import SentimentComplianceIntegration from '../components/compliance/SentimentComplianceIntegration';
import InteractionSummaryPanel from '../components/ai/InteractionSummaryPanel';
import ProactiveRiskMonitor from '../components/risk/ProactiveRiskMonitor';
import ClientHealthDashboard from '../components/health/ClientHealthDashboard';
import ClientEnrichmentPanel from '../components/clients/ClientEnrichmentPanel';
import PolicyReviewPanel from '../components/policy/PolicyReviewPanel';
import AIPolicyAnalyzer from '../components/policy/AIPolicyAnalyzer';
import PolicyGapAnalysis from '../components/policy/PolicyGapAnalysis';
import AIRenewalManager from '../components/renewals/AIRenewalManager';
import ClientRelationshipHealthPanel from '../components/ai/ClientRelationshipHealthPanel';
import AIOnboardingPlanPanel from '../components/onboarding/AIOnboardingPlanPanel';
import AIEmailDraftingTool from '../components/communication/AIEmailDraftingTool';
import ProactiveMessageGenerator from '../components/communication/ProactiveMessageGenerator';
import AgentPolicyRecommendationPanel from '../components/policy/AgentPolicyRecommendationPanel';
import AIDocumentSearchPanel from '../components/documents/AIDocumentSearchPanel';
import AIDocumentUploadEnhanced from '../components/documents/AIDocumentUploadEnhanced';
import SurveyResultsDashboard from '../components/surveys/SurveyResultsDashboard';

export default function ClientDetail() {
  const [searchParams] = useSearchParams();
  const clientId = searchParams.get('id');
  const queryClient = useQueryClient();
  const [showInteractionModal, setShowInteractionModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const { data: client, isLoading } = useQuery({
    queryKey: ['client', clientId],
    queryFn: async () => {
      const clients = await base44.entities.Client.filter({ id: clientId });
      return clients[0];
    },
    enabled: !!clientId
  });

  const { data: agent } = useQuery({
    queryKey: ['agent', client?.agent_id],
    queryFn: async () => {
      const agents = await base44.entities.Agent.filter({ id: client.agent_id });
      return agents[0];
    },
    enabled: !!client?.agent_id
  });

  const { data: interactions = [] } = useQuery({
    queryKey: ['clientInteractions', clientId],
    queryFn: () => base44.entities.ClientInteraction.filter({ client_id: clientId }, '-interaction_date'),
    enabled: !!clientId
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['clientTasks', clientId],
    queryFn: () => base44.entities.Task.filter({ related_entity_id: clientId }),
    enabled: !!clientId
  });

  const { data: policies = [] } = useQuery({
    queryKey: ['clientPolicies', clientId],
    queryFn: () => base44.entities.Policy.filter({ client_id: clientId }),
    enabled: !!clientId
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-slate-500">Loading client details...</div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-slate-500">Client not found</div>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'prospect': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'inactive': return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-400';
      case 'churned': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const recentInteractions = interactions.slice(0, 3);
  const upcomingTasks = tasks.filter(t => t.status !== 'completed').slice(0, 3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('ClientManagement')}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                {client.first_name} {client.last_name}
              </h1>
              <p className="text-slate-500 dark:text-slate-400">Client ID: {client.id.slice(0, 8)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setShowEditModal(true)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit Client
            </Button>
            <Button onClick={() => setShowInteractionModal(true)} className="bg-teal-600 hover:bg-teal-700">
              <MessageSquare className="w-4 h-4 mr-2" />
              Log Interaction
            </Button>
          </div>
        </div>

        {/* Sentiment Alert */}
        <SentimentComplianceIntegration clientId={clientId} />

        {/* Risk Assessment */}
        {agent && <ProactiveRiskMonitor agentId={agent.id} compact />}

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="border-0 shadow-sm dark:bg-slate-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Status</p>
                  <Badge className={`mt-1 ${getStatusColor(client.status)}`}>
                    {client.status}
                  </Badge>
                </div>
                <User className="w-8 h-8 text-teal-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm dark:bg-slate-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Interactions</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{interactions.length}</p>
                </div>
                <MessageSquare className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm dark:bg-slate-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Open Tasks</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{upcomingTasks.length}</p>
                </div>
                <CheckSquare className="w-8 h-8 text-amber-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm dark:bg-slate-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Policies</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{policies.length}</p>
                </div>
                <FileText className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-3 gap-6">
          {/* Left Column - Contact Info */}
          <Card className="border-0 shadow-lg dark:bg-slate-800">
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {client.email && (
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Email</p>
                    <a href={`mailto:${client.email}`} className="text-sm text-teal-600 hover:underline">
                      {client.email}
                    </a>
                  </div>
                </div>
              )}
              {client.phone && (
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Phone</p>
                    <a href={`tel:${client.phone}`} className="text-sm text-teal-600 hover:underline">
                      {client.phone}
                    </a>
                  </div>
                </div>
              )}
              {(client.address || client.city || client.state) && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Address</p>
                    <p className="text-sm text-slate-900 dark:text-white">
                      {client.address && <>{client.address}<br /></>}
                      {client.city && client.state && `${client.city}, ${client.state} ${client.zip || ''}`}
                    </p>
                  </div>
                </div>
              )}
              {client.date_of_birth && (
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Date of Birth</p>
                    <p className="text-sm text-slate-900 dark:text-white">
                      {format(new Date(client.date_of_birth), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>

            <CardHeader>
              <CardTitle>Policy Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Current Plan</p>
                <p className="text-sm font-medium text-slate-900 dark:text-white">{client.current_plan || 'Not set'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Carrier</p>
                <p className="text-sm font-medium text-slate-900 dark:text-white">{client.carrier || 'Not set'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Plan Type</p>
                <Badge variant="outline">{client.plan_type || 'Not set'}</Badge>
              </div>
              {client.premium && (
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Monthly Premium</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">${client.premium}</p>
                </div>
              )}
            </CardContent>

            <CardHeader>
              <CardTitle>Agent Information</CardTitle>
            </CardHeader>
            <CardContent>
              {agent ? (
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">{agent.first_name} {agent.last_name}</p>
                  <p className="text-sm text-slate-500">{agent.email}</p>
                  <p className="text-sm text-slate-500">{agent.phone}</p>
                </div>
              ) : (
                <p className="text-sm text-slate-500">No agent assigned</p>
              )}
            </CardContent>
          </Card>

          {/* Right Column - Activity */}
          <div className="col-span-2 space-y-6">
            <Tabs defaultValue="interactions" className="space-y-4">
              <TabsList>
                <TabsTrigger value="health">
                  <Activity className="w-4 h-4 mr-2" />
                  Client Health
                </TabsTrigger>
                <TabsTrigger value="enrichment">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Profile Enrichment
                </TabsTrigger>
                <TabsTrigger value="policy-review">
                  <FileSearch className="w-4 h-4 mr-2" />
                  Policy Review
                </TabsTrigger>
                <TabsTrigger value="policy-analysis">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Policy AI
                </TabsTrigger>
                <TabsTrigger value="interactions">Interactions</TabsTrigger>
                <TabsTrigger value="communication">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Communication
                </TabsTrigger>
                <TabsTrigger value="assistant">
                  <Sparkles className="w-4 h-4 mr-2" />
                  AI Assistant
                </TabsTrigger>
                <TabsTrigger value="tasks">Tasks</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
                <TabsTrigger value="insights">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Insights
                </TabsTrigger>
                <TabsTrigger value="relationship-health">
                  <Activity className="w-4 h-4 mr-2" />
                  Relationship Health
                </TabsTrigger>
                <TabsTrigger value="onboarding">
                  <Rocket className="w-4 h-4 mr-2" />
                  AI Onboarding
                </TabsTrigger>
                <TabsTrigger value="ai-recommendations">
                  <Sparkles className="w-4 h-4 mr-2" />
                  AI Recommendations
                </TabsTrigger>
                <TabsTrigger value="documents">
                  <FileText className="w-4 h-4 mr-2" />
                  Documents
                </TabsTrigger>
                <TabsTrigger value="surveys">
                  <Star className="w-4 h-4 mr-2" />
                  Surveys
                </TabsTrigger>
                </TabsList>

              <TabsContent value="enrichment">
                <ClientEnrichmentPanel 
                  clientId={clientId}
                  onUpdate={() => {
                    queryClient.invalidateQueries(['client', clientId]);
                  }}
                />
              </TabsContent>

              <TabsContent value="policy-review">
                <PolicyReviewPanel 
                  clientId={clientId}
                  onUpdate={() => {
                    queryClient.invalidateQueries(['client', clientId]);
                  }}
                />
              </TabsContent>

              <TabsContent value="policy-analysis" className="space-y-6">
                <PolicyGapAnalysis clientId={clientId} />

                {policies.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Individual Policy Analysis</h3>
                    {policies.map(policy => (
                      <div key={policy.id} className="space-y-4">
                        <div className="p-3 clay-subtle rounded-lg">
                          <h4 className="font-medium text-slate-900 dark:text-white mb-1">
                            {policy.policy_type} - {policy.carrier}
                          </h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Policy #{policy.policy_number}
                          </p>
                        </div>
                        <AIPolicyAnalyzer 
                          policy={policy}
                          onAnalysisComplete={() => queryClient.invalidateQueries(['clientPolicies'])}
                        />
                        <AIRenewalManager 
                          policy={policy}
                          clientEmail={client.email}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="interactions">
                <div className="space-y-6">
                  <InteractionSummaryPanel clientId={clientId} />
                  <ClientInteractionList 
                    clientId={clientId} 
                    interactions={interactions}
                    onAddNew={() => setShowInteractionModal(true)}
                  />
                </div>
              </TabsContent>

              <TabsContent value="communication">
                <div className="space-y-6">
                  {agent ? (
                    <>
                      <ClientCommunicationHub 
                        client={client}
                        agentId={agent.id}
                      />
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <AIEmailDraftingTool
                          clientId={clientId}
                          clientEmail={client.email}
                          agentId={agent.id}
                        />
                        <ProactiveMessageGenerator
                          clientId={clientId}
                          clientEmail={client.email}
                        />
                      </div>
                    </>
                  ) : (
                    <Card className="border-0 shadow-lg dark:bg-slate-800">
                      <CardContent className="py-8 text-center text-slate-500">
                        Loading agent information...
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="assistant">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {agent && (
                    <AIClientCallAssistant 
                      clientId={clientId}
                      agentId={agent.id}
                    />
                  )}
                  <AIKnowledgeAssist 
                    context={`Client: ${client.first_name} ${client.last_name}, Plan: ${client.current_plan || 'None'}`}
                  />
                </div>
              </TabsContent>

              <TabsContent value="tasks">
                <ClientTaskList 
                  clientId={clientId}
                  tasks={tasks}
                />
              </TabsContent>

              <TabsContent value="notes">
                <Card className="border-0 shadow-lg dark:bg-slate-800">
                  <CardHeader>
                    <CardTitle>Client Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {client.notes ? (
                      <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{client.notes}</p>
                    ) : (
                      <p className="text-sm text-slate-500">No notes available</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="insights">
                <ClientInsightsPanel 
                  clientId={clientId}
                  clientName={`${client.first_name} ${client.last_name}`}
                  agentId={agent?.id}
                />
              </TabsContent>

              <TabsContent value="health">
                <ClientHealthDashboard 
                  clientId={clientId}
                  agentId={agent?.id}
                />
              </TabsContent>

              <TabsContent value="relationship-health">
                <ClientRelationshipHealthPanel clientId={clientId} />
              </TabsContent>

              <TabsContent value="onboarding-plan">
                <AIOnboardingPlanPanel 
                  clientId={clientId}
                  clientEmail={client.email}
                />
              </TabsContent>

              <TabsContent value="ai-recommendations">
                <AgentPolicyRecommendationPanel clientId={clientId} />
              </TabsContent>

              <TabsContent value="documents">
                <div className="space-y-6">
                  <AIDocumentUploadEnhanced 
                    clientId={clientId}
                    onUploadComplete={() => queryClient.invalidateQueries(['aiDocuments'])}
                  />
                  <AIDocumentSearchPanel clientId={clientId} />
                </div>
              </TabsContent>

              <TabsContent value="surveys">
                <SurveyResultsDashboard agentId={agent?.id} />
              </TabsContent>
              </Tabs>
              </div>
              </div>

        {/* Modals */}
        {showInteractionModal && (
          <ClientInteractionModal
            clientId={clientId}
            open={showInteractionModal}
            onClose={() => setShowInteractionModal(false)}
          />
        )}

        {showEditModal && (
          <ClientFormModal
            client={client}
            open={showEditModal}
            onClose={() => setShowEditModal(false)}
          />
        )}
      </div>
    </div>
  );
}