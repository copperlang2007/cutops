import { useState } from 'react'
import { base44 } from '@/api/base44Client'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  Brain, Sparkles, Loader2, Target, TrendingUp, AlertTriangle,
  MessageSquare, Play, CheckCircle, Star, Lightbulb, Users
} from 'lucide-react';
import { toast } from 'sonner'

export default function AICoachingEngine({ 
  agent, 
  licenses, 
  contracts, 
  commissions, 
  policies, 
  alerts,
  leaderboardRank,
  teamAverages 
}) {
  const [coaching, setCoaching] = useState(null);
  const [scenarios, setScenarios] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeScenario, setActiveScenario] = useState(null);
  const [scenarioResponse, setScenarioResponse] = useState('');

  const generateCoachingPlan = async () => {
    setIsGenerating(true);
    try {
      // Calculate performance metrics
      const totalCommission = commissions?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0;
      const activePolicies = policies?.filter(p => p.status === 'active').length || 0;
      const activeLicenses = licenses?.filter(l => l.status === 'active').length || 0;
      const activeContracts = contracts?.filter(c => ['active', 'contract_signed'].includes(c.contract_status)).length || 0;
      const criticalAlerts = alerts?.filter(a => !a.is_resolved && a.severity === 'critical').length || 0;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Create a comprehensive, personalized coaching plan for this insurance agent:

AGENT PROFILE:
- Name: ${agent.first_name} ${agent.last_name}
- Status: ${agent.onboarding_status}
- Leaderboard Rank: ${leaderboardRank || 'N/A'}

PERFORMANCE METRICS:
- Total Commission: $${totalCommission.toLocaleString()}
- Active Policies: ${activePolicies}
- Active Licenses: ${activeLicenses} states
- Active Contracts: ${activeContracts} carriers
- Critical Alerts: ${criticalAlerts}

TEAM AVERAGES:
- Avg Commission: $${teamAverages?.avgCommission || 0}
- Avg Policies: ${teamAverages?.avgPolicies || 0}
- Avg Licenses: ${teamAverages?.avgLicenses || 0}

COMPLIANCE STATUS:
- Expiring Licenses: ${licenses?.filter(l => l.status === 'active').length || 0}
- Pending Contracts: ${contracts?.filter(c => c.contract_status === 'pending_submission').length || 0}
- Unresolved Alerts: ${alerts?.filter(a => !a.is_resolved).length || 0}

Generate:
1. Overall performance assessment (score 0-100)
2. Key strengths (3-5 specific items)
3. Areas for improvement with specific action items
4. 30-day development plan with weekly milestones
5. Personalized goals based on their current level
6. Recommended training focus areas
7. Motivational insights based on their progress`,
        response_json_schema: {
          type: "object",
          properties: {
            performance_score: { type: "number" },
            performance_tier: { type: "string" },
            strengths: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  area: { type: "string" },
                  detail: { type: "string" },
                  impact: { type: "string" }
                }
              }
            },
            improvements: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  area: { type: "string" },
                  current_state: { type: "string" },
                  target_state: { type: "string" },
                  action_items: { type: "array", items: { type: "string" } },
                  priority: { type: "string" }
                }
              }
            },
            development_plan: {
              type: "object",
              properties: {
                week_1: { type: "array", items: { type: "string" } },
                week_2: { type: "array", items: { type: "string" } },
                week_3: { type: "array", items: { type: "string" } },
                week_4: { type: "array", items: { type: "string" } }
              }
            },
            goals: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  goal: { type: "string" },
                  metric: { type: "string" },
                  target: { type: "string" },
                  deadline: { type: "string" }
                }
              }
            },
            training_focus: { type: "array", items: { type: "string" } },
            motivation: { type: "string" }
          }
        }
      });

      setCoaching(result);

      // Generate role-playing scenarios
      const scenarioResult = await base44.integrations.Core.InvokeLLM({
        prompt: `Create 3 role-playing scenarios for this insurance agent to practice skills in their improvement areas:

IMPROVEMENT AREAS: ${result.improvements?.map(i => i.area).join(', ')}
AGENT TIER: ${result.performance_tier}

For each scenario, create:
1. A realistic client situation
2. The challenge/objection to handle
3. Key skills being tested
4. Ideal response approach
5. Common mistakes to avoid`,
        response_json_schema: {
          type: "object",
          properties: {
            scenarios: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  situation: { type: "string" },
                  client_statement: { type: "string" },
                  skills_tested: { type: "array", items: { type: "string" } },
                  ideal_approach: { type: "string" },
                  common_mistakes: { type: "array", items: { type: "string" } },
                  difficulty: { type: "string" }
                }
              }
            }
          }
        }
      });

      setScenarios(scenarioResult.scenarios);
      toast.success('Coaching plan generated');
    } catch (err) {
      console.error('Failed to generate coaching:', err);
      toast.error('Failed to generate coaching plan');
    } finally {
      setIsGenerating(false);
    }
  };

  const evaluateScenarioResponse = async (scenario) => {
    if (!scenarioResponse.trim()) return;
    
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Evaluate this agent's response to a role-playing scenario:

SCENARIO: ${scenario.situation}
CLIENT SAID: "${scenario.client_statement}"
AGENT RESPONDED: "${scenarioResponse}"
IDEAL APPROACH: ${scenario.ideal_approach}

Provide:
1. Score (0-100)
2. What they did well
3. What could be improved
4. Suggested better response`,
        response_json_schema: {
          type: "object",
          properties: {
            score: { type: "number" },
            strengths: { type: "array", items: { type: "string" } },
            improvements: { type: "array", items: { type: "string" } },
            better_response: { type: "string" }
          }
        }
      });

      toast.success(`Score: ${result.score}/100`);
      setActiveScenario({ ...scenario, evaluation: result });
    } catch (err) {
      toast.error('Failed to evaluate response');
    }
  };

  const tierColors = {
    'Elite': 'bg-amber-100 text-amber-800 border-amber-300',
    'Advanced': 'bg-emerald-100 text-emerald-800 border-emerald-300',
    'Intermediate': 'bg-blue-100 text-blue-800 border-blue-300',
    'Developing': 'bg-purple-100 text-purple-800 border-purple-300',
    'New': 'bg-slate-100 text-slate-800 border-slate-300'
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            AI Coaching Engine
          </CardTitle>
          <Button
            size="sm"
            onClick={generateCoachingPlan}
            disabled={isGenerating}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span className="ml-1">Generate Plan</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!coaching && !isGenerating && (
          <p className="text-sm text-slate-400 text-center py-8">
            Generate a personalized coaching plan with AI-powered insights and role-playing scenarios
          </p>
        )}

        {coaching && (
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid grid-cols-4 gap-1">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="plan">30-Day Plan</TabsTrigger>
              <TabsTrigger value="goals">Goals</TabsTrigger>
              <TabsTrigger value="practice">Practice</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              {/* Performance Score */}
              <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm text-slate-600">Performance Score</p>
                    <p className="text-3xl font-bold text-purple-700">{coaching.performance_score}</p>
                  </div>
                  <Badge className={tierColors[coaching.performance_tier] || tierColors['Developing']}>
                    {coaching.performance_tier}
                  </Badge>
                </div>
                <Progress value={coaching.performance_score} className="h-2 [&>div]:bg-purple-500" />
              </div>

              {/* Strengths */}
              <div>
                <h4 className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
                  <Star className="w-4 h-4 text-amber-500" />
                  Key Strengths
                </h4>
                <div className="space-y-2">
                  {coaching.strengths?.map((s, i) => (
                    <div key={i} className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                      <p className="text-sm font-medium text-emerald-800">{s.area}</p>
                      <p className="text-xs text-emerald-600">{s.detail}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Improvements */}
              <div>
                <h4 className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
                  <Target className="w-4 h-4 text-blue-500" />
                  Focus Areas
                </h4>
                <div className="space-y-2">
                  {coaching.improvements?.map((imp, i) => (
                    <div key={i} className="p-2 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-blue-800">{imp.area}</p>
                        <Badge variant="outline" className={
                          imp.priority === 'high' ? 'bg-red-100 text-red-700' :
                          imp.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                          'bg-slate-100 text-slate-700'
                        }>{imp.priority}</Badge>
                      </div>
                      <p className="text-xs text-blue-600 mb-1">{imp.current_state} → {imp.target_state}</p>
                      <ul className="text-xs text-blue-700">
                        {imp.action_items?.slice(0, 2).map((item, j) => (
                          <li key={j}>• {item}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              {/* Motivation */}
              {coaching.motivation && (
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <p className="text-sm text-purple-700 italic">"{coaching.motivation}"</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="plan" className="space-y-3">
              {Object.entries(coaching.development_plan || {}).map(([week, tasks], i) => (
                <div key={week} className="p-3 bg-slate-50 rounded-lg">
                  <h4 className="text-sm font-medium text-slate-700 mb-2">Week {i + 1}</h4>
                  <ul className="space-y-1">
                    {tasks?.map((task, j) => (
                      <li key={j} className="text-xs text-slate-600 flex items-start gap-2">
                        <CheckCircle className="w-3 h-3 text-slate-400 mt-0.5 flex-shrink-0" />
                        {task}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="goals" className="space-y-3">
              {coaching.goals?.map((goal, i) => (
                <div key={i} className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm font-medium text-amber-800">{goal.goal}</p>
                  <div className="flex items-center gap-4 mt-1 text-xs text-amber-700">
                    <span>Metric: {goal.metric}</span>
                    <span>Target: {goal.target}</span>
                    <span>By: {goal.deadline}</span>
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="practice" className="space-y-3">
              <p className="text-xs text-slate-500 mb-2">Practice handling real scenarios with AI feedback</p>
              {scenarios?.map((scenario, i) => (
                <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-slate-700">{scenario.title}</h4>
                    <Badge variant="outline">{scenario.difficulty}</Badge>
                  </div>
                  <p className="text-xs text-slate-600 mb-2">{scenario.situation}</p>
                  <div className="p-2 bg-blue-50 rounded mb-2">
                    <p className="text-xs text-blue-800">Client says: "{scenario.client_statement}"</p>
                  </div>
                  
                  {activeScenario?.title === scenario.title ? (
                    <div className="space-y-2">
                      <textarea
                        className="w-full p-2 text-xs border rounded-lg"
                        rows={3}
                        placeholder="Type your response..."
                        value={scenarioResponse}
                        onChange={(e) => setScenarioResponse(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <Button size="sm" className="h-7 text-xs" onClick={() => evaluateScenarioResponse(scenario)}>
                          Get Feedback
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setActiveScenario(null)}>
                          Cancel
                        </Button>
                      </div>
                      {activeScenario.evaluation && (
                        <div className="p-2 bg-emerald-50 rounded-lg mt-2">
                          <p className="text-sm font-medium text-emerald-800">Score: {activeScenario.evaluation.score}/100</p>
                          <p className="text-xs text-emerald-700 mt-1">Better response: {activeScenario.evaluation.better_response}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-7 text-xs"
                      onClick={() => {
                        setActiveScenario(scenario);
                        setScenarioResponse('');
                      }}
                    >
                      <Play className="w-3 h-3 mr-1" />
                      Practice This
                    </Button>
                  )}
                </div>
              ))}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}