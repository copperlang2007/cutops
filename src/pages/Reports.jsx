import { useState, useMemo } from 'react'
import { base44 } from '@/api/base44Client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format, subDays, differenceInDays } from 'date-fns'
import { 
  BarChart3, Users, Shield, FileSignature, TrendingUp, Download,
  Calendar, Filter, AlertTriangle, CheckCircle, Clock, Sparkles, Loader2
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import ReportMetricCard from '../components/reports/ReportMetricCard';
import AIReportSummary from '../components/reports/AIReportSummary';
import ReportFilters from '../components/reports/ReportFilters';
import ReportExport from '../components/reports/ReportExport';
import AIPredictiveAnalytics from '../components/reports/AIPredictiveAnalytics';
import AIAnomalyDetection from '../components/reports/AIAnomalyDetection';
import AIReportGenerator from '../components/reports/AIReportGenerator';
import AIReportBuilder from '../components/reports/AIReportBuilder';
import AutomatedReportScheduler from '../components/reports/AutomatedReportScheduler';
import AILeadScoring from '../components/ai/AILeadScoring';
import AIChurnPrevention from '../components/ai/AIChurnPrevention';
import CompetitiveBenchmark from '../components/analytics/CompetitiveBenchmark';
import ROIDashboard from '../components/analytics/ROIDashboard';
import CampaignManager from '../components/campaigns/CampaignManager';
import AuditTrailViewer from '../components/compliance/AuditTrailViewer';
import HierarchyManager from '../components/hierarchy/HierarchyManager';
import AITaskAutomationEngine from '../components/automation/AITaskAutomationEngine';
import CarrierAPIHub from '../components/integrations/CarrierAPIHub';
import CRMIntegration from '../components/crm/CRMIntegration';
import ESignatureIntegration from '../components/integrations/ESignatureIntegration';
import WhiteLabelPortal from '../components/portal/WhiteLabelPortal';
import AgentMobilePortal from '../components/mobile/AgentMobilePortal';
import TeamPerformanceMatrix from '../components/analytics/TeamPerformanceMatrix';
import SmartNotifications from '../components/notifications/SmartNotifications';
import AICoachingEngine from '../components/coaching/AICoachingEngine';
import AdvancedTaskAutomation from '../components/automation/AdvancedTaskAutomation';
import AgentGamification from '../components/gamification/AgentGamification';
import TerritoryManager from '../components/territory/TerritoryManager';
import RegulatoryCalendar from '../components/compliance/RegulatoryCalendar';
import BulkOperations from '../components/bulk/BulkOperations';
import EnhancedCommissionReconciliation from '../components/ai/EnhancedCommissionReconciliation';
import ExpandedPredictiveAnalytics from '../components/analytics/ExpandedPredictiveAnalytics';
import SmartCarrierIntegration from '../components/integrations/SmartCarrierIntegration';
import RoleGuard from '../components/shared/RoleGuard';

const COLORS = ['#0d9488', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function Reports() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    dateRange: '30',
    startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    statusFilter: 'all',
    selectedAgents: [],
    selectedCarriers: [],
    contractStatus: 'all'
  });

  const { data: agents = [] } = useQuery({
    queryKey: ['agents'],
    queryFn: () => base44.entities.Agent.list()
  });

  const { data: licenses = [] } = useQuery({
    queryKey: ['licenses'],
    queryFn: () => base44.entities.License.list()
  });

  const { data: contracts = [] } = useQuery({
    queryKey: ['contracts'],
    queryFn: () => base44.entities.Contract.list()
  });

  const { data: checklistItems = [] } = useQuery({
    queryKey: ['allChecklists'],
    queryFn: () => base44.entities.OnboardingChecklist.list()
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => base44.entities.Alert.list()
  });

  const { data: carriers = [] } = useQuery({
    queryKey: ['carriers'],
    queryFn: () => base44.entities.Carrier.list()
  });

  const { data: savedReports = [] } = useQuery({
    queryKey: ['savedReports'],
    queryFn: () => base44.entities.SavedReport.list('-created_date')
  });

  const { data: commissions = [] } = useQuery({
    queryKey: ['commissions'],
    queryFn: () => base44.entities.Commission.list()
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list()
  });

  const saveReportMutation = useMutation({
    mutationFn: (data) => base44.entities.SavedReport.create(data),
    onSuccess: () => queryClient.invalidateQueries(['savedReports'])
  });

  const handleLoadReport = (report) => {
    setFilters({
      ...report.filters,
      dateRange: report.date_range_type,
      startDate: report.start_date || filters.startDate,
      endDate: report.end_date || filters.endDate
    });
  };

  const filteredAgents = useMemo(() => {
    let filtered = agents;
    if (filters.statusFilter !== 'all') {
      filtered = filtered.filter(a => a.onboarding_status === filters.statusFilter);
    }
    if (filters.selectedAgents?.length > 0) {
      filtered = filtered.filter(a => filters.selectedAgents.includes(a.id));
    }
    return filtered;
  }, [agents, filters.statusFilter, filters.selectedAgents]);

  const filteredContracts = useMemo(() => {
    let filtered = contracts;
    if (filters.selectedCarriers?.length > 0) {
      filtered = filtered.filter(c => filters.selectedCarriers.includes(c.carrier_name));
    }
    if (filters.contractStatus !== 'all') {
      if (filters.contractStatus === 'active') {
        filtered = filtered.filter(c => ['active', 'contract_signed'].includes(c.contract_status));
      } else if (filters.contractStatus === 'pending') {
        filtered = filtered.filter(c => ['pending_submission', 'submitted', 'pending_carrier_review'].includes(c.contract_status));
      } else {
        filtered = filtered.filter(c => c.contract_status === filters.contractStatus);
      }
    }
    if (filters.selectedAgents?.length > 0) {
      filtered = filtered.filter(c => filters.selectedAgents.includes(c.agent_id));
    }
    return filtered;
  }, [contracts, filters]);

  const filteredLicenses = useMemo(() => {
    let filtered = licenses;
    if (filters.selectedAgents?.length > 0) {
      filtered = filtered.filter(l => filters.selectedAgents.includes(l.agent_id));
    }
    return filtered;
  }, [licenses, filters.selectedAgents]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalAgents = filteredAgents.length;
    const readyToSell = filteredAgents.filter(a => a.onboarding_status === 'ready_to_sell').length;
    const inProgress = filteredAgents.filter(a => a.onboarding_status === 'in_progress').length;
    
    // Onboarding completion rate
    const relevantChecklists = filters.selectedAgents?.length > 0
      ? checklistItems.filter(c => filters.selectedAgents.includes(c.agent_id))
      : checklistItems;
    const agentsWithChecklists = [...new Set(relevantChecklists.map(c => c.agent_id))];
    const completionRates = agentsWithChecklists.map(agentId => {
      const items = relevantChecklists.filter(c => c.agent_id === agentId);
      const completed = items.filter(c => c.is_completed).length;
      return items.length > 0 ? (completed / items.length) * 100 : 0;
    });
    const avgCompletionRate = completionRates.length > 0 
      ? Math.round(completionRates.reduce((a, b) => a + b, 0) / completionRates.length)
      : 0;

    // License compliance
    const activeLicenses = filteredLicenses.filter(l => l.status === 'active').length;
    const expiringLicenses = filteredLicenses.filter(l => {
      if (!l.expiration_date) return false;
      const days = differenceInDays(new Date(l.expiration_date), new Date());
      return days > 0 && days <= 60;
    }).length;
    const expiredLicenses = filteredLicenses.filter(l => l.status === 'expired').length;

    // Contract status
    const activeContracts = filteredContracts.filter(c => ['active', 'contract_signed'].includes(c.contract_status)).length;
    const pendingContracts = filteredContracts.filter(c => 
      ['pending_submission', 'submitted', 'pending_carrier_review'].includes(c.contract_status)
    ).length;
    const actionRequired = filteredContracts.filter(c => c.contract_status === 'requires_correction').length;

    // Alerts
    const relevantAlerts = filters.selectedAgents?.length > 0
      ? alerts.filter(a => filters.selectedAgents.includes(a.agent_id))
      : alerts;
    const activeAlerts = relevantAlerts.filter(a => !a.is_resolved).length;
    const criticalAlerts = relevantAlerts.filter(a => !a.is_resolved && a.severity === 'critical').length;

    return {
      totalAgents,
      readyToSell,
      inProgress,
      readyToSellRate: totalAgents > 0 ? Math.round((readyToSell / totalAgents) * 100) : 0,
      avgCompletionRate,
      activeLicenses,
      expiringLicenses,
      expiredLicenses,
      licenseComplianceRate: filteredLicenses.length > 0 ? Math.round((activeLicenses / filteredLicenses.length) * 100) : 0,
      activeContracts,
      pendingContracts,
      actionRequired,
      activeAlerts,
      criticalAlerts
    };
  }, [filteredAgents, checklistItems, filteredLicenses, filteredContracts, alerts, filters]);

  // Chart data
  const onboardingStatusData = useMemo(() => [
    { name: 'Ready to Sell', value: filteredAgents.filter(a => a.onboarding_status === 'ready_to_sell').length },
    { name: 'In Progress', value: filteredAgents.filter(a => a.onboarding_status === 'in_progress').length },
    { name: 'Pending', value: filteredAgents.filter(a => a.onboarding_status === 'pending').length },
    { name: 'Suspended', value: filteredAgents.filter(a => a.onboarding_status === 'suspended').length }
  ].filter(d => d.value > 0), [filteredAgents]);

  const contractStatusData = useMemo(() => [
    { name: 'Active', value: filteredContracts.filter(c => c.contract_status === 'active').length },
    { name: 'Signed', value: filteredContracts.filter(c => c.contract_status === 'contract_signed').length },
    { name: 'Pending', value: filteredContracts.filter(c => ['pending_submission', 'submitted', 'pending_carrier_review'].includes(c.contract_status)).length },
    { name: 'Action Required', value: filteredContracts.filter(c => c.contract_status === 'requires_correction').length }
  ].filter(d => d.value > 0), [filteredContracts]);

  const licenseByStateData = useMemo(() => {
    const stateCount = {};
    filteredLicenses.forEach(l => {
      stateCount[l.state] = (stateCount[l.state] || 0) + 1;
    });
    return Object.entries(stateCount)
      .map(([state, count]) => ({ state, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [filteredLicenses]);

  return (
    <RoleGuard requiredRole="admin" pageName="Reports">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Reports & Analytics</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Agent performance and operational insights</p>
          </div>
          <ReportExport 
            metrics={metrics}
            agents={filteredAgents}
            licenses={filteredLicenses}
            contracts={filteredContracts}
            filters={filters}
          />
        </div>

        {/* Filters */}
        <div className="mb-6">
          <ReportFilters
            filters={filters}
            onFiltersChange={setFilters}
            agents={agents}
            carriers={carriers}
            savedReports={savedReports}
            onSaveReport={(data) => saveReportMutation.mutate(data)}
            onLoadReport={handleLoadReport}
          />
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <ReportMetricCard
            title="Total Agents"
            value={metrics.totalAgents}
            icon={Users}
            color="teal"
          />
          <ReportMetricCard
            title="Ready to Sell"
            value={`${metrics.readyToSellRate}%`}
            subtitle={`${metrics.readyToSell} agents`}
            icon={CheckCircle}
            color="green"
          />
          <ReportMetricCard
            title="Avg Onboarding"
            value={`${metrics.avgCompletionRate}%`}
            subtitle="completion rate"
            icon={TrendingUp}
            color="blue"
          />
          <ReportMetricCard
            title="Active Alerts"
            value={metrics.activeAlerts}
            subtitle={`${metrics.criticalAlerts} critical`}
            icon={AlertTriangle}
            color={metrics.criticalAlerts > 0 ? 'red' : 'slate'}
          />
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-white shadow-sm p-1 rounded-xl flex-wrap">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="predictive">Predictive AI</TabsTrigger>
            <TabsTrigger value="automation">Automation</TabsTrigger>
            <TabsTrigger value="territory">Territory</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
            <TabsTrigger value="ai-tools">AI Tools</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Onboarding Status Chart */}
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Agent Onboarding Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={onboardingStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {onboardingStatusData.map((entry, index) => (
                          <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Contract Status Chart */}
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Contract Status Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={contractStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {contractStatusData.map((entry, index) => (
                          <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Compliance Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-slate-700">License Compliance</h3>
                    <Shield className="w-5 h-5 text-teal-600" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-500">Active</span>
                      <Badge className="bg-emerald-100 text-emerald-700">{metrics.activeLicenses}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-500">Expiring Soon</span>
                      <Badge className="bg-amber-100 text-amber-700">{metrics.expiringLicenses}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-500">Expired</span>
                      <Badge className="bg-red-100 text-red-700">{metrics.expiredLicenses}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-slate-700">Contract Status</h3>
                    <FileSignature className="w-5 h-5 text-teal-600" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-500">Active</span>
                      <Badge className="bg-emerald-100 text-emerald-700">{metrics.activeContracts}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-500">Pending</span>
                      <Badge className="bg-blue-100 text-blue-700">{metrics.pendingContracts}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-500">Action Required</span>
                      <Badge className="bg-red-100 text-red-700">{metrics.actionRequired}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-slate-700">Team Productivity</h3>
                    <TrendingUp className="w-5 h-5 text-teal-600" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-500">In Progress</span>
                      <Badge className="bg-blue-100 text-blue-700">{metrics.inProgress}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-500">Completion Rate</span>
                      <Badge className="bg-teal-100 text-teal-700">{metrics.avgCompletionRate}%</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-500">Open Alerts</span>
                      <Badge className={metrics.activeAlerts > 5 ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-700"}>
                        {metrics.activeAlerts}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="licenses">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Licenses by State</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={licenseByStateData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="state" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#0d9488" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contracts">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Contract Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-slate-500">
                  Contract analytics and commission tracking will be displayed here
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="predictive">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ExpandedPredictiveAnalytics
                agents={agents}
                licenses={licenses}
                contracts={contracts}
                commissions={commissions}
                checklistItems={checklistItems}
                tasks={tasks}
                alerts={alerts}
                onCreateTask={async (taskData) => {
                  await base44.entities.Task.create(taskData);
                  queryClient.invalidateQueries(['tasks']);
                }}
              />
              <div className="space-y-6">
                <ROIDashboard
                  agents={agents}
                  commissions={commissions}
                  checklistItems={checklistItems}
                />
                <CompetitiveBenchmark
                  agents={agents}
                  licenses={licenses}
                  contracts={contracts}
                  commissions={commissions}
                />
                <TeamPerformanceMatrix
                  agents={agents}
                  commissions={commissions}
                  licenses={licenses}
                  contracts={contracts}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="automation">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AITaskAutomationEngine
                agents={agents}
                licenses={licenses}
                contracts={contracts}
                alerts={alerts}
                checklistItems={checklistItems}
                commissions={commissions}
                onTaskCreated={() => queryClient.invalidateQueries(['tasks'])}
              />
              <div className="space-y-6">
                <AdvancedTaskAutomation
                  agents={agents}
                  licenses={licenses}
                  contracts={contracts}
                  alerts={alerts}
                  checklistItems={checklistItems}
                  commissions={commissions}
                  onTaskCreated={() => queryClient.invalidateQueries(['tasks'])}
                />
                <SmartNotifications />
                <BulkOperations 
                  agents={agents}
                  licenses={licenses}
                  contracts={contracts}
                  onComplete={() => queryClient.invalidateQueries(['agents'])}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="territory">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TerritoryManager
                agents={agents}
                licenses={licenses}
                commissions={commissions}
                contracts={contracts}
              />
              <HierarchyManager agents={agents} />
            </div>
          </TabsContent>

          <TabsContent value="integrations">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CarrierAPIHub 
                onDataSynced={() => {
                  queryClient.invalidateQueries(['commissions']);
                  queryClient.invalidateQueries(['contracts']);
                }}
              />
              <CRMIntegration 
                agents={agents}
                onSync={() => queryClient.invalidateQueries(['agents'])}
              />
              <ESignatureIntegration 
                agent={agents[0]}
                contracts={contracts}
                onDocumentSigned={() => queryClient.invalidateQueries(['contracts'])}
              />
              <div className="space-y-6">
                <AgentMobilePortal 
                  agent={agents[0]}
                  checklistItems={checklistItems}
                  commissions={commissions}
                  licenses={licenses}
                />
                <WhiteLabelPortal />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="campaigns">
            <CampaignManager agents={agents} />
          </TabsContent>

          <TabsContent value="compliance">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RegulatoryCalendar
                licenses={licenses}
                contracts={contracts}
                alerts={alerts}
                agents={agents}
              />
              <AuditTrailViewer />
            </div>
          </TabsContent>

          <TabsContent value="ai-tools">
            <div className="space-y-6">
              {/* Automated Report Scheduler */}
              <AutomatedReportScheduler />

              {/* AI Report Builder */}
              <AIReportBuilder />

              {/* AI Report Generator */}
              <AIReportGenerator
                agents={agents}
                commissions={commissions}
                contracts={contracts}
                licenses={licenses}
                carriers={carriers}
              />

              {/* AI Analytics Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AIPredictiveAnalytics
                  agents={agents}
                  commissions={commissions}
                  contracts={contracts}
                  licenses={licenses}
                />
                <AIAnomalyDetection
                  agents={agents}
                  commissions={commissions}
                  appointments={[]}
                  contracts={contracts}
                  onCreateAlert={async (data) => {
                    await base44.entities.Alert.create(data);
                    queryClient.invalidateQueries(['alerts']);
                  }}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AICoachingEngine
                agent={agents[0]}
                licenses={licenses}
                contracts={contracts}
                commissions={commissions}
                policies={[]}
                alerts={alerts}
                leaderboardRank={1}
                teamAverages={{
                  avgCommission: commissions.reduce((s, c) => s + (c.amount || 0), 0) / Math.max(agents.length, 1),
                  avgPolicies: 10,
                  avgLicenses: Math.round(licenses.length / Math.max(agents.length, 1))
                }}
              />
              <AILeadScoring
                agents={agents}
                licenses={licenses}
                contracts={contracts}
                checklistItems={checklistItems}
              />
              <EnhancedCommissionReconciliation
                commissions={commissions}
                contracts={contracts}
                agents={agents}
              />
              <SmartCarrierIntegration
                agent={agents[0]}
                licenses={licenses}
                contracts={contracts}
                coachingWeaknesses={['Sales techniques', 'Compliance knowledge', 'Product expertise']}
                onCreateTask={async (taskData) => {
                  await base44.entities.Task.create(taskData);
                  queryClient.invalidateQueries(['tasks']);
                }}
              />
              <AIChurnPrevention
                agents={agents}
                licenses={licenses}
                contracts={contracts}
                tasks={tasks}
                commissions={commissions}
              />
              <AgentGamification
                agent={agents[0]}
                commissions={commissions}
                licenses={licenses}
                policies={[]}
                checklistItems={checklistItems}
              />
              <AIReportSummary 
                metrics={metrics}
                agents={filteredAgents}
                licenses={filteredLicenses}
                contracts={filteredContracts}
              />
              </div>
            </div>
          </TabsContent>
        </Tabs>
        </div>
      </div>
    </RoleGuard>
  );
}