import { useState, useMemo } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { 
  Sparkles, Building2, CheckCircle2, Clock, AlertTriangle, 
  FileText, Send, Loader2, ChevronRight, Target, Zap,
  Calendar, Bell, RefreshCw, Download, Rocket, ArrowRight,
  RotateCcw, ExternalLink, Mail, Phone, Shield
} from 'lucide-react';
import { base44 } from '@/api/base44Client'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { format, addDays, differenceInDays } from 'date-fns'

const CARRIER_MARKET_DATA = {
  'Aetna': { states: ['CA', 'TX', 'FL', 'NY', 'PA'], priority: 'high', avgProcessTime: 14, hasAPI: true, apiEndpoint: 'aetna-contracting', contactEmail: 'contracting@aetna.com', contactPhone: '1-800-555-0101' },
  'Humana': { states: ['FL', 'TX', 'OH', 'GA', 'AZ'], priority: 'high', avgProcessTime: 10, hasAPI: true, apiEndpoint: 'humana-agent-portal', contactEmail: 'agentservices@humana.com', contactPhone: '1-800-555-0102' },
  'UnitedHealthcare': { states: ['CA', 'TX', 'FL', 'NY', 'IL'], priority: 'high', avgProcessTime: 21, hasAPI: true, apiEndpoint: 'uhc-broker-portal', contactEmail: 'brokerservices@uhc.com', contactPhone: '1-800-555-0103' },
  'Cigna': { states: ['CA', 'TX', 'FL', 'PA', 'NC'], priority: 'medium', avgProcessTime: 14, hasAPI: false, portalUrl: 'https://cigna.com/agents', contactEmail: 'agentcontracting@cigna.com', contactPhone: '1-800-555-0104' },
  'Anthem': { states: ['CA', 'NY', 'OH', 'IN', 'VA'], priority: 'medium', avgProcessTime: 18, hasAPI: true, apiEndpoint: 'anthem-producer-portal', contactEmail: 'producerservices@anthem.com', contactPhone: '1-800-555-0105' },
  'Centene': { states: ['TX', 'FL', 'CA', 'GA', 'IL'], priority: 'medium', avgProcessTime: 12, hasAPI: false, portalUrl: 'https://centene.com/brokers', contactEmail: 'brokers@centene.com', contactPhone: '1-800-555-0106' },
  'Molina': { states: ['CA', 'TX', 'FL', 'WA', 'OH'], priority: 'low', avgProcessTime: 10, hasAPI: true, apiEndpoint: 'molina-agent-api', contactEmail: 'agentrelations@molina.com', contactPhone: '1-800-555-0107' },
  'WellCare': { states: ['FL', 'GA', 'TX', 'NY', 'IL'], priority: 'medium', avgProcessTime: 14, hasAPI: false, portalUrl: 'https://wellcare.com/agents', contactEmail: 'agentcontracting@wellcare.com', contactPhone: '1-800-555-0108' }
};

