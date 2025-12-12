import { useState } from 'react'
import { base44 } from '@/api/base44Client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createPageUrl } from '@/utils'
import { Link } from 'react-router-dom'
import { 
  ArrowLeft, User, Mail, Phone, MapPin, Calendar, Hash, 
  Shield, FileCheck, AlertTriangle, Edit, CheckCircle, 
  Clock, RefreshCw, Zap, FileText, FileSignature, Sparkles, Trophy, UserX
} from 'lucide-react';
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import LicenseTable from '../components/licenses/LicenseTable';
import AppointmentTable from '../components/appointments/AppointmentTable';
import AlertsList from '../components/dashboard/AlertsList';
import NIPRSyncModal from '../components/integrations/NIPRSyncModal';
import SunfireSyncModal from '../components/integrations/SunfireSyncModal';
import DocumentList from '../components/documents/DocumentList';
import DocumentUploadModal from '../components/documents/DocumentUploadModal';
import DocumentVerificationModal from '../components/documents/DocumentVerificationModal';
import AIDocumentProcessor from '../components/documents/AIDocumentProcessor';
import AIDocumentSuggestions from '../components/documents/AIDocumentSuggestions';
import ContractList from '../components/contracts/ContractList';
import ContractFormModal from '../components/contracts/ContractFormModal';
import OnboardingChecklist, { DEFAULT_CHECKLIST_ITEMS } from '../components/onboarding/OnboardingChecklist';
import OnboardingProgressBadge from '../components/onboarding/OnboardingProgressBadge';
import { 
  triggerChecklistCompletion, 
  checkChecklistAlerts, 
  resolveChecklistAlerts 
} from '../components/onboarding/checklistAutomation';
import AIEmailDrafter from '../components/communication/AIEmailDrafter';
import AIPerformanceSummary from '../components/communication/AIPerformanceSummary';
import AgentTasksSummary from '../components/dashboard/AgentTasksSummary';
import AIOnboardingAssistant from '../components/onboarding/AIOnboardingAssistant';
import AIOnboardingCopilot from '../components/onboarding/AIOnboardingCopilot';
import OnboardingBadges from '../components/gamification/OnboardingBadges';
import OnboardingLeaderboard from '../components/gamification/OnboardingLeaderboard';
import CelebrationAnimation from '../components/gamification/CelebrationAnimation';
import ProgressRing from '../components/gamification/ProgressRing';
import { checkAndAwardBadges } from '../components/gamification/badgeService'
import NIPRVerificationService from '../components/compliance/NIPRVerificationService';
import AITrainingGenerator from '../components/training/AITrainingGenerator';
import AIVoiceChat from '../components/ai/AIVoiceChat';
import SmartDocumentOCR from '../components/ai/SmartDocumentOCR';
import CECreditTracker from '../components/compliance/CECreditTracker';
import BookOfBusiness from '../components/book/BookOfBusiness';
import CommissionCalculator from '../components/commissions/CommissionCalculator';
import TrainingLibrary from '../components/training/TrainingLibrary';
import AICoachingEngine from '../components/coaching/AICoachingEngine';
import AIPerformanceInsights from '../components/agent/AIPerformanceInsights';
import CarrierAPIHub from '../components/integrations/CarrierAPIHub';
import AIAppointmentAutomation from '../components/appointments/AIAppointmentAutomation';
import ESignatureIntegration from '../components/integrations/ESignatureIntegration';
import AgentMobilePortal from '../components/mobile/AgentMobilePortal';
import ProductionGoals from '../components/analytics/ProductionGoals';
import ClientList from '../components/clients/ClientList';
import ClientDetail from '../components/clients/ClientDetail';
import ClientFormModal from '../components/clients/ClientFormModal';
import InteractionFormModal from '../components/clients/InteractionFormModal';
import AIEmailGenerator from '../components/email/AIEmailGenerator';
import AdvancedLeaderboard from '../components/gamification/AdvancedLeaderboard';
import AchievementSystem from '../components/gamification/AchievementSystem';
import PointsTracker from '../components/gamification/PointsTracker';
import AIComplianceEngine from '../components/compliance/AIComplianceEngine';
import AICoachingModule from '../components/coaching/AICoachingModule';
import ClientChurnAnalysis from '../components/ai/ClientChurnAnalysis';
import AgencyAgreementView from '../components/agreements/AgencyAgreementView';
import AgentCoachingPanel from '../components/coaching/AgentCoachingPanel';
import OffboardingWorkflow from '../components/offboarding/OffboardingWorkflow';

import { STATUS_CONFIG, CONTRACTING_STATUS_CONFIG } from '../components/shared/constants'

const statusConfig = STATUS_CONFIG;

