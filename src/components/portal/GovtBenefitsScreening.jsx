import { useState } from 'react'
import { base44 } from '@/api/base44Client'
import { useMutation } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Sparkles, Loader2, DollarSign, FileText, CheckCircle, 
  AlertCircle, ArrowRight, Shield, TrendingUp, ExternalLink, HelpCircle
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function GovtBenefitsScreening({ portalUser }) {
  const [step, setStep] = useState(1);
  const [screeningResults, setScreeningResults] = useState(null);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [showGuidedAssistance, setShowGuidedAssistance] = useState(false);

  const [personalInfo, setPersonalInfo] = useState({
    age: '',
    state: portalUser?.state || '',
    county: '',
    annual_income: '',
    household_size: '1',
    employment_status: '',
    has_disability: false,
    is_veteran: false,
    has_medicare: false,
    has_medicaid: false,
    has_snap: false
  });

  const runScreeningMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('aiGovtBenefitsScreening', {
        personalInfo
      });
      return response.data;
    },
    onSuccess: (data) => {
      setScreeningResults(data.screening_results);
      setStep(2);
      toast.success(`Found ${data.screening_results.screening_summary.likely_eligible} programs you likely qualify for!`);
    },
    onError: () => toast.error('Screening failed')
  });

  const getLikelihoodColor = (likelihood) => {
    switch (likelihood) {
      case 'likely': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'possible': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'unlikely': return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-400';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      <Card className="clay-morphism border-0">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl">Government Benefits Finder</CardTitle>
              <p className="text-sm text-slate-600 dark:text-slate-400">Discover programs you may qualify for</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={(step / 2) * 100} className="h-2 mb-6" />

          <AnimatePresence mode="wait">
            {/* Step 1: Screening Form */}
            {step === 1 && (
              <motion.div
                key="screening-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Age *</Label>
                    <Input
                      type="number"
                      value={personalInfo.age}
                      onChange={(e) => setPersonalInfo({ ...personalInfo, age: e.target.value })}
                      placeholder="65"
                      required
                    />
                  </div>
                  <div>
                    <Label>State *</Label>
                    <Input
                      value={personalInfo.state}
                      onChange={(e) => setPersonalInfo({ ...personalInfo, state: e.target.value })}
                      placeholder="CA"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>County</Label>
                    <Input
                      value={personalInfo.county}
                      onChange={(e) => setPersonalInfo({ ...personalInfo, county: e.target.value })}
                      placeholder="Los Angeles"
                    />
                  </div>
                  <div>
                    <Label>Annual Income *</Label>
                    <Input
                      type="number"
                      value={personalInfo.annual_income}
                      onChange={(e) => setPersonalInfo({ ...personalInfo, annual_income: e.target.value })}
                      placeholder="25000"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Household Size</Label>
                    <Select value={personalInfo.household_size} onValueChange={(val) => setPersonalInfo({ ...personalInfo, household_size: val })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 person</SelectItem>
                        <SelectItem value="2">2 people</SelectItem>
                        <SelectItem value="3">3 people</SelectItem>
                        <SelectItem value="4">4 people</SelectItem>
                        <SelectItem value="5+">5+ people</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Employment Status</Label>
                    <Select value={personalInfo.employment_status} onValueChange={(val) => setPersonalInfo({ ...personalInfo, employment_status: val })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="employed">Employed</SelectItem>
                        <SelectItem value="unemployed">Unemployed</SelectItem>
                        <SelectItem value="retired">Retired</SelectItem>
                        <SelectItem value="disabled">Disabled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 p-4 clay-subtle rounded-xl">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={personalInfo.has_disability}
                      onChange={(e) => setPersonalInfo({ ...personalInfo, has_disability: e.target.checked })}
                      className="w-4 h-4 text-teal-600"
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300">Have Disability</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={personalInfo.is_veteran}
                      onChange={(e) => setPersonalInfo({ ...personalInfo, is_veteran: e.target.checked })}
                      className="w-4 h-4 text-teal-600"
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300">Veteran</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={personalInfo.has_medicare}
                      onChange={(e) => setPersonalInfo({ ...personalInfo, has_medicare: e.target.checked })}
                      className="w-4 h-4 text-teal-600"
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300">Have Medicare</span>
                  </label>
                </div>

                <Button
                  onClick={() => runScreeningMutation.mutate()}
                  disabled={runScreeningMutation.isPending || !personalInfo.age || !personalInfo.state || !personalInfo.annual_income}
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-xl"
                  size="lg"
                >
                  {runScreeningMutation.isPending ? (
                    <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Checking Eligibility...</>
                  ) : (
                    <><Sparkles className="w-5 h-5 mr-2" />Find My Benefits</>
                  )}
                </Button>
              </motion.div>
            )}

            {/* Step 2: Results */}
            {step === 2 && screeningResults && (
              <motion.div
                key="results"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                {/* Summary */}
                <div className="p-6 clay-subtle rounded-xl text-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                    You May Qualify for {screeningResults.screening_summary.likely_eligible} Programs!
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-4">
                    Estimated total annual benefit: <span className="font-bold text-green-600 text-xl">${screeningResults.screening_summary.estimated_total_annual_benefit.toLocaleString()}</span>
                  </p>
                  <div className="flex gap-3 justify-center text-sm">
                    <Badge className="bg-green-100 text-green-700">
                      {screeningResults.screening_summary.likely_eligible} Likely
                    </Badge>
                    <Badge className="bg-amber-100 text-amber-700">
                      {screeningResults.screening_summary.possibly_eligible} Possible
                    </Badge>
                  </div>
                </div>

                {/* Eligible Programs */}
                <div className="space-y-3">
                  <h3 className="font-bold text-slate-900 dark:text-white">Eligible Programs</h3>
                  {screeningResults.eligible_programs
                    .filter(p => p.eligibility_likelihood === 'likely' || p.eligibility_likelihood === 'possible')
                    .sort((a, b) => b.priority_score - a.priority_score)
                    .map((program, i) => (
                      <div key={i} className="p-4 clay-morphism rounded-xl hover:scale-[1.01] transition-transform cursor-pointer" onClick={() => setSelectedProgram(program)}>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-bold text-slate-900 dark:text-white">{program.program_name}</h4>
                              <Badge className={getLikelihoodColor(program.eligibility_likelihood)}>
                                {program.eligibility_likelihood}
                              </Badge>
                              <Badge variant="outline">{program.confidence}% confident</Badge>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">{program.benefits_description}</p>
                            <div className="flex gap-2 flex-wrap">
                              <Badge variant="outline" className="text-xs">{program.program_type}</Badge>
                              <Badge variant="outline" className="text-xs">{program.application_complexity} complexity</Badge>
                              <Badge variant="outline" className="text-xs">{program.processing_time}</Badge>
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <p className="text-xs text-slate-500">Monthly Benefit</p>
                            <p className="text-2xl font-bold text-green-600">${program.estimated_monthly_benefit}</p>
                            <p className="text-xs text-slate-500">${program.estimated_annual_benefit}/year</p>
                          </div>
                        </div>

                        {/* Income Threshold */}
                        {program.income_threshold && (
                          <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs text-slate-600 dark:text-slate-400">Income vs Threshold</span>
                              <Badge className={
                                program.income_threshold.status === 'within_threshold' ? 'bg-green-100 text-green-700' :
                                program.income_threshold.status === 'close' ? 'bg-amber-100 text-amber-700' :
                                'bg-red-100 text-red-700'
                              }>
                                {program.income_threshold.percentage_of_limit}% of limit
                              </Badge>
                            </div>
                            <Progress value={program.income_threshold.percentage_of_limit} className="h-1.5" />
                          </div>
                        )}

                        <div className="flex gap-2 mt-4">
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedProgram(program);
                              window.open(`https://www.benefits.gov/search?query=${encodeURIComponent(program.program_name)}`, '_blank');
                            }}
                            variant="outline"
                            size="sm"
                            className="flex-1"
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Apply Now
                          </Button>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedProgram(program);
                              setShowGuidedAssistance(true);
                            }}
                            size="sm"
                            className="flex-1 bg-teal-600 hover:bg-teal-700"
                          >
                            <HelpCircle className="w-4 h-4 mr-2" />
                            Get Help
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>

                {/* Recommendations */}
                {screeningResults.recommendations?.length > 0 && (
                  <Card className="border-0 shadow-sm dark:bg-slate-800">
                    <CardHeader>
                      <CardTitle className="text-base">Recommended Next Steps</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {screeningResults.recommendations.map((rec, i) => (
                        <div key={i} className="p-3 clay-subtle rounded-lg flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                            {rec.priority}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-sm text-slate-900 dark:text-white">{rec.action}</h4>
                            <p className="text-xs text-slate-600 dark:text-slate-400">{rec.reason}</p>
                            <p className="text-xs text-green-600 mt-1">Value: ${rec.estimated_value.toLocaleString()}/year</p>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                <Button
                  onClick={() => setStep(1)}
                  variant="outline"
                  className="w-full"
                >
                  Start New Screening
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Guided Assistance Modal */}
      <Dialog open={showGuidedAssistance} onOpenChange={setShowGuidedAssistance}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Guided Application Assistance</DialogTitle>
            <DialogDescription>
              {selectedProgram?.program_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 clay-subtle rounded-xl">
              <h4 className="font-bold text-slate-900 dark:text-white mb-2">What You&apos;ll Need:</h4>
              <ul className="space-y-2">
                {selectedProgram?.eligibility_factors?.missing_info?.length > 0 ? (
                  selectedProgram.eligibility_factors.missing_info.map((info, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <FileText className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                      <span className="text-sm text-slate-700 dark:text-slate-300">{info}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-sm text-slate-600 dark:text-slate-400">All required information collected!</li>
                )}
              </ul>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <h4 className="font-bold text-blue-900 dark:text-blue-200 mb-2">Application Process:</h4>
              <ol className="space-y-2 list-decimal list-inside text-sm text-blue-800 dark:text-blue-300">
                <li>Review your information for accuracy</li>
                <li>Gather required documents</li>
                <li>Complete the application online or with assistance</li>
                <li>Submit and track your application status</li>
                <li>Estimated processing time: {selectedProgram?.processing_time}</li>
              </ol>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => window.open(`https://www.benefits.gov/search?query=${encodeURIComponent(selectedProgram?.program_name)}`, '_blank')}
                className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Start Application
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowGuidedAssistance(false)}
                className="flex-1"
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}