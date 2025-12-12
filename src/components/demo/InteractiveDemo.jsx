import { useState, useEffect } from 'react'
import { createPageUrl } from '@/utils'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  Play, Pause, SkipForward, RotateCcw, Monitor, Sparkles,
  CheckCircle, ChevronRight, X, Volume2, VolumeX, Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion'

const DEMO_TOURS = {
  full: {
    name: 'Full Platform Tour',
    description: 'Complete walkthrough of all features',
    duration: '15 min',
    steps: [
      { page: 'Dashboard', element: null, title: 'Welcome to AgentHub', content: 'This is your command center for managing Medicare agents. Let\'s explore the key features.', position: 'center' },
      { page: 'Dashboard', element: '[data-demo="stats"]', title: 'Performance Metrics', content: 'Track key metrics like total agents, ready-to-sell status, active licenses, and alerts at a glance.', position: 'bottom' },
      { page: 'Dashboard', element: '[data-demo="alerts"]', title: 'Active Alerts', content: 'Critical compliance issues and important notifications appear here for immediate attention.', position: 'right' },
      { page: 'Agents', element: null, title: 'Agent Management', content: 'View and manage all your agents. Filter by status, state, or carrier.', position: 'center' },
      { page: 'ClientManagement', element: null, title: 'Client Management', content: 'Track clients, log interactions, and manage your book of business.', position: 'center' },
      { page: 'ClientManagement', element: '[data-demo="gamification"]', title: 'Gamification & Rewards', content: 'Earn points, unlock achievements, and compete on leaderboards!', position: 'left' },
      { page: 'Reports', element: null, title: 'Reports & Analytics', content: 'Powerful AI-driven analytics, predictive insights, and customizable reports.', position: 'center' },
      { page: 'Leaderboard', element: null, title: 'Team Leaderboard', content: 'See how agents rank across different metrics and get AI coaching recommendations.', position: 'center' }
    ]
  },
  compliance: {
    name: 'Compliance Features',
    description: 'License tracking, alerts, and compliance monitoring',
    duration: '5 min',
    steps: [
      { page: 'Dashboard', element: '[data-demo="alerts"]', title: 'Compliance Alerts', content: 'Monitor license expirations, E&O status, and AHIP certifications.', position: 'right' },
      { page: 'Compliance', element: null, title: 'Compliance Center', content: 'Centralized view of all compliance-related items and AI-powered monitoring.', position: 'center' },
      { page: 'AgentDetail', element: '[data-demo="licenses"]', title: 'License Management', content: 'Track state licenses, verify with NIPR, and monitor expirations.', position: 'bottom' }
    ]
  },
  clients: {
    name: 'Client Management',
    description: 'Manage clients, interactions, and AI outreach',
    duration: '5 min',
    steps: [
      { page: 'ClientManagement', element: null, title: 'Your Clients', content: 'View all your clients, filter by status, and access detailed information.', position: 'center' },
      { page: 'ClientManagement', element: '[data-demo="client-detail"]', title: 'Client Details', content: 'See complete client profiles including policy details and interaction history.', position: 'right' },
      { page: 'ClientManagement', element: '[data-demo="ai-email"]', title: 'AI Email Generator', content: 'Generate personalized emails for follow-ups, renewals, and outreach.', position: 'left' }
    ]
  },
  gamification: {
    name: 'Gamification & Rewards',
    description: 'Points, achievements, and leaderboards',
    duration: '3 min',
    steps: [
      { page: 'Leaderboard', element: null, title: 'Team Leaderboard', content: 'Compete with your team across multiple performance categories.', position: 'center' },
      { page: 'ClientManagement', element: '[data-demo="points"]', title: 'Points System', content: 'Earn points for completing tasks, logging interactions, and closing deals.', position: 'right' },
      { page: 'ClientManagement', element: '[data-demo="achievements"]', title: 'Achievements', content: 'Unlock badges and achievements as you hit milestones.', position: 'left' }
    ]
  },
  ai: {
    name: 'AI Features',
    description: 'AI-powered analytics, coaching, and automation',
    duration: '7 min',
    steps: [
      { page: 'Reports', element: '[data-demo="ai-predictive"]', title: 'Predictive Analytics', content: 'AI forecasts sales trends, identifies risks, and suggests actions.', position: 'center' },
      { page: 'ClientManagement', element: '[data-demo="ai-email"]', title: 'AI Email Generation', content: 'Draft personalized emails based on client data and interactions.', position: 'left' },
      { page: 'Leaderboard', element: '[data-demo="ai-coaching"]', title: 'AI Coaching', content: 'Get personalized coaching tips and practice scenarios.', position: 'right' }
    ]
  }
};

