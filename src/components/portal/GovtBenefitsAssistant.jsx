import { useState } from 'react'
import { base44 } from '@/api/base44Client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  HelpCircle, DollarSign, FileText, CheckCircle, Clock, AlertTriangle,
  ArrowRight, Loader2, Calendar, Phone, Mail, Scale, TrendingUp,
  Shield, Heart, Zap, Building2, RefreshCw
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

const benefitPrograms = [
  { 
    id: 'lis', 
    name: 'Low Income Subsidy (Extra Help)', 
    description: 'Helps pay Part D costs',
    icon: DollarSign,
    color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
  },
  { 
    id: 'msp', 
    name: 'Medicare Savings Program', 
    description: 'Helps pay Medicare premiums',
    icon: Shield,
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400'
  },
  { 
    id: 'medicaid', 
    name: 'Medicaid', 
    description: 'Full healthcare coverage',
    icon: Heart,
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400'
  },
  { 
    id: 'snap', 
    name: 'SNAP (Food Stamps)', 
    description: 'Food assistance',
    icon: Zap,
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
  },
  { 
    id: 'liheap', 
    name: 'LIHEAP', 
    description: 'Energy/heating assistance',
    icon: Building2,
    color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400'
  },
  { 
    id: 'state_pharma', 
    name: 'State Pharmacy Assistance', 
    description: 'State drug programs',
    icon: FileText,
    color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400'
  }
];

