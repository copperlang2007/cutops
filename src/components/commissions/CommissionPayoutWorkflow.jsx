import { useState, useMemo } from 'react'
import { base44 } from '@/api/base44Client'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  DollarSign, CheckCircle, AlertTriangle, Flag, Sparkles, 
  Loader2, Send, FileText, Calculator, ThumbsUp, ThumbsDown
} from 'lucide-react';
import { format } from 'date-fns'
import { toast } from 'sonner'

export default function CommissionPayoutWorkflow({ 
  commissions, 
  agents, 
  contracts,
  onUpdateCommission 
}) {
  const [selectedCommissions, setSelectedCommissions] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [reviewModal, setReviewModal] = useState({ open: false, commission: null });
  const [adjustmentNote, setAdjustmentNote] = useState('');
  const [adjustedAmount, setAdjustedAmount] = useState('');

  const pendingCommissions = useMemo(() => 
    commissions.filter(c => c.status === 'pending'),
    [commissions]
  );

  const flaggedCommissions = useMemo(() => 
    commissions.filter(c => c.flagged || c.status === 'disputed'),
    [commissions]
  );

  const getAgentName = (agentId) => {
    const agent = agents.find(a => a.id === agentId);
    return agent ? `${agent.first_name} ${agent.last_name}` : 'Unknown';
  };

  const toggleSelect = (commissionId) => {
    setSelectedCommissions(prev =>
      prev.includes(commissionId)
        ? prev.filter(id => id !== commissionId)
        : [...prev, commissionId]
    );
  };

  const selectAll = () => {
    const unflaggedPending = pendingCommissions.filter(c => !c.flagged);
    setSelectedCommissions(
      selectedCommissions.length === unflaggedPending.length
        ? []
        : unflaggedPending.map(c => c.id)
    );
  };

  const calculateCommissions = async () => {
    setIsCalculating(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze these pending commissions and identify any discrepancies:

PENDING COMMISSIONS:
${pendingCommissions.slice(0, 20).map(c => 
  `- Agent: ${getAgentName(c.agent_id)}, Carrier: ${c.carrier_name}, Amount: $${c.amount}, Type: ${c.commission_type}`
).join('\n')}

Check for:
1. Amounts that seem unusual (too high or too low for the commission type)
2. Duplicate entries for same agent/carrier/date
3. Missing required fields
4. Inconsistent rates compared to standard commission structures

Flag any suspicious entries and explain why.`,
        response_json_schema: {
          type: "object",
          properties: {
            flagged_entries: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  index: { type: "number" },
                  reason: { type: "string" },
                  suggested_action: { type: "string" }
                }
              }
            },
            summary: { type: "string" },
            total_flagged: { type: "number" },
            recommendations: { type: "array", items: { type: "string" } }
          }
        }
      });

      // Flag the identified commissions
      if (result.flagged_entries?.length > 0) {
        for (const entry of result.flagged_entries) {
          if (entry.index < pendingCommissions.length) {
            const commission = pendingCommissions[entry.index];
            await onUpdateCommission(commission.id, {
              flagged: true,
              flag_reason: entry.reason
            });
          }
        }
        toast.warning(`AI flagged ${result.flagged_entries.length} commissions for review`);
      } else {
        toast.success('All commissions passed AI validation');
      }
    } catch (err) {
      console.error('Calculation failed:', err);
      toast.error('Failed to analyze commissions');
    } finally {
      setIsCalculating(false);
    }
  };

  const processPayouts = async () => {
    if (selectedCommissions.length === 0) {
      toast.error('Select commissions to process');
      return;
    }

    setIsProcessing(true);
    try {
      for (const commissionId of selectedCommissions) {
        await onUpdateCommission(commissionId, {
          status: 'approved',
          payment_date: format(new Date(), 'yyyy-MM-dd')
        });
      }
      toast.success(`Approved ${selectedCommissions.length} commission payouts`);
      setSelectedCommissions([]);
    } catch (err) {
      toast.error('Failed to process some payouts');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApprove = async (commission) => {
    await onUpdateCommission(commission.id, {
      status: 'approved',
      flagged: false,
      flag_reason: null,
      payment_date: format(new Date(), 'yyyy-MM-dd')
    });
    setReviewModal({ open: false, commission: null });
    toast.success('Commission approved');
  };

  const handleAdjust = async (commission) => {
    if (!adjustedAmount) {
      toast.error('Enter adjusted amount');
      return;
    }
    await onUpdateCommission(commission.id, {
      amount: parseFloat(adjustedAmount),
      status: 'adjusted',
      flagged: false,
      notes: `Adjusted from $${commission.amount}: ${adjustmentNote}`,
      payment_date: format(new Date(), 'yyyy-MM-dd')
    });
    setReviewModal({ open: false, commission: null });
    setAdjustedAmount('');
    setAdjustmentNote('');
    toast.success('Commission adjusted and approved');
  };

  const handleDispute = async (commission) => {
    await onUpdateCommission(commission.id, {
      status: 'disputed',
      notes: adjustmentNote || 'Disputed during review'
    });
    setReviewModal({ open: false, commission: null });
    setAdjustmentNote('');
    toast.info('Commission marked as disputed');
  };

  const totalSelected = selectedCommissions.reduce((sum, id) => {
    const c = pendingCommissions.find(c => c.id === id);
    return sum + (c?.amount || 0);
  }, 0);

  return (
    <>
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-teal-600" />
              Commission Payout Workflow
            </CardTitle>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={calculateCommissions}
                disabled={isCalculating}
              >
                {isCalculating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Calculator className="w-4 h-4" />
                )}
                <span className="ml-1 hidden sm:inline">AI Validate</span>
              </Button>
              <Button
                size="sm"
                onClick={processPayouts}
                disabled={isProcessing || selectedCommissions.length === 0}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span className="ml-1">Process ({selectedCommissions.length})</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-center">
              <p className="text-xl font-bold text-amber-700">{pendingCommissions.length}</p>
              <p className="text-xs text-amber-600">Pending</p>
            </div>
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-center">
              <p className="text-xl font-bold text-red-700">{flaggedCommissions.length}</p>
              <p className="text-xs text-red-600">Flagged</p>
            </div>
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-center">
              <p className="text-xl font-bold text-emerald-700">${totalSelected.toLocaleString()}</p>
              <p className="text-xs text-emerald-600">Selected</p>
            </div>
          </div>

          {/* Flagged for Review */}
          {flaggedCommissions.length > 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="text-sm font-medium text-red-800 mb-2 flex items-center gap-1">
                <Flag className="w-4 h-4" /> Requires Review
              </h4>
              <div className="space-y-2">
                {flaggedCommissions.slice(0, 5).map(commission => (
                  <div key={commission.id} className="flex items-center justify-between p-2 bg-white rounded">
                    <div>
                      <p className="text-xs font-medium text-red-700">
                        {getAgentName(commission.agent_id)} - ${commission.amount}
                      </p>
                      <p className="text-xs text-red-600">{commission.flag_reason || 'Flagged for review'}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => {
                        setReviewModal({ open: true, commission });
                        setAdjustedAmount(commission.amount.toString());
                      }}
                    >
                      Review
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pending Commissions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-slate-700">Pending Payouts</h4>
              <Button variant="ghost" size="sm" onClick={selectAll}>
                {selectedCommissions.length === pendingCommissions.filter(c => !c.flagged).length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {pendingCommissions.filter(c => !c.flagged).slice(0, 20).map(commission => (
                <div 
                  key={commission.id}
                  className={`p-2 rounded-lg border cursor-pointer transition-colors ${
                    selectedCommissions.includes(commission.id)
                      ? 'bg-teal-50 border-teal-200'
                      : 'hover:bg-slate-50'
                  }`}
                  onClick={() => toggleSelect(commission.id)}
                >
                  <div className="flex items-center gap-2">
                    <Checkbox checked={selectedCommissions.includes(commission.id)} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-slate-700">
                          {getAgentName(commission.agent_id)}
                        </p>
                        <p className="text-sm font-bold text-slate-800">${commission.amount?.toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span>{commission.carrier_name}</span>
                        <span>•</span>
                        <span className="capitalize">{commission.commission_type}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Review Modal */}
      <Dialog open={reviewModal.open} onOpenChange={() => setReviewModal({ open: false, commission: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Commission</DialogTitle>
          </DialogHeader>
          {reviewModal.commission && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-lg">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-slate-500">Agent</p>
                    <p className="font-medium">{getAgentName(reviewModal.commission.agent_id)}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Carrier</p>
                    <p className="font-medium">{reviewModal.commission.carrier_name}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Original Amount</p>
                    <p className="font-medium">${reviewModal.commission.amount?.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Type</p>
                    <p className="font-medium capitalize">{reviewModal.commission.commission_type}</p>
                  </div>
                </div>
                {reviewModal.commission.flag_reason && (
                  <div className="mt-2 p-2 bg-red-50 rounded text-xs text-red-700">
                    <strong>Flag Reason:</strong> {reviewModal.commission.flag_reason}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Adjusted Amount (if needed)</label>
                <Input
                  type="number"
                  value={adjustedAmount}
                  onChange={(e) => setAdjustedAmount(e.target.value)}
                  placeholder="Enter adjusted amount"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Notes</label>
                <Textarea
                  value={adjustmentNote}
                  onChange={(e) => setAdjustmentNote(e.target.value)}
                  placeholder="Add notes about this decision..."
                  rows={2}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => handleApprove(reviewModal.commission)}
                >
                  <ThumbsUp className="w-4 h-4 mr-1" />
                  Approve
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleAdjust(reviewModal.commission)}
                >
                  <Calculator className="w-4 h-4 mr-1" />
                  Adjust
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => handleDispute(reviewModal.commission)}
                >
                  <ThumbsDown className="w-4 h-4 mr-1" />
                  Dispute
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}