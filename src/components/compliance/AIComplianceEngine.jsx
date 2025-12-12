import { useState, useEffect } from 'react'
import { base44 } from '@/api/base44Client'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Shield, AlertTriangle, CheckCircle, Clock, Loader2, RefreshCw,
  FileText, GraduationCap, AlertCircle, Eye, Zap, Calendar
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

const severityConfig = {
  critical: { color: 'bg-red-100 text-red-700 border-red-300', icon: AlertTriangle },
  high: { color: 'bg-orange-100 text-orange-700 border-orange-300', icon: AlertCircle },
  medium: { color: 'bg-amber-100 text-amber-700 border-amber-300', icon: Clock },
  low: { color: 'bg-blue-100 text-blue-700 border-blue-300', icon: Eye }
};

export default function AIComplianceEngine({ 
  agents, 
  licenses, 
  contracts, 
  clients,
  interactions,
  checklistItems,
  onCreateAlert,
  onCreateTask 
}) {
  const [complianceReport, setComplianceReport] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [autoMonitorEnabled, setAutoMonitorEnabled] = useState(true);
  const [lastScanTime, setLastScanTime] = useState(null);

  // Auto-scan on mount and periodically
  useEffect(() => {
    if (autoMonitorEnabled && agents.length > 0) {
      runComplianceAudit();
    }
  }, [agents.length, autoMonitorEnabled]);

  const runComplianceAudit = async () => {
    setIsAnalyzing(true);
    try {
      // Gather compliance data
      const complianceData = agents.map(agent => {
        const agentLicenses = licenses.filter(l => l.agent_id === agent.id);
        const agentContracts = contracts.filter(c => c.agent_id === agent.id);
        const agentClients = clients?.filter(c => c.agent_id === agent.id) || [];
        const agentInteractions = interactions?.filter(i => i.agent_id === agent.id) || [];
        const agentChecklist = checklistItems.filter(c => c.agent_id === agent.id);

        // License compliance
        const expiringLicenses = agentLicenses.filter(l => {
          if (!l.expiration_date) return false;
          const days = differenceInDays(new Date(l.expiration_date), new Date());
          return days > 0 && days <= 60;
        });
        const expiredLicenses = agentLicenses.filter(l => l.status === 'expired');
        const adverseActions = agentLicenses.filter(l => l.adverse_actions);

        // Certification compliance
        const ahipExpiring = agent.ahip_expiration_date && 
          differenceInDays(new Date(agent.ahip_expiration_date), new Date()) <= 30;
        const eoExpiring = agent.e_and_o_expiration && 
          differenceInDays(new Date(agent.e_and_o_expiration), new Date()) <= 30;

        // Client interaction compliance
        const overdueFollowups = agentClients.filter(c => {
          if (!c.next_follow_up) return false;
          return differenceInDays(new Date(), new Date(c.next_follow_up)) > 0;
        });
        const staleClients = agentClients.filter(c => {
          if (!c.last_contact_date) return true;
          return differenceInDays(new Date(), new Date(c.last_contact_date)) > 90;
        });

        // Contract compliance
        const pendingContracts = agentContracts.filter(c => 
          ['pending_submission', 'requires_correction'].includes(c.contract_status)
        );

        // Onboarding compliance
        const incompleteChecklist = agentChecklist.filter(c => !c.is_completed);
        const checklistProgress = agentChecklist.length > 0 
          ? (agentChecklist.filter(c => c.is_completed).length / agentChecklist.length) * 100 
          : 0;

        return {
          agent,
          issues: {
            expiringLicenses,
            expiredLicenses,
            adverseActions,
            ahipExpiring,
            eoExpiring,
            overdueFollowups,
            staleClients,
            pendingContracts,
            incompleteChecklist
          },
          metrics: {
            licenseCount: agentLicenses.length,
            activeLicenses: agentLicenses.filter(l => l.status === 'active').length,
            clientCount: agentClients.length,
            interactionCount: agentInteractions.length,
            checklistProgress
          }
        };
      });

      // Use AI to analyze and generate recommendations
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this compliance data for insurance agents and provide a comprehensive compliance report:

AGENT COMPLIANCE DATA:
${complianceData.map(d => `
Agent: ${d.agent.first_name} ${d.agent.last_name}
- Expiring Licenses: ${d.issues.expiringLicenses.length}
- Expired Licenses: ${d.issues.expiredLicenses.length}
- Adverse Actions: ${d.issues.adverseActions.length}
- AHIP Expiring: ${d.issues.ahipExpiring ? 'Yes' : 'No'}
- E&O Expiring: ${d.issues.eoExpiring ? 'Yes' : 'No'}
- Overdue Follow-ups: ${d.issues.overdueFollowups.length}
- Stale Clients (90+ days): ${d.issues.staleClients.length}
- Pending Contracts: ${d.issues.pendingContracts.length}
- Incomplete Checklist Items: ${d.issues.incompleteChecklist.length}
- Onboarding Progress: ${Math.round(d.metrics.checklistProgress)}%
`).join('\n')}

Generate:
1. Overall compliance score (0-100)
2. List of compliance issues with severity, agent affected, and recommended action
3. Suggested training for each issue type
4. Priority actions needed
5. Trend analysis and risk forecast`,
        response_json_schema: {
          type: "object",
          properties: {
            overall_score: { type: "number" },
            risk_level: { type: "string" },
            issues: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  agent_id: { type: "string" },
                  agent_name: { type: "string" },
                  issue_type: { type: "string" },
                  severity: { type: "string" },
                  description: { type: "string" },
                  recommended_action: { type: "string" },
                  deadline: { type: "string" },
                  training_needed: { type: "string" }
                }
              }
            },
            priority_actions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  action: { type: "string" },
                  urgency: { type: "string" },
                  affected_agents: { type: "number" }
                }
              }
            },
            training_recommendations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  training_type: { type: "string" },
                  target_agents: { type: "array", items: { type: "string" } },
                  priority: { type: "string" }
                }
              }
            },
            risk_forecast: { type: "string" },
            summary: { type: "string" }
          }
        }
      });

      // Map agent names to IDs
      result.issues = result.issues?.map(issue => ({
        ...issue,
        agent_id: complianceData.find(d => 
          `${d.agent.first_name} ${d.agent.last_name}` === issue.agent_name
        )?.agent.id
      })) || [];

      setComplianceReport({ ...result, rawData: complianceData });
      setLastScanTime(new Date());
      toast.success('Compliance audit completed');
    } catch (err) {
      console.error('Compliance audit failed:', err);
      toast.error('Failed to run compliance audit');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const createAlertFromIssue = async (issue) => {
    if (!onCreateAlert) return;
    
    try {
      await onCreateAlert({
        agent_id: issue.agent_id,
        alert_type: issue.issue_type.includes('license') ? 'license_expiring' : 
                    issue.issue_type.includes('ahip') ? 'ahip_expiring' :
                    issue.issue_type.includes('compliance') ? 'compliance_issue' : 'other',
        severity: issue.severity,
        title: issue.issue_type,
        message: `${issue.description}. Recommended: ${issue.recommended_action}`,
        due_date: issue.deadline
      });
      toast.success('Alert created');
    } catch (err) {
      toast.error('Failed to create alert');
    }
  };

  const createTaskFromIssue = async (issue) => {
    if (!onCreateTask) return;
    
    try {
      await onCreateTask({
        agent_id: issue.agent_id,
        title: `Compliance: ${issue.issue_type}`,
        description: `${issue.description}\n\nRecommended Action: ${issue.recommended_action}\n\nTraining Needed: ${issue.training_needed || 'None specified'}`,
        priority: issue.severity === 'critical' ? 'urgent' : issue.severity === 'high' ? 'high' : 'medium',
        due_date: issue.deadline,
        task_type: 'compliance',
        status: 'pending',
        auto_generated: true
      });
      toast.success('Task created');
    } catch (err) {
      toast.error('Failed to create task');
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
            <Shield className="w-5 h-5 text-blue-600" />
            AI Compliance Engine
            <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white ml-2">
              <Zap className="w-3 h-3 mr-1" />
              Auto-Monitor
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            {lastScanTime && (
              <span className="text-xs text-slate-400">
                Last scan: {format(lastScanTime, 'h:mm a')}
              </span>
            )}
            <Button
              size="sm"
              onClick={runComplianceAudit}
              disabled={isAnalyzing}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              <span className="ml-1">{isAnalyzing ? 'Scanning...' : 'Run Audit'}</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!complianceReport && !isAnalyzing && (
          <div className="text-center py-8 text-slate-400">
            <Shield className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Run a compliance audit to analyze agent data</p>
          </div>
        )}

        {isAnalyzing && (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-2" />
            <p className="text-sm text-slate-500">Analyzing compliance across {agents.length} agents...</p>
          </div>
        )}

        {complianceReport && (
          <div className="space-y-6">
            {/* Score Overview */}
            <div className="p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Overall Compliance Score</p>
                  <p className={`text-4xl font-bold ${getScoreColor(complianceReport.overall_score)}`}>
                    {complianceReport.overall_score}%
                  </p>
                </div>
                <Badge className={
                  complianceReport.risk_level === 'low' ? 'bg-emerald-100 text-emerald-700' :
                  complianceReport.risk_level === 'medium' ? 'bg-amber-100 text-amber-700' :
                  'bg-red-100 text-red-700'
                }>
                  {complianceReport.risk_level} risk
                </Badge>
              </div>
              <Progress 
                value={complianceReport.overall_score} 
                className="h-2 mt-3 [&>div]:bg-gradient-to-r [&>div]:from-blue-500 [&>div]:to-purple-500" 
              />
              <p className="text-sm text-slate-600 mt-3">{complianceReport.summary}</p>
            </div>

            <Tabs defaultValue="issues">
              <TabsList className="grid grid-cols-4 mb-4">
                <TabsTrigger value="issues">Issues ({complianceReport.issues?.length || 0})</TabsTrigger>
                <TabsTrigger value="actions">Priority Actions</TabsTrigger>
                <TabsTrigger value="training">Training</TabsTrigger>
                <TabsTrigger value="forecast">Risk Forecast</TabsTrigger>
              </TabsList>

              <TabsContent value="issues" className="space-y-2 max-h-[400px] overflow-y-auto">
                <AnimatePresence>
                  {complianceReport.issues?.map((issue, idx) => {
                    const config = severityConfig[issue.severity] || severityConfig.medium;
                    const Icon = config.icon;
                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className={`p-3 rounded-lg border ${config.color}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-2">
                            <Icon className="w-4 h-4 mt-0.5" />
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium">{issue.issue_type}</p>
                                <Badge variant="outline" className="text-xs">{issue.agent_name}</Badge>
                              </div>
                              <p className="text-xs mt-1">{issue.description}</p>
                              <p className="text-xs mt-1 opacity-75">
                                <strong>Action:</strong> {issue.recommended_action}
                              </p>
                              {issue.training_needed && (
                                <p className="text-xs mt-1 opacity-75">
                                  <GraduationCap className="w-3 h-3 inline mr-1" />
                                  {issue.training_needed}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => createAlertFromIssue(issue)}>
                              <AlertTriangle className="w-3 h-3" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => createTaskFromIssue(issue)}>
                              <FileText className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </TabsContent>

              <TabsContent value="actions" className="space-y-2">
                {complianceReport.priority_actions?.map((action, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-700">{action.action}</p>
                      <p className="text-xs text-slate-500">{action.affected_agents} agent(s) affected</p>
                    </div>
                    <Badge variant="outline" className={
                      action.urgency === 'immediate' ? 'bg-red-50 text-red-700' :
                      action.urgency === 'high' ? 'bg-orange-50 text-orange-700' :
                      'bg-blue-50 text-blue-700'
                    }>{action.urgency}</Badge>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="training" className="space-y-2">
                {complianceReport.training_recommendations?.map((training, idx) => (
                  <div key={idx} className="p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-purple-800">{training.training_type}</p>
                      <Badge variant="outline" className="bg-purple-100 text-purple-700">{training.priority}</Badge>
                    </div>
                    <p className="text-xs text-purple-600">
                      Target: {training.target_agents?.join(', ') || 'All agents'}
                    </p>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="forecast">
                <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <p className="font-medium text-slate-700">30-Day Risk Forecast</p>
                  </div>
                  <p className="text-sm text-slate-600">{complianceReport.risk_forecast}</p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </CardContent>
    </Card>
  );
}