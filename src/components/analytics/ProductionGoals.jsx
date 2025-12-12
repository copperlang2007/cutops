import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { 
  Target, TrendingUp, Award, Calendar, Edit, CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { differenceInDays, endOfMonth, startOfMonth, format } from 'date-fns';

export default function ProductionGoals({ agent, policies, commissions }) {
  const [goals, setGoals] = useState({
    monthly_policies: 15,
    monthly_commission: 10000,
    quarterly_policies: 50,
    annual_commission: 100000
  });
  const [isEditing, setIsEditing] = useState(false);

  const progress = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const daysInMonth = differenceInDays(monthEnd, monthStart) + 1;
    const daysPassed = differenceInDays(now, monthStart) + 1;
    const expectedProgress = (daysPassed / daysInMonth) * 100;

    // This month's data
    const monthPolicies = policies?.filter(p => 
      new Date(p.effective_date) >= monthStart
    ).length || 0;
    
    const monthCommission = commissions?.filter(c => 
      c.payment_date && new Date(c.payment_date) >= monthStart
    ).reduce((sum, c) => sum + (c.amount || 0), 0) || 0;

    // Annual data (YTD)
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const annualCommission = commissions?.filter(c => 
      c.payment_date && new Date(c.payment_date) >= yearStart
    ).reduce((sum, c) => sum + (c.amount || 0), 0) || 0;

    return {
      monthPolicies,
      monthPoliciesPercent: Math.min(100, Math.round((monthPolicies / goals.monthly_policies) * 100)),
      monthCommission,
      monthCommissionPercent: Math.min(100, Math.round((monthCommission / goals.monthly_commission) * 100)),
      annualCommission,
      annualCommissionPercent: Math.min(100, Math.round((annualCommission / goals.annual_commission) * 100)),
      expectedProgress,
      daysRemaining: differenceInDays(monthEnd, now)
    };
  }, [policies, commissions, goals]);

  const isOnTrack = (actual, expected) => actual >= expected * 0.9;
  const isAhead = (actual, expected) => actual >= expected;

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-600" />
            Production Goals
          </CardTitle>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => setIsEditing(!isEditing)}
          >
            <Edit className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Month Summary */}
        <div className="p-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-emerald-800">
              {format(new Date(), 'MMMM yyyy')}
            </span>
            <Badge variant="outline" className="bg-emerald-100 text-emerald-700">
              {progress.daysRemaining} days left
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-xs text-emerald-600">
            <Calendar className="w-3 h-3" />
            <span>Expected progress: {Math.round(progress.expectedProgress)}%</span>
          </div>
        </div>

        {/* Goals */}
        <div className="space-y-4">
          {/* Monthly Policies */}
          <div className="p-3 bg-slate-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">Monthly Policies</span>
              <div className="flex items-center gap-2">
                {isAhead(progress.monthPoliciesPercent, progress.expectedProgress) ? (
                  <Badge className="bg-emerald-100 text-emerald-700">
                    <TrendingUp className="w-3 h-3 mr-1" />Ahead
                  </Badge>
                ) : isOnTrack(progress.monthPoliciesPercent, progress.expectedProgress) ? (
                  <Badge className="bg-blue-100 text-blue-700">
                    <CheckCircle className="w-3 h-3 mr-1" />On Track
                  </Badge>
                ) : (
                  <Badge className="bg-amber-100 text-amber-700">
                    <AlertTriangle className="w-3 h-3 mr-1" />Behind
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <Progress value={progress.monthPoliciesPercent} className="h-3" />
              </div>
              <span className="text-sm font-medium text-slate-700 min-w-[60px] text-right">
                {progress.monthPolicies}/{isEditing ? (
                  <Input
                    type="number"
                    value={goals.monthly_policies}
                    onChange={(e) => setGoals(prev => ({ ...prev, monthly_policies: Number(e.target.value) }))}
                    className="w-16 h-6 inline text-sm"
                  />
                ) : goals.monthly_policies}
              </span>
            </div>
          </div>

          {/* Monthly Commission */}
          <div className="p-3 bg-slate-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">Monthly Commission</span>
              <div className="flex items-center gap-2">
                {isAhead(progress.monthCommissionPercent, progress.expectedProgress) ? (
                  <Badge className="bg-emerald-100 text-emerald-700">
                    <TrendingUp className="w-3 h-3 mr-1" />Ahead
                  </Badge>
                ) : isOnTrack(progress.monthCommissionPercent, progress.expectedProgress) ? (
                  <Badge className="bg-blue-100 text-blue-700">
                    <CheckCircle className="w-3 h-3 mr-1" />On Track
                  </Badge>
                ) : (
                  <Badge className="bg-amber-100 text-amber-700">
                    <AlertTriangle className="w-3 h-3 mr-1" />Behind
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <Progress value={progress.monthCommissionPercent} className="h-3" />
              </div>
              <span className="text-sm font-medium text-slate-700 min-w-[100px] text-right">
                ${progress.monthCommission.toLocaleString()}/{isEditing ? (
                  <Input
                    type="number"
                    value={goals.monthly_commission}
                    onChange={(e) => setGoals(prev => ({ ...prev, monthly_commission: Number(e.target.value) }))}
                    className="w-20 h-6 inline text-sm"
                  />
                ) : `$${goals.monthly_commission.toLocaleString()}`}
              </span>
            </div>
          </div>

          {/* Annual Commission */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-amber-800">
                <Award className="w-4 h-4 inline mr-1" />
                Annual Commission Goal
              </span>
              <span className="text-sm font-bold text-amber-700">
                {progress.annualCommissionPercent}%
              </span>
            </div>
            <Progress value={progress.annualCommissionPercent} className="h-3 [&>div]:bg-amber-500" />
            <p className="text-xs text-amber-600 mt-1">
              ${progress.annualCommission.toLocaleString()} of ${goals.annual_commission.toLocaleString()} YTD
            </p>
          </div>
        </div>

        {isEditing && (
          <Button 
            className="w-full mt-4" 
            onClick={() => setIsEditing(false)}
          >
            Save Goals
          </Button>
        )}
      </CardContent>
    </Card>
  );
}