import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  GraduationCap, Plus, AlertTriangle, CheckCircle, Clock,
  Calendar, Award
} from 'lucide-react';
import { differenceInDays, format } from 'date-fns';

export default function CECreditTracker({ agentId, licenses }) {
  const queryClient = useQueryClient();

  const { data: ceCredits = [] } = useQuery({
    queryKey: ['ceCredits', agentId],
    queryFn: () => base44.entities.CECredit.filter({ agent_id: agentId }),
    enabled: !!agentId
  });

  // CE requirements by state (simplified)
  const stateRequirements = {
    CA: { total: 24, ethics: 3, cycle_years: 2 },
    TX: { total: 24, ethics: 2, cycle_years: 2 },
    FL: { total: 24, ethics: 4, cycle_years: 2 },
    NY: { total: 15, ethics: 1, cycle_years: 2 },
    default: { total: 24, ethics: 3, cycle_years: 2 }
  };

  const creditsByState = useMemo(() => {
    const states = [...new Set(licenses.map(l => l.state))];
    return states.map(state => {
      const stateCredits = ceCredits.filter(c => c.state === state);
      const requirements = stateRequirements[state] || stateRequirements.default;
      const totalEarned = stateCredits.reduce((sum, c) => sum + (c.credits_earned || 0), 0);
      const ethicsEarned = stateCredits
        .filter(c => c.category === 'ethics')
        .reduce((sum, c) => sum + (c.credits_earned || 0), 0);

      const license = licenses.find(l => l.state === state);
      const daysUntilExpiry = license?.expiration_date 
        ? differenceInDays(new Date(license.expiration_date), new Date())
        : 999;

      return {
        state,
        totalRequired: requirements.total,
        totalEarned,
        ethicsRequired: requirements.ethics,
        ethicsEarned,
        percentComplete: Math.min(100, Math.round((totalEarned / requirements.total) * 100)),
        daysUntilExpiry,
        isCompliant: totalEarned >= requirements.total && ethicsEarned >= requirements.ethics,
        credits: stateCredits
      };
    });
  }, [ceCredits, licenses]);

  const urgentStates = creditsByState.filter(s => !s.isCompliant && s.daysUntilExpiry <= 90);

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-indigo-600" />
            CE Credit Tracker
          </CardTitle>
          <Button size="sm" variant="outline">
            <Plus className="w-4 h-4 mr-1" />
            Add Credit
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {urgentStates.length > 0 && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="text-sm font-medium text-red-800">Urgent: CE Credits Needed</span>
            </div>
            <p className="text-xs text-red-700">
              {urgentStates.map(s => s.state).join(', ')} licenses expiring soon with incomplete CE
            </p>
          </div>
        )}

        <div className="space-y-3">
          {creditsByState.map((stateData, i) => (
            <div key={i} className="p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono">{stateData.state}</Badge>
                  {stateData.isCompliant ? (
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Clock className="w-4 h-4 text-amber-500" />
                  )}
                </div>
                <span className="text-sm text-slate-600">
                  {stateData.daysUntilExpiry} days until renewal
                </span>
              </div>

              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600">Total Credits</span>
                    <span className="font-medium">
                      {stateData.totalEarned}/{stateData.totalRequired}
                    </span>
                  </div>
                  <Progress 
                    value={stateData.percentComplete} 
                    className={`h-2 ${stateData.percentComplete >= 100 ? '[&>div]:bg-emerald-500' : '[&>div]:bg-blue-500'}`}
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600">Ethics Credits</span>
                    <span className="font-medium">
                      {stateData.ethicsEarned}/{stateData.ethicsRequired}
                    </span>
                  </div>
                  <Progress 
                    value={Math.min(100, (stateData.ethicsEarned / stateData.ethicsRequired) * 100)} 
                    className="h-2"
                  />
                </div>
              </div>

              {stateData.credits.length > 0 && (
                <div className="mt-2 pt-2 border-t border-slate-200">
                  <p className="text-xs text-slate-500 mb-1">Recent Courses:</p>
                  {stateData.credits.slice(0, 2).map((credit, j) => (
                    <div key={j} className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 truncate">{credit.course_name}</span>
                      <Badge variant="outline" className="text-[10px]">{credit.credits_earned} hrs</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {creditsByState.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-6">
            No licenses to track CE credits for
          </p>
        )}
      </CardContent>
    </Card>
  );
}