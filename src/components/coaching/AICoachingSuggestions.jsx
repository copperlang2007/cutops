import { useState } from 'react'
import { base44 } from '@/api/base44Client'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Sparkles, Loader2, RefreshCw, Target, TrendingUp, 
  TrendingDown, MessageSquare, Award, BookOpen, Copy
} from 'lucide-react';
import { toast } from 'sonner'

export default function AICoachingSuggestions({ agent, metrics, teamAverages, commissions }) {
  const [suggestions, setSuggestions] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateSuggestions = async () => {
    setIsGenerating(true);
    try {
      const totalCommissions = commissions
        ?.filter(c => c.agent_id === agent.id)
        .reduce((sum, c) => sum + (c.amount || 0), 0) || 0;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate personalized coaching suggestions for this insurance agent:

AGENT: ${agent.first_name} ${agent.last_name}
STATUS: ${agent.onboarding_status}

PERFORMANCE METRICS:
- Overall Score: ${metrics.overall}% (Team Avg: ${teamAverages.overall}%)
- Onboarding Progress: ${metrics.onboarding}% (Team Avg: ${teamAverages.onboarding}%)
- License Compliance: ${metrics.licenses}% (Team Avg: ${teamAverages.licenses}%)
- Contracts Secured: ${metrics.contracts}% (Team Avg: ${teamAverages.contracts}%)
- Tasks Completed: ${metrics.tasks}% (Team Avg: ${teamAverages.tasks}%)
- Total Commissions: $${totalCommissions.toLocaleString()}

COMPARISON TO TEAM:
- ${metrics.overall >= teamAverages.overall ? 'Above' : 'Below'} team average by ${Math.abs(metrics.overall - teamAverages.overall)}%
- Strongest area: ${Object.entries(metrics).filter(([k]) => k !== 'overall').sort((a, b) => b[1] - a[1])[0]?.[0]}
- Weakest area: ${Object.entries(metrics).filter(([k]) => k !== 'overall').sort((a, b) => a[1] - b[1])[0]?.[0]}

Provide:
1. Personalized coaching suggestions for the agent
2. Specific improvement areas with actionable steps
3. Strengths to leverage
4. Manager talking points for 1:1 sessions
5. Recommended training or resources
6. 90-day improvement goals`,
        response_json_schema: {
          type: "object",
          properties: {
            agent_suggestions: {
              type: "array",
              items: { type: "string" }
            },
            improvement_areas: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  area: { type: "string" },
                  current_score: { type: "number" },
                  target_score: { type: "number" },
                  action_steps: { type: "array", items: { type: "string" } }
                }
              }
            },
            strengths: {
              type: "array",
              items: { type: "string" }
            },
            manager_talking_points: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  topic: { type: "string" },
                  talking_point: { type: "string" },
                  questions_to_ask: { type: "array", items: { type: "string" } }
                }
              }
            },
            recommended_training: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  reason: { type: "string" },
                  priority: { type: "string" }
                }
              }
            },
            ninety_day_goals: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  goal: { type: "string" },
                  metric: { type: "string" },
                  target: { type: "string" }
                }
              }
            }
          }
        }
      });

      setSuggestions(result);
    } catch (err) {
      console.error('Failed to generate suggestions:', err);
      toast.error('Failed to generate coaching suggestions');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyTalkingPoints = () => {
    if (!suggestions?.manager_talking_points) return;
    const text = suggestions.manager_talking_points.map(tp => 
      `${tp.topic}:\n${tp.talking_point}\nQuestions: ${tp.questions_to_ask?.join(', ')}`
    ).join('\n\n');
    navigator.clipboard.writeText(text);
    toast.success('Talking points copied');
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-600" />
            AI Coaching Suggestions
          </CardTitle>
          <Button
            size="sm"
            onClick={generateSuggestions}
            disabled={isGenerating}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : suggestions ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!suggestions && !isGenerating && (
          <div className="text-center py-8 text-slate-400">
            <Sparkles className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Generate personalized coaching insights</p>
          </div>
        )}

        {suggestions && (
          <Tabs defaultValue="agent" className="space-y-4">
            <TabsList className="w-full">
              <TabsTrigger value="agent" className="flex-1">For Agent</TabsTrigger>
              <TabsTrigger value="manager" className="flex-1">For Manager</TabsTrigger>
              <TabsTrigger value="goals" className="flex-1">Goals</TabsTrigger>
            </TabsList>

            <TabsContent value="agent" className="space-y-4">
              {/* Strengths */}
              {suggestions.strengths?.length > 0 && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <h4 className="text-sm font-medium text-emerald-800 mb-2 flex items-center gap-1">
                    <Award className="w-4 h-4" /> Strengths to Leverage
                  </h4>
                  <ul className="space-y-1">
                    {suggestions.strengths.map((strength, i) => (
                      <li key={i} className="text-xs text-emerald-700">• {strength}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Improvement Areas */}
              {suggestions.improvement_areas?.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <h4 className="text-sm font-medium text-amber-800 mb-2 flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" /> Areas for Improvement
                  </h4>
                  <div className="space-y-3">
                    {suggestions.improvement_areas.map((area, i) => (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-amber-700">{area.area}</span>
                          <span className="text-xs text-amber-600">
                            {area.current_score}% → {area.target_score}%
                          </span>
                        </div>
                        <ul className="space-y-0.5 ml-2">
                          {area.action_steps?.slice(0, 3).map((step, j) => (
                            <li key={j} className="text-xs text-amber-600">→ {step}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Agent Suggestions */}
              {suggestions.agent_suggestions?.length > 0 && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">Personalized Tips</h4>
                  <ul className="space-y-1">
                    {suggestions.agent_suggestions.map((tip, i) => (
                      <li key={i} className="text-xs text-blue-700">• {tip}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommended Training */}
              {suggestions.recommended_training?.length > 0 && (
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <h4 className="text-sm font-medium text-purple-800 mb-2 flex items-center gap-1">
                    <BookOpen className="w-4 h-4" /> Recommended Training
                  </h4>
                  <div className="space-y-2">
                    {suggestions.recommended_training.map((training, i) => (
                      <div key={i} className="flex items-start justify-between">
                        <div>
                          <p className="text-xs font-medium text-purple-700">{training.title}</p>
                          <p className="text-xs text-purple-600">{training.reason}</p>
                        </div>
                        <Badge variant="outline" className={
                          training.priority === 'high' ? 'bg-red-100 text-red-700' : 'bg-purple-100 text-purple-700'
                        }>
                          {training.priority}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="manager" className="space-y-4">
              {/* Manager Talking Points */}
              {suggestions.manager_talking_points?.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-slate-700 flex items-center gap-1">
                      <MessageSquare className="w-4 h-4" /> 1:1 Talking Points
                    </h4>
                    <Button size="sm" variant="ghost" onClick={copyTalkingPoints}>
                      <Copy className="w-4 h-4 mr-1" /> Copy
                    </Button>
                  </div>
                  {suggestions.manager_talking_points.map((tp, i) => (
                    <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                      <p className="text-sm font-medium text-slate-700 mb-1">{tp.topic}</p>
                      <p className="text-xs text-slate-600 mb-2">{tp.talking_point}</p>
                      {tp.questions_to_ask?.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-slate-500 mb-1">Questions to ask:</p>
                          <ul className="space-y-0.5">
                            {tp.questions_to_ask.map((q, j) => (
                              <li key={j} className="text-xs text-slate-600 italic">• {q}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="goals" className="space-y-4">
              {/* 90-Day Goals */}
              {suggestions.ninety_day_goals?.length > 0 && (
                <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg">
                  <h4 className="text-sm font-medium text-teal-800 mb-3 flex items-center gap-1">
                    <Target className="w-4 h-4" /> 90-Day Improvement Goals
                  </h4>
                  <div className="space-y-3">
                    {suggestions.ninety_day_goals.map((goal, i) => (
                      <div key={i} className="p-2 bg-white rounded border border-teal-100">
                        <p className="text-sm font-medium text-teal-700">{goal.goal}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-teal-600">
                          <Badge variant="outline" className="bg-teal-100 text-teal-700">
                            {goal.metric}
                          </Badge>
                          <span>Target: {goal.target}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}