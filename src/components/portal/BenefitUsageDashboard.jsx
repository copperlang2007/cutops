import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, Activity, Pill, Stethoscope, Eye, 
  Ear, Heart, Calendar, TrendingUp, AlertTriangle
} from 'lucide-react';
import { format, differenceInDays, startOfYear, endOfYear } from 'date-fns';
import { motion } from 'framer-motion';

export default function BenefitUsageDashboard({ client }) {
  // Simulated benefit usage data - in production this would come from claims data
  const benefitData = {
    deductible: {
      annual: 250,
      used: 250,
      remaining: 0,
      met: true
    },
    outOfPocketMax: {
      annual: 7550,
      used: 2340,
      remaining: 5210,
      met: false
    },
    drugDeductible: {
      annual: 505,
      used: 505,
      remaining: 0,
      met: true
    },
    preventiveCare: {
      annual_wellness: { used: true, date: '2024-03-15' },
      flu_shot: { used: true, date: '2024-10-01' },
      mammogram: { used: false, eligible: true },
      colonoscopy: { used: false, eligible: true }
    },
    supplementalBenefits: {
      dental: { allowance: 1500, used: 450, remaining: 1050 },
      vision: { allowance: 200, used: 0, remaining: 200 },
      hearing: { allowance: 1000, used: 0, remaining: 1000 },
      otc: { quarterly: 60, used: 45, remaining: 15 },
      fitness: { active: true, gym_visits: 12 }
    },
    recentClaims: [
      { date: '2024-11-15', provider: 'Dr. Smith', type: 'Office Visit', amount: 35, status: 'paid' },
      { date: '2024-11-01', provider: 'CVS Pharmacy', type: 'Prescription', amount: 12, status: 'paid' },
      { date: '2024-10-20', provider: 'Quest Diagnostics', type: 'Lab Work', amount: 0, status: 'paid' },
    ]
  };

  const now = new Date();
  const yearStart = startOfYear(now);
  const yearEnd = endOfYear(now);
  const daysInYear = differenceInDays(yearEnd, yearStart);
  const daysElapsed = differenceInDays(now, yearStart);
  const yearProgress = Math.round((daysElapsed / daysInYear) * 100);

  const getProgressColor = (used, total) => {
    const pct = (used / total) * 100;
    if (pct >= 100) return 'bg-green-500';
    if (pct >= 75) return 'bg-amber-500';
    return 'bg-teal-500';
  };

  return (
    <div className="space-y-6">
      {/* Year Progress */}
      <Card className="border-0 shadow-sm dark:bg-slate-800">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-slate-400" />
              <span className="text-sm text-slate-500 dark:text-slate-400">Plan Year Progress</span>
            </div>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{yearProgress}%</span>
          </div>
          <Progress value={yearProgress} className="h-2" />
          <p className="text-xs text-slate-400 mt-1">
            {daysElapsed} of {daysInYear} days • Resets January 1st
          </p>
        </CardContent>
      </Card>

      {/* Deductibles & Out-of-Pocket */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className={`border-0 shadow-sm dark:bg-slate-800 ${benefitData.deductible.met ? 'ring-2 ring-green-200 dark:ring-green-800' : ''}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Medical Deductible</p>
                {benefitData.deductible.met && (
                  <Badge className="bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400">Met!</Badge>
                )}
              </div>
              <p className="text-2xl font-bold text-slate-800 dark:text-white">
                ${benefitData.deductible.used}
                <span className="text-sm font-normal text-slate-400"> / ${benefitData.deductible.annual}</span>
              </p>
              <Progress 
                value={(benefitData.deductible.used / benefitData.deductible.annual) * 100} 
                className={`h-2 mt-2 ${benefitData.deductible.met ? '[&>div]:bg-green-500' : ''}`}
              />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-0 shadow-sm dark:bg-slate-800">
            <CardContent className="p-4">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-3">Out-of-Pocket Max</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-white">
                ${benefitData.outOfPocketMax.used.toLocaleString()}
                <span className="text-sm font-normal text-slate-400"> / ${benefitData.outOfPocketMax.annual.toLocaleString()}</span>
              </p>
              <Progress 
                value={(benefitData.outOfPocketMax.used / benefitData.outOfPocketMax.annual) * 100} 
                className="h-2 mt-2"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                ${benefitData.outOfPocketMax.remaining.toLocaleString()} remaining
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className={`border-0 shadow-sm dark:bg-slate-800 ${benefitData.drugDeductible.met ? 'ring-2 ring-green-200 dark:ring-green-800' : ''}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Drug Deductible</p>
                {benefitData.drugDeductible.met && (
                  <Badge className="bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400">Met!</Badge>
                )}
              </div>
              <p className="text-2xl font-bold text-slate-800 dark:text-white">
                ${benefitData.drugDeductible.used}
                <span className="text-sm font-normal text-slate-400"> / ${benefitData.drugDeductible.annual}</span>
              </p>
              <Progress 
                value={(benefitData.drugDeductible.used / benefitData.drugDeductible.annual) * 100} 
                className={`h-2 mt-2 ${benefitData.drugDeductible.met ? '[&>div]:bg-green-500' : ''}`}
              />
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Supplemental Benefits */}
      <Card className="border-0 shadow-sm dark:bg-slate-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-teal-600" />
            Supplemental Benefits Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Dental */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                  <Activity className="w-4 h-4 text-blue-600" />
                </div>
                <span className="font-medium text-slate-700 dark:text-slate-300">Dental</span>
              </div>
              <p className="text-xl font-bold text-slate-800 dark:text-white">
                ${benefitData.supplementalBenefits.dental.remaining}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">remaining of ${benefitData.supplementalBenefits.dental.allowance}</p>
              <Progress 
                value={(benefitData.supplementalBenefits.dental.used / benefitData.supplementalBenefits.dental.allowance) * 100} 
                className="h-1.5 mt-2"
              />
            </div>

            {/* Vision */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center">
                  <Eye className="w-4 h-4 text-purple-600" />
                </div>
                <span className="font-medium text-slate-700 dark:text-slate-300">Vision</span>
              </div>
              <p className="text-xl font-bold text-slate-800 dark:text-white">
                ${benefitData.supplementalBenefits.vision.remaining}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">remaining of ${benefitData.supplementalBenefits.vision.allowance}</p>
              <Progress 
                value={(benefitData.supplementalBenefits.vision.used / benefitData.supplementalBenefits.vision.allowance) * 100} 
                className="h-1.5 mt-2"
              />
            </div>

            {/* Hearing */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                  <Ear className="w-4 h-4 text-amber-600" />
                </div>
                <span className="font-medium text-slate-700 dark:text-slate-300">Hearing</span>
              </div>
              <p className="text-xl font-bold text-slate-800 dark:text-white">
                ${benefitData.supplementalBenefits.hearing.remaining}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">remaining of ${benefitData.supplementalBenefits.hearing.allowance}</p>
              <Progress 
                value={(benefitData.supplementalBenefits.hearing.used / benefitData.supplementalBenefits.hearing.allowance) * 100} 
                className="h-1.5 mt-2"
              />
            </div>

            {/* OTC */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
                  <Pill className="w-4 h-4 text-green-600" />
                </div>
                <span className="font-medium text-slate-700 dark:text-slate-300">OTC Allowance</span>
              </div>
              <p className="text-xl font-bold text-slate-800 dark:text-white">
                ${benefitData.supplementalBenefits.otc.remaining}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">remaining this quarter</p>
              <Progress 
                value={(benefitData.supplementalBenefits.otc.used / benefitData.supplementalBenefits.otc.quarterly) * 100} 
                className="h-1.5 mt-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preventive Care */}
      <Card className="border-0 shadow-sm dark:bg-slate-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500" />
            Preventive Care ($0 Copay)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className={`p-3 rounded-lg ${benefitData.preventiveCare.annual_wellness.used ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-slate-50 dark:bg-slate-900/50'}`}>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Annual Wellness</p>
              {benefitData.preventiveCare.annual_wellness.used ? (
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  ✓ Completed {format(new Date(benefitData.preventiveCare.annual_wellness.date), 'MMM d')}
                </p>
              ) : (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Schedule now - FREE</p>
              )}
            </div>
            <div className={`p-3 rounded-lg ${benefitData.preventiveCare.flu_shot.used ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-slate-50 dark:bg-slate-900/50'}`}>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Flu Shot</p>
              {benefitData.preventiveCare.flu_shot.used ? (
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  ✓ Completed {format(new Date(benefitData.preventiveCare.flu_shot.date), 'MMM d')}
                </p>
              ) : (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Get yours - FREE</p>
              )}
            </div>
            <div className={`p-3 rounded-lg ${benefitData.preventiveCare.mammogram.used ? 'bg-green-50 dark:bg-green-900/20' : 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'}`}>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Mammogram</p>
              {benefitData.preventiveCare.mammogram.eligible && !benefitData.preventiveCare.mammogram.used && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                  <AlertTriangle className="w-3 h-3 inline mr-1" />
                  Eligible - Schedule now
                </p>
              )}
            </div>
            <div className={`p-3 rounded-lg ${benefitData.preventiveCare.colonoscopy.used ? 'bg-green-50 dark:bg-green-900/20' : 'bg-slate-50 dark:bg-slate-900/50'}`}>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Colonoscopy</p>
              {benefitData.preventiveCare.colonoscopy.eligible && !benefitData.preventiveCare.colonoscopy.used && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Available - FREE</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Claims */}
      <Card className="border-0 shadow-sm dark:bg-slate-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            Recent Claims
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {benefitData.recentClaims.map((claim, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                <div>
                  <p className="font-medium text-slate-800 dark:text-white text-sm">{claim.provider}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {claim.type} • {format(new Date(claim.date), 'MMM d, yyyy')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-slate-800 dark:text-white">${claim.amount}</p>
                  <Badge className="bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 text-xs">
                    {claim.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}