import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plug, RefreshCw, CheckCircle, AlertTriangle, Clock,
  DollarSign, FileText, GraduationCap, Users, Loader2,
  Link2, Sparkles, Target, BookOpen, Play
} from 'lucide-react';
import { format, addDays } from 'date-fns';
import { toast } from 'sonner';

const CARRIERS = [
  { id: 'humana', name: 'Humana', logo: '🏥', color: 'bg-green-500' },
  { id: 'uhc', name: 'UnitedHealthcare', logo: '💙', color: 'bg-blue-500' },
  { id: 'aetna', name: 'Aetna', logo: '❤️', color: 'bg-purple-500' },
  { id: 'cigna', name: 'Cigna', logo: '🧡', color: 'bg-orange-500' },
  { id: 'anthem', name: 'Anthem BCBS', logo: '💜', color: 'bg-indigo-500' }
];

export default function SmartCarrierIntegration({ 
  agent, 
  licenses, 
  contracts, 
  coachingWeaknesses,
  onCreateTask 
}) {
  const [connectedCarriers] = useState(['humana', 'uhc', 'aetna']);
  const [trainingRecommendations, setTrainingRecommendations] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [carrierTraining, setCarrierTraining] = useState({});
  const [isSyncing, setIsSyncing] = useState({});

  const syncCarrierTraining = async (carrierId) => {
    setIsSyncing(prev => ({ ...prev, [carrierId]: true }));
    try {
      const carrier = CARRIERS.find(c => c.id === carrierId);
      const agentContracts = contracts.filter(c => 
        c.carrier_name?.toLowerCase().includes(carrierId) && 
        ['active', 'contract_signed'].includes(c.contract_status)
      );
      const agentLicenses = licenses.filter(l => l.status === 'active');

      // Simulate fetching training from carrier API
      await new Promise(resolve => setTimeout(resolve, 1500));

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate realistic carrier training catalog for ${carrier.name}:

AGENT PROFILE:
- Name: ${agent?.first_name} ${agent?.last_name}
- Licensed States: ${agentLicenses.map(l => l.state).join(', ') || 'None'}
- Active Contracts: ${agentContracts.length}

Generate a list of 8-12 training modules that ${carrier.name} would offer, including:
1. Annual certification requirements (AHIP, carrier-specific)
2. Product-specific training (MA, PDP, Supplement)
3. Compliance courses
4. Sales technique modules
5. State-specific requirements

For each, indicate if it's required or optional, the deadline if any, and estimated duration.`,
        response_json_schema: {
          type: "object",
          properties: {
            training_modules: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  title: { type: "string" },
                  category: { type: "string" },
                  description: { type: "string" },
                  duration_minutes: { type: "number" },
                  is_required: { type: "boolean" },
                  deadline: { type: "string" },
                  completion_status: { type: "string" },
                  states_applicable: { type: "array", items: { type: "string" } },
                  url: { type: "string" }
                }
              }
            },
            certification_status: {
              type: "object",
              properties: {
                ahip_current: { type: "boolean" },
                carrier_cert_current: { type: "boolean" },
                compliance_current: { type: "boolean" },
                next_deadline: { type: "string" }
              }
            }
          }
        }
      });

      setCarrierTraining(prev => ({ ...prev, [carrierId]: result }));
      toast.success(`${carrier.name} training synced`);
    } catch (err) {
      toast.error('Failed to sync training');
    } finally {
      setIsSyncing(prev => ({ ...prev, [carrierId]: false }));
    }
  };

  const generatePersonalizedRecommendations = async () => {
    setIsAnalyzing(true);
    try {
      // Aggregate all training from connected carriers
      const allTraining = Object.entries(carrierTraining).flatMap(([carrierId, data]) => {
        const carrier = CARRIERS.find(c => c.id === carrierId);
        return (data?.training_modules || []).map(m => ({ ...m, carrier: carrier?.name }));
      });

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze agent data and recommend specific training:

AGENT: ${agent?.first_name} ${agent?.last_name}
STATUS: ${agent?.onboarding_status}
LICENSED STATES: ${licenses.filter(l => l.status === 'active').map(l => l.state).join(', ') || 'None'}
ACTIVE CONTRACTS: ${contracts.filter(c => ['active', 'contract_signed'].includes(c.contract_status)).map(c => c.carrier_name).join(', ') || 'None'}

COACHING IDENTIFIED WEAKNESSES:
${coachingWeaknesses?.join('\n') || 'No specific weaknesses identified'}

AVAILABLE TRAINING MODULES:
${allTraining.slice(0, 20).map(m => `- ${m.carrier}: ${m.title} (${m.category}, ${m.is_required ? 'Required' : 'Optional'}, ${m.duration_minutes}min)`).join('\n')}

Based on:
1. The agent's identified weaknesses from coaching
2. Their license states and contracts
3. Required certifications approaching deadline
4. Performance improvement opportunities

Recommend specific training modules in priority order. For each, explain WHY it's recommended and the expected impact. Also identify any critical deadlines that need task creation.`,
        response_json_schema: {
          type: "object",
          properties: {
            priority_recommendations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  training_title: { type: "string" },
                  carrier: { type: "string" },
                  reason: { type: "string" },
                  addresses_weakness: { type: "string" },
                  expected_impact: { type: "string" },
                  priority: { type: "string" },
                  deadline: { type: "string" },
                  create_task: { type: "boolean" },
                  estimated_completion: { type: "string" }
                }
              }
            },
            critical_deadlines: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  item: { type: "string" },
                  deadline: { type: "string" },
                  consequence: { type: "string" },
                  action_needed: { type: "string" }
                }
              }
            },
            learning_path: {
              type: "object",
              properties: {
                week_1: { type: "array", items: { type: "string" } },
                week_2: { type: "array", items: { type: "string" } },
                week_3: { type: "array", items: { type: "string" } },
                week_4: { type: "array", items: { type: "string" } }
              }
            },
            skill_gaps: { type: "array", items: { type: "string" } }
          }
        }
      });

      setTrainingRecommendations(result);
      toast.success('Personalized recommendations generated');
    } catch (err) {
      toast.error('Failed to generate recommendations');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const createTrainingTask = async (recommendation) => {
    await onCreateTask?.({
      title: `Complete Training: ${recommendation.training_title}`,
      description: `Carrier: ${recommendation.carrier}\nReason: ${recommendation.reason}\nExpected Impact: ${recommendation.expected_impact}`,
      task_type: 'other',
      priority: recommendation.priority === 'critical' ? 'urgent' : recommendation.priority === 'high' ? 'high' : 'medium',
      agent_id: agent?.id,
      due_date: recommendation.deadline || addDays(new Date(), 14).toISOString().split('T')[0],
      auto_generated: true
    });
    toast.success('Training task created');
  };

  const createAllCriticalTasks = async () => {
    const critical = trainingRecommendations?.priority_recommendations?.filter(r => r.create_task) || [];
    for (const rec of critical) {
      await createTrainingTask(rec);
    }
    toast.success(`Created ${critical.length} training tasks`);
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-purple-600" />
            Smart Carrier Training Integration
          </CardTitle>
          <Button
            size="sm"
            onClick={generatePersonalizedRecommendations}
            disabled={isAnalyzing || Object.keys(carrierTraining).length === 0}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span className="ml-1">AI Recommend</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="carriers">
          <TabsList className="mb-4">
            <TabsTrigger value="carriers">Carrier Training</TabsTrigger>
            <TabsTrigger value="recommendations">
              AI Recommendations
              {trainingRecommendations && <Badge className="ml-1 text-xs">!</Badge>}
            </TabsTrigger>
            <TabsTrigger value="path">Learning Path</TabsTrigger>
          </TabsList>

          <TabsContent value="carriers">
            <div className="space-y-3">
              {CARRIERS.filter(c => connectedCarriers.includes(c.id)).map(carrier => (
                <div key={carrier.id} className="p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{carrier.logo}</span>
                      <span className="font-medium">{carrier.name}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => syncCarrierTraining(carrier.id)}
                      disabled={isSyncing[carrier.id]}
                    >
                      {isSyncing[carrier.id] ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                      <span className="ml-1">Sync Training</span>
                    </Button>
                  </div>

                  {carrierTraining[carrier.id] && (
                    <div className="space-y-2">
                      {/* Certification Status */}
                      <div className="flex gap-2 flex-wrap">
                        <Badge className={carrierTraining[carrier.id].certification_status?.ahip_current ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}>
                          AHIP: {carrierTraining[carrier.id].certification_status?.ahip_current ? 'Current' : 'Needed'}
                        </Badge>
                        <Badge className={carrierTraining[carrier.id].certification_status?.carrier_cert_current ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}>
                          Carrier Cert: {carrierTraining[carrier.id].certification_status?.carrier_cert_current ? 'Current' : 'Needed'}
                        </Badge>
                      </div>

                      {/* Training Modules */}
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {carrierTraining[carrier.id].training_modules?.slice(0, 5).map((module, i) => (
                          <div key={i} className="flex items-center justify-between p-2 bg-white rounded border">
                            <div className="flex items-center gap-2">
                              <BookOpen className="w-3 h-3 text-slate-400" />
                              <span className="text-xs">{module.title}</span>
                              {module.is_required && (
                                <Badge className="text-[10px] bg-red-100 text-red-700">Required</Badge>
                              )}
                            </div>
                            <span className="text-xs text-slate-500">{module.duration_minutes}min</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="recommendations">
            {trainingRecommendations ? (
              <div className="space-y-4">
                {/* Critical Deadlines */}
                {trainingRecommendations.critical_deadlines?.length > 0 && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-red-800 flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4" />
                        Critical Deadlines
                      </h4>
                      <Button size="sm" variant="outline" className="h-6 text-xs" onClick={createAllCriticalTasks}>
                        Create All Tasks
                      </Button>
                    </div>
                    {trainingRecommendations.critical_deadlines.map((deadline, i) => (
                      <div key={i} className="text-xs text-red-700 mb-1">
                        • <strong>{deadline.item}</strong> - {deadline.deadline}: {deadline.action_needed}
                      </div>
                    ))}
                  </div>
                )}

                {/* Priority Recommendations */}
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {trainingRecommendations.priority_recommendations?.map((rec, i) => (
                    <div key={i} className={`p-2 rounded-lg border ${
                      rec.priority === 'critical' ? 'bg-red-50 border-red-200' :
                      rec.priority === 'high' ? 'bg-orange-50 border-orange-200' :
                      'bg-blue-50 border-blue-200'
                    }`}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{rec.training_title}</span>
                          <Badge variant="outline" className="text-[10px]">{rec.carrier}</Badge>
                        </div>
                        <Badge className={
                          rec.priority === 'critical' ? 'bg-red-100 text-red-700' :
                          rec.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                          'bg-blue-100 text-blue-700'
                        }>{rec.priority}</Badge>
                      </div>
                      <p className="text-xs text-slate-600 mb-1">{rec.reason}</p>
                      {rec.addresses_weakness && (
                        <p className="text-xs text-purple-600">Addresses: {rec.addresses_weakness}</p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-slate-500">Impact: {rec.expected_impact}</span>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-6 text-xs"
                          onClick={() => createTrainingTask(rec)}
                        >
                          <Play className="w-3 h-3 mr-1" />
                          Create Task
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Skill Gaps */}
                {trainingRecommendations.skill_gaps?.length > 0 && (
                  <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <h4 className="text-sm font-medium text-purple-800 mb-1">Identified Skill Gaps</h4>
                    <div className="flex flex-wrap gap-1">
                      {trainingRecommendations.skill_gaps.map((gap, i) => (
                        <Badge key={i} variant="outline" className="text-xs bg-purple-100 text-purple-700">
                          {gap}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-400 text-center py-6">
                Sync carrier training first, then click "AI Recommend" for personalized suggestions
              </p>
            )}
          </TabsContent>

          <TabsContent value="path">
            {trainingRecommendations?.learning_path ? (
              <div className="space-y-3">
                {Object.entries(trainingRecommendations.learning_path).map(([week, items], i) => (
                  <div key={week} className="p-3 bg-slate-50 rounded-lg">
                    <h4 className="text-sm font-medium text-slate-700 mb-2">Week {i + 1}</h4>
                    <ul className="space-y-1">
                      {items?.map((item, j) => (
                        <li key={j} className="text-xs text-slate-600 flex items-center gap-2">
                          <CheckCircle className="w-3 h-3 text-slate-400" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 text-center py-6">
                Generate recommendations to see your personalized learning path
              </p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}