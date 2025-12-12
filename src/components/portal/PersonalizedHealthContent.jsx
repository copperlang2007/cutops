import { useState, useEffect } from 'react'
import { base44 } from '@/api/base44Client'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  Heart, Sparkles, Loader2, BookOpen, Lightbulb, 
  Apple, Activity, Plus, X, RefreshCw, ChevronRight,
  Pill, Brain, Shield, Calendar, Star, CheckCircle,
  Share2, Copy, Mail, Facebook, Twitter, Linkedin,
  MessageSquare, Dumbbell, Phone, Smartphone, Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import ReactMarkdown from 'react-markdown';

const conditionCategories = [
  { id: 'heart', label: 'Heart & Cardiovascular', icon: Heart, examples: ['High Blood Pressure', 'Heart Disease', 'High Cholesterol'] },
  { id: 'diabetes', label: 'Diabetes & Metabolic', icon: Activity, examples: ['Type 2 Diabetes', 'Pre-diabetes', 'Obesity'] },
  { id: 'respiratory', label: 'Respiratory', icon: Activity, examples: ['COPD', 'Asthma', 'Sleep Apnea'] },
  { id: 'bone', label: 'Bone & Joint', icon: Activity, examples: ['Arthritis', 'Osteoporosis', 'Back Pain'] },
  { id: 'mental', label: 'Mental Health', icon: Brain, examples: ['Depression', 'Anxiety', 'Memory Concerns'] },
];

// Simulated benefit usage data - would come from real API in production
const getBenefitUsageData = (clientId) => ({
  gymVisits: { count: 8, lastVisit: '2024-12-01', trend: 'increasing' },
  telehealthCalls: { count: 3, lastCall: '2024-11-28', trend: 'stable' },
  stepsPerDay: { average: 4500, goal: 7000 },
  wellnessVisits: { completed: 1, available: 1, nextDue: null },
  prescriptionRefills: { onTime: 12, late: 2 },
  dentalVisits: { used: 1, total: 2 },
  visionExam: { used: 0, total: 1 },
  otcAllowance: { used: 60, total: 200 },
  fitnessReimbursement: { used: 0, total: 50, period: 'monthly' },
  preventiveScreenings: {
    completed: ['Flu Shot', 'Blood Pressure Check'],
    due: ['Colonoscopy', 'Mammogram', 'Bone Density']
  }
});

