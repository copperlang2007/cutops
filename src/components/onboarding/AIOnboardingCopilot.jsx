import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Sparkles, Loader2, Send, Bot, User, CheckCircle2, 
  AlertTriangle, Clock, Zap, Target, MessageSquare, 
  ListTodo, Flag, ArrowRight, RefreshCw, Brain,
  FileText, Shield, Award, GraduationCap, Building2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, differenceInDays } from 'date-fns';

const ONBOARDING_STAGES = {
  initial_setup: { order: 1, label: 'Initial Setup', items: ['w9_form', 'direct_deposit', 'id_verification'] },
  licensing: { order: 2, label: 'Licensing', items: ['state_license', 'nipr_verification'] },
  compliance: { order: 3, label: 'Compliance', items: ['background_check', 'eo_certificate'] },
  certifications: { order: 4, label: 'Certifications', items: ['ahip_certification', 'compliance_training'] },
  contracting: { order: 5, label: 'Contracting', items: ['carrier_certifications', 'initial_contract'] }
};

const STALL_THRESHOLD_DAYS = 7;

export default function AIOnboardingCopilot({ 
  agent, 
  checklistItems = [], 
  documents = [],
  licenses = [],
  contracts = [],
  appointments = [],
  onCreateTask,
  onCreateChecklist,
  onUpdateAgent
}) {
  const [activeTab, setActiveTab] = useState('guide');
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [stalledAnalysis, setStalledAnalysis] = useState(null);
  const [guidanceData, setGuidanceData] = useState(null);
  const [autoTasks, setAutoTasks] = useState([]);
  const [isGeneratingTasks, setIsGeneratingTasks] = useState(false);
  const chatEndRef = useRef(null);

  const completedItems = checklistItems.filter(c => c.is_completed);
  const incompleteItems = checklistItems.filter(c => !c.is_completed);
  const progressPercent = checklistItems.length > 0 
    ? Math.round((completedItems.length / checklistItems.length) * 100) 
    : 0;

  // Determine current stage
  const getCurrentStage = () => {
    for (const [stageKey, stage] of Object.entries(ONBOARDING_STAGES).sort((a, b) => a[1].order - b[1].order)) {
      const stageItems = checklistItems.filter(c => stage.items.some(i => c.item_key?.includes(i)));
      const incomplete = stageItems.filter(c => !c.is_completed);
      if (incomplete.length > 0) return { key: stageKey, ...stage, incomplete };
    }
    return null;
  };

  const currentStage = getCurrentStage();

  // Check for stalled onboarding
  useEffect(() => {
    checkForStalledOnboarding();
  }, [checklistItems, agent]);

  const checkForStalledOnboarding = async () => {
    if (!agent || checklistItems.length === 0) return;

    const daysSinceCreation = differenceInDays(new Date(), new Date(agent.created_date));
    const lastCompletedItem = completedItems.sort((a, b) => 
      new Date(b.completed_date) - new Date(a.completed_date)
    )[0];
    
    const daysSinceLastProgress = lastCompletedItem 
      ? differenceInDays(new Date(), new Date(lastCompletedItem.completed_date))
      : daysSinceCreation;

    if (daysSinceLastProgress >= STALL_THRESHOLD_DAYS && progressPercent < 100) {
      await analyzeStall(daysSinceLastProgress, daysSinceCreation);
    }
  };

  const analyzeStall = async (daysSinceProgress, daysSinceCreation) => {
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this stalled agent onboarding and provide insights:

AGENT: ${agent.first_name} ${agent.last_name}
STATUS: ${agent.onboarding_status}
STATE: ${agent.state || 'Not specified'}
CREATED: ${daysSinceCreation} days ago
DAYS SINCE LAST PROGRESS: ${daysSinceProgress} days

PROGRESS: ${progressPercent}% complete (${completedItems.length}/${checklistItems.length})

COMPLETED ITEMS:
${completedItems.map(c => `- ${c.item_name}`).join('\n') || 'None'}

INCOMPLETE ITEMS:
${incompleteItems.map(c => `- ${c.item_name}`).join('\n')}

DOCUMENTS ON FILE: ${documents.length}
LICENSES: ${licenses.length}
CONTRACTS: ${contracts.length}

Analyze why onboarding might be stalled and provide:
1. Most likely reasons for the stall (be specific)
2. Recommended next steps for the manager
3. Suggested outreach message to the agent
4. Risk level (low, medium, high, critical)
5. Estimated effort to unblock (hours)`,
        response_json_schema: {
          type: "object",
          properties: {
            stall_reasons: { type: "array", items: { type: "string" } },
            manager_actions: { type: "array", items: { type: "string" } },
            outreach_message: { type: "string" },
            risk_level: { type: "string" },
            estimated_unblock_hours: { type: "number" },
            blocking_items: { type: "array", items: { type: "string" } }
          }
        }
      });
      
      setStalledAnalysis({
        ...result,
        daysSinceProgress,
        daysSinceCreation
      });
    } catch (err) {
      console.error('Stall analysis failed:', err);
    }
  };

  // Generate proactive guidance
  const generateGuidance = async () => {
    setIsProcessing(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an onboarding assistant for Medicare Advantage insurance agents. 
Generate personalized guidance for this agent:

AGENT PROFILE:
- Name: ${agent.first_name} ${agent.last_name}
- Status: ${agent.onboarding_status}
- State: ${agent.state || 'Not specified'}
- NPN: ${agent.npn}

CURRENT PROGRESS: ${progressPercent}%
CURRENT STAGE: ${currentStage?.label || 'Completed'}

COMPLETED STEPS:
${completedItems.map(c => `✓ ${c.item_name}`).join('\n') || 'None yet'}

NEXT STEPS NEEDED:
${incompleteItems.slice(0, 5).map(c => `○ ${c.item_name}`).join('\n')}

DOCUMENTS: ${documents.length} uploaded
LICENSES: ${licenses.map(l => l.state).join(', ') || 'None'}
CONTRACTS: ${contracts.length}

Provide:
1. A personalized welcome/progress message
2. The immediate next action they should take
3. Why this action is important
4. Any tips or resources that would help
5. Estimated time to complete current stage`,
        response_json_schema: {
          type: "object",
          properties: {
            welcome_message: { type: "string" },
            next_action: { type: "string" },
            action_importance: { type: "string" },
            tips: { type: "array", items: { type: "string" } },
            resources: { type: "array", items: { type: "string" } },
            estimated_stage_completion: { type: "string" },
            encouragement: { type: "string" }
          }
        }
      });
      
      setGuidanceData(result);
    } catch (err) {
      console.error('Guidance generation failed:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Auto-generate onboarding tasks
  const generateAutoTasks = async () => {
    setIsGeneratingTasks(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate specific onboarding tasks for this Medicare Advantage agent:

AGENT: ${agent.first_name} ${agent.last_name}
STATE: ${agent.state || 'Not specified'}
STATUS: ${agent.onboarding_status}
PROGRESS: ${progressPercent}%

INCOMPLETE CHECKLIST ITEMS:
${incompleteItems.map(c => `- ${c.item_name} (${c.category})`).join('\n')}

DOCUMENTS UPLOADED: ${documents.map(d => d.document_type).join(', ') || 'None'}
LICENSES: ${licenses.map(l => `${l.state} - ${l.status}`).join(', ') || 'None'}

Generate actionable tasks that will move this agent toward completion. For each task include:
- Clear title
- Description with specific instructions
- Priority (urgent, high, medium, low)
- Assignee type (agent, manager, compliance)
- Due days from now
- Related checklist item if applicable`,
        response_json_schema: {
          type: "object",
          properties: {
            tasks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  priority: { type: "string" },
                  assignee_type: { type: "string" },
                  due_days: { type: "number" },
                  related_checklist: { type: "string" },
                  task_type: { type: "string" }
                }
              }
            }
          }
        }
      });
      
      setAutoTasks(result.tasks || []);
    } catch (err) {
      console.error('Task generation failed:', err);
    } finally {
      setIsGeneratingTasks(false);
    }
  };

  // Create task from auto-generated
  const handleCreateTask = async (task) => {
    if (onCreateTask) {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + (task.due_days || 7));
      
      await onCreateTask({
        title: task.title,
        description: task.description,
        priority: task.priority,
        task_type: task.task_type || 'onboarding',
        agent_id: agent.id,
        due_date: dueDate.toISOString().split('T')[0],
        auto_generated: true
      });
      
      // Remove from list
      setAutoTasks(prev => prev.filter(t => t.title !== task.title));
    }
  };

  // Chat with AI assistant
  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || isProcessing) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsProcessing(true);

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a helpful onboarding assistant for Medicare Advantage insurance agents.

AGENT CONTEXT:
- Name: ${agent.first_name} ${agent.last_name}
- State: ${agent.state || 'Not specified'}
- Status: ${agent.onboarding_status}
- Progress: ${progressPercent}%
- Incomplete items: ${incompleteItems.map(c => c.item_name).join(', ')}

CONVERSATION HISTORY:
${chatMessages.slice(-5).map(m => `${m.role}: ${m.content}`).join('\n')}

USER QUESTION: ${userMessage}

Provide a helpful, friendly response. If the question is about:
- Documents: Explain what's needed and how to obtain it
- Licensing: Guide them on state requirements and NIPR
- AHIP: Explain the certification process
- Carriers: Explain the contracting process
- Timeline: Give realistic estimates
- General questions: Be helpful and supportive

Keep response concise but thorough. Use bullet points for lists.`,
        response_json_schema: {
          type: "object",
          properties: {
            response: { type: "string" },
            suggested_actions: { type: "array", items: { type: "string" } },
            related_resources: { type: "array", items: { type: "string" } }
          }
        }
      });

      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        content: result.response,
        actions: result.suggested_actions,
        resources: result.related_resources
      }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "I apologize, but I encountered an error. Please try again."
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Initial guidance load
  useEffect(() => {
    if (agent && !guidanceData) {
      generateGuidance();
    }
  }, [agent?.id]);

  const riskColors = {
    low: 'bg-green-100 text-green-700 border-green-200',
    medium: 'bg-amber-100 text-amber-700 border-amber-200',
    high: 'bg-orange-100 text-orange-700 border-orange-200',
    critical: 'bg-red-100 text-red-700 border-red-200'
  };

  const priorityColors = {
    urgent: 'bg-red-100 text-red-700',
    high: 'bg-orange-100 text-orange-700',
    medium: 'bg-amber-100 text-amber-700',
    low: 'bg-slate-100 text-slate-600'
  };

  return (
    <Card className="border-0 shadow-premium overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-emerald-900 via-green-950 to-black text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center"
            >
              <Brain className="w-5 h-5" />
            </motion.div>
            <div>
              <CardTitle className="text-lg">AI Onboarding Copilot</CardTitle>
              <p className="text-violet-200 text-sm">Intelligent guidance for {agent?.first_name}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{progressPercent}%</div>
            <div className="text-xs text-violet-200">Complete</div>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-violet-200">Onboarding Progress</span>
            <span className="text-white font-medium">{completedItems.length}/{checklistItems.length} steps</span>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-white rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>
      </CardHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start border-b rounded-none bg-slate-50 px-4">
          <TabsTrigger value="guide" className="data-[state=active]:bg-white">
            <Target className="w-4 h-4 mr-2" />
            Guide
          </TabsTrigger>
          <TabsTrigger value="tasks" className="data-[state=active]:bg-white">
            <ListTodo className="w-4 h-4 mr-2" />
            Auto Tasks
            {autoTasks.length > 0 && (
              <Badge className="ml-2 bg-purple-100 text-purple-700">{autoTasks.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="chat" className="data-[state=active]:bg-white">
            <MessageSquare className="w-4 h-4 mr-2" />
            Ask AI
          </TabsTrigger>
          <TabsTrigger value="alerts" className="data-[state=active]:bg-white">
            <Flag className="w-4 h-4 mr-2" />
            Stall Alerts
            {stalledAnalysis && (
              <Badge className={`ml-2 ${riskColors[stalledAnalysis.risk_level]}`}>!</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <CardContent className="p-4">
          {/* Guide Tab */}
          <TabsContent value="guide" className="mt-0 space-y-4">
            {isProcessing && !guidanceData ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
              </div>
            ) : guidanceData ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Welcome Message */}
                <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-100">
                  <p className="text-slate-700">{guidanceData.welcome_message}</p>
                  {guidanceData.encouragement && (
                    <p className="text-sm text-purple-600 mt-2 font-medium">💪 {guidanceData.encouragement}</p>
                  )}
                </div>

                {/* Current Stage */}
                {currentStage && (
                  <div className="p-4 bg-white rounded-xl border border-slate-200">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                        <Zap className="w-4 h-4 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-800">Current Stage: {currentStage.label}</h4>
                        <p className="text-xs text-slate-500">{guidanceData.estimated_stage_completion}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Next Action */}
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                  <h4 className="font-semibold text-emerald-800 mb-2 flex items-center gap-2">
                    <ArrowRight className="w-4 h-4" />
                    Next Action
                  </h4>
                  <p className="text-emerald-700">{guidanceData.next_action}</p>
                  <p className="text-sm text-emerald-600 mt-2">{guidanceData.action_importance}</p>
                </div>

                {/* Tips */}
                {guidanceData.tips?.length > 0 && (
                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                    <h4 className="font-semibold text-amber-800 mb-2">💡 Tips</h4>
                    <ul className="space-y-1">
                      {guidanceData.tips.map((tip, i) => (
                        <li key={i} className="text-sm text-amber-700 flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Resources */}
                {guidanceData.resources?.length > 0 && (
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <h4 className="font-semibold text-blue-800 mb-2">📚 Helpful Resources</h4>
                    <ul className="space-y-1">
                      {guidanceData.resources.map((resource, i) => (
                        <li key={i} className="text-sm text-blue-700">• {resource}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <Button 
                  variant="outline" 
                  onClick={generateGuidance}
                  disabled={isProcessing}
                  className="w-full"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isProcessing ? 'animate-spin' : ''}`} />
                  Refresh Guidance
                </Button>
              </motion.div>
            ) : (
              <div className="text-center py-8">
                <Brain className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                <p className="text-slate-500">Loading personalized guidance...</p>
              </div>
            )}
          </TabsContent>

          {/* Auto Tasks Tab */}
          <TabsContent value="tasks" className="mt-0 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">AI-generated tasks based on onboarding progress</p>
              <Button 
                size="sm" 
                onClick={generateAutoTasks}
                disabled={isGeneratingTasks}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isGeneratingTasks ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                Generate Tasks
              </Button>
            </div>

            {autoTasks.length > 0 ? (
              <div className="space-y-3">
                <AnimatePresence>
                  {autoTasks.map((task, i) => (
                    <motion.div
                      key={task.title}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: i * 0.1 }}
                      className="p-4 bg-white rounded-xl border border-slate-200 hover:border-purple-200 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-slate-800">{task.title}</h4>
                            <Badge className={priorityColors[task.priority]}>
                              {task.priority}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {task.assignee_type}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-600">{task.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Due in {task.due_days} days
                            </span>
                            {task.related_checklist && (
                              <span className="flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                {task.related_checklist}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          onClick={() => handleCreateTask(task)}
                          className="flex-shrink-0"
                        >
                          Create
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="text-center py-8 bg-slate-50 rounded-xl">
                <ListTodo className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                <p className="text-slate-500">Click "Generate Tasks" to create AI-suggested tasks</p>
              </div>
            )}
          </TabsContent>

          {/* Chat Tab */}
          <TabsContent value="chat" className="mt-0">
            <div className="flex flex-col h-[400px]">
              <ScrollArea className="flex-1 pr-4">
                <div className="space-y-4 pb-4">
                  {chatMessages.length === 0 && (
                    <div className="text-center py-8">
                      <Bot className="w-12 h-12 mx-auto text-purple-300 mb-3" />
                      <p className="text-slate-600 font-medium">Ask me anything about onboarding!</p>
                      <p className="text-sm text-slate-400 mt-1">
                        I can help with documents, licensing, AHIP, carriers, and more.
                      </p>
                      <div className="flex flex-wrap gap-2 justify-center mt-4">
                        {['What documents do I need?', 'How do I complete AHIP?', 'When can I start selling?'].map(q => (
                          <Button 
                            key={q} 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setChatInput(q);
                            }}
                            className="text-xs"
                          >
                            {q}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {chatMessages.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}
                    >
                      {msg.role === 'assistant' && (
                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                          <Bot className="w-4 h-4 text-purple-600" />
                        </div>
                      )}
                      <div className={`max-w-[80%] ${msg.role === 'user' ? 'order-first' : ''}`}>
                        <div className={`p-3 rounded-2xl ${
                          msg.role === 'user' 
                            ? 'bg-purple-600 text-white rounded-tr-sm' 
                            : 'bg-slate-100 text-slate-700 rounded-tl-sm'
                        }`}>
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        </div>
                        {msg.actions?.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {msg.actions.map((action, j) => (
                              <div key={j} className="text-xs text-purple-600 flex items-center gap-1">
                                <ArrowRight className="w-3 h-3" />
                                {action}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      {msg.role === 'user' && (
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-slate-600" />
                        </div>
                      )}
                    </motion.div>
                  ))}
                  
                  {isProcessing && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                        <Bot className="w-4 h-4 text-purple-600" />
                      </div>
                      <div className="p-3 bg-slate-100 rounded-2xl rounded-tl-sm">
                        <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
              </ScrollArea>

              <form onSubmit={handleChatSubmit} className="flex gap-2 pt-4 border-t">
                <Input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask about onboarding..."
                  disabled={isProcessing}
                  className="flex-1"
                />
                <Button type="submit" disabled={isProcessing || !chatInput.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </TabsContent>

          {/* Stall Alerts Tab */}
          <TabsContent value="alerts" className="mt-0 space-y-4">
            {stalledAnalysis ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                {/* Stall Alert Banner */}
                <div className={`p-4 rounded-xl border ${riskColors[stalledAnalysis.risk_level]}`}>
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-6 h-6" />
                    <div>
                      <h4 className="font-semibold">Onboarding Stalled</h4>
                      <p className="text-sm">
                        No progress for {stalledAnalysis.daysSinceProgress} days • 
                        Risk Level: <span className="font-medium capitalize">{stalledAnalysis.risk_level}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Stall Reasons */}
                {stalledAnalysis.stall_reasons?.length > 0 && (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                      <Brain className="w-4 h-4 text-purple-600" />
                      AI-Identified Reasons
                    </h4>
                    <ul className="space-y-2">
                      {stalledAnalysis.stall_reasons.map((reason, i) => (
                        <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                          <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          {reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Manager Actions */}
                {stalledAnalysis.manager_actions?.length > 0 && (
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <h4 className="font-semibold text-blue-800 mb-2">Recommended Manager Actions</h4>
                    <ul className="space-y-2">
                      {stalledAnalysis.manager_actions.map((action, i) => (
                        <li key={i} className="text-sm text-blue-700 flex items-start gap-2">
                          <ArrowRight className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          {action}
                        </li>
                      ))}
                    </ul>
                    <p className="text-xs text-blue-600 mt-3">
                      Estimated time to unblock: ~{stalledAnalysis.estimated_unblock_hours} hours
                    </p>
                  </div>
                )}

                {/* Suggested Outreach */}
                {stalledAnalysis.outreach_message && (
                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                    <h4 className="font-semibold text-emerald-800 mb-2">Suggested Outreach Message</h4>
                    <p className="text-sm text-emerald-700 italic">"{stalledAnalysis.outreach_message}"</p>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="mt-3"
                      onClick={() => {
                        navigator.clipboard.writeText(stalledAnalysis.outreach_message);
                      }}
                    >
                      Copy Message
                    </Button>
                  </div>
                )}

                {/* Blocking Items */}
                {stalledAnalysis.blocking_items?.length > 0 && (
                  <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                    <h4 className="font-semibold text-red-800 mb-2">Blocking Items</h4>
                    <ul className="space-y-1">
                      {stalledAnalysis.blocking_items.map((item, i) => (
                        <li key={i} className="text-sm text-red-700">• {item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <Button 
                  variant="outline" 
                  onClick={() => analyzeStall(stalledAnalysis.daysSinceProgress, stalledAnalysis.daysSinceCreation)}
                  className="w-full"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Re-analyze Stall
                </Button>
              </motion.div>
            ) : (
              <div className="text-center py-12 bg-emerald-50 rounded-xl border border-emerald-200">
                <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500 mb-3" />
                <h4 className="font-semibold text-emerald-800">No Stall Detected</h4>
                <p className="text-sm text-emerald-600 mt-1">
                  Agent is progressing through onboarding normally
                </p>
              </div>
            )}
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  );
}