export default function InteractiveDemo({ isOpen, onClose }) {
  const [selectedTour, setSelectedTour] = useState('full');
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTourSelector, setShowTourSelector] = useState(true);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [narrationEnabled, setNarrationEnabled] = useState(false);

  const currentTour = DEMO_TOURS[selectedTour];
  const step = currentTour?.steps[currentStep];
  const progress = ((currentStep + 1) / currentTour?.steps.length) * 100;

  // Auto-advance timer
  useEffect(() => {
    if (isPlaying && autoAdvance && step) {
      const timer = setTimeout(() => {
        if (currentStep < currentTour.steps.length - 1) {
          nextStep();
        } else {
          setIsPlaying(false);
        }
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isPlaying, currentStep, autoAdvance]);

  const startTour = (tourId) => {
    setSelectedTour(tourId);
    setCurrentStep(0);
    setShowTourSelector(false);
    setIsPlaying(true);
    
    // Navigate to first step's page
    const tour = DEMO_TOURS[tourId];
    if (tour?.steps[0]?.page) {
      window.location.href = createPageUrl(tour.steps[0].page);
    }
  };

  const nextStep = () => {
    if (currentStep < currentTour.steps.length - 1) {
      const nextStepData = currentTour.steps[currentStep + 1];
      setCurrentStep(currentStep + 1);
      
      // Navigate if different page
      if (nextStepData?.page !== step?.page) {
        window.location.href = createPageUrl(nextStepData.page);
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      const prevStepData = currentTour.steps[currentStep - 1];
      setCurrentStep(currentStep - 1);
      
      if (prevStepData?.page !== step?.page) {
        window.location.href = createPageUrl(prevStepData.page);
      }
    }
  };

  const resetTour = () => {
    setCurrentStep(0);
    setShowTourSelector(true);
    setIsPlaying(false);
  };

  const endTour = () => {
    setIsPlaying(false);
    onClose?.();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Tour Selector Modal */}
      <Dialog open={showTourSelector} onOpenChange={setShowTourSelector}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Monitor className="w-5 h-5 text-teal-600" />
              Interactive Demo
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-slate-600 mb-6">
              Choose a guided tour to explore AgentHub's features. Each tour highlights key functionality with interactive walkthroughs.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(DEMO_TOURS).map(([id, tour]) => (
                <motion.div
                  key={id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => startTour(id)}
                  className="p-4 border-2 border-slate-200 hover:border-teal-500 rounded-xl cursor-pointer transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-slate-800">{tour.name}</h3>
                    <Badge variant="outline">{tour.duration}</Badge>
                  </div>
                  <p className="text-sm text-slate-500">{tour.description}</p>
                  <div className="flex items-center gap-1 mt-3 text-xs text-slate-400">
                    <span>{tour.steps.length} steps</span>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-teal-600" />
                <span className="font-medium text-teal-800">Pro Tip</span>
              </div>
              <p className="text-sm text-teal-700">
                Start with the "Full Platform Tour" for a comprehensive overview, or choose a specific feature tour to dive deep into particular functionality.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Demo Overlay */}
      {!showTourSelector && step && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 pointer-events-none"
          >
            {/* Backdrop with spotlight effect */}
            <div className="absolute inset-0 bg-black/40" />

            {/* Demo Card */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              className={`absolute pointer-events-auto ${
                step.position === 'center' ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2' :
                step.position === 'bottom' ? 'bottom-24 left-1/2 -translate-x-1/2' :
                step.position === 'right' ? 'top-1/2 right-8 -translate-y-1/2' :
                'top-1/2 left-8 -translate-y-1/2'
              }`}
            >
              <Card className="w-96 shadow-2xl border-0">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Badge className="bg-teal-600">
                      Step {currentStep + 1} of {currentTour.steps.length}
                    </Badge>
                    <Button size="sm" variant="ghost" onClick={endTour}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <CardTitle className="text-lg">{step.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 mb-4">{step.content}</p>
                  
                  {/* Progress Bar */}
                  <Progress value={progress} className="h-1.5 mb-4 [&>div]:bg-teal-500" />
                  
                  {/* Controls */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={prevStep}
                        disabled={currentStep === 0}
                      >
                        Back
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsPlaying(!isPlaying)}
                      >
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </Button>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={resetTour}
                      >
                        <RotateCcw className="w-4 h-4" />
                      </Button>
                      
                      {currentStep < currentTour.steps.length - 1 ? (
                        <Button
                          size="sm"
                          onClick={nextStep}
                          className="bg-teal-600 hover:bg-teal-700"
                        >
                          Next
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={endTour}
                          className="bg-emerald-600 hover:bg-emerald-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Finish
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Quick Actions Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-auto"
            >
              <div className="flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur rounded-full shadow-lg">
                <span className="text-sm text-slate-600 mr-2">{currentTour.name}</span>
                <Button
                  size="sm"
                  variant={autoAdvance ? 'default' : 'outline'}
                  onClick={() => setAutoAdvance(!autoAdvance)}
                  className="h-7 text-xs"
                >
                  Auto-play {autoAdvance ? 'ON' : 'OFF'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={resetTour}
                  className="h-7 text-xs"
                >
                  Change Tour
                </Button>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      )}
    </>
  );
}

// Demo Trigger Button Component
export function DemoTriggerButton({ onStart }) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onStart}
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-full shadow-lg shadow-teal-500/30 hover:shadow-xl transition-shadow"
    >
      <Play className="w-5 h-5" />
      <span className="font-medium">Start Demo</span>
    </motion.button>
  );
}