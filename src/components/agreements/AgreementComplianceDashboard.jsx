import { useState, useEffect } from 'react'
import { base44 } from '@/api/base44Client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  AlertCircle, CheckCircle, Clock, FileText, 
  AlertTriangle, TrendingUp, Calendar, Users, 
  RefreshCw, Send, History, BarChart3
} from 'lucide-react';
import { format, differenceInDays, addMonths, isBefore, subMonths } from 'date-fns'
import { toast } from 'sonner'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function AgreementComplianceDashboard() {
  const queryClient = useQueryClient();
  const [complianceData, setComplianceData] = useState({
    total: 0,
    compliant: 0,
    expiringSoon: 0,
    expired: 0,
    missingInfo: 0,
    needsAttention: []
  });

  const { data: agreements = [], isLoading } = useQuery({
    queryKey: ['agencyPartnerAgreements'],
    queryFn: () => base44.entities.AgencyPartnerAgreement.list('-created_date')
  });

  const { data: addendums = [] } = useQuery({
    queryKey: ['agreementAddendums'],
    queryFn: () => base44.entities.AgreementAddendum.list('-created_date')
  });

  const { data: auditLogs = [] } = useQuery({
    queryKey: ['agreementAuditLogs'],
    queryFn: () => base44.entities.AuditLog.filter({ entity_type: 'agreement' }, '-created_date')
  });

  const createAlertMutation = useMutation({
    mutationFn: (alertData) => base44.entities.Alert.create(alertData),
    onSuccess: () => {
      queryClient.invalidateQueries(['alerts']);
    }
  });

  const runWorkflowMutation = useMutation({
    mutationFn: async (action) => {
      return await base44.functions.invoke('agreementWorkflowAutomation', action);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['agencyPartnerAgreements']);
      queryClient.invalidateQueries(['alerts']);
      if (variables.action === 'send_reminders') {
        toast.success(`Sent ${data.data.reminders_sent} reminder(s)`);
      } else if (variables.action === 'check_compliance') {
        toast.success(`Created ${data.data.alerts_created} compliance alert(s)`);
      }
    },
    onError: () => {
      toast.error('Workflow automation failed');
    }
  });

  useEffect(() => {
    if (agreements.length > 0) {
      analyzeCompliance();
    }
  }, [agreements, addendums]);

  const trendData = () => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const monthKey = format(date, 'MMM yyyy');
      
      const created = agreements.filter(a => {
        const createdDate = new Date(a.created_date);
        return format(createdDate, 'MMM yyyy') === monthKey;
      }).length;

      const expired = agreements.filter(a => {
        if (!a.expiration_date) return false;
        const expDate = new Date(a.expiration_date);
        return format(expDate, 'MMM yyyy') === monthKey && isBefore(expDate, new Date());
      }).length;

      const active = agreements.filter(a => {
        const createdDate = new Date(a.created_date);
        return isBefore(createdDate, date) && a.status === 'active';
      }).length;

      months.push({ month: monthKey, created, expired, active });
    }
    return months;
  };

  const statusDistribution = [
    { status: 'Active', count: agreements.filter(a => a.status === 'active').length },
    { status: 'Pending', count: agreements.filter(a => a.status === 'pending_signature').length },
    { status: 'Draft', count: agreements.filter(a => a.status === 'draft').length },
    { status: 'Expired', count: agreements.filter(a => a.status === 'expired').length },
    { status: 'Superseded', count: agreements.filter(a => a.status === 'superseded').length }
  ];

  const analyzeCompliance = async () => {
    const today = new Date();
    const thirtyDaysFromNow = addMonths(today, 1);
    const sixtyDaysFromNow = addMonths(today, 2);

    let compliant = 0;
    let expiringSoon = 0;
    let expired = 0;
    let missingInfo = 0;
    const needsAttention = [];

    agreements.forEach(agreement => {
      let issues = [];
      let isCompliant = true;

      // Check expiration
      if (agreement.expiration_date) {
        const expirationDate = new Date(agreement.expiration_date);
        const daysUntilExpiration = differenceInDays(expirationDate, today);

        if (isBefore(expirationDate, today)) {
          expired++;
          isCompliant = false;
          issues.push({
            type: 'expired',
            severity: 'critical',
            message: `Agreement expired ${Math.abs(daysUntilExpiration)} days ago`
          });
        } else if (isBefore(expirationDate, thirtyDaysFromNow)) {
          expiringSoon++;
          isCompliant = false;
          issues.push({
            type: 'expiring',
            severity: 'warning',
            message: `Expires in ${daysUntilExpiration} days`
          });
        } else if (isBefore(expirationDate, sixtyDaysFromNow)) {
          issues.push({
            type: 'expiring_soon',
            severity: 'info',
            message: `Expires in ${daysUntilExpiration} days`
          });
        }
      }

      // Check missing signers
      if (!agreement.signers || agreement.signers.length === 0) {
        missingInfo++;
        isCompliant = false;
        issues.push({
          type: 'missing_signers',
          severity: 'warning',
          message: 'No signers defined'
        });
      } else {
        const unsignedSigners = agreement.signers.filter(s => !s.signed);
        if (unsignedSigners.length > 0) {
          isCompliant = false;
          issues.push({
            type: 'unsigned',
            severity: 'warning',
            message: `${unsignedSigners.length} signature(s) pending`
          });
        }
      }

      // Check missing territories
      if (!agreement.territories || agreement.territories.length === 0) {
        missingInfo++;
        isCompliant = false;
        issues.push({
          type: 'missing_territories',
          severity: 'info',
          message: 'No territories specified'
        });
      }

      // Check missing commission terms
      if (!agreement.agreement_terms?.commission_override_percentage) {
        missingInfo++;
        isCompliant = false;
        issues.push({
          type: 'missing_commission',
          severity: 'info',
          message: 'Commission terms not set'
        });
      }

      // Check if document is generated
      if (!agreement.document_url && agreement.status !== 'draft') {
        isCompliant = false;
        issues.push({
          type: 'missing_document',
          severity: 'warning',
          message: 'Agreement document not generated'
        });
      }

      if (isCompliant) {
        compliant++;
      }

      if (issues.length > 0) {
        needsAttention.push({
          agreement,
          issues
        });
        
        // Auto-generate compliance tasks for critical issues
        const hasCriticalIssues = issues.some(i => i.severity === 'critical');
        if (hasCriticalIssues) {
          try {
            base44.functions.invoke('aiTaskAutomation', {
              trigger_type: 'agreement_compliance',
              entity_id: agreement.id,
              compliance_data: { issues, agreement }
            }).catch(err => console.error('Task generation failed:', err));
          } catch (error) {
            console.error('Failed to trigger task automation:', error);
          }
        }
      }
    });

    setComplianceData({
      total: agreements.length,
      compliant,
      expiringSoon,
      expired,
      missingInfo,
      needsAttention: needsAttention.sort((a, b) => {
        const aSeverity = Math.max(...a.issues.map(i => getSeverityScore(i.severity)));
        const bSeverity = Math.max(...b.issues.map(i => getSeverityScore(i.severity)));
        return bSeverity - aSeverity;
      })
    });

    // Auto-create alerts for critical issues
    needsAttention.forEach(item => {
      const criticalIssues = item.issues.filter(i => i.severity === 'critical');
      criticalIssues.forEach(issue => {
        createAlertMutation.mutate({
          alert_type: 'compliance',
          severity: 'critical',
          title: `Agreement Compliance Issue: ${item.agreement.agreement_number}`,
          message: issue.message,
          related_entity_type: 'agreement',
          related_entity_id: item.agreement.id,
          is_read: false,
          is_resolved: false
        });
      });
    });
  };

  const getSeverityScore = (severity) => {
    switch (severity) {
      case 'critical': return 3;
      case 'warning': return 2;
      case 'info': return 1;
      default: return 0;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      case 'warning': return 'text-amber-600 bg-amber-50 dark:bg-amber-900/20';
      case 'info': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
      default: return 'text-slate-600 bg-slate-50';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical': return AlertCircle;
      case 'warning': return AlertTriangle;
      case 'info': return Clock;
      default: return FileText;
    }
  };

  const compliancePercentage = complianceData.total > 0 
    ? Math.round((complianceData.compliant / complianceData.total) * 100) 
    : 0;

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1,2,3].map(i => (
          <Card key={i} className="border-0 shadow-sm dark:bg-slate-800 animate-pulse">
            <CardContent className="pt-6">
              <div className="h-24 bg-slate-200 dark:bg-slate-700 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Automation Controls */}
      <Card className="border-0 shadow-sm dark:bg-slate-800">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Automated Workflows</h3>
              <p className="text-sm text-slate-500">Run compliance checks and send reminders</p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => runWorkflowMutation.mutate({ action: 'send_reminders' })}
                disabled={runWorkflowMutation.isPending}
              >
                <Send className="w-4 h-4 mr-1" />
                Send Reminders
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => runWorkflowMutation.mutate({ action: 'check_compliance' })}
                disabled={runWorkflowMutation.isPending}
              >
                <RefreshCw className={`w-4 h-4 mr-1 ${runWorkflowMutation.isPending ? 'animate-spin' : ''}`} />
                Check Compliance
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-lg dark:bg-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Total Agreements</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">{complianceData.total}</p>
              </div>
              <FileText className="w-10 h-10 text-teal-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg dark:bg-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Compliant</p>
                <p className="text-3xl font-bold text-green-600">{complianceData.compliant}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg dark:bg-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Expiring Soon</p>
                <p className="text-3xl font-bold text-amber-600">{complianceData.expiringSoon}</p>
              </div>
              <Clock className="w-10 h-10 text-amber-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg dark:bg-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Expired</p>
                <p className="text-3xl font-bold text-red-600">{complianceData.expired}</p>
              </div>
              <AlertCircle className="w-10 h-10 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Score */}
      <Card className="border-0 shadow-lg dark:bg-slate-800">
        <CardHeader>
          <CardTitle>Overall Compliance Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{compliancePercentage}%</span>
              <Badge className={
                compliancePercentage >= 90 ? 'bg-green-100 text-green-700' :
                compliancePercentage >= 70 ? 'bg-amber-100 text-amber-700' :
                'bg-red-100 text-red-700'
              }>
                {compliancePercentage >= 90 ? 'Excellent' :
                 compliancePercentage >= 70 ? 'Good' :
                 compliancePercentage >= 50 ? 'Fair' : 'Poor'}
              </Badge>
            </div>
            <Progress value={compliancePercentage} className="h-3" />
            <p className="text-sm text-slate-500">
              {complianceData.compliant} of {complianceData.total} agreements are fully compliant
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Trends and Analytics */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">
            <TrendingUp className="w-4 h-4 mr-2" />
            Trends
          </TabsTrigger>
          <TabsTrigger value="distribution">
            <BarChart3 className="w-4 h-4 mr-2" />
            Distribution
          </TabsTrigger>
          <TabsTrigger value="audit">
            <History className="w-4 h-4 mr-2" />
            Audit Trail
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trends">
          <Card className="border-0 shadow-lg dark:bg-slate-800">
            <CardHeader>
              <CardTitle>Agreement Trends (6 Months)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="created" stroke="#0d9488" name="Created" />
                  <Line type="monotone" dataKey="active" stroke="#3b82f6" name="Active" />
                  <Line type="monotone" dataKey="expired" stroke="#ef4444" name="Expired" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution">
          <Card className="border-0 shadow-lg dark:bg-slate-800">
            <CardHeader>
              <CardTitle>Agreement Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={statusDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="status" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0d9488" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit">
          <Card className="border-0 shadow-lg dark:bg-slate-800">
            <CardHeader>
              <CardTitle>Recent Audit Trail</CardTitle>
            </CardHeader>
            <CardContent>
              {auditLogs.length === 0 ? (
                <p className="text-center py-8 text-slate-500">No audit logs yet</p>
              ) : (
                <div className="space-y-3">
                  {auditLogs.slice(0, 10).map(log => (
                    <div
                      key={log.id}
                      className="p-3 rounded-lg border dark:border-slate-700 hover:border-teal-300 dark:hover:border-teal-600 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">
                            {log.action.replace(/_/g, ' ').toUpperCase()}
                          </p>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                            {log.description}
                          </p>
                          {log.metadata && (
                            <div className="mt-2 text-xs text-slate-500">
                              {Object.entries(log.metadata).map(([key, value]) => (
                                <span key={key} className="mr-3">
                                  {key}: {value}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-slate-400">
                          {format(new Date(log.created_date), 'MMM d, h:mm a')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Agreements Needing Attention */}
      <Card className="border-0 shadow-lg dark:bg-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            Agreements Needing Attention ({complianceData.needsAttention.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {complianceData.needsAttention.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 mx-auto text-green-600 mb-2" />
              <p className="text-slate-600 dark:text-slate-400">All agreements are compliant!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {complianceData.needsAttention.map(({ agreement, issues }) => (
                <div
                  key={agreement.id}
                  className="p-4 rounded-lg border dark:border-slate-700 hover:border-teal-300 dark:hover:border-teal-600 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-slate-900 dark:text-white">
                        {agreement.agreement_number}
                      </h4>
                      <p className="text-sm text-slate-500">
                        {agreement.agreement_type.replace(/_/g, ' ')}
                      </p>
                    </div>
                    <Badge className={
                      agreement.status === 'active' ? 'bg-green-100 text-green-700' :
                      agreement.status === 'pending_signature' ? 'bg-amber-100 text-amber-700' :
                      'bg-slate-100 text-slate-700'
                    }>
                      {agreement.status}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    {issues.map((issue, idx) => {
                      const Icon = getSeverityIcon(issue.severity);
                      return (
                        <div
                          key={idx}
                          className={`flex items-start gap-2 p-2 rounded text-sm ${getSeverityColor(issue.severity)}`}
                        >
                          <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <span>{issue.message}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}