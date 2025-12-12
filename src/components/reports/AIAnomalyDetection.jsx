import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Shield, Eye, CheckCircle, Loader2, Sparkles } from 'lucide-react'
import { base44 } from '@/api/base44Client'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { differenceInDays } from 'date-fns'

export default function AIAnomalyDetection({ agents, commissions, appointments, contracts, onCreateAlert }) {
  const [anomalies, setAnomalies] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [dismissedAnomalies, setDismissedAnomalies] = useState(new Set());

  const scanForAnomalies = async () => {
    setIsScanning(true);
    try {
      const agentMetrics = agents.map(agent => {
        const agentCommissions = commissions.filter(c => c.agent_id === agent.id);
        const agentAppointments = appointments.filter(a => a.agent_id === agent.id);
        const totalCommission = agentCommissions.reduce((sum, c) => sum + (c.amount || 0), 0);
        const appointedCount = agentAppointments.filter(a => a.appointment_status === 'appointed').length;
        
        return {
          name: `${agent.first_name} ${agent.last_name}`,
          id: agent.id,
          status: agent.onboarding_status,
          totalCommission,
          commissionCount: agentCommissions.length,
          appointedCount,
          daysSinceOnboarding: agent.created_date ? differenceInDays(new Date(), new Date(agent.created_date)) : 0
        };
      });

      const avgCommission = agentMetrics.reduce((sum, a) => sum + a.totalCommission, 0) / Math.max(agentMetrics.length, 1);

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this insurance agency data for anomalies and unusual patterns.

Agent Metrics:
${JSON.stringify(agentMetrics.slice(0, 20), null, 2)}

Average Commission per Agent: $${avgCommission.toFixed(2)}
Total Agents: ${agents.length}
Total Commissions: ${commissions.length}

Identify:
1. Agents with unusually high or low performance
2. Suspicious activity patterns
3. Compliance red flags
4. Unusual commission patterns
5. Appointment status anomalies

For each anomaly, provide severity (critical/warning/info) and recommended action.`,
        response_json_schema: {
          type: "object",
          properties: {
            anomalies: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  type: { type: "string" },
                  severity: { type: "string", enum: ["critical", "warning", "info"] },
                  title: { type: "string" },
                  description: { type: "string" },
                  agent_name: { type: "string" },
                  agent_id: { type: "string" },
                  metric_value: { type: "string" },
                  expected_value: { type: "string" },
                  recommended_action: { type: "string" }
                }
              }
            },
            summary: { type: "string" },
            risk_score: { type: "number" }
          }
        }
      });

      setAnomalies(result);
      toast.success(`Scan complete: ${result.anomalies?.length || 0} anomalies detected`);
    } catch (err) {
      toast.error('Failed to scan for anomalies');
    } finally {
      setIsScanning(false);
    }
  };

  const dismissAnomaly = (id) => {
    setDismissedAnomalies(prev => new Set([...prev, id]));
  };

  const createAlertFromAnomaly = async (anomaly) => {
    await onCreateAlert({
      agent_id: anomaly.agent_id,
      alert_type: 'adverse_action',
      severity: anomaly.severity,
      title: anomaly.title,
      message: `${anomaly.description}. Recommended: ${anomaly.recommended_action}`
    });
    toast.success('Alert created');
  };

  const visibleAnomalies = anomalies?.anomalies?.filter(a => !dismissedAnomalies.has(a.id)) || [];
  const criticalCount = visibleAnomalies.filter(a => a.severity === 'critical').length;
  const warningCount = visibleAnomalies.filter(a => a.severity === 'warning').length;

  const severityConfig = {
    critical: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', icon: AlertTriangle },
    warning: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', icon: Eye },
    info: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', icon: Shield }
  };

  return (
    <Card className="border-0 shadow-premium dark:bg-slate-800/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2 dark:text-white">
            <Shield className="w-5 h-5 text-red-500" />
            AI Anomaly Detection
          </CardTitle>
          <div className="flex items-center gap-2">
            {anomalies && (
              <>
                {criticalCount > 0 && <Badge className="bg-red-500">{criticalCount} Critical</Badge>}
                {warningCount > 0 && <Badge className="bg-amber-500">{warningCount} Warning</Badge>}
              </>
            )}
            <Button onClick={scanForAnomalies} disabled={isScanning} variant="outline">
              {isScanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
              {isScanning ? 'Scanning...' : 'Scan Now'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!anomalies ? (
          <div className="text-center py-8 text-slate-400">
            <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Run a scan to detect anomalies in sales, appointments, and compliance</p>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {/* Risk Score */}
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl">
              <div>
                <p className="text-sm text-slate-500">Overall Risk Score</p>
                <p className={`text-3xl font-bold ${
                  anomalies.risk_score > 70 ? 'text-red-600' : 
                  anomalies.risk_score > 40 ? 'text-amber-600' : 'text-emerald-600'
                }`}>
                  {anomalies.risk_score}/100
                </p>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md">{anomalies.summary}</p>
            </div>

            {/* Anomalies List */}
            <AnimatePresence>
              {visibleAnomalies.map((anomaly, idx) => {
                const config = severityConfig[anomaly.severity];
                const Icon = config.icon;
                return (
                  <motion.div
                    key={anomaly.id || idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`p-4 rounded-xl ${config.bg} border border-transparent`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <Icon className={`w-5 h-5 mt-0.5 ${config.text}`} />
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className={`font-semibold ${config.text}`}>{anomaly.title}</h4>
                            <Badge variant="outline" className="text-xs">{anomaly.type}</Badge>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{anomaly.description}</p>
                          {anomaly.agent_name && (
                            <p className="text-xs text-slate-500">Agent: {anomaly.agent_name}</p>
                          )}
                          <p className="text-xs text-slate-500 mt-1">
                            Metric: {anomaly.metric_value} (Expected: {anomaly.expected_value})
                          </p>
                          <p className="text-sm font-medium mt-2 text-slate-700 dark:text-slate-300">
                            → {anomaly.recommended_action}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => createAlertFromAnomaly(anomaly)}>
                          Create Alert
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => dismissAnomaly(anomaly.id || idx)}>
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {visibleAnomalies.length === 0 && (
              <div className="text-center py-8 text-emerald-600">
                <CheckCircle className="w-12 h-12 mx-auto mb-3" />
                <p className="font-medium">No anomalies detected</p>
              </div>
            )}
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}