import { useState } from 'react'
import { base44 } from '@/api/base44Client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Shield, Scan, AlertTriangle, Clock, CheckCircle, 
  FileText, User, Calendar, TrendingUp, Play, Loader2
} from 'lucide-react';
import { format } from 'date-fns'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

export default function AutomatedComplianceScanner() {
  const queryClient = useQueryClient();
  const [scanning, setScanning] = useState(false);

  const { data: issues = [], isLoading } = useQuery({
    queryKey: ['complianceIssues'],
    queryFn: () => base44.entities.ComplianceIssue.list('-created_date')
  });

  const { data: workflows = [] } = useQuery({
    queryKey: ['complianceWorkflows'],
    queryFn: () => base44.entities.ComplianceWorkflow.list()
  });

  const runScanMutation = useMutation({
    mutationFn: async (agentId) => {
      const response = await base44.functions.invoke('aiComplianceAudit', { agentId });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['complianceIssues']);
      queryClient.invalidateQueries(['alerts']);
      toast.success(`Scan complete: ${data.stats.total_issues} issues found`);
      setScanning(false);
    },
    onError: () => {
      toast.error('Scan failed');
      setScanning(false);
    }
  });

  const resolveIssueMutation = useMutation({
    mutationFn: ({ id, notes }) => base44.entities.ComplianceIssue.update(id, {
      status: 'resolved',
      resolved_date: new Date().toISOString(),
      resolution_notes: notes
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['complianceIssues']);
      toast.success('Issue resolved');
    }
  });

  const openIssues = issues.filter(i => i.status === 'open' || i.status === 'in_progress');
  const criticalIssues = issues.filter(i => i.severity === 'critical');
  const expiringItems = issues.filter(i => 
    i.issue_type.includes('expiring') && i.status === 'open'
  );

  const getSeverityColor = (severity) => {
    const colors = {
      critical: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      low: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    };
    return colors[severity] || colors.low;
  };

  const getIssueIcon = (issueType) => {
    const icons = {
      license_expiring: Calendar,
      policy_expiring: FileText,
      appointment_expiring: Calendar,
      missing_client_data: User,
      missing_document: FileText,
      default: AlertTriangle
    };
    return icons[issueType] || icons.default;
  };

  const handleScan = () => {
    setScanning(true);
    runScanMutation.mutate(null);
  };

  return (
    <div className="space-y-6">
      {/* Scanner Control */}
      <Card className="clay-morphism border-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl clay-morphism bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                <Scan className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">Automated Compliance Scanner</CardTitle>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  AI-powered compliance monitoring across all agents and entities
                </p>
              </div>
            </div>
            <Button
              onClick={handleScan}
              disabled={scanning}
              className="clay-morphism bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white shadow-xl shadow-purple-500/40 border-0"
            >
              {scanning ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 mr-2" />
                  Run Full Scan
                </>
              )}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Open Issues', value: openIssues.length, icon: AlertTriangle, color: 'amber' },
          { label: 'Critical', value: criticalIssues.length, icon: AlertTriangle, color: 'red' },
          { label: 'Expiring Soon', value: expiringItems.length, icon: Clock, color: 'orange' },
          { label: 'Resolved', value: issues.filter(i => i.status === 'resolved').length, icon: CheckCircle, color: 'green' }
        ].map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            whileHover={{ y: -4, scale: 1.02 }}
          >
            <Card className="clay-morphism border-0">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{stat.label}</p>
                    <p className={`text-3xl font-bold text-${stat.color}-600 dark:text-${stat.color}-400`}>
                      {stat.value}
                    </p>
                  </div>
                  <div className={`w-12 h-12 rounded-2xl clay-morphism bg-gradient-to-br from-${stat.color}-400 to-${stat.color}-600 flex items-center justify-center`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Issues List */}
      <Tabs defaultValue="open" className="space-y-4">
        <TabsList className="clay-morphism p-1.5 rounded-2xl">
          <TabsTrigger value="open" className="rounded-xl data-[state=active]:clay-morphism data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg">
            Open Issues ({openIssues.length})
          </TabsTrigger>
          <TabsTrigger value="critical" className="rounded-xl data-[state=active]:clay-morphism data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg">
            Critical ({criticalIssues.length})
          </TabsTrigger>
          <TabsTrigger value="expiring" className="rounded-xl data-[state=active]:clay-morphism data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg">
            Expiring ({expiringItems.length})
          </TabsTrigger>
          <TabsTrigger value="all" className="rounded-xl data-[state=active]:clay-morphism data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg">
            All Issues
          </TabsTrigger>
        </TabsList>

        <TabsContent value="open" className="space-y-3">
          {openIssues.map((issue, idx) => {
            const IssueIcon = getIssueIcon(issue.issue_type);
            return (
              <motion.div
                key={issue.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ y: -2 }}
              >
                <Card className="clay-morphism border-0">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-2xl clay-morphism bg-gradient-to-br from-purple-400 to-indigo-600 flex items-center justify-center shrink-0`}>
                        <IssueIcon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <h3 className="font-semibold text-slate-800 dark:text-white">{issue.title}</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{issue.description}</p>
                          </div>
                          <Badge className={getSeverityColor(issue.severity)}>
                            {issue.severity}
                          </Badge>
                        </div>

                        {issue.days_until_expiration !== undefined && (
                          <div className="flex items-center gap-2 mt-2 text-sm text-slate-600 dark:text-slate-400">
                            <Clock className="w-4 h-4" />
                            <span>{issue.days_until_expiration} days remaining</span>
                          </div>
                        )}

                        {issue.missing_fields?.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-slate-500 mb-1">Missing Fields:</p>
                            <div className="flex flex-wrap gap-1">
                              {issue.missing_fields.map(field => (
                                <Badge key={field} variant="outline" className="text-xs">
                                  {field.replace(/_/g, ' ')}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {issue.ai_recommendations?.length > 0 && (
                          <div className="mt-3 p-3 clay-subtle rounded-lg">
                            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                              AI Recommendations:
                            </p>
                            {issue.ai_recommendations.map((rec, idx) => (
                              <div key={idx} className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                                • {rec.action}
                                {rec.priority && (
                                  <Badge variant="outline" className="ml-2 text-xs">
                                    {rec.priority}
                                  </Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="flex gap-2 mt-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              base44.entities.ComplianceIssue.update(issue.id, { status: 'in_progress' });
                              queryClient.invalidateQueries(['complianceIssues']);
                            }}
                          >
                            Mark In Progress
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => resolveIssueMutation.mutate({ 
                              id: issue.id, 
                              notes: 'Resolved from scanner' 
                            })}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Resolve
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
          {openIssues.length === 0 && (
            <Card className="clay-morphism border-0">
              <CardContent className="py-12 text-center">
                <CheckCircle className="w-16 h-16 mx-auto text-green-600 mb-3" />
                <p className="text-lg font-semibold text-slate-800 dark:text-white">All Clear!</p>
                <p className="text-slate-600 dark:text-slate-400">No open compliance issues</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="critical" className="space-y-3">
          {criticalIssues.map((issue, idx) => {
            const IssueIcon = getIssueIcon(issue.issue_type);
            return (
              <motion.div
                key={issue.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ y: -2 }}
              >
                <Card className="clay-morphism border-2 border-red-300 dark:border-red-700">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl clay-morphism bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shrink-0">
                        <IssueIcon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <Badge className="bg-red-600 text-white mb-2">CRITICAL</Badge>
                            <h3 className="font-bold text-slate-900 dark:text-white">{issue.title}</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{issue.description}</p>
                          </div>
                        </div>
                        {issue.ai_recommendations?.length > 0 && (
                          <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                            <p className="text-xs font-semibold text-red-900 dark:text-red-200 mb-2">
                              Immediate Actions Required:
                            </p>
                            {issue.ai_recommendations.map((rec, idx) => (
                              <div key={idx} className="text-sm text-red-700 dark:text-red-300 mb-1">
                                • {rec.action}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </TabsContent>

        <TabsContent value="expiring" className="space-y-3">
          {expiringItems.sort((a, b) => a.days_until_expiration - b.days_until_expiration).map((issue, idx) => {
            const IssueIcon = getIssueIcon(issue.issue_type);
            return (
              <motion.div
                key={issue.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="clay-morphism border-0">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl clay-morphism bg-gradient-to-br ${
                          issue.days_until_expiration <= 30 
                            ? 'from-red-400 to-red-600' 
                            : 'from-orange-400 to-orange-600'
                        } flex items-center justify-center`}>
                          <IssueIcon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-800 dark:text-white">{issue.title}</h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400">{issue.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge className={getSeverityColor(issue.severity)}>
                              {issue.days_until_expiration} days
                            </Badge>
                            <span className="text-xs text-slate-500">
                              Expires: {format(new Date(issue.expiration_date), 'MMM d, yyyy')}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => resolveIssueMutation.mutate({ 
                          id: issue.id, 
                          notes: 'Handled expiration' 
                        })}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Resolve
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </TabsContent>

        <TabsContent value="all" className="space-y-2">
          {issues.map(issue => (
            <Card key={issue.id} className="clay-subtle border-0">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge className={getSeverityColor(issue.severity)}>{issue.severity}</Badge>
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{issue.title}</p>
                      <p className="text-xs text-slate-500">{format(new Date(issue.created_date), 'MMM d, yyyy')}</p>
                    </div>
                  </div>
                  <Badge variant="outline">{issue.status.replace(/_/g, ' ')}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}