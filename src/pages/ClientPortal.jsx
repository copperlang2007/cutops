import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, FileText, MessageSquare, Home, User, 
  CheckCircle, Clock, AlertCircle, Phone, Mail,
  Bot, ChevronRight, Download, Calendar, Pill,
  Stethoscope, CreditCard, Activity, CalendarDays,
  ClipboardCheck, HandHeart, Sparkles, Heart, Bell, Video
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format, differenceInDays } from 'date-fns';
import { createPageUrl } from '@/utils';
import ClientPortalPolicyView from '../components/portal/ClientPortalPolicyView';
import ClientPortalOnboarding from '../components/portal/ClientPortalOnboarding';
import ClientPortalDocuments from '../components/portal/ClientPortalDocuments';
import ClientPortalMessages from '../components/portal/ClientPortalMessages';
import ClientPortalChatbot from '../components/portal/ClientPortalChatbot';
import AppointmentScheduler from '../components/portal/AppointmentScheduler';
import DrugLookupTool from '../components/portal/DrugLookupTool';
import ProviderSearch from '../components/portal/ProviderSearch';
import InsuranceCardScanner from '../components/portal/InsuranceCardScanner';
import PlanCompatibilityWizard from '../components/portal/PlanCompatibilityWizard';
import BenefitsAssistance from '../components/portal/BenefitsAssistance';
import BenefitUsageTracker from '../components/portal/BenefitUsageTracker';
import AnnualEnrollmentWizard from '../components/portal/AnnualEnrollmentWizard';
import PersonalizedHealthContent from '../components/portal/PersonalizedHealthContent';
import HealthAlertNotifications from '../components/portal/HealthAlertNotifications';
import AIWellnessCoach from '../components/portal/AIWellnessCoach';
import TelehealthScheduler from '../components/portal/TelehealthScheduler';
import GovtBenefitsScreening from '../components/portal/GovtBenefitsScreening';
import BenefitReminders from '../components/portal/BenefitReminders';
import ClientPolicyRecommendationPanel from '../components/policy/ClientPolicyRecommendationPanel';
import AIDocumentSearchPanel from '../components/documents/AIDocumentSearchPanel';
import AIDocumentUploadEnhanced from '../components/documents/AIDocumentUploadEnhanced';

