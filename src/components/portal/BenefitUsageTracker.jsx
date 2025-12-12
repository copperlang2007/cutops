import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  DollarSign, Heart, Pill, Stethoscope, 
  Eye, Ear, Activity, Calendar, Bell, ExternalLink,
  Clock, AlertTriangle, ShoppingCart, Dumbbell,
  ChevronRight, CheckCircle, X
} from 'lucide-react';
import { format, differenceInDays, addDays } from 'date-fns';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function BenefitUsageTracker({ client, onNavigate }) {
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [selectedBenefit, setSelectedBenefit] = useState(null);
  const [reminderDays, setReminderDays] = useState('7');
  const [activeReminders, setActiveReminders] = useState([]);

  // Comprehensive benefit data with expiration dates and actions
  const benefitsData = {
    financial: {
      deductible: {
        used: 245,
        total: 500,
        label: 'Annual Deductible',
        expiresAt: '2025-12-31'
      },
      outOfPocketMax: {
        used: 1250,
        total: 7500,
        label: 'Out-of-Pocket Maximum',
        expiresAt: '2025-12-31'
      }
    },
    benefits: [
      { 
        id: 'dental',
        name: 'Dental Cleanings', 
        used: 1, 
        total: 2, 
        icon: Activity, 
        color: 'text-teal-600',
        bgColor: 'bg-teal-100 dark:bg-teal-900/40',
        remaining: 1,
        expiresAt: '2025-12-31',
        actionLabel: 'Find Dentist',
        actionTab: 'doctors',
        category: 'dental',
        value: null
      },
      { 
        id: 'vision',
        name: 'Vision Exam', 
        used: 0, 
        total: 1, 
        icon: Eye, 
        color: 'text-amber-600',
        bgColor: 'bg-amber-100 dark:bg-amber-900/40',
        remaining: 1,
        expiresAt: '2025-12-31',
        actionLabel: 'Find Eye Doctor',
        actionTab: 'doctors',
        category: 'vision',
        value: null
      },
      { 
        id: 'hearing',
        name: 'Hearing Exam', 
        used: 0, 
        total: 1, 
        icon: Ear, 
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-100 dark:bg-indigo-900/40',
        remaining: 1,
        expiresAt: '2025-12-31',
        actionLabel: 'Find Audiologist',
        actionTab: 'doctors',
        category: 'hearing',
        value: null
      },
      { 
        id: 'wellness',
        name: 'Annual Wellness Visit', 
        used: 0, 
        total: 1, 
        icon: Heart, 
        color: 'text-red-500',
        bgColor: 'bg-red-100 dark:bg-red-900/40',
        remaining: 1,
        expiresAt: '2025-12-31',
        actionLabel: 'Schedule Visit',
        actionTab: 'appointments',
        category: 'preventive',
        value: null
      },
      { 
        id: 'pcp',
        name: 'Primary Care Visits', 
        used: 3, 
        total: 'Unlimited', 
        icon: Stethoscope, 
        color: 'text-blue-600',
        bgColor: 'bg-blue-100 dark:bg-blue-900/40',
        remaining: 'Unlimited',
        expiresAt: null,
        actionLabel: 'Find Doctor',
        actionTab: 'doctors',
        category: 'pcp',
        value: null
      },
      { 
        id: 'specialist',
        name: 'Specialist Visits', 
        used: 2, 
        total: 'Unlimited', 
        icon: Heart, 
        color: 'text-purple-600',
        bgColor: 'bg-purple-100 dark:bg-purple-900/40',
        remaining: 'Unlimited',
        expiresAt: null,
        actionLabel: 'Find Specialist',
        actionTab: 'doctors',
        category: 'specialist',
        value: null
      },
    ],
    allowances: [
      {
        id: 'otc',
        name: 'OTC Allowance',
        used: 60,
        total: 200,
        remaining: 140,
        icon: ShoppingCart,
        color: 'text-green-600',
        bgColor: 'bg-green-100 dark:bg-green-900/40',
        period: 'Quarterly',
        expiresAt: '2025-03-31',
        actionLabel: 'Shop OTC Items',
        actionUrl: 'https://www.otcnetwork.com',
        isExternal: true,
        value: 140
      },
      {
        id: 'fitness',
        name: 'Fitness Reimbursement',
        used: 0,
        total: 50,
        remaining: 50,
        icon: Dumbbell,
        color: 'text-orange-600',
        bgColor: 'bg-orange-100 dark:bg-orange-900/40',
        period: 'Monthly',
        expiresAt: '2025-12-31',
        actionLabel: 'Submit Receipt',
        actionTab: 'documents',
        value: 50
      },
      {
        id: 'meals',
        name: 'Healthy Meals Benefit',
        used: 120,
        total: 300,
        remaining: 180,
        icon: Activity,
        color: 'text-pink-600',
        bgColor: 'bg-pink-100 dark:bg-pink-900/40',
        period: 'Quarterly',
        expiresAt: '2025-03-31',
        actionLabel: 'Order Meals',
        actionUrl: 'https://www.momskitchen.com',
        isExternal: true,
        value: 180
      },
      {
        id: 'transportation',
        name: 'Transportation Benefit',
        used: 4,
        total: 24,
        remaining: 20,
        icon: Activity,
        color: 'text-cyan-600',
        bgColor: 'bg-cyan-100 dark:bg-cyan-900/40',
        period: 'Annual (Rides)',
        expiresAt: '2025-12-31',
        actionLabel: 'Schedule Ride',
        actionUrl: 'https://www.modivcare.com',
        isExternal: true,
        value: null
      }
    ]
  };

  const setReminderMutation = useMutation({
    mutationFn: async ({ benefit, days }) => {
      const reminderDate = addDays(new Date(), parseInt(days));
      
      // Create a health alert for the reminder
      await base44.entities.HealthAlert.create({
        user_email: client?.email || 'user@example.com',
        client_id: client?.id,
        alert_type: 'benefit_expiring',
        priority: 'medium',
        title: `Reminder: Use Your ${benefit.name}`,
        message: `Don't forget to use your ${benefit.name} benefit! You have ${benefit.remaining} ${benefit.value ? `($${benefit.value})` : ''} remaining before it expires.`,
        action_text: benefit.actionLabel,
        action_url: benefit.actionTab || 'benefits',
        category: 'benefits',
        status: 'snoozed',
        snoozed_until: reminderDate.toISOString(),
        metadata: { benefit_id: benefit.id, reminder_days: days }
      });

      return { benefit, reminderDate };
    },
    onSuccess: ({ benefit, reminderDate }) => {
      setActiveReminders(prev => [...prev, { id: benefit.id, date: reminderDate }]);
      toast.success(`Reminder set for ${format(reminderDate, 'MMM d, yyyy')}`);
      setShowReminderModal(false);
    },
    onError: () => {
      toast.error('Failed to set reminder');
    }
  });

  const openReminderModal = (benefit) => {
    setSelectedBenefit(benefit);
    setShowReminderModal(true);
  };

  const handleSetReminder = () => {
    if (selectedBenefit) {
      setReminderMutation.mutate({ benefit: selectedBenefit, days: reminderDays });
    }
  };

  const handleAction = (benefit) => {
    if (benefit.isExternal && benefit.actionUrl) {
      window.open(benefit.actionUrl, '_blank');
    } else if (benefit.actionTab && onNavigate) {
      onNavigate(benefit.actionTab);
    }
  };

  const getDaysUntilExpiry = (expiresAt) => {
    if (!expiresAt) return null;
    return differenceInDays(new Date(expiresAt), new Date());
  };

  const getExpiryBadge = (expiresAt) => {
    const days = getDaysUntilExpiry(expiresAt);
    if (days === null) return null;
    
    if (days <= 14) {
      return <Badge className="bg-red-100 text-red-700 dark:bg-red-900/40 text-xs">Expires in {days}d</Badge>;
    } else if (days <= 30) {
      return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 text-xs">Expires in {days}d</Badge>;
    }
    return <Badge variant="outline" className="text-xs">Expires {format(new Date(expiresAt), 'MMM d')}</Badge>;
  };

  const hasReminder = (benefitId) => activeReminders.some(r => r.id === benefitId);

  const deductiblePercent = (benefitsData.financial.deductible.used / benefitsData.financial.deductible.total) * 100;
  const oopPercent = (benefitsData.financial.outOfPocketMax.used / benefitsData.financial.outOfPocketMax.total) * 100;

  // Calculate total unused value
  const totalUnusedValue = benefitsData.allowances.reduce((sum, a) => sum + (a.value || 0), 0);

  return (
    <div className="space-y-6">
      {/* Summary Banner */}
      <Card className="border-0 shadow-sm dark:bg-slate-800 overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold mb-1">Your Benefits Summary</h2>
              <p className="text-emerald-100 text-sm">Track and maximize your plan benefits</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold">${totalUnusedValue}</p>
              <p className="text-emerald-100 text-sm">in unused allowances</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-0 shadow-sm dark:bg-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">{benefitsData.financial.deductible.label}</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-white">
                  ${benefitsData.financial.deductible.used} <span className="text-sm font-normal text-slate-400">/ ${benefitsData.financial.deductible.total}</span>
                </p>
              </div>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${deductiblePercent >= 100 ? 'bg-green-100' : 'bg-blue-100'}`}>
                <DollarSign className={`w-6 h-6 ${deductiblePercent >= 100 ? 'text-green-600' : 'text-blue-600'}`} />
              </div>
            </div>
            <Progress value={Math.min(deductiblePercent, 100)} className="h-2" />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              {deductiblePercent >= 100 ? '✓ Deductible met!' : `$${benefitsData.financial.deductible.total - benefitsData.financial.deductible.used} remaining`}
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm dark:bg-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">{benefitsData.financial.outOfPocketMax.label}</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-white">
                  ${benefitsData.financial.outOfPocketMax.used.toLocaleString()} <span className="text-sm font-normal text-slate-400">/ ${benefitsData.financial.outOfPocketMax.total.toLocaleString()}</span>
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                <Heart className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <Progress value={oopPercent} className="h-2" />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              ${(benefitsData.financial.outOfPocketMax.total - benefitsData.financial.outOfPocketMax.used).toLocaleString()} until catastrophic coverage
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Dollar-Based Allowances */}
      <Card className="border-0 shadow-sm dark:bg-slate-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            Allowances & Credits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {benefitsData.allowances.map((allowance, idx) => {
              const AllowanceIcon = allowance.icon;
              const percent = (allowance.used / allowance.total) * 100;
              const daysLeft = getDaysUntilExpiry(allowance.expiresAt);
              const isExpiringSoon = daysLeft !== null && daysLeft <= 30;

              return (
                <motion.div
                  key={allowance.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`p-4 rounded-xl border ${isExpiringSoon ? 'border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10' : 'border-slate-200 dark:border-slate-700'}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg ${allowance.bgColor} flex items-center justify-center`}>
                        <AllowanceIcon className={`w-5 h-5 ${allowance.color}`} />
                      </div>
                      <div>
                        <p className="font-medium text-slate-800 dark:text-white">{allowance.name}</p>
                        <p className="text-xs text-slate-500">{allowance.period}</p>
                      </div>
                    </div>
                    {isExpiringSoon && (
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                    )}
                  </div>

                  <div className="space-y-2 mb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-slate-800 dark:text-white">
                        ${allowance.remaining}
                      </span>
                      <span className="text-sm text-slate-500">of ${allowance.total}</span>
                    </div>
                    <Progress value={percent} className="h-2" />
                  </div>

                  <div className="flex items-center justify-between">
                    {getExpiryBadge(allowance.expiresAt)}
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openReminderModal(allowance)}
                        disabled={hasReminder(allowance.id)}
                        className="text-xs"
                      >
                        <Bell className={`w-3 h-3 mr-1 ${hasReminder(allowance.id) ? 'text-green-600' : ''}`} />
                        {hasReminder(allowance.id) ? 'Set' : 'Remind'}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleAction(allowance)}
                        className="text-xs"
                      >
                        {allowance.actionLabel}
                        {allowance.isExternal ? <ExternalLink className="w-3 h-3 ml-1" /> : <ChevronRight className="w-3 h-3 ml-1" />}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Service-Based Benefits */}
      <Card className="border-0 shadow-sm dark:bg-slate-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="w-5 h-5 text-teal-600" />
            Healthcare Services
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {benefitsData.benefits.map((benefit, idx) => {
              const BenefitIcon = benefit.icon;
              const isUnlimited = benefit.total === 'Unlimited';
              const percent = isUnlimited ? 0 : (benefit.used / benefit.total) * 100;
              const isUnused = benefit.used === 0 && !isUnlimited;
              const daysLeft = getDaysUntilExpiry(benefit.expiresAt);

              return (
                <motion.div
                  key={benefit.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`p-4 rounded-xl border transition-all hover:shadow-md ${
                    isUnused ? 'border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10' : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg ${benefit.bgColor} flex items-center justify-center`}>
                        <BenefitIcon className={`w-4 h-4 ${benefit.color}`} />
                      </div>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{benefit.name}</span>
                    </div>
                    {isUnused && <Badge className="bg-amber-100 text-amber-700 text-xs">Unused</Badge>}
                  </div>

                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-xl font-bold text-slate-800 dark:text-white">{benefit.used}</span>
                      <span className="text-sm text-slate-400 ml-1">
                        {isUnlimited ? 'used' : `of ${benefit.total}`}
                      </span>
                    </div>
                    {!isUnlimited && (
                      <Badge variant="outline" className="text-xs">
                        {benefit.remaining} left
                      </Badge>
                    )}
                  </div>

                  {!isUnlimited && <Progress value={percent} className="h-1.5 mb-3" />}

                  <div className="flex items-center justify-between mt-3">
                    {benefit.expiresAt ? getExpiryBadge(benefit.expiresAt) : <span />}
                    <div className="flex items-center gap-1">
                      {!isUnlimited && benefit.remaining > 0 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openReminderModal(benefit)}
                          disabled={hasReminder(benefit.id)}
                          className="text-xs h-7 px-2"
                        >
                          <Bell className={`w-3 h-3 ${hasReminder(benefit.id) ? 'text-green-600' : ''}`} />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAction(benefit)}
                        className="text-xs h-7"
                      >
                        {benefit.actionLabel}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Important Dates */}
      <Card className="border-0 shadow-sm dark:bg-slate-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-500" />
            Important Dates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400">Plan Year Ends</p>
              <p className="font-semibold text-slate-800 dark:text-white">Dec 31, 2025</p>
            </div>
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-center border border-amber-100 dark:border-amber-800">
              <p className="text-xs text-amber-600 dark:text-amber-400">Q1 Benefits Expire</p>
              <p className="font-semibold text-amber-700 dark:text-amber-300">Mar 31, 2025</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400">AEP Starts</p>
              <p className="font-semibold text-slate-800 dark:text-white">Oct 15, 2025</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400">AEP Ends</p>
              <p className="font-semibold text-slate-800 dark:text-white">Dec 7, 2025</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reminder Modal */}
      <Dialog open={showReminderModal} onOpenChange={setShowReminderModal}>
        <DialogContent className="max-w-md dark:bg-slate-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-teal-600" />
              Set Benefit Reminder
            </DialogTitle>
          </DialogHeader>
          
          {selectedBenefit && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                <p className="font-medium text-slate-800 dark:text-white">{selectedBenefit.name}</p>
                <p className="text-sm text-slate-500 mt-1">
                  {selectedBenefit.value 
                    ? `$${selectedBenefit.remaining} remaining` 
                    : `${selectedBenefit.remaining} ${typeof selectedBenefit.remaining === 'number' ? 'remaining' : ''}`
                  }
                </p>
                {selectedBenefit.expiresAt && (
                  <p className="text-xs text-amber-600 mt-2">
                    Expires: {format(new Date(selectedBenefit.expiresAt), 'MMMM d, yyyy')}
                  </p>
                )}
              </div>

              <div>
                <Label className="mb-2 block">Remind me in</Label>
                <Select value={reminderDays} onValueChange={setReminderDays}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 day</SelectItem>
                    <SelectItem value="3">3 days</SelectItem>
                    <SelectItem value="7">1 week</SelectItem>
                    <SelectItem value="14">2 weeks</SelectItem>
                    <SelectItem value="30">1 month</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500 mt-2">
                  You'll receive a reminder on {format(addDays(new Date(), parseInt(reminderDays)), 'MMMM d, yyyy')}
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowReminderModal(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSetReminder}
                  disabled={setReminderMutation.isPending}
                  className="bg-teal-600 hover:bg-teal-700"
                >
                  {setReminderMutation.isPending ? (
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Bell className="w-4 h-4 mr-2" />
                  )}
                  Set Reminder
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}