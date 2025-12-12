import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Zap, Play, Clock, CheckCircle, AlertTriangle, Users, 
  FileText, Calendar, Bell, RefreshCw, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function WorkflowAutomationDashboard() {
  const [autoRunEnabled, setAutoRunEnabled] = useState(true);

  const { data: automationRules = [] } = useQuery({
    queryKey: ['taskAutomationRules'],
    queryFn: () => base44.entities.TaskAutomationRule.list()
  });

  const runWorkflowMutation = useMutation({
    mutationFn: () => base44.functions.invoke('workflowAutomationEngine', {}),
    onSuccess: (response) => {
      toast.success('Automation workflow completed', {
        description: `Created ${response.data.summary.licenseAlertsCreated + response.data.summary.contractAlertsCreated} alerts and ${response.data.summary.followUpRemindersCreated} reminders`
      });
    },
    onError: (error) => {
      toast.error('Workflow failed', {
        description: error.message
      });
    }
  });

  const workflows = [
    {
      id: 'license_expiration',
      name: 'License Expiration Monitoring',
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description: 'Automatically creates alerts and tasks when licenses are nearing expiration',
      triggers: ['90 days', '60 days', '30 days', '14 days', 'Expired'],
      enabled: true
    },
    {
      id: 'contract_renewal',
      name: 'Contract Renewal Tracking',
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      description: 'Monitors contract renewal dates and creates tasks for review',
      triggers: ['60 days', '30 days', '14 days before renewal'],
      enabled: true
    },
    {
      id: 'client_followup',
      name: 'Client Follow-up Automation',
      icon: Users,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      description: 'Creates follow-up reminders based on client inactivity',
      triggers: ['30 days', '60 days', '90+ days of inactivity'],
      enabled: true
    },
    {
      id: 'critical_alerts',
      name: 'Critical Event Notifications',
      icon: Bell,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      description: 'Sends notifications to admins when critical thresholds are exceeded',
      triggers: ['5+ critical alerts', '10+ high alerts'],
      enabled: true
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="clay-morphism border-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">Workflow Automation</CardTitle>
                <p className="text-sm text-slate-500 mt-1">
                  Automated monitoring and task creation based on triggers
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600">Auto-run</span>
                <Switch 
                  checked={autoRunEnabled} 
                  onCheckedChange={setAutoRunEnabled}
                />
              </div>
              <Button
                onClick={() => runWorkflowMutation.mutate()}
                disabled={runWorkflowMutation.isPending}
                className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700"
              >
                {runWorkflowMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Run Now
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Workflow Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {workflows.map((workflow) => {
          const Icon = workflow.icon;
          return (
            <Card key={workflow.id} className="clay-morphism border-0">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg ${workflow.bgColor} flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${workflow.color}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 mb-1">{workflow.name}</h3>
                      <p className="text-xs text-slate-500">{workflow.description}</p>
                    </div>
                  </div>
                  <Badge className={workflow.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}>
                    {workflow.enabled ? (
                      <>
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Active
                      </>
                    ) : (
                      'Inactive'
                    )}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-medium text-slate-600 mb-2">Triggers:</p>
                  <div className="flex flex-wrap gap-2">
                    {workflow.triggers.map((trigger, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        <Clock className="w-3 h-3 mr-1" />
                        {trigger}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Last Run Status */}
      {runWorkflowMutation.isSuccess && runWorkflowMutation.data?.data && (
        <Card className="clay-morphism border-0">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-teal-600" />
              Last Automation Run
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">
                  {runWorkflowMutation.data.data.summary.licenseAlertsCreated}
                </p>
                <p className="text-xs text-slate-600 mt-1">License Alerts</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">
                  {runWorkflowMutation.data.data.summary.contractAlertsCreated}
                </p>
                <p className="text-xs text-slate-600 mt-1">Contract Alerts</p>
              </div>
              <div className="p-4 bg-emerald-50 rounded-lg">
                <p className="text-2xl font-bold text-emerald-600">
                  {runWorkflowMutation.data.data.summary.followUpRemindersCreated}
                </p>
                <p className="text-xs text-slate-600 mt-1">Follow-up Reminders</p>
              </div>
              <div className="p-4 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-600">
                  {runWorkflowMutation.data.data.summary.criticalNotificationsSent ? 'Yes' : 'No'}
                </p>
                <p className="text-xs text-slate-600 mt-1">Critical Alerts Sent</p>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-4">
              Last run: {format(new Date(runWorkflowMutation.data.data.timestamp), 'PPpp')}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Info Box */}
      <Card className="border-teal-200 bg-teal-50">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <AlertTriangle className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-slate-700 mb-2">
                <strong>How it works:</strong> The automation engine runs continuously in the background, monitoring your data for triggers and creating alerts, tasks, and notifications automatically.
              </p>
              <ul className="text-xs text-slate-600 space-y-1 ml-4 list-disc">
                <li>License expirations trigger alerts at 90, 60, 30, and 14 days before expiry</li>
                <li>Contract renewals create tasks and alerts for timely review</li>
                <li>Client inactivity (30, 60, 90+ days) generates follow-up reminders</li>
                <li>Critical system events notify administrators via email</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}