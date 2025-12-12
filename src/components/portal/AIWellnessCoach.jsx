import { useState, useEffect, useRef } from 'react'
import { base44 } from '@/api/base44Client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { 
  Bot, Send, Sparkles, Heart, Activity, Target, 
  TrendingUp, Award, Calendar, Loader2, RefreshCw,
  MessageSquare, ThumbsUp, ThumbsDown, Dumbbell, Apple,
  Brain, Sun, Moon, Pill, CheckCircle, ChevronRight,
  Flame, Zap, Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import ReactMarkdown from 'react-markdown';
import { format } from 'date-fns'

// Simulated benefit usage data
const getBenefitUsageData = (userId) => ({
  gymVisits: { count: 8, lastVisit: '2024-12-01', trend: 'increasing', weeklyAvg: 2 },
  stepsPerDay: { average: 4500, goal: 7000, weeklyTrend: [3800, 4200, 5100, 4800, 4200, 5500, 4100] },
  sleepHours: { average: 6.5, goal: 8, quality: 'fair' },
  waterIntake: { average: 5, goal: 8, unit: 'glasses' },
  meditationMinutes: { weekly: 45, goal: 70 },
  prescriptionAdherence: { percentage: 85, streak: 12 },
  wellnessVisits: { completed: 1, scheduled: 0 },
  screeningsCompleted: ['Flu Shot', 'Blood Pressure'],
  screeningsDue: ['Colonoscopy', 'Eye Exam'],
  fitnessClasses: { attended: 3, thisMonth: true },
  caloriesBurned: { weekly: 2100, goal: 2500 }
});

const coachPersonalities = {
  motivational: { name: 'Coach Max', emoji: '💪', style: 'energetic and encouraging' },
  gentle: { name: 'Coach Grace', emoji: '🌸', style: 'gentle and supportive' },
  analytical: { name: 'Coach Alex', emoji: '📊', style: 'data-driven and precise' }
};

