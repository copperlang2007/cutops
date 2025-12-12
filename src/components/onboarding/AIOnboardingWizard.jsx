import { useState } from 'react'
import { base44 } from '@/api/base44Client'
import { useMutation } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Sparkles, Loader2, CheckCircle, ArrowRight, ArrowLeft, FileText, User, Heart } from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

export default function AIOnboardingWizard({ agentId, onComplete }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [clientData, setClientData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    city: '',
    state: '',
    health_status: '',
    prescription_count: '',
    budget_preference: '',
    special_needs: []
  });
  const [aiGuidance, setAiGuidance] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);

  const getGuidanceMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('aiOnboardingWizard', {
        client_data: clientData,
        current_step: currentStep
      });
      return response.data;
    },
    onSuccess: (data) => {
      setAiGuidance(data.guidance);
    }
  });

  const completeMutation = useMutation({
    mutationFn: async () => {
      const client = await base44.entities.Client.create({
        ...clientData,
        agent_id: agentId,
        status: 'active',
        current_plan: selectedPlan?.name || 'To be determined',
        plan_type: selectedPlan?.type || 'medicare_advantage',
        premium: selectedPlan?.premium || 0,
        onboarding_status: 'completed'
      });

      const summaryResponse = await base44.functions.invoke('generateOnboardingSummary', {
        client_id: client.id
      });

      return { client, summary: summaryResponse.data };
    },
    onSuccess: ({ client, summary }) => {
      toast.success('Client onboarding completed!');
      onComplete?.(client, summary);
    }
  });

  const steps = [
    { number: 1, title: 'Basic Info', icon: User },
    { number: 2, title: 'Health Profile', icon: Heart },
    { number: 3, title: 'Plan Selection', icon: FileText },
    { number: 4, title: 'Review', icon: CheckCircle }
  ];

  const handleNext = () => {
    if (currentStep === 2 || currentStep === 3) {
      getGuidanceMutation.mutate();
    }
    setCurrentStep(prev => Math.min(prev + 1, 4));
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleComplete = () => {
    completeMutation.mutate();
  };

  const progress = (currentStep / steps.length) * 100;

  return (
    <Card className="border-0 shadow-xl liquid-glass">
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            AI-Powered Onboarding
          </CardTitle>
          <Badge variant="outline">
            Step {currentStep} of {steps.length}
          </Badge>
        </div>
        
        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between">
            {steps.map((step) => {
              const Icon = step.icon;
              const isComplete = step.number < currentStep;
              const isCurrent = step.number === currentStep;
              return (
                <div key={step.number} className="flex flex-col items-center gap-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    isComplete ? 'bg-green-500 text-white' :
                    isCurrent ? 'bg-purple-600 text-white' :
                    'bg-slate-200 dark:bg-slate-700 text-slate-400'
                  }`}>
                    {isComplete ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <span className="text-xs text-slate-600 dark:text-slate-400">{step.title}</span>
                </div>
              );
            })}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <h3 className="font-semibold text-lg text-slate-900 dark:text-white">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>First Name *</Label>
                  <Input
                    value={clientData.first_name}
                    onChange={(e) => setClientData({ ...clientData, first_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Last Name *</Label>
                  <Input
                    value={clientData.last_name}
                    onChange={(e) => setClientData({ ...clientData, last_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={clientData.email}
                    onChange={(e) => setClientData({ ...clientData, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Phone *</Label>
                  <Input
                    value={clientData.phone}
                    onChange={(e) => setClientData({ ...clientData, phone: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Date of Birth</Label>
                  <Input
                    type="date"
                    value={clientData.date_of_birth}
                    onChange={(e) => setClientData({ ...clientData, date_of_birth: e.target.value })}
                  />
                </div>
                <div>
                  <Label>City</Label>
                  <Input
                    value={clientData.city}
                    onChange={(e) => setClientData({ ...clientData, city: e.target.value })}
                  />
                </div>
                <div>
                  <Label>State</Label>
                  <Input
                    value={clientData.state}
                    onChange={(e) => setClientData({ ...clientData, state: e.target.value })}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <h3 className="font-semibold text-lg text-slate-900 dark:text-white">Health Profile</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Overall Health Status</Label>
                  <Select
                    value={clientData.health_status}
                    onValueChange={(value) => setClientData({ ...clientData, health_status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="excellent">Excellent</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="fair">Fair</SelectItem>
                      <SelectItem value="poor">Poor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Number of Prescriptions</Label>
                  <Select
                    value={clientData.prescription_count}
                    onValueChange={(value) => setClientData({ ...clientData, prescription_count: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select count" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">None</SelectItem>
                      <SelectItem value="1-3">1-3</SelectItem>
                      <SelectItem value="4-6">4-6</SelectItem>
                      <SelectItem value="7+">7 or more</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label>Budget Preference</Label>
                  <Select
                    value={clientData.budget_preference}
                    onValueChange={(value) => setClientData({ ...clientData, budget_preference: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select preference" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low_premium">Lowest Premium</SelectItem>
                      <SelectItem value="balanced">Balanced Coverage</SelectItem>
                      <SelectItem value="low_copay">Low Copays</SelectItem>
                      <SelectItem value="comprehensive">Comprehensive Coverage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {getGuidanceMutation.isPending && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                  <span className="ml-2 text-sm text-slate-600">Analyzing profile...</span>
                </div>
              )}

              {aiGuidance && (
                <div className="p-4 rounded-lg bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <p className="font-medium text-purple-900 dark:text-purple-200">AI Insights</p>
                  </div>
                  <p className="text-sm text-purple-700 dark:text-purple-300">
                    {aiGuidance.personalized_message}
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <h3 className="font-semibold text-lg text-slate-900 dark:text-white">Plan Recommendations</h3>
              
              {aiGuidance?.recommendations && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    {aiGuidance.recommendations.plan_types.slice(0, 2).map((plan, idx) => (
                      <div
                        key={idx}
                        onClick={() => setSelectedPlan({ name: plan, type: 'medicare_advantage', premium: 150 })}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedPlan?.name === plan
                            ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                            : 'border-slate-200 dark:border-slate-700 hover:border-purple-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium text-slate-900 dark:text-white">{plan}</p>
                          {selectedPlan?.name === plan && <CheckCircle className="w-5 h-5 text-purple-600" />}
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Est. ${aiGuidance.recommendations.estimated_premium_range}/mo
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 rounded-lg bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800">
                    <p className="text-sm font-medium text-teal-900 dark:text-teal-200 mb-2">Key Benefits</p>
                    <ul className="space-y-1">
                      {aiGuidance.recommendations.key_benefits.map((benefit, i) => (
                        <li key={i} className="text-xs text-teal-700 dark:text-teal-300 flex items-start gap-2">
                          <CheckCircle className="w-3 h-3 mt-0.5 shrink-0" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {currentStep === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <h3 className="font-semibold text-lg text-slate-900 dark:text-white">Review & Complete</h3>
              <div className="space-y-3">
                <div className="p-4 rounded-lg border dark:border-slate-700">
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Client</p>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {clientData.first_name} {clientData.last_name}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{clientData.email}</p>
                </div>

                {selectedPlan && (
                  <div className="p-4 rounded-lg border dark:border-slate-700">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Selected Plan</p>
                    <p className="font-medium text-slate-900 dark:text-white">{selectedPlan.name}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      ${selectedPlan.premium}/month
                    </p>
                  </div>
                )}

                <div className="p-4 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <p className="font-medium text-green-900 dark:text-green-200">Ready to Complete</p>
                  </div>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    A detailed summary report will be generated for the agent after completion.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-between pt-4 border-t dark:border-slate-700">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          {currentStep < 4 ? (
            <Button
              onClick={handleNext}
              disabled={
                (currentStep === 1 && (!clientData.first_name || !clientData.last_name || !clientData.email)) ||
                getGuidanceMutation.isPending
              }
              className="bg-purple-600 hover:bg-purple-700"
            >
              {getGuidanceMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <>
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleComplete}
              disabled={completeMutation.isPending || !selectedPlan}
              className="bg-gradient-to-r from-green-600 to-emerald-600"
            >
              {completeMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Complete Onboarding
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}