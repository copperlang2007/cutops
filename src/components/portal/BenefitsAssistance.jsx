import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  HandHeart, DollarSign, FileText, CheckCircle, Clock,
  AlertCircle, ArrowRight, Loader2, Calendar, Search,
  XCircle, RefreshCw, Bell, HelpCircle, Sparkles, MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, differenceInDays, addDays } from 'date-fns';
import { toast } from 'sonner';

const benefitPrograms = [
  {
    id: 'lis',
    name: 'Low Income Subsidy (Extra Help)',
    description: 'Helps pay Part D prescription costs',
    icon: '💊',
    type: 'lis'
  },
  {
    id: 'msp',
    name: 'Medicare Savings Program',
    description: 'Helps pay Medicare premiums and costs',
    icon: '💰',
    type: 'msp'
  },
  {
    id: 'snap',
    name: 'SNAP (Food Stamps)',
    description: 'Supplemental nutrition assistance',
    icon: '🍎',
    type: 'snap'
  },
  {
    id: 'liheap',
    name: 'LIHEAP',
    description: 'Heating and cooling assistance',
    icon: '🏠',
    type: 'liheap'
  },
  {
    id: 'medicaid',
    name: 'Medicaid',
    description: 'Full healthcare coverage assistance',
    icon: '🏥',
    type: 'medicaid'
  },
  {
    id: 'state_pharma',
    name: 'State Pharmaceutical Assistance',
    description: 'State-specific drug assistance programs',
    icon: '💉',
    type: 'state_pharma'
  }
];

