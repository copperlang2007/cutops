import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { 
  ClipboardCheck, ArrowRight, ArrowLeft, CheckCircle, 
  Star, DollarSign, Heart, Pill, Stethoscope, Loader2,
  Phone, Monitor, AlertCircle, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const steps = [
  { id: 'health', title: 'Health Status', icon: Heart },
  { id: 'doctors', title: 'Your Doctors', icon: Stethoscope },
  { id: 'medications', title: 'Medications', icon: Pill },
  { id: 'preferences', title: 'Preferences', icon: Star },
  { id: 'results', title: 'Recommendations', icon: Sparkles }
];

const specialtiesList = [
  'Cardiologist', 'Dermatologist', 'Endocrinologist', 'Gastroenterologist',
  'Neurologist', 'Oncologist', 'Ophthalmologist', 'Orthopedist',
  'Pulmonologist', 'Rheumatologist', 'Urologist', 'Psychiatrist'
];

export default function PlanCompatibilityWizard({ client, portalUser, agent, onRequestAgent }) {
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({
    healthStatus: '',
    doctorVisits: '',
    specialists: [],
    preferredDoctors: [],
    prescriptionCount: '',
    medications: [],
    hospitalExpected: false,
    travelFrequently: false,
    budgetPreference: '',
    wantsDental: false,
    wantsVision: false,
    wantsHearing: false,
    wantsFitness: false,
    wantsOTC: false,
    currentIssues: []
  });
  const [recommendations, setRecommendations] = useState(null);
  const [newDoctor, setNewDoctor] = useState('');
  const [newMed, setNewMed] = useState('');

  const userId = client?.id || portalUser?.id;
  const userIdField = client?.id ? 'client_id' : 'portal_user_id';
  const currentPlan = client?.current_plan || portalUser?.current_plan;
  const zipCode = client?.zip || portalUser?.zip_code;

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      const prompt = `You are a Medicare plan advisor. Based on this needs analysis, recommend the best Medicare plans.

Current Plan: ${currentPlan || 'Unknown'}
Location ZIP: ${zipCode || 'Unknown'}

User Profile:
- Health Status: ${answers.healthStatus}
- Doctor Visits per Year: ${answers.doctorVisits}
- Specialists Needed: ${answers.specialists.join(', ') || 'None'}
- Preferred Doctors: ${answers.preferredDoctors.join(', ') || 'None specified'}
- Number of Prescriptions: ${answers.prescriptionCount}
- Current Medications: ${answers.medications.join(', ') || 'None listed'}
- Expecting Hospitalization: ${answers.hospitalExpected ? 'Yes' : 'No'}
- Travels Frequently: ${answers.travelFrequently ? 'Yes' : 'No'}
- Budget Preference: ${answers.budgetPreference}
- Wants Dental: ${answers.wantsDental}
- Wants Vision: ${answers.wantsVision}
- Wants Hearing: ${answers.wantsHearing}
- Wants Fitness Benefits: ${answers.wantsFitness}
- Wants OTC Allowance: ${answers.wantsOTC}
- Issues with Current Plan: ${answers.currentIssues.join(', ') || 'None'}

Analyze and provide:
1. Assessment of current plan fit (if known)
2. Top 3-5 recommended plans with match scores
3. Reasons for each recommendation
4. Potential savings

Return as JSON:
{
  "current_plan_assessment": {
    "plan_name": "string or null",
    "fit_score": number (0-100),
    "strengths": ["string"],
    "weaknesses": ["string"],
    "recommendation": "keep|consider_change|strongly_recommend_change"
  },
  "recommended_plans": [
    {
      "plan_name": "string",
      "carrier": "string",
      "plan_type": "MA|MAPD|Supplement|PDP",
      "match_score": number (0-100),
      "monthly_premium": number,
      "annual_deductible": number,
      "highlights": ["string"],
      "why_recommended": "string",
      "potential_annual_savings": number,
      "doctors_in_network": "all|most|some|unknown",
      "drug_coverage_rating": "excellent|good|fair|poor"
    }
  ],
  "key_insights": ["string"],
  "questions_to_consider": ["string"],
  "best_enrollment_period": "string",
  "overall_recommendation": "string"
}`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            current_plan_assessment: { type: 'object' },
            recommended_plans: { type: 'array' },
            key_insights: { type: 'array' },
            questions_to_consider: { type: 'array' },
            best_enrollment_period: { type: 'string' },
            overall_recommendation: { type: 'string' }
          }
        }
      });
      return response;
    },
    onSuccess: async (data) => {
      setRecommendations(data);
      setCurrentStep(4);
      
      // Save needs analysis
      await base44.entities.NeedsAnalysis.create({
        [userIdField]: userId,
        completed_date: new Date().toISOString(),
        health_status: answers.healthStatus,
        doctor_visits_per_year: answers.doctorVisits,
        specialist_needs: answers.specialists,
        preferred_doctors: answers.preferredDoctors.map(name => ({ name })),
        prescription_count: answers.prescriptionCount,
        hospital_stays_expected: answers.hospitalExpected,
        travel_frequently: answers.travelFrequently,
        budget_preference: answers.budgetPreference,
        dental_vision_hearing: answers.wantsDental || answers.wantsVision || answers.wantsHearing,
        fitness_benefits: answers.wantsFitness,
        otc_allowance: answers.wantsOTC,
        current_plan_issues: answers.currentIssues,
        recommended_plans: data.recommended_plans
      });
    }
  });

  const progress = ((currentStep + 1) / steps.length) * 100;

  const updateAnswer = (key, value) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
  };

  const addDoctor = () => {
    if (newDoctor.trim()) {
      setAnswers(prev => ({ ...prev, preferredDoctors: [...prev.preferredDoctors, newDoctor.trim()] }));
      setNewDoctor('');
    }
  };

  const addMedication = () => {
    if (newMed.trim()) {
      setAnswers(prev => ({ ...prev, medications: [...prev.medications, newMed.trim()] }));
      setNewMed('');
    }
  };

  const nextStep = () => {
    if (currentStep === 3) {
      analyzeMutation.mutate();
    } else {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    }
  };

  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));

  const handleSelfEnroll = (plan) => {
    toast.info(`You selected to enroll in ${plan.plan_name}. Redirecting to carrier website...`);
  };

  const handleTalkToAgent = () => {
    onRequestAgent?.();
    toast.success('An agent will contact you shortly to discuss your options.');
  };

  const matchScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-100 dark:bg-green-900/40 dark:text-green-400';
    if (score >= 60) return 'text-amber-600 bg-amber-100 dark:bg-amber-900/40 dark:text-amber-400';
    return 'text-red-600 bg-red-100 dark:bg-red-900/40 dark:text-red-400';
  };

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <Card className="border-0 shadow-sm dark:bg-slate-800">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-teal-600" />
              Plan Compatibility Analysis
            </h2>
            <span className="text-sm text-slate-500">{currentStep + 1} of {steps.length}</span>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between mt-2">
            {steps.map((step, idx) => (
              <div key={step.id} className={`text-xs ${idx <= currentStep ? 'text-teal-600' : 'text-slate-400'}`}>
                {step.title}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {currentStep === 0 && (
            <Card className="border-0 shadow-sm dark:bg-slate-800">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-500" />
                  Tell Us About Your Health
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-base mb-3 block">How would you describe your overall health?</Label>
                  <RadioGroup value={answers.healthStatus} onValueChange={(v) => updateAnswer('healthStatus', v)}>
                    {['excellent', 'good', 'fair', 'poor'].map(status => (
                      <div key={status} className="flex items-center space-x-2">
                        <RadioGroupItem value={status} id={status} />
                        <Label htmlFor={status} className="capitalize">{status}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div>
                  <Label className="text-base mb-3 block">How often do you visit doctors per year?</Label>
                  <RadioGroup value={answers.doctorVisits} onValueChange={(v) => updateAnswer('doctorVisits', v)}>
                    {[
                      { value: '0-2', label: 'Rarely (0-2 visits)' },
                      { value: '3-5', label: 'Sometimes (3-5 visits)' },
                      { value: '6-10', label: 'Often (6-10 visits)' },
                      { value: '10+', label: 'Frequently (10+ visits)' }
                    ].map(opt => (
                      <div key={opt.value} className="flex items-center space-x-2">
                        <RadioGroupItem value={opt.value} id={opt.value} />
                        <Label htmlFor={opt.value}>{opt.label}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="hospital" 
                      checked={answers.hospitalExpected}
                      onCheckedChange={(c) => updateAnswer('hospitalExpected', c)}
                    />
                    <Label htmlFor="hospital">I expect to need hospitalization this year</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="travel" 
                      checked={answers.travelFrequently}
                      onCheckedChange={(c) => updateAnswer('travelFrequently', c)}
                    />
                    <Label htmlFor="travel">I travel frequently outside my home area</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 1 && (
            <Card className="border-0 shadow-sm dark:bg-slate-800">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-blue-500" />
                  Your Doctors & Specialists
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-base mb-3 block">What specialists do you see regularly?</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {specialtiesList.map(spec => (
                      <div key={spec} className="flex items-center space-x-2">
                        <Checkbox 
                          id={spec}
                          checked={answers.specialists.includes(spec)}
                          onCheckedChange={(c) => {
                            if (c) {
                              updateAnswer('specialists', [...answers.specialists, spec]);
                            } else {
                              updateAnswer('specialists', answers.specialists.filter(s => s !== spec));
                            }
                          }}
                        />
                        <Label htmlFor={spec} className="text-sm">{spec}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-base mb-3 block">Add your preferred doctors (we'll check network status)</Label>
                  <div className="flex gap-2">
                    <Input 
                      value={newDoctor}
                      onChange={(e) => setNewDoctor(e.target.value)}
                      placeholder="Dr. name and specialty"
                      onKeyPress={(e) => e.key === 'Enter' && addDoctor()}
                    />
                    <Button onClick={addDoctor} variant="outline">Add</Button>
                  </div>
                  {answers.preferredDoctors.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {answers.preferredDoctors.map((doc, idx) => (
                        <Badge key={idx} variant="secondary" className="py-1">
                          {doc}
                          <button 
                            onClick={() => updateAnswer('preferredDoctors', answers.preferredDoctors.filter((_, i) => i !== idx))}
                            className="ml-2 text-slate-400 hover:text-red-500"
                          >×</button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 2 && (
            <Card className="border-0 shadow-sm dark:bg-slate-800">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Pill className="w-5 h-5 text-purple-500" />
                  Your Medications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-base mb-3 block">How many prescription medications do you take?</Label>
                  <RadioGroup value={answers.prescriptionCount} onValueChange={(v) => updateAnswer('prescriptionCount', v)}>
                    {[
                      { value: '0', label: 'None' },
                      { value: '1-3', label: '1-3 medications' },
                      { value: '4-6', label: '4-6 medications' },
                      { value: '7+', label: '7 or more medications' }
                    ].map(opt => (
                      <div key={opt.value} className="flex items-center space-x-2">
                        <RadioGroupItem value={opt.value} id={`med-${opt.value}`} />
                        <Label htmlFor={`med-${opt.value}`}>{opt.label}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div>
                  <Label className="text-base mb-3 block">List your medications (we'll check coverage)</Label>
                  <div className="flex gap-2">
                    <Input 
                      value={newMed}
                      onChange={(e) => setNewMed(e.target.value)}
                      placeholder="Medication name"
                      onKeyPress={(e) => e.key === 'Enter' && addMedication()}
                    />
                    <Button onClick={addMedication} variant="outline">Add</Button>
                  </div>
                  {answers.medications.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {answers.medications.map((med, idx) => (
                        <Badge key={idx} variant="secondary" className="py-1">
                          {med}
                          <button 
                            onClick={() => updateAnswer('medications', answers.medications.filter((_, i) => i !== idx))}
                            className="ml-2 text-slate-400 hover:text-red-500"
                          >×</button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 3 && (
            <Card className="border-0 shadow-sm dark:bg-slate-800">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-500" />
                  Your Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-base mb-3 block">What's most important in your plan?</Label>
                  <RadioGroup value={answers.budgetPreference} onValueChange={(v) => updateAnswer('budgetPreference', v)}>
                    {[
                      { value: 'low_premium', label: 'Lowest monthly premium', desc: 'Higher costs when I use services' },
                      { value: 'balanced', label: 'Balance of cost and coverage', desc: 'Moderate premium and copays' },
                      { value: 'low_copay', label: 'Low copays when I visit doctors', desc: 'Higher monthly premium' },
                      { value: 'comprehensive', label: 'Most comprehensive coverage', desc: 'Best benefits regardless of cost' }
                    ].map(opt => (
                      <div key={opt.value} className="flex items-center space-x-2 p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-700">
                        <RadioGroupItem value={opt.value} id={opt.value} />
                        <div>
                          <Label htmlFor={opt.value}>{opt.label}</Label>
                          <p className="text-xs text-slate-500">{opt.desc}</p>
                        </div>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div>
                  <Label className="text-base mb-3 block">Extra benefits you want:</Label>
                  <div className="space-y-2">
                    {[
                      { key: 'wantsDental', label: 'Dental coverage' },
                      { key: 'wantsVision', label: 'Vision coverage' },
                      { key: 'wantsHearing', label: 'Hearing coverage' },
                      { key: 'wantsFitness', label: 'Fitness/gym membership' },
                      { key: 'wantsOTC', label: 'Over-the-counter allowance' }
                    ].map(opt => (
                      <div key={opt.key} className="flex items-center space-x-2">
                        <Checkbox 
                          id={opt.key}
                          checked={answers[opt.key]}
                          onCheckedChange={(c) => updateAnswer(opt.key, c)}
                        />
                        <Label htmlFor={opt.key}>{opt.label}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-base mb-3 block">Issues with your current plan (if any):</Label>
                  <div className="space-y-2">
                    {[
                      'Too expensive',
                      'Doctors not in network',
                      'Medications not covered',
                      'High deductible',
                      'Poor customer service',
                      'Limited benefits'
                    ].map(issue => (
                      <div key={issue} className="flex items-center space-x-2">
                        <Checkbox 
                          id={issue}
                          checked={answers.currentIssues.includes(issue)}
                          onCheckedChange={(c) => {
                            if (c) {
                              updateAnswer('currentIssues', [...answers.currentIssues, issue]);
                            } else {
                              updateAnswer('currentIssues', answers.currentIssues.filter(i => i !== issue));
                            }
                          }}
                        />
                        <Label htmlFor={issue} className="text-sm">{issue}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 4 && recommendations && (
            <div className="space-y-6">
              {/* Current Plan Assessment */}
              {recommendations.current_plan_assessment?.plan_name && (
                <Card className="border-0 shadow-sm dark:bg-slate-800">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Current Plan Assessment</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-4">
                      <p className="font-medium text-slate-800 dark:text-white">
                        {recommendations.current_plan_assessment.plan_name}
                      </p>
                      <Badge className={matchScoreColor(recommendations.current_plan_assessment.fit_score)}>
                        {recommendations.current_plan_assessment.fit_score}% Match
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">
                      {recommendations.current_plan_assessment.recommendation === 'keep' 
                        ? '✅ Your current plan is a good fit!'
                        : recommendations.current_plan_assessment.recommendation === 'consider_change'
                        ? '⚠️ You might benefit from considering other options'
                        : '🔄 We strongly recommend exploring better options'
                      }
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Recommended Plans */}
              <Card className="border-0 shadow-sm dark:bg-slate-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-500" />
                    Recommended Plans For You
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recommendations.recommended_plans?.map((plan, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className={`p-4 rounded-xl border ${idx === 0 ? 'border-teal-300 bg-teal-50/50 dark:border-teal-700 dark:bg-teal-900/20' : 'dark:border-slate-700'}`}
                    >
                      {idx === 0 && (
                        <Badge className="bg-teal-600 text-white mb-2">Best Match</Badge>
                      )}
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-slate-800 dark:text-white">{plan.plan_name}</h4>
                          <p className="text-sm text-teal-600 dark:text-teal-400">{plan.carrier}</p>
                        </div>
                        <Badge className={matchScoreColor(plan.match_score)}>
                          {plan.match_score}% Match
                        </Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-4 my-4">
                        <div className="text-center p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                          <p className="text-xs text-slate-500">Monthly Premium</p>
                          <p className="font-bold text-slate-800 dark:text-white">${plan.monthly_premium}</p>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                          <p className="text-xs text-slate-500">Deductible</p>
                          <p className="font-bold text-slate-800 dark:text-white">${plan.annual_deductible}</p>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                          <p className="text-xs text-green-600">Est. Savings</p>
                          <p className="font-bold text-green-700 dark:text-green-400">${plan.potential_annual_savings}/yr</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-3">
                        {plan.highlights?.slice(0, 4).map((h, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{h}</Badge>
                        ))}
                      </div>

                      <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">{plan.why_recommended}</p>

                      <div className="flex gap-2">
                        <Button 
                          onClick={() => handleSelfEnroll(plan)}
                          variant="outline"
                          className="flex-1"
                        >
                          <Monitor className="w-4 h-4 mr-2" />
                          Enroll Online
                        </Button>
                        <Button 
                          onClick={handleTalkToAgent}
                          className="flex-1 bg-teal-600 hover:bg-teal-700"
                        >
                          <Phone className="w-4 h-4 mr-2" />
                          Talk to Agent
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>

              {/* Key Insights */}
              {recommendations.key_insights?.length > 0 && (
                <Card className="border-0 shadow-sm dark:bg-slate-800">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Key Insights</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {recommendations.key_insights.map((insight, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                          <CheckCircle className="w-4 h-4 text-teal-500 mt-0.5 shrink-0" />
                          {insight}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
                Best enrollment period: {recommendations.best_enrollment_period}
              </p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      {currentStep < 4 && (
        <div className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={prevStep}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button 
            onClick={nextStep}
            disabled={analyzeMutation.isPending}
            className="bg-teal-600 hover:bg-teal-700"
          >
            {analyzeMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : currentStep === 3 ? (
              <>
                Get Recommendations
                <Sparkles className="w-4 h-4 ml-2" />
              </>
            ) : (
              <>
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}