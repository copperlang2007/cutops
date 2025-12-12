import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  Calendar, CheckCircle, ArrowRight, ArrowLeft, 
  AlertCircle, Phone, FileText, Loader2, Star, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { differenceInDays, format } from 'date-fns';
import { toast } from 'sonner';

const aepStart = new Date('2024-10-15');
const aepEnd = new Date('2024-12-07');

export default function AnnualEnrollmentWizard({ client, portalUser, agent, onRequestAgent }) {
  const [step, setStep] = useState(0);
  const [reviewData, setReviewData] = useState({
    satisfiedWithPlan: null,
    planIssues: [],
    wantsToExplore: null,
    doctorChanges: false,
    medicationChanges: false,
    healthChanges: false,
    coveragePreferences: []
  });
  const [recommendation, setRecommendation] = useState(null);

  const today = new Date();
  const isAEP = today >= aepStart && today <= aepEnd;
  const daysUntilAEP = differenceInDays(aepStart, today);
  const daysLeftInAEP = differenceInDays(aepEnd, today);

  const currentPlan = client?.current_plan || portalUser?.current_plan || 'Your Current Plan';
  const carrier = client?.carrier || portalUser?.current_carrier || 'Current Carrier';

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      const prompt = `As a Medicare advisor, analyze this client's AEP review and provide recommendations.

Current Situation:
- Current Plan: ${currentPlan}
- Current Carrier: ${carrier}
- Satisfied with Plan: ${reviewData.satisfiedWithPlan}
- Issues: ${reviewData.planIssues.join(', ') || 'None'}
- Wants to Explore Options: ${reviewData.wantsToExplore}
- Doctor Changes: ${reviewData.doctorChanges}
- Medication Changes: ${reviewData.medicationChanges}
- Health Changes: ${reviewData.healthChanges}
- Coverage Preferences: ${reviewData.coveragePreferences.join(', ')}

Provide personalized AEP guidance:
{
  "overall_recommendation": "stay|review|change",
  "recommendation_reason": "string explaining why",
  "action_items": [
    {
      "priority": "high|medium|low",
      "action": "string",
      "deadline": "string"
    }
  ],
  "considerations": ["string"],
  "next_steps": ["string"],
  "should_talk_to_agent": true/false,
  "agent_discussion_topics": ["string"]
}`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            overall_recommendation: { type: 'string' },
            recommendation_reason: { type: 'string' },
            action_items: { type: 'array' },
            considerations: { type: 'array' },
            next_steps: { type: 'array' },
            should_talk_to_agent: { type: 'boolean' },
            agent_discussion_topics: { type: 'array' }
          }
        }
      });
      return response;
    },
    onSuccess: (data) => {
      setRecommendation(data);
      setStep(4);
    }
  });

  const issues = [
    'Premiums too high',
    'Copays too expensive',
    'Medications not covered or too costly',
    'Doctors left the network',
    'Limited specialist access',
    'Poor customer service',
    'Coverage gaps',
    'Want more dental/vision/hearing',
    'Want fitness benefits',
    'Need transportation help'
  ];

  const preferences = [
    'Lower monthly premium',
    'Lower copays at doctor visits',
    'Better drug coverage',
    'Broader provider network',
    'More dental benefits',
    'More vision benefits',
    'Fitness/gym membership',
    'OTC allowance',
    'Telehealth services',
    'Care coordination'
  ];

  const handleNext = () => {
    if (step === 3) {
      analyzeMutation.mutate();
    } else {
      setStep(prev => prev + 1);
    }
  };

  return (
    <div className="space-y-6">
      {/* AEP Status Banner */}
      <Card className={`border-0 shadow-sm ${isAEP ? 'bg-gradient-to-r from-teal-500 to-emerald-600' : 'bg-gradient-to-r from-amber-500 to-orange-600'}`}>
        <CardContent className="p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                <h3 className="font-semibold">
                  {isAEP ? 'Annual Enrollment Period is OPEN!' : 'Annual Enrollment Period'}
                </h3>
              </div>
              <p className="text-sm opacity-90 mt-1">
                {isAEP 
                  ? `${daysLeftInAEP} days left to make changes (ends Dec 7)`
                  : daysUntilAEP > 0 
                    ? `Starts in ${daysUntilAEP} days (Oct 15 - Dec 7)`
                    : 'Oct 15 - Dec 7 each year'
                }
              </p>
            </div>
            {isAEP && (
              <Badge className="bg-white/20 text-white border-white/30">
                Act Now!
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Progress */}
      <Card className="border-0 shadow-sm dark:bg-slate-800">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-slate-800 dark:text-white">AEP Review</h4>
            <span className="text-sm text-slate-500">Step {step + 1} of 5</span>
          </div>
          <Progress value={(step + 1) * 20} className="h-2" />
        </CardContent>
      </Card>

      {/* Steps */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
        >
          {step === 0 && (
            <Card className="border-0 shadow-sm dark:bg-slate-800">
              <CardHeader>
                <CardTitle className="text-lg">Review Your Current Plan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Your Current Plan</p>
                  <p className="text-lg font-semibold text-slate-800 dark:text-white">{currentPlan}</p>
                  <p className="text-sm text-teal-600 dark:text-teal-400">{carrier}</p>
                </div>

                <div>
                  <Label className="text-base mb-3 block">Are you satisfied with your current plan?</Label>
                  <RadioGroup 
                    value={reviewData.satisfiedWithPlan || ''} 
                    onValueChange={(v) => setReviewData({...reviewData, satisfiedWithPlan: v})}
                  >
                    <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700">
                      <RadioGroupItem value="very_satisfied" id="very_satisfied" />
                      <Label htmlFor="very_satisfied">Very satisfied - it meets all my needs</Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700">
                      <RadioGroupItem value="somewhat_satisfied" id="somewhat_satisfied" />
                      <Label htmlFor="somewhat_satisfied">Somewhat satisfied - but could be better</Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700">
                      <RadioGroupItem value="not_satisfied" id="not_satisfied" />
                      <Label htmlFor="not_satisfied">Not satisfied - I want to explore options</Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700">
                      <RadioGroupItem value="unsure" id="unsure" />
                      <Label htmlFor="unsure">Not sure - I need help evaluating</Label>
                    </div>
                  </RadioGroup>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 1 && (
            <Card className="border-0 shadow-sm dark:bg-slate-800">
              <CardHeader>
                <CardTitle className="text-lg">Any Issues With Your Current Plan?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                  Select any issues you've experienced (select all that apply)
                </p>
                <div className="space-y-2">
                  {issues.map(issue => (
                    <div key={issue} className="flex items-center space-x-2 p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-700">
                      <Checkbox
                        id={issue}
                        checked={reviewData.planIssues.includes(issue)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setReviewData({...reviewData, planIssues: [...reviewData.planIssues, issue]});
                          } else {
                            setReviewData({...reviewData, planIssues: reviewData.planIssues.filter(i => i !== issue)});
                          }
                        }}
                      />
                      <Label htmlFor={issue} className="text-sm cursor-pointer">{issue}</Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {step === 2 && (
            <Card className="border-0 shadow-sm dark:bg-slate-800">
              <CardHeader>
                <CardTitle className="text-lg">Any Changes Since Last Year?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                    <Checkbox
                      id="doctors"
                      checked={reviewData.doctorChanges}
                      onCheckedChange={(c) => setReviewData({...reviewData, doctorChanges: c})}
                    />
                    <Label htmlFor="doctors">My doctors or specialists have changed</Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                    <Checkbox
                      id="meds"
                      checked={reviewData.medicationChanges}
                      onCheckedChange={(c) => setReviewData({...reviewData, medicationChanges: c})}
                    />
                    <Label htmlFor="meds">My medications have changed</Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                    <Checkbox
                      id="health"
                      checked={reviewData.healthChanges}
                      onCheckedChange={(c) => setReviewData({...reviewData, healthChanges: c})}
                    />
                    <Label htmlFor="health">My health needs have changed</Label>
                  </div>
                </div>

                <div className="pt-4">
                  <Label className="text-base mb-3 block">Would you like to explore other plan options?</Label>
                  <RadioGroup 
                    value={reviewData.wantsToExplore || ''} 
                    onValueChange={(v) => setReviewData({...reviewData, wantsToExplore: v})}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="explore_yes" />
                      <Label htmlFor="explore_yes">Yes, show me what else is available</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="maybe" id="explore_maybe" />
                      <Label htmlFor="explore_maybe">Maybe, if there's something significantly better</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="explore_no" />
                      <Label htmlFor="explore_no">No, I want to stay with my current plan</Label>
                    </div>
                  </RadioGroup>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 3 && (
            <Card className="border-0 shadow-sm dark:bg-slate-800">
              <CardHeader>
                <CardTitle className="text-lg">What's Most Important To You?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                  Select the benefits that matter most (select up to 5)
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {preferences.map(pref => (
                    <div key={pref} className="flex items-center space-x-2 p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-700">
                      <Checkbox
                        id={pref}
                        checked={reviewData.coveragePreferences.includes(pref)}
                        disabled={reviewData.coveragePreferences.length >= 5 && !reviewData.coveragePreferences.includes(pref)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setReviewData({...reviewData, coveragePreferences: [...reviewData.coveragePreferences, pref]});
                          } else {
                            setReviewData({...reviewData, coveragePreferences: reviewData.coveragePreferences.filter(p => p !== pref)});
                          }
                        }}
                      />
                      <Label htmlFor={pref} className="text-sm cursor-pointer">{pref}</Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {step === 4 && recommendation && (
            <div className="space-y-4">
              <Card className={`border-0 shadow-sm ${
                recommendation.overall_recommendation === 'stay' 
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                  : recommendation.overall_recommendation === 'change'
                  ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                  : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    {recommendation.overall_recommendation === 'stay' ? (
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    ) : recommendation.overall_recommendation === 'change' ? (
                      <RefreshCw className="w-6 h-6 text-amber-600" />
                    ) : (
                      <AlertCircle className="w-6 h-6 text-blue-600" />
                    )}
                    <h3 className="font-semibold text-lg">
                      {recommendation.overall_recommendation === 'stay' 
                        ? 'Your Plan Looks Good!'
                        : recommendation.overall_recommendation === 'change'
                        ? 'Consider Making Changes'
                        : 'Review Recommended'
                      }
                    </h3>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300">{recommendation.recommendation_reason}</p>
                </CardContent>
              </Card>

              {/* Action Items */}
              <Card className="border-0 shadow-sm dark:bg-slate-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Your Action Items</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {recommendation.action_items?.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                      <Badge className={
                        item.priority === 'high' 
                          ? 'bg-red-100 text-red-700'
                          : item.priority === 'medium'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-blue-100 text-blue-700'
                      }>
                        {item.priority}
                      </Badge>
                      <div>
                        <p className="font-medium text-slate-800 dark:text-white">{item.action}</p>
                        <p className="text-xs text-slate-500">{item.deadline}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Next Steps */}
              <Card className="border-0 shadow-sm dark:bg-slate-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Recommended Next Steps</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {recommendation.next_steps?.map((step, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                        <CheckCircle className="w-4 h-4 text-teal-500 mt-0.5 shrink-0" />
                        {step}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {recommendation.should_talk_to_agent && (
                <Card className="border-0 shadow-sm bg-gradient-to-r from-teal-500 to-emerald-600 text-white">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Phone className="w-8 h-8" />
                      <div className="flex-1">
                        <h4 className="font-semibold">We Recommend Speaking With an Agent</h4>
                        <p className="text-sm text-teal-100">
                          Based on your answers, a licensed agent can help you find the best plan.
                        </p>
                      </div>
                      <Button 
                        onClick={onRequestAgent}
                        className="bg-white text-teal-600 hover:bg-teal-50"
                      >
                        Talk to Agent
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      {step < 4 && (
        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setStep(prev => prev - 1)} disabled={step === 0}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button 
            onClick={handleNext}
            disabled={analyzeMutation.isPending}
            className="bg-teal-600 hover:bg-teal-700"
          >
            {analyzeMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : step === 3 ? (
              'Get Recommendations'
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