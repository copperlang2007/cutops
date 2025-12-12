import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { FileText, Sparkles, Loader2, Download, Copy, Mail, Calendar } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { format, subDays } from 'date-fns';
import ReactMarkdown from 'react-markdown';

export default function AIReportGenerator({ agents, commissions, contracts, licenses, carriers }) {
  const [config, setConfig] = useState({
    reportType: 'performance',
    period: '30',
    groupBy: 'all',
    selectedCarriers: [],
    includeCharts: true,
    includeRecommendations: true
  });
  const [report, setReport] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const reportTypes = [
    { value: 'performance', label: 'Performance Summary' },
    { value: 'commission', label: 'Commission Analysis' },
    { value: 'compliance', label: 'Compliance Report' },
    { value: 'onboarding', label: 'Onboarding Status' },
    { value: 'carrier', label: 'Carrier Performance' },
    { value: 'executive', label: 'Executive Summary' }
  ];

  const generateReport = async () => {
    setIsGenerating(true);
    try {
      const periodDays = parseInt(config.period);
      const startDate = subDays(new Date(), periodDays);
      
      const filteredCommissions = commissions.filter(c => 
        c.created_date && new Date(c.created_date) >= startDate
      );
      
      const metrics = {
        totalAgents: agents.length,
        activeAgents: agents.filter(a => a.onboarding_status === 'ready_to_sell').length,
        totalCommissions: filteredCommissions.reduce((sum, c) => sum + (c.amount || 0), 0),
        commissionCount: filteredCommissions.length,
        activeContracts: contracts.filter(c => ['active', 'contract_signed'].includes(c.contract_status)).length,
        expiringLicenses: licenses.filter(l => {
          if (!l.expiration_date) return false;
          const days = Math.ceil((new Date(l.expiration_date) - new Date()) / (1000 * 60 * 60 * 24));
          return days > 0 && days <= 60;
        }).length,
        carrierBreakdown: {}
      };

      // Carrier breakdown
      filteredCommissions.forEach(c => {
        if (c.carrier_name) {
          metrics.carrierBreakdown[c.carrier_name] = (metrics.carrierBreakdown[c.carrier_name] || 0) + (c.amount || 0);
        }
      });

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate a professional ${reportTypes.find(r => r.value === config.reportType)?.label} report for an insurance agency.

Report Configuration:
- Report Type: ${config.reportType}
- Period: Last ${config.period} days
- Group By: ${config.groupBy}
- Include Recommendations: ${config.includeRecommendations}

Data Metrics:
${JSON.stringify(metrics, null, 2)}

Generate a comprehensive, professionally formatted report in markdown with:
1. Executive Summary
2. Key Performance Indicators
3. Detailed Analysis
4. ${config.includeRecommendations ? 'Strategic Recommendations' : ''}
5. Conclusion

Use proper headings, bullet points, and formatting. Include specific numbers and percentages from the data.`,
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            generated_date: { type: "string" },
            period: { type: "string" },
            executive_summary: { type: "string" },
            markdown_content: { type: "string" },
            key_metrics: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  label: { type: "string" },
                  value: { type: "string" },
                  change: { type: "string" },
                  trend: { type: "string" }
                }
              }
            },
            recommendations: { type: "array", items: { type: "string" } }
          }
        }
      });

      setReport(result);
      toast.success('Report generated successfully');
    } catch (err) {
      toast.error('Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (report?.markdown_content) {
      navigator.clipboard.writeText(report.markdown_content);
      toast.success('Report copied to clipboard');
    }
  };

  const downloadReport = () => {
    if (!report) return;
    const blob = new Blob([report.markdown_content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.title?.replace(/\s+/g, '_') || 'report'}_${format(new Date(), 'yyyy-MM-dd')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="border-0 shadow-premium dark:bg-slate-800/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2 dark:text-white">
          <FileText className="w-5 h-5 text-blue-500" />
          AI Report Generator
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Configuration */}
          <div className="space-y-4">
            <div>
              <Label>Report Type</Label>
              <Select value={config.reportType} onValueChange={(v) => setConfig({ ...config, reportType: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {reportTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Time Period</Label>
              <Select value={config.period} onValueChange={(v) => setConfig({ ...config, period: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 Days</SelectItem>
                  <SelectItem value="30">Last 30 Days</SelectItem>
                  <SelectItem value="90">Last 90 Days</SelectItem>
                  <SelectItem value="180">Last 6 Months</SelectItem>
                  <SelectItem value="365">Last Year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Group By</Label>
              <Select value={config.groupBy} onValueChange={(v) => setConfig({ ...config, groupBy: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Data</SelectItem>
                  <SelectItem value="team">By Team</SelectItem>
                  <SelectItem value="carrier">By Carrier</SelectItem>
                  <SelectItem value="agent">By Agent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox 
                id="recommendations" 
                checked={config.includeRecommendations}
                onCheckedChange={(c) => setConfig({ ...config, includeRecommendations: c })}
              />
              <Label htmlFor="recommendations">Include AI Recommendations</Label>
            </div>

            <Button 
              onClick={generateReport} 
              disabled={isGenerating}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
              {isGenerating ? 'Generating...' : 'Generate Report'}
            </Button>
          </div>

          {/* Report Preview */}
          <div className="lg:col-span-2">
            {!report ? (
              <div className="h-full flex items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-8">
                <div className="text-center">
                  <FileText className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p>Configure and generate a report to preview</p>
                </div>
              </div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                {/* Actions */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-800 dark:text-white">{report.title}</h3>
                    <p className="text-xs text-slate-500">{report.period}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={copyToClipboard}>
                      <Copy className="w-4 h-4 mr-1" /> Copy
                    </Button>
                    <Button variant="outline" size="sm" onClick={downloadReport}>
                      <Download className="w-4 h-4 mr-1" /> Download
                    </Button>
                  </div>
                </div>

                {/* Key Metrics */}
                {report.key_metrics?.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {report.key_metrics.map((metric, i) => (
                      <div key={i} className="p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg">
                        <p className="text-xs text-slate-500">{metric.label}</p>
                        <p className="text-lg font-bold text-slate-800 dark:text-white">{metric.value}</p>
                        {metric.change && (
                          <p className={`text-xs ${metric.trend === 'up' ? 'text-emerald-600' : 'text-red-600'}`}>
                            {metric.change}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Report Content */}
                <div className="prose prose-sm dark:prose-invert max-w-none p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 max-h-96 overflow-y-auto">
                  <ReactMarkdown>{report.markdown_content}</ReactMarkdown>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}