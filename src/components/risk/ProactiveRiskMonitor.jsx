import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, TrendingDown, Shield, Loader2, CheckCircle, X } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function ProactiveRiskMonitor({ agentId, compact = false }) {
  const queryClient = useQueryClient();

  const { data: risks = [], isLoading } = useQuery({
    queryKey: ['riskAssessments', agentId],
    queryFn: () => base44.entities.RiskAssessment.filter({ 
      agent_id: agentId, 
      status: { $in: ['identified', 'acknowledged'] }
    }, '-created_date'),
    enabled: !!agentId
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list()
  });

  const runMonitorMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('aiRiskMonitor', { agent_id: agentId });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['riskAssessments']);
      toast.success(`${data.risks_identified} risks identified from ${data.clients_analyzed} clients`);
    }
  });

  const acknowledgeRiskMutation = useMutation({
    mutationFn: async (riskId) => {
      await base44.entities.RiskAssessment.update(riskId, {
        status: 'acknowledged',
        acknowledged_date: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['riskAssessments']);
      toast.success('Risk acknowledged');
    }
  });

  const resolveRiskMutation = useMutation({
    mutationFn: async (riskId) => {
      await base44.entities.RiskAssessment.update(riskId, {
        status: 'resolved',
        resolved_date: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['riskAssessments']);
      toast.success('Risk resolved');
    }
  });

  const getRiskIcon = (type) => {
    switch (type) {
      case 'churn': return TrendingDown;
      case 'compliance': return Shield;
      default: return AlertTriangle;
    }
  };

  const getRiskColor = (level) => {
    switch (level) {
      case 'critical': return 'bg-red-100 text-red-700 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'medium': return 'bg-amber-100 text-amber-700 border-amber-300';
      case 'low': return 'bg-blue-100 text-blue-700 border-blue-300';
      default: return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  const criticalRisks = risks.filter(r => r.risk_level === 'critical' || r.risk_level === 'high');

  if (compact) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Risk Alerts
              {criticalRisks.length > 0 && (
                <Badge className="bg-red-600">{criticalRisks.length}</Badge>
              )}
            </CardTitle>
            <Button
              onClick={() => runMonitorMutation.mutate()}
              disabled={runMonitorMutation.isPending}
              size="sm"
              variant="outline"
            >
              {runMonitorMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Scan'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400" />
            </div>
          ) : criticalRisks.length === 0 ? (
            <div className="text-center py-4">
              <CheckCircle className="w-8 h-8 mx-auto text-green-600 mb-2" />
              <p className="text-sm text-slate-500">No critical risks detected</p>
            </div>
          ) : (
            <div className="space-y-2">
              {criticalRisks.slice(0, 3).map(risk => {
                const client = clients.find(c => c.id === risk.client_id);
                const Icon = getRiskIcon(risk.risk_type);
                return (
                  <div key={risk.id} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 flex-1">
                        <Icon className="w-4 h-4 text-red-600 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <Link to={createPageUrl('ClientDetail') + `?id=${risk.client_id}`}>
                            <p className="text-sm font-medium text-red-900 hover:underline">
                              {client ? `${client.first_name} ${client.last_name}` : 'Unknown Client'}
                            </p>
                          </Link>
                          <p className="text-xs text-red-700">{risk.risk_type}: {risk.risk_level}</p>
                          {risk.churn_probability && (
                            <Badge variant="outline" className="text-xs mt-1">
                              {risk.churn_probability}% churn risk
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        onClick={() => acknowledgeRiskMutation.mutate(risk.id)}
                        size="sm"
                        variant="ghost"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            Proactive Risk Monitoring
          </CardTitle>
          <Button
            onClick={() => runMonitorMutation.mutate()}
            disabled={runMonitorMutation.isPending}
            className="bg-red-600 hover:bg-red-700"
          >
            {runMonitorMutation.isPending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing...</>
            ) : (
              <><AlertTriangle className="w-4 h-4 mr-2" /> Run Risk Analysis</>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-400 mb-2" />
            <p className="text-sm text-slate-500">Loading risk assessments...</p>
          </div>
        ) : risks.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 mx-auto text-green-600 mb-3" />
            <p className="text-slate-600 mb-2">No active risks detected</p>
            <p className="text-sm text-slate-500">Run analysis to scan for potential issues</p>
          </div>
        ) : (
          <div className="space-y-4">
            {risks.map(risk => {
              const client = clients.find(c => c.id === risk.client_id);
              const Icon = getRiskIcon(risk.risk_type);
              return (
                <div key={risk.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <Icon className="w-5 h-5 text-red-600 mt-0.5" />
                      <div className="flex-1">
                        <Link to={createPageUrl('ClientDetail') + `?id=${risk.client_id}`}>
                          <p className="font-semibold text-slate-900 hover:underline">
                            {client ? `${client.first_name} ${client.last_name}` : 'Unknown Client'}
                          </p>
                        </Link>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getRiskColor(risk.risk_level)}>
                            {risk.risk_level} risk
                          </Badge>
                          <Badge variant="outline">{risk.risk_type}</Badge>
                          {risk.churn_probability && (
                            <Badge variant="outline">{risk.churn_probability}% churn</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {risk.status === 'identified' && (
                        <Button
                          onClick={() => acknowledgeRiskMutation.mutate(risk.id)}
                          size="sm"
                          variant="outline"
                        >
                          Acknowledge
                        </Button>
                      )}
                      <Button
                        onClick={() => resolveRiskMutation.mutate(risk.id)}
                        size="sm"
                        variant="ghost"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {risk.ai_insights && (
                    <div className="p-3 bg-slate-50 rounded text-sm text-slate-700">
                      {risk.ai_insights}
                    </div>
                  )}

                  {risk.risk_factors && risk.risk_factors.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-slate-600 mb-2">Risk Factors:</p>
                      <div className="space-y-1">
                        {risk.risk_factors.map((factor, idx) => (
                          <div key={idx} className="text-xs text-slate-600 flex items-start gap-2">
                            <Badge variant="outline" className="text-xs">{factor.severity}</Badge>
                            <span>{factor.factor}: {factor.impact}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {risk.preventative_actions && risk.preventative_actions.length > 0 && (
                    <div className="p-3 bg-blue-50 rounded">
                      <p className="text-xs font-semibold text-blue-900 mb-2">Recommended Actions:</p>
                      <ul className="space-y-1">
                        {risk.preventative_actions.map((action, idx) => (
                          <li key={idx} className="text-xs text-blue-900 flex items-start gap-2">
                            <Badge variant="outline" className="text-xs">{action.priority}</Badge>
                            <div>
                              <span className="font-medium">{action.action}</span>
                              <span className="text-blue-700"> • {action.timeline}</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}