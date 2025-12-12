import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function AddendumCreationModal({ open, onClose, agreement, onSuccess }) {
  const [formData, setFormData] = useState({
    addendum_type: 'commission_adjustment',
    title: '',
    description: '',
    effective_date: '',
    changes: {},
    signers: []
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const addendumNumber = `ADD-${agreement.agreement_number}-${Date.now().toString().slice(-6)}`;
      
      const addendum = await base44.entities.AgreementAddendum.create({
        ...data,
        parent_agreement_id: agreement.id,
        addendum_number: addendumNumber,
        status: 'draft'
      });

      // Generate document
      await base44.functions.invoke('generateAgreementDocument', {
        agreement_id: addendum.id,
        type: 'addendum'
      });

      // Send for signature if signers specified
      if (data.signers.length > 0) {
        await base44.functions.invoke('sendAgreementForSignature', {
          agreement_id: addendum.id,
          type: 'addendum',
          signers: data.signers
        });
      }

      return addendum;
    },
    onSuccess: () => {
      toast.success('Addendum created successfully');
      onSuccess();
    },
    onError: () => {
      toast.error('Failed to create addendum');
    }
  });

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

  const handleSubmit = () => {
    if (!formData.title || !formData.description || !formData.effective_date) {
      toast.error('Please fill in all required fields');
      return;
    }
    createMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto dark:bg-slate-800">
        <DialogHeader>
          <DialogTitle>Create Addendum to {agreement.agreement_number}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label>Addendum Type</Label>
            <Select value={formData.addendum_type} onValueChange={(v) => setFormData({...formData, addendum_type: v})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="commission_adjustment">Commission Adjustment</SelectItem>
                <SelectItem value="territory_change">Territory Change</SelectItem>
                <SelectItem value="term_extension">Term Extension</SelectItem>
                <SelectItem value="rate_modification">Rate Modification</SelectItem>
                <SelectItem value="general_amendment">General Amendment</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Title *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              placeholder="e.g., Commission Rate Update"
            />
          </div>

          <div>
            <Label>Description *</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Describe the changes being made..."
              rows={4}
            />
          </div>

          <div>
            <Label>Effective Date *</Label>
            <Input
              type="date"
              value={formData.effective_date}
              onChange={(e) => setFormData({...formData, effective_date: e.target.value})}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Signers</Label>
              <Button type="button" size="sm" variant="outline" onClick={addSigner}>
                <Plus className="w-4 h-4 mr-1" />
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
                    type="email"
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

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={createMutation.isPending}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={createMutation.isPending}
            className="bg-teal-600 hover:bg-teal-700"
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Addendum'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}