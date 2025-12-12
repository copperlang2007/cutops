import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Activity, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ClientHealthScoreCard({ healthData, compact = false }) {
  if (!healthData) return null;

  const getStatusConfig = (status) => {
    switch (status) {
      case 'healthy':
        return {
          color: 'text-green-600',
          bgColor: 'bg-green-100 dark:bg-green-900/30',
          borderColor: 'border-green-300 dark:border-green-800',
          icon: CheckCircle2,
          label: 'Healthy'
        };
      case 'at_risk':
        return {
          color: 'text-amber-600',
          bgColor: 'bg-amber-100 dark:bg-amber-900/30',
          borderColor: 'border-amber-300 dark:border-amber-800',
          icon: AlertTriangle,
          label: 'At Risk'
        };
      case 'critical':
        return {
          color: 'text-red-600',
          bgColor: 'bg-red-100 dark:bg-red-900/30',
          borderColor: 'border-red-300 dark:border-red-800',
          icon: AlertTriangle,
          label: 'Critical'
        };
      default:
        return {
          color: 'text-slate-600',
          bgColor: 'bg-slate-100',
          borderColor: 'border-slate-300',
          icon: Activity,
          label: 'Unknown'
        };
    }
  };

  const config = getStatusConfig(healthData.health_status);
  const StatusIcon = config.icon;

  if (compact) {
    return (
      <div className={cn("flex items-center gap-3 p-3 rounded-lg border", config.borderColor, config.bgColor)}>
        <div className={cn("w-12 h-12 rounded-full flex items-center justify-center", config.bgColor)}>
          <StatusIcon className={cn("w-6 h-6", config.color)} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-slate-900 dark:text-white">Health Score</span>
            <Badge className={config.bgColor + ' ' + config.color}>
              {config.label}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Progress value={healthData.health_score} className="flex-1 h-2" />
            <span className={cn("text-lg font-bold", config.color)}>
              {healthData.health_score}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className={cn("border-2", config.borderColor)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StatusIcon className={cn("w-5 h-5", config.color)} />
            Client Health Score
          </div>
          <Badge className={config.bgColor + ' ' + config.color}>
            {config.label}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className={cn("text-5xl font-bold mb-2", config.color)}>
            {healthData.health_score}
          </div>
          <Progress value={healthData.health_score} className="h-3" />
        </div>

        {healthData.summary && (
          <p className="text-sm text-slate-600 dark:text-slate-400 italic">
            "{healthData.summary}"
          </p>
        )}

        {healthData.next_best_action && (
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-xs font-semibold text-blue-900 dark:text-blue-200 mb-1">
              Next Best Action:
            </p>
            <p className="text-sm text-blue-800 dark:text-blue-300">
              {healthData.next_best_action}
            </p>
          </div>
        )}

        {healthData.risk_factors?.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-300 mb-2">
              Risk Factors:
            </h4>
            <div className="space-y-2">
              {healthData.risk_factors.slice(0, 3).map((risk, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs">
                  <AlertTriangle className="w-3 h-3 text-red-500 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-medium text-slate-900 dark:text-white">{risk.factor}</span>
                    <span className="text-slate-500"> - {risk.impact}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {healthData.positive_indicators?.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-300 mb-2">
              Positive Indicators:
            </h4>
            <div className="space-y-1">
              {healthData.positive_indicators.slice(0, 3).map((indicator, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs">
                  <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0" />
                  <span className="text-slate-700 dark:text-slate-300">{indicator.indicator}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}