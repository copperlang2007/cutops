import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Sparkles, Loader2, RefreshCw, BookOpen, Video, FileText, 
  ExternalLink, CheckCircle, Target, TrendingUp, Award
} from 'lucide-react';
import { toast } from 'sonner';

export default function AITrainingGenerator({ 
  agent, 
  metrics, 
  teamAverages,
  complianceIssues = [],
  coachingSuggestions = null 
}) {
  const [training, setTraining] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateTraining = async () => {
    setIsGenerating(true);
    try {
      // Identify weaknesses
      const weakAreas = [];
      if (metrics.onboarding < teamAverages.onboarding) weakAreas.push('onboarding completion');
      if (metrics.licenses < teamAverages.licenses) weakAreas.push('license compliance');
      if (metrics.contracts < teamAverages.contracts) weakAreas.push('contract acquisition');
      if (metrics.tasks < teamAverages.tasks) weakAreas.push('task management');

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate personalized training materials and resources for this insurance agent:

AGENT: ${agent.first_name} ${agent.last_name}
STATUS: ${agent.onboarding_status}
STATE: ${agent.state || 'Not specified'}

PERFORMANCE METRICS:
- Overall Score: ${metrics.overall}% (Team Avg: ${teamAverages.overall}%)
- Onboarding: ${metrics.onboarding}% (Team Avg: ${teamAverages.onboarding}%)
- Licenses: ${metrics.licenses}% (Team Avg: ${teamAverages.licenses}%)
- Contracts: ${metrics.contracts}% (Team Avg: ${teamAverages.contracts}%)
- Tasks: ${metrics.tasks}% (Team Avg: ${teamAverages.tasks}%)

IDENTIFIED WEAK AREAS: ${weakAreas.join(', ') || 'None'}

COMPLIANCE ISSUES: ${complianceIssues.length > 0 ? complianceIssues.map(i => i.message).join(', ') : 'None'}

${coachingSuggestions ? `COACHING INSIGHTS: ${JSON.stringify(coachingSuggestions.improvement_areas || [])}` : ''}

Generate:
1. Targeted learning modules based on weak areas
2. Best practice guides relevant to their situation
3. Industry articles and resources
4. Quick reference materials
5. Video/webinar recommendations
6. Certification courses if needed
7. Weekly learning plan`,
        response_json_schema: {
          type: "object",
          properties: {
            learning_modules: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  duration: { type: "string" },
                  priority: { type: "string" },
                  topics: { type: "array", items: { type: "string" } },
                  learning_objectives: { type: "array", items: { type: "string" } }
                }
              }
            },
            best_practices: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  content: { type: "string" },
                  tips: { type: "array", items: { type: "string" } }
                }
              }
            },
            recommended_articles: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  topic: { type: "string" },
                  relevance: { type: "string" }
                }
              }
            },
            video_resources: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  duration: { type: "string" }
                }
              }
            },
            certifications: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  provider: { type: "string" },
                  priority: { type: "string" },
                  reason: { type: "string" }
                }
              }
            },
            weekly_plan: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  week: { type: "number" },
                  focus: { type: "string" },
                  activities: { type: "array", items: { type: "string" } },
                  goals: { type: "array", items: { type: "string" } }
                }
              }
            },
            quick_wins: { type: "array", items: { type: "string" } }
          }
        }
      });

      setTraining(result);
      toast.success('Training plan generated');
    } catch (err) {
      console.error('Failed to generate training:', err);
      toast.error('Failed to generate training materials');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            AI Training Generator
          </CardTitle>
          <Button
            size="sm"
            onClick={generateTraining}
            disabled={isGenerating}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : training ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Regenerate
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Plan
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!training && !isGenerating && (
          <div className="text-center py-8 text-slate-400">
            <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Generate personalized training based on performance data</p>
          </div>
        )}

        {training && (
          <Tabs defaultValue="modules" className="space-y-4">
            <TabsList className="w-full grid grid-cols-4">
              <TabsTrigger value="modules">Modules</TabsTrigger>
              <TabsTrigger value="resources">Resources</TabsTrigger>
              <TabsTrigger value="plan">Weekly Plan</TabsTrigger>
              <TabsTrigger value="certs">Certifications</TabsTrigger>
            </TabsList>

            <TabsContent value="modules" className="space-y-4">
              {/* Quick Wins */}
              {training.quick_wins?.length > 0 && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <h4 className="text-sm font-medium text-emerald-800 mb-2 flex items-center gap-1">
                    <Award className="w-4 h-4" /> Quick Wins
                  </h4>
                  <ul className="space-y-1">
                    {training.quick_wins.map((win, i) => (
                      <li key={i} className="text-xs text-emerald-700 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> {win}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Learning Modules */}
              {training.learning_modules?.map((module, i) => (
                <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="text-sm font-medium text-slate-800">{module.title}</h4>
                      <p className="text-xs text-slate-500">{module.duration}</p>
                    </div>
                    <Badge variant="outline" className={
                      module.priority === 'high' ? 'bg-red-100 text-red-700' :
                      module.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                      'bg-slate-100'
                    }>
                      {module.priority}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-600 mb-2">{module.description}</p>
                  {module.learning_objectives?.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-slate-700 mb-1">Learning Objectives:</p>
                      <ul className="space-y-0.5">
                        {module.learning_objectives.map((obj, j) => (
                          <li key={j} className="text-xs text-slate-600">• {obj}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}

              {/* Best Practices */}
              {training.best_practices?.map((practice, i) => (
                <div key={i} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-800 mb-1">{practice.title}</h4>
                  <p className="text-xs text-blue-700 mb-2">{practice.content}</p>
                  {practice.tips?.length > 0 && (
                    <ul className="space-y-0.5">
                      {practice.tips.map((tip, j) => (
                        <li key={j} className="text-xs text-blue-600">💡 {tip}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </TabsContent>

            <TabsContent value="resources" className="space-y-4">
              {/* Video Resources */}
              {training.video_resources?.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
                    <Video className="w-4 h-4" /> Recommended Videos
                  </h4>
                  <div className="space-y-2">
                    {training.video_resources.map((video, i) => (
                      <div key={i} className="p-2 bg-slate-50 rounded border flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium text-slate-700">{video.title}</p>
                          <p className="text-xs text-slate-500">{video.duration}</p>
                        </div>
                        <Button size="sm" variant="ghost" className="h-6">
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Articles */}
              {training.recommended_articles?.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
                    <FileText className="w-4 h-4" /> Recommended Reading
                  </h4>
                  <div className="space-y-2">
                    {training.recommended_articles.map((article, i) => (
                      <div key={i} className="p-2 bg-slate-50 rounded border">
                        <p className="text-xs font-medium text-slate-700">{article.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-[10px]">{article.topic}</Badge>
                          <span className="text-xs text-slate-500">{article.relevance}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="plan" className="space-y-4">
              {training.weekly_plan?.map((week, i) => (
                <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-indigo-100 text-indigo-700">Week {week.week}</Badge>
                    <span className="text-sm font-medium text-slate-700">{week.focus}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs font-medium text-slate-600 mb-1">Activities:</p>
                      <ul className="space-y-0.5">
                        {week.activities?.map((activity, j) => (
                          <li key={j} className="text-xs text-slate-600">• {activity}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-600 mb-1">Goals:</p>
                      <ul className="space-y-0.5">
                        {week.goals?.map((goal, j) => (
                          <li key={j} className="text-xs text-slate-600 flex items-center gap-1">
                            <Target className="w-3 h-3 text-indigo-500" /> {goal}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="certs" className="space-y-3">
              {training.certifications?.length > 0 ? (
                training.certifications.map((cert, i) => (
                  <div key={i} className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-purple-800">{cert.name}</p>
                        <p className="text-xs text-purple-600">Provider: {cert.provider}</p>
                      </div>
                      <Badge variant="outline" className={
                        cert.priority === 'required' ? 'bg-red-100 text-red-700' :
                        cert.priority === 'recommended' ? 'bg-amber-100 text-amber-700' :
                        'bg-purple-100 text-purple-700'
                      }>
                        {cert.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-purple-700 mt-1">{cert.reason}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-400 text-center py-4">No additional certifications recommended</p>
              )}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}