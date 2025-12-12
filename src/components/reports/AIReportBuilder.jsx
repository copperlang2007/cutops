import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  FileText, Download, Sparkles, Loader2, TrendingUp, 
  CheckCircle, AlertTriangle, DollarSign, Users, Target
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function AIReportBuilder() {
  const [reportType, setReportType] = React.useState('agent_performance');
  const [selectedAgent, setSelectedAgent] = React.useState('');
  const [dateRange, setDateRange] = React.useState('last_30_days');
  const [report, setReport] = React.useState(null);

  const { data: agents = [] } = useQuery({
    queryKey: ['agents'],
    queryFn: () => base44.entities.Agent.list()
  });

  const generateReportMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('aiReportGenerator', {
        report_type: reportType,
        agent_id: reportType === 'agent_performance' ? selectedAgent : null,
        date_range: dateRange,
        include_metrics: ['all']
      });
      return response.data;
    },
    onSuccess: (data) => {
      setReport(data.report);
    }
  });

  const downloadReport = () => {
    const content = generateReportContent(report);
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportType}_${dateRange}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  };

  const generateReportContent = (report) => {
    if (reportType === 'agent_performance') {
      return `
AGENT PERFORMANCE REPORT
========================

Agent: ${report.agent_name}
Period: ${report.period}
Generated: ${new Date().toISOString()}

EXECUTIVE SUMMARY
-----------------
${report.ai_summary.executive_summary}

PERFORMANCE RATING: ${report.ai_summary.performance_rating.toUpperCase()}

KEY METRICS
-----------
Clients Added: ${report.metrics.clients_added}
Conversion Rate: ${report.metrics.conversion_rate}%
Total Interactions: ${report.metrics.total_interactions}
Sentiment Score: ${report.metrics.sentiment_score}/100
Task Completion: ${report.metrics.task_completion_rate}%
Total Commissions: $${report.metrics.total_commissions}
Retention Rate: ${report.metrics.retention_rate}%

KEY ACHIEVEMENTS
----------------
${report.ai_summary.key_achievements.map((a, i) => `${i + 1}. ${a}`).join('\n')}

AREAS OF EXCELLENCE
-------------------
${report.ai_summary.areas_of_excellence.map((a, i) => `${i + 1}. ${a}`).join('\n')}

IMPROVEMENT AREAS
-----------------
${report.ai_summary.improvement_areas.map((a, i) => `${i + 1}. ${a}`).join('\n')}

RECOMMENDATIONS
---------------
${report.ai_summary.recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}

NEXT PERIOD GOALS
-----------------
${report.ai_summary.next_period_goals.map((g, i) => `${i + 1}. ${g}`).join('\n')}
      `;
    } else {
      return `
EXECUTIVE SUMMARY REPORT
========================

Period: ${report.period}
Generated: ${new Date().toISOString()}

EXECUTIVE OVERVIEW
------------------
${report.ai_summary.executive_overview}

BUSINESS HEALTH: ${report.ai_summary.business_health.status.toUpperCase()} (${report.ai_summary.business_health.score}/100)
${report.ai_summary.business_health.summary}

KEY METRICS
-----------
Total Agents: ${report.metrics.total_agents} (${report.metrics.active_agents} active)
Total Clients: ${report.metrics.total_clients} (${report.metrics.new_clients} new)
Active Clients: ${report.metrics.active_clients}
Total Interactions: ${report.metrics.total_interactions}
Total Commissions: $${report.metrics.total_commissions}
Task Completion Rate: ${report.metrics.task_completion_rate}%

HIGHLIGHTS
----------
${report.ai_summary.highlights.map((h, i) => `${i + 1}. ${h}`).join('\n')}

CHALLENGES
----------
${report.ai_summary.challenges.map((c, i) => `${i + 1}. ${c}`).join('\n')}

STRATEGIC RECOMMENDATIONS
-------------------------
${report.ai_summary.strategic_recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}

GROWTH OPPORTUNITIES
--------------------
${report.ai_summary.growth_opportunities.map((o, i) => `${i + 1}. ${o}`).join('\n')}

FORECAST
--------
${report.ai_summary.forecast.next_month_projection}
Growth Trajectory: ${report.ai_summary.forecast.growth_trajectory}
      `;
    }
  };

  return (
    <div className="space-y-6">
      {/* Report Configuration */}
      <Card className="border-0 shadow-lg dark:bg-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            AI Report Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Report Type
              </label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="agent_performance">Agent Performance</SelectItem>
                  <SelectItem value="executive_summary">Executive Summary</SelectItem>
                  <SelectItem value="team_performance">Team Performance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {reportType === 'agent_performance' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Select Agent
                </label>
                <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose agent..." />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.map(agent => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.first_name} {agent.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Date Range
              </label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last_7_days">Last 7 Days</SelectItem>
                  <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                  <SelectItem value="this_month">This Month</SelectItem>
                  <SelectItem value="last_month">Last Month</SelectItem>
                  <SelectItem value="this_quarter">This Quarter</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={() => generateReportMutation.mutate()}
            disabled={generateReportMutation.isPending || (reportType === 'agent_performance' && !selectedAgent)}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
          >
            {generateReportMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating Report...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Report
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Report Display */}
      {report && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {reportType === 'agent_performance' ? (
            <>
              {/* Performance Score */}
              <Card className="border-0 shadow-lg dark:bg-slate-800">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Performance Report - {report.agent_name}</CardTitle>
                    <Button size="sm" variant="outline" onClick={downloadReport}>
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </Button>
                  </div>
                  <p className="text-sm text-slate-500">{report.period}</p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="p-4 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
                    <Badge className={
                      report.ai_summary.performance_rating === 'excellent' ? 'bg-green-100 text-green-700' :
                      report.ai_summary.performance_rating === 'above_average' ? 'bg-blue-100 text-blue-700' :
                      report.ai_summary.performance_rating === 'average' ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }>
                      {report.ai_summary.performance_rating}
                    </Badge>
                    <p className="text-sm text-slate-700 dark:text-slate-300 mt-2">
                      {report.ai_summary.executive_summary}
                    </p>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900">
                      <Users className="w-5 h-5 text-teal-600 mb-1" />
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">
                        {report.metrics.clients_added}
                      </p>
                      <p className="text-xs text-slate-500">Clients Added</p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900">
                      <Target className="w-5 h-5 text-blue-600 mb-1" />
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">
                        {report.metrics.conversion_rate}%
                      </p>
                      <p className="text-xs text-slate-500">Conversion Rate</p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900">
                      <CheckCircle className="w-5 h-5 text-green-600 mb-1" />
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">
                        {report.metrics.task_completion_rate}%
                      </p>
                      <p className="text-xs text-slate-500">Tasks Completed</p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900">
                      <DollarSign className="w-5 h-5 text-emerald-600 mb-1" />
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">
                        ${report.metrics.total_commissions.toLocaleString()}
                      </p>
                      <p className="text-xs text-slate-500">Commissions</p>
                    </div>
                  </div>

                  {/* Key Achievements */}
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      Key Achievements
                    </h4>
                    <ul className="space-y-2">
                      {report.ai_summary.key_achievements.map((achievement, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-600 mt-1.5" />
                          {achievement}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Recommendations */}
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-purple-600" />
                      Recommendations
                    </h4>
                    <ul className="space-y-2">
                      {report.ai_summary.recommendations.map((rec, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                          <div className="w-1.5 h-1.5 rounded-full bg-purple-600 mt-1.5" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Next Period Goals */}
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                      <Target className="w-5 h-5 text-blue-600" />
                      Next Period Goals
                    </h4>
                    <ul className="space-y-2">
                      {report.ai_summary.next_period_goals.map((goal, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5" />
                          {goal}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            /* Executive Summary */
            <Card className="border-0 shadow-lg dark:bg-slate-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Executive Summary</CardTitle>
                  <Button size="sm" variant="outline" onClick={downloadReport}>
                    <Download className="w-4 h-4 mr-1" />
                    Download
                  </Button>
                </div>
                <p className="text-sm text-slate-500">{report.period}</p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Business Health Score */}
                <div className="p-6 rounded-xl bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-900/20 dark:to-emerald-900/20">
                  <div className="flex items-center gap-4">
                    <div className={`text-5xl font-bold ${
                      report.ai_summary.business_health.score >= 80 ? 'text-green-600' :
                      report.ai_summary.business_health.score >= 60 ? 'text-amber-600' :
                      'text-red-600'
                    }`}>
                      {report.ai_summary.business_health.score}
                    </div>
                    <div className="flex-1">
                      <Badge className={
                        report.ai_summary.business_health.status === 'excellent' ? 'bg-green-100 text-green-700' :
                        report.ai_summary.business_health.status === 'good' ? 'bg-blue-100 text-blue-700' :
                        'bg-amber-100 text-amber-700'
                      }>
                        {report.ai_summary.business_health.status}
                      </Badge>
                      <p className="text-sm text-slate-700 dark:text-slate-300 mt-2">
                        {report.ai_summary.business_health.summary}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Overview */}
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Overview</h4>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    {report.ai_summary.executive_overview}
                  </p>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 text-center">
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                      {report.metrics.total_agents}
                    </p>
                    <p className="text-xs text-slate-500">Total Agents</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 text-center">
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                      {report.metrics.total_clients}
                    </p>
                    <p className="text-xs text-slate-500">Total Clients</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 text-center">
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                      {report.metrics.total_interactions}
                    </p>
                    <p className="text-xs text-slate-500">Interactions</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 text-center">
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                      ${report.metrics.total_commissions.toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-500">Commissions</p>
                  </div>
                </div>

                {/* Highlights & Challenges */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                      Highlights
                    </h4>
                    <ul className="space-y-2">
                      {report.ai_summary.highlights.map((h, i) => (
                        <li key={i} className="text-sm text-slate-700 dark:text-slate-300 flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          {h}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-amber-600" />
                      Challenges
                    </h4>
                    <ul className="space-y-2">
                      {report.ai_summary.challenges.map((c, i) => (
                        <li key={i} className="text-sm text-slate-700 dark:text-slate-300 flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Strategic Recommendations */}
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-3">
                    Strategic Recommendations
                  </h4>
                  <ul className="space-y-2">
                    {report.ai_summary.strategic_recommendations.map((rec, i) => (
                      <li key={i} className="text-sm text-slate-700 dark:text-slate-300 flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-600 mt-1.5" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      )}
    </div>
  );
}