export default function PersonalizedHealthContent({ client, portalUser, onConditionsChange }) {
  const [conditions, setConditions] = useState([]);
  const [newCondition, setNewCondition] = useState('');
  const [activeTab, setActiveTab] = useState('articles');
  const [generatedContent, setGeneratedContent] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [socialContent, setSocialContent] = useState(null);
  const [selectedShareContent, setSelectedShareContent] = useState(null);

  const userData = client || portalUser;
  const planType = client?.plan_type || portalUser?.plan_type || 'medicare_advantage';
  const benefitUsage = getBenefitUsageData(userData?.id);

  // Notify parent when conditions change
  useEffect(() => {
    if (onConditionsChange) {
      onConditionsChange(conditions);
    }
  }, [conditions, onConditionsChange]);

  // Get saved drug searches for this user
  const { data: drugSearches = [] } = useQuery({
    queryKey: ['drugSearches', userData?.id],
    queryFn: async () => {
      if (!userData?.id) return [];
      const searches = await base44.entities.DrugSearch.filter(
        client ? { client_id: client.id } : { portal_user_id: portalUser.id },
        '-created_date',
        5
      );
      return searches;
    },
    enabled: !!userData?.id
  });

  // Extract medications from drug searches
  const medications = drugSearches.flatMap(search => 
    search.medications?.map(m => m.drug_name) || []
  ).filter((v, i, a) => a.indexOf(v) === i).slice(0, 10);

  const generateContentMutation = useMutation({
    mutationFn: async () => {
      const prompt = `You are a health education specialist creating personalized content for a Medicare beneficiary.

USER PROFILE:
- Plan Type: ${planType === 'medicare_advantage' ? 'Medicare Advantage' : planType === 'supplement' ? 'Medicare Supplement (Medigap)' : planType === 'pdp' ? 'Prescription Drug Plan' : 'Medicare'}
- Health Conditions: ${conditions.length > 0 ? conditions.join(', ') : 'General wellness'}
- Current Medications: ${medications.length > 0 ? medications.join(', ') : 'None specified'}

BENEFIT USAGE DATA (use this to personalize recommendations):
- Gym Visits This Month: ${benefitUsage.gymVisits.count} visits (trend: ${benefitUsage.gymVisits.trend})
- Telehealth Calls: ${benefitUsage.telehealthCalls.count} this year
- Average Daily Steps: ${benefitUsage.stepsPerDay.average} (goal: ${benefitUsage.stepsPerDay.goal})
- Prescription Refills: ${benefitUsage.prescriptionRefills.onTime} on-time, ${benefitUsage.prescriptionRefills.late} late
- OTC Allowance: $${benefitUsage.otcAllowance.used} of $${benefitUsage.otcAllowance.total} used
- Fitness Reimbursement: $${benefitUsage.fitnessReimbursement.used} of $${benefitUsage.fitnessReimbursement.total} used (${benefitUsage.fitnessReimbursement.period})
- Preventive Screenings Completed: ${benefitUsage.preventiveScreenings.completed.join(', ')}
- Preventive Screenings Due: ${benefitUsage.preventiveScreenings.due.join(', ')}
- Dental Visits: ${benefitUsage.dentalVisits.used} of ${benefitUsage.dentalVisits.total}
- Vision Exam: ${benefitUsage.visionExam.used} of ${benefitUsage.visionExam.total}

Generate HIGHLY PERSONALIZED health content based on their actual usage patterns:

1. FEATURED_ARTICLE: A comprehensive 300-word article. If they have good gym attendance, praise it and build on it. If low activity, gently encourage more movement. Reference their specific conditions.

2. QUICK_TIPS: 5 actionable tips personalized to their conditions AND their usage patterns. Reference specific data (e.g., "You're averaging 4,500 steps - here's how to reach 7,000").

3. WELLNESS_GOALS: 3 goals based on their current behavior. Make them achievable - if gym visits are increasing, set a goal to maintain. Include specific numbers based on their data.

4. MEDICATION_INSIGHTS: 2-3 insights. If they have late refills, address medication adherence. Reference their specific medications.

5. BENEFITS_REMINDER: Based on unused benefits! Calculate what they're leaving on the table (e.g., "$140 in unused OTC allowance", "You haven't used your vision exam"). Be specific about dollar amounts and deadlines.

6. ACTIVITY_INSIGHTS: New section analyzing their gym visits and telehealth usage. Provide trends and encouragement based on actual data.

7. SEASONAL_TIP: One tip relevant to December/winter and their health conditions.

8. PREVENTIVE_CARE_NUDGE: Based on their due screenings, remind them what's needed and why.

Format as JSON:
{
  "featuredArticle": {
    "title": "...",
    "category": "...",
    "readTime": "X min",
    "content": "Full markdown article..."
  },
  "quickTips": [
    {"tip": "...", "icon": "heart|pill|apple|activity|brain|dumbbell", "basedOn": "What data point this tip is based on"}
  ],
  "wellnessGoals": [
    {"goal": "...", "frequency": "daily|weekly", "benefit": "...", "currentProgress": "...", "targetMetric": "..."}
  ],
  "medicationInsights": [
    {"title": "...", "content": "...", "priority": "high|medium|low"}
  ],
  "benefitsReminder": {
    "title": "...",
    "unusedBenefits": [
      {"benefit": "...", "amountUnused": "...", "deadline": "...", "actionItem": "..."}
    ],
    "totalSavingsAvailable": "...",
    "callToAction": "..."
  },
  "activityInsights": {
    "summary": "...",
    "gymTrend": "...",
    "telehealthUsage": "...",
    "recommendation": "..."
  },
  "seasonalTip": {
    "title": "...",
    "content": "..."
  },
  "preventiveCareNudge": {
    "title": "...",
    "dueScreenings": [{"name": "...", "importance": "...", "howToSchedule": "..."}],
    "urgency": "high|medium|low"
  }
}`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            featuredArticle: { type: "object" },
            quickTips: { type: "array" },
            wellnessGoals: { type: "array" },
            medicationInsights: { type: "array" },
            benefitsReminder: { type: "object" },
            activityInsights: { type: "object" },
            seasonalTip: { type: "object" },
            preventiveCareNudge: { type: "object" }
          }
        }
      });

      return response;
    },
    onSuccess: (data) => {
      setGeneratedContent(data);
      toast.success('Personalized content generated!');
    },
    onError: (error) => {
      toast.error('Failed to generate content');
      console.error(error);
    }
  });

  const generateSocialContentMutation = useMutation({
    mutationFn: async (contentToShare) => {
      const prompt = `Based on this health article/tip, create engaging shareable content:

ORIGINAL CONTENT:
${JSON.stringify(contentToShare, null, 2)}

Generate social media posts and newsletter snippets that are:
- Engaging and positive
- Encourage healthy behaviors
- Include relevant emojis
- Compliant with health information guidelines (no medical advice)

Format as JSON:
{
  "twitter": {
    "post": "280 character max tweet with hashtags",
    "hashtags": ["#HealthyAging", "#MedicareMonday", etc]
  },
  "facebook": {
    "post": "Longer Facebook post (2-3 sentences) with engaging question at end"
  },
  "linkedin": {
    "post": "Professional tone LinkedIn post about wellness/healthcare"
  },
  "emailNewsletter": {
    "subject": "Engaging email subject line",
    "preheader": "Preview text (50-100 chars)",
    "snippet": "2-3 paragraph newsletter snippet with clear formatting"
  },
  "textMessage": {
    "message": "Short SMS-friendly health tip (160 chars max)"
  }
}`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            twitter: { type: "object" },
            facebook: { type: "object" },
            linkedin: { type: "object" },
            emailNewsletter: { type: "object" },
            textMessage: { type: "object" }
          }
        }
      });

      return response;
    },
    onSuccess: (data) => {
      setSocialContent(data);
      toast.success('Shareable content generated!');
    },
    onError: (error) => {
      toast.error('Failed to generate shareable content');
      console.error(error);
    }
  });

  const openShareModal = (content) => {
    setSelectedShareContent(content);
    setShowShareModal(true);
    generateSocialContentMutation.mutate(content);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const addCondition = () => {
    if (newCondition.trim() && !conditions.includes(newCondition.trim())) {
      setConditions([...conditions, newCondition.trim()]);
      setNewCondition('');
    }
  };

  const removeCondition = (condition) => {
    setConditions(conditions.filter(c => c !== condition));
  };

  const addFromExample = (condition) => {
    if (!conditions.includes(condition)) {
      setConditions([...conditions, condition]);
    }
  };

  const tipIcons = {
    heart: Heart,
    pill: Pill,
    apple: Apple,
    activity: Activity,
    brain: Brain,
    dumbbell: Dumbbell
  };

  return (
    <div className="space-y-6">
      {/* Health Profile Setup */}
      <Card className="border-0 shadow-sm dark:bg-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500" />
            Your Health Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Benefit Usage Summary */}
          <div className="p-4 rounded-lg bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-900/20 dark:to-emerald-900/20 border border-teal-200 dark:border-teal-800">
            <p className="text-sm font-medium text-teal-700 dark:text-teal-300 mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Your Activity Summary (Used for Personalization)
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="text-center p-2 rounded-lg bg-white/60 dark:bg-slate-800/60">
                <Dumbbell className="w-5 h-5 mx-auto text-teal-600 mb-1" />
                <p className="text-lg font-bold text-slate-800 dark:text-white">{benefitUsage.gymVisits.count}</p>
                <p className="text-xs text-slate-500">Gym Visits</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-white/60 dark:bg-slate-800/60">
                <Phone className="w-5 h-5 mx-auto text-blue-600 mb-1" />
                <p className="text-lg font-bold text-slate-800 dark:text-white">{benefitUsage.telehealthCalls.count}</p>
                <p className="text-xs text-slate-500">Telehealth</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-white/60 dark:bg-slate-800/60">
                <Target className="w-5 h-5 mx-auto text-amber-600 mb-1" />
                <p className="text-lg font-bold text-slate-800 dark:text-white">{benefitUsage.stepsPerDay.average.toLocaleString()}</p>
                <p className="text-xs text-slate-500">Avg Steps</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-white/60 dark:bg-slate-800/60">
                <Pill className="w-5 h-5 mx-auto text-purple-600 mb-1" />
                <p className="text-lg font-bold text-slate-800 dark:text-white">{benefitUsage.prescriptionRefills.onTime}</p>
                <p className="text-xs text-slate-500">Rx On-Time</p>
              </div>
            </div>
          </div>

          <div>
            <Label className="mb-2 block">Health Conditions</Label>
            <div className="flex gap-2 mb-3">
              <Input
                value={newCondition}
                onChange={(e) => setNewCondition(e.target.value)}
                placeholder="Enter a health condition..."
                onKeyPress={(e) => e.key === 'Enter' && addCondition()}
              />
              <Button onClick={addCondition} size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            
            {conditions.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {conditions.map((condition) => (
                  <Badge key={condition} className="bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 pr-1">
                    {condition}
                    <button onClick={() => removeCondition(condition)} className="ml-2 hover:text-red-900">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            <div className="space-y-3">
              <p className="text-xs text-slate-500">Quick add common conditions:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {conditionCategories.map((cat) => (
                  <div key={cat.id} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">{cat.label}</p>
                    <div className="flex flex-wrap gap-1">
                      {cat.examples.map((ex) => (
                        <button
                          key={ex}
                          onClick={() => addFromExample(ex)}
                          disabled={conditions.includes(ex)}
                          className={`text-xs px-2 py-1 rounded-full transition-colors ${
                            conditions.includes(ex)
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/40'
                              : 'bg-white dark:bg-slate-800 border dark:border-slate-700 hover:border-red-300 hover:text-red-600'
                          }`}
                        >
                          {conditions.includes(ex) && <CheckCircle className="w-3 h-3 inline mr-1" />}
                          {ex}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {medications.length > 0 && (
            <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
              <p className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-2 flex items-center gap-2">
                <Pill className="w-4 h-4" />
                Your Medications (from Drug Lookup)
              </p>
              <div className="flex flex-wrap gap-2">
                {medications.map((med) => (
                  <Badge key={med} variant="outline" className="border-purple-300 text-purple-700 dark:text-purple-300">
                    {med}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Button
            onClick={() => generateContentMutation.mutate()}
            disabled={generateContentMutation.isPending}
            className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600"
          >
            {generateContentMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating Your Personalized Content...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Personalized Health Content
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Content */}
      {generatedContent && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-white dark:bg-slate-800 shadow-sm p-1 rounded-xl flex-wrap h-auto">
              <TabsTrigger value="articles" className="rounded-lg gap-2">
                <BookOpen className="w-4 h-4" />
                Articles
              </TabsTrigger>
              <TabsTrigger value="tips" className="rounded-lg gap-2">
                <Lightbulb className="w-4 h-4" />
                Tips
              </TabsTrigger>
              <TabsTrigger value="goals" className="rounded-lg gap-2">
                <Star className="w-4 h-4" />
                Goals
              </TabsTrigger>
              <TabsTrigger value="benefits" className="rounded-lg gap-2">
                <Shield className="w-4 h-4" />
                Benefits
              </TabsTrigger>
              <TabsTrigger value="activity" className="rounded-lg gap-2">
                <Activity className="w-4 h-4" />
                Activity
              </TabsTrigger>
              <TabsTrigger value="share" className="rounded-lg gap-2">
                <Share2 className="w-4 h-4" />
                Share
              </TabsTrigger>
            </TabsList>

            <TabsContent value="articles" className="mt-6 space-y-6">
              {/* Featured Article */}
              {generatedContent.featuredArticle && (
                <Card className="border-0 shadow-sm dark:bg-slate-800 overflow-hidden">
                  <div className="bg-gradient-to-r from-red-500 to-pink-500 p-4 text-white">
                    <div className="flex items-start justify-between">
                      <div>
                        <Badge className="bg-white/20 text-white mb-2">{generatedContent.featuredArticle.category}</Badge>
                        <h2 className="text-xl font-bold">{generatedContent.featuredArticle.title}</h2>
                        <p className="text-red-100 text-sm mt-1">{generatedContent.featuredArticle.readTime} read</p>
                      </div>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-white hover:bg-white/20"
                        onClick={() => openShareModal(generatedContent.featuredArticle)}
                      >
                        <Share2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown>{generatedContent.featuredArticle.content}</ReactMarkdown>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Seasonal Tip */}
              {generatedContent.seasonalTip && (
                <Card className="border-0 shadow-sm dark:bg-slate-800 border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 text-blue-500 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-slate-800 dark:text-white">{generatedContent.seasonalTip.title}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{generatedContent.seasonalTip.content}</p>
                      </div>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => openShareModal(generatedContent.seasonalTip)}
                      >
                        <Share2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Preventive Care Nudge */}
              {generatedContent.preventiveCareNudge && (
                <Card className={`border-0 shadow-sm dark:bg-slate-800 ${
                  generatedContent.preventiveCareNudge.urgency === 'high' 
                    ? 'border-l-4 border-l-red-500' 
                    : 'border-l-4 border-l-amber-500'
                }`}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Shield className={`w-5 h-5 ${
                        generatedContent.preventiveCareNudge.urgency === 'high' ? 'text-red-500' : 'text-amber-500'
                      }`} />
                      {generatedContent.preventiveCareNudge.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {generatedContent.preventiveCareNudge.dueScreenings?.map((screening, idx) => (
                        <div key={idx} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                          <p className="font-medium text-slate-800 dark:text-white">{screening.name}</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{screening.importance}</p>
                          <p className="text-xs text-teal-600 dark:text-teal-400 mt-1">{screening.howToSchedule}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Medication Insights */}
              {generatedContent.medicationInsights?.length > 0 && (
                <Card className="border-0 shadow-sm dark:bg-slate-800">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Pill className="w-5 h-5 text-purple-500" />
                      Medication Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {generatedContent.medicationInsights.map((insight, idx) => (
                        <div key={idx} className={`p-4 rounded-lg ${
                          insight.priority === 'high' 
                            ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                            : 'bg-purple-50 dark:bg-purple-900/20'
                        }`}>
                          <div className="flex items-start justify-between">
                            <div>
                              <p className={`font-medium ${
                                insight.priority === 'high' ? 'text-red-700 dark:text-red-300' : 'text-purple-700 dark:text-purple-300'
                              }`}>
                                {insight.title}
                              </p>
                              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{insight.content}</p>
                            </div>
                            {insight.priority === 'high' && (
                              <Badge className="bg-red-100 text-red-700 text-xs">Important</Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="tips" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AnimatePresence>
                  {generatedContent.quickTips?.map((tip, idx) => {
                    const TipIcon = tipIcons[tip.icon] || Lightbulb;
                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.1 }}
                      >
                        <Card className="border-0 shadow-sm dark:bg-slate-800 h-full">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-4">
                              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40 flex items-center justify-center shrink-0">
                                <TipIcon className="w-5 h-5 text-amber-600" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                  <Badge variant="outline">Tip #{idx + 1}</Badge>
                                  <Button 
                                    size="sm" 
                                    variant="ghost"
                                    onClick={() => openShareModal(tip)}
                                  >
                                    <Share2 className="w-3 h-3" />
                                  </Button>
                                </div>
                                <p className="text-sm text-slate-700 dark:text-slate-300">{tip.tip}</p>
                                {tip.basedOn && (
                                  <p className="text-xs text-slate-400 mt-2 italic">Based on: {tip.basedOn}</p>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </TabsContent>

            <TabsContent value="goals" className="mt-6">
              <Card className="border-0 shadow-sm dark:bg-slate-800">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Star className="w-5 h-5 text-amber-500" />
                    Your Personalized Wellness Goals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {generatedContent.wellnessGoals?.map((goal, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="p-4 rounded-xl border dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-600 transition-colors"
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-900/40 dark:to-yellow-900/40 flex items-center justify-center text-xl font-bold text-amber-600">
                            {idx + 1}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <p className="font-medium text-slate-800 dark:text-white">{goal.goal}</p>
                              <Badge variant="outline" className="text-xs capitalize">{goal.frequency}</Badge>
                            </div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{goal.benefit}</p>
                            {goal.currentProgress && (
                              <div className="mt-2 p-2 rounded bg-slate-50 dark:bg-slate-900/50">
                                <p className="text-xs text-slate-600 dark:text-slate-400">
                                  <span className="font-medium">Current:</span> {goal.currentProgress}
                                </p>
                                {goal.targetMetric && (
                                  <p className="text-xs text-teal-600 dark:text-teal-400">
                                    <span className="font-medium">Target:</span> {goal.targetMetric}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                          <Button size="sm" variant="outline" className="shrink-0">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Track
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="benefits" className="mt-6 space-y-6">
              {generatedContent.benefitsReminder && (
                <Card className="border-0 shadow-sm dark:bg-slate-800 overflow-hidden">
                  <div className="bg-gradient-to-r from-teal-500 to-emerald-500 p-6 text-white">
                    <Shield className="w-8 h-8 mb-3" />
                    <h3 className="text-xl font-bold">{generatedContent.benefitsReminder.title}</h3>
                    {generatedContent.benefitsReminder.totalSavingsAvailable && (
                      <p className="text-2xl font-bold mt-2">{generatedContent.benefitsReminder.totalSavingsAvailable}</p>
                    )}
                    <p className="text-teal-100 text-sm mt-1">in unused benefits available to you</p>
                  </div>
                  <CardContent className="p-6">
                    <div className="space-y-4 mb-6">
                      {generatedContent.benefitsReminder.unusedBenefits?.map((benefit, idx) => (
                        <div key={idx} className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                          <div className="flex items-start justify-between mb-2">
                            <p className="font-medium text-amber-800 dark:text-amber-300">{benefit.benefit}</p>
                            <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-800 dark:text-amber-200">
                              {benefit.amountUnused}
                            </Badge>
                          </div>
                          {benefit.deadline && (
                            <p className="text-xs text-amber-600 dark:text-amber-400">Deadline: {benefit.deadline}</p>
                          )}
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">{benefit.actionItem}</p>
                        </div>
                      ))}
                    </div>
                    <div className="p-4 rounded-lg bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800">
                      <p className="text-sm text-teal-700 dark:text-teal-300 flex items-center gap-2">
                        <ChevronRight className="w-4 h-4" />
                        {generatedContent.benefitsReminder.callToAction}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="activity" className="mt-6">
              {generatedContent.activityInsights && (
                <Card className="border-0 shadow-sm dark:bg-slate-800">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Activity className="w-5 h-5 text-teal-600" />
                      Your Activity Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 rounded-lg bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-900/20 dark:to-emerald-900/20">
                      <p className="text-slate-700 dark:text-slate-300">{generatedContent.activityInsights.summary}</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                        <div className="flex items-center gap-2 mb-2">
                          <Dumbbell className="w-5 h-5 text-orange-500" />
                          <p className="font-medium text-slate-800 dark:text-white">Gym Activity</p>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{generatedContent.activityInsights.gymTrend}</p>
                      </div>
                      <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                        <div className="flex items-center gap-2 mb-2">
                          <Phone className="w-5 h-5 text-blue-500" />
                          <p className="font-medium text-slate-800 dark:text-white">Telehealth Usage</p>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{generatedContent.activityInsights.telehealthUsage}</p>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                      <p className="font-medium text-blue-700 dark:text-blue-300 mb-1">Recommendation</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{generatedContent.activityInsights.recommendation}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="share" className="mt-6">
              <Card className="border-0 shadow-sm dark:bg-slate-800">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Share2 className="w-5 h-5 text-indigo-600" />
                    Generate Shareable Content
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 dark:text-slate-400 mb-4">
                    Create social media posts and newsletter snippets from your health content to share with friends, family, or your community.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {generatedContent.featuredArticle && (
                      <Button 
                        variant="outline" 
                        className="justify-start gap-2"
                        onClick={() => openShareModal(generatedContent.featuredArticle)}
                      >
                        <BookOpen className="w-4 h-4" />
                        Share Article
                      </Button>
                    )}
                    {generatedContent.quickTips?.[0] && (
                      <Button 
                        variant="outline" 
                        className="justify-start gap-2"
                        onClick={() => openShareModal({ type: 'tips', tips: generatedContent.quickTips })}
                      >
                        <Lightbulb className="w-4 h-4" />
                        Share Tips
                      </Button>
                    )}
                    {generatedContent.seasonalTip && (
                      <Button 
                        variant="outline" 
                        className="justify-start gap-2"
                        onClick={() => openShareModal(generatedContent.seasonalTip)}
                      >
                        <Calendar className="w-4 h-4" />
                        Share Seasonal Tip
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Refresh Button */}
          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={() => generateContentMutation.mutate()}
              disabled={generateContentMutation.isPending}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${generateContentMutation.isPending ? 'animate-spin' : ''}`} />
              Refresh Content
            </Button>
          </div>
        </motion.div>
      )}

      {/* Share Modal */}
      <Dialog open={showShareModal} onOpenChange={setShowShareModal}>
        <DialogContent className="max-w-2xl dark:bg-slate-800 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5 text-indigo-600" />
              Share Health Content
            </DialogTitle>
          </DialogHeader>
          
          {generateSocialContentMutation.isPending ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              <span className="ml-3 text-slate-600 dark:text-slate-400">Generating shareable content...</span>
            </div>
          ) : socialContent ? (
            <div className="space-y-4">
              {/* Twitter */}
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Twitter className="w-5 h-5 text-blue-400" />
                    <span className="font-medium text-slate-800 dark:text-white">Twitter/X</span>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => copyToClipboard(socialContent.twitter?.post)}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">{socialContent.twitter?.post}</p>
                <div className="flex gap-1 mt-2 flex-wrap">
                  {socialContent.twitter?.hashtags?.map((tag, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">{tag}</Badge>
                  ))}
                </div>
              </div>

              {/* Facebook */}
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Facebook className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-slate-800 dark:text-white">Facebook</span>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => copyToClipboard(socialContent.facebook?.post)}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">{socialContent.facebook?.post}</p>
              </div>

              {/* LinkedIn */}
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Linkedin className="w-5 h-5 text-blue-700" />
                    <span className="font-medium text-slate-800 dark:text-white">LinkedIn</span>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => copyToClipboard(socialContent.linkedin?.post)}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">{socialContent.linkedin?.post}</p>
              </div>

              {/* Email Newsletter */}
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Mail className="w-5 h-5 text-red-500" />
                    <span className="font-medium text-slate-800 dark:text-white">Email Newsletter</span>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => copyToClipboard(
                    `Subject: ${socialContent.emailNewsletter?.subject}\n\n${socialContent.emailNewsletter?.snippet}`
                  )}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-slate-400 mb-1">Subject: {socialContent.emailNewsletter?.subject}</p>
                <p className="text-xs text-slate-400 mb-2">Preview: {socialContent.emailNewsletter?.preheader}</p>
                <div className="p-3 bg-white dark:bg-slate-800 rounded border dark:border-slate-700">
                  <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                    {socialContent.emailNewsletter?.snippet}
                  </p>
                </div>
              </div>

              {/* Text Message */}
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-green-500" />
                    <span className="font-medium text-slate-800 dark:text-white">Text Message</span>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => copyToClipboard(socialContent.textMessage?.message)}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">{socialContent.textMessage?.message}</p>
                <p className="text-xs text-slate-400 mt-1">
                  {socialContent.textMessage?.message?.length || 0}/160 characters
                </p>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}