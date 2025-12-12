import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Award, Zap, FileCheck, Shield, GraduationCap, 
  Building2, Rocket, Star, Trophy, CheckCircle2, Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

const BADGE_CONFIG = {
  quick_starter: { 
    icon: Zap, 
    color: 'from-amber-400 to-orange-500', 
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    name: 'Quick Starter',
    description: 'Completed first checklist item within 24 hours',
    points: 50
  },
  document_master: { 
    icon: FileCheck, 
    color: 'from-blue-400 to-indigo-500', 
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    name: 'Document Master',
    description: 'Uploaded all required documents',
    points: 100
  },
  license_verified: { 
    icon: Shield, 
    color: 'from-emerald-400 to-teal-500', 
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    name: 'License Verified',
    description: 'State license verified successfully',
    points: 75
  },
  nipr_verified: { 
    icon: CheckCircle2, 
    color: 'from-green-400 to-emerald-500', 
    bg: 'bg-green-100 dark:bg-green-900/30',
    name: 'NIPR Verified',
    description: 'Completed NIPR verification',
    points: 100
  },
  ahip_certified: { 
    icon: GraduationCap, 
    color: 'from-purple-400 to-violet-500', 
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    name: 'AHIP Certified',
    description: 'Completed AHIP certification',
    points: 150
  },
  compliance_champion: { 
    icon: Shield, 
    color: 'from-cyan-400 to-blue-500', 
    bg: 'bg-cyan-100 dark:bg-cyan-900/30',
    name: 'Compliance Champion',
    description: 'Passed background check and compliance training',
    points: 100
  },
  first_carrier: { 
    icon: Building2, 
    color: 'from-pink-400 to-rose-500', 
    bg: 'bg-pink-100 dark:bg-pink-900/30',
    name: 'First Carrier',
    description: 'Completed first carrier appointment',
    points: 125
  },
  multi_carrier: { 
    icon: Star, 
    color: 'from-yellow-400 to-amber-500', 
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    name: 'Multi-Carrier Pro',
    description: 'Appointed with 3+ carriers',
    points: 200
  },
  speed_demon: { 
    icon: Rocket, 
    color: 'from-red-400 to-orange-500', 
    bg: 'bg-red-100 dark:bg-red-900/30',
    name: 'Speed Demon',
    description: 'Completed onboarding in under 7 days',
    points: 250
  },
  onboarding_complete: { 
    icon: Trophy, 
    color: 'from-amber-400 via-yellow-400 to-amber-500', 
    bg: 'bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30',
    name: 'Onboarding Champion',
    description: 'Successfully completed all onboarding steps',
    points: 500
  }
};

export default function OnboardingBadges({ earnedBadges = [], agentName }) {
  const [selectedBadge, setSelectedBadge] = useState(null);
  
  const totalPoints = earnedBadges.reduce((sum, b) => sum + (b.points || 0), 0);
  const allBadgeTypes = Object.keys(BADGE_CONFIG);
  const earnedTypes = new Set(earnedBadges.map(b => b.badge_type));

  return (
    <Card className="border-0 shadow-premium dark:bg-slate-800/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2 dark:text-white">
            <Award className="w-5 h-5 text-amber-500" />
            Badges & Achievements
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900/50 dark:to-yellow-900/50">
              <span className="text-sm font-bold text-amber-700 dark:text-amber-400">{totalPoints} pts</span>
            </div>
            <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-400">
              {earnedBadges.length}/{allBadgeTypes.length}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-5 gap-3">
          {allBadgeTypes.map((type) => {
            const config = BADGE_CONFIG[type];
            const earned = earnedBadges.find(b => b.badge_type === type);
            const Icon = config.icon;
            
            return (
              <motion.div
                key={type}
                whileHover={{ scale: earned ? 1.1 : 1.02 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => earned && setSelectedBadge(earned)}
                className={`relative cursor-pointer ${!earned && 'opacity-40 grayscale'}`}
              >
                <div className={`aspect-square rounded-2xl ${config.bg} flex items-center justify-center relative overflow-hidden group`}>
                  {earned && (
                    <motion.div
                      className={`absolute inset-0 bg-gradient-to-br ${config.color} opacity-20`}
                      animate={{ opacity: [0.1, 0.3, 0.1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${config.color} flex items-center justify-center shadow-lg ${earned ? 'shadow-lg' : ''}`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  {!earned && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900/20 rounded-2xl">
                      <Lock className="w-4 h-4 text-slate-500" />
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-center mt-1.5 font-medium text-slate-600 dark:text-slate-400 line-clamp-1">
                  {config.name}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* Badge Detail Modal */}
        <AnimatePresence>
          {selectedBadge && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setSelectedBadge(null)}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
              >
                {(() => {
                  const config = BADGE_CONFIG[selectedBadge.badge_type];
                  const Icon = config.icon;
                  return (
                    <div className="text-center">
                      <motion.div
                        animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                        transition={{ duration: 0.5 }}
                        className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${config.color} flex items-center justify-center mx-auto shadow-xl`}
                      >
                        <Icon className="w-10 h-10 text-white" />
                      </motion.div>
                      <h3 className="text-xl font-bold mt-4 dark:text-white">{config.name}</h3>
                      <p className="text-slate-500 dark:text-slate-400 mt-1">{config.description}</p>
                      <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                        <div className="text-2xl font-bold text-amber-600">+{selectedBadge.points} pts</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Earned {format(new Date(selectedBadge.earned_date), 'MMM d, yyyy')}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

export { BADGE_CONFIG };