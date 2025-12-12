import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, CheckCircle, AlertTriangle, TrendingUp, Calendar, Target } from 'lucide-react';

export default function OnboardingSummaryReport({ summary, clientName }) {
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'medium': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      default: return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    }
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-amber-600';
      default: return 'text-green-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Executive Summary */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-600" />
            Onboarding Summary: {clientName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-700 dark:text-slate-300">{summary.executive_summary}</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Client Profile */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">Client Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Demographics</p>
              <p className="text-sm text-slate-700 dark:text-slate-300">{summary.client_profile.demographics}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Health Overview</p>
              <p className="text-sm text-slate-700 dark:text-slate-300">{summary.client_profile.health_overview}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Coverage Needs</p>
              <div className="flex flex-wrap gap-2">
                {summary.client_profile.coverage_needs.map((need, i) => (
                  <Badge key={i} variant="outline">{need}</Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Selected Plan */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">Selected Plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{summary.selected_plan.plan_name}</p>
              <p className="text-lg text-teal-600">{summary.selected_plan.monthly_premium}/month</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Key Benefits</p>
              <ul className="space-y-1">
                {summary.selected_plan.key_benefits.map((benefit, i) => (
                  <li key={i} className="text-sm text-slate-700 dark:text-slate-300 flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Next Steps */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" />
            Next Steps
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {summary.next_steps.map((step, i) => (
              <div key={i} className="p-3 rounded-lg border dark:border-slate-700">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="font-medium text-slate-900 dark:text-white">{step.action}</p>
                  <Badge className={getPriorityColor(step.priority)}>{step.priority}</Badge>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {step.deadline}
                  </span>
                  <span className="capitalize">{step.owner}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Agent Action Items */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Your Action Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {summary.agent_action_items.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                <span className="text-teal-600 font-bold">{i + 1}.</span>
                {item}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Assessment */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              Risk Assessment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Churn Risk</p>
              <p className={`text-lg font-bold capitalize ${getRiskColor(summary.risk_assessment.churn_risk)}`}>
                {summary.risk_assessment.churn_risk}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Retention Strategies</p>
              <ul className="space-y-1">
                {summary.risk_assessment.retention_strategies.map((strategy, i) => (
                  <li key={i} className="text-xs text-slate-700 dark:text-slate-300">• {strategy}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Upsell Opportunities */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Growth Opportunities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {summary.upsell_opportunities.map((opp, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                  <TrendingUp className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                  {opp}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Agent Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
            {summary.notes_for_agent}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}