export default function AIAppointmentAutomation({ 
  agent, 
  licenses = [], 
  appointments = [], 
  carriers = [],
  onCreateAppointment,
  onUpdateAppointment,
  onCreateTask,
  onCreateAlert 
}) {
  const [recommendations, setRecommendations] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedCarriers, setSelectedCarriers] = useState([]);
  const [prefilledForms, setPrefilledForms] = useState({});
  const [isGeneratingForms, setIsGeneratingForms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState({});
  const [submissionResults, setSubmissionResults] = useState({});
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [carriersToSubmit, setCarriersToSubmit] = useState([]);
  const [alternativeCarriers, setAlternativeCarriers] = useState(null);
  const [aiReminders, setAiReminders] = useState([]);
  const [isLoadingReminders, setIsLoadingReminders] = useState(false);

  // Get agent's licensed states
  const licensedStates = useMemo(() => 
    [...new Set(licenses.filter(l => l.status === 'active').map(l => l.state))],
    [licenses]
  );

  // Get existing appointments
  const existingCarriers = useMemo(() => 
    new Set(appointments.map(a => a.carrier_name)),
    [appointments]
  );

  // Pending/outstanding appointments
  const pendingAppointments = useMemo(() => 
    appointments.filter(a => ['pending', 'not_started'].includes(a.appointment_status)),
    [appointments]
  );

  // Analyze and generate recommendations
  const analyzeAppointmentNeeds = async () => {
    setIsAnalyzing(true);
    
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this insurance agent's profile and recommend carrier appointments.

Agent: ${agent.first_name} ${agent.last_name}
Licensed States: ${licensedStates.join(', ') || 'None'}
Current Appointments: ${[...existingCarriers].join(', ') || 'None'}
NPN: ${agent.npn}

Available Carriers and their primary markets:
${Object.entries(CARRIER_MARKET_DATA).map(([name, data]) => 
  `- ${name}: States: ${data.states.join(', ')}, Priority: ${data.priority}, Avg Process Time: ${data.avgProcessTime} days`
).join('\n')}

Based on the agent's licensed states and market opportunities, recommend:
1. Which carriers they should get appointed with (prioritize by market overlap)
2. Estimated revenue potential for each recommendation
3. Any urgent appointments needed for upcoming enrollment periods
4. Specific action items for each recommended carrier`,
        response_json_schema: {
          type: "object",
          properties: {
            recommendations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  carrier_name: { type: "string" },
                  priority: { type: "string", enum: ["high", "medium", "low"] },
                  matching_states: { type: "array", items: { type: "string" } },
                  revenue_potential: { type: "string" },
                  reasoning: { type: "string" },
                  action_items: { type: "array", items: { type: "string" } },
                  estimated_process_days: { type: "number" }
                }
              }
            },
            summary: { type: "string" },
            urgent_actions: { type: "array", items: { type: "string" } },
            market_coverage_score: { type: "number" }
          }
        }
      });

      // Filter out already appointed carriers
      const filteredRecs = {
        ...result,
        recommendations: result.recommendations?.filter(r => !existingCarriers.has(r.carrier_name)) || []
      };
      
      setRecommendations(filteredRecs);
      toast.success('Analysis complete!');
    } catch (err) {
      toast.error('Failed to analyze appointment needs');
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Generate pre-filled appointment forms
  const generatePrefilledForms = async () => {
    if (selectedCarriers.length === 0) {
      toast.error('Select at least one carrier');
      return;
    }

    setIsGeneratingForms(true);

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate pre-filled carrier appointment form data for an insurance agent.

Agent Information:
- Name: ${agent.first_name} ${agent.last_name}
- Email: ${agent.email}
- Phone: ${agent.phone || 'Not provided'}
- NPN: ${agent.npn}
- SSN Last 4: ${agent.ssn_last_four || 'XXXX'}
- Date of Birth: ${agent.date_of_birth || 'Not provided'}
- Address: ${agent.address || ''}, ${agent.city || ''}, ${agent.state || ''} ${agent.zip || ''}

Licensed States: ${licensedStates.join(', ')}

Generate form data for these carriers: ${selectedCarriers.join(', ')}

For each carrier, provide the standard appointment form fields with the agent's information pre-filled where applicable.`,
        response_json_schema: {
          type: "object",
          properties: {
            forms: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  carrier_name: { type: "string" },
                  form_fields: {
                    type: "object",
                    properties: {
                      agent_name: { type: "string" },
                      npn: { type: "string" },
                      email: { type: "string" },
                      phone: { type: "string" },
                      address: { type: "string" },
                      city: { type: "string" },
                      state: { type: "string" },
                      zip: { type: "string" },
                      dob: { type: "string" },
                      ssn_last_four: { type: "string" },
                      requested_states: { type: "array", items: { type: "string" } },
                      product_lines: { type: "array", items: { type: "string" } }
                    }
                  },
                  submission_url: { type: "string" },
                  required_documents: { type: "array", items: { type: "string" } },
                  estimated_approval_days: { type: "number" }
                }
              }
            }
          }
        }
      });

      const formsMap = {};
      result.forms?.forEach(form => {
        formsMap[form.carrier_name] = form;
      });
      setPrefilledForms(formsMap);
      toast.success('Forms generated!');
    } catch (err) {
      toast.error('Failed to generate forms');
    } finally {
      setIsGeneratingForms(false);
    }
  };

  // Start appointment process
  const startAppointment = async (carrierName, formData) => {
    try {
      const carrierData = CARRIER_MARKET_DATA[carrierName] || { avgProcessTime: 14 };
      
      await onCreateAppointment({
        agent_id: agent.id,
        carrier_name: carrierName,
        appointment_status: 'pending',
        rts_status: 'not_ready',
        states: formData?.form_fields?.requested_states || licensedStates
      });

      // Create follow-up task
      await onCreateTask({
        title: `Follow up on ${carrierName} appointment`,
        description: `Check status of appointment application for ${agent.first_name} ${agent.last_name}`,
        task_type: 'follow_up',
        priority: 'medium',
        agent_id: agent.id,
        due_date: format(addDays(new Date(), carrierData.avgProcessTime), 'yyyy-MM-dd'),
        auto_generated: true
      });

      toast.success(`Started ${carrierName} appointment process`);
      setSelectedCarriers(prev => prev.filter(c => c !== carrierName));
    } catch (err) {
      toast.error('Failed to start appointment');
    }
  };

  // Auto-submit appointment forms via API
  const autoSubmitAppointment = async (carrierName, formData) => {
    const carrierData = CARRIER_MARKET_DATA[carrierName];
    if (!carrierData?.hasAPI) {
      toast.error(`${carrierName} doesn't support automated submission`);
      return { success: false, reason: 'no_api' };
    }

    setIsSubmitting(prev => ({ ...prev, [carrierName]: true }));

    try {
      // Simulate API submission with validation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Simulate an API submission response for carrier appointment.
Carrier: ${carrierName}
Agent: ${agent.first_name} ${agent.last_name}
NPN: ${agent.npn}
States: ${formData?.form_fields?.requested_states?.join(', ') || licensedStates.join(', ')}

Generate a realistic API response including:
- Confirmation number
- Estimated processing time
- Any additional requirements
- Next steps`,
        response_json_schema: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            confirmation_number: { type: "string" },
            estimated_completion_date: { type: "string" },
            status: { type: "string" },
            additional_requirements: { type: "array", items: { type: "string" } },
            next_steps: { type: "array", items: { type: "string" } },
            carrier_contact: { type: "string" }
          }
        }
      });

      setSubmissionResults(prev => ({ ...prev, [carrierName]: result }));

      // Create appointment record
      await onCreateAppointment({
        agent_id: agent.id,
        carrier_name: carrierName,
        appointment_status: 'pending',
        rts_status: 'not_ready',
        states: formData?.form_fields?.requested_states || licensedStates,
        writing_number: result.confirmation_number
      });

      // Create follow-up task
      await onCreateTask({
        title: `Track ${carrierName} appointment - ${result.confirmation_number}`,
        description: `Auto-submitted via API. Expected completion: ${result.estimated_completion_date}. ${result.next_steps?.join(' ')}`,
        task_type: 'follow_up',
        priority: 'medium',
        agent_id: agent.id,
        due_date: format(addDays(new Date(), carrierData.avgProcessTime), 'yyyy-MM-dd'),
        auto_generated: true
      });

      toast.success(`${carrierName} appointment submitted! Confirmation: ${result.confirmation_number}`);
      return { success: true, result };
    } catch (err) {
      toast.error(`Failed to submit ${carrierName} appointment`);
      return { success: false, error: err.message };
    } finally {
      setIsSubmitting(prev => ({ ...prev, [carrierName]: false }));
    }
  };

  // Batch submit multiple appointments
  const batchSubmitAppointments = async () => {
    const apiCarriers = carriersToSubmit.filter(c => CARRIER_MARKET_DATA[c]?.hasAPI);
    const manualCarriers = carriersToSubmit.filter(c => !CARRIER_MARKET_DATA[c]?.hasAPI);

    setShowSubmitDialog(false);

    for (const carrier of apiCarriers) {
      await autoSubmitAppointment(carrier, prefilledForms[carrier]);
    }

    if (manualCarriers.length > 0) {
      toast.info(`${manualCarriers.length} carrier(s) require manual submission: ${manualCarriers.join(', ')}`);
    }
  };

  // Generate AI-powered reminders
  const generateAIReminders = async () => {
    setIsLoadingReminders(true);
    try {
      const pendingData = pendingAppointments.map(apt => ({
        carrier: apt.carrier_name,
        daysPending: apt.created_date ? differenceInDays(new Date(), new Date(apt.created_date)) : 0,
        expectedDays: CARRIER_MARKET_DATA[apt.carrier_name]?.avgProcessTime || 14,
        states: apt.states
      }));

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze these pending carrier appointments and generate smart reminders.

Pending Appointments:
${JSON.stringify(pendingData, null, 2)}

For each appointment, provide:
1. Priority level (high/medium/low)
2. Recommended action
3. Follow-up message template
4. Escalation suggestion if delayed
5. Alternative carrier suggestions if significantly delayed`,
        response_json_schema: {
          type: "object",
          properties: {
            reminders: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  carrier_name: { type: "string" },
                  priority: { type: "string" },
                  status_assessment: { type: "string" },
                  recommended_action: { type: "string" },
                  follow_up_message: { type: "string" },
                  escalation_contact: { type: "string" },
                  should_escalate: { type: "boolean" },
                  alternative_carriers: { type: "array", items: { type: "string" } }
                }
              }
            },
            summary: { type: "string" }
          }
        }
      });

      setAiReminders(result.reminders || []);
      toast.success('AI reminders generated');
    } catch (err) {
      toast.error('Failed to generate reminders');
    } finally {
      setIsLoadingReminders(false);
    }
  };

  // Get alternative carrier suggestions for delayed appointments
  const suggestAlternativeCarriers = async (delayedCarrier) => {
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Suggest alternative carriers for an agent whose ${delayedCarrier} appointment is delayed.

Agent's Licensed States: ${licensedStates.join(', ')}
Current Appointments: ${[...existingCarriers].join(', ')}
Delayed Carrier: ${delayedCarrier}

Suggest 3 alternative carriers that:
1. Operate in similar states
2. Have faster processing times
3. Are not already appointed
4. Have good market presence`,
        response_json_schema: {
          type: "object",
          properties: {
            alternatives: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  carrier_name: { type: "string" },
                  reason: { type: "string" },
                  overlapping_states: { type: "array", items: { type: "string" } },
                  estimated_process_days: { type: "number" },
                  market_strength: { type: "string" }
                }
              }
            },
            recommendation: { type: "string" }
          }
        }
      });

      setAlternativeCarriers({ forCarrier: delayedCarrier, ...result });
      toast.success('Alternative carriers identified');
    } catch (err) {
      toast.error('Failed to get alternatives');
    }
  };

  // Send reminders for pending appointments
  const sendReminders = async () => {
    const overdue = pendingAppointments.filter(a => {
      if (!a.created_date) return false;
      const daysSinceStart = differenceInDays(new Date(), new Date(a.created_date));
      return daysSinceStart > 14;
    });

    if (overdue.length === 0) {
      toast.info('No overdue appointments');
      return;
    }

    for (const apt of overdue) {
      await onCreateAlert({
        agent_id: agent.id,
        alert_type: 'appointment_pending',
        severity: 'warning',
        title: `${apt.carrier_name} Appointment Overdue`,
        message: `Appointment application has been pending for over 14 days. Follow up with carrier.`
      });
    }

    toast.success(`Created ${overdue.length} reminder alerts`);
  };

  // Open batch submit dialog
  const openSubmitDialog = () => {
    const carriersWithForms = Object.keys(prefilledForms);
    if (carriersWithForms.length === 0) {
      toast.error('Generate forms first');
      return;
    }
    setCarriersToSubmit(carriersWithForms.filter(c => CARRIER_MARKET_DATA[c]?.hasAPI));
    setShowSubmitDialog(true);
  };

  const toggleCarrierSelection = (carrierName) => {
    setSelectedCarriers(prev => 
      prev.includes(carrierName) 
        ? prev.filter(c => c !== carrierName)
        : [...prev, carrierName]
    );
  };

  const priorityColors = {
    high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    low: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
  };

  return (
    <Card className="border-0 shadow-premium dark:bg-slate-800/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2 dark:text-white">
            <Sparkles className="w-5 h-5 text-purple-500" />
            AI Appointment Automation
          </CardTitle>
          <div className="flex items-center gap-2">
            {pendingAppointments.length > 0 && (
              <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30">
                {pendingAppointments.length} Pending
              </Badge>
            )}
            <Button 
              variant="outline" 
              size="sm"
              onClick={sendReminders}
              className="text-xs"
            >
              <Bell className="w-3 h-3 mr-1" />
              Send Reminders
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="recommendations" className="space-y-4">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="recommendations">
              <Target className="w-4 h-4 mr-2" />
              Recommendations
            </TabsTrigger>
            <TabsTrigger value="forms">
              <FileText className="w-4 h-4 mr-2" />
              Pre-fill Forms
            </TabsTrigger>
            <TabsTrigger value="tracking">
              <Clock className="w-4 h-4 mr-2" />
              Status Tracking
            </TabsTrigger>
          </TabsList>

          <TabsContent value="recommendations" className="space-y-4">
            {/* Current Coverage Summary */}
            <div className="p-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-slate-700 dark:text-slate-300">Current Coverage</h4>
                <Badge variant="outline">{licensedStates.length} States Licensed</Badge>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-500 dark:text-slate-400">Active Appointments</p>
                  <p className="text-2xl font-bold text-slate-800 dark:text-white">
                    {appointments.filter(a => a.appointment_status === 'appointed').length}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400">Market Coverage</p>
                  <p className="text-2xl font-bold text-teal-600">
                    {recommendations?.market_coverage_score || '--'}%
                  </p>
                </div>
              </div>
            </div>

            <Button 
              onClick={analyzeAppointmentNeeds}
              disabled={isAnalyzing || licensedStates.length === 0}
              className="w-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing Market Opportunities...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Analyze Appointment Needs
                </>
              )}
            </Button>

            {licensedStates.length === 0 && (
              <p className="text-sm text-amber-600 dark:text-amber-400 text-center">
                Agent needs active licenses before appointment recommendations
              </p>
            )}

            <AnimatePresence>
              {recommendations && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3"
                >
                  {recommendations.summary && (
                    <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                      <p className="text-sm text-purple-800 dark:text-purple-200">{recommendations.summary}</p>
                    </div>
                  )}

                  {recommendations.urgent_actions?.length > 0 && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                      <h5 className="text-sm font-semibold text-red-800 dark:text-red-200 mb-2 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Urgent Actions
                      </h5>
                      <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                        {recommendations.urgent_actions.map((action, i) => (
                          <li key={i}>• {action}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="space-y-2">
                    <h4 className="font-medium text-slate-700 dark:text-slate-300">Recommended Carriers</h4>
                    {recommendations.recommendations?.map((rec, idx) => (
                      <motion.div
                        key={rec.carrier_name}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                          selectedCarriers.includes(rec.carrier_name)
                            ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                        }`}
                        onClick={() => toggleCarrierSelection(rec.carrier_name)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${
                              selectedCarriers.includes(rec.carrier_name) ? 'bg-teal-500' : 'bg-slate-300'
                            }`} />
                            <h5 className="font-semibold text-slate-800 dark:text-white">{rec.carrier_name}</h5>
                            <Badge className={priorityColors[rec.priority]}>{rec.priority}</Badge>
                          </div>
                          <span className="text-xs text-slate-500">~{rec.estimated_process_days} days</span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{rec.reasoning}</p>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {rec.matching_states?.map(state => (
                            <Badge key={state} variant="outline" className="text-xs">{state}</Badge>
                          ))}
                        </div>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                          💰 {rec.revenue_potential}
                        </p>
                      </motion.div>
                    ))}
                  </div>

                  {selectedCarriers.length > 0 && (
                    <Button 
                      onClick={generatePrefilledForms}
                      className="w-full bg-teal-600 hover:bg-teal-700"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Generate Forms for {selectedCarriers.length} Carrier(s)
                    </Button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </TabsContent>

          <TabsContent value="forms" className="space-y-4">
            {selectedCarriers.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Select carriers from recommendations to generate forms</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {selectedCarriers.length} carrier(s) selected
                  </p>
                  <div className="flex gap-2">
                    <Button 
                      onClick={generatePrefilledForms}
                      disabled={isGeneratingForms}
                      size="sm"
                      variant="outline"
                    >
                      {isGeneratingForms ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Regenerate
                        </>
                      )}
                    </Button>
                    {Object.keys(prefilledForms).length > 0 && (
                      <Button 
                        onClick={openSubmitDialog}
                        className="bg-gradient-to-r from-emerald-600 to-teal-600"
                        size="sm"
                      >
                        <Rocket className="w-4 h-4 mr-2" />
                        Auto-Submit All
                      </Button>
                    )}
                  </div>
                </div>

                {Object.entries(prefilledForms).map(([carrier, form]) => {
                  const carrierData = CARRIER_MARKET_DATA[carrier];
                  const submission = submissionResults[carrier];
                  const isSubmittingCarrier = isSubmitting[carrier];

                  return (
                    <Card key={carrier} className={`border ${submission?.success ? 'border-emerald-300 bg-emerald-50/50 dark:bg-emerald-900/10' : 'border-slate-200 dark:border-slate-700'}`}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-teal-600" />
                            {carrier}
                            {carrierData?.hasAPI && (
                              <Badge className="bg-emerald-100 text-emerald-700 text-xs">API Available</Badge>
                            )}
                            {submission?.success && (
                              <Badge className="bg-emerald-500 text-white text-xs">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Submitted
                              </Badge>
                            )}
                          </CardTitle>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Download className="w-3 h-3 mr-1" />
                              Export
                            </Button>
                            {carrierData?.hasAPI ? (
                              <Button 
                                size="sm"
                                className="bg-gradient-to-r from-emerald-600 to-teal-600"
                                onClick={() => autoSubmitAppointment(carrier, form)}
                                disabled={isSubmittingCarrier || submission?.success}
                              >
                                {isSubmittingCarrier ? (
                                  <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                ) : (
                                  <Rocket className="w-3 h-3 mr-1" />
                                )}
                                {submission?.success ? 'Submitted' : 'Auto-Submit'}
                              </Button>
                            ) : (
                              <Button 
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(carrierData?.portalUrl, '_blank')}
                              >
                                <ExternalLink className="w-3 h-3 mr-1" />
                                Manual Submit
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-2">
                        {submission?.success ? (
                          <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg mb-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                                Confirmation: {submission.confirmation_number}
                              </span>
                              <Badge variant="outline" className="text-emerald-700">
                                Est. {submission.estimated_completion_date}
                              </Badge>
                            </div>
                            {submission.next_steps?.length > 0 && (
                              <div className="text-xs text-emerald-700 dark:text-emerald-400">
                                <p className="font-medium mb-1">Next Steps:</p>
                                {submission.next_steps.map((step, i) => (
                                  <p key={i}>• {step}</p>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            {Object.entries(form.form_fields || {}).map(([key, value]) => (
                              <div key={key} className="p-2 bg-slate-50 dark:bg-slate-700/30 rounded">
                                <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                                  {key.replace(/_/g, ' ')}
                                </p>
                                <p className="font-medium text-slate-800 dark:text-white truncate">
                                  {Array.isArray(value) ? value.join(', ') : value || '--'}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Carrier Contact Info */}
                        <div className="mt-3 p-2 bg-slate-50 dark:bg-slate-700/30 rounded flex items-center justify-between">
                          <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {carrierData?.contactEmail}
                            </span>
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {carrierData?.contactPhone}
                            </span>
                          </div>
                          <span className="text-xs text-slate-500">~{carrierData?.avgProcessTime} days processing</span>
                        </div>

                        {form.required_documents?.length > 0 && !submission?.success && (
                          <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-900/20 rounded">
                            <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-1">Required Documents:</p>
                            <ul className="text-xs text-amber-600 dark:text-amber-300">
                              {form.required_documents.map((doc, i) => (
                                <li key={i}>• {doc}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </>
            )}
          </TabsContent>

          <TabsContent value="tracking" className="space-y-4">
            {/* AI Reminders Section */}
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-slate-700 dark:text-slate-300">Status Tracking</h4>
              <Button 
                onClick={generateAIReminders}
                disabled={isLoadingReminders || pendingAppointments.length === 0}
                size="sm"
                variant="outline"
              >
                {isLoadingReminders ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                AI Reminders
              </Button>
            </div>

            {/* AI Generated Reminders */}
            {aiReminders.length > 0 && (
              <div className="p-4 bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-xl mb-4">
                <h5 className="font-semibold text-purple-700 dark:text-purple-300 mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  AI-Powered Recommendations
                </h5>
                <div className="space-y-3">
                  {aiReminders.map((reminder, idx) => (
                    <div key={idx} className="p-3 bg-white dark:bg-slate-800 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-slate-700 dark:text-slate-300">{reminder.carrier_name}</span>
                        <Badge className={
                          reminder.priority === 'high' ? 'bg-red-100 text-red-700' :
                          reminder.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                          'bg-blue-100 text-blue-700'
                        }>
                          {reminder.priority} priority
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{reminder.status_assessment}</p>
                      <p className="text-sm font-medium text-purple-700 dark:text-purple-400 mb-2">
                        → {reminder.recommended_action}
                      </p>
                      {reminder.should_escalate && (
                        <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded text-xs text-red-700 dark:text-red-400 mb-2">
                          <AlertTriangle className="w-3 h-3 inline mr-1" />
                          Escalation recommended: {reminder.escalation_contact}
                        </div>
                      )}
                      {reminder.alternative_carriers?.length > 0 && (
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-slate-500">Alternatives:</span>
                          {reminder.alternative_carriers.map((alt, i) => (
                            <Badge key={i} variant="outline" className="text-xs">{alt}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {appointments.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No appointments to track yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {appointments.map(apt => {
                  const daysSinceStart = apt.created_date 
                    ? differenceInDays(new Date(), new Date(apt.created_date))
                    : 0;
                  const carrierData = CARRIER_MARKET_DATA[apt.carrier_name];
                  const expectedDays = carrierData?.avgProcessTime || 14;
                  const progress = Math.min((daysSinceStart / expectedDays) * 100, 100);
                  const isOverdue = daysSinceStart > expectedDays && apt.appointment_status !== 'appointed';
                  const isSignificantlyDelayed = daysSinceStart > expectedDays * 1.5;

                  return (
                    <div 
                      key={apt.id}
                      className={`p-4 rounded-xl border ${
                        isOverdue 
                          ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10'
                          : apt.appointment_status === 'appointed'
                            ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/10'
                            : 'border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-slate-500" />
                          <span className="font-semibold text-slate-800 dark:text-white">{apt.carrier_name}</span>
                          {apt.writing_number && (
                            <Badge variant="outline" className="text-xs">#{apt.writing_number}</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={
                            apt.appointment_status === 'appointed' 
                              ? 'bg-emerald-100 text-emerald-700' 
                              : apt.appointment_status === 'pending'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-slate-100 text-slate-700'
                          }>
                            {apt.appointment_status === 'appointed' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                            {apt.appointment_status}
                          </Badge>
                          {isSignificantlyDelayed && apt.appointment_status !== 'appointed' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-purple-600 hover:text-purple-700 h-7 text-xs"
                              onClick={() => suggestAlternativeCarriers(apt.carrier_name)}
                            >
                              <RotateCcw className="w-3 h-3 mr-1" />
                              Find Alternatives
                            </Button>
                          )}
                        </div>
                      </div>

                      {apt.appointment_status !== 'appointed' && (
                        <>
                          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                            <span>Day {daysSinceStart} of ~{expectedDays}</span>
                            {isOverdue && (
                              <span className="text-red-600 dark:text-red-400 font-medium flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                {isSignificantlyDelayed ? 'Significantly Delayed' : 'Overdue'}
                              </span>
                            )}
                          </div>
                          <Progress value={progress} className={`h-2 ${isOverdue ? '[&>div]:bg-red-500' : ''}`} />
                        </>
                      )}

                      {/* Contact info for follow-up */}
                      {isOverdue && carrierData && (
                        <div className="mt-3 p-2 bg-slate-100 dark:bg-slate-700/50 rounded flex items-center justify-between text-xs">
                          <span className="text-slate-600 dark:text-slate-400">Follow up:</span>
                          <div className="flex items-center gap-3">
                            <a href={`mailto:${carrierData.contactEmail}`} className="text-teal-600 hover:underline flex items-center gap-1">
                              <Mail className="w-3 h-3" /> Email
                            </a>
                            <span className="text-slate-500">{carrierData.contactPhone}</span>
                          </div>
                        </div>
                      )}

                      {apt.states?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {apt.states.map(state => (
                            <Badge key={state} variant="outline" className="text-xs">{state}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Alternative Carriers Modal */}
            {alternativeCarriers && (
              <Card className="border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20 mt-4">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base text-purple-700 dark:text-purple-300">
                      Alternatives to {alternativeCarriers.forCarrier}
                    </CardTitle>
                    <Button size="sm" variant="ghost" onClick={() => setAlternativeCarriers(null)}>×</Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-purple-600 dark:text-purple-400 mb-3">{alternativeCarriers.recommendation}</p>
                  <div className="space-y-2">
                    {alternativeCarriers.alternatives?.map((alt, i) => (
                      <div key={i} className="p-3 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-between">
                        <div>
                          <p className="font-medium text-slate-700 dark:text-slate-300">{alt.carrier_name}</p>
                          <p className="text-xs text-slate-500">{alt.reason}</p>
                          <div className="flex gap-1 mt-1">
                            {alt.overlapping_states?.map(s => (
                              <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                            ))}
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className="bg-emerald-100 text-emerald-700 mb-1">~{alt.estimated_process_days} days</Badge>
                          <p className="text-xs text-slate-500">{alt.market_strength}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Batch Submit Dialog */}
        <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Rocket className="w-5 h-5 text-emerald-600" />
                Auto-Submit Appointments
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                The following carriers support automated API submission:
              </p>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {Object.keys(prefilledForms).map(carrier => {
                  const hasAPI = CARRIER_MARKET_DATA[carrier]?.hasAPI;
                  return (
                    <div key={carrier} className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-700/30 rounded">
                      <Checkbox
                        id={carrier}
                        checked={carriersToSubmit.includes(carrier)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setCarriersToSubmit(prev => [...prev, carrier]);
                          } else {
                            setCarriersToSubmit(prev => prev.filter(c => c !== carrier));
                          }
                        }}
                        disabled={!hasAPI}
                      />
                      <Label htmlFor={carrier} className="flex-1 flex items-center justify-between">
                        <span>{carrier}</span>
                        {hasAPI ? (
                          <Badge className="bg-emerald-100 text-emerald-700 text-xs">API Ready</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">Manual Only</Badge>
                        )}
                      </Label>
                    </div>
                  );
                })}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSubmitDialog(false)}>Cancel</Button>
              <Button 
                onClick={batchSubmitAppointments}
                disabled={carriersToSubmit.length === 0}
                className="bg-gradient-to-r from-emerald-600 to-teal-600"
              >
                <Rocket className="w-4 h-4 mr-2" />
                Submit {carriersToSubmit.length} Application(s)
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}