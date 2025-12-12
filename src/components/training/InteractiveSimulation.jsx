import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Mic, Send, Loader2, Award, CheckCircle, X, ArrowRight, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

export default function InteractiveSimulation({ simulation, agentId, onComplete }) {
  const [sessionId, setSessionId] = useState(null);
  const [currentPrompt, setCurrentPrompt] = useState(0);
  const [responses, setResponses] = useState([]);
  const [currentResponse, setCurrentResponse] = useState('');
  const [evaluation, setEvaluation] = useState(null);
  const queryClient = useQueryClient();

  const prompts = [
    simulation.scenario.situation,
    ...(simulation.scenario.client_concerns || []).map(c => `Client says: "${c}". How do you respond?`),
    "Client asks about pricing and coverage details. Explain the benefits clearly."
  ];

  const startSimulation = async () => {
    const session = await base44.entities.TrainingSession.create({
      agent_id: agentId,
      simulation_id: simulation.id,
      responses: []
    });
    setSessionId(session.id);
  };

  const submitResponseMutation = useMutation({
    mutationFn: async () => {
      const newResponses = [
        ...responses,
        {
          prompt: prompts[currentPrompt],
          agent_response: currentResponse,
          timestamp: new Date().toISOString()
        }
      ];

      await base44.entities.TrainingSession.update(sessionId, {
        responses: newResponses
      });

      return newResponses;
    },
    onSuccess: (newResponses) => {
      setResponses(newResponses);
      setCurrentResponse('');
      
      if (currentPrompt < prompts.length - 1) {
        setCurrentPrompt(prev => prev + 1);
      } else {
        evaluateSimulation(newResponses);
      }
    }
  });

  const evaluateMutation = useMutation({
    mutationFn: async (allResponses) => {
      const response = await base44.functions.invoke('aiSimulationEvaluator', {
        session_id: sessionId,
        simulation_id: simulation.id,
        agent_responses: allResponses
      });
      
      const evaluation = response.data.evaluation;
      const passed = evaluation.overall_score >= (simulation.passing_score || 70);
      
      // Update session with results
      await base44.entities.TrainingSession.update(sessionId, {
        completed: true,
        completed_date: new Date().toISOString(),
        score: evaluation.overall_score,
        passed,
        test_result: passed ? 'passed' : 'failed',
        feedback: {
          strengths: evaluation.strengths,
          improvements: evaluation.improvements,
          missed_points: evaluation.missed_points,
          overall_assessment: evaluation.overall_assessment
        }
      });

      // Get user for notification
      const user = await base44.auth.me();
      
      // Send notification
      await base44.functions.invoke('trainingNotificationEngine', {
        notification_type: passed ? 'test_passed' : 'test_failed',
        agent_id: agentId,
        agent_email: user.email,
        data: {
          agent_name: user.full_name,
          training_title: simulation.title,
          score: evaluation.overall_score,
          passing_score: simulation.passing_score || 70,
          generate_certificate: passed && simulation.generate_certificate
        }
      });

      // Generate certificate if passed
      if (passed && simulation.generate_certificate) {
        const certResult = await base44.functions.invoke('generateCertificate', {
          agent_id: agentId,
          training_session_id: sessionId,
          training_title: simulation.title,
          training_type: 'simulation',
          score: evaluation.overall_score
        });
        
        await base44.entities.TrainingSession.update(sessionId, {
          certificate_generated: true,
          certificate_id: certResult.data.certificate.certificate_id
        });
      }
      
      return response.data;
    },
    onSuccess: (data) => {
      setEvaluation(data.evaluation);
      queryClient.invalidateQueries(['trainingSessions']);
      queryClient.invalidateQueries(['certificates']);
    }
  });

  const evaluateSimulation = (allResponses) => {
    evaluateMutation.mutate(allResponses);
  };

  const progress = ((currentPrompt + 1) / prompts.length) * 100;

  if (!sessionId) {
    return (
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>{simulation.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Badge>{simulation.simulation_type.replace(/_/g, ' ')}</Badge>
          <p className="text-slate-600 dark:text-slate-400">{simulation.description}</p>
          
          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border dark:border-slate-700">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Scenario:</p>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{simulation.scenario.situation}</p>
            
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Success Criteria:</p>
            <ul className="space-y-1">
              {simulation.scenario.success_criteria?.map((criteria, i) => (
                <li key={i} className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2">
                  <CheckCircle className="w-3 h-3 text-green-600 mt-0.5 shrink-0" />
                  {criteria}
                </li>
              ))}
            </ul>
          </div>

          <Button onClick={startSimulation} className="w-full bg-purple-600 hover:bg-purple-700">
            <Mic className="w-4 h-4 mr-2" />
            Start Simulation
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (evaluation) {
    const getGradeColor = (grade) => {
      switch (grade) {
        case 'A': return 'text-green-600';
        case 'B': return 'text-blue-600';
        case 'C': return 'text-amber-600';
        default: return 'text-red-600';
      }
    };

    return (
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-600" />
            Simulation Results
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center p-6 rounded-lg bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
            <p className={`text-6xl font-bold mb-2 ${getGradeColor(evaluation.grade)}`}>
              {evaluation.grade}
            </p>
            <p className="text-2xl font-semibold text-slate-900 dark:text-white mb-1">
              {evaluation.score}%
            </p>
            <Badge className={evaluation.passed ? 'bg-green-600' : 'bg-red-600'}>
              {evaluation.passed ? 'Passed' : 'Needs Improvement'}
            </Badge>
          </div>

          <div>
            <p className="font-medium text-slate-900 dark:text-white mb-2">Overall Assessment</p>
            <p className="text-sm text-slate-700 dark:text-slate-300">{evaluation.overall_assessment}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <p className="font-medium text-green-900 dark:text-green-200 mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Strengths
              </p>
              <ul className="space-y-1">
                {evaluation.strengths.map((s, i) => (
                  <li key={i} className="text-sm text-green-700 dark:text-green-300">• {s}</li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <p className="font-medium text-amber-900 dark:text-amber-200 mb-2 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Areas to Improve
              </p>
              <ul className="space-y-1">
                {evaluation.improvements.map((imp, i) => (
                  <li key={i} className="text-sm text-amber-700 dark:text-amber-300">• {imp}</li>
                ))}
              </ul>
            </div>
          </div>

          {evaluation.missed_points?.length > 0 && (
            <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="font-medium text-red-900 dark:text-red-200 mb-2">Missed Key Points</p>
              <ul className="space-y-1">
                {evaluation.missed_points.map((point, i) => (
                  <li key={i} className="text-sm text-red-700 dark:text-red-300">• {point}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <p className="font-medium text-blue-900 dark:text-blue-200 mb-2">Next Steps</p>
            <ul className="space-y-1">
              {evaluation.next_steps.map((step, i) => (
                <li key={i} className="text-sm text-blue-700 dark:text-blue-300">
                  {i + 1}. {step}
                </li>
              ))}
            </ul>
          </div>

          <Button onClick={onComplete} className="w-full">
            <CheckCircle className="w-4 h-4 mr-2" />
            Complete Training
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <div className="space-y-3">
          <CardTitle>{simulation.title}</CardTitle>
          <div>
            <div className="flex items-center justify-between text-sm text-slate-600 mb-2">
              <span>Question {currentPrompt + 1} of {prompts.length}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
            Scenario Prompt:
          </p>
          <p className="text-sm text-blue-700 dark:text-blue-300">{prompts[currentPrompt]}</p>
        </div>

        {responses.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Previous Responses:</p>
            {responses.slice(-2).map((r, i) => (
              <div key={i} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border dark:border-slate-700 text-sm">
                <p className="text-xs text-slate-500 mb-1">{r.prompt}</p>
                <p className="text-slate-700 dark:text-slate-300">{r.agent_response}</p>
              </div>
            ))}
          </div>
        )}

        <div>
          <Textarea
            value={currentResponse}
            onChange={(e) => setCurrentResponse(e.target.value)}
            placeholder="Type your response as if speaking to the client..."
            rows={4}
            disabled={submitResponseMutation.isPending}
          />
        </div>

        <Button
          onClick={() => submitResponseMutation.mutate()}
          disabled={!currentResponse.trim() || submitResponseMutation.isPending}
          className="w-full bg-purple-600 hover:bg-purple-700"
        >
          {submitResponseMutation.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : evaluateMutation.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <>
              {currentPrompt < prompts.length - 1 ? (
                <>
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Next Question
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Submit for Evaluation
                </>
              )}
            </>
          )}
        </Button>

        {evaluateMutation.isPending && (
          <div className="text-center py-4">
            <Loader2 className="w-6 h-6 mx-auto mb-2 text-purple-600 animate-spin" />
            <p className="text-sm text-slate-500">AI is evaluating your performance...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}