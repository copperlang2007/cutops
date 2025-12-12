import { useState } from 'react'
import { base44 } from '@/api/base44Client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Sparkles, Loader2, CheckCircle, Clock, FileText, TrendingUp, MessageSquare } from 'lucide-react'
import { toast } from 'sonner'

export default function AIOnboardingGuide({ client, onComplete }) {
  const queryClient = useQueryClient();
  const [guidance, setGuidance] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);

  const generateGuidanceMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('aiOnboardingGuide', {
        client_id: client.id,
        plan_type: client.plan_type,
        current_step: currentStep
      });
      return response.data;
    },
    onSuccess: (data) => {
      setGuidance(data.guidance);
      queryClient.invalidateQueries(['tasks']);
      toast.success(`Onboarding guide generated • ${data.tasks_created} tasks created`);
    }
  });

  const markStepComplete = (stepNumber) => {
    if (!completedSteps.includes(stepNumber)) {
      setCompletedSteps([...completedSteps, stepNumber]);
      if (stepNumber === currentStep) {
        setCurrentStep(currentStep + 1);
      }
      toast.success('Step completed');
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700';
      case 'medium': return 'bg-amber-100 text-amber-700';
      case 'low': return 'bg-blue-100 text-blue-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'documentation': return FileText;
      case 'enrollment': return CheckCircle;
      case 'education': return MessageSquare;
      case 'setup': return TrendingUp;
      default: return Clock;
    }
  };

  if (!guidance && !generateGuidanceMutation.isPending) {
    return (
      <Card className="border-purple-200 bg-purple-50 dark:bg-purple-900/20">
        <CardContent className="pt-6 text-center">
          <Sparkles className="w-12 h-12 mx-auto text-purple-600 mb-3" />
          <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
            AI-Guided Onboarding
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Generate a personalized onboarding plan with automated tasks
          </p>
          <Button
            onClick={() => generateGuidanceMutation.mutate()}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Start AI-Guided Onboarding
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (generateGuidanceMutation.isPending) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-600 mb-2" />
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Creating personalized onboarding plan...
          </p>
        </CardContent>
      </Card>
    );
  }

  const progress = guidance ? (completedSteps.length / guidance.checklist_items.length) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              Onboarding Progress
            </CardTitle>
            <Badge className="bg-purple-600">
              {completedSteps.length} / {guidance.checklist_items.length} Complete
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={progress} className="h-2" />
          
          {guidance.timeline && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
              <p className="text-sm text-blue-900 dark:text-blue-200">
                <Clock className="w-4 h-4 inline mr-1" />
                Timeline: {guidance.timeline}
              </p>
            </div>
          )}

          {guidance.agent_tips && guidance.agent_tips.length > 0 && (
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded">
              <p className="text-xs font-semibold text-amber-900 dark:text-amber-200 mb-2">
                Agent Tips:
              </p>
              <ul className="text-xs text-amber-800 dark:text-amber-300 space-y-1">
                {guidance.agent_tips.map((tip, idx) => (
                  <li key={idx}>• {tip}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Checklist Items */}
      <div className="space-y-4">
        {guidance.checklist_items.map((item) => {
          const Icon = getCategoryIcon(item.category);
          const isCompleted = completedSteps.includes(item.step_number);
          const isCurrent = currentStep === item.step_number;

          return (
            <Card
              key={item.step_number}
              className={`border-0 shadow-sm ${isCurrent ? 'ring-2 ring-purple-500' : ''} ${isCompleted ? 'opacity-60' : ''}`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`p-2 rounded-lg ${isCompleted ? 'bg-green-100' : 'bg-purple-100'}`}>
                      {isCompleted ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <Icon className="w-5 h-5 text-purple-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-slate-500">
                          Step {item.step_number}
                        </span>
                        <Badge className={getPriorityColor(item.priority)}>
                          {item.priority}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {item.category}
                        </Badge>
                      </div>
                      <h4 className="font-semibold text-slate-900 dark:text-white">
                        {item.title}
                      </h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        {item.description}
                      </p>
                    </div>
                  </div>
                  {!isCompleted && (
                    <Button
                      onClick={() => markStepComplete(item.step_number)}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Complete
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded">
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Agent Guidance:
                  </p>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    {item.ai_explanation}
                  </p>
                </div>

                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                  <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1">
                    What to tell the client:
                  </p>
                  <p className="text-sm text-blue-900 dark:text-blue-200">
                    {item.client_facing_message}
                  </p>
                </div>

                {item.required_documents && item.required_documents.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                      Required Documents:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {item.required_documents.map((doc, idx) => (
                        <Badge key={idx} variant="outline">
                          <FileText className="w-3 h-3 mr-1" />
                          {doc}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {item.estimated_duration && (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Clock className="w-3 h-3" />
                    Estimated time: {item.estimated_duration}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Policy Options */}
      {guidance.policy_options && guidance.policy_options.length > 0 && (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Policy Options Explained</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {guidance.policy_options.map((option, idx) => (
              <div key={idx} className="border rounded-lg p-4 space-y-3">
                <h4 className="font-semibold text-slate-900 dark:text-white">
                  {option.option_name}
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {option.explanation}
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded">
                    <p className="text-xs font-semibold text-green-900 dark:text-green-200 mb-2">
                      Pros:
                    </p>
                    <ul className="text-xs text-green-800 dark:text-green-300 space-y-1">
                      {option.pros.map((pro, i) => (
                        <li key={i}>+ {pro}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded">
                    <p className="text-xs font-semibold text-red-900 dark:text-red-200 mb-2">
                      Cons:
                    </p>
                    <ul className="text-xs text-red-800 dark:text-red-300 space-y-1">
                      {option.cons.map((con, i) => (
                        <li key={i}>- {con}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                  <p className="text-xs font-semibold text-blue-900 dark:text-blue-200 mb-2">
                    Best for: {option.best_for}
                  </p>
                  <p className="text-xs font-semibold text-blue-900 dark:text-blue-200 mb-1">
                    Talking Points:
                  </p>
                  <ul className="text-xs text-blue-800 dark:text-blue-300 space-y-1">
                    {option.talking_points.map((point, i) => (
                      <li key={i}>• {point}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {progress === 100 && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-900/20">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="w-12 h-12 mx-auto text-green-600 mb-3" />
            <h3 className="font-semibold text-green-900 dark:text-green-200 mb-2">
              Onboarding Complete!
            </h3>
            <p className="text-sm text-green-800 dark:text-green-300 mb-4">
              All onboarding steps have been completed successfully.
            </p>
            {onComplete && (
              <Button onClick={onComplete} className="bg-green-600 hover:bg-green-700">
                Finish Onboarding
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}