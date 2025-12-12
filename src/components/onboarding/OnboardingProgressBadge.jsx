import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Clock } from 'lucide-react';

export default function OnboardingProgressBadge({ items = [], compact = false }) {
  const completedCount = items.filter(i => i.is_completed).length;
  const totalCount = items.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  if (totalCount === 0) {
    return compact ? null : (
      <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-200">
        <Clock className="w-3 h-3 mr-1" />
        Not Started
      </Badge>
    );
  }

  if (progressPercent === 100) {
    return (
      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
        <CheckCircle className="w-3 h-3 mr-1" />
        {compact ? '100%' : 'Onboarding Complete'}
      </Badge>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2 min-w-[80px]">
        <Progress value={progressPercent} className="h-1.5 flex-1" />
        <span className="text-xs text-slate-500">{progressPercent}%</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
        {completedCount}/{totalCount}
      </Badge>
      <Progress value={progressPercent} className="h-2 w-20" />
    </div>
  );
}