export default function AgentDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const agentId = urlParams.get('id');
  const queryClient = useQueryClient();
  
  const [showNIPRSync, setShowNIPRSync] = useState(false);
  const [showSunfireSync, setShowSunfireSync] = useState(false);
  const [showDocumentUpload, setShowDocumentUpload] = useState(false);
  const [showDocumentVerification, setShowDocumentVerification] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [isSyncingNIPR, setIsSyncingNIPR] = useState(false);
  const [isSyncingSunfire, setIsSyncingSunfire] = useState(false);
  const [showContractForm, setShowContractForm] = useState(false);
  const [editingContract, setEditingContract] = useState(null);
  const [showEmailDrafter, setShowEmailDrafter] = useState(false);
  const [emailContext, setEmailContext] = useState({});
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationMessage, setCelebrationMessage] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [showClientForm, setShowClientForm] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [showInteractionForm, setShowInteractionForm] = useState(false);
  const [showOffboarding, setShowOffboarding] = useState(false);

  const { data: agent, isLoading: agentLoading } = useQuery({
    queryKey: ['agent', agentId],
    queryFn: () => base44.entities.Agent.filter({ id: agentId }).then(res => res[0]),
    enabled: !!agentId
  });

  const { data: licenses = [], isLoading: licensesLoading } = useQuery({
    queryKey: ['licenses', agentId],
    queryFn: () => base44.entities.License.filter({ agent_id: agentId }),
    enabled: !!agentId
  });

  const { data: appointments = [], isLoading: appointmentsLoading } = useQuery({
    queryKey: ['appointments', agentId],
    queryFn: () => base44.entities.CarrierAppointment.filter({ agent_id: agentId }),
    enabled: !!agentId
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['alerts', agentId],
    queryFn: () => base44.entities.Alert.filter({ agent_id: agentId }, '-created_date'),
    enabled: !!agentId
  });

  const { data: documents = [], isLoading: documentsLoading } = useQuery({
    queryKey: ['documents', agentId],
    queryFn: () => base44.entities.Document.filter({ agent_id: agentId }, '-created_date'),
    enabled: !!agentId
  });

  const { data: contracts = [], isLoading: contractsLoading } = useQuery({
    queryKey: ['contracts', agentId],
    queryFn: () => base44.entities.Contract.filter({ agent_id: agentId }, '-created_date'),
    enabled: !!agentId
  });

  const { data: carriers = [] } = useQuery({
    queryKey: ['carriers'],
    queryFn: () => base44.entities.Carrier.list()
  });

  const { data: checklistItems = [], isLoading: checklistLoading } = useQuery({
    queryKey: ['checklist', agentId],
    queryFn: () => base44.entities.OnboardingChecklist.filter({ agent_id: agentId }),
    enabled: !!agentId
  });

  const { data: badges = [] } = useQuery({
    queryKey: ['badges', agentId],
    queryFn: () => base44.entities.OnboardingBadge.filter({ agent_id: agentId }),
    enabled: !!agentId
  });

  const { data: allAgents = [] } = useQuery({
    queryKey: ['allAgents'],
    queryFn: () => base44.entities.Agent.list()
  });

  const { data: allBadges = [] } = useQuery({
    queryKey: ['allBadges'],
    queryFn: () => base44.entities.OnboardingBadge.list()
  });

  const { data: allChecklistItems = [] } = useQuery({
    queryKey: ['allChecklistItems'],
    queryFn: () => base44.entities.OnboardingChecklist.list()
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list('-created_date')
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients', agentId],
    queryFn: () => base44.entities.Client.filter({ agent_id: agentId }, '-created_date'),
    enabled: !!agentId
  });

  const { data: clientInteractions = [] } = useQuery({
    queryKey: ['clientInteractions', agentId],
    queryFn: () => base44.entities.ClientInteraction.filter({ agent_id: agentId }, '-created_date'),
    enabled: !!agentId
  });

  const { data: agentPointsData } = useQuery({
    queryKey: ['agentPoints', agentId],
    queryFn: async () => {
      const points = await base44.entities.AgentPoints.filter({ agent_id: agentId });
      return points[0] || null;
    },
    enabled: !!agentId
  });

  const { data: agentAchievements = [] } = useQuery({
    queryKey: ['agentAchievements', agentId],
    queryFn: () => base44.entities.AgentAchievement.filter({ agent_id: agentId }),
    enabled: !!agentId
  });

  const { data: allAgentPoints = [] } = useQuery({
    queryKey: ['allAgentPoints'],
    queryFn: () => base44.entities.AgentPoints.list()
  });

  const { data: commissions = [] } = useQuery({
    queryKey: ['commissions'],
    queryFn: () => base44.entities.Commission.list()
  });

  const resolveAlertMutation = useMutation({
    mutationFn: (alert) => base44.entities.Alert.update(alert.id, { 
      is_resolved: true, 
      resolved_date: new Date().toISOString() 
    }),
    onSuccess: () => queryClient.invalidateQueries(['alerts', agentId])
  });

  const createLicenseMutation = useMutation({
    mutationFn: (data) => base44.entities.License.create(data),
    onSuccess: () => queryClient.invalidateQueries(['licenses', agentId])
  });

  const createAppointmentMutation = useMutation({
    mutationFn: (data) => base44.entities.CarrierAppointment.create(data),
    onSuccess: () => queryClient.invalidateQueries(['appointments', agentId])
  });

  const createAlertMutation = useMutation({
    mutationFn: (data) => base44.entities.Alert.create(data),
    onSuccess: () => queryClient.invalidateQueries(['alerts', agentId])
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: (doc) => base44.entities.Document.delete(doc.id),
    onSuccess: () => queryClient.invalidateQueries(['documents', agentId])
  });

  const verifyDocumentMutation = useMutation({
    mutationFn: async (doc) => {
      const user = await base44.auth.me();
      return base44.entities.Document.update(doc.id, { 
        verification_status: 'verified',
        status: 'verified',
        verified_by: user.email,
        verified_date: new Date().toISOString() 
      });
    },
    onSuccess: () => queryClient.invalidateQueries(['documents', agentId])
  });

  const rejectDocumentMutation = useMutation({
    mutationFn: async ({ doc, reason }) => {
      const user = await base44.auth.me();
      return base44.entities.Document.update(doc.id, { 
        verification_status: 'rejected',
        status: 'rejected',
        rejection_reason: reason,
        verified_by: user.email,
        verified_date: new Date().toISOString() 
      });
    },
    onSuccess: () => queryClient.invalidateQueries(['documents', agentId])
  });

  const createContractMutation = useMutation({
    mutationFn: (data) => base44.entities.Contract.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['contracts', agentId]);
      setShowContractForm(false);
    }
  });

  const updateContractMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Contract.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['contracts', agentId]);
      setShowContractForm(false);
      setEditingContract(null);
    }
  });

  const createClientMutation = useMutation({
    mutationFn: (data) => base44.entities.Client.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['clients', agentId]);
      setShowClientForm(false);
      toast.success('Client added');
    }
  });

  const updateClientMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Client.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['clients', agentId]);
      setShowClientForm(false);
      setEditingClient(null);
      toast.success('Client updated');
    }
  });

  const deleteClientMutation = useMutation({
    mutationFn: (id) => base44.entities.Client.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['clients', agentId]);
      setSelectedClient(null);
      toast.success('Client deleted');
    }
  });

  const createInteractionMutation = useMutation({
    mutationFn: async (data) => {
      await base44.entities.ClientInteraction.create(data);
      await base44.entities.Client.update(data.client_id, {
        last_contact_date: new Date().toISOString().split('T')[0],
        ...(data.follow_up_required && data.follow_up_date ? { next_follow_up: data.follow_up_date } : {})
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['clientInteractions', agentId]);
      queryClient.invalidateQueries(['clients', agentId]);
      setShowInteractionForm(false);
      toast.success('Interaction logged');
    }
  });

  const saveEmailDraftMutation = useMutation({
    mutationFn: (data) => base44.entities.EmailDraft.create(data),
    onSuccess: () => toast.success('Email saved')
  });

  const handleContractSubmit = async (data) => {
    if (editingContract) {
      updateContractMutation.mutate({ id: editingContract.id, data });
      
      // If contract becomes active or signed, auto-complete checklist
      if (['active', 'contract_signed'].includes(data.contract_status) && 
          !['active', 'contract_signed'].includes(editingContract.contract_status)) {
        const user = await base44.auth.me();
        await triggerChecklistCompletion(
          'contract_active',
          agentId,
          checklistItems,
          (id, updateData) => base44.entities.OnboardingChecklist.update(id, updateData),
          user.email
        );
        queryClient.invalidateQueries(['checklist', agentId]);
      }
    } else {
      createContractMutation.mutate(data);
    }
  };

  const handleEditContract = (contract) => {
    setEditingContract(contract);
    setShowContractForm(true);
  };

  const initializeChecklistMutation = useMutation({
    mutationFn: async () => {
      const user = await base44.auth.me();
      const items = DEFAULT_CHECKLIST_ITEMS.map(item => ({
        agent_id: agentId,
        item_key: item.key,
        item_name: item.name,
        category: item.category,
        is_completed: false,
        sort_order: item.order
      }));
      return base44.entities.OnboardingChecklist.bulkCreate(items);
    },
    onSuccess: () => queryClient.invalidateQueries(['checklist', agentId])
  });

  const toggleChecklistMutation = useMutation({
    mutationFn: async (item) => {
      const user = await base44.auth.me();
      const newCompletedState = !item.is_completed;
      
      await base44.entities.OnboardingChecklist.update(item.id, {
        is_completed: newCompletedState,
        completed_date: newCompletedState ? new Date().toISOString() : null,
        completed_by: newCompletedState ? user.email : null
      });

      // Auto-resolve alerts when completing, or check for new alerts when uncompleting
      if (newCompletedState) {
        await resolveChecklistAlerts(
          item.id,
          alerts,
          (id, data) => base44.entities.Alert.update(id, data)
        );
      }
      
      return { item, newCompletedState };
    },
    onSuccess: async ({ item, newCompletedState }) => {
      queryClient.invalidateQueries(['checklist', agentId]);
      queryClient.invalidateQueries(['alerts', agentId]);
      
      // Check for new badges when completing items
      if (newCompletedState && agent) {
        const updatedChecklist = checklistItems.map(c => 
          c.id === item.id ? { ...c, is_completed: true } : c
        );
        const newBadges = await checkAndAwardBadges(agentId, {
          agent,
          checklistItems: updatedChecklist,
          documents,
          licenses,
          appointments
        }, badges);
        
        if (newBadges.length > 0) {
          setCelebrationMessage(`You earned the "${newBadges[0].badge_name}" badge! +${newBadges[0].points} points`);
          setShowCelebration(true);
          queryClient.invalidateQueries(['badges', agentId]);
          queryClient.invalidateQueries(['allBadges']);
        }
      }
    }
  });

  // Check for overdue checklist alerts
  React.useEffect(() => {
    if (agent && checklistItems.length > 0) {
      checkChecklistAlerts(
        agent,
        checklistItems,
        alerts,
        (data) => base44.entities.Alert.create(data)
      ).then(() => {
        queryClient.invalidateQueries(['alerts', agentId]);
      });
    }
  }, [agent?.id, checklistItems.length]);

  const handleVerifyDocument = (doc) => {
    setSelectedDocument(doc);
    setShowDocumentVerification(true);
  };

  const handleConfirmVerify = async (doc) => {
    await verifyDocumentMutation.mutateAsync(doc);
  };

  const handleRejectDocument = async (doc, reason) => {
    await rejectDocumentMutation.mutateAsync({ doc, reason });
  };

  const handleNIPRSyncComplete = async (results) => {
    // Create sample licenses from sync
    const states = results.states || ['CA', 'TX'];
    for (const state of states) {
      const existing = licenses.find(l => l.state === state);
      if (!existing) {
        await createLicenseMutation.mutateAsync({
          agent_id: agentId,
          state: state,
          license_number: `${state}${Math.floor(Math.random() * 1000000)}`,
          license_type: 'health',
          status: 'active',
          issue_date: new Date().toISOString().split('T')[0],
          expiration_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          nipr_verified: true,
          nipr_last_check: new Date().toISOString(),
          adverse_actions: results.adverse_actions
        });
      }
    }

    // Auto-complete checklist items for NIPR verification
    if (!results.adverse_actions) {
      const user = await base44.auth.me();
      await triggerChecklistCompletion(
        'nipr_verified',
        agentId,
        checklistItems,
        (id, data) => base44.entities.OnboardingChecklist.update(id, data),
        user.email
      );
      queryClient.invalidateQueries(['checklist', agentId]);
    }

    // Create alert if adverse actions found
    if (results.adverse_actions) {
      await createAlertMutation.mutateAsync({
        agent_id: agentId,
        alert_type: 'adverse_action',
        severity: 'critical',
        title: 'Adverse Action Detected',
        message: `NIPR sync found regulatory actions on record for ${agent.first_name} ${agent.last_name}. Review immediately.`
      });
    }

    queryClient.invalidateQueries(['licenses', agentId]);
  };

  const handleSunfireSyncComplete = async (results) => {
    // Create sample appointments from sync
    for (const carrier of results.carriers || []) {
      const existing = appointments.find(a => a.carrier_name === carrier.name);
      if (!existing) {
        await createAppointmentMutation.mutateAsync({
          agent_id: agentId,
          carrier_name: carrier.name,
          carrier_code: carrier.code,
          appointment_status: carrier.appointed ? 'appointed' : 'pending',
          rts_status: carrier.rts,
          states: carrier.states,
          sunfire_synced: true,
          sunfire_last_sync: new Date().toISOString()
        });
      }
    }

    queryClient.invalidateQueries(['appointments', agentId]);
  };

  if (agentLoading || !agent) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
      </div>
    );
  }

  const status = statusConfig[agent.onboarding_status] || statusConfig.pending;
  const contractingStatus = CONTRACTING_STATUS_CONFIG[agent.contracting_status] || CONTRACTING_STATUS_CONFIG.not_started;
  const initials = `${agent.first_name?.[0] || ''}${agent.last_name?.[0] || ''}`.toUpperCase();
  const activeAlerts = alerts.filter(a => !a.is_resolved);
  const activeContracts = contracts.filter(c => ['active', 'contract_signed'].includes(c.contract_status)).length;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link to={createPageUrl('Agents')}>
            <Button variant="ghost" className="mb-4 text-slate-600 hover:text-slate-800">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Agents
            </Button>
          </Link>
        </div>

        {/* Agent Header Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="clay-morphism border-0 mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-start gap-6">
                <Avatar className="w-20 h-20 border-4 border-white shadow-md">
                  <AvatarImage src={agent.photo_url} />
                  <AvatarFallback className="bg-gradient-to-br from-slate-700 to-slate-900 text-white text-2xl font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
                    <h1 className="text-2xl font-semibold text-slate-900">
                      {agent.first_name} {agent.last_name}
                    </h1>
                    <Badge variant="outline" className={`${status.color} w-fit`}>
                      {status.label}
                    </Badge>
                    <Badge variant="outline" className={`${contractingStatus.color} w-fit`}>
                      Contracting: {contractingStatus.label}
                    </Badge>
                    <OnboardingProgressBadge items={checklistItems} />
                    {activeAlerts.length > 0 && (
                      <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200 w-fit">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        {activeAlerts.length} Alert{activeAlerts.length !== 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Hash className="w-4 h-4 text-slate-400" />
                      <span>NPN: <span className="font-medium text-slate-800">{agent.npn}</span></span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <span className="truncate">{agent.email}</span>
                    </div>
                    {agent.phone && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <Phone className="w-4 h-4 text-slate-400" />
                        <span>{agent.phone}</span>
                      </div>
                    )}
                    {agent.state && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        <span>{agent.city}, {agent.state}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="text-sm"
                    onClick={() => {
                      const incompleteItems = checklistItems.filter(c => !c.is_completed).map(c => c.item_name);
                      setEmailContext({ incompleteItems, daysSinceStart: Math.floor((new Date() - new Date(agent.created_date)) / (1000 * 60 * 60 * 24)) });
                      setShowEmailDrafter(true);
                    }}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Email
                  </Button>
                  <Button variant="outline" className="text-sm">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    className="text-sm border-red-200 text-red-600 hover:bg-red-50"
                    onClick={() => setShowOffboarding(true)}
                  >
                    <UserX className="w-4 h-4 mr-2" />
                    Offboard
                  </Button>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-4 mt-6 pt-6 border-t">
                <div className="text-center p-3 bg-slate-50 rounded-xl">
                  <Shield className="w-5 h-5 mx-auto text-teal-600 mb-1" />
                  <p className="text-2xl font-semibold text-slate-800">{licenses.length}</p>
                  <p className="text-xs text-slate-500">Licenses</p>
                </div>
                <div className="text-center p-3 bg-slate-50 rounded-xl">
                  <FileSignature className="w-5 h-5 mx-auto text-teal-600 mb-1" />
                  <p className="text-2xl font-semibold text-slate-800">{contracts.length}</p>
                  <p className="text-xs text-slate-500">Contracts</p>
                </div>
                <div className="text-center p-3 bg-slate-50 rounded-xl">
                  <CheckCircle className="w-5 h-5 mx-auto text-emerald-600 mb-1" />
                  <p className="text-2xl font-semibold text-slate-800">{activeContracts}</p>
                  <p className="text-xs text-slate-500">Active Contracts</p>
                </div>
                <div className="text-center p-3 bg-slate-50 rounded-xl">
                  <FileCheck className="w-5 h-5 mx-auto text-teal-600 mb-1" />
                  <p className="text-2xl font-semibold text-slate-800">
                    {appointments.filter(a => a.rts_status === 'ready_to_sell').length}
                  </p>
                  <p className="text-xs text-slate-500">Ready to Sell</p>
                </div>
                <div className="text-center p-3 bg-slate-50 rounded-xl">
                  <FileText className="w-5 h-5 mx-auto text-teal-600 mb-1" />
                  <p className="text-2xl font-semibold text-slate-800">{documents.length}</p>
                  <p className="text-xs text-slate-500">Documents</p>
                </div>
                <div className="text-center p-3 bg-slate-50 rounded-xl">
                  <AlertTriangle className={`w-5 h-5 mx-auto mb-1 ${activeAlerts.length > 0 ? 'text-red-500' : 'text-slate-400'}`} />
                  <p className="text-2xl font-semibold text-slate-800">{activeAlerts.length}</p>
                  <p className="text-xs text-slate-500">Alerts</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tabs Content */}
        <Tabs defaultValue="onboarding" className="space-y-6">
          <TabsList className="bg-white shadow-sm p-1 rounded-xl flex-wrap">
            <TabsTrigger value="onboarding" className="rounded-lg">
              <CheckCircle className="w-4 h-4 mr-2" />
              Onboarding
            </TabsTrigger>
            <TabsTrigger value="contracts" className="rounded-lg">
              <FileSignature className="w-4 h-4 mr-2" />
              Contracts
              <Badge variant="secondary" className="ml-2 bg-slate-100 text-slate-600 text-xs">
                {contracts.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="licenses" className="rounded-lg">
              <Shield className="w-4 h-4 mr-2" />
              Licenses
            </TabsTrigger>
            <TabsTrigger value="appointments" className="rounded-lg">
              <FileCheck className="w-4 h-4 mr-2" />
              Appointments
            </TabsTrigger>
            <TabsTrigger value="documents" className="rounded-lg">
              <FileText className="w-4 h-4 mr-2" />
              Documents
              <Badge variant="secondary" className="ml-2 bg-slate-100 text-slate-600 text-xs">
                {documents.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="alerts" className="rounded-lg">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Alerts
              {activeAlerts.length > 0 && (
                <Badge variant="secondary" className="ml-2 bg-red-100 text-red-700 text-xs">
                  {activeAlerts.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="verification" className="rounded-lg">
              <Shield className="w-4 h-4 mr-2" />
              NIPR Verify
            </TabsTrigger>
            <TabsTrigger value="training" className="rounded-lg">
              <FileText className="w-4 h-4 mr-2" />
              Training
            </TabsTrigger>
            <TabsTrigger value="book" className="rounded-lg">
              <FileText className="w-4 h-4 mr-2" />
              Book of Business
            </TabsTrigger>
            <TabsTrigger value="integrations" className="rounded-lg">
              <FileText className="w-4 h-4 mr-2" />
              Integrations
            </TabsTrigger>
            <TabsTrigger value="ai-insights" className="rounded-lg">
              <Sparkles className="w-4 h-4 mr-2" />
              AI Insights
            </TabsTrigger>
            <TabsTrigger value="clients" className="rounded-lg">
              <User className="w-4 h-4 mr-2" />
              Clients
              <Badge variant="secondary" className="ml-2 bg-slate-100 text-slate-600 text-xs">
                {clients.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="gamification" className="rounded-lg">
                <Zap className="w-4 h-4 mr-2" />
                Rewards
              </TabsTrigger>
              <TabsTrigger value="coaching" className="rounded-lg">
                <Trophy className="w-4 h-4 mr-2" />
                AI Coaching
              </TabsTrigger>
              <TabsTrigger value="agreement" className="rounded-lg">
                <FileSignature className="w-4 h-4 mr-2" />
                Agreement
              </TabsTrigger>
              </TabsList>

          <TabsContent value="onboarding">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {/* Gamification Progress Header */}
                <Card className="border-0 shadow-premium dark:bg-slate-800/50 overflow-hidden">
                  <div className="bg-gradient-to-r from-slate-900 via-black to-slate-800 p-6">
                    <div className="flex items-center gap-6">
                      <ProgressRing 
                        progress={checklistItems.length > 0 ? Math.round((checklistItems.filter(c => c.is_completed).length / checklistItems.length) * 100) : 0} 
                        size={100} 
                        strokeWidth={8}
                      >
                        <div className="text-center">
                          <div className="text-2xl font-bold text-white">
                            {checklistItems.length > 0 ? Math.round((checklistItems.filter(c => c.is_completed).length / checklistItems.length) * 100) : 0}%
                          </div>
                          <div className="text-[10px] text-slate-200 uppercase tracking-wider">Complete</div>
                        </div>
                      </ProgressRing>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white mb-1">Onboarding Progress</h3>
                        <p className="text-violet-200 text-sm mb-3">
                          {checklistItems.filter(c => c.is_completed).length} of {checklistItems.length} steps completed
                        </p>
                        <div className="flex items-center gap-3">
                          <div className="px-3 py-1.5 rounded-full bg-white/20 backdrop-blur">
                            <span className="text-sm font-semibold text-white">
                              {badges.reduce((sum, b) => sum + (b.points || 0), 0)} points
                            </span>
                          </div>
                          <div className="px-3 py-1.5 rounded-full bg-white/20 backdrop-blur">
                            <span className="text-sm font-semibold text-white">
                              {badges.length} badges earned
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                <OnboardingBadges earnedBadges={badges} agentName={`${agent.first_name} ${agent.last_name}`} />

                <OnboardingChecklist
                  items={checklistItems}
                  isLoading={toggleChecklistMutation.isPending}
                  isInitializing={initializeChecklistMutation.isPending}
                  onToggle={(item) => toggleChecklistMutation.mutate(item)}
                  onInitialize={() => initializeChecklistMutation.mutate()}
                />
                <AIOnboardingAssistant
                  agent={agent}
                  checklistItems={checklistItems}
                  documents={documents}
                  licenses={licenses}
                  onCreateTask={async (taskData) => {
                    await base44.entities.Task.create({
                      ...taskData,
                      status: 'pending',
                      auto_generated: true
                    });
                    queryClient.invalidateQueries(['tasks']);
                  }}
                  onCreateChecklist={async (items) => {
                    const user = await base44.auth.me();
                    for (const item of items) {
                      await base44.entities.OnboardingChecklist.create({
                        agent_id: agentId,
                        item_key: item.name.toLowerCase().replace(/\s+/g, '_'),
                        item_name: item.name,
                        category: item.category || 'other',
                        is_completed: false
                      });
                    }
                    queryClient.invalidateQueries(['checklist', agentId]);
                  }}
                />
              </div>
              <div className="space-y-6">
                <AIOnboardingCopilot
                  agent={agent}
                  checklistItems={checklistItems}
                  documents={documents}
                  licenses={licenses}
                  contracts={contracts}
                  appointments={appointments}
                  onCreateTask={async (taskData) => {
                    await base44.entities.Task.create({
                      ...taskData,
                      status: 'pending',
                      auto_generated: true
                    });
                    queryClient.invalidateQueries(['tasks']);
                  }}
                  onCreateChecklist={async (items) => {
                    const user = await base44.auth.me();
                    for (const item of items) {
                      await base44.entities.OnboardingChecklist.create({
                        agent_id: agentId,
                        item_key: item.name.toLowerCase().replace(/\s+/g, '_'),
                        item_name: item.name,
                        category: item.category || 'other',
                        is_completed: false
                      });
                    }
                    queryClient.invalidateQueries(['checklist', agentId]);
                  }}
                />

                <OnboardingLeaderboard
                  agents={allAgents}
                  badges={allBadges}
                  checklistItems={allChecklistItems}
                  currentAgentId={agentId}
                />
              </div>
              </div>
              </TabsContent>

          <TabsContent value="contracts">
            <ContractList
              contracts={contracts}
              isLoading={contractsLoading}
              onAdd={() => setShowContractForm(true)}
              onEdit={handleEditContract}
              documents={documents}
            />
          </TabsContent>

          <TabsContent value="licenses">
            <LicenseTable
              licenses={licenses}
              onSync={() => setShowNIPRSync(true)}
              onAdd={() => {}}
              isSyncing={isSyncingNIPR}
            />
          </TabsContent>

          <TabsContent value="appointments">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AppointmentTable
                appointments={appointments}
                onSync={() => setShowSunfireSync(true)}
                onAdd={() => {}}
                isSyncing={isSyncingSunfire}
              />
              <AIAppointmentAutomation
                agent={agent}
                licenses={licenses}
                appointments={appointments}
                carriers={carriers}
                onCreateAppointment={async (data) => {
                  await createAppointmentMutation.mutateAsync(data);
                }}
                onUpdateAppointment={async (id, data) => {
                  await base44.entities.CarrierAppointment.update(id, data);
                  queryClient.invalidateQueries(['appointments', agentId]);
                }}
                onCreateTask={async (taskData) => {
                  await base44.entities.Task.create(taskData);
                  queryClient.invalidateQueries(['tasks']);
                }}
                onCreateAlert={async (alertData) => {
                  await createAlertMutation.mutateAsync(alertData);
                }}
              />
            </div>
          </TabsContent>

          <TabsContent value="documents">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <DocumentList
                  documents={documents}
                  isLoading={documentsLoading}
                  onUpload={() => setShowDocumentUpload(true)}
                  onDelete={(doc) => deleteDocumentMutation.mutate(doc)}
                  onVerify={handleVerifyDocument}
                  onReject={handleRejectDocument}
                />
                <AIDocumentProcessor
                  agent={agent}
                  existingDocuments={documents}
                  licenses={licenses}
                  onDocumentProcessed={async (docData) => {
                    await base44.entities.Document.create(docData);
                    queryClient.invalidateQueries(['documents', agentId]);
                  }}
                  onUpdateAgent={async (data) => {
                    await base44.entities.Agent.update(agentId, data);
                    queryClient.invalidateQueries(['agent', agentId]);
                  }}
                  onCreateAlert={async (alertData) => {
                    await createAlertMutation.mutateAsync(alertData);
                  }}
                />
              </div>
              <div>
                <AIDocumentSuggestions
                  agent={agent}
                  existingDocuments={documents}
                  licenses={licenses}
                  appointments={appointments}
                  contracts={contracts}
                  onRequestDocument={(doc) => {
                    toast.info(`Document request sent: ${doc.document_name}`);
                  }}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="alerts">
            <AlertsList
              alerts={alerts}
              onResolve={(alert) => resolveAlertMutation.mutate(alert)}
            />
          </TabsContent>

          <TabsContent value="verification">
            <NIPRVerificationService
              agent={agent}
              licenses={licenses}
              onVerificationComplete={(results) => {
                queryClient.invalidateQueries(['licenses', agentId]);
              }}
              onFlagLicense={async (license, reason) => {
                await base44.entities.License.update(license.id, {
                  adverse_actions: true,
                  adverse_action_details: reason
                });
                queryClient.invalidateQueries(['licenses', agentId]);
              }}
              onCreateAlert={async (alertData) => {
                await createAlertMutation.mutateAsync(alertData);
              }}
              onCreateTask={async (taskData) => {
                await base44.entities.Task.create({
                  ...taskData,
                  agent_id: agentId,
                  status: 'pending',
                  auto_generated: true
                });
                queryClient.invalidateQueries(['tasks']);
              }}
            />
          </TabsContent>

          <TabsContent value="training">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TrainingLibrary agentId={agentId} />
              <div className="space-y-6">
                <AITrainingGenerator
                  agent={agent}
                  metrics={{
                    overall: checklistItems.length > 0 ? Math.round((checklistItems.filter(c => c.is_completed).length / checklistItems.length) * 100) : 0,
                    onboarding: checklistItems.length > 0 ? Math.round((checklistItems.filter(c => c.is_completed).length / checklistItems.length) * 100) : 0,
                    licenses: licenses.filter(l => l.status === 'active').length * 20,
                    contracts: contracts.filter(c => ['active', 'contract_signed'].includes(c.contract_status)).length * 25,
                    tasks: tasks.filter(t => t.agent_id === agentId && t.status === 'completed').length * 10
                  }}
                  teamAverages={{
                    overall: 65,
                    onboarding: 70,
                    licenses: 60,
                    contracts: 50,
                    tasks: 40
                  }}
                  complianceIssues={alerts.filter(a => !a.is_resolved && a.severity === 'critical')}
                />
                <CECreditTracker agentId={agentId} licenses={licenses} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="book">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <BookOfBusiness agentId={agentId} />
              <div className="space-y-6">
                <CommissionCalculator contracts={contracts} />
                <ProductionGoals 
                  agent={agent}
                  policies={[]}
                  commissions={[]}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="integrations">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CarrierAPIHub 
                agentId={agentId}
                onDataSynced={() => {
                  queryClient.invalidateQueries(['contracts', agentId]);
                }}
              />
              <ESignatureIntegration 
                agent={agent}
                contracts={contracts}
                onDocumentSigned={() => queryClient.invalidateQueries(['contracts', agentId])}
              />
              <AgentMobilePortal 
                agent={agent}
                checklistItems={checklistItems}
                commissions={[]}
                licenses={licenses}
              />
            </div>
          </TabsContent>

          <TabsContent value="clients">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {selectedClient ? (
                <ClientDetail
                  client={selectedClient}
                  interactions={clientInteractions.filter(i => i.client_id === selectedClient.id)}
                  onBack={() => setSelectedClient(null)}
                  onEdit={() => {
                    setEditingClient(selectedClient);
                    setShowClientForm(true);
                  }}
                  onDelete={() => {
                    if (confirm('Delete this client?')) {
                      deleteClientMutation.mutate(selectedClient.id);
                    }
                  }}
                  onLogInteraction={() => setShowInteractionForm(true)}
                  onSendEmail={() => {}}
                />
              ) : (
                <ClientList
                  clients={clients}
                  onSelectClient={setSelectedClient}
                  onAddClient={() => {
                    setEditingClient(null);
                    setShowClientForm(true);
                  }}
                />
              )}
              <div className="space-y-6">
                <PointsTracker agentPoints={agentPointsData} />
                {selectedClient && (
                  <AIEmailGenerator
                    agent={agent}
                    client={selectedClient}
                    clients={clients}
                    interactions={clientInteractions}
                    onSaveDraft={(data) => saveEmailDraftMutation.mutate(data)}
                  />
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="gamification">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AdvancedLeaderboard
                agents={allAgents}
                agentPoints={allAgentPoints}
                commissions={commissions}
                clients={clients}
                licenses={licenses}
                currentAgentId={agentId}
              />
              <div className="space-y-6">
                <AchievementSystem
                  achievements={agentAchievements}
                  agentPoints={agentPointsData}
                />
                <PointsTracker agentPoints={agentPointsData} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="coaching">
            <AgentCoachingPanel agentId={agentId} />
          </TabsContent>

          <TabsContent value="agreement">
            <AgencyAgreementView agent={agent} />
          </TabsContent>

          <TabsContent value="ai-insights">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <AICoachingModule
                  agent={agent}
                  clients={clients}
                  interactions={clientInteractions}
                  commissions={commissions}
                  licenses={licenses}
                  contracts={contracts}
                  tasks={tasks}
                  teamAverages={{
                    avgCommission: 5000,
                    avgSatisfaction: 7.5,
                    avgConversion: 25
                  }}
                />
                <ClientChurnAnalysis
                  clients={clients}
                  interactions={clientInteractions}
                  agent={agent}
                  onSendEmail={(emailData) => {
                    base44.integrations.Core.SendEmail({
                      to: emailData.client.email,
                      subject: emailData.subject,
                      body: emailData.body
                    });
                  }}
                  onCreateTask={async (taskData) => {
                    await base44.entities.Task.create(taskData);
                    queryClient.invalidateQueries(['tasks']);
                  }}
                />
                <AIComplianceEngine
                  agents={[agent]}
                  licenses={licenses}
                  contracts={contracts}
                  clients={clients}
                  interactions={clientInteractions}
                  checklistItems={checklistItems}
                  onCreateAlert={async (alertData) => {
                    await createAlertMutation.mutateAsync(alertData);
                  }}
                  onCreateTask={async (taskData) => {
                    await base44.entities.Task.create(taskData);
                    queryClient.invalidateQueries(['tasks']);
                  }}
                />
                <AIPerformanceInsights
                  agent={agent}
                  commissions={[]}
                  policies={[]}
                  licenses={licenses}
                  contracts={contracts}
                  trainingProgress={[]}
                  teamAverages={{
                    avgCommission: 5000,
                    avgPolicies: 10,
                    avgLicenses: 3
                  }}
                />
                <AICoachingEngine
                  agent={agent}
                  licenses={licenses}
                  contracts={contracts}
                  commissions={[]}
                  policies={[]}
                  alerts={alerts}
                  leaderboardRank={null}
                  teamAverages={{
                    avgCommission: 5000,
                    avgPolicies: 10,
                    avgLicenses: 3
                  }}
                />
                <AgentTasksSummary tasks={tasks} agentId={agentId} />
                <AIPerformanceSummary
                  agent={agent}
                  licenses={licenses}
                  contracts={contracts}
                  checklistItems={checklistItems}
                />
              </div>
              <div className="space-y-6">
                <AIVoiceChat
                  agent={agent}
                  licenses={licenses}
                  contracts={contracts}
                  checklistItems={checklistItems}
                />
                <SmartDocumentOCR 
                  documentType="state_license"
                  onDataExtracted={(data, url) => {
                    console.log('Extracted:', data);
                  }}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      <NIPRSyncModal
        open={showNIPRSync}
        onClose={() => setShowNIPRSync(false)}
        agent={agent}
        onComplete={handleNIPRSyncComplete}
      />

      <SunfireSyncModal
        open={showSunfireSync}
        onClose={() => setShowSunfireSync(false)}
        agent={agent}
        onComplete={handleSunfireSyncComplete}
      />

      <DocumentUploadModal
        open={showDocumentUpload}
        onClose={() => setShowDocumentUpload(false)}
        agentId={agentId}
        checklistItems={checklistItems}
        onChecklistUpdate={() => queryClient.invalidateQueries(['checklist', agentId])}
        onSuccess={() => {
          queryClient.invalidateQueries(['documents', agentId]);
          queryClient.invalidateQueries(['alerts', agentId]);
        }}
      />

      <DocumentVerificationModal
        open={showDocumentVerification}
        onClose={() => {
          setShowDocumentVerification(false);
          setSelectedDocument(null);
        }}
        document={selectedDocument}
        onVerify={handleConfirmVerify}
        onReject={handleRejectDocument}
      />

      <ContractFormModal
        open={showContractForm}
        onClose={() => {
          setShowContractForm(false);
          setEditingContract(null);
        }}
        contract={editingContract}
        carriers={carriers}
        agentId={agentId}
        onSubmit={handleContractSubmit}
        isLoading={createContractMutation.isPending || updateContractMutation.isPending}
        onCreateTask={async (taskData) => {
          await base44.entities.Task.create({
            ...taskData,
            status: 'pending'
          });
          queryClient.invalidateQueries(['tasks']);
        }}
      />

      <AIEmailDrafter
        open={showEmailDrafter}
        onClose={() => setShowEmailDrafter(false)}
        agent={agent}
        context={emailContext}
        defaultTemplate="onboarding_reminder"
      />

      <CelebrationAnimation
        show={showCelebration}
        type="badge"
        message={celebrationMessage}
        onComplete={() => setShowCelebration(false)}
      />

      <ClientFormModal
        open={showClientForm}
        onClose={() => {
          setShowClientForm(false);
          setEditingClient(null);
        }}
        client={editingClient}
        agentId={agentId}
        onSubmit={(data) => {
          if (editingClient) {
            updateClientMutation.mutate({ id: editingClient.id, data });
          } else {
            createClientMutation.mutate(data);
          }
        }}
        isLoading={createClientMutation.isPending || updateClientMutation.isPending}
      />

      <InteractionFormModal
        open={showInteractionForm}
        onClose={() => setShowInteractionForm(false)}
        client={selectedClient}
        agentId={agentId}
        onSubmit={(data) => createInteractionMutation.mutate(data)}
        isLoading={createInteractionMutation.isPending}
      />

      <OffboardingWorkflow
        agent={agent}
        open={showOffboarding}
        onClose={() => setShowOffboarding(false)}
      />
      </div>
      );
      }