export default function AIWellnessCoach({ client, portalUser, conditions = [], initialAlertContext = null }) {
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [coachStyle, setCoachStyle] = useState('motivational');
  const [weeklyGoals, setWeeklyGoals] = useState([]);
  const [showGoalTracker, setShowGoalTracker] = useState(false);
  const messagesEndRef = useRef(null);

  const userData = client || portalUser;
  const benefitUsage = getBenefitUsageData(userData?.id);
  const coach = coachPersonalities[coachStyle];

  // Fetch alert context for coach
  const { data: alertContext } = useQuery({
    queryKey: ['coachAlertContext', userData?.email],
    queryFn: async () => {
      const response = await base44.functions.invoke('healthAlertEngine', {
        action: 'getCoachContext'
      });
      return response.data;
    },
    enabled: !!userData?.email
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-start session if there's an initial alert context
  useEffect(() => {
    if (initialAlertContext && messages.length === 0) {
      const alertPrompt = initialAlertContext.coachFollowUp || initialAlertContext.metadata?.coachFollowUp;
      if (alertPrompt) {
        setIsTyping(true);
        generateCoachingMutation.mutate(`The user wants to discuss this health alert: "${initialAlertContext.title}". ${alertPrompt}`);
      }
    }
  }, [initialAlertContext]);

  // Generate weekly coaching session
  const generateCoachingMutation = useMutation({
    mutationFn: async (userMessage = null) => {
      const conversationHistory = messages.slice(-6).map(m => 
        `${m.role === 'user' ? 'User' : 'Coach'}: ${m.content}`
      ).join('\n');

      const prompt = `You are ${coach.name} ${coach.emoji}, an AI wellness coach for Medicare beneficiaries. Your style is ${coach.style}.

USER PROFILE:
- Name: ${userData?.first_name || 'Friend'}
- Health Conditions: ${conditions.length > 0 ? conditions.join(', ') : 'General wellness focus'}
- Plan Type: ${client?.plan_type || portalUser?.plan_type || 'Medicare Advantage'}

CURRENT WELLNESS DATA:
- Gym Visits This Month: ${benefitUsage.gymVisits.count} (trend: ${benefitUsage.gymVisits.trend})
- Daily Steps Average: ${benefitUsage.stepsPerDay.average} (goal: ${benefitUsage.stepsPerDay.goal})
- Weekly Step Trend: ${benefitUsage.stepsPerDay.weeklyTrend.join(', ')}
- Sleep: ${benefitUsage.sleepHours.average} hrs avg (goal: ${benefitUsage.sleepHours.goal}, quality: ${benefitUsage.sleepHours.quality})
- Water Intake: ${benefitUsage.waterIntake.average}/${benefitUsage.waterIntake.goal} glasses
- Meditation: ${benefitUsage.meditationMinutes.weekly}/${benefitUsage.meditationMinutes.goal} mins/week
- Medication Adherence: ${benefitUsage.prescriptionAdherence.percentage}% (${benefitUsage.prescriptionAdherence.streak} day streak)
- Calories Burned Weekly: ${benefitUsage.caloriesBurned.weekly}/${benefitUsage.caloriesBurned.goal}
- Screenings Completed: ${benefitUsage.screeningsCompleted.join(', ')}
- Screenings Due: ${benefitUsage.screeningsDue.join(', ')}

ACTIVE HEALTH ALERTS (use these to personalize conversation):
${alertContext?.coachPrompts?.slice(0, 3).map(p => `- ${p.topic}: ${p.prompt}`).join('\n') || 'No active alerts'}

RECENT CONVERSATION:
${conversationHistory || 'Starting new conversation'}

${userMessage ? `USER'S MESSAGE: "${userMessage}"` : 'Generate a warm, personalized weekly check-in message.'}

INSTRUCTIONS:
${userMessage ? `
Respond conversationally to the user's message. Be helpful, supportive, and specific. Reference their actual data when relevant. Keep response under 150 words.
` : `
Generate a weekly wellness check-in that:
1. Greets them warmly by name
2. Celebrates 1-2 specific wins from their data (be specific with numbers!)
3. Gently addresses 1 area for improvement
4. Suggests 2-3 actionable micro-goals for the week
5. Ends with an encouraging question to spark conversation

Keep it conversational, warm, and under 200 words. Use emojis sparingly but effectively.
`}

Also generate 3 weekly micro-goals based on their data.

Format as JSON:
{
  "message": "Your coaching message here...",
  "weeklyGoals": [
    {"id": 1, "goal": "...", "metric": "...", "target": "...", "icon": "steps|water|sleep|gym|meditation|pills"},
    {"id": 2, "goal": "...", "metric": "...", "target": "...", "icon": "..."},
    {"id": 3, "goal": "...", "metric": "...", "target": "...", "icon": "..."}
  ],
  "encouragementLevel": "high|medium|low",
  "focusArea": "activity|nutrition|sleep|medication|mental_health|preventive_care",
  "suggestedTopics": ["topic1", "topic2", "topic3"]
}`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            message: { type: "string" },
            weeklyGoals: { type: "array" },
            encouragementLevel: { type: "string" },
            focusArea: { type: "string" },
            suggestedTopics: { type: "array" }
          }
        }
      });

      return response;
    },
    onSuccess: (data, variables) => {
      const coachMessage = {
        role: 'coach',
        content: data.message,
        timestamp: new Date().toISOString(),
        goals: data.weeklyGoals,
        focusArea: data.focusArea,
        suggestedTopics: data.suggestedTopics
      };
      
      setMessages(prev => [...prev, coachMessage]);
      if (data.weeklyGoals?.length > 0) {
        setWeeklyGoals(data.weeklyGoals);
      }
      setIsTyping(false);
    },
    onError: (error) => {
      toast.error('Coach is taking a break. Try again!');
      setIsTyping(false);
    }
  });

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const userMsg = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsTyping(true);
    generateCoachingMutation.mutate(inputMessage);
  };

  const handleQuickTopic = (topic) => {
    setInputMessage(topic);
    setTimeout(() => handleSendMessage(), 100);
  };

  const startSession = () => {
    setIsTyping(true);
    generateCoachingMutation.mutate(null);
  };

  const goalIcons = {
    steps: Activity,
    water: Zap,
    sleep: Moon,
    gym: Dumbbell,
    meditation: Brain,
    pills: Pill
  };

  const quickTopics = [
    "How can I sleep better?",
    "Tips for staying motivated",
    "Help me with my medications",
    "I need exercise ideas",
    "How's my progress this week?"
  ];

  return (
    <div className="space-y-6">
      {/* Coach Header */}
      <Card className="border-0 shadow-sm dark:bg-slate-800 overflow-hidden">
        <div className="bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-2xl">
                {coach.emoji}
              </div>
              <div>
                <h2 className="text-xl font-bold">{coach.name}</h2>
                <p className="text-purple-100 text-sm">Your Personal AI Wellness Coach</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <select 
                value={coachStyle}
                onChange={(e) => setCoachStyle(e.target.value)}
                className="bg-white/20 border-0 rounded-lg text-white text-sm px-3 py-1.5 focus:ring-2 focus:ring-white/30"
              >
                <option value="motivational" className="text-slate-800">💪 Motivational</option>
                <option value="gentle" className="text-slate-800">🌸 Gentle</option>
                <option value="analytical" className="text-slate-800">📊 Analytical</option>
              </select>
            </div>
          </div>
        </div>

        {/* Weekly Goals Tracker */}
        {weeklyGoals.length > 0 && (
          <div className="p-4 bg-gradient-to-r from-purple-50 to-fuchsia-50 dark:from-purple-900/20 dark:to-fuchsia-900/20 border-b dark:border-slate-700">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Target className="w-4 h-4 text-purple-600" />
                This Week's Goals
              </h3>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => setShowGoalTracker(!showGoalTracker)}
                className="text-xs"
              >
                {showGoalTracker ? 'Hide' : 'Show Details'}
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {weeklyGoals.map((goal, idx) => {
                const GoalIcon = goalIcons[goal.icon] || Star;
                return (
                  <motion.div
                    key={goal.id || idx}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.1 }}
                    className="p-3 rounded-xl bg-white dark:bg-slate-800 shadow-sm border dark:border-slate-700"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <GoalIcon className="w-4 h-4 text-purple-600" />
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                        {goal.goal}
                      </span>
                    </div>
                    {showGoalTracker && (
                      <div className="space-y-1">
                        <p className="text-xs text-slate-500">{goal.metric}</p>
                        <Badge variant="outline" className="text-xs">{goal.target}</Badge>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Chat Area */}
        <CardContent className="p-4">
          <div className="h-[400px] overflow-y-auto mb-4 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-100 to-fuchsia-100 dark:from-violet-900/40 dark:to-fuchsia-900/40 flex items-center justify-center mb-4">
                  <Sparkles className="w-10 h-10 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">
                  Ready for Your Weekly Check-in?
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 max-w-sm">
                  I've analyzed your wellness data and I'm ready to celebrate your wins, 
                  help with challenges, and set achievable goals for the week ahead.
                </p>
                <Button 
                  onClick={startSession}
                  disabled={generateCoachingMutation.isPending}
                  className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 gap-2"
                >
                  {generateCoachingMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <MessageSquare className="w-4 h-4" />
                  )}
                  Start Coaching Session
                </Button>

                {/* Quick Stats Preview */}
                <div className="grid grid-cols-3 gap-4 mt-8 w-full max-w-md">
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 text-center">
                    <Activity className="w-5 h-5 mx-auto text-green-600 mb-1" />
                    <p className="text-lg font-bold text-slate-800 dark:text-white">{benefitUsage.stepsPerDay.average.toLocaleString()}</p>
                    <p className="text-xs text-slate-500">Avg Steps</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 text-center">
                    <Dumbbell className="w-5 h-5 mx-auto text-orange-600 mb-1" />
                    <p className="text-lg font-bold text-slate-800 dark:text-white">{benefitUsage.gymVisits.count}</p>
                    <p className="text-xs text-slate-500">Gym Visits</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 text-center">
                    <Pill className="w-5 h-5 mx-auto text-purple-600 mb-1" />
                    <p className="text-lg font-bold text-slate-800 dark:text-white">{benefitUsage.prescriptionAdherence.percentage}%</p>
                    <p className="text-xs text-slate-500">Med Adherence</p>
                  </div>
                </div>
              </div>
            ) : (
              <AnimatePresence>
                {messages.map((msg, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] ${msg.role === 'user' ? 'order-2' : ''}`}>
                      {msg.role === 'coach' && (
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{coach.emoji}</span>
                          <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{coach.name}</span>
                        </div>
                      )}
                      <div className={`p-4 rounded-2xl ${
                        msg.role === 'user' 
                          ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white' 
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white'
                      }`}>
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      </div>
                      
                      {/* Suggested Topics */}
                      {msg.role === 'coach' && msg.suggestedTopics?.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {msg.suggestedTopics.map((topic, tIdx) => (
                            <button
                              key={tIdx}
                              onClick={() => handleQuickTopic(topic)}
                              className="px-3 py-1.5 text-xs rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/60 transition-colors"
                            >
                              {topic}
                            </button>
                          ))}
                        </div>
                      )}
                      
                      {msg.role === 'coach' && (
                        <div className="flex items-center gap-2 mt-2">
                          <button className="p-1 text-slate-400 hover:text-green-600 transition-colors">
                            <ThumbsUp className="w-4 h-4" />
                          </button>
                          <button className="p-1 text-slate-400 hover:text-red-500 transition-colors">
                            <ThumbsDown className="w-4 h-4" />
                          </button>
                          <span className="text-xs text-slate-400 ml-2">
                            {format(new Date(msg.timestamp), 'h:mm a')}
                          </span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}

            {/* Typing Indicator */}
            {isTyping && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2"
              >
                <span className="text-lg">{coach.emoji}</span>
                <div className="px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-700">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </motion.div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Topics (show after first message) */}
          {messages.length > 0 && messages.length < 3 && (
            <div className="mb-4">
              <p className="text-xs text-slate-500 mb-2">Quick topics:</p>
              <div className="flex flex-wrap gap-2">
                {quickTopics.map((topic, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleQuickTopic(topic)}
                    className="px-3 py-1.5 text-xs rounded-full border dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-purple-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="flex gap-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask your coach anything..."
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              disabled={isTyping}
              className="flex-1"
            />
            <Button 
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isTyping}
              className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Progress Summary */}
      <Card className="border-0 shadow-sm dark:bg-slate-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            Your Wellness Snapshot
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <WellnessMetric 
              icon={Activity}
              label="Daily Steps"
              value={benefitUsage.stepsPerDay.average.toLocaleString()}
              target={benefitUsage.stepsPerDay.goal.toLocaleString()}
              progress={(benefitUsage.stepsPerDay.average / benefitUsage.stepsPerDay.goal) * 100}
              color="text-green-600"
            />
            <WellnessMetric 
              icon={Moon}
              label="Sleep"
              value={`${benefitUsage.sleepHours.average}h`}
              target={`${benefitUsage.sleepHours.goal}h`}
              progress={(benefitUsage.sleepHours.average / benefitUsage.sleepHours.goal) * 100}
              color="text-indigo-600"
            />
            <WellnessMetric 
              icon={Pill}
              label="Med Adherence"
              value={`${benefitUsage.prescriptionAdherence.percentage}%`}
              target="100%"
              progress={benefitUsage.prescriptionAdherence.percentage}
              color="text-purple-600"
            />
            <WellnessMetric 
              icon={Flame}
              label="Calories Burned"
              value={benefitUsage.caloriesBurned.weekly.toLocaleString()}
              target={benefitUsage.caloriesBurned.goal.toLocaleString()}
              progress={(benefitUsage.caloriesBurned.weekly / benefitUsage.caloriesBurned.goal) * 100}
              color="text-orange-600"
            />
          </div>

          {/* Step Trend Chart */}
          <div className="mt-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Weekly Step Trend</p>
            <div className="flex items-end justify-between h-20 gap-1">
              {benefitUsage.stepsPerDay.weeklyTrend.map((steps, idx) => {
                const height = (steps / benefitUsage.stepsPerDay.goal) * 100;
                const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                    <div 
                      className={`w-full rounded-t-lg transition-all ${
                        steps >= benefitUsage.stepsPerDay.goal 
                          ? 'bg-gradient-to-t from-green-500 to-emerald-400' 
                          : 'bg-gradient-to-t from-purple-500 to-fuchsia-400'
                      }`}
                      style={{ height: `${Math.min(height, 100)}%` }}
                    />
                    <span className="text-xs text-slate-500">{days[idx]}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-xs text-slate-400">Goal: {benefitUsage.stepsPerDay.goal.toLocaleString()} steps</span>
              <span className="text-xs text-slate-400">Avg: {benefitUsage.stepsPerDay.average.toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Achievements */}
      <Card className="border-0 shadow-sm dark:bg-slate-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            Recent Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: Flame, label: `${benefitUsage.prescriptionAdherence.streak} Day Med Streak`, color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/40' },
              { icon: Dumbbell, label: `${benefitUsage.gymVisits.count} Gym Visits`, color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/40' },
              { icon: CheckCircle, label: `${benefitUsage.screeningsCompleted.length} Screenings Done`, color: 'bg-green-100 text-green-600 dark:bg-green-900/40' },
              { icon: Brain, label: `${benefitUsage.meditationMinutes.weekly} Mins Mindfulness`, color: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40' },
            ].map((achievement, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`p-3 rounded-xl ${achievement.color} text-center`}
              >
                <achievement.icon className="w-6 h-6 mx-auto mb-1" />
                <p className="text-xs font-medium">{achievement.label}</p>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function WellnessMetric({ icon: Icon, label, value, target, progress, color }) {
  return (
    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>
      </div>
      <p className="text-lg font-bold text-slate-800 dark:text-white">{value}</p>
      <p className="text-xs text-slate-400 mb-2">of {target}</p>
      <Progress value={Math.min(progress, 100)} className="h-1.5" />
    </div>
  );
}