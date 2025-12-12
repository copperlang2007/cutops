import { base44 } from '@/api/base44Client'
import { useMutation } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Sparkles, TrendingUp, Target, Lightbulb, Trophy, 
  Loader2, RefreshCw, CheckCircle, AlertCircle, Clock, MessageSquare
} from 'lucide-react';
import { motion } from 'framer-motion'

export default function AgentCoachingPanel({ agentId }) {
  const [coaching, setCoaching] = React.useState(null);

  const generateCoachingMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('aiAgentCoaching', { agent_id: agentId });
      return response.data;
    },
    onSuccess: (data) => {
      setCoaching(data);
    }
  });

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'time_management': return Clock;
      case 'client_relationships': return MessageSquare;
      case 'sales_skills': return TrendingUp;
      case 'communication': return MessageSquare;
      case 'productivity': return Target;
      default: return Lightbulb;
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  if (!coaching && !generateCoachingMutation.isPending) {
    return (
      <Card className="border-0 shadow-lg dark:bg-slate-800">
        <CardContent className="pt-12 pb-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/40 dark:to-pink-900/40 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            AI Performance Coaching
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            Get personalized coaching tips based on your performance data
          </p>
          <Button
            onClick={() => generateCoachingMutation.mutate()}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Generate Coaching
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (generateCoachingMutation.isPending) {
    return (
      <Card className="border-0 shadow-lg dark:bg-slate-800">
        <CardContent className="pt-12 pb-12 text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 text-purple-600 animate-spin" />
          <p className="text-sm text-slate-500">Analyzing your performance...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Performance Score */}
      <Card className="border-0 shadow-lg dark:bg-slate-800 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-100/20 to-pink-100/20 dark:from-purple-900/10 dark:to-pink-900/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-purple-600" />
              Performance Score
            </CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={() => generateCoachingMutation.mutate()}
              disabled={generateCoachingMutation.isPending}
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className={`text-5xl font-bold ${getScoreColor(coaching.coaching.overall_score)}`}>
                {coaching.coaching.overall_score}
              </div>
              <div className="text-sm text-slate-500 text-center">/ 100</div>
            </div>
            <div className="flex-1">
              <Progress value={coaching.coaching.overall_score} className="h-3 mb-2" />
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {coaching.coaching.performance_summary}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Motivational Message */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800"
      >
        <p className="text-sm text-slate-700 dark:text-slate-300 italic">
          💪 {coaching.coaching.motivational_message}
        </p>
      </motion.div>

      {/* Focus Areas */}
      <Card className="border-0 shadow-sm dark:bg-slate-800">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="w-5 h-5 text-teal-600" />
            Top Focus Areas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {coaching.coaching.focus_areas.map((area, i) => (
              <Badge key={i} className="bg-teal-100 text-teal-700 border-teal-200">
                {area}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Coaching Tips */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-amber-600" />
          Personalized Coaching Tips
        </h3>
        {coaching.coaching.coaching_tips.map((tip, i) => {
          const Icon = getCategoryIcon(tip.category);
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="border-0 shadow-sm dark:bg-slate-800 hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="font-semibold text-slate-900 dark:text-white">
                          {tip.title}
                        </h4>
                        <Badge className={getPriorityColor(tip.priority)}>
                          {tip.priority}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                        {tip.description}
                      </p>
                      
                      <div className="mb-3">
                        <p className="text-xs font-medium text-slate-500 mb-1">Expected Impact:</p>
                        <p className="text-sm text-slate-700 dark:text-slate-300">
                          {tip.expected_impact}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-xs font-medium text-slate-500 mb-2">Action Steps:</p>
                        <ul className="space-y-1">
                          {tip.action_steps.map((step, idx) => (
                            <li key={idx} className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2">
                              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                              {step}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Weekly Goals */}
      <Card className="border-0 shadow-sm dark:bg-slate-800">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" />
            This Week's Goals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {coaching.coaching.weekly_goals.map((goal, i) => (
              <div key={i} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {goal.goal}
                  </p>
                  <Badge variant="outline" className="text-xs">
                    {goal.target}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommended Training */}
      <Card className="border-0 shadow-sm dark:bg-slate-800">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            Recommended Training
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {coaching.coaching.recommended_training.map((training, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-600" />
                {training}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}