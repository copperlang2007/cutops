import { useState, useEffect } from 'react'
import { base44 } from '@/api/base44Client'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  DollarSign, Sparkles, Loader2, AlertTriangle, CheckCircle,
  FileText, Download, RefreshCw, Send, Clock, Eye, Copy,
  Mail, FileSignature, TrendingDown, ArrowUpCircle, Users,
  Building2, Scale, Zap
} from 'lucide-react';
import { format, addDays, differenceInDays } from 'date-fns'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

// Escalation criteria thresholds
const ESCALATION_CRITERIA = {
  noResponseDays: 30,
  highFinancialImpact: 5000,
  criticalFinancialImpact: 15000,
  patternThreshold: 3 // Number of similar issues before escalation
};

export default function EnhancedCommissionReconciliation({ commissions, contracts, agents }) {
  const queryClient = useQueryClient();
  const [reconciliation, setReconciliation] = useState(null);
  const [isReconciling, setIsReconciling] = useState(false);
  const [disputeLetters, setDisputeLetters] = useState([]);
  const [selectedLetter, setSelectedLetter] = useState(null);
  const [isGeneratingLetter, setIsGeneratingLetter] = useState(false);
  const [escalationQueue, setEscalationQueue] = useState([]);
  const [isGeneratingEscalation, setIsGeneratingEscalation] = useState(false);

  // Fetch existing escalations
  const { data: escalations = [] } = useQuery({
    queryKey: ['disputeEscalations'],
    queryFn: () => base44.entities.DisputeEscalation.list('-created_date')
  });

  // Auto-check for escalation candidates
  useEffect(() => {
    const checkEscalationCandidates = () => {
      const candidates = disputeLetters.filter(letter => {
        if (letter.status === 'resolved' || letter.status === 'escalated') return false;
        
        const daysSinceSent = letter.status === 'sent' || letter.status === 'awaiting_response'
          ? differenceInDays(new Date(), new Date(letter.created_date))
          : 0;
        
        const noResponse = daysSinceSent >= ESCALATION_CRITERIA.noResponseDays;
        const highImpact = letter.amount >= ESCALATION_CRITERIA.highFinancialImpact;
        const criticalImpact = letter.amount >= ESCALATION_CRITERIA.criticalFinancialImpact;
        
        return noResponse || criticalImpact || (highImpact && daysSinceSent >= 15);
      }).map(letter => ({
        letter,
        reason: letter.amount >= ESCALATION_CRITERIA.criticalFinancialImpact 
          ? 'high_financial_impact'
          : differenceInDays(new Date(), new Date(letter.created_date)) >= ESCALATION_CRITERIA.noResponseDays
          ? 'no_response'
          : 'pattern_detected',
        urgency: letter.amount >= ESCALATION_CRITERIA.criticalFinancialImpact ? 'critical' : 'high'
      }));
      
      setEscalationQueue(candidates);
    };

    if (disputeLetters.length > 0) {
      checkEscalationCandidates();
    }
  }, [disputeLetters]);

  const reconcileCommissions = async () => {
    setIsReconciling(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Perform detailed commission reconciliation analysis:

COMMISSIONS RECEIVED (Last 90 days):
${commissions.slice(0, 30).map(c => 
  `- ${c.carrier_name}: $${c.amount}, Type=${c.commission_type}, Status=${c.status}, Date=${c.payment_date || 'N/A'}, Policy=${c.policy_number || 'N/A'}`
).join('\n')}

ACTIVE CONTRACTS:
${contracts.filter(c => c.contract_status === 'active').slice(0, 15).map(c =>
  `- ${c.carrier_name}: Level=${c.commission_level || 'Standard'}, Writing#=${c.writing_number || 'N/A'}, States=${c.states?.join(',') || 'N/A'}`
).join('\n')}

Analyze for discrepancies:
1. Missing expected commissions
2. Rate discrepancies (expected vs actual)
3. Late payments (beyond 60-day cycle)
4. Clawbacks that may be disputable
5. Duplicate payments
6. Incorrect policy attribution

For each discrepancy, provide severity (critical/high/medium/low), estimated financial impact, and recommended dispute approach.`,
        response_json_schema: {
          type: "object",
          properties: {
            summary: {
              type: "object",
              properties: {
                total_received: { type: "number" },
                expected_total: { type: "number" },
                variance: { type: "number" },
                discrepancy_count: { type: "number" },
                total_disputed_amount: { type: "number" }
              }
            },
            discrepancies: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  carrier: { type: "string" },
                  issue_type: { type: "string" },
                  description: { type: "string" },
                  expected_amount: { type: "number" },
                  actual_amount: { type: "number" },
                  variance: { type: "number" },
                  severity: { type: "string" },
                  policy_numbers: { type: "array", items: { type: "string" } },
                  evidence_needed: { type: "array", items: { type: "string" } },
                  dispute_approach: { type: "string" },
                  success_likelihood: { type: "number" }
                }
              }
            },
            recommendations: { type: "array", items: { type: "string" } }
          }
        }
      });

      setReconciliation(result);
      toast.success('Reconciliation complete');
    } catch (err) {
      toast.error('Failed to reconcile');
    } finally {
      setIsReconciling(false);
    }
  };

  const generateDisputeLetter = async (discrepancy) => {
    setIsGeneratingLetter(true);
    try {
      const contract = contracts.find(c => c.carrier_name === discrepancy.carrier);
      
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate a professional, formal dispute letter for this commission discrepancy:

DISCREPANCY DETAILS:
- Carrier: ${discrepancy.carrier}
- Issue Type: ${discrepancy.issue_type}
- Description: ${discrepancy.description}
- Expected Amount: $${discrepancy.expected_amount}
- Received Amount: $${discrepancy.actual_amount}
- Variance: $${Math.abs(discrepancy.variance)}
- Severity: ${discrepancy.severity}
- Policy Numbers: ${discrepancy.policy_numbers?.join(', ') || 'Multiple'}
- Contract/Writing Number: ${contract?.writing_number || 'On file'}

DISPUTE APPROACH: ${discrepancy.dispute_approach}
EVIDENCE AVAILABLE: ${discrepancy.evidence_needed?.join(', ')}

Generate a formal business letter that:
1. Clearly states the discrepancy with specific amounts and dates
2. References relevant contract terms and commission schedules
3. Lists specific policy numbers affected
4. Requests detailed payment breakdown and audit
5. Proposes a resolution timeline (typically 30 days)
6. Maintains professional tone while being assertive
7. Includes a call to action with specific next steps

Also provide follow-up email templates for 15-day and 30-day follow-ups if no response.`,
        response_json_schema: {
          type: "object",
          properties: {
            letter: {
              type: "object",
              properties: {
                subject: { type: "string" },
                salutation: { type: "string" },
                body: { type: "string" },
                closing: { type: "string" },
                attachments_needed: { type: "array", items: { type: "string" } }
              }
            },
            followup_15_day: {
              type: "object",
              properties: {
                subject: { type: "string" },
                body: { type: "string" }
              }
            },
            followup_30_day: {
              type: "object",
              properties: {
                subject: { type: "string" },
                body: { type: "string" }
              }
            },
            escalation_contacts: { type: "array", items: { type: "string" } },
            reference_number: { type: "string" }
          }
        }
      });

      const newLetter = {
        id: `DL-${Date.now()}`,
        discrepancy,
        ...result,
        status: 'draft',
        created_date: new Date().toISOString(),
        carrier: discrepancy.carrier,
        amount: Math.abs(discrepancy.variance),
        followup_dates: {
          day_15: addDays(new Date(), 15).toISOString(),
          day_30: addDays(new Date(), 30).toISOString()
        }
      };

      setDisputeLetters(prev => [...prev, newLetter]);
      setSelectedLetter(newLetter);
      toast.success('Dispute letter generated');
    } catch (err) {
      toast.error('Failed to generate letter');
    } finally {
      setIsGeneratingLetter(false);
    }
  };

  const updateLetterStatus = (letterId, newStatus) => {
    setDisputeLetters(prev => prev.map(l => 
      l.id === letterId ? { ...l, status: newStatus, updated_date: new Date().toISOString() } : l
    ));
    toast.success(`Status updated to ${newStatus}`);
  };

  const sendDisputeLetter = async (letter) => {
    // In production, this would send via email
    updateLetterStatus(letter.id, 'sent');
    toast.success('Dispute letter sent to carrier');
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  // Generate AI escalation email
  const generateEscalationEmail = async (candidate) => {
    setIsGeneratingEscalation(true);
    try {
      const { letter, reason } = candidate;
      const previousAttempts = [
        { date: letter.created_date, type: 'initial_dispute', recipient: `${letter.carrier} Commission Department` }
      ];
      
      if (letter.followup_dates?.day_15 && differenceInDays(new Date(), new Date(letter.followup_dates.day_15)) >= 0) {
        previousAttempts.push({ date: letter.followup_dates.day_15, type: '15_day_followup', recipient: `${letter.carrier} Commission Department` });
      }

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate a formal escalation email for this unresolved commission dispute:

DISPUTE DETAILS:
- Carrier: ${letter.carrier}
- Issue Type: ${letter.discrepancy.issue_type}
- Original Dispute Date: ${format(new Date(letter.created_date), 'MMMM d, yyyy')}
- Days Without Resolution: ${differenceInDays(new Date(), new Date(letter.created_date))}
- Financial Impact: $${letter.amount.toLocaleString()}
- Original Reference: ${letter.reference_number || 'On file'}

ESCALATION REASON: ${reason === 'no_response' ? 'No response received within 30 days' : 
  reason === 'high_financial_impact' ? 'High financial impact requires immediate attention' :
  'Pattern of similar issues detected'}

PREVIOUS ATTEMPTS:
${previousAttempts.map(a => `- ${format(new Date(a.date), 'MMM d, yyyy')}: ${a.type.replace(/_/g, ' ')} to ${a.recipient}`).join('\n')}

ORIGINAL DISPUTE SUMMARY:
${letter.letter?.body?.substring(0, 500) || letter.discrepancy.description}

Generate a professional escalation email that:
1. Is addressed to carrier management/executive team
2. References all previous communication attempts with dates
3. Emphasizes the urgency and financial impact
4. Cites any relevant regulatory requirements for timely dispute resolution
5. Sets a firm 10-business-day deadline for response
6. Mentions potential escalation to state insurance commissioner if unresolved
7. Maintains professional but assertive tone
8. Requests a call with a supervisor/manager

Also generate an internal compliance notification if this should be escalated internally.`,
        response_json_schema: {
          type: "object",
          properties: {
            carrier_escalation: {
              type: "object",
              properties: {
                subject: { type: "string" },
                to_department: { type: "string" },
                body: { type: "string" },
                cc_recommendations: { type: "array", items: { type: "string" } },
                deadline: { type: "string" }
              }
            },
            internal_notification: {
              type: "object",
              properties: {
                subject: { type: "string" },
                body: { type: "string" },
                recommended_actions: { type: "array", items: { type: "string" } },
                risk_assessment: { type: "string" }
              }
            },
            escalation_level: { type: "number" },
            recommended_next_steps: { type: "array", items: { type: "string" } },
            regulatory_options: { type: "array", items: { type: "string" } }
          }
        }
      });

      // Create escalation record
      const escalationData = {
        commission_id: letter.discrepancy.id,
        carrier_name: letter.carrier,
        original_dispute_date: letter.created_date,
        escalation_level: result.escalation_level || 2,
        escalation_reason: reason,
        financial_impact: letter.amount,
        previous_attempts: previousAttempts,
        escalation_email_subject: result.carrier_escalation.subject,
        escalation_email_body: result.carrier_escalation.body,
        escalation_recipients: [result.carrier_escalation.to_department, ...(result.carrier_escalation.cc_recommendations || [])],
        status: 'pending',
        internal_escalation: letter.amount >= ESCALATION_CRITERIA.criticalFinancialImpact
      };

      await base44.entities.DisputeEscalation.create(escalationData);
      queryClient.invalidateQueries(['disputeEscalations']);
      
      // Update letter status
      updateLetterStatus(letter.id, 'escalated');
      
      toast.success('Escalation generated and saved');
      return result;
    } catch (err) {
      toast.error('Failed to generate escalation');
    } finally {
      setIsGeneratingEscalation(false);
    }
  };

  // Auto-escalate all candidates
  const autoEscalateAll = async () => {
    for (const candidate of escalationQueue) {
      await generateEscalationEmail(candidate);
    }
    setEscalationQueue([]);
  };

  // Send escalation email
  const sendEscalationEmail = async (escalation) => {
    try {
      // In production, integrate with email service
      await base44.entities.DisputeEscalation.update(escalation.id, { status: 'sent' });
      queryClient.invalidateQueries(['disputeEscalations']);
      toast.success('Escalation email sent');
    } catch (err) {
      toast.error('Failed to send escalation');
    }
  };

  const severityColors = {
    critical: 'bg-red-100 text-red-700 border-red-200',
    high: 'bg-orange-100 text-orange-700 border-orange-200',
    medium: 'bg-amber-100 text-amber-700 border-amber-200',
    low: 'bg-blue-100 text-blue-700 border-blue-200'
  };

  const statusColors = {
    draft: 'bg-slate-100 text-slate-700',
    sent: 'bg-blue-100 text-blue-700',
    awaiting_response: 'bg-amber-100 text-amber-700',
    resolved: 'bg-emerald-100 text-emerald-700',
    escalated: 'bg-red-100 text-red-700'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-0 shadow-premium overflow-hidden">
        {/* Premium Header with Gradient */}
        <div className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center"
              >
                <DollarSign className="w-6 h-6 text-white" />
              </motion.div>
              <div>
                <h2 className="text-xl font-bold text-white">AI Commission Reconciliation</h2>
                <p className="text-emerald-100 text-sm">Automated dispute detection & escalation</p>
              </div>
            </div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                size="sm"
                onClick={reconcileCommissions}
                disabled={isReconciling}
                className="bg-white text-emerald-600 hover:bg-emerald-50 shadow-lg"
              >
                {isReconciling ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                <span className="ml-2 font-semibold">Reconcile</span>
              </Button>
            </motion.div>
          </div>

          {/* Escalation Alert Banner */}
          <AnimatePresence>
            {escalationQueue.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                      <AlertTriangle className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">
                        {escalationQueue.length} dispute{escalationQueue.length > 1 ? 's' : ''} require escalation
                      </p>
                      <p className="text-emerald-100 text-xs">
                        Total impact: ${escalationQueue.reduce((s, c) => s + c.letter.amount, 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={autoEscalateAll}
                    disabled={isGeneratingEscalation}
                    className="bg-white/20 hover:bg-white/30 text-white border border-white/30"
                  >
                    {isGeneratingEscalation ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                    <span className="ml-1">Auto-Escalate All</span>
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <CardContent className="p-6">
          <Tabs defaultValue="discrepancies">
            <TabsList className="mb-4 bg-slate-100/80 p-1 rounded-xl">
              <TabsTrigger value="discrepancies" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                Discrepancies
              </TabsTrigger>
              <TabsTrigger value="disputes" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                Dispute Letters
                {disputeLetters.length > 0 && (
                  <Badge className="ml-1.5 bg-emerald-100 text-emerald-700 text-xs">{disputeLetters.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="escalations" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                Escalations
                {escalations.filter(e => e.status !== 'resolved').length > 0 && (
                  <Badge className="ml-1.5 bg-red-100 text-red-700 text-xs">
                    {escalations.filter(e => e.status !== 'resolved').length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

          <TabsContent value="discrepancies">
            {!reconciliation ? (
              <p className="text-sm text-slate-400 text-center py-6">
                Run reconciliation to identify commission discrepancies
              </p>
            ) : (
              <div className="space-y-4">
                {/* Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3 bg-emerald-50 rounded-lg text-center">
                    <p className="text-xs text-emerald-600">Received</p>
                    <p className="text-lg font-bold text-emerald-700">
                      ${reconciliation.summary?.total_received?.toLocaleString() || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg text-center">
                    <p className="text-xs text-blue-600">Expected</p>
                    <p className="text-lg font-bold text-blue-700">
                      ${reconciliation.summary?.expected_total?.toLocaleString() || 0}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg text-center ${
                    (reconciliation.summary?.variance || 0) < 0 ? 'bg-red-50' : 'bg-emerald-50'
                  }`}>
                    <p className={`text-xs ${(reconciliation.summary?.variance || 0) < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                      Variance
                    </p>
                    <p className={`text-lg font-bold ${(reconciliation.summary?.variance || 0) < 0 ? 'text-red-700' : 'text-emerald-700'}`}>
                      ${reconciliation.summary?.variance?.toLocaleString() || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-amber-50 rounded-lg text-center">
                    <p className="text-xs text-amber-600">Disputable</p>
                    <p className="text-lg font-bold text-amber-700">
                      ${reconciliation.summary?.total_disputed_amount?.toLocaleString() || 0}
                    </p>
                  </div>
                </div>

                {/* Discrepancies */}
                {reconciliation.discrepancies?.length > 0 && (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {reconciliation.discrepancies.map((d, i) => (
                      <div key={i} className={`p-3 rounded-lg border ${severityColors[d.severity]}`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{d.carrier}</span>
                            <Badge variant="outline">{d.issue_type}</Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={severityColors[d.severity]}>{d.severity}</Badge>
                            <span className="font-bold text-red-700">-${Math.abs(d.variance).toLocaleString()}</span>
                          </div>
                        </div>
                        <p className="text-sm mb-2">{d.description}</p>
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-slate-600">
                            Success likelihood: {d.success_likelihood}%
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-7 text-xs"
                            onClick={() => generateDisputeLetter(d)}
                            disabled={isGeneratingLetter}
                          >
                            {isGeneratingLetter ? (
                              <Loader2 className="w-3 h-3 animate-spin mr-1" />
                            ) : (
                              <FileSignature className="w-3 h-3 mr-1" />
                            )}
                            Generate Dispute Letter
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Recommendations */}
                {reconciliation.recommendations?.length > 0 && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-800 mb-2">Recommendations</h4>
                    <ul className="space-y-1">
                      {reconciliation.recommendations.map((rec, i) => (
                        <li key={i} className="text-xs text-blue-700">• {rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="disputes">
            {disputeLetters.length === 0 ? (
              <div className="text-center py-12">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4"
                >
                  <FileSignature className="w-8 h-8 text-slate-400" />
                </motion.div>
                <p className="text-slate-500 font-medium">No dispute letters generated yet</p>
                <p className="text-sm text-slate-400 mt-1">Run reconciliation to identify discrepancies</p>
              </div>
            ) : (
              <div className="space-y-3">
                {disputeLetters.map((letter, idx) => (
                  <motion.div 
                    key={letter.id} 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="p-4 bg-gradient-to-r from-slate-50 to-white rounded-xl border border-slate-200/80 hover:border-slate-300 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          letter.status === 'resolved' ? 'bg-emerald-100' :
                          letter.status === 'escalated' ? 'bg-red-100' :
                          'bg-blue-100'
                        }`}>
                          <Building2 className={`w-5 h-5 ${
                            letter.status === 'resolved' ? 'text-emerald-600' :
                            letter.status === 'escalated' ? 'text-red-600' :
                            'text-blue-600'
                          }`} />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{letter.carrier}</p>
                          <p className="text-xs text-slate-500">{letter.discrepancy.issue_type} • {format(new Date(letter.created_date), 'MMM d, yyyy')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={`${statusColors[letter.status]} font-semibold`}>{letter.status.replace('_', ' ')}</Badge>
                        <span className="text-lg font-bold text-red-600">${letter.amount.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-8 text-xs rounded-lg"
                        onClick={() => setSelectedLetter(letter)}
                      >
                        <Eye className="w-3.5 h-3.5 mr-1.5" />
                        View Details
                      </Button>
                      {letter.status === 'draft' && (
                        <Button 
                          size="sm" 
                          className="h-8 text-xs bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 rounded-lg"
                          onClick={() => sendDisputeLetter(letter)}
                        >
                          <Send className="w-3.5 h-3.5 mr-1.5" />
                          Send to Carrier
                        </Button>
                      )}
                      {letter.status === 'sent' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="h-8 text-xs rounded-lg"
                          onClick={() => updateLetterStatus(letter.id, 'awaiting_response')}
                        >
                          <Clock className="w-3.5 h-3.5 mr-1.5" />
                          Mark Awaiting
                        </Button>
                      )}
                      {letter.status === 'awaiting_response' && (
                        <>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="h-8 text-xs text-emerald-600 hover:bg-emerald-50 rounded-lg"
                            onClick={() => updateLetterStatus(letter.id, 'resolved')}
                          >
                            <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                            Mark Resolved
                          </Button>
                          <Button 
                            size="sm" 
                            className="h-8 text-xs bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 rounded-lg"
                            onClick={() => generateEscalationEmail({ letter, reason: 'no_response' })}
                            disabled={isGeneratingEscalation}
                          >
                            {isGeneratingEscalation ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <ArrowUpCircle className="w-3.5 h-3.5 mr-1.5" />}
                            Escalate
                          </Button>
                        </>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* New Escalations Tab */}
          <TabsContent value="escalations">
            {escalations.length === 0 ? (
              <div className="text-center py-12">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4"
                >
                  <ArrowUpCircle className="w-8 h-8 text-slate-400" />
                </motion.div>
                <p className="text-slate-500 font-medium">No escalations yet</p>
                <p className="text-sm text-slate-400 mt-1">Disputes are automatically escalated based on criteria</p>
              </div>
            ) : (
              <div className="space-y-3">
                {escalations.map((escalation, idx) => (
                  <motion.div
                    key={escalation.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className={`p-4 rounded-xl border ${
                      escalation.status === 'resolved' ? 'bg-emerald-50/50 border-emerald-200' :
                      escalation.escalation_level >= 3 ? 'bg-red-50/50 border-red-200' :
                      'bg-amber-50/50 border-amber-200'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          escalation.escalation_level >= 3 ? 'bg-red-100' : 'bg-amber-100'
                        }`}>
                          <Scale className={`w-5 h-5 ${
                            escalation.escalation_level >= 3 ? 'text-red-600' : 'text-amber-600'
                          }`} />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{escalation.carrier_name}</p>
                          <p className="text-xs text-slate-500">
                            Level {escalation.escalation_level} Escalation • {escalation.escalation_reason?.replace('_', ' ')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-slate-800">${escalation.financial_impact?.toLocaleString()}</p>
                        <Badge className={statusColors[escalation.status] || 'bg-slate-100 text-slate-600'}>
                          {escalation.status}
                        </Badge>
                      </div>
                    </div>

                    {/* Previous Attempts Timeline */}
                    {escalation.previous_attempts?.length > 0 && (
                      <div className="mb-3 p-3 bg-white/60 rounded-lg">
                        <p className="text-xs font-medium text-slate-600 mb-2">Previous Attempts</p>
                        <div className="space-y-1">
                          {escalation.previous_attempts.map((attempt, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs text-slate-500">
                              <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                              <span>{format(new Date(attempt.date), 'MMM d')}: {attempt.type?.replace(/_/g, ' ')}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 flex-wrap">
                      {escalation.status === 'pending' && (
                        <Button
                          size="sm"
                          className="h-8 text-xs bg-gradient-to-r from-amber-600 to-amber-500 rounded-lg"
                          onClick={() => sendEscalationEmail(escalation)}
                        >
                          <Send className="w-3.5 h-3.5 mr-1.5" />
                          Send Escalation
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs rounded-lg"
                        onClick={() => copyToClipboard(escalation.escalation_email_body)}
                      >
                        <Copy className="w-3.5 h-3.5 mr-1.5" />
                        Copy Email
                      </Button>
                      {escalation.status !== 'resolved' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs text-emerald-600 hover:bg-emerald-50 rounded-lg"
                          onClick={async () => {
                            await base44.entities.DisputeEscalation.update(escalation.id, { status: 'resolved' });
                            queryClient.invalidateQueries(['disputeEscalations']);
                          }}
                        >
                          <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                          Mark Resolved
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Letter Preview Dialog */}
        <Dialog open={!!selectedLetter} onOpenChange={() => setSelectedLetter(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Dispute Letter - {selectedLetter?.carrier}</DialogTitle>
            </DialogHeader>
            {selectedLetter && (
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Subject: {selectedLetter.letter.subject}</h4>
                    <Button size="sm" variant="ghost" onClick={() => copyToClipboard(selectedLetter.letter.body)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-sm mb-2">{selectedLetter.letter.salutation}</p>
                  <p className="text-sm whitespace-pre-wrap">{selectedLetter.letter.body}</p>
                  <p className="text-sm mt-2">{selectedLetter.letter.closing}</p>
                </div>

                {selectedLetter.letter.attachments_needed?.length > 0 && (
                  <div className="p-3 bg-amber-50 rounded-lg">
                    <h4 className="text-sm font-medium text-amber-800 mb-1">Required Attachments</h4>
                    <ul className="text-xs text-amber-700">
                      {selectedLetter.letter.attachments_needed.map((att, i) => (
                        <li key={i}>• {att}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-800 mb-1">15-Day Follow-up</h4>
                    <p className="text-xs text-blue-600 mb-1">{selectedLetter.followup_15_day.subject}</p>
                    <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => copyToClipboard(selectedLetter.followup_15_day.body)}>
                      <Copy className="w-3 h-3 mr-1" /> Copy
                    </Button>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <h4 className="text-sm font-medium text-purple-800 mb-1">30-Day Follow-up</h4>
                    <p className="text-xs text-purple-600 mb-1">{selectedLetter.followup_30_day.subject}</p>
                    <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => copyToClipboard(selectedLetter.followup_30_day.body)}>
                      <Copy className="w-3 h-3 mr-1" /> Copy
                    </Button>
                  </div>
                </div>

                {selectedLetter.escalation_contacts?.length > 0 && (
                  <div className="p-3 bg-red-50 rounded-lg">
                    <h4 className="text-sm font-medium text-red-800 mb-1">Escalation Contacts</h4>
                    <ul className="text-xs text-red-700">
                      {selectedLetter.escalation_contacts.map((contact, i) => (
                        <li key={i}>• {contact}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button className="flex-1" onClick={() => sendDisputeLetter(selectedLetter)}>
                    <Send className="w-4 h-4 mr-2" />
                    Send to Carrier
                  </Button>
                  <Button variant="outline" onClick={() => copyToClipboard(
                    `${selectedLetter.letter.subject}\n\n${selectedLetter.letter.salutation}\n\n${selectedLetter.letter.body}\n\n${selectedLetter.letter.closing}`
                  )}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy All
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
    </motion.div>
  );
}