import { useState } from 'react'
import { base44 } from '@/api/base44Client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Sparkles, Loader2, CheckCircle, AlertTriangle, Mail, 
  ArrowRight, User, MapPin, DollarSign, Shield, Send, Copy,
  Calendar, Phone as PhoneIcon, Target, TrendingUp
} from 'lucide-react';
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AIOnboardingWorkflow({ agentId, onComplete }) {
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(1);
  const [onboardingPlan, setOnboardingPlan] = useState(null);
  const [createdClient, setCreatedClient] = useState(null);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    annual_income: '',
    current_coverage: '',
    interested_in: [],
    timeline: 'immediate',
    lead_source: 'website',
    notes: ''
  });

  const generateOnboardingMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('aiOnboardingWorkflow', {
        clientData: formData,
        agentId
      });
      return response.data;
    },
    onSuccess: (data) => {
      setOnboardingPlan(data.onboarding_plan);
      setCreatedClient(data.client);
      setCurrentStep(2);
      toast.success('Onboarding plan generated! Review AI recommendations.');
      queryClient.invalidateQueries(['clients']);
    },
    onError: () => toast.error('Failed to generate onboarding plan')
  });

  const sendWelcomeEmailMutation = useMutation({
    mutationFn: async () => {
      await base44.integrations.Core.SendEmail({
        to: formData.email,
        subject: onboardingPlan.welcome_email.subject,
        body: onboardingPlan.welcome_email.body
      });

      await base44.entities.Client.update(createdClient.id, {
        onboarding_status: 'welcome_sent',
        welcome_email_sent: true,
        onboarding_started_date: new Date().toISOString()
      });
    },
    onSuccess: () => {
      toast.success('Welcome email sent!');
      setCurrentStep(3);
      queryClient.invalidateQueries(['clients']);
    }
  });

  const completeOnboardingMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.Client.update(createdClient.id, {
        onboarding_status: 'in_progress',
        status: 'active'
      });
    },
    onSuccess: () => {
      toast.success('Client onboarding initiated successfully!');
      if (onComplete) onComplete(createdClient);
    }
  });

  const totalSteps = 3;
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Progress Header */}
      <Card className="clay-morphism border-0">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">AI-Powered Onboarding</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">Step {currentStep} of {totalSteps}</p>
              </div>
            </div>
            <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
              {Math.round(progress)}% Complete
            </Badge>
          </div>
          <Progress value={progress} className="h-2" />
        </CardContent>
      </Card>

      <AnimatePresence mode="wait">
        {/* Step 1: Client Information */}
        {currentStep === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card className="clay-morphism border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Client Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>First Name *</Label>
                    <Input
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      placeholder="John"
                      required
                    />
                  </div>
                  <div>
                    <Label>Last Name *</Label>
                    <Input
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      placeholder="Doe"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="john@example.com"
                      required
                    />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="(555) 555-5555"
                    />
                  </div>
                </div>

                <div>
                  <Label>Date of Birth</Label>
                  <Input
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>City</Label>
                    <Input
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <Label>State</Label>
                    <Input
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      placeholder="CA"
                    />
                  </div>
                  <div>
                    <Label>ZIP</Label>
                    <Input
                      value={formData.zip}
                      onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                      placeholder="12345"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Annual Income</Label>
                    <Input
                      type="number"
                      value={formData.annual_income}
                      onChange={(e) => setFormData({ ...formData, annual_income: e.target.value })}
                      placeholder="75000"
                    />
                  </div>
                  <div>
                    <Label>Timeline</Label>
                    <Select value={formData.timeline} onValueChange={(val) => setFormData({ ...formData, timeline: val })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="immediate">Immediate</SelectItem>
                        <SelectItem value="1-3_months">1-3 Months</SelectItem>
                        <SelectItem value="3-6_months">3-6 Months</SelectItem>
                        <SelectItem value="6+_months">6+ Months</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Current Coverage</Label>
                  <Input
                    value={formData.current_coverage}
                    onChange={(e) => setFormData({ ...formData, current_coverage: e.target.value })}
                    placeholder="Describe any existing insurance"
                  />
                </div>

                <div>
                  <Label>Notes</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Any additional information..."
                    rows={3}
                  />
                </div>

                <Button
                  onClick={() => generateOnboardingMutation.mutate()}
                  disabled={generateOnboardingMutation.isPending || !formData.first_name || !formData.last_name}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white shadow-xl"
                  size="lg"
                >
                  {generateOnboardingMutation.isPending ? (
                    <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Generating AI Plan...</>
                  ) : (
                    <><Sparkles className="w-5 h-5 mr-2" />Generate Onboarding Plan</>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 2: Review AI Recommendations */}
        {currentStep === 2 && onboardingPlan && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            {/* Life Stage Assessment */}
            <Card className="clay-morphism border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-purple-600" />
                  Life Stage Assessment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                      {onboardingPlan.life_stage_assessment.stage.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </h3>
                    <Badge variant="outline">{onboardingPlan.life_stage_assessment.confidence}% confident</Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">Primary Needs:</p>
                  <div className="flex flex-wrap gap-2">
                    {onboardingPlan.life_stage_assessment.primary_needs.map((need, i) => (
                      <Badge key={i} className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                        {need}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Policy Recommendations */}
            <Card className="clay-morphism border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-600" />
                  Recommended Initial Policies ({onboardingPlan.recommended_policies.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {onboardingPlan.recommended_policies.map((policy, idx) => (
                  <div key={idx} className="p-4 clay-subtle rounded-xl border-l-4 border-l-green-500">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-slate-900 dark:text-white">{policy.product_name}</h4>
                          <Badge className={
                            policy.priority === 'high' ? 'bg-red-100 text-red-700' :
                            policy.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                            'bg-blue-100 text-blue-700'
                          }>
                            {policy.priority}
                          </Badge>
                          <Badge className="bg-green-100 text-green-700">{policy.fit_score}% fit</Badge>
                        </div>
                        <Badge variant="outline">{policy.product_type}</Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500">Est. Premium</p>
                        <p className="text-lg font-bold text-slate-900 dark:text-white">${policy.estimated_premium}/mo</p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">{policy.reasoning}</p>
                    {policy.key_benefits?.length > 0 && (
                      <div className="space-y-1">
                        {policy.key_benefits.map((benefit, bi) => (
                          <div key={bi} className="flex items-start gap-2">
                            <CheckCircle className="w-3 h-3 text-green-600 mt-0.5 shrink-0" />
                            <span className="text-xs text-slate-600 dark:text-slate-400">{benefit}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Onboarding Steps */}
            <Card className="clay-morphism border-0">
              <CardHeader>
                <CardTitle>Onboarding Roadmap</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {onboardingPlan.onboarding_steps.map((step, idx) => (
                  <div key={idx} className="p-4 clay-subtle rounded-xl">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shrink-0">
                        {step.step_number}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-slate-900 dark:text-white mb-1">{step.title}</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{step.description}</p>
                        <div className="flex gap-2">
                          <Badge variant="outline" className="text-xs">
                            <Calendar className="w-3 h-3 mr-1" />
                            {step.estimated_duration}
                          </Badge>
                          {step.required_documents?.length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {step.required_documents.length} docs needed
                            </Badge>
                          )}
                        </div>
                        {step.tips && (
                          <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">💡 {step.tips}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Welcome Email Preview */}
            <Card className="clay-morphism border-0">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="w-5 h-5 text-teal-600" />
                    Welcome Email Preview
                  </CardTitle>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      navigator.clipboard.writeText(onboardingPlan.welcome_email.body);
                      toast.success('Email copied');
                    }}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">Subject:</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {onboardingPlan.welcome_email.subject}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                  <p className="text-xs text-slate-500 mb-2">Body:</p>
                  <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                    {onboardingPlan.welcome_email.body}
                  </div>
                </div>
                <Badge variant="outline">Send: {onboardingPlan.welcome_email.send_timing}</Badge>
              </CardContent>
            </Card>

            {/* Warnings */}
            {(onboardingPlan.missing_critical_info?.length > 0 || onboardingPlan.red_flags?.length > 0) && (
              <Card className="clay-morphism border-0 border-l-4 border-l-amber-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                    <AlertTriangle className="w-5 h-5" />
                    Attention Required
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {onboardingPlan.missing_critical_info?.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Missing Information:</p>
                      <ul className="space-y-1">
                        {onboardingPlan.missing_critical_info.map((info, i) => (
                          <li key={i} className="text-sm text-amber-600 dark:text-amber-400">• {info}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {onboardingPlan.red_flags?.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Red Flags:</p>
                      <ul className="space-y-1">
                        {onboardingPlan.red_flags.map((flag, i) => (
                          <li key={i} className="text-sm text-red-600 dark:text-red-400">• {flag}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <div className="flex justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  Success Probability: <span className="font-bold text-green-600">{onboardingPlan.success_probability}%</span>
                </span>
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  • Timeline: {onboardingPlan.estimated_timeline}
                </span>
              </div>
              <Button
                onClick={() => setCurrentStep(2.5)}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
              >
                Continue to Welcome Email
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 2.5: Send Welcome Email */}
        {currentStep === 2.5 && onboardingPlan && (
          <motion.div
            key="step2-5"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card className="clay-morphism border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-teal-600" />
                  Send Welcome Email
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-6 clay-subtle rounded-xl text-center">
                  <Mail className="w-16 h-16 mx-auto mb-4 text-teal-600" />
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                    Ready to Welcome {formData.first_name}?
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                    Send a personalized welcome email to start the relationship on the right foot.
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentStep(2)}
                      className="clay-morphism"
                    >
                      Back to Review
                    </Button>
                    <Button
                      onClick={() => sendWelcomeEmailMutation.mutate()}
                      disabled={sendWelcomeEmailMutation.isPending}
                      className="bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white"
                    >
                      {sendWelcomeEmailMutation.isPending ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending...</>
                      ) : (
                        <><Send className="w-4 h-4 mr-2" />Send Welcome Email</>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setCurrentStep(3);
                        toast.info('Skipped welcome email');
                      }}
                    >
                      Skip for Now
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 3: Complete */}
        {currentStep === 3 && onboardingPlan && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card className="clay-morphism border-0">
              <CardContent className="py-12 text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-xl">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  Onboarding Initiated! 
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                  {formData.first_name} {formData.last_name} has been added with {onboardingPlan.initial_tasks.length} tasks created.
                </p>
                <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto mb-6">
                  <div className="p-3 clay-subtle rounded-lg">
                    <p className="text-xs text-slate-500 mb-1">Tasks Created</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{onboardingPlan.initial_tasks.length}</p>
                  </div>
                  <div className="p-3 clay-subtle rounded-lg">
                    <p className="text-xs text-slate-500 mb-1">Policies Recommended</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{onboardingPlan.recommended_policies.length}</p>
                  </div>
                  <div className="p-3 clay-subtle rounded-lg">
                    <p className="text-xs text-slate-500 mb-1">Success Rate</p>
                    <p className="text-2xl font-bold text-green-600">{onboardingPlan.success_probability}%</p>
                  </div>
                </div>
                <Button
                  onClick={() => completeOnboardingMutation.mutate()}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-xl"
                  size="lg"
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Complete & View Client
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}