const statusConfig = {
  researching: { label: 'Researching', color: 'bg-slate-100 text-slate-700', icon: Search },
  pending_application: { label: 'Ready to Apply', color: 'bg-blue-100 text-blue-700', icon: FileText },
  submitted: { label: 'Submitted', color: 'bg-purple-100 text-purple-700', icon: Clock },
  under_review: { label: 'Under Review', color: 'bg-amber-100 text-amber-700', icon: Clock },
  approved: { label: 'Approved', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  denied: { label: 'Denied', color: 'bg-red-100 text-red-700', icon: XCircle },
  appeal_filed: { label: 'Appeal Filed', color: 'bg-orange-100 text-orange-700', icon: RefreshCw },
  appeal_pending: { label: 'Appeal Pending', color: 'bg-amber-100 text-amber-700', icon: Clock },
  renewal_due: { label: 'Renewal Due', color: 'bg-red-100 text-red-700', icon: Bell }
};

export default function BenefitsAssistance({ client, portalUser }) {
  const queryClient = useQueryClient();
  const [showScreener, setShowScreener] = useState(false);
  const [screenerStep, setScreenerStep] = useState(0);
  const [screenerData, setScreenerData] = useState({
    zipCode: client?.zip || portalUser?.zip_code || '',
    householdSize: '1',
    annualIncome: '',
    assets: '',
    currentlyOnMedicare: 'yes',
    currentlyOnMedicaid: 'no',
    age: '',
    disabled: 'no'
  });
  const [eligibilityResults, setEligibilityResults] = useState(null);
  const [selectedBenefit, setSelectedBenefit] = useState(null);
  const [showAppHelp, setShowAppHelp] = useState(false);

  const userId = client?.id || portalUser?.id;
  const userIdField = client?.id ? 'client_id' : 'portal_user_id';

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ['benefitApplications', userId],
    queryFn: () => base44.entities.BenefitApplication.filter({ [userIdField]: userId }),
    enabled: !!userId
  });

  const screenMutation = useMutation({
    mutationFn: async (data) => {
      const prompt = `You are a benefits eligibility specialist. Analyze this person's situation for government assistance programs.

Applicant Information:
- ZIP Code: ${data.zipCode}
- Household Size: ${data.householdSize}
- Annual Income: $${data.annualIncome}
- Assets/Savings: $${data.assets}
- Currently on Medicare: ${data.currentlyOnMedicare}
- Currently on Medicaid: ${data.currentlyOnMedicaid}
- Age: ${data.age}
- Disabled: ${data.disabled}

For this ZIP code and state, analyze eligibility for:
1. Low Income Subsidy (LIS/Extra Help) - 2024 FPL limits
2. Medicare Savings Programs (QMB, SLMB, QI)
3. Medicaid
4. SNAP (Food Stamps)
5. LIHEAP (Energy Assistance)
6. State-specific pharmaceutical assistance programs

Return as JSON:
{
  "state": "string",
  "federal_poverty_level_percent": number,
  "eligible_programs": [
    {
      "program_id": "lis|msp|medicaid|snap|liheap|state_pharma",
      "program_name": "string",
      "likelihood_percent": number (0-100),
      "estimated_monthly_savings": number,
      "eligibility_reason": "string",
      "income_limit": number,
      "asset_limit": number,
      "how_to_apply": "string",
      "application_url": "string",
      "documents_needed": ["string"],
      "processing_time": "string"
    }
  ],
  "not_eligible_programs": [
    {
      "program_id": "string",
      "program_name": "string",
      "reason": "string",
      "what_would_qualify": "string"
    }
  ],
  "total_potential_monthly_savings": number,
  "total_potential_annual_savings": number,
  "recommended_first_step": "string",
  "state_specific_programs": [
    {
      "name": "string",
      "description": "string",
      "eligibility": "string"
    }
  ]
}`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            state: { type: 'string' },
            federal_poverty_level_percent: { type: 'number' },
            eligible_programs: { type: 'array' },
            not_eligible_programs: { type: 'array' },
            total_potential_monthly_savings: { type: 'number' },
            total_potential_annual_savings: { type: 'number' },
            recommended_first_step: { type: 'string' },
            state_specific_programs: { type: 'array' }
          }
        }
      });
      return response;
    },
    onSuccess: (data) => {
      setEligibilityResults(data);
      setScreenerStep(4);
    }
  });

  const createApplicationMutation = useMutation({
    mutationFn: async (program) => {
      await base44.entities.BenefitApplication.create({
        [userIdField]: userId,
        benefit_type: program.program_id,
        benefit_name: program.program_name,
        status: 'pending_application',
        likelihood_score: program.likelihood_percent,
        income_data: {
          annual_income: parseFloat(screenerData.annualIncome),
          household_size: parseInt(screenerData.householdSize),
          assets: parseFloat(screenerData.assets)
        },
        documents_required: program.documents_needed,
        estimated_savings: program.estimated_monthly_savings * 12
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['benefitApplications', userId]);
      toast.success('Application started! We\'ll help you complete it.');
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, notes }) => {
      await base44.entities.BenefitApplication.update(id, { status, notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['benefitApplications', userId]);
      toast.success('Status updated');
    }
  });

  const fileAppealMutation = useMutation({
    mutationFn: async ({ id, reason }) => {
      await base44.entities.BenefitApplication.update(id, { 
        status: 'appeal_filed',
        appeal_reason: reason,
        appeal_date: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['benefitApplications', userId]);
      toast.success('Appeal filed. We\'ll track the status for you.');
    }
  });

  const handleScreenerSubmit = () => {
    screenMutation.mutate(screenerData);
  };

  const getUpcomingRenewals = () => {
    return applications.filter(app => {
      if (!app.renewal_date) return false;
      const daysUntil = differenceInDays(new Date(app.renewal_date), new Date());
      return daysUntil > 0 && daysUntil <= 60;
    });
  };

  const renewals = getUpcomingRenewals();

  return (
    <div className="space-y-6">
      {/* Renewal Alerts */}
      {renewals.length > 0 && (
        <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800">
          <Bell className="w-4 h-4 text-amber-600" />
          <AlertDescription className="text-amber-700 dark:text-amber-400">
            <strong>Renewal Required:</strong> {renewals.length} benefit(s) need renewal soon.
            {renewals.map(r => (
              <span key={r.id} className="block text-sm mt-1">
                • {r.benefit_name} - Due {format(new Date(r.renewal_date), 'MMM d, yyyy')}
              </span>
            ))}
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <Card className="border-0 shadow-sm dark:bg-slate-800">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                <HandHeart className="w-5 h-5 text-teal-600" />
                Benefits Assistance
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Find government programs to help with healthcare costs
              </p>
            </div>
            <Button onClick={() => setShowScreener(true)} className="bg-teal-600 hover:bg-teal-700">
              <Search className="w-4 h-4 mr-2" />
              Check Eligibility
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="applications" className="space-y-4">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="applications">My Applications</TabsTrigger>
          <TabsTrigger value="programs">Programs</TabsTrigger>
          <TabsTrigger value="help">Get Help</TabsTrigger>
        </TabsList>

        <TabsContent value="applications">
          {applications.length === 0 ? (
            <Card className="border-0 shadow-sm dark:bg-slate-800">
              <CardContent className="py-12 text-center">
                <HandHeart className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">
                  No Applications Yet
                </h3>
                <p className="text-slate-500 dark:text-slate-400 mb-4 max-w-md mx-auto">
                  Check your eligibility for government assistance programs that could save you money on healthcare costs.
                </p>
                <Button onClick={() => setShowScreener(true)} className="bg-teal-600 hover:bg-teal-700">
                  Check Eligibility Now
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {applications.map((app, idx) => {
                const status = statusConfig[app.status] || statusConfig.researching;
                const StatusIcon = status.icon;
                return (
                  <motion.div
                    key={app.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card className="border-0 shadow-sm dark:bg-slate-800">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-slate-800 dark:text-white">
                                {app.benefit_name}
                              </h4>
                              <Badge className={status.color}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {status.label}
                              </Badge>
                            </div>
                            {app.likelihood_score && (
                              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                Approval likelihood: {app.likelihood_score}%
                              </p>
                            )}
                            {app.estimated_savings && (
                              <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                                Potential savings: ${app.estimated_savings}/year
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            {app.status === 'pending_application' && (
                              <Button size="sm" className="bg-teal-600 hover:bg-teal-700">
                                Complete Application
                              </Button>
                            )}
                            {app.status === 'denied' && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => fileAppealMutation.mutate({ id: app.id, reason: 'Income recalculation requested' })}
                              >
                                File Appeal
                              </Button>
                            )}
                            {app.renewal_date && (
                              <p className="text-xs text-slate-500">
                                Renewal: {format(new Date(app.renewal_date), 'MMM d, yyyy')}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Progress for in-flight applications */}
                        {['submitted', 'under_review', 'appeal_pending'].includes(app.status) && (
                          <div className="mt-4">
                            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                              <span>Application Progress</span>
                              <span>Est. {app.status === 'submitted' ? '2-4 weeks' : '4-6 weeks'}</span>
                            </div>
                            <Progress value={app.status === 'submitted' ? 40 : 60} className="h-2" />
                          </div>
                        )}

                        {/* Documents needed */}
                        {app.status === 'pending_application' && app.documents_required?.length > 0 && (
                          <div className="mt-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                            <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                              Documents Needed:
                            </p>
                            <ul className="text-xs text-slate-500 space-y-1">
                              {app.documents_required.slice(0, 4).map((doc, i) => (
                                <li key={i} className="flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3 text-slate-400" />
                                  {doc}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="programs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {benefitPrograms.map((program) => (
              <Card key={program.id} className="border-0 shadow-sm dark:bg-slate-800 hover:border-teal-300 dark:hover:border-teal-700 transition-colors cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{program.icon}</span>
                    <div>
                      <h4 className="font-semibold text-slate-800 dark:text-white">{program.name}</h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{program.description}</p>
                      <Button 
                        size="sm" 
                        variant="link" 
                        className="p-0 h-auto mt-2 text-teal-600"
                        onClick={() => setShowScreener(true)}
                      >
                        Check Eligibility <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="help">
          <Card className="border-0 shadow-sm dark:bg-slate-800">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-start gap-4 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
                <HelpCircle className="w-6 h-6 text-blue-600 shrink-0" />
                <div>
                  <h4 className="font-semibold text-blue-700 dark:text-blue-400">Need Help Applying?</h4>
                  <p className="text-sm text-blue-600 dark:text-blue-300 mt-1">
                    Our team can help you complete applications, gather documents, and track your status.
                  </p>
                  <Button size="sm" className="mt-3 bg-blue-600 hover:bg-blue-700">
                    Request Assistance
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-slate-800 dark:text-white">Common Questions</h4>
                {[
                  { q: 'What is the Low Income Subsidy?', a: 'Extra Help that pays most of your Medicare prescription drug costs.' },
                  { q: 'How long does approval take?', a: 'Most programs take 2-6 weeks to process applications.' },
                  { q: 'What if I\'m denied?', a: 'You can file an appeal. We\'ll help you understand why and what to do next.' },
                  { q: 'Do benefits need to be renewed?', a: 'Yes, most programs require annual renewal. We\'ll remind you in advance.' }
                ].map((faq, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                    <p className="font-medium text-sm text-slate-800 dark:text-white">{faq.q}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{faq.a}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Eligibility Screener Modal */}
      <Dialog open={showScreener} onOpenChange={setShowScreener}>
        <DialogContent className="max-w-lg dark:bg-slate-800 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-teal-600" />
              Benefits Eligibility Screener
            </DialogTitle>
          </DialogHeader>

          <AnimatePresence mode="wait">
            {screenerStep < 4 ? (
              <motion.div
                key={screenerStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4 py-4"
              >
                {screenerStep === 0 && (
                  <>
                    <div>
                      <Label>ZIP Code</Label>
                      <div className="flex gap-2 mt-1">
                        <MapPin className="w-5 h-5 text-slate-400 mt-2" />
                        <Input 
                          value={screenerData.zipCode}
                          onChange={(e) => setScreenerData({...screenerData, zipCode: e.target.value})}
                          placeholder="Enter your ZIP code"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Your Age</Label>
                      <Input 
                        type="number"
                        value={screenerData.age}
                        onChange={(e) => setScreenerData({...screenerData, age: e.target.value})}
                        placeholder="Enter your age"
                      />
                    </div>
                    <div>
                      <Label>Are you currently on Medicare?</Label>
                      <RadioGroup 
                        value={screenerData.currentlyOnMedicare} 
                        onValueChange={(v) => setScreenerData({...screenerData, currentlyOnMedicare: v})}
                        className="mt-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="yes" id="medicare-yes" />
                          <Label htmlFor="medicare-yes">Yes</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="no" id="medicare-no" />
                          <Label htmlFor="medicare-no">No</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </>
                )}

                {screenerStep === 1 && (
                  <>
                    <div>
                      <Label>Household Size (including yourself)</Label>
                      <Select 
                        value={screenerData.householdSize} 
                        onValueChange={(v) => setScreenerData({...screenerData, householdSize: v})}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {[1,2,3,4,5,6,7,8].map(n => (
                            <SelectItem key={n} value={n.toString()}>{n} person{n > 1 ? 's' : ''}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                {screenerStep === 2 && (
                  <>
                    <div>
                      <Label>Total Annual Household Income</Label>
                      <div className="flex gap-2 mt-1">
                        <DollarSign className="w-5 h-5 text-slate-400 mt-2" />
                        <Input 
                          type="number"
                          value={screenerData.annualIncome}
                          onChange={(e) => setScreenerData({...screenerData, annualIncome: e.target.value})}
                          placeholder="Annual income before taxes"
                        />
                      </div>
                      <p className="text-xs text-slate-500 mt-1">Include Social Security, pensions, and other income</p>
                    </div>
                  </>
                )}

                {screenerStep === 3 && (
                  <>
                    <div>
                      <Label>Total Assets/Savings</Label>
                      <div className="flex gap-2 mt-1">
                        <DollarSign className="w-5 h-5 text-slate-400 mt-2" />
                        <Input 
                          type="number"
                          value={screenerData.assets}
                          onChange={(e) => setScreenerData({...screenerData, assets: e.target.value})}
                          placeholder="Bank accounts, investments, etc."
                        />
                      </div>
                      <p className="text-xs text-slate-500 mt-1">Don't include your home or one car</p>
                    </div>
                    <div>
                      <Label>Do you have a disability?</Label>
                      <RadioGroup 
                        value={screenerData.disabled} 
                        onValueChange={(v) => setScreenerData({...screenerData, disabled: v})}
                        className="mt-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="yes" id="disabled-yes" />
                          <Label htmlFor="disabled-yes">Yes</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="no" id="disabled-no" />
                          <Label htmlFor="disabled-no">No</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </>
                )}

                <div className="flex justify-between pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setScreenerStep(prev => prev - 1)}
                    disabled={screenerStep === 0}
                  >
                    Back
                  </Button>
                  <Button 
                    onClick={() => screenerStep === 3 ? handleScreenerSubmit() : setScreenerStep(prev => prev + 1)}
                    disabled={screenMutation.isPending}
                    className="bg-teal-600 hover:bg-teal-700"
                  >
                    {screenMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Checking...
                      </>
                    ) : screenerStep === 3 ? 'Check Eligibility' : 'Next'}
                  </Button>
                </div>
              </motion.div>
            ) : eligibilityResults && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4 py-4"
              >
                {/* Savings Summary */}
                <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-center">
                  <p className="text-sm text-green-600 dark:text-green-400">Potential Annual Savings</p>
                  <p className="text-3xl font-bold text-green-700 dark:text-green-300">
                    ${eligibilityResults.total_potential_annual_savings?.toLocaleString()}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    Based on {eligibilityResults.eligible_programs?.length} programs you may qualify for
                  </p>
                </div>

                {/* Eligible Programs */}
                <div className="space-y-3">
                  <h4 className="font-medium text-slate-800 dark:text-white">Programs You May Qualify For:</h4>
                  {eligibilityResults.eligible_programs?.map((program, idx) => (
                    <div 
                      key={idx}
                      className="p-3 rounded-lg border dark:border-slate-700 hover:border-teal-300 dark:hover:border-teal-600"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h5 className="font-medium text-slate-800 dark:text-white">{program.program_name}</h5>
                          <p className="text-sm text-slate-500 dark:text-slate-400">{program.eligibility_reason}</p>
                          <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                            Saves ~${program.estimated_monthly_savings}/month
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge className={program.likelihood_percent >= 70 
                            ? 'bg-green-100 text-green-700'
                            : 'bg-amber-100 text-amber-700'
                          }>
                            {program.likelihood_percent}% likely
                          </Badge>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        className="w-full mt-3 bg-teal-600 hover:bg-teal-700"
                        onClick={() => createApplicationMutation.mutate(program)}
                        disabled={createApplicationMutation.isPending}
                      >
                        Start Application
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Not Eligible */}
                {eligibilityResults.not_eligible_programs?.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-slate-500 dark:text-slate-400 text-sm">Not Currently Eligible:</h4>
                    {eligibilityResults.not_eligible_programs.map((program, idx) => (
                      <div key={idx} className="p-2 rounded bg-slate-50 dark:bg-slate-900/50 text-sm">
                        <span className="text-slate-600 dark:text-slate-300">{program.program_name}</span>
                        <span className="text-slate-400 ml-2">- {program.reason}</span>
                      </div>
                    ))}
                  </div>
                )}

                <Button 
                  onClick={() => {
                    setShowScreener(false);
                    setScreenerStep(0);
                    setEligibilityResults(null);
                  }}
                  className="w-full"
                  variant="outline"
                >
                  Done
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </div>
  );
}