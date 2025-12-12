import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  Play, Pause, SkipForward, RotateCcw, CheckCircle, 
  ChevronRight, ChevronLeft, Sparkles, Target, Zap,
  Users, Shield, DollarSign, Trophy, FileText, MessageSquare,
  Settings, Eye, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';

const generateDemoData = async (scope = 'full') => {
  try {
    const { base44 } = await import('@/api/base44Client');
    const response = await base44.functions.invoke('demoDataGenerator', { action: 'generate', scope });
    return response.data;
  } catch (err) {
    console.error('Failed to generate demo data:', err);
    throw err;
  }
};

const DEMO_FEATURES = {
  full_tour: {
    name: 'Full Platform Tour',
    description: 'Complete end-to-end demonstration of all features',
    duration: '10 min',
    icon: Play,
    steps: [
      { page: 'Dashboard', highlight: 'stats', title: 'Dashboard Overview', description: 'View real-time metrics and agent status at a glance' },
      { page: 'Dashboard', highlight: 'alerts', title: 'Alert System', description: 'AI monitors compliance and flags issues automatically' },
      { page: 'Agents', highlight: 'list', title: 'Agent Management', description: 'View and manage all agents in your organization' },
      { page: 'AgentDetail', highlight: 'onboarding', title: 'Onboarding Workflow', description: 'Track progress through the onboarding checklist' },
      { page: 'AgentDetail', highlight: 'documents', title: 'Document Management', description: 'AI-powered document processing and verification' },
      { page: 'AgentDetail', highlight: 'gamification', title: 'Gamification', description: 'Points, badges, and leaderboards to motivate agents' },
      { page: 'ClientManagement', highlight: 'clients', title: 'Client Management', description: 'Track client relationships and interactions' },
      { page: 'ClientManagement', highlight: 'email', title: 'AI Email Generation', description: 'Draft personalized emails with AI assistance' },
      { page: 'Commissions', highlight: 'overview', title: 'Commission Tracking', description: 'Monitor earnings and payouts across carriers' },
      { page: 'Reports', highlight: 'ai-tools', title: 'AI Analytics', description: 'Predictive insights and automated reporting' },
      { page: 'Leaderboard', highlight: 'rankings', title: 'Team Leaderboard', description: 'Compare performance across key metrics' }
    ]
  },
  agent_onboarding: {
    name: 'Agent Onboarding',
    description: 'Learn how to onboard a new agent',
    duration: '4 min',
    icon: Users,
    steps: [
      { page: 'AddAgent', highlight: 'form', title: 'Add New Agent', description: 'Enter agent details and NPN to begin' },
      { page: 'AgentDetail', highlight: 'onboarding', title: 'Onboarding Checklist', description: 'Track required steps for compliance' },
      { page: 'AgentDetail', highlight: 'documents', title: 'Document Upload', description: 'AI extracts and validates document data' },
      { page: 'AgentDetail', highlight: 'licenses', title: 'License Verification', description: 'NIPR sync verifies licensing status' },
      { page: 'AgentDetail', highlight: 'contracts', title: 'Carrier Contracts', description: 'Manage appointments and contracts' }
    ]
  },
  ai_features: {
    name: 'AI Capabilities',
    description: 'Explore all AI-powered features',
    duration: '5 min',
    icon: Sparkles,
    steps: [
      { page: 'AgentDetail', highlight: 'ai-insights', title: 'AI Performance Insights', description: 'Get personalized coaching recommendations' },
      { page: 'ClientManagement', highlight: 'email', title: 'AI Email Generator', description: 'Draft follow-ups, renewals, and outreach emails' },
      { page: 'Reports', highlight: 'predictive', title: 'Predictive Analytics', description: 'Forecast trends and identify opportunities' },
      { page: 'Reports', highlight: 'ai-tools', title: 'Anomaly Detection', description: 'Automatically flag unusual patterns' },
      { page: 'Compliance', highlight: 'monitoring', title: 'Compliance Monitoring', description: 'AI reviews data for compliance issues' }
    ]
  },
  client_management: {
    name: 'Client Management',
    description: 'Master client relationship tracking',
    duration: '3 min',
    icon: Users,
    steps: [
      { page: 'ClientManagement', highlight: 'clients', title: 'Client List', description: 'View and filter all clients' },
      { page: 'ClientManagement', highlight: 'detail', title: 'Client Details', description: 'Track policy info and communication history' },
      { page: 'ClientManagement', highlight: 'interaction', title: 'Log Interactions', description: 'Record calls, emails, and meetings' },
      { page: 'ClientManagement', highlight: 'email', title: 'AI Outreach', description: 'Generate personalized client communications' }
    ]
  },
  compliance: {
    name: 'Compliance Center',
    description: 'Ensure regulatory compliance',
    duration: '3 min',
    icon: Shield,
    steps: [
      { page: 'Compliance', highlight: 'overview', title: 'Compliance Dashboard', description: 'Overview of compliance status across agents' },
      { page: 'Compliance', highlight: 'licenses', title: 'License Tracking', description: 'Monitor expirations and renewals' },
      { page: 'Compliance', highlight: 'alerts', title: 'Compliance Alerts', description: 'AI-generated alerts for potential issues' },
      { page: 'Compliance', highlight: 'audit', title: 'Audit Trail', description: 'Complete history of all actions' }
    ]
  },
  gamification: {
    name: 'Gamification & Rewards',
    description: 'Motivate agents with game mechanics',
    duration: '2 min',
    icon: Trophy,
    steps: [
      { page: 'Leaderboard', highlight: 'rankings', title: 'Leaderboards', description: 'Compare across multiple metrics' },
      { page: 'AgentDetail', highlight: 'gamification', title: 'Points & Levels', description: 'Earn points for completing tasks' },
      { page: 'AgentDetail', highlight: 'badges', title: 'Achievements', description: 'Unlock badges for milestones' },
      { page: 'ClientManagement', highlight: 'gamification', title: 'Rewards Dashboard', description: 'Track progress towards goals' }
    ]
  }
};

