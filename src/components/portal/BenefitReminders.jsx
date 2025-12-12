import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, Calendar, AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react';
import { format, differenceInDays, endOfMonth } from 'date-fns';

export default function BenefitReminders({ portalUserId }) {
  const { data: benefits = [] } = useQuery({
    queryKey: ['portalUserBenefits', portalUserId],
    queryFn: async () => {
      const apps = await base44.entities.BenefitApplication.filter({ 
        portal_user_id: portalUserId,
        status: 'approved'
      });
      return apps;
    },
    enabled: !!portalUserId
  });

  const today = new Date();
  const endOfThisMonth = endOfMonth(today);

  // Generate reminders
  const reminders = [];

  benefits.forEach(benefit => {
    // Check-in reminders (quarterly)
    if (benefit.next_check_in_date) {
      const daysUntilCheckIn = differenceInDays(new Date(benefit.next_check_in_date), today);
      if (daysUntilCheckIn <= 14 && daysUntilCheckIn >= 0) {
        reminders.push({
          type: 'check_in',
          severity: daysUntilCheckIn <= 7 ? 'high' : 'medium',
          benefit: benefit.benefit_name,
          date: benefit.next_check_in_date,
          daysRemaining: daysUntilCheckIn,
          message: `Time to verify your ${benefit.benefit_name} eligibility`,
          action: 'Complete check-in'
        });
      }
    }

    // Renewal reminders
    if (benefit.renewal_date) {
      const daysUntilRenewal = differenceInDays(new Date(benefit.renewal_date), today);
      if (daysUntilRenewal <= 60 && daysUntilRenewal >= 0) {
        reminders.push({
          type: 'renewal',
          severity: daysUntilRenewal <= 30 ? 'high' : 'medium',
          benefit: benefit.benefit_name,
          date: benefit.renewal_date,
          daysRemaining: daysUntilRenewal,
          message: `${benefit.benefit_name} renewal coming up`,
          action: 'Start renewal process'
        });
      }
    }

    // Monthly benefit usage reminder
    if (benefit.monthly_allowance && benefit.benefit_type === 'monthly_allowance') {
      const daysLeftInMonth = differenceInDays(endOfThisMonth, today);
      if (daysLeftInMonth <= 7) {
        reminders.push({
          type: 'use_benefits',
          severity: 'medium',
          benefit: benefit.benefit_name,
          date: endOfThisMonth,
          daysRemaining: daysLeftInMonth,
          message: `Use your ${benefit.benefit_name} benefits before month end`,
          action: 'View available balance'
        });
      }
    }
  });

  // Sort by severity and days remaining
  const sortedReminders = reminders.sort((a, b) => {
    if (a.severity === 'high' && b.severity !== 'high') return -1;
    if (a.severity !== 'high' && b.severity === 'high') return 1;
    return a.daysRemaining - b.daysRemaining;
  });

  if (sortedReminders.length === 0) {
    return null;
  }

  return (
    <Card className="clay-morphism border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-amber-600" />
          Benefit Reminders ({sortedReminders.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {sortedReminders.map((reminder, i) => (
          <div 
            key={i} 
            className={`p-4 clay-subtle rounded-xl border-l-4 ${
              reminder.severity === 'high' ? 'border-l-red-500' :
              reminder.severity === 'medium' ? 'border-l-amber-500' :
              'border-l-blue-500'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-sm text-slate-900 dark:text-white">{reminder.message}</h4>
                  {reminder.type === 'check_in' && <Calendar className="w-4 h-4 text-blue-600" />}
                  {reminder.type === 'renewal' && <AlertTriangle className="w-4 h-4 text-amber-600" />}
                  {reminder.type === 'use_benefits' && <CheckCircle className="w-4 h-4 text-green-600" />}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {format(new Date(reminder.date), 'MMM d, yyyy')} • {reminder.daysRemaining} days remaining
                </p>
              </div>
              <Badge className={
                reminder.severity === 'high' ? 'bg-red-100 text-red-700' :
                reminder.severity === 'medium' ? 'bg-amber-100 text-amber-700' :
                'bg-blue-100 text-blue-700'
              }>
                {reminder.severity}
              </Badge>
            </div>
            <Button size="sm" variant="outline" className="mt-2 w-full">
              {reminder.action}
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}