import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, Sparkles, TrendingUp, Users, Brain, Bell, 
  CheckCircle, ArrowRight, BarChart3, FileText, Calendar,
  Heart, Zap, DollarSign, BookOpen, Trophy
} from 'lucide-react';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Insights',
    description: 'Get intelligent recommendations and predictive analytics for your clients',
    color: 'from-purple-500 to-indigo-600'
  },
  {
    icon: Users,
    title: 'Smart Client Management',
    description: 'Track interactions, sentiment, and relationship health automatically',
    color: 'from-teal-500 to-emerald-600'
  },
  {
    icon: Shield,
    title: 'Policy Management',
    description: 'Comprehensive policy tracking with AI-driven gap analysis and renewal automation',
    color: 'from-blue-500 to-cyan-600'
  },
  {
    icon: Heart,
    title: 'Personalized Health Content',
    description: 'Curated health tips and articles tailored to each client',
    color: 'from-pink-500 to-rose-600'
  },
  {
    icon: DollarSign,
    title: 'Benefits Finder',
    description: 'Help clients discover government programs they qualify for',
    color: 'from-green-500 to-emerald-600'
  },
  {
    icon: Zap,
    title: 'Task Automation',
    description: 'AI generates and prioritizes tasks based on client needs',
    color: 'from-amber-500 to-orange-600'
  },
  {
    icon: BarChart3,
    title: 'Advanced Analytics',
    description: 'Real-time dashboards and performance tracking',
    color: 'from-violet-500 to-purple-600'
  },
  {
    icon: BookOpen,
    title: 'Knowledge Base',
    description: 'Instant access to policy information and best practices',
    color: 'from-sky-500 to-blue-600'
  },
  {
    icon: Trophy,
    title: 'Gamification & Coaching',
    description: 'Motivate your team with achievements and AI coaching',
    color: 'from-yellow-500 to-amber-600'
  }
];

const stats = [
  { label: 'Agents Empowered', value: '500+', icon: Users },
  { label: 'Clients Served', value: '10k+', icon: Shield },
  { label: 'AI Tasks Generated', value: '50k+', icon: Zap },
  { label: 'Time Saved', value: '85%', icon: TrendingUp }
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-600/10 to-purple-600/10 dark:from-teal-600/5 dark:to-purple-600/5" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-xl">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-5xl font-black bg-gradient-to-r from-teal-600 via-emerald-500 to-teal-600 bg-clip-text text-transparent">
                AgentHub
              </h1>
            </div>

            <h2 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white mb-6 leading-tight">
              Insurance Management
              <br />
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Powered by AI
              </span>
            </h2>

            <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 max-w-3xl mx-auto">
              Transform your agency with intelligent automation, personalized client insights, and AI-powered tools that help you grow faster and serve better.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button
                onClick={() => window.location.href = createPageUrl('PortalSignup')}
                size="lg"
                className="clay-morphism bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white font-bold shadow-2xl shadow-teal-500/40 text-lg px-8 py-6 h-auto"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                onClick={() => base44.auth.redirectToLogin()}
                size="lg"
                variant="outline"
                className="clay-morphism border-2 border-slate-300 dark:border-slate-600 text-lg px-8 py-6 h-auto font-semibold"
              >
                Sign In
              </Button>
            </div>

            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <CheckCircle className="w-4 h-4 text-green-500" />
                No credit card required
              </span>
              <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <CheckCircle className="w-4 h-4 text-green-500" />
                14-day free trial
              </span>
              <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Cancel anytime
              </span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="clay-morphism border-0 text-center">
                <CardContent className="pt-6">
                  <stat.icon className="w-8 h-8 text-teal-600 mx-auto mb-2" />
                  <p className="text-3xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{stat.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-purple-100 text-purple-700 dark:bg-purple-900/30">
            Platform Features
          </Badge>
          <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
            Everything You Need to Succeed
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Comprehensive tools designed for modern insurance agencies
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.05 }}
              whileHover={{ y: -8, scale: 1.02 }}
            >
              <Card className="clay-morphism border-0 h-full">
                <CardContent className="pt-6">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 shadow-lg`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-teal-600 to-emerald-600 dark:from-teal-700 dark:to-emerald-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Transform Your Agency?
          </h2>
          <p className="text-xl text-teal-100 mb-8">
            Join hundreds of agents already using AI to grow their business
          </p>
          <Button
            onClick={() => window.location.href = createPageUrl('PortalSignup')}
            size="lg"
            className="clay-morphism bg-white text-teal-600 hover:bg-slate-50 font-bold text-lg px-8 py-6 h-auto shadow-xl"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          <p className="text-teal-100 text-sm mt-4">
            No credit card required • 14-day free trial
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-slate-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-slate-400">
            © 2025 AgentHub. Empowering insurance agents with AI.
          </p>
        </div>
      </div>
    </div>
  );
}