const statusConfig = {
  researching: { label: 'Researching', color: 'bg-slate-100 text-slate-700', icon: HelpCircle },
  pending_application: { label: 'Ready to Apply', color: 'bg-blue-100 text-blue-700', icon: FileText },
  submitted: { label: 'Submitted', color: 'bg-purple-100 text-purple-700', icon: Clock },
  under_review: { label: 'Under Review', color: 'bg-amber-100 text-amber-700', icon: Clock },
  approved: { label: 'Approved', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  denied: { label: 'Denied', color: 'bg-red-100 text-red-700', icon: AlertTriangle },
  appeal_filed: { label: 'Appeal Filed', color: 'bg-orange-100 text-orange-700', icon: Scale },
  appeal_pending: { label: 'Appeal Pending', color: 'bg-amber-100 text-amber-700', icon: Clock },
  renewal_due: { label: 'Renewal Due', color: 'bg-red-100 text-red-700', icon: RefreshCw }
};

export default function GovtBenefitsAssistant({ client, portalUser }) {
  const queryClient = useQueryClient();
  const [showScreening, setShowScreening] = useState(false);
  const [screeningData, setScreeningData] = useState({
    annual_income: '',
    household_size: '1',
    assets: '',
    zip_code: client?.zip || portalUser?.zip_code || '',
    receives_medicaid: false,
    receives_ssi: false,
    state: client?.state || portalUser?.state || ''
  });
  const [eligibilityResults, setEligibilityResults] = useState(null);
  const [selectedBenefit, setSelectedBenefit] = useState(null);

  const userId = client?.id || portalUser?.id;
  const userIdField = client?.id ? 'client_id' : 'portal_user_id';

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ['benefitApplications', userId],
    queryFn: () => base44.entities.BenefitApplication.filter({ [userIdField]: userId }, '-created_date'),
    enabled: !!userId
  });

  const screeningMutation = useMutation({
    mutationFn: async (data) => {
      const prompt = `You are a government benefits eligibility expert. Based on this information, determine eligibility for assistance programs.

Applicant Information:
- Annual Income: $${data.annual_income}
- Household Size: ${data.household_size}
- Assets/Resources: $${data.assets || 'Unknown'}
- ZIP Code: ${data.zip_code}
- State: ${data.state || 'Unknown'}
- Currently receives Medicaid: ${data.receives_medicaid ? 'Yes' : 'No'}
- Currently receives SSI: ${data.receives_ssi ? 'Yes' : 'No'}

Analyze eligibility for:
1. Low Income Subsidy (Extra Help) - for Medicare Part D
2. Medicare Savings Programs (QMB, SLMB, QI)
3. Medicaid
4. SNAP (Food Stamps)
5. LIHEAP (Energy Assistance)
6. State Pharmaceutical Assistance Programs

For 2024, LIS income limits are approximately:
- Full LIS: $22,590 individual / $30,660 couple
- Partial LIS: $33,885 individual / $45,990 couple
- Asset limits: $17,220 individual / $34,360 couple

Return as JSON:
{
  "programs": [
    {
      "program_id": "lis|msp|medicaid|snap|liheap|state_pharma",
      "program_name": "string",
      "eligibility_likelihood": 1-100,
      "eligibility_status": "likely_eligible|possibly_eligible|unlikely_eligible",
      "estimated_savings": "string",
      "income_limit": "string",
      "asset_limit": "string",
      "key_requirements": ["string"],
      "application_process": "string",
      "processing_time": "string",
      "documents_needed": ["string"],
      "notes": "string"
    }
  ],
  "total_potential_savings": "string",
  "priority_applications": ["program_id"],
  "general_recommendations": ["string"],
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
            programs: { type: 'array', items: { type: 'object' } },
            total_potential_savings: { type: 'string' },
            priority_applications: { type: 'array', items: { type: 'string' } },
            general_recommendations: { type: 'array', items: { type: 'string' } },
            state_specific_programs: { type: 'array', items: { type: 'object' } }
          }
        }
      });
      return response;
    },
    onSuccess: (data) => {
      setEligibilityResults(data);
      setShowScreening(false);
    }
  });

  const createApplicationMutation = useMutation({
    mutationFn: (data) => base44.entities.BenefitApplication.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['benefitApplications', userId]);
      toast.success('Application tracking started!');
      setSelectedBenefit(null);
    }
  });

  const updateApplicationMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.BenefitApplication.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['benefitApplications', userId]);
      toast.success('Application updated!');
    }
  });

  const handleStartApplication = (program) => {
    const programInfo = benefitPrograms.find(p => p.id === program.program_id);
    createApplicationMutation.mutate({
      [userIdField]: userId,
      benefit_type: program.program_id,
      benefit_name: program.program_name,
      status: 'pending_application',
      likelihood_score: program.eligibility_likelihood,
      income_data: {
        annual_income: parseFloat(screeningData.annual_income) || 0,
        household_size: parseInt(screeningData.household_size) || 1,
        assets: parseFloat(screeningData.assets) || 0
      },
      documents_required: program.documents_needed || [],
      estimated_savings: parseFloat(program.estimated_savings?.replace(/[^0-9.]/g, '')) || 0
    });
  };

  const handleFileAppeal = (application) => {
    updateApplicationMutation.mutate({
      id: application.id,
      data: {
        status: 'appeal_filed',
        appeal_date: new Date().toISOString().split('T')[0]
      }
    });
  };

  const activeApplications = applications.filter(a => 
    !['approved', 'denied'].includes(a.status) || a.status === 'renewal_due'
  );

  const approvedBenefits = applications.filter(a => a.status === 'approved');

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-0 shadow-sm overflow-hidden dark:bg-slate-800">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
          <h2 className="text-xl font-bold mb-2">Government Benefits Assistant</h2>
          <p className="text-blue-100 text-sm">
            Find and apply for financial assistance programs you may qualify for.
          </p>
        </div>
        <CardContent className="p-4">
          <Button 
            onClick={() => setShowScreening(true)}
            className="w-full bg-teal-600 hover:bg-teal-700"
          >
            <HelpCircle className="w-4 h-4 mr-2" />
            Check My Eligibility
          </Button>
        </CardContent>
      </Card>

      {/* Screening Form */}
      <AnimatePresence>
        {showScreening && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card className="border-0 shadow-sm dark:bg-slate-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Eligibility Screening</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                  <AlertDescription className="text-sm text-blue-700 dark:text-blue-300">
                    This information is used only to estimate your eligibility. All data is kept confidential.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Annual Household Income *</Label>
                    <Input
                      type="number"
                      value={screeningData.annual_income}
                      onChange={(e) => setScreeningData({...screeningData, annual_income: e.target.value})}
                      placeholder="e.g., 25000"
                    />
                  </div>
                  <div>
                    <Label>Household Size *</Label>
                    <Input
                      type="number"
                      min="1"
                      value={screeningData.household_size}
                      onChange={(e) => setScreeningData({...screeningData, household_size: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Total Assets/Resources</Label>
                    <Input
                      type="number"
                      value={screeningData.assets}
                      onChange={(e) => setScreeningData({...screeningData, assets: e.target.value})}
                      placeholder="Savings, investments (not home)"
                    />
                  </div>
                  <div>
                    <Label>ZIP Code *</Label>
                    <Input
                      value={screeningData.zip_code}
                      onChange={(e) => setScreeningData({...screeningData, zip_code: e.target.value})}
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={screeningData.receives_medicaid}
                      onChange={(e) => setScreeningData({...screeningData, receives_medicaid: e.target.checked})}
                      className="rounded"
                    />
                    <span className="text-sm">I currently receive Medicaid</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={screeningData.receives_ssi}
                      onChange={(e) => setScreeningData({...screeningData, receives_ssi: e.target.checked})}
                      className="rounded"
                    />
                    <span className="text-sm">I receive SSI</span>
                  </label>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setShowScreening(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => screeningMutation.mutate(screeningData)}
                    disabled={!screeningData.annual_income || !screeningData.zip_code || screeningMutation.isPending}
                    className="flex-1 bg-teal-600 hover:bg-teal-700"
                  >
                    {screeningMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Checking Eligibility...
                      </>
                    ) : (
                      'Check Eligibility'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Eligibility Results */}
      {eligibilityResults && (
        <Card className="border-0 shadow-sm dark:bg-slate-800">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                Eligibility Results
              </CardTitle>
              {eligibilityResults.total_potential_savings && (
                <Badge className="bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400">
                  Potential savings: {eligibilityResults.total_potential_savings}/year
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {eligibilityResults.programs?.map((program, idx) => {
              const programInfo = benefitPrograms.find(p => p.id === program.program_id);
              const ProgramIcon = programInfo?.icon || HelpCircle;
              const isLikely = program.eligibility_status === 'likely_eligible';
              const isPossible = program.eligibility_status === 'possibly_eligible';
              
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`p-4 rounded-xl border ${
                    isLikely ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20' :
                    isPossible ? 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20' :
                    'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${programInfo?.color || 'bg-slate-100'}`}>
                        <ProgramIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-800 dark:text-white">{program.program_name}</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{programInfo?.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={`${
                        isLikely ? 'bg-green-100 text-green-700' :
                        isPossible ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {program.eligibility_likelihood}% likely
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                    <div className="p-2 rounded-lg bg-white dark:bg-slate-800">
                      <p className="text-xs text-slate-500 dark:text-slate-400">Est. Savings</p>
                      <p className="font-medium text-green-600">{program.estimated_savings}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-white dark:bg-slate-800">
                      <p className="text-xs text-slate-500 dark:text-slate-400">Processing Time</p>
                      <p className="font-medium text-slate-700 dark:text-slate-300">{program.processing_time}</p>
                    </div>
                  </div>

                  {program.documents_needed?.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Documents Needed:</p>
                      <div className="flex flex-wrap gap-1">
                        {program.documents_needed.map((doc, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{doc}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {(isLikely || isPossible) && (
                    <Button 
                      size="sm"
                      onClick={() => handleStartApplication(program)}
                      disabled={createApplicationMutation.isPending}
                      className="w-full bg-teal-600 hover:bg-teal-700"
                    >
                      Start Application
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                </motion.div>
              );
            })}

            {eligibilityResults.state_specific_programs?.length > 0 && (
              <div className="mt-4 p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800">
                <h4 className="font-medium text-purple-700 dark:text-purple-300 mb-2">State-Specific Programs</h4>
                {eligibilityResults.state_specific_programs.map((program, idx) => (
                  <div key={idx} className="mb-2">
                    <p className="text-sm font-medium text-purple-600">{program.name}</p>
                    <p className="text-sm text-purple-500">{program.description}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Active Applications */}
      {activeApplications.length > 0 && (
        <Card className="border-0 shadow-sm dark:bg-slate-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              Active Applications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeApplications.map((app) => {
              const status = statusConfig[app.status] || statusConfig.researching;
              const StatusIcon = status.icon;
              const daysUntilRenewal = app.renewal_date 
                ? differenceInDays(new Date(app.renewal_date), new Date())
                : null;

              return (
                <div key={app.id} className="p-4 rounded-xl border dark:border-slate-700">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-slate-800 dark:text-white">{app.benefit_name}</h4>
                      {app.application_date && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Applied: {format(new Date(app.application_date), 'MMM d, yyyy')}
                        </p>
                      )}
                    </div>
                    <Badge className={status.color}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {status.label}
                    </Badge>
                  </div>

                  {daysUntilRenewal !== null && daysUntilRenewal <= 60 && (
                    <Alert className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 mt-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <AlertDescription className="text-sm text-amber-700 dark:text-amber-300">
                        Renewal due in {daysUntilRenewal} days ({format(new Date(app.renewal_date), 'MMM d, yyyy')})
                      </AlertDescription>
                    </Alert>
                  )}

                  {app.status === 'denied' && (
                    <div className="mt-3 flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleFileAppeal(app)}
                      >
                        <Scale className="w-4 h-4 mr-1" />
                        File Appeal
                      </Button>
                      <Button size="sm" variant="outline">
                        <Phone className="w-4 h-4 mr-1" />
                        Get Help
                      </Button>
                    </div>
                  )}

                  {app.status === 'renewal_due' && (
                    <Button 
                      size="sm" 
                      className="mt-3 bg-amber-600 hover:bg-amber-700"
                      onClick={() => updateApplicationMutation.mutate({
                        id: app.id,
                        data: { status: 'submitted', application_date: new Date().toISOString().split('T')[0] }
                      })}
                    >
                      <RefreshCw className="w-4 h-4 mr-1" />
                      Submit Renewal
                    </Button>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Approved Benefits */}
      {approvedBenefits.length > 0 && (
        <Card className="border-0 shadow-sm dark:bg-slate-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Approved Benefits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {approvedBenefits.map((app) => (
                <div key={app.id} className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-green-800 dark:text-green-300">{app.benefit_name}</h4>
                      {app.estimated_savings && (
                        <p className="text-sm text-green-600 dark:text-green-400">
                          Saving ${app.estimated_savings}/year
                        </p>
                      )}
                    </div>
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  </div>
                  {app.renewal_date && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                      Renewal: {format(new Date(app.renewal_date), 'MMM d, yyyy')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help Section */}
      <Card className="border-0 shadow-sm bg-gradient-to-br from-slate-800 to-slate-900 text-white">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-2">Need Help with Applications?</h3>
          <p className="text-slate-300 text-sm mb-4">
            Our team can help you complete applications, gather documents, and file appeals if needed.
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm">
              <Phone className="w-4 h-4 mr-1" />
              Call for Help
            </Button>
            <Button variant="secondary" size="sm">
              <Mail className="w-4 h-4 mr-1" />
              Email Support
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}