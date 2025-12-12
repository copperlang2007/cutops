import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, Heart, DollarSign, Pill, Stethoscope, Calendar,
  CheckCircle, ArrowRight, FileText, Star, Users
} from 'lucide-react';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';

const clientFeatures = [
  {
    icon: Shield,
    title: 'Plan Comparison',
    description: 'Compare Medicare plans side-by-side to find the best coverage for you',
    color: 'from-blue-500 to-cyan-600'
  },
  {
    icon: DollarSign,
    title: 'Benefits Finder',
    description: 'Discover government programs and assistance you may qualify for',
    color: 'from-green-500 to-emerald-600'
  },
  {
    icon: Pill,
    title: 'Drug Lookup',
    description: 'Check medication coverage and find cost-saving alternatives',
    color: 'from-purple-500 to-pink-600'
  },
  {
    icon: Stethoscope,
    title: 'Find Doctors',
    description: 'Search for in-network providers in your area',
    color: 'from-teal-500 to-blue-600'
  },
  {
    icon: Heart,
    title: 'Health Resources',
    description: 'Get personalized health tips and wellness content',
    color: 'from-pink-500 to-rose-600'
  },
  {
    icon: Calendar,
    title: 'Easy Scheduling',
    description: 'Book appointments with licensed agents at your convenience',
    color: 'from-amber-500 to-orange-600'
  }
];

const benefits = [
  'Free to use - no hidden fees',
  'Licensed expert support',
  'Personalized recommendations',
  'Secure and private',
  'Easy-to-use tools',
  'Available 24/7'
];

export default function PortalLandingPage({ onGetStarted }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-teal-50 to-emerald-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden py-20">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-teal-600/10" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-teal-600 flex items-center justify-center shadow-xl">
                <Shield className="w-8 h-8 text-white" />
              </div>
            </div>

            <h1 className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white mb-6 leading-tight">
              Your Medicare
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
                Journey Made Simple
              </span>
            </h1>

            <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 max-w-3xl mx-auto">
              Free tools to compare plans, discover benefits, and connect with licensed experts. No pressure, no obligations.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button
                onClick={onGetStarted}
                size="lg"
                className="clay-morphism bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-400 hover:to-teal-400 text-white font-bold shadow-2xl shadow-blue-500/40 text-lg px-8 py-6 h-auto"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                onClick={() => window.location.href = createPageUrl('ClientPortal')}
                size="lg"
                variant="outline"
                className="clay-morphism border-2 border-slate-300 dark:border-slate-600 text-lg px-8 py-6 h-auto font-semibold"
              >
                Sign In
              </Button>
            </div>

            <div className="flex flex-wrap justify-center gap-6 text-sm">
              {benefits.slice(0, 3).map((benefit, i) => (
                <span key={i} className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  {benefit}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-blue-100 text-blue-700 dark:bg-blue-900/30">
            What You'll Get
          </Badge>
          <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
            Everything You Need in One Place
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Powerful tools designed to help you navigate Medicare with confidence
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clientFeatures.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
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

      {/* Benefits Section */}
      <div className="bg-white dark:bg-slate-800 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
              Why Choose Our Portal?
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {benefits.map((benefit, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-3 p-4 clay-subtle rounded-lg"
              >
                <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                <span className="text-slate-700 dark:text-slate-300 font-medium">{benefit}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-teal-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Create your free account and access all tools instantly
          </p>
          <Button
            onClick={onGetStarted}
            size="lg"
            className="clay-morphism bg-white text-blue-600 hover:bg-slate-50 font-bold text-lg px-8 py-6 h-auto shadow-xl"
          >
            Create Free Account
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          <p className="text-blue-100 text-sm mt-4">
            No credit card required • Get started in 60 seconds
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-slate-900 text-white py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-slate-400">
            © 2025 Medicare Benefits Portal. Licensed agents ready to help.
          </p>
        </div>
      </div>
    </div>
  );
}