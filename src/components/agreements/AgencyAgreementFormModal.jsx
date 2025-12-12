import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Loader2, Plus, X, DollarSign, Scale, FileText, Percent 
} from 'lucide-react';

const defaultObligation = { title: '', description: '', category: 'compliance', is_mandatory: false };
const defaultBonusTier = { tier_name: '', threshold: '', bonus_rate: '', bonus_type: 'percentage', description: '' };
const defaultCarrierRate = { carrier_name: '', commission_rate: '', commission_type: 'percentage', notes: '' };

export default function AgencyAgreementFormModal({ open, onClose, agreement, onSubmit, isLoading }) {
  const [formData, setFormData] = useState({
    agreement_name: '',
    status: 'draft',
    start_date: '',
    end_date: '',
    auto_renew: false,
    renewal_terms: '',
    base_commission_rate: '',
    base_commission_type: 'percentage',
    bonus_structure: [],
    carrier_specific_rates: [],
    payment_schedule: 'monthly',
    payment_method: 'direct_deposit',
    obligations: [],
    termination_notice_days: 30,
    non_compete_months: '',
    territory_restrictions: '',
    special_terms: '',
    signed_by_agent: false,
    signed_by_agency: false,
    signed_date: ''
  });

  useEffect(() => {
    if (agreement) {
      setFormData({
        agreement_name: agreement.agreement_name || '',
        status: agreement.status || 'draft',
        start_date: agreement.start_date || '',
        end_date: agreement.end_date || '',
        auto_renew: agreement.auto_renew || false,
        renewal_terms: agreement.renewal_terms || '',
        base_commission_rate: agreement.base_commission_rate || '',
        base_commission_type: agreement.base_commission_type || 'percentage',
        bonus_structure: agreement.bonus_structure || [],
        carrier_specific_rates: agreement.carrier_specific_rates || [],
        payment_schedule: agreement.payment_schedule || 'monthly',
        payment_method: agreement.payment_method || 'direct_deposit',
        obligations: agreement.obligations || [],
        termination_notice_days: agreement.termination_notice_days || 30,
        non_compete_months: agreement.non_compete_months || '',
        territory_restrictions: agreement.territory_restrictions || '',
        special_terms: agreement.special_terms || '',
        signed_by_agent: agreement.signed_by_agent || false,
        signed_by_agency: agreement.signed_by_agency || false,
        signed_date: agreement.signed_date || ''
      });
    } else {
      setFormData({
        agreement_name: '',
        status: 'draft',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        auto_renew: false,
        renewal_terms: '',
        base_commission_rate: '',
        base_commission_type: 'percentage',
        bonus_structure: [],
        carrier_specific_rates: [],
        payment_schedule: 'monthly',
        payment_method: 'direct_deposit',
        obligations: [],
        termination_notice_days: 30,
        non_compete_months: '',
        territory_restrictions: '',
        special_terms: '',
        signed_by_agent: false,
        signed_by_agency: false,
        signed_date: ''
      });
    }
  }, [agreement, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      base_commission_rate: formData.base_commission_rate ? parseFloat(formData.base_commission_rate) : null,
      termination_notice_days: parseInt(formData.termination_notice_days) || 30,
      non_compete_months: formData.non_compete_months ? parseInt(formData.non_compete_months) : null,
      bonus_structure: formData.bonus_structure.map(t => ({
        ...t,
        threshold: parseFloat(t.threshold) || 0,
        bonus_rate: parseFloat(t.bonus_rate) || 0,
        bonus_type: t.bonus_type || 'percentage'
      })),
      carrier_specific_rates: formData.carrier_specific_rates.map(r => ({
        ...r,
        commission_rate: parseFloat(r.commission_rate) || 0,
        commission_type: r.commission_type || 'percentage'
      }))
    };
    onSubmit(data);
  };

  const addBonusTier = () => {
    setFormData({ ...formData, bonus_structure: [...formData.bonus_structure, { ...defaultBonusTier }] });
  };

  const removeBonusTier = (index) => {
    setFormData({ ...formData, bonus_structure: formData.bonus_structure.filter((_, i) => i !== index) });
  };

  const updateBonusTier = (index, field, value) => {
    const updated = [...formData.bonus_structure];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, bonus_structure: updated });
  };

  const addCarrierRate = () => {
    setFormData({ ...formData, carrier_specific_rates: [...formData.carrier_specific_rates, { ...defaultCarrierRate }] });
  };

  const removeCarrierRate = (index) => {
    setFormData({ ...formData, carrier_specific_rates: formData.carrier_specific_rates.filter((_, i) => i !== index) });
  };

  const updateCarrierRate = (index, field, value) => {
    const updated = [...formData.carrier_specific_rates];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, carrier_specific_rates: updated });
  };

  const addObligation = () => {
    setFormData({ ...formData, obligations: [...formData.obligations, { ...defaultObligation }] });
  };

  const removeObligation = (index) => {
    setFormData({ ...formData, obligations: formData.obligations.filter((_, i) => i !== index) });
  };

  const updateObligation = (index, field, value) => {
    const updated = [...formData.obligations];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, obligations: updated });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto dark:bg-slate-800">
        <DialogHeader>
          <DialogTitle>{agreement ? 'Edit Agreement' : 'Create Agency Agreement'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="basic" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="compensation">Compensation</TabsTrigger>
              <TabsTrigger value="obligations">Obligations</TabsTrigger>
              <TabsTrigger value="terms">Terms</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Agreement Name *</Label>
                  <Input
                    value={formData.agreement_name}
                    onChange={(e) => setFormData({ ...formData, agreement_name: e.target.value })}
                    placeholder="e.g., Standard Agent Agreement 2024"
                    required
                  />
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="pending_signature">Pending Signature</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                      <SelectItem value="terminated">Terminated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Start Date *</Label>
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={formData.auto_renew}
                    onCheckedChange={(v) => setFormData({ ...formData, auto_renew: v })}
                  />
                  <Label>Auto-Renew</Label>
                </div>
              </div>
              {formData.auto_renew && (
                <div>
                  <Label>Renewal Terms</Label>
                  <Textarea
                    value={formData.renewal_terms}
                    onChange={(e) => setFormData({ ...formData, renewal_terms: e.target.value })}
                    placeholder="Describe the renewal terms..."
                    rows={2}
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="compensation" className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Base Commission Rate</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.base_commission_rate}
                        onChange={(e) => setFormData({ ...formData, base_commission_rate: e.target.value })}
                        placeholder={formData.base_commission_type === 'percentage' ? "e.g., 15" : "e.g., 250"}
                        className="pr-10"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                        {formData.base_commission_type === 'percentage' ? '%' : '$'}
                      </span>
                    </div>
                    <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, base_commission_type: 'percentage' })}
                        className={`px-3 py-2 text-sm font-medium transition-colors ${
                          formData.base_commission_type === 'percentage'
                            ? 'bg-teal-600 text-white'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                        }`}
                      >
                        <Percent className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, base_commission_type: 'flat' })}
                        className={`px-3 py-2 text-sm font-medium transition-colors ${
                          formData.base_commission_type === 'flat'
                            ? 'bg-teal-600 text-white'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                        }`}
                      >
                        <DollarSign className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
                <div>
                  <Label>Payment Schedule</Label>
                  <Select value={formData.payment_schedule} onValueChange={(v) => setFormData({ ...formData, payment_schedule: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="bi_weekly">Bi-Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Payment Method</Label>
                  <Select value={formData.payment_method} onValueChange={(v) => setFormData({ ...formData, payment_method: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="direct_deposit">Direct Deposit</SelectItem>
                      <SelectItem value="check">Check</SelectItem>
                      <SelectItem value="wire">Wire Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Bonus Structure */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Bonus Tiers</Label>
                  <Button type="button" size="sm" variant="outline" onClick={addBonusTier}>
                    <Plus className="w-4 h-4 mr-1" /> Add Tier
                  </Button>
                </div>
                {formData.bonus_structure.length > 0 ? (
                  <div className="space-y-3">
                    {formData.bonus_structure.map((tier, idx) => (
                      <Card key={idx} className="dark:bg-slate-900/50">
                        <CardContent className="p-3">
                          <div className="flex items-start gap-3">
                            <div className="flex-1 grid grid-cols-5 gap-2">
                              <Input
                                placeholder="Tier name"
                                value={tier.tier_name}
                                onChange={(e) => updateBonusTier(idx, 'tier_name', e.target.value)}
                              />
                              <Input
                                type="number"
                                placeholder="Threshold $"
                                value={tier.threshold}
                                onChange={(e) => updateBonusTier(idx, 'threshold', e.target.value)}
                              />
                              <div className="flex gap-1">
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder={tier.bonus_type === 'flat' ? "Bonus $" : "Bonus %"}
                                  value={tier.bonus_rate}
                                  onChange={(e) => updateBonusTier(idx, 'bonus_rate', e.target.value)}
                                  className="flex-1"
                                />
                                <div className="flex rounded-md border border-slate-200 dark:border-slate-700 overflow-hidden">
                                  <button
                                    type="button"
                                    onClick={() => updateBonusTier(idx, 'bonus_type', 'percentage')}
                                    className={`px-2 py-1 text-xs transition-colors ${
                                      (tier.bonus_type || 'percentage') === 'percentage'
                                        ? 'bg-teal-600 text-white'
                                        : 'bg-white dark:bg-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'
                                    }`}
                                  >
                                    %
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => updateBonusTier(idx, 'bonus_type', 'flat')}
                                    className={`px-2 py-1 text-xs transition-colors ${
                                      tier.bonus_type === 'flat'
                                        ? 'bg-teal-600 text-white'
                                        : 'bg-white dark:bg-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'
                                    }`}
                                  >
                                    $
                                  </button>
                                </div>
                              </div>
                              <Input
                                placeholder="Description"
                                value={tier.description}
                                onChange={(e) => updateBonusTier(idx, 'description', e.target.value)}
                                className="col-span-2"
                              />
                            </div>
                            <Button type="button" size="sm" variant="ghost" onClick={() => removeBonusTier(idx)}>
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">No bonus tiers added</p>
                )}
              </div>

              {/* Carrier-Specific Rates */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Carrier-Specific Rates</Label>
                  <Button type="button" size="sm" variant="outline" onClick={addCarrierRate}>
                    <Plus className="w-4 h-4 mr-1" /> Add Carrier
                  </Button>
                </div>
                {formData.carrier_specific_rates.length > 0 ? (
                  <div className="space-y-2">
                    {formData.carrier_specific_rates.map((rate, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Input
                          placeholder="Carrier name"
                          value={rate.carrier_name}
                          onChange={(e) => updateCarrierRate(idx, 'carrier_name', e.target.value)}
                          className="flex-1"
                        />
                        <div className="flex gap-1">
                          <Input
                            type="number"
                            step="0.01"
                            placeholder={rate.commission_type === 'flat' ? "Rate $" : "Rate %"}
                            value={rate.commission_rate}
                            onChange={(e) => updateCarrierRate(idx, 'commission_rate', e.target.value)}
                            className="w-24"
                          />
                          <div className="flex rounded-md border border-slate-200 dark:border-slate-700 overflow-hidden">
                            <button
                              type="button"
                              onClick={() => updateCarrierRate(idx, 'commission_type', 'percentage')}
                              className={`px-2 py-1 text-xs transition-colors ${
                                (rate.commission_type || 'percentage') === 'percentage'
                                  ? 'bg-teal-600 text-white'
                                  : 'bg-white dark:bg-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'
                              }`}
                            >
                              %
                            </button>
                            <button
                              type="button"
                              onClick={() => updateCarrierRate(idx, 'commission_type', 'flat')}
                              className={`px-2 py-1 text-xs transition-colors ${
                                rate.commission_type === 'flat'
                                  ? 'bg-teal-600 text-white'
                                  : 'bg-white dark:bg-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'
                              }`}
                            >
                              $
                            </button>
                          </div>
                        </div>
                        <Input
                          placeholder="Notes"
                          value={rate.notes}
                          onChange={(e) => updateCarrierRate(idx, 'notes', e.target.value)}
                          className="flex-1"
                        />
                        <Button type="button" size="sm" variant="ghost" onClick={() => removeCarrierRate(idx)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">No carrier-specific rates</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="obligations" className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Contractual Obligations</Label>
                <Button type="button" size="sm" variant="outline" onClick={addObligation}>
                  <Plus className="w-4 h-4 mr-1" /> Add Obligation
                </Button>
              </div>
              {formData.obligations.length > 0 ? (
                <div className="space-y-3">
                  {formData.obligations.map((ob, idx) => (
                    <Card key={idx} className="dark:bg-slate-900/50">
                      <CardContent className="p-3 space-y-2">
                        <div className="flex items-start gap-2">
                          <div className="flex-1 space-y-2">
                            <div className="grid grid-cols-3 gap-2">
                              <Input
                                placeholder="Title"
                                value={ob.title}
                                onChange={(e) => updateObligation(idx, 'title', e.target.value)}
                                className="col-span-2"
                              />
                              <Select value={ob.category} onValueChange={(v) => updateObligation(idx, 'category', v)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="compliance">Compliance</SelectItem>
                                  <SelectItem value="production">Production</SelectItem>
                                  <SelectItem value="training">Training</SelectItem>
                                  <SelectItem value="reporting">Reporting</SelectItem>
                                  <SelectItem value="conduct">Conduct</SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <Textarea
                              placeholder="Description"
                              value={ob.description}
                              onChange={(e) => updateObligation(idx, 'description', e.target.value)}
                              rows={2}
                            />
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={ob.is_mandatory}
                                onCheckedChange={(v) => updateObligation(idx, 'is_mandatory', v)}
                              />
                              <Label className="text-sm">Mandatory</Label>
                            </div>
                          </div>
                          <Button type="button" size="sm" variant="ghost" onClick={() => removeObligation(idx)}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">No obligations defined yet</p>
              )}
            </TabsContent>

            <TabsContent value="terms" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Termination Notice (days)</Label>
                  <Input
                    type="number"
                    value={formData.termination_notice_days}
                    onChange={(e) => setFormData({ ...formData, termination_notice_days: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Non-Compete Period (months)</Label>
                  <Input
                    type="number"
                    value={formData.non_compete_months}
                    onChange={(e) => setFormData({ ...formData, non_compete_months: e.target.value })}
                    placeholder="Optional"
                  />
                </div>
              </div>
              <div>
                <Label>Territory Restrictions</Label>
                <Textarea
                  value={formData.territory_restrictions}
                  onChange={(e) => setFormData({ ...formData, territory_restrictions: e.target.value })}
                  placeholder="Geographic or market restrictions..."
                  rows={2}
                />
              </div>
              <div>
                <Label>Special Terms & Conditions</Label>
                <Textarea
                  value={formData.special_terms}
                  onChange={(e) => setFormData({ ...formData, special_terms: e.target.value })}
                  placeholder="Any additional terms..."
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-3 gap-4 pt-4 border-t dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={formData.signed_by_agent}
                    onCheckedChange={(v) => setFormData({ ...formData, signed_by_agent: v })}
                  />
                  <Label>Signed by Agent</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={formData.signed_by_agency}
                    onCheckedChange={(v) => setFormData({ ...formData, signed_by_agency: v })}
                  />
                  <Label>Signed by Agency</Label>
                </div>
                <div>
                  <Label>Signed Date</Label>
                  <Input
                    type="date"
                    value={formData.signed_date}
                    onChange={(e) => setFormData({ ...formData, signed_date: e.target.value })}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-3 pt-6 mt-6 border-t dark:border-slate-700">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isLoading} className="bg-teal-600 hover:bg-teal-700">
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {agreement ? 'Update Agreement' : 'Create Agreement'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}