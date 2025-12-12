import { useState } from 'react'
import { base44 } from '@/api/base44Client'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Sparkles, Loader2, RefreshCw, FileText, CheckSquare, 
  AlertTriangle, BookOpen, Target
} from 'lucide-react';

export default function AIOnboardingAssistant({ 
  agent, 
  checklistItems = [], 
  documents = [],
  licenses = [],
  onCreateChecklist,
  onCreateTask
}) {
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeOnboarding = async () => {
    setIsAnalyzing(true);
    try {
      const completedItems = checklistItems.filter(c => c.is_completed);
      const incompleteItems = checklistItems.filter(c => !c.is_completed);
      
      const documentTypes = documents.map(d => d.document_type);
      const licenseStates = licenses.map(l => l.state);

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this agent's onboarding status and identify gaps:

AGENT INFO:
- Name: ${agent.first_name} ${agent.last_name}
- Status: ${agent.onboarding_status}
- State: ${agent.state || 'Not specified'}
- NPN: ${agent.npn}

ONBOARDING PROGRESS:
- Completed Items: ${completedItems.length}
- Incomplete Items: ${incompleteItems.length}
- Incomplete: ${incompleteItems.map(i => i.item_name).join(', ') || 'None'}

DOCUMENTS ON FILE:
${documentTypes.join(', ') || 'No documents'}

LICENSES:
${licenseStates.join(', ') || 'No licenses'}

For a Medicare Advantage agent, identify:
1. Missing required documents based on their profile
2. Missing checklist items that should be added
3. Suggested tasks for the agent
4. Suggested tasks for the manager
5. Recommended training or resources
6. Priority actions to complete onboarding`,
        response_json_schema: {
          type: "object",
          properties: {
            missing_documents: { 
              type: "array", 
              items: { 
                type: "object",
                properties: {
                  type: { type: "string" },
                  reason: { type: "string" },
                  priority: { type: "string" }
                }
              }
            },
            suggested_checklist_items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  category: { type: "string" }
                }
              }
            },
            agent_tasks: { type: "array", items: { type: "string" } },
            manager_tasks: { type: "array", items: { type: "string" } },
            recommended_training: { type: "array", items: { type: "string" } },
            priority_actions: { type: "array", items: { type: "string" } },
            estimated_completion_days: { type: "number" }
          }
        }
      });

      setAnalysis(result);
    } catch (err) {
      console.error('Analysis failed:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCreateChecklists = () => {
    if (analysis?.suggested_checklist_items && onCreateChecklist) {
      onCreateChecklist(analysis.suggested_checklist_items);
    }
  };

  const handleCreateTasks = (tasks, type) => {
    if (onCreateTask) {
      tasks.forEach(taskTitle => {
        onCreateTask({
          title: taskTitle,
          task_type: 'onboarding',
          priority: 'medium',
          agent_id: agent.id
        });
      });
    }
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            AI Onboarding Assistant
          </CardTitle>
          <Button
            size="sm"
            onClick={analyzeOnboarding}
            disabled={isAnalyzing}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : analysis ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Re-analyze
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Analyze Gaps
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!analysis && !isAnalyzing && (
          <div className="text-center py-8 text-slate-400">
            <Sparkles className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Analyze to identify missing documents and onboarding gaps</p>
          </div>
        )}

        {analysis && (
          <div className="space-y-4">
            {/* Estimated Completion */}
            {analysis.estimated_completion_days && (
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-center">
                <p className="text-sm text-purple-700">
                  Estimated time to complete: <span className="font-bold">{analysis.estimated_completion_days} days</span>
                </p>
              </div>
            )}

            {/* Missing Documents */}
            {analysis.missing_documents?.length > 0 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="text-sm font-medium text-red-800 mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Missing Documents
                </h4>
                <div className="space-y-2">
                  {analysis.missing_documents.map((doc, i) => (
                    <div key={i} className="flex items-start justify-between text-xs">
                      <div>
                        <p className="font-medium text-red-700">{doc.type}</p>
                        <p className="text-red-600">{doc.reason}</p>
                      </div>
                      <Badge variant="outline" className={
                        doc.priority === 'high' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                      }>
                        {doc.priority}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Suggested Checklist Items */}
            {analysis.suggested_checklist_items?.length > 0 && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-blue-800 flex items-center gap-2">
                    <CheckSquare className="w-4 h-4" /> Suggested Checklist Items
                  </h4>
                  {onCreateChecklist && (
                    <Button size="sm" variant="outline" className="text-xs h-7" onClick={handleCreateChecklists}>
                      Add All
                    </Button>
                  )}
                </div>
                <ul className="space-y-1">
                  {analysis.suggested_checklist_items.map((item, i) => (
                    <li key={i} className="text-xs text-blue-700 flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] bg-blue-100">{item.category}</Badge>
                      {item.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Priority Actions */}
            {analysis.priority_actions?.length > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <h4 className="text-sm font-medium text-amber-800 mb-2 flex items-center gap-2">
                  <Target className="w-4 h-4" /> Priority Actions
                </h4>
                <ol className="space-y-1 list-decimal list-inside">
                  {analysis.priority_actions.map((action, i) => (
                    <li key={i} className="text-xs text-amber-700">{action}</li>
                  ))}
                </ol>
              </div>
            )}

            {/* Recommended Training */}
            {analysis.recommended_training?.length > 0 && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                <h4 className="text-sm font-medium text-emerald-800 mb-2 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" /> Recommended Training
                </h4>
                <ul className="space-y-1">
                  {analysis.recommended_training.map((training, i) => (
                    <li key={i} className="text-xs text-emerald-700">• {training}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Tasks */}
            <div className="grid grid-cols-2 gap-3">
              {analysis.agent_tasks?.length > 0 && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-medium text-slate-700">Agent Tasks</h4>
                    {onCreateTask && (
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-[10px] h-6"
                        onClick={() => handleCreateTasks(analysis.agent_tasks, 'agent')}
                      >
                        Create
                      </Button>
                    )}
                  </div>
                  <ul className="space-y-1">
                    {analysis.agent_tasks.slice(0, 3).map((task, i) => (
                      <li key={i} className="text-[11px] text-slate-600">• {task}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {analysis.manager_tasks?.length > 0 && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-medium text-slate-700">Manager Tasks</h4>
                    {onCreateTask && (
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-[10px] h-6"
                        onClick={() => handleCreateTasks(analysis.manager_tasks, 'manager')}
                      >
                        Create
                      </Button>
                    )}
                  </div>
                  <ul className="space-y-1">
                    {analysis.manager_tasks.slice(0, 3).map((task, i) => (
                      <li key={i} className="text-[11px] text-slate-600">• {task}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}