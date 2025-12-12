import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  DollarSign, Sparkles, Loader2, AlertTriangle, CheckCircle,
  FileText, Download, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

export default function AICommissionReconciliation({ commissions, contracts, agents }) {
  const [reconciliation, setReconciliation] = useState(null);
  const [isReconciling, setIsReconciling] = useState(false);
  const [disputeLetter, setDisputeLetter] = useState(null);

  const reconcileCommissions = async () => {
    setIsReconciling(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Reconcile these commission records against expected payouts:

COMMISSIONS RECEIVED:
${commissions.slice(0, 20).map(c => 
  `- ${c.carrier_name}: $${c.amount}, Type=${c.commission_type}, Status=${c.status}, Policy=${c.policy_number || 'N/A'}`
).join('\n')}

ACTIVE CONTRACTS:
${contracts.filter(c => c.contract_status === 'active').slice(0, 10).map(c =>
  `- ${c.carrier_name}: Level=${c.commission_level || 'Standard'}, Writing#=${c.writing_number || 'N/A'}`
).join('\n')}

Analyze for:
1. Missing expected commissions based on active contracts
2. Discrepancies between expected rates and actual payments
3. Delayed payments (beyond typical 45-60 day cycle)
4. Duplicate or incorrect payments
5. Commission clawbacks that may be disputable

Flag all discrepancies with severity and recommended actions.`,
        response_json_schema: {
          type: "object",
          properties: {
            summary: {
              type: "object",
              properties: {
                total_received: { type: "number" },
                expected_total: { type: "number" },
                variance: { type: "number" },
                discrepancy_count: { type: "number" }
              }
            },
            discrepancies: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  carrier: { type: "string" },
                  issue_type: { type: "string" },
                  expected_amount: { type: "number" },
                  actual_amount: { type: "number" },
                  variance: { type: "number" },
                  severity: { type: "string" },
                  recommendation: { type: "string" }
                }
              }
            },
            missing_payments: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  carrier: { type: "string" },
                  expected_amount: { type: "number" },
                  days_overdue: { type: "number" }
                }
              }
            },
            action_items: { type: "array", items: { type: "string" } }
          }
        }
      });

      setReconciliation(result);
      toast.success('Reconciliation complete');
    } catch (err) {
      console.error('Reconciliation failed:', err);
      toast.error('Failed to reconcile commissions');
    } finally {
      setIsReconciling(false);
    }
  };

  const generateDisputeLetter = async (discrepancy) => {
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate a professional commission dispute letter for:

CARRIER: ${discrepancy.carrier}
ISSUE: ${discrepancy.issue_type}
EXPECTED: $${discrepancy.expected_amount}
RECEIVED: $${discrepancy.actual_amount}
VARIANCE: $${discrepancy.variance}

Write a formal, professional letter requesting investigation and correction of this commission discrepancy. Include request for detailed payment breakdown and timeline for resolution.`,
        response_json_schema: {
          type: "object",
          properties: {
            subject: { type: "string" },
            body: { type: "string" }
          }
        }
      });

      setDisputeLetter(result);
      toast.success('Dispute letter generated');
    } catch (err) {
      toast.error('Failed to generate letter');
    }
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            Commission Reconciliation
          </CardTitle>
          <Button
            size="sm"
            onClick={reconcileCommissions}
            disabled={isReconciling}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {isReconciling ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!reconciliation && !isReconciling && (
          <p className="text-sm text-slate-400 text-center py-6">
            AI matches carrier statements with expected payouts
          </p>
        )}

        {reconciliation && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-emerald-50 rounded-lg">
                <p className="text-xs text-emerald-600">Expected</p>
                <p className="text-lg font-bold text-emerald-700">
                  ${reconciliation.summary?.expected_total?.toLocaleString() || 0}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${
                reconciliation.summary?.variance < 0 ? 'bg-red-50' : 'bg-emerald-50'
              }`}>
                <p className={`text-xs ${reconciliation.summary?.variance < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                  Variance
                </p>
                <p className={`text-lg font-bold ${reconciliation.summary?.variance < 0 ? 'text-red-700' : 'text-emerald-700'}`}>
                  ${reconciliation.summary?.variance?.toLocaleString() || 0}
                </p>
              </div>
            </div>

            {/* Discrepancies */}
            {reconciliation.discrepancies?.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-slate-700">Discrepancies Found</h4>
                {reconciliation.discrepancies.map((d, i) => (
                  <div key={i} className="p-2 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-red-700">{d.carrier}</span>
                      <Badge variant="outline" className="bg-red-100 text-red-700">
                        -${Math.abs(d.variance).toLocaleString()}
                      </Badge>
                    </div>
                    <p className="text-xs text-red-600 mb-2">{d.issue_type}</p>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-6 text-xs"
                      onClick={() => generateDisputeLetter(d)}
                    >
                      <FileText className="w-3 h-3 mr-1" />
                      Generate Dispute Letter
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Dispute Letter */}
            {disputeLetter && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-sm font-medium text-blue-800 mb-2">{disputeLetter.subject}</h4>
                <p className="text-xs text-blue-700 whitespace-pre-wrap">{disputeLetter.body}</p>
                <Button size="sm" variant="outline" className="mt-2 h-6 text-xs">
                  <Download className="w-3 h-3 mr-1" />
                  Copy Letter
                </Button>
              </div>
            )}

            {/* Action Items */}
            {reconciliation.action_items?.length > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <h4 className="text-sm font-medium text-amber-800 mb-2">Action Items</h4>
                <ul className="space-y-1">
                  {reconciliation.action_items.map((item, i) => (
                    <li key={i} className="text-xs text-amber-700">• {item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}