import { useState, useMemo } from 'react'
import { base44 } from '@/api/base44Client'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Shield, AlertTriangle, Clock, CheckCircle, Sparkles, 
  Loader2, RefreshCw, Mail, FileText, Calendar
} from 'lucide-react';
import { differenceInDays, format, addDays } from 'date-fns'
import { toast } from 'sonner'

export default function AIComplianceMonitor({ 
  agents, 
  licenses, 
  contracts, 
  checklistItems,
  onCreateTask,
  onCreateAlert,
  onTriggerOutreach
}) {
  const [isScanning, setIsScanning] = useState(false);
  const [complianceReport, setComplianceReport] = useState(null);
  const [lastScan, setLastScan] = useState(null);

  const complianceIssues = useMemo(() => {
    const issues = [];
    const today = new Date();

    // Check license expirations
    licenses.forEach(license => {
      if (!license.expiration_date) return;
      const daysUntil = differenceInDays(new Date(license.expiration_date), today);
      const agent = agents.find(a => a.id === license.agent_id);
      
      if (daysUntil < 0) {
        issues.push({
          type: 'license_expired',
          severity: 'critical',
          agent,
          license,
          message: `${license.state} license expired ${Math.abs(daysUntil)} days ago`,
          daysUntil
        });
      } else if (daysUntil <= 30) {
        issues.push({
          type: 'license_expiring',
          severity: daysUntil <= 7 ? 'critical' : 'warning',
          agent,
          license,
          message: `${license.state} license expires in ${daysUntil} days`,
          daysUntil
        });
      }
    });

    // Check contract expirations
    contracts.forEach(contract => {
      if (!contract.expiration_date || !['active', 'contract_signed'].includes(contract.contract_status)) return;
      const daysUntil = differenceInDays(new Date(contract.expiration_date), today);
      const agent = agents.find(a => a.id === contract.agent_id);
      
      if (daysUntil < 0) {
        issues.push({
          type: 'contract_expired',
          severity: 'critical',
          agent,
          contract,
          message: `${contract.carrier_name} contract expired ${Math.abs(daysUntil)} days ago`,
          daysUntil
        });
      } else if (daysUntil <= 60) {
        issues.push({
          type: 'contract_expiring',
          severity: daysUntil <= 30 ? 'critical' : 'warning',
          agent,
          contract,
          message: `${contract.carrier_name} contract expires in ${daysUntil} days`,
          daysUntil
        });
      }
    });

    // Check incomplete onboarding
    agents.forEach(agent => {
      if (agent.onboarding_status === 'ready_to_sell') return;
      const agentChecklist = checklistItems.filter(c => c.agent_id === agent.id);
      const incomplete = agentChecklist.filter(c => !c.is_completed);
      const daysSinceStart = differenceInDays(today, new Date(agent.created_date));
      
      if (daysSinceStart > 14 && incomplete.length > 0) {
        issues.push({
          type: 'onboarding_stalled',
          severity: daysSinceStart > 30 ? 'critical' : 'warning',
          agent,
          message: `Onboarding stalled for ${daysSinceStart} days with ${incomplete.length} items pending`,
          incompleteItems: incomplete.map(i => i.item_name),
          daysUntil: -daysSinceStart
        });
      }
    });

    // Check E&O expirations
    agents.forEach(agent => {
      if (!agent.e_and_o_expiration) return;
      const daysUntil = differenceInDays(new Date(agent.e_and_o_expiration), today);
      
      if (daysUntil <= 30) {
        issues.push({
          type: 'eo_expiring',
          severity: daysUntil <= 7 ? 'critical' : 'warning',
          agent,
          message: `E&O insurance ${daysUntil < 0 ? 'expired' : 'expires'} ${daysUntil < 0 ? Math.abs(daysUntil) + ' days ago' : 'in ' + daysUntil + ' days'}`,
          daysUntil
        });
      }
    });

    // Check AHIP expirations
    agents.forEach(agent => {
      if (!agent.ahip_expiration_date) return;
      const daysUntil = differenceInDays(new Date(agent.ahip_expiration_date), today);
      
      if (daysUntil <= 60) {
        issues.push({
          type: 'ahip_expiring',
          severity: daysUntil <= 30 ? 'critical' : 'warning',
          agent,
          message: `AHIP certification ${daysUntil < 0 ? 'expired' : 'expires'} ${daysUntil < 0 ? Math.abs(daysUntil) + ' days ago' : 'in ' + daysUntil + ' days'}`,
          daysUntil
        });
      }
    });

    return issues.sort((a, b) => a.daysUntil - b.daysUntil);
  }, [agents, licenses, contracts, checklistItems]);

  const runComplianceScan = async () => {
    setIsScanning(true);
    try {
      const criticalIssues = complianceIssues.filter(i => i.severity === 'critical');
      const warningIssues = complianceIssues.filter(i => i.severity === 'warning');

      // Generate AI compliance report
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze these compliance issues and provide actionable recommendations:

CRITICAL ISSUES (${criticalIssues.length}):
${criticalIssues.slice(0, 10).map(i => `- ${i.agent?.first_name} ${i.agent?.last_name}: ${i.message}`).join('\n')}

WARNING ISSUES (${warningIssues.length}):
${warningIssues.slice(0, 10).map(i => `- ${i.agent?.first_name} ${i.agent?.last_name}: ${i.message}`).join('\n')}

Provide:
1. Compliance health score (0-100)
2. Immediate actions required
3. Agents requiring urgent attention
4. Recommended outreach messages
5. Tasks to create for managers`,
        response_json_schema: {
          type: "object",
          properties: {
            compliance_score: { type: "number" },
            health_status: { type: "string" },
            immediate_actions: { type: "array", items: { type: "string" } },
            urgent_agents: { type: "array", items: { type: "object", properties: { name: { type: "string" }, reason: { type: "string" }, priority: { type: "string" } } } },
            outreach_recommendations: { type: "array", items: { type: "object", properties: { agent_name: { type: "string" }, message_type: { type: "string" }, subject: { type: "string" } } } },
            manager_tasks: { type: "array", items: { type: "string" } }
          }
        }
      });

      setComplianceReport(result);
      setLastScan(new Date());

      // Auto-create high priority tasks for critical issues
      if (onCreateTask && criticalIssues.length > 0) {
        for (const issue of criticalIssues.slice(0, 5)) {
          await onCreateTask({
            title: `URGENT: ${issue.message}`,
            description: `Compliance issue detected for ${issue.agent?.first_name} ${issue.agent?.last_name}`,
            task_type: 'compliance',
            priority: 'urgent',
            agent_id: issue.agent?.id,
            due_date: format(addDays(new Date(), 3), 'yyyy-MM-dd'),
            auto_generated: true
          });
        }
        toast.success(`Created ${Math.min(criticalIssues.length, 5)} urgent compliance tasks`);
      }

      // Auto-create alerts
      if (onCreateAlert) {
        for (const issue of criticalIssues.slice(0, 3)) {
          await onCreateAlert({
            agent_id: issue.agent?.id,
            alert_type: issue.type,
            severity: 'critical',
            title: issue.message,
            message: `Automated compliance scan detected: ${issue.message}. Immediate action required.`
          });
        }
      }

    } catch (err) {
      console.error('Compliance scan failed:', err);
      toast.error('Failed to run compliance scan');
    } finally {
      setIsScanning(false);
    }
  };

  const criticalCount = complianceIssues.filter(i => i.severity === 'critical').length;
  const warningCount = complianceIssues.filter(i => i.severity === 'warning').length;

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="w-5 h-5 text-teal-600" />
            AI Compliance Monitor
          </CardTitle>
          <Button
            size="sm"
            onClick={runComplianceScan}
            disabled={isScanning}
            className="bg-teal-600 hover:bg-teal-700"
          >
            {isScanning ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Run Scan
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className={`p-3 rounded-lg text-center ${criticalCount > 0 ? 'bg-red-50 border border-red-200' : 'bg-slate-50'}`}>
            <AlertTriangle className={`w-5 h-5 mx-auto mb-1 ${criticalCount > 0 ? 'text-red-500' : 'text-slate-400'}`} />
            <p className={`text-xl font-bold ${criticalCount > 0 ? 'text-red-600' : 'text-slate-600'}`}>{criticalCount}</p>
            <p className="text-xs text-slate-500">Critical</p>
          </div>
          <div className={`p-3 rounded-lg text-center ${warningCount > 0 ? 'bg-amber-50 border border-amber-200' : 'bg-slate-50'}`}>
            <Clock className={`w-5 h-5 mx-auto mb-1 ${warningCount > 0 ? 'text-amber-500' : 'text-slate-400'}`} />
            <p className={`text-xl font-bold ${warningCount > 0 ? 'text-amber-600' : 'text-slate-600'}`}>{warningCount}</p>
            <p className="text-xs text-slate-500">Warnings</p>
          </div>
          <div className="p-3 rounded-lg text-center bg-emerald-50 border border-emerald-200">
            <CheckCircle className="w-5 h-5 mx-auto mb-1 text-emerald-500" />
            <p className="text-xl font-bold text-emerald-600">
              {complianceReport?.compliance_score || '--'}%
            </p>
            <p className="text-xs text-slate-500">Health Score</p>
          </div>
        </div>

        {/* Compliance Report */}
        {complianceReport && (
          <div className="space-y-3">
            <div className={`p-3 rounded-lg ${
              complianceReport.compliance_score >= 80 ? 'bg-emerald-50 border border-emerald-200' :
              complianceReport.compliance_score >= 60 ? 'bg-amber-50 border border-amber-200' :
              'bg-red-50 border border-red-200'
            }`}>
              <p className={`text-sm font-medium ${
                complianceReport.compliance_score >= 80 ? 'text-emerald-800' :
                complianceReport.compliance_score >= 60 ? 'text-amber-800' :
                'text-red-800'
              }`}>
                Status: {complianceReport.health_status}
              </p>
            </div>

            {complianceReport.immediate_actions?.length > 0 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="text-sm font-medium text-red-800 mb-2">Immediate Actions Required</h4>
                <ul className="space-y-1">
                  {complianceReport.immediate_actions.map((action, i) => (
                    <li key={i} className="text-xs text-red-700">• {action}</li>
                  ))}
                </ul>
              </div>
            )}

            {complianceReport.urgent_agents?.length > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <h4 className="text-sm font-medium text-amber-800 mb-2">Agents Requiring Attention</h4>
                <div className="space-y-1">
                  {complianceReport.urgent_agents.slice(0, 5).map((agent, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="text-amber-700">{agent.name}: {agent.reason}</span>
                      <Badge variant="outline" className={
                        agent.priority === 'critical' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                      }>
                        {agent.priority}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Recent Issues */}
        <div>
          <h4 className="text-sm font-medium text-slate-700 mb-2">Recent Issues</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {complianceIssues.slice(0, 8).map((issue, i) => (
              <div 
                key={i} 
                className={`p-2 rounded-lg border flex items-center justify-between ${
                  issue.severity === 'critical' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-medium truncate ${
                    issue.severity === 'critical' ? 'text-red-700' : 'text-amber-700'
                  }`}>
                    {issue.agent?.first_name} {issue.agent?.last_name}
                  </p>
                  <p className={`text-xs truncate ${
                    issue.severity === 'critical' ? 'text-red-600' : 'text-amber-600'
                  }`}>
                    {issue.message}
                  </p>
                </div>
                {onTriggerOutreach && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={() => onTriggerOutreach(issue.agent)}
                  >
                    <Mail className="w-3 h-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        {lastScan && (
          <p className="text-xs text-slate-400 text-center">
            Last scan: {format(lastScan, 'MMM d, yyyy h:mm a')}
          </p>
        )}
      </CardContent>
    </Card>
  );
}