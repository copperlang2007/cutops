import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, AlertTriangle, Clock, CheckCircle, Calendar, FileText, 
  GraduationCap, Bell, Sparkles, Loader2, RefreshCw, ChevronRight
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { format, differenceInDays, addDays } from 'date-fns';

export default function ComplianceCenter({ 
  agents, 
  licenses, 
  contracts, 
  trainingModules,
  trainingProgress,
  onCreateAlert,
  onCreateTask 
}) {
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Calculate compliance metrics
  const complianceMetrics = useMemo(() => {
    const now = new Date();
    
    // License renewals
    const expiringLicenses = licenses.filter(l => {
      if (!l.expiration_date || l.status === 'expired') return false;
      const days = differenceInDays(new Date(l.expiration_date), now);
      return days > 0 && days <= 60;
    });
    
    const expiredLicenses = licenses.filter(l => l.status === 'expired');
    
    const criticalLicenses = expiringLicenses.filter(l => 
      differenceInDays(new Date(l.expiration_date), now) <= 30
    );

    // Contract expirations
    const expiringContracts = contracts.filter(c => {
      if (!c.expiration_date) return false;
      const days = differenceInDays(new Date(c.expiration_date), now);
      return days > 0 && days <= 90;
    });

    // Training compliance
    const requiredModules = trainingModules?.filter(m => m.is_required) || [];
    const completedRequired = trainingProgress?.filter(p => 
      p.status === 'completed' && requiredModules.some(m => m.id === p.module_id)
    ).length || 0;

    // Agents with compliance issues
    const agentsAtRisk = agents.filter(agent => {
      const agentLicenses = licenses.filter(l => l.agent_id === agent.id);
      const hasExpiring = agentLicenses.some(l => {
        if (!l.expiration_date) return false;
        const days = differenceInDays(new Date(l.expiration_date), now);
        return days > 0 && days <= 30;
      });
      const hasExpired = agentLicenses.some(l => l.status === 'expired');
      return hasExpiring || hasExpired;
    });

    return {
      expiringLicenses,
      expiredLicenses,
      criticalLicenses,
      expiringContracts,
      requiredModules,
      completedRequired,
      agentsAtRisk,
      overallScore: Math.round(
        ((licenses.filter(l => l.status === 'active').length / Math.max(licenses.length, 1)) * 50) +
        ((completedRequired / Math.max(requiredModules.length, 1)) * 30) +
        ((1 - (agentsAtRisk.length / Math.max(agents.length, 1))) * 20)
      )
    };
  }, [agents, licenses, contracts, trainingModules, trainingProgress]);

  // AI compliance analysis
  const runComplianceAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze compliance status for an insurance agency.

Compliance Data:
- Total Licenses: ${licenses.length}
- Active Licenses: ${licenses.filter(l => l.status === 'active').length}
- Expiring Soon (60 days): ${complianceMetrics.expiringLicenses.length}
- Critical (30 days): ${complianceMetrics.criticalLicenses.length}
- Expired: ${complianceMetrics.expiredLicenses.length}
- Agents at Risk: ${complianceMetrics.agentsAtRisk.length}
- Total Agents: ${agents.length}
- Required Training Modules: ${complianceMetrics.requiredModules.length}
- Completed Required Training: ${complianceMetrics.completedRequired}

Provide:
1. Overall compliance risk assessment
2. Priority actions needed
3. Recommended compliance documentation
4. Training module suggestions
5. Calendar of upcoming deadlines
6. Risk mitigation strategies`,
        response_json_schema: {
          type: "object",
          properties: {
            risk_level: { type: "string", enum: ["low", "medium", "high", "critical"] },
            risk_summary: { type: "string" },
            priority_actions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  action: { type: "string" },
                  urgency: { type: "string" },
                  deadline: { type: "string" },
                  impact: { type: "string" }
                }
              }
            },
            recommended_documentation: { type: "array", items: { type: "string" } },
            suggested_training: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  module_name: { type: "string" },
                  reason: { type: "string" },
                  priority: { type: "string" }
                }
              }
            },
            upcoming_deadlines: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  item: { type: "string" },
                  date: { type: "string" },
                  type: { type: "string" }
                }
              }
            },
            mitigation_strategies: { type: "array", items: { type: "string" } }
          }
        }
      });

      setAiAnalysis(result);
      toast.success('Compliance analysis complete');
    } catch (err) {
      toast.error('Failed to analyze compliance');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Send renewal reminders
  const sendRenewalReminders = async () => {
    let alertsCreated = 0;
    for (const license of complianceMetrics.expiringLicenses) {
      const agent = agents.find(a => a.id === license.agent_id);
      if (agent) {
        await onCreateAlert({
          agent_id: license.agent_id,
          alert_type: 'license_expiring',
          severity: differenceInDays(new Date(license.expiration_date), new Date()) <= 30 ? 'critical' : 'warning',
          title: `${license.state} License Expiring`,
          message: `License expires on ${format(new Date(license.expiration_date), 'MMM d, yyyy')}. Renew immediately.`,
          due_date: license.expiration_date,
          related_entity_type: 'license',
          related_entity_id: license.id
        });
        alertsCreated++;
      }
    }
    toast.success(`Created ${alertsCreated} renewal alerts`);
  };

  const riskColors = {
    low: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    critical: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
  };

  return (
    <div className="space-y-6">
      {/* Compliance Score Header */}
      <Card className="border-0 shadow-premium dark:bg-slate-800/50 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-600 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">{complianceMetrics.overallScore}%</div>
                  <div className="text-xs text-violet-200">Compliance</div>
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Compliance Center</h2>
                <p className="text-violet-200">AI-powered compliance monitoring and risk management</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={sendRenewalReminders}>
                <Bell className="w-4 h-4 mr-2" />
                Send Reminders
              </Button>
              <Button onClick={runComplianceAnalysis} disabled={isAnalyzing} className="bg-white text-purple-700 hover:bg-violet-50">
                {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                AI Analysis
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <CardContent className="p-0">
          <div className="grid grid-cols-4 divide-x divide-slate-200 dark:divide-slate-700">
            <div className="p-4 text-center">
              <p className="text-2xl font-bold text-red-600">{complianceMetrics.criticalLicenses.length}</p>
              <p className="text-xs text-slate-500">Critical (30 days)</p>
            </div>
            <div className="p-4 text-center">
              <p className="text-2xl font-bold text-amber-600">{complianceMetrics.expiringLicenses.length}</p>
              <p className="text-xs text-slate-500">Expiring Soon</p>
            </div>
            <div className="p-4 text-center">
              <p className="text-2xl font-bold text-slate-600 dark:text-slate-300">{complianceMetrics.expiredLicenses.length}</p>
              <p className="text-xs text-slate-500">Expired</p>
            </div>
            <div className="p-4 text-center">
              <p className="text-2xl font-bold text-purple-600">{complianceMetrics.agentsAtRisk.length}</p>
              <p className="text-xs text-slate-500">Agents at Risk</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="licenses" className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="licenses"><Shield className="w-4 h-4 mr-2" />Licenses</TabsTrigger>
          <TabsTrigger value="training"><GraduationCap className="w-4 h-4 mr-2" />Training</TabsTrigger>
          <TabsTrigger value="calendar"><Calendar className="w-4 h-4 mr-2" />Calendar</TabsTrigger>
          <TabsTrigger value="ai-insights"><Sparkles className="w-4 h-4 mr-2" />AI Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="licenses" className="space-y-4">
          {/* Critical Licenses */}
          {complianceMetrics.criticalLicenses.length > 0 && (
            <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-red-700 dark:text-red-400 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Critical - Expires Within 30 Days
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {complianceMetrics.criticalLicenses.map(license => {
                  const agent = agents.find(a => a.id === license.agent_id);
                  const daysLeft = differenceInDays(new Date(license.expiration_date), new Date());
                  return (
                    <div key={license.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg">
                      <div>
                        <p className="font-medium text-slate-800 dark:text-white">
                          {agent?.first_name} {agent?.last_name} - {license.state}
                        </p>
                        <p className="text-sm text-slate-500">License #{license.license_number}</p>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-red-500 text-white">{daysLeft} days left</Badge>
                        <p className="text-xs text-slate-500 mt-1">
                          {format(new Date(license.expiration_date), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Expiring Licenses */}
          <Card className="border-0 shadow-sm dark:bg-slate-800/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-500" />
                Upcoming Renewals (60 days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {complianceMetrics.expiringLicenses.length === 0 ? (
                <p className="text-center py-4 text-slate-400">No licenses expiring in the next 60 days</p>
              ) : (
                <div className="space-y-2">
                  {complianceMetrics.expiringLicenses.map(license => {
                    const agent = agents.find(a => a.id === license.agent_id);
                    const daysLeft = differenceInDays(new Date(license.expiration_date), new Date());
                    return (
                      <div key={license.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg">
                        <div>
                          <p className="font-medium text-slate-700 dark:text-slate-300">
                            {agent?.first_name} {agent?.last_name} - {license.state}
                          </p>
                          <p className="text-xs text-slate-500">{license.license_type}</p>
                        </div>
                        <Badge variant="outline" className={daysLeft <= 30 ? 'border-red-300 text-red-600' : 'border-amber-300 text-amber-600'}>
                          {daysLeft} days
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="training" className="space-y-4">
          <Card className="border-0 shadow-sm dark:bg-slate-800/50">
            <CardHeader>
              <CardTitle className="text-base">Required Training Compliance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span>Completion Rate</span>
                  <span className="font-medium">
                    {complianceMetrics.completedRequired}/{complianceMetrics.requiredModules.length} modules
                  </span>
                </div>
                <Progress 
                  value={(complianceMetrics.completedRequired / Math.max(complianceMetrics.requiredModules.length, 1)) * 100} 
                  className="h-3"
                />
              </div>
              {aiAnalysis?.suggested_training?.map((training, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg mb-2">
                  <div>
                    <p className="font-medium text-blue-700 dark:text-blue-300">{training.module_name}</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400">{training.reason}</p>
                  </div>
                  <Badge className={training.priority === 'high' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}>
                    {training.priority}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <Card className="border-0 shadow-sm dark:bg-slate-800/50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-500" />
                Compliance Calendar
              </CardTitle>
            </CardHeader>
            <CardContent>
              {aiAnalysis?.upcoming_deadlines?.length > 0 ? (
                <div className="space-y-2">
                  {aiAnalysis.upcoming_deadlines.map((deadline, i) => (
                    <div key={i} className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg">
                      <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-700 dark:text-slate-300">{deadline.item}</p>
                        <p className="text-xs text-slate-500">{deadline.type}</p>
                      </div>
                      <Badge variant="outline">{deadline.date}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 text-slate-400">Run AI Analysis to populate calendar</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai-insights" className="space-y-4">
          {!aiAnalysis ? (
            <Card className="border-0 shadow-sm dark:bg-slate-800/50">
              <CardContent className="py-12 text-center text-slate-400">
                <Sparkles className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p>Click "AI Analysis" to get compliance insights and recommendations</p>
              </CardContent>
            </Card>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              {/* Risk Level */}
              <Card className={`border-0 ${riskColors[aiAnalysis.risk_level]}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm opacity-80">Overall Risk Level</p>
                      <p className="text-2xl font-bold capitalize">{aiAnalysis.risk_level}</p>
                    </div>
                    <AlertTriangle className="w-10 h-10 opacity-50" />
                  </div>
                  <p className="mt-2 text-sm">{aiAnalysis.risk_summary}</p>
                </CardContent>
              </Card>

              {/* Priority Actions */}
              <Card className="border-0 shadow-sm dark:bg-slate-800/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Priority Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {aiAnalysis.priority_actions?.map((action, i) => (
                    <div key={i} className="p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-slate-700 dark:text-slate-300">{action.action}</span>
                        <Badge className={action.urgency === 'immediate' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}>
                          {action.urgency}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500">Deadline: {action.deadline} | Impact: {action.impact}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Mitigation Strategies */}
              <Card className="border-0 shadow-sm dark:bg-slate-800/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Risk Mitigation Strategies</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {aiAnalysis.mitigation_strategies?.map((strategy, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <ChevronRight className="w-4 h-4 mt-0.5 text-purple-500" />
                        {strategy}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}