import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, ChevronRight, Loader2, Building2, FileText, DollarSign, Send } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const steps = [
  { id: 1, title: 'Agreement Type', icon: FileText },
  { id: 2, title: 'Agencies', icon: Building2 },
  { id: 3, title: 'Terms', icon: DollarSign },
  { id: 4, title: 'Review & Send', icon: Send }
];

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

export default function AgreementCreationWizard({ open, onClose, onSuccess }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    agreement_type: 'partner_override',
    parent_agency_id: '',
    partner_agency_id: '',
    hierarchy_level: 1,
    commission_override_percentage: 0,
    base_commission_percentage: 0,
    territories: [],
    effective_date: '',
    expiration_date: '',
    auto_renew: false,
    termination_notice_days: 30,
    signers: []
  });

  const { data: agencies = [] } = useQuery({
    queryKey: ['agencies'],
    queryFn: () => base44.entities.Agency.list()
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const agreementNumber = `AGR-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      
      const agreement = await base44.entities.AgencyPartnerAgreement.create({
        ...data,
        agreement_number: agreementNumber,
        agreement_terms: {
          commission_override_percentage: data.commission_override_percentage,
          base_commission_percentage: data.base_commission_percentage
        },
        status: 'draft'
      });

      return agreement;
    },
    onSuccess: onSuccess
  });

  const generateDocumentMutation = useMutation({
    mutationFn: async (agreementId) => {
      return await base44.functions.invoke('generateAgreementDocument', {
        agreement_id: agreementId,
        type: 'agreement'
      });
    }
  });

  const sendForSignatureMutation = useMutation({
    mutationFn: async ({ agreementId, signers }) => {
      return await base44.functions.invoke('sendAgreementForSignature', {
        agreement_id: agreementId,
        type: 'agreement',
        signers
      });
    }
  });

  const handleSubmit = async () => {
    try {
      // Create agreement
      const agreement = await createMutation.mutateAsync(formData);
      
      // Generate document
      await generateDocumentMutation.mutateAsync(agreement.id);
      
      // Send for signature if signers specified
      if (formData.signers.length > 0) {
        await sendForSignatureMutation.mutateAsync({
          agreementId: agreement.id,
          signers: formData.signers
        });
        toast.success('Agreement sent for signature');
      } else {
        toast.success('Agreement created as draft');
      }
      
      onSuccess();
    } catch (error) {
      toast.error('Failed to create agreement');
    }
  };

  const toggleTerritory = (state) => {
    setFormData(prev => ({
      ...prev,
      territories: prev.territories.includes(state)
        ? prev.territories.filter(s => s !== state)
        : [...prev.territories, state]
    }));
  };

  const addSigner = () => {
    setFormData(prev => ({
      ...prev,
      signers: [...prev.signers, { name: '', email: '', role: '' }]
    }));
  };

  const updateSigner = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      signers: prev.signers.map((s, i) => i === index ? { ...s, [field]: value } : s)
    }));
  };

  const removeSigner = (index) => {
    setFormData(prev => ({
      ...prev,
      signers: prev.signers.filter((_, i) => i !== index)
    }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return formData.agreement_type;
      case 2: return formData.parent_agency_id && formData.partner_agency_id;
      case 3: return formData.effective_date;
      case 4: return true;
      default: return false;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto dark:bg-slate-800">
        <DialogHeader>
          <DialogTitle>Create Agency Partner Agreement</DialogTitle>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isActive = step.id === currentStep;
            const isCompleted = step.id < currentStep;
            
            return (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                    isCompleted ? 'bg-emerald-500 text-white' :
                    isActive ? 'bg-teal-500 text-white' :
                    'bg-slate-200 dark:bg-slate-700 text-slate-400'
                  }`}>
                    {isCompleted ? <CheckCircle className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
                  </div>
                  <p className={`text-xs mt-2 text-center ${
                    isActive ? 'text-teal-600 font-semibold' : 'text-slate-500'
                  }`}>
                    {step.title}
                  </p>
                </div>
                {idx < steps.length - 1 && (
                  <div className={`flex-1 h-1 mx-2 rounded transition-colors ${
                    isCompleted ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'
                  }`} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Form Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            {currentStep === 1 && (
              <div className="space-y-4">
                <div>
                  <Label>Agreement Type</Label>
                  <Select value={formData.agreement_type} onValueChange={(v) => setFormData({...formData, agreement_type: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="partner_override">Partner Override Agreement</SelectItem>
                      <SelectItem value="broker_agreement">Broker Agreement</SelectItem>
                      <SelectItem value="loa_agreement">LOA Agreement</SelectItem>
                      <SelectItem value="sub_agency">Sub-Agency Agreement</SelectItem>
                      <SelectItem value="master_agreement">Master Agreement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4">
                <div>
                  <Label>Parent Agency (FMO)</Label>
                  <Select value={formData.parent_agency_id} onValueChange={(v) => setFormData({...formData, parent_agency_id: v})}>
                    <SelectTrigger><SelectValue placeholder="Select parent agency" /></SelectTrigger>
                    <SelectContent>
                      {agencies.map(agency => (
                        <SelectItem key={agency.id} value={agency.id}>
                          {agency.name} ({agency.agency_code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Partner Agency</Label>
                  <Select value={formData.partner_agency_id} onValueChange={(v) => setFormData({...formData, partner_agency_id: v})}>
                    <SelectTrigger><SelectValue placeholder="Select partner agency" /></SelectTrigger>
                    <SelectContent>
                      {agencies.filter(a => a.id !== formData.parent_agency_id).map(agency => (
                        <SelectItem key={agency.id} value={agency.id}>
                          {agency.name} ({agency.agency_code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Hierarchy Level</Label>
                  <Input
                    type="number"
                    value={formData.hierarchy_level}
                    onChange={(e) => setFormData({...formData, hierarchy_level: parseInt(e.target.value)})}
                  />
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Override Commission %</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.commission_override_percentage}
                      onChange={(e) => setFormData({...formData, commission_override_percentage: parseFloat(e.target.value)})}
                    />
                  </div>
                  <div>
                    <Label>Base Commission %</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.base_commission_percentage}
                      onChange={(e) => setFormData({...formData, base_commission_percentage: parseFloat(e.target.value)})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Effective Date</Label>
                    <Input
                      type="date"
                      value={formData.effective_date}
                      onChange={(e) => setFormData({...formData, effective_date: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Expiration Date</Label>
                    <Input
                      type="date"
                      value={formData.expiration_date}
                      onChange={(e) => setFormData({...formData, expiration_date: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <Label className="mb-2 block">Territories</Label>
                  <div className="border dark:border-slate-700 rounded-lg p-4 max-h-48 overflow-y-auto">
                    <div className="grid grid-cols-10 gap-2">
                      {US_STATES.map(state => (
                        <button
                          key={state}
                          type="button"
                          onClick={() => toggleTerritory(state)}
                          className={`px-2 py-1 text-xs rounded transition-colors ${
                            formData.territories.includes(state)
                              ? 'bg-teal-500 text-white'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {state}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800">
                  <h3 className="font-medium text-teal-900 dark:text-teal-100 mb-2">Agreement Summary</h3>
                  <div className="space-y-1 text-sm text-teal-800 dark:text-teal-200">
                    <p>Type: {formData.agreement_type.replace(/_/g, ' ')}</p>
                    <p>Override: {formData.commission_override_percentage}%</p>
                    <p>Territories: {formData.territories.length} states</p>
                    <p>Effective: {formData.effective_date}</p>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Signers</Label>
                    <Button type="button" size="sm" variant="outline" onClick={addSigner}>
                      Add Signer
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {formData.signers.map((signer, idx) => (
                      <div key={idx} className="flex gap-2">
                        <Input
                          placeholder="Name"
                          value={signer.name}
                          onChange={(e) => updateSigner(idx, 'name', e.target.value)}
                        />
                        <Input
                          placeholder="Email"
                          value={signer.email}
                          onChange={(e) => updateSigner(idx, 'email', e.target.value)}
                        />
                        <Input
                          placeholder="Role"
                          value={signer.role}
                          onChange={(e) => updateSigner(idx, 'role', e.target.value)}
                        />
                        <Button type="button" size="icon" variant="ghost" onClick={() => removeSigner(idx)}>
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1 || createMutation.isPending}
          >
            Previous
          </Button>
          {currentStep < 4 ? (
            <Button
              onClick={() => setCurrentStep(currentStep + 1)}
              disabled={!canProceed()}
              className="bg-teal-600 hover:bg-teal-700"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || generateDocumentMutation.isPending || sendForSignatureMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {createMutation.isPending || generateDocumentMutation.isPending || sendForSignatureMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Create & Send
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}