export default function InteractiveDemoSystem({ isOpen, onClose, initialFeature }) {
  const [selectedFeature, setSelectedFeature] = useState(initialFeature || null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [demoMode, setDemoMode] = useState('select'); // 'select' | 'running'

  useEffect(() => {
    if (initialFeature && DEMO_FEATURES[initialFeature]) {
      setSelectedFeature(initialFeature);
      setDemoMode('running');
    }
  }, [initialFeature]);

  useEffect(() => {
    let timer;
    if (isPlaying && selectedFeature) {
      const steps = DEMO_FEATURES[selectedFeature].steps;
      timer = setInterval(() => {
        setCurrentStep(prev => {
          if (prev >= steps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 5000);
    }
    return () => clearInterval(timer);
  }, [isPlaying, selectedFeature]);

  const startDemo = (featureKey) => {
    setSelectedFeature(featureKey);
    setCurrentStep(0);
    setDemoMode('running');
    setIsPlaying(true);
  };

  const navigateToStep = (step) => {
    const page = step.page;
    // In a real implementation, this would navigate and highlight elements
    toast.info(`Navigate to ${page} → ${step.highlight}`);
  };

  const handleStepClick = (idx) => {
    setCurrentStep(idx);
    setIsPlaying(false);
    navigateToStep(DEMO_FEATURES[selectedFeature].steps[idx]);
  };

  const resetDemo = () => {
    setSelectedFeature(null);
    setCurrentStep(0);
    setDemoMode('select');
    setIsPlaying(false);
  };

  const currentFeature = selectedFeature ? DEMO_FEATURES[selectedFeature] : null;
  const currentStepData = currentFeature?.steps[currentStep];
  const progress = currentFeature ? ((currentStep + 1) / currentFeature.steps.length) * 100 : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">
        <div className="flex h-full">
          {/* Sidebar - Feature Selection */}
          <div className={`w-72 bg-slate-50 border-r p-4 overflow-y-auto ${demoMode === 'running' ? 'hidden lg:block' : ''}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800">Interactive Demo</h3>
              <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                <Sparkles className="w-3 h-3 mr-1" />
                Guided
              </Badge>
            </div>

            <div className="space-y-2">
              {Object.entries(DEMO_FEATURES).map(([key, feature]) => {
                const Icon = feature.icon;
                const isSelected = selectedFeature === key;
                return (
                  <motion.div
                    key={key}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <button
                      onClick={() => startDemo(key)}
                      className={`w-full p-3 rounded-lg text-left transition-all ${
                        isSelected 
                          ? 'bg-purple-100 border-2 border-purple-300' 
                          : 'bg-white border border-slate-200 hover:border-purple-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          isSelected ? 'bg-purple-500 text-white' : 'bg-slate-100 text-slate-600'
                        }`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">{feature.name}</p>
                          <p className="text-xs text-slate-500">{feature.duration}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </div>
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Main Content - Demo Player */}
          <div className="flex-1 flex flex-col">
            <DialogHeader className="p-4 border-b">
              <div className="flex items-center justify-between">
                <DialogTitle className="flex items-center gap-2">
                  {currentFeature ? (
                    <>
                      <currentFeature.icon className="w-5 h-5 text-purple-600" />
                      {currentFeature.name}
                    </>
                  ) : (
                    'Select a Demo'
                  )}
                </DialogTitle>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </DialogHeader>

            {demoMode === 'select' && !selectedFeature && (
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
                    <Play className="w-10 h-10 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-800 mb-2">Welcome to the Interactive Demo</h3>
                  <p className="text-slate-500 mb-6 max-w-md">
                    Select a feature from the sidebar to start a guided tour, or choose the full platform tour for a complete overview.
                  </p>
                  <div className="flex gap-3">
                    <Button onClick={() => startDemo('full_tour')} className="bg-purple-600 hover:bg-purple-700">
                      <Play className="w-4 h-4 mr-2" />
                      Start Full Tour
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={async () => {
                        toast.info('Generating demo data...');
                        try {
                          await generateDemoData('full');
                          toast.success('Demo data generated! Refresh to see.');
                        } catch (e) {
                          toast.error('Failed to generate demo data');
                        }
                      }}
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      Generate Demo Data
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {demoMode === 'running' && currentFeature && (
              <>
                {/* Progress Bar */}
                <div className="px-4 py-2 bg-slate-50 border-b">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span>Step {currentStep + 1} of {currentFeature.steps.length}</span>
                    <span>{Math.round(progress)}% complete</span>
                  </div>
                  <Progress value={progress} className="h-1.5 [&>div]:bg-purple-500" />
                </div>

                {/* Current Step Content */}
                <div className="flex-1 p-6 overflow-y-auto">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentStep}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="h-full"
                    >
                      <div className="max-w-2xl mx-auto">
                        <div className="flex items-center gap-2 mb-4">
                          <Badge variant="outline">{currentStepData?.page}</Badge>
                          <Badge variant="outline" className="bg-purple-50 text-purple-700">
                            {currentStepData?.highlight}
                          </Badge>
                        </div>

                        <h2 className="text-2xl font-bold text-slate-800 mb-3">
                          {currentStepData?.title}
                        </h2>
                        <p className="text-lg text-slate-600 mb-6">
                          {currentStepData?.description}
                        </p>

                        {/* Visual Preview Placeholder */}
                        <div className="aspect-video bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center border-2 border-dashed border-slate-300">
                          <div className="text-center">
                            <Eye className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                            <p className="text-slate-500">Interactive preview of {currentStepData?.page}</p>
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-3"
                              onClick={() => {
                                window.location.href = createPageUrl(currentStepData?.page);
                                onClose();
                              }}
                            >
                              <Target className="w-3 h-3 mr-1" />
                              Go to Page
                            </Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Step Navigation Dots */}
                <div className="px-4 py-3 border-t bg-slate-50">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    {currentFeature.steps.map((step, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleStepClick(idx)}
                        className={`w-2.5 h-2.5 rounded-full transition-all ${
                          idx === currentStep 
                            ? 'bg-purple-600 w-6' 
                            : idx < currentStep 
                              ? 'bg-purple-300' 
                              : 'bg-slate-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Controls */}
                <div className="px-4 py-3 border-t flex items-center justify-between">
                  <Button variant="ghost" size="sm" onClick={resetDemo}>
                    <RotateCcw className="w-4 h-4 mr-1" />
                    Reset
                  </Button>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                      disabled={currentStep === 0}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => setIsPlaying(!isPlaying)}
                      className={isPlaying ? 'bg-amber-500 hover:bg-amber-600' : 'bg-purple-600 hover:bg-purple-700'}
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentStep(Math.min(currentFeature.steps.length - 1, currentStep + 1))}
                      disabled={currentStep === currentFeature.steps.length - 1}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      window.location.href = createPageUrl(currentStepData?.page);
                      onClose();
                    }}
                  >
                    <Target className="w-4 h-4 mr-1" />
                    Try It
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}