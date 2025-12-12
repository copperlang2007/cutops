import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, AlertTriangle, CheckCircle, XCircle, Clock, 
  RefreshCw, Eye, ChevronDown, ChevronUp 
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function OffboardingAuditPanel({ offboardingId, agentId }) {
  const [expandedAudit, setExpandedAudit] = React.useState(null);
  const queryClient = useQueryClient();

  const { data: audits = [], isLoading } = useQuery({
    queryKey: ['offboardingAudits', offboardingId],
    queryFn: () => base44.entities.OffboardingAudit.filter(
      { offboarding_id: offboardingId },
      '-audit_date'
    )
  });

  const runAuditMutation = useMutation({
    mutationFn: async () => {
      toast.loading('Running compliance audit...', { id: 'audit' });
      const result = await base44.functions.invoke('auditOffboardingCompliance', {
        offboardingId,
        auditType: 'manual'
      });
      return result.data;
    },
    onSuccess: (data) => {
      toast.dismiss('audit');
      queryClient.invalidateQueries(['offboardingAudits']);
      
      if (data.summary.critical_findings > 0) {
        toast.error(`Audit complete: ${data.summary.critical_findings} critical issues found`);
      } else {
        toast.success(`Audit complete: ${data.summary.compliance_score}% compliant`);
      }
    },
    onError: (error) => {
      toast.dismiss('audit');
      toast.error(`Audit failed: ${error.message}`);
    }
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'compliant':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      case 'critical':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'compliant':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'warning':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'critical':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-600 text-white';
      case 'high':
        return 'bg-orange-600 text-white';
      case 'medium':
        return 'bg-amber-600 text-white';
      case 'low':
        return 'bg-blue-600 text-white';
      default:
        return 'bg-slate-600 text-white';
    }
  };

  const getSystemStatusIcon = (status) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-amber-600" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-slate-400" />;
    }
  };

  const latestAudit = audits[0];

  return (
    <div className="space-y-6">
      {/* Header with Run Audit Button */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-slate-900 to-slate-800 text-white">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8" />
              <div>
                <h3 className="text-lg font-semibold">Compliance Auditing</h3>
                <p className="text-sm text-slate-300">
                  Automated verification of system access termination
                </p>
              </div>
            </div>
            <Button
              onClick={() => runAuditMutation.mutate()}
              disabled={runAuditMutation.isPending}
              className="bg-white text-slate-900 hover:bg-slate-100"
            >
              {runAuditMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Auditing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Run Audit
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Latest Audit Summary */}
      {latestAudit && (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                {getStatusIcon(latestAudit.overall_status)}
                Latest Audit Results
              </CardTitle>
              <Badge className={getStatusColor(latestAudit.overall_status)}>
                {latestAudit.overall_status.toUpperCase()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Compliance Score */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Compliance Score
                </span>
                <span className="text-2xl font-bold text-slate-900 dark:text-white">
                  {latestAudit.compliance_score}%
                </span>
              </div>
              <Progress value={latestAudit.compliance_score} className="h-3" />
            </div>

            {/* Audit Metadata */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500">Audit Date</p>
                <p className="font-medium text-slate-900 dark:text-white">
                  {format(new Date(latestAudit.audit_date), 'MMM d, yyyy h:mm a')}
                </p>
              </div>
              <div>
                <p className="text-slate-500">Next Audit</p>
                <p className="font-medium text-slate-900 dark:text-white">
                  {format(new Date(latestAudit.next_audit_date), 'MMM d, yyyy')}
                </p>
              </div>
              <div>
                <p className="text-slate-500">Systems Audited</p>
                <p className="font-medium text-slate-900 dark:text-white">
                  {latestAudit.systems_audited?.length || 0}
                </p>
              </div>
              <div>
                <p className="text-slate-500">Findings</p>
                <p className="font-medium text-slate-900 dark:text-white">
                  {latestAudit.security_findings?.length || 0}
                </p>
              </div>
            </div>

            {/* Security Findings */}
            {latestAudit.security_findings?.length > 0 && (
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white mb-3">
                  Security Findings
                </h4>
                <div className="space-y-2">
                  {latestAudit.security_findings.map((finding, idx) => (
                    <div
                      key={idx}
                      className="p-3 border border-slate-200 dark:border-slate-700 rounded-lg"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <Badge className={getSeverityColor(finding.severity)}>
                          {finding.severity}
                        </Badge>
                        {finding.resolved && (
                          <Badge className="bg-green-100 text-green-700">
                            Resolved
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white mb-1">
                        {finding.description}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                        Affected: {finding.affected_system}
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-400">
                        💡 {finding.recommendation}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Analysis */}
            {latestAudit.ai_analysis && (
              <div className="bg-slate-50 dark:bg-slate-900/20 rounded-lg p-4">
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  AI Risk Assessment
                </h4>
                <p className="text-sm text-slate-800 dark:text-slate-200 mb-3">
                  {latestAudit.ai_analysis.risk_assessment}
                </p>
                {latestAudit.ai_analysis.recommendations?.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-slate-900 dark:text-slate-100 mb-1">
                      Recommendations:
                    </p>
                    <ul className="text-xs text-slate-800 dark:text-slate-200 space-y-1">
                      {latestAudit.ai_analysis.recommendations.map((rec, idx) => (
                        <li key={idx}>• {rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Systems Audit Detail - Expandable */}
            <div>
              <Button
                variant="ghost"
                onClick={() => setExpandedAudit(expandedAudit ? null : latestAudit.id)}
                className="w-full justify-between"
              >
                <span className="font-semibold">System-by-System Verification</span>
                {expandedAudit ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
              
              {expandedAudit && (
                <div className="mt-3 space-y-2">
                  {latestAudit.systems_audited?.map((system, idx) => (
                    <div
                      key={idx}
                      className="p-3 border border-slate-200 dark:border-slate-700 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getSystemStatusIcon(system.status)}
                          <span className="font-medium text-sm text-slate-900 dark:text-white">
                            {system.system_name}
                          </span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {system.verification_method}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-slate-500">Marked Deactivated:</span>
                          <span className="ml-1 font-medium">
                            {system.marked_deactivated ? 'Yes' : 'No'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500">Verified:</span>
                          <span className="ml-1 font-medium">
                            {system.verified_deactivated ? 'Yes' : 'No'}
                          </span>
                        </div>
                      </div>
                      {system.notes && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                          {system.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Audit History */}
      {audits.length > 1 && (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Audit History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {audits.slice(1).map((audit) => (
                <div
                  key={audit.id}
                  className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                  onClick={() => setExpandedAudit(expandedAudit === audit.id ? null : audit.id)}
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(audit.overall_status)}
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {format(new Date(audit.audit_date), 'MMM d, yyyy h:mm a')}
                      </p>
                      <p className="text-xs text-slate-500">
                        Score: {audit.compliance_score}% • {audit.security_findings?.length || 0} findings
                      </p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(audit.overall_status)}>
                    {audit.overall_status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading && (
        <Card className="border-0 shadow-lg">
          <CardContent className="py-12 text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-slate-400 mb-2" />
            <p className="text-slate-500">Loading audit history...</p>
          </CardContent>
        </Card>
      )}

      {!isLoading && audits.length === 0 && (
        <Card className="border-0 shadow-lg">
          <CardContent className="py-12 text-center">
            <Eye className="w-12 h-12 mx-auto text-slate-400 mb-3" />
            <p className="text-slate-500 mb-4">No audits have been run yet</p>
            <Button onClick={() => runAuditMutation.mutate()}>
              Run First Audit
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}