import { ClayButton } from './components/ClayButton';
import { ClayCard } from './components/ClayCard';
import { ClayBadge } from './components/ClayBadge';
import { 
  FileText, 
  Brain, 
  Users, 
  MessageSquare, 
  Shield, 
  Trophy, 
  Layout, 
  BarChart3, 
  GraduationCap,
  Sparkles,
  ArrowRight,
  CheckCircle,
  Zap,
  Clock,
  TrendingUp
} from 'lucide-react';
import { useState } from 'react';
import './styles/dark-paint-drip.css';
import './styles/clay-texture.css';
import './styles/dark-neomorphism.css';
import './styles/paint-drip.css';
import './styles/neomorphism.css';
import './styles/electricity-animation.css';
import { ClayButtonLight } from './components/light/ClayButtonLight';
import { ClayCardLight } from './components/light/ClayCardLight';
import { ClayBadgeLight } from './components/light/ClayBadgeLight';
import { ElectricText } from './components/ElectricText';
import { LightSwitch } from './components/LightSwitch';

export default function App() {
  const [isDark, setIsDark] = useState(false);

  const features = [
    {
      icon: FileText,
      title: "AI Document Management",
      description: "Automated categorization, tagging, OCR/NLP extraction, and smart search for client documents.",
      color: "purple"
    },
    {
      icon: Brain,
      title: "AI Policy Recommendations",
      description: "AI-driven suggestions for policy upgrades, new offerings, and comprehensive gap analysis.",
      color: "pink"
    },
    {
      icon: Users,
      title: "Client Management & Onboarding",
      description: "Manage client data, interactions, AI-driven onboarding workflows, and segmentation.",
      color: "blue"
    },
    {
      icon: MessageSquare,
      title: "Communication & Engagement",
      description: "AI-powered email drafting, proactive messaging, and sentiment monitoring.",
      color: "cyan"
    },
    {
      icon: Shield,
      title: "Risk & Compliance",
      description: "Proactive risk monitoring and sentiment-based compliance integration.",
      color: "violet"
    },
    {
      icon: Trophy,
      title: "Gamification",
      description: "Agent performance tracking, points, achievements, and motivation systems.",
      color: "purple"
    },
    {
      icon: Layout,
      title: "Client Portal",
      description: "Dedicated interface for clients to access policies, manage benefits, and schedule appointments.",
      color: "pink"
    },
    {
      icon: BarChart3,
      title: "Analytics & Insights",
      description: "AI-driven client analytics, churn prediction, and comprehensive reporting.",
      color: "blue"
    },
    {
      icon: GraduationCap,
      title: "Training & Coaching",
      description: "Agent training modules, simulations, and comprehensive knowledge base.",
      color: "cyan"
    }
  ];

  const benefits = [
    { icon: Zap, text: "10x faster document processing" },
    { icon: TrendingUp, text: "35% increase in policy conversions" },
    { icon: Clock, text: "Save 15+ hours per week" },
    { icon: CheckCircle, text: "100% compliance accuracy" }
  ];

  // Dark theme rendering
  if (isDark) {
    return (
      <div className="min-h-screen dark-neomorphic-bg relative overflow-hidden">
        {/* Theme Toggle */}
        <LightSwitch isDark={isDark} onToggle={() => setIsDark(!isDark)} />

        {/* Neomorphic subtle edge treatment */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-950/20 via-transparent to-slate-950/20"></div>
        </div>

        {/* Navigation */}
        <nav className="relative z-50 max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="smoke-bubble p-3">
                <Brain className="w-8 h-8" style={{
                  color: 'rgba(255, 255, 255, 0.95)',
                  filter: 'drop-shadow(0 0 12px rgba(255, 255, 255, 0.8)) drop-shadow(0 0 24px rgba(200, 230, 255, 0.6)) brightness(1.3)'
                }} />
              </div>
              <div>
                <h2 className="text-2xl text-purple-100" style={{
                  textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8), -1px -1px 2px rgba(139, 92, 246, 0.3)'
                }}>
                  CustomOps
                </h2>
                <p className="text-xs text-slate-400">by ClarityAI</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <ClayButton variant="ghost">
                Features
              </ClayButton>
              <ClayButton variant="ghost">
                Pricing
              </ClayButton>
              <ClayButton variant="primary">
                Get Started
                <ArrowRight className="w-4 h-4" style={{
                  color: 'rgba(255, 255, 255, 0.95)',
                  filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.6)) brightness(1.3)'
                }} />
              </ClayButton>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="relative z-10 max-w-7xl mx-auto px-8 py-20">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex justify-center gap-2 mb-6">
              <ClayBadge color="purple">
                <Sparkles className="w-3 h-3" />
                AI-Powered
              </ClayBadge>
              <ClayBadge color="pink">Medicare Advantage</ClayBadge>
            </div>
            
            <h1 className="text-7xl bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent mb-6" style={{
              textShadow: '-2px -2px 4px rgba(0, 0, 0, 0.9), 2px 2px 3px rgba(139, 92, 246, 0.5)'
            }}>
              The Operating System for Medicare Advantage Agents
            </h1>
            
            <p className="text-xl text-slate-300 mb-12 leading-relaxed" style={{
              textShadow: '1px 1px 2px rgba(0, 0, 0, 0.6)'
            }}>
              CustomOps transforms how Medicare Advantage agents and agencies manage clients, 
              policies, and operations with AI-powered automation and intelligent insights.
            </p>

            <div className="flex items-center justify-center gap-4 mb-16">
              <ClayButton variant="primary">
                <Sparkles className="w-5 h-5" />
                Start Free Trial
              </ClayButton>
              <ClayButton variant="secondary">
                Watch Demo
                <ArrowRight className="w-4 h-4" />
              </ClayButton>
            </div>

            {/* Benefits Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {benefits.map((benefit, index) => (
                <div key={index} className="clay-morphism-subtle p-4 rounded-2xl">
                  <benefit.icon className="w-6 h-6 mx-auto mb-2" style={{
                    color: 'rgba(255, 255, 255, 0.95)',
                    filter: 'drop-shadow(0 0 10px rgba(255, 255, 255, 0.7)) drop-shadow(0 0 20px rgba(200, 230, 255, 0.5)) brightness(1.3)'
                  }} />
                  <p className="text-sm text-slate-300">{benefit.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="relative z-10 max-w-7xl mx-auto px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="text-5xl bg-gradient-to-r from-purple-200 to-pink-200 bg-clip-text text-transparent mb-4" style={{
              textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)'
            }}>
              Powerful Features
            </h2>
            <p className="text-slate-400 text-lg">Everything you need to scale your Medicare Advantage operations</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <ClayCard key={index} title="">
                <div className="flex items-start gap-4">
                  <div className="smoke-bubble p-3">
                    <feature.icon className="w-6 h-6" style={{
                      color: 'rgba(255, 255, 255, 0.95)',
                      filter: 'drop-shadow(0 0 10px rgba(255, 255, 255, 0.7)) drop-shadow(0 0 20px rgba(200, 230, 255, 0.5)) brightness(1.3)'
                    }} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg text-slate-200 mb-2">{feature.title}</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              </ClayCard>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative z-10 max-w-7xl mx-auto px-8 py-20">
          <ClayCard title="">
            <div className="text-center py-12">
              <div className="smoke-bubble p-6 inline-block mb-6">
                <Brain className="w-16 h-16" style={{
                  color: 'rgba(255, 255, 255, 0.95)',
                  filter: 'drop-shadow(0 0 16px rgba(255, 255, 255, 0.8)) drop-shadow(0 0 32px rgba(200, 230, 255, 0.6)) brightness(1.3)'
                }} />
              </div>
              <h2 className="text-4xl bg-gradient-to-r from-purple-200 to-pink-200 bg-clip-text text-transparent mb-4" style={{
                textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)'
              }}>
                Ready to Transform Your Operations?
              </h2>
              <p className="text-slate-300 text-lg mb-8 max-w-2xl mx-auto">
                Join hundreds of Medicare Advantage agents and agencies already using CustomOps 
                to streamline their workflow and grow their business.
              </p>
              <div className="flex items-center justify-center gap-4">
                <ClayButton variant="primary">
                  <Sparkles className="w-5 h-5" />
                  Get Started Free
                </ClayButton>
                <ClayButton variant="accent">
                  Schedule a Demo
                  <ArrowRight className="w-4 h-4" />
                </ClayButton>
              </div>
            </div>
          </ClayCard>
        </section>

        {/* Footer */}
        <footer className="relative z-10 max-w-7xl mx-auto px-8 py-12">
          <div className="clay-morphism-subtle p-8 rounded-3xl">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="smoke-bubble p-2">
                    <Brain className="w-6 h-6" style={{
                      color: 'rgba(255, 255, 255, 0.95)',
                      filter: 'drop-shadow(0 0 10px rgba(255, 255, 255, 0.7)) drop-shadow(0 0 20px rgba(200, 230, 255, 0.5)) brightness(1.3)'
                    }} />
                  </div>
                  <div>
                    <h3 className="text-lg text-purple-100">CustomOps</h3>
                    <p className="text-xs text-slate-400">by ClarityAI</p>
                  </div>
                </div>
                <p className="text-sm text-slate-400">
                  AI-powered operations platform for Medicare Advantage professionals.
                </p>
              </div>
              <div>
                <h4 className="text-slate-300 mb-3">Product</h4>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li>Features</li>
                  <li>Pricing</li>
                  <li>Security</li>
                  <li>Roadmap</li>
                </ul>
              </div>
              <div>
                <h4 className="text-slate-300 mb-3">Company</h4>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li>About</li>
                  <li>Blog</li>
                  <li>Careers</li>
                  <li>Contact</li>
                </ul>
              </div>
              <div>
                <h4 className="text-slate-300 mb-3">Legal</h4>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li>Privacy</li>
                  <li>Terms</li>
                  <li>HIPAA Compliance</li>
                  <li>Security</li>
                </ul>
              </div>
            </div>
            <div className="border-t border-slate-700/50 mt-8 pt-8 text-center">
              <p className="text-sm text-slate-400">
                © 2025 ClarityAI. All rights reserved. CustomOps is HIPAA compliant and Medicare certified.
              </p>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  // Light theme rendering
  return (
    <div className="min-h-screen neomorphic-bg relative overflow-hidden">
      {/* Theme Toggle */}
      <LightSwitch isDark={isDark} onToggle={() => setIsDark(!isDark)} />

      {/* Neomorphic subtle edge treatment */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-100/20 via-transparent to-gray-200/20"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-50 max-w-7xl mx-auto px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="light-smoke-bubble p-3">
              <Brain className="w-8 h-8 text-purple-600" />
            </div>
            <div>
              <h2 className="text-2xl text-stone-700" style={{
                textShadow: '1px 1px 2px rgba(255, 255, 255, 0.9), -1px -1px 1px rgba(163, 177, 198, 0.2)'
              }}>
                CustomOps
              </h2>
              <p className="text-xs text-stone-500">by ClarityAI</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <ClayButtonLight variant="ghost">
              Features
            </ClayButtonLight>
            <ClayButtonLight variant="ghost">
              Pricing
            </ClayButtonLight>
            <ClayButtonLight variant="primary">
              Get Started
              <ArrowRight className="w-4 h-4" />
            </ClayButtonLight>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-8 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <div className="flex justify-center gap-2 mb-6">
            <ClayBadgeLight color="purple">
              <Sparkles className="w-3 h-3" />
              AI-Powered
            </ClayBadgeLight>
            <ClayBadgeLight color="pink">Medicare Advantage</ClayBadgeLight>
          </div>
          
          <h1 className="text-7xl bg-gradient-to-r from-stone-600 via-neutral-700 to-zinc-600 bg-clip-text text-transparent mb-6" style={{
            textShadow: '2px 2px 4px rgba(255, 255, 255, 0.9), -1px -1px 2px rgba(163, 177, 198, 0.3)'
          }}>
            The Operating System for Medicare Advantage Agents
          </h1>
          
          <p className="text-xl text-stone-600 mb-12 leading-relaxed" style={{
            textShadow: '1px 1px 2px rgba(255, 255, 255, 0.8)'
          }}>
            CustomOps transforms how Medicare Advantage agents and agencies manage clients, 
            policies, and operations with AI-powered automation and intelligent insights.
          </p>

          <div className="flex items-center justify-center gap-4 mb-16">
            <ClayButtonLight variant="primary">
              <Sparkles className="w-5 h-5" />
              Start Free Trial
            </ClayButtonLight>
            <ClayButtonLight variant="secondary">
              Watch Demo
              <ArrowRight className="w-4 h-4" />
            </ClayButtonLight>
          </div>

          {/* Benefits Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="clay-light-morphism-subtle p-4 rounded-2xl">
                <benefit.icon className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                <p className="text-sm text-stone-600">{benefit.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-5xl bg-gradient-to-r from-stone-600 to-neutral-700 bg-clip-text text-transparent mb-4" style={{
            textShadow: '2px 2px 4px rgba(255, 255, 255, 0.9)'
          }}>
            Powerful Features
          </h2>
          <p className="text-stone-600 text-lg">Everything you need to scale your Medicare Advantage operations</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <ClayCardLight key={index} title="">
              <div className="flex items-start gap-4">
                <div className="light-smoke-bubble p-3">
                  <feature.icon className={`w-6 h-6 text-${feature.color}-600`} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg text-stone-700 mb-2">{feature.title}</h3>
                  <p className="text-sm text-stone-500 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            </ClayCardLight>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-8 py-20">
        <ClayCardLight title="">
          <div className="text-center py-12">
            <div className="light-smoke-bubble p-6 inline-block mb-6">
              <Brain className="w-16 h-16 text-purple-600" />
            </div>
            <h2 className="text-4xl bg-gradient-to-r from-stone-600 to-neutral-700 bg-clip-text text-transparent mb-4" style={{
              textShadow: '2px 2px 4px rgba(255, 255, 255, 0.9)'
            }}>
              Ready to Transform Your Operations?
            </h2>
            <p className="text-stone-600 text-lg mb-8 max-w-2xl mx-auto">
              Join hundreds of Medicare Advantage agents and agencies already using CustomOps 
              to streamline their workflow and grow their business.
            </p>
            <div className="flex items-center justify-center gap-4">
              <ClayButtonLight variant="primary">
                <Sparkles className="w-5 h-5" />
                Get Started Free
              </ClayButtonLight>
              <ClayButtonLight variant="accent">
                Schedule a Demo
                <ArrowRight className="w-4 h-4" />
              </ClayButtonLight>
            </div>
          </div>
        </ClayCardLight>
      </section>

      {/* Footer */}
      <footer className="relative z-10 max-w-7xl mx-auto px-8 py-12">
        <div className="clay-light-morphism-subtle p-8 rounded-3xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="light-smoke-bubble p-2">
                  <Brain className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg text-stone-700">CustomOps</h3>
                  <p className="text-xs text-stone-500">by ClarityAI</p>
                </div>
              </div>
              <p className="text-sm text-stone-500">
                AI-powered operations platform for Medicare Advantage professionals.
              </p>
            </div>
            <div>
              <h4 className="text-stone-700 mb-3">Product</h4>
              <ul className="space-y-2 text-sm text-stone-500">
                <li>Features</li>
                <li>Pricing</li>
                <li>Security</li>
                <li>Roadmap</li>
              </ul>
            </div>
            <div>
              <h4 className="text-stone-700 mb-3">Company</h4>
              <ul className="space-y-2 text-sm text-stone-500">
                <li>About</li>
                <li>Blog</li>
                <li>Careers</li>
                <li>Contact</li>
              </ul>
            </div>
            <div>
              <h4 className="text-stone-700 mb-3">Legal</h4>
              <ul className="space-y-2 text-sm text-stone-500">
                <li>Privacy</li>
                <li>Terms</li>
                <li>HIPAA Compliance</li>
                <li>Security</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-stone-300/50 mt-8 pt-8 text-center">
            <p className="text-sm text-stone-500">
              © 2025 ClarityAI. All rights reserved. CustomOps is HIPAA compliant and Medicare certified.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}