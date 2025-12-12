import { useState } from 'react'
import { base44 } from '@/api/base44Client'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { 
  Brain, Sparkles, Loader2, Target, TrendingUp, MessageSquare,
  Play, CheckCircle, Star, Lightbulb, GraduationCap, Award,
  ThumbsUp, ThumbsDown, RefreshCw, BookOpen
} from 'lucide-react';
import { toast } from 'sonner'
import { motion } from 'framer-motion'

export default function AICoachingModule({ 
  agent, 
  clients,
  interactions,
  commissions,
  licenses,
  contracts,
  tasks,
  teamAverages
}) {
  const [coachingPlan, setCoachingPlan] = useState(null);
  const [scenarios, setScenarios] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeScenario, setActiveScenario] = useState(null);
  const [userResponse, setUserResponse] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [isEvaluating, setIsEvaluating] = useState(false);

  const calculateMetrics = () => {
    const agentClients = clients?.filter(c => c.agent_id === agent.id) || [];
    const agentInteractions = interactions?.filter(i => i.agent_id === agent.id) || [];
    const agentCommissions = commissions?.filter(c => c.agent_id === agent.id) || [];
    const agentLicenses = licenses?.filter(l => l.agent_id === agent.id) || [];
    const agentContracts = contracts?.filter(c => c.agent_id === agent.id) || [];
    const agentTasks = tasks?.filter(t => t.agent_id === agent.id) || [];

    const totalCommission = agentCommissions.reduce((sum, c) => sum + (c.amount || 0), 0);
    const avgSatisfaction = agentClients.filter(c => c.satisfaction_score)
      .reduce((sum, c, _, arr) => sum + c.satisfaction_score / arr.length, 0);
    const activeClients = agentClients.filter(c => c.status === 'active').length;
    const completedTasks = agentTasks.filter(t => t.status === 'completed').length;
    const activeLicenses = agentLicenses.filter(l => l.status === 'active').length;
    const activeContracts = agentContracts.filter(c => ['active', 'contract_signed'].includes(c.contract_status)).length;

    // Analyze interactions for patterns
    const positiveInteractions = agentInteractions.filter(i => i.sentiment === 'positive').length;
    const negativeInteractions = agentInteractions.filter(i => i.sentiment === 'negative').length;
    const successfulOutcomes = agentInteractions.filter(i => 
      ['successful', 'policy_sold', 'scheduled_appointment', 'referral_received'].includes(i.outcome)
    ).length;

    return {
      totalCommission,
      avgSatisfaction: Math.round(avgSatisfaction * 10) / 10,
      activeClients,
      totalClients: agentClients.length,
      completedTasks,
      totalTasks: agentTasks.length,
      activeLicenses,
      activeContracts,
      totalInteractions: agentInteractions.length,
      positiveInteractions,
      negativeInteractions,
      successfulOutcomes,
      conversionRate: agentInteractions.length > 0 
        ? Math.round((successfulOutcomes / agentInteractions.length) * 100) 
        : 0
    };
  };

  const generateCoachingPlan = async () => {
    setIsGenerating(true);
    try {
      const metrics = calculateMetrics();
      const agentInteractions = interactions?.filter(i => i.agent_id === agent.id).slice(0, 10) || [];

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Create a comprehensive, personalized coaching plan for this insurance agent:

AGENT PROFILE:
- Name: ${agent.first_name} ${agent.last_name}
- Status: ${agent.onboarding_status}

PERFORMANCE METRICS:
- Total Commission: $${metrics.totalCommission.toLocaleString()}
- Average Client Satisfaction: ${metrics.avgSatisfaction}/10
- Active Clients: ${metrics.activeClients}
- Conversion Rate: ${metrics.conversionRate}%
- Completed Tasks: ${metrics.completedTasks}/${metrics.totalTasks}
- Active Licenses: ${metrics.activeLicenses}
- Active Contracts: ${metrics.activeContracts}
- Positive Interactions: ${metrics.positiveInteractions}
- Negative Interactions: ${metrics.negativeInteractions}

RECENT INTERACTIONS:
${agentInteractions.map(i => `- ${i.interaction_type}: ${i.outcome} (${i.sentiment})`).join('\n')}

TEAM AVERAGES:
- Avg Commission: $${teamAverages?.avgCommission || 0}
- Avg Satisfaction: ${teamAverages?.avgSatisfaction || 0}
- Avg Conversion: ${teamAverages?.avgConversion || 0}%

Analyze and provide:
1. Performance score (0-100) with breakdown
2. Key strengths (specific behaviors to reinforce)
3. Areas for improvement with actionable coaching tips
4. Personalized weekly development goals
5. Recommended training modules
6. Communication style recommendations
7. Motivational insights`,
        response_json_schema: {
          type: "object",
          properties: {
            performance_score: { type: "number" },
            score_breakdown: {
              type: "object",
              properties: {
                sales: { type: "number" },
                client_relations: { type: "number" },
                compliance: { type: "number" },
                efficiency: { type: "number" }
              }
            },
            strengths: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  area: { type: "string" },
                  observation: { type: "string" },
                  reinforce_tip: { type: "string" }
                }
              }
            },
            improvements: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  area: { type: "string" },
                  gap: { type: "string" },
                  coaching_tip: { type: "string" },
                  action_steps: { type: "array", items: { type: "string" } },
                  expected_impact: { type: "string" }
                }
              }
            },
            weekly_goals: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  goal: { type: "string" },
                  metric: { type: "string" },
                  target: { type: "string" }
                }
              }
            },
            training_modules: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  module_name: { type: "string" },
                  focus_area: { type: "string" },
                  priority: { type: "string" },
                  estimated_time: { type: "string" }
                }
              }
            },
            communication_tips: { type: "array", items: { type: "string" } },
            motivation: { type: "string" }
          }
        }
      });

      setCoachingPlan(result);

      // Generate practice scenarios
      const scenarioResult = await base44.integrations.Core.InvokeLLM({
        prompt: `Based on this agent's improvement areas, create 4 realistic practice scenarios:

IMPROVEMENT AREAS:
${result.improvements?.map(i => `- ${i.area}: ${i.gap}`).join('\n')}

Create varied scenarios covering:
1. Handling price objections
2. Dealing with confused/frustrated clients
3. Upselling/cross-selling opportunities
4. Retention conversations with at-risk clients

For each scenario:
- Make it realistic and specific to Medicare insurance
- Include the client's opening statement
- Define what skills are being tested
- Provide the ideal approach (hidden from agent initially)`,
        response_json_schema: {
          type: "object",
          properties: {
            scenarios: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "number" },
                  title: { type: "string" },
                  category: { type: "string" },
                  difficulty: { type: "string" },
                  client_profile: { type: "string" },
                  situation: { type: "string" },
                  client_opening: { type: "string" },
                  skills_tested: { type: "array", items: { type: "string" } },
                  ideal_approach: { type: "string" },
                  key_phrases: { type: "array", items: { type: "string" } },
                  common_mistakes: { type: "array", items: { type: "string" } }
                }
              }
            }
          }
        }
      });

      setScenarios(scenarioResult.scenarios || []);
      toast.success('Coaching plan generated');
    } catch (err) {
      console.error('Failed to generate coaching:', err);
      toast.error('Failed to generate coaching plan');
    } finally {
      setIsGenerating(false);
    }
  };

  const evaluateResponse = async () => {
    if (!userResponse.trim() || !activeScenario) return;
    
    setIsEvaluating(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Evaluate this insurance agent's response to a practice scenario:

SCENARIO: ${activeScenario.situation}
CLIENT SAID: "${activeScenario.client_opening}"
AGENT RESPONDED: "${userResponse}"

IDEAL APPROACH: ${activeScenario.ideal_approach}
KEY PHRASES TO USE: ${activeScenario.key_phrases?.join(', ')}
COMMON MISTAKES: ${activeScenario.common_mistakes?.join(', ')}

Evaluate:
1. Score (0-100)
2. What the agent did well (specific phrases/techniques)
3. What could be improved
4. A better alternative response
5. Key learning points`,
        response_json_schema: {
          type: "object",
          properties: {
            score: { type: "number" },
            grade: { type: "string" },
            strengths: { type: "array", items: { type: "string" } },
            improvements: { type: "array", items: { type: "string" } },
            better_response: { type: "string" },
            key_learnings: { type: "array", items: { type: "string" } },
            encouragement: { type: "string" }
          }
        }
      });

      setFeedback(result);
    } catch (err) {
      toast.error('Failed to evaluate response');
    } finally {
      setIsEvaluating(false);
    }
  };

  const startScenario = (scenario) => {
    setActiveScenario(scenario);
    setUserResponse('');
    setFeedback(null);
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            AI Coaching Module
            <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white ml-2">
              <Sparkles className="w-3 h-3 mr-1" />
              Personalized
            </Badge>
          </CardTitle>
          <Button
            size="sm"
            onClick={generateCoachingPlan}
            disabled={isGenerating}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span className="ml-1">{isGenerating ? &apos;Analyzing...&apos; : &apos;Generate Plan&apos;}</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!coachingPlan && !isGenerating && (
          <div className="text-center py-8 text-slate-400">
            <Brain className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Generate a personalized coaching plan based on performance data</p>
          </div>
        )}

        {coachingPlan && (
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid grid-cols-5 h-auto">
              <TabsTrigger value="overview" className="text-xs py-2">Overview</TabsTrigger>
              <TabsTrigger value="coaching" className="text-xs py-2">Coaching</TabsTrigger>
              <TabsTrigger value="training" className="text-xs py-2">Training</TabsTrigger>
              <TabsTrigger value="practice" className="text-xs py-2">Practice</TabsTrigger>
              <TabsTrigger value="goals" className="text-xs py-2">Goals</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              {/* Score Breakdown */}
              <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-slate-500">Performance Score</p>
                    <p className="text-4xl font-bold text-purple-700">{coachingPlan.performance_score}</p>
                  </div>
                  <Award className="w-12 h-12 text-purple-300" />
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {Object.entries(coachingPlan.score_breakdown || {}).map(([key, val]) => (
                    <div key={key} className="text-center">
                      <Progress value={val} className="h-1.5 mb-1 [&>div]:bg-purple-500" />
                      <p className="text-xs text-slate-500 capitalize">{key.replace(&apos;_&apos;, &apos; &apos;)}</p>
                      <p className="text-sm font-medium">{val}%</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Strengths */}
              <div>
                <h4 className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
                  <Star className="w-4 h-4 text-amber-500" />
                  Key Strengths
                </h4>
                <div className="space-y-2">
                  {coachingPlan.strengths?.slice(0, 3).map((s, i) => (
                    <div key={i} className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                      <p className="text-sm font-medium text-emerald-800">{s.area}</p>
                      <p className="text-xs text-emerald-600">{s.observation}</p>
                      <p className="text-xs text-emerald-700 mt-1 italic">💡 {s.reinforce_tip}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Motivation */}
              {coachingPlan.motivation && (
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <p className="text-sm text-purple-700 italic">"{coachingPlan.motivation}"</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="coaching" className="space-y-3">
              {coachingPlan.improvements?.map((imp, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-3 bg-blue-50 border border-blue-200 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-blue-800">{imp.area}</p>
                    <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700">
                      {imp.expected_impact}
                    </Badge>
                  </div>
                  <p className="text-xs text-blue-600 mb-2">{imp.gap}</p>
                  <div className="p-2 bg-white rounded">
                    <p className="text-xs font-medium text-slate-700 mb-1">
                      <Lightbulb className="w-3 h-3 inline mr-1 text-amber-500" />
                      Coaching Tip:
                    </p>
                    <p className="text-xs text-slate-600">{imp.coaching_tip}</p>
                  </div>
                  <div className="mt-2">
                    <p className="text-xs font-medium text-slate-700 mb-1">Action Steps:</p>
                    <ul className="space-y-1">
                      {imp.action_steps?.map((step, j) => (
                        <li key={j} className="text-xs text-slate-600 flex items-start gap-1">
                          <CheckCircle className="w-3 h-3 text-blue-400 mt-0.5 flex-shrink-0" />
                          {step}
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              ))}

              {/* Communication Tips */}
              {coachingPlan.communication_tips?.length > 0 && (
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-sm font-medium text-slate-700 mb-2">
                    <MessageSquare className="w-4 h-4 inline mr-1" />
                    Communication Tips
                  </p>
                  <ul className="space-y-1">
                    {coachingPlan.communication_tips.map((tip, i) => (
                      <li key={i} className="text-xs text-slate-600">• {tip}</li>
                    ))}
                  </ul>
                </div>
              )}
            </TabsContent>

            <TabsContent value="training" className="space-y-2">
              {coachingPlan.training_modules?.map((module, i) => (
                <div key={i} className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                      <GraduationCap className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">{module.module_name}</p>
                      <p className="text-xs text-slate-500">{module.focus_area} • {module.estimated_time}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className={
                    module.priority === 'high' ? 'bg-red-50 text-red-700' :
                    module.priority === 'medium' ? 'bg-amber-50 text-amber-700' :
                    'bg-slate-50 text-slate-600'
                  }>{module.priority}</Badge>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="practice" className="space-y-3">
              {!activeScenario ? (
                <>
                  <p className="text-xs text-slate-500 mb-2">Practice handling real client scenarios with AI feedback</p>
                  {scenarios.map((scenario, i) => (
                    <div key={i} className="p-3 bg-slate-50 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{scenario.category}</Badge>
                          <Badge variant="outline" className={
                            scenario.difficulty === 'hard' ? 'bg-red-50 text-red-700' :
                            scenario.difficulty === 'medium' ? 'bg-amber-50 text-amber-700' :
                            'bg-green-50 text-green-700'
                          }>{scenario.difficulty}</Badge>
                        </div>
                      </div>
                      <p className="text-sm font-medium text-slate-700">{scenario.title}</p>
                      <p className="text-xs text-slate-500 mt-1">{scenario.client_profile}</p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2"
                        onClick={() => startScenario(scenario)}
                      >
                        <Play className="w-3 h-3 mr-1" />
                        Start Practice
                      </Button>
                    </div>
                  ))}
                </>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge>{activeScenario.category}</Badge>
                    <Button size="sm" variant="ghost" onClick={() => {
                      setActiveScenario(null);
                      setFeedback(null);
                    }}>
                      <RefreshCw className="w-3 h-3 mr-1" />
                      New Scenario
                    </Button>
                  </div>
                  
                  <div className="p-3 bg-slate-100 rounded-lg">
                    <p className="text-xs text-slate-500 mb-1">Situation:</p>
                    <p className="text-sm text-slate-700">{activeScenario.situation}</p>
                  </div>

                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-blue-500 mb-1">Client says:</p>
                    <p className="text-sm text-blue-800 italic">"{activeScenario.client_opening}"</p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500 mb-1">Your response:</p>
                    <Textarea
                      value={userResponse}
                      onChange={(e) => setUserResponse(e.target.value)}
                      placeholder="Type how you would respond to this client..."
                      rows={4}
                      disabled={!!feedback}
                    />
                  </div>

                  {!feedback && (
                    <Button
                      onClick={evaluateResponse}
                      disabled={isEvaluating || !userResponse.trim()}
                      className="w-full bg-purple-600 hover:bg-purple-700"
                    >
                      {isEvaluating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Get Feedback
                    </Button>
                  )}

                  {feedback && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-3"
                    >
                      <div className={`p-3 rounded-lg ${
                        feedback.score >= 80 ? 'bg-emerald-50 border border-emerald-200' :
                        feedback.score >= 60 ? 'bg-amber-50 border border-amber-200' :
                        'bg-red-50 border border-red-200'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-2xl font-bold">{feedback.score}/100</span>
                          <Badge>{feedback.grade}</Badge>
                        </div>
                        <p className="text-sm">{feedback.encouragement}</p>
                      </div>

                      {feedback.strengths?.length > 0 && (
                        <div className="p-2 bg-emerald-50 rounded">
                          <p className="text-xs font-medium text-emerald-700 mb-1">
                            <ThumbsUp className="w-3 h-3 inline mr-1" />
                            What you did well:
                          </p>
                          <ul className="text-xs text-emerald-600 space-y-0.5">
                            {feedback.strengths.map((s, i) => <li key={i}>• {s}</li>)}
                          </ul>
                        </div>
                      )}

                      {feedback.improvements?.length > 0 && (
                        <div className="p-2 bg-amber-50 rounded">
                          <p className="text-xs font-medium text-amber-700 mb-1">
                            <ThumbsDown className="w-3 h-3 inline mr-1" />
                            What to improve:
                          </p>
                          <ul className="text-xs text-amber-600 space-y-0.5">
                            {feedback.improvements.map((s, i) => <li key={i}>• {s}</li>)}
                          </ul>
                        </div>
                      )}

                      <div className="p-2 bg-blue-50 rounded">
                        <p className="text-xs font-medium text-blue-700 mb-1">
                          <BookOpen className="w-3 h-3 inline mr-1" />
                          Better response:
                        </p>
                        <p className="text-xs text-blue-600 italic">"{feedback.better_response}"</p>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="goals" className="space-y-2">
              {coachingPlan.weekly_goals?.map((goal, i) => (
                <div key={i} className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Target className="w-4 h-4 text-amber-600" />
                    <p className="text-sm font-medium text-amber-800">{goal.goal}</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-amber-700">
                    <span>📊 {goal.metric}</span>
                    <span>🎯 Target: {goal.target}</span>
                  </div>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}