export default function ClientPortal() {
  const queryClient = useQueryClient();
  const [showChatbot, setShowChatbot] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [userConditions, setUserConditions] = useState([]);
  const [coachAlertContext, setCoachAlertContext] = useState(null);

  const { data: currentUser, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  // Find client record matching current user's email
  const { data: clientData, isLoading: clientLoading } = useQuery({
    queryKey: ['clientPortalData', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return null;
      const clients = await base44.entities.Client.filter({ email: currentUser.email });
      return clients[0] || null;
    },
    enabled: !!currentUser?.email
  });

  // Also check for portal user (for non-clients/leads)
  const { data: portalUser } = useQuery({
    queryKey: ['portalUser', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return null;
      const users = await base44.entities.PortalUser.filter({ email: currentUser.email });
      return users[0] || null;
    },
    enabled: !!currentUser?.email && !clientData
  });

  // Get agent info
  const { data: agent } = useQuery({
    queryKey: ['clientAgent', clientData?.agent_id],
    queryFn: async () => {
      if (!clientData?.agent_id) return null;
      const agents = await base44.entities.Agent.filter({ id: clientData.agent_id });
      return agents[0] || null;
    },
    enabled: !!clientData?.agent_id
  });

  // Get onboarding tasks
  const { data: onboardingTasks = [] } = useQuery({
    queryKey: ['clientOnboardingTasks', clientData?.id],
    queryFn: () => clientData 
      ? base44.entities.ClientOnboardingTask.filter({ client_id: clientData.id }, 'days_from_start')
      : [],
    enabled: !!clientData?.id
  });

  // Get messages/interactions
  const { data: interactions = [] } = useQuery({
    queryKey: ['clientInteractions', clientData?.id],
    queryFn: () => clientData
      ? base44.entities.ClientInteraction.filter({ client_id: clientData.id }, '-created_date')
      : [],
    enabled: !!clientData?.id
  });

  const isLoading = userLoading || clientLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
      </div>
    );
  }

  // Use client data or portal user data
  const userData = clientData || portalUser;
  const isClient = !!clientData;
  const isProspect = !clientData && !!portalUser;

  if (!userData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-0 shadow-lg dark:bg-slate-800">
          <CardContent className="pt-8 pb-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
              <Shield className="w-8 h-8 text-teal-600" />
            </div>
            <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">Welcome!</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-4">
              Create a free account to access plan comparison tools, benefits assistance, and more.
            </p>
            <div className="space-y-2">
              <Button 
                onClick={() => window.location.href = createPageUrl('PortalSignup')} 
                className="w-full bg-teal-600 hover:bg-teal-700"
              >
                Create Free Account
              </Button>
              <Button onClick={() => base44.auth.logout()} variant="outline" className="w-full">
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const completedTasks = onboardingTasks.filter(t => t.status === 'completed').length;
  const totalTasks = onboardingTasks.length;
  const onboardingProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const planTypeLabels = {
    medicare_advantage: 'Medicare Advantage',
    supplement: 'Medicare Supplement',
    pdp: 'Prescription Drug Plan',
    ancillary: 'Ancillary Coverage',
    other: 'Other',
    none: 'Not Enrolled',
    unknown: 'Unknown'
  };

  const handleRequestAgent = () => {
    setActiveTab('appointments');
  };

  const displayName = isClient ? clientData.first_name : portalUser.first_name;
  const displayPlanType = isClient ? clientData.plan_type : portalUser.plan_type;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b dark:border-slate-700 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-slate-800 dark:text-white">My Insurance Portal</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Welcome, {displayName}
                  {isProspect && <Badge className="ml-2 bg-blue-100 text-blue-700">Free Account</Badge>}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowChatbot(true)}
                className="gap-2"
              >
                <Bot className="w-4 h-4" />
                <span className="hidden sm:inline">Ask AI Assistant</span>
              </Button>
              <Button variant="ghost" size="sm" onClick={() => base44.auth.logout()}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-0 shadow-sm dark:bg-slate-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Plan Type</p>
                    <p className="font-semibold text-slate-800 dark:text-white text-sm">
                      {planTypeLabels[displayPlanType] || 'Not Set'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {isClient && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="border-0 shadow-sm dark:bg-slate-800">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Onboarding</p>
                      <p className="font-semibold text-slate-800 dark:text-white text-sm">{onboardingProgress}% Complete</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="border-0 shadow-sm dark:bg-slate-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{isClient ? 'Effective Date' : 'AEP Dates'}</p>
                    <p className="font-semibold text-slate-800 dark:text-white text-sm">
                      {isClient && clientData.effective_date 
                        ? format(new Date(clientData.effective_date), 'MMM d, yyyy')
                        : 'Oct 15 - Dec 7'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="border-0 shadow-sm dark:bg-slate-800 cursor-pointer hover:border-teal-300" onClick={() => setActiveTab('appointments')}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                    <User className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Agent Help</p>
                    <p className="font-semibold text-slate-800 dark:text-white text-sm">
                      {agent ? `${agent.first_name} ${agent.last_name}` : 'Talk to Agent'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white dark:bg-slate-800 shadow-sm p-1 rounded-xl flex-wrap h-auto gap-1">
            <TabsTrigger value="overview" className="rounded-lg gap-2">
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            {isClient && (
              <TabsTrigger value="policy" className="rounded-lg gap-2">
                <Shield className="w-4 h-4" />
                <span className="hidden sm:inline">My Policy</span>
              </TabsTrigger>
            )}
            <TabsTrigger value="drugs" className="rounded-lg gap-2">
              <Pill className="w-4 h-4" />
              <span className="hidden sm:inline">Drugs</span>
            </TabsTrigger>
            <TabsTrigger value="doctors" className="rounded-lg gap-2">
              <Stethoscope className="w-4 h-4" />
              <span className="hidden sm:inline">Doctors</span>
            </TabsTrigger>
            <TabsTrigger value="benefits" className="rounded-lg gap-2">
              <HandHeart className="w-4 h-4" />
              <span className="hidden sm:inline">Assistance</span>
            </TabsTrigger>
            <TabsTrigger value="govt-programs" className="rounded-lg gap-2">
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">Govt Programs</span>
            </TabsTrigger>
            <TabsTrigger value="plan-fit" className="rounded-lg gap-2">
              <ClipboardCheck className="w-4 h-4" />
              <span className="hidden sm:inline">Plan Fit</span>
            </TabsTrigger>
            <TabsTrigger value="appointments" className="rounded-lg gap-2">
              <CalendarDays className="w-4 h-4" />
              <span className="hidden sm:inline">Appointments</span>
            </TabsTrigger>
            {isClient && (
              <>
                <TabsTrigger value="usage" className="rounded-lg gap-2">
                  <Activity className="w-4 h-4" />
                  <span className="hidden sm:inline">Usage</span>
                </TabsTrigger>
                <TabsTrigger value="documents" className="rounded-lg gap-2">
                  <FileText className="w-4 h-4" />
                  <span className="hidden sm:inline">Documents</span>
                </TabsTrigger>
              </>
            )}
            <TabsTrigger value="card-scan" className="rounded-lg gap-2">
              <CreditCard className="w-4 h-4" />
              <span className="hidden sm:inline">Scan Card</span>
            </TabsTrigger>
            <TabsTrigger value="health" className="rounded-lg gap-2">
              <Heart className="w-4 h-4" />
              <span className="hidden sm:inline">Health</span>
            </TabsTrigger>
            <TabsTrigger value="coach" className="rounded-lg gap-2">
              <Bot className="w-4 h-4" />
              <span className="hidden sm:inline">Coach</span>
            </TabsTrigger>
            <TabsTrigger value="telehealth" className="rounded-lg gap-2">
              <Video className="w-4 h-4" />
              <span className="hidden sm:inline">Telehealth</span>
            </TabsTrigger>
            <TabsTrigger value="recommendations" className="rounded-lg gap-2">
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">Recommendations</span>
            </TabsTrigger>
            <TabsTrigger value="secure-docs" className="rounded-lg gap-2">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Secure Docs</span>
            </TabsTrigger>
            <TabsTrigger value="faq" className="rounded-lg gap-2">
              <HelpCircle className="w-4 h-4" />
              <span className="hidden sm:inline">FAQ</span>
            </TabsTrigger>
            <TabsTrigger value="booking" className="rounded-lg gap-2">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Book Agent</span>
            </TabsTrigger>
            </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Overview */}
              <div className="lg:col-span-2 space-y-6">
                {/* Health Alerts */}
                <HealthAlertNotifications 
                  client={clientData} 
                  portalUser={portalUser}
                  conditions={userConditions}
                  onNavigate={(tab) => setActiveTab(tab)}
                  onTalkToCoach={(alert) => {
                    setCoachAlertContext(alert);
                    setActiveTab('coach');
                  }}
                />

                {/* Welcome Card */}
                <Card className="border-0 shadow-sm overflow-hidden dark:bg-slate-800">
                  <div className="bg-gradient-to-r from-teal-500 to-emerald-600 p-6 text-white">
                    <h2 className="text-xl font-semibold mb-2">
                      Welcome to Your Insurance Portal
                    </h2>
                    <p className="text-teal-100 text-sm">
                      Track your coverage, complete onboarding tasks, and stay connected with your agent.
                    </p>
                  </div>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <button 
                        onClick={() => setActiveTab('drugs')}
                        className="p-4 rounded-xl border dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all text-left group"
                      >
                        <Pill className="w-8 h-8 text-purple-600 mb-2 group-hover:scale-110 transition-transform" />
                        <p className="font-medium text-slate-800 dark:text-white">Drug Lookup</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Check coverage & interactions</p>
                      </button>
                      <button 
                        onClick={() => setActiveTab('doctors')}
                        className="p-4 rounded-xl border dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-left group"
                      >
                        <Stethoscope className="w-8 h-8 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
                        <p className="font-medium text-slate-800 dark:text-white">Find Doctors</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">In-network providers</p>
                      </button>
                      <button 
                        onClick={() => setActiveTab('benefits')}
                        className="p-4 rounded-xl border dark:border-slate-700 hover:border-green-300 dark:hover:border-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all text-left group"
                      >
                        <HandHeart className="w-8 h-8 text-green-600 mb-2 group-hover:scale-110 transition-transform" />
                        <p className="font-medium text-slate-800 dark:text-white">Benefits Help</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Find assistance programs</p>
                      </button>
                      <button 
                        onClick={() => setActiveTab('plan-fit')}
                        className="p-4 rounded-xl border dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all text-left group"
                      >
                        <ClipboardCheck className="w-8 h-8 text-amber-600 mb-2 group-hover:scale-110 transition-transform" />
                        <p className="font-medium text-slate-800 dark:text-white">Plan Fit Check</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Find the best plan</p>
                      </button>
                      <button 
                        onClick={() => setActiveTab('card-scan')}
                        className="p-4 rounded-xl border dark:border-slate-700 hover:border-teal-300 dark:hover:border-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-all text-left group"
                      >
                        <CreditCard className="w-8 h-8 text-teal-600 mb-2 group-hover:scale-110 transition-transform" />
                        <p className="font-medium text-slate-800 dark:text-white">Scan Card</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Upload insurance card</p>
                      </button>
                      <button 
                        onClick={() => setActiveTab('appointments')}
                        className="p-4 rounded-xl border dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all text-left group"
                      >
                        <CalendarDays className="w-8 h-8 text-indigo-600 mb-2 group-hover:scale-110 transition-transform" />
                        <p className="font-medium text-slate-800 dark:text-white">Schedule</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Book with agent</p>
                      </button>
                      <button 
                        onClick={() => setShowChatbot(true)}
                        className="p-4 rounded-xl border dark:border-slate-700 hover:border-pink-300 dark:hover:border-pink-600 hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-all text-left group"
                      >
                        <Bot className="w-8 h-8 text-pink-600 mb-2 group-hover:scale-110 transition-transform" />
                        <p className="font-medium text-slate-800 dark:text-white">AI Assistant</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Get instant answers</p>
                      </button>
                      <button 
                        onClick={() => setActiveTab('health')}
                        className="p-4 rounded-xl border dark:border-slate-700 hover:border-red-300 dark:hover:border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all text-left group"
                      >
                        <Heart className="w-8 h-8 text-red-500 mb-2 group-hover:scale-110 transition-transform" />
                        <p className="font-medium text-slate-800 dark:text-white">Health Content</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Personalized for you</p>
                      </button>
                      {isClient && (
                        <button 
                          onClick={() => setActiveTab('usage')}
                          className="p-4 rounded-xl border dark:border-slate-700 hover:border-rose-300 dark:hover:border-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all text-left group"
                        >
                          <Activity className="w-8 h-8 text-rose-600 mb-2 group-hover:scale-110 transition-transform" />
                          <p className="font-medium text-slate-800 dark:text-white">Benefit Usage</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Track your benefits</p>
                        </button>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card className="border-0 shadow-sm dark:bg-slate-800">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Clock className="w-5 h-5 text-slate-400" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {interactions.length === 0 ? (
                      <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
                        No recent activity
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {interactions.slice(0, 5).map((interaction) => (
                          <div key={interaction.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0">
                              {interaction.interaction_type === 'call' && <Phone className="w-4 h-4 text-slate-600 dark:text-slate-400" />}
                              {interaction.interaction_type === 'email' && <Mail className="w-4 h-4 text-slate-600 dark:text-slate-400" />}
                              {!['call', 'email'].includes(interaction.interaction_type) && <MessageSquare className="w-4 h-4 text-slate-600 dark:text-slate-400" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-800 dark:text-white truncate">
                                {interaction.subject || `${interaction.interaction_type} interaction`}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {format(new Date(interaction.created_date), 'MMM d, yyyy')}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Agent Contact Sidebar */}
              <div className="space-y-6">
                {/* Benefit Reminders */}
                {(clientData || portalUser) && (
                  <BenefitReminders portalUserId={portalUser?.id || clientData?.id} />
                )}
                <Card className="border-0 shadow-sm dark:bg-slate-800">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Your Agent</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {agent ? (
                      <div className="text-center">
                        <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white text-xl font-semibold mb-3">
                          {agent.first_name?.[0]}{agent.last_name?.[0]}
                        </div>
                        <p className="font-semibold text-slate-800 dark:text-white">
                          {agent.first_name} {agent.last_name}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Licensed Insurance Agent</p>
                        
                        <div className="space-y-2">
                          {agent.phone && (
                            <a 
                              href={`tel:${agent.phone}`}
                              className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm"
                            >
                              <Phone className="w-4 h-4 text-teal-600" />
                              <span className="text-slate-700 dark:text-slate-300">{agent.phone}</span>
                            </a>
                          )}
                          {agent.email && (
                            <a 
                              href={`mailto:${agent.email}`}
                              className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm"
                            >
                              <Mail className="w-4 h-4 text-teal-600" />
                              <span className="text-slate-700 dark:text-slate-300 truncate">{agent.email}</span>
                            </a>
                          )}
                        </div>

                        <Button 
                          className="w-full mt-4 bg-teal-600 hover:bg-teal-700"
                          onClick={() => document.querySelector('[value="messages"]')?.click()}
                        >
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Send Message
                        </Button>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
                        Agent information loading...
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Upcoming Tasks */}
                <Card className="border-0 shadow-sm dark:bg-slate-800">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Clock className="w-5 h-5 text-slate-400" />
                      Upcoming Tasks
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {onboardingTasks.filter(t => t.status !== 'completed').length === 0 ? (
                      <div className="text-center py-4">
                        <CheckCircle className="w-10 h-10 mx-auto text-green-500 mb-2" />
                        <p className="text-sm text-slate-500 dark:text-slate-400">All tasks completed!</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {onboardingTasks
                          .filter(t => t.status !== 'completed')
                          .slice(0, 3)
                          .map(task => (
                            <div key={task.id} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                              <p className="text-sm font-medium text-slate-800 dark:text-white">{task.title}</p>
                              {task.due_date && (
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                  Due: {format(new Date(task.due_date), 'MMM d')}
                                </p>
                              )}
                            </div>
                          ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {isClient && (
            <TabsContent value="policy">
              <ClientPortalPolicyView client={clientData} agent={agent} />
            </TabsContent>
          )}

          <TabsContent value="drugs">
            <DrugLookupTool client={clientData} portalUser={portalUser} />
          </TabsContent>

          <TabsContent value="doctors">
            <ProviderSearch client={clientData} portalUser={portalUser} />
          </TabsContent>

          <TabsContent value="benefits">
            <BenefitsAssistance client={clientData} portalUser={portalUser} />
          </TabsContent>

          <TabsContent value="govt-programs">
            <GovtBenefitsScreening portalUser={portalUser || clientData} />
          </TabsContent>

          <TabsContent value="plan-fit">
            <div className="space-y-6">
              <PlanCompatibilityWizard 
                client={clientData} 
                portalUser={portalUser}
                agent={agent}
                onRequestAgent={handleRequestAgent}
              />
              <AnnualEnrollmentWizard
                client={clientData}
                portalUser={portalUser}
                agent={agent}
                onRequestAgent={handleRequestAgent}
              />
            </div>
          </TabsContent>

          <TabsContent value="appointments">
            <AppointmentScheduler client={clientData} portalUser={portalUser} agent={agent} />
          </TabsContent>

          {isClient && (
            <>
              <TabsContent value="usage">
                <BenefitUsageTracker client={clientData} onNavigate={(tab) => setActiveTab(tab)} />
              </TabsContent>

              <TabsContent value="onboarding">
                <ClientPortalOnboarding 
                  client={clientData} 
                  tasks={onboardingTasks}
                  onTaskComplete={() => queryClient.invalidateQueries(['clientOnboardingTasks'])}
                />
              </TabsContent>

              <TabsContent value="documents">
                <div className="space-y-6">
                  <AIDocumentUploadEnhanced 
                    clientId={clientData?.id || portalUser?.id}
                    onUploadComplete={() => queryClient.invalidateQueries(['aiDocuments'])}
                  />
                  <AIDocumentSearchPanel clientId={clientData?.id || portalUser?.id} />
                </div>
              </TabsContent>

              <TabsContent value="messages">
                <ClientPortalMessages 
                  client={clientData} 
                  agent={agent}
                  interactions={interactions}
                />
              </TabsContent>
            </>
          )}

          <TabsContent value="card-scan">
            <InsuranceCardScanner 
              client={clientData} 
              portalUser={portalUser}
              onScanComplete={() => queryClient.invalidateQueries(['clientPortalData'])}
            />
          </TabsContent>

          <TabsContent value="health">
            <div className="space-y-6">
              <PersonalizedHealthContent 
                client={clientData} 
                portalUser={portalUser}
                onConditionsChange={setUserConditions}
              />
            </div>
          </TabsContent>

          <TabsContent value="coach">
            <AIWellnessCoach 
              client={clientData} 
              portalUser={portalUser}
              conditions={userConditions}
              initialAlertContext={coachAlertContext}
            />
          </TabsContent>

          <TabsContent value="telehealth">
            <TelehealthScheduler 
              client={clientData} 
              portalUser={portalUser}
              agent={agent}
            />
          </TabsContent>

          <TabsContent value="recommendations">
            <ClientPolicyRecommendationPanel 
              clientId={clientData?.id}
              portalUserId={portalUser?.id}
            />
          </TabsContent>

          <TabsContent value="secure-docs">
            <SecureDocumentCenter 
              portalUserId={portalUser?.id}
              clientId={clientData?.id}
            />
          </TabsContent>

          <TabsContent value="faq">
            <AIFAQAssistant 
              clientId={clientData?.id}
              planType={clientData?.plan_type || portalUser?.plan_type}
            />
          </TabsContent>

          <TabsContent value="booking">
            <AppointmentBooking 
              clientId={clientData?.id}
              agentId={agent?.id}
              clientEmail={clientData?.email || portalUser?.email}
              clientName={`${clientData?.first_name || portalUser?.first_name} ${clientData?.last_name || portalUser?.last_name}`}
            />
          </TabsContent>
          </Tabs>
      </div>

      {/* AI Chatbot */}
      <ClientPortalChatbot 
        open={showChatbot}
        onClose={() => setShowChatbot(false)}
        client={clientData || portalUser}
        agent={agent}
      />
    </div>
  );
}