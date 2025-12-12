import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { US_STATES, CARRIERS } from '../shared/constants';

export default function ClientFormModal({ 
  open, 
  onClose, 
  client, 
  agentId,
  onSubmit, 
  isLoading 
}) {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    date_of_birth: '',
    medicare_id: '',
    current_plan: '',
    carrier: '',
    plan_type: 'medicare_advantage',
    effective_date: '',
    renewal_date: '',
    premium: '',
    status: 'prospect',
    lead_source: 'other',
    satisfaction_score: '',
    notes: '',
    next_follow_up: ''
  });

  useEffect(() => {
    if (client) {
      setFormData({
        first_name: client.first_name || '',
        last_name: client.last_name || '',
        email: client.email || '',
        phone: client.phone || '',
        address: client.address || '',
        city: client.city || '',
        state: client.state || '',
        zip: client.zip || '',
        date_of_birth: client.date_of_birth || '',
        medicare_id: client.medicare_id || '',
        current_plan: client.current_plan || '',
        carrier: client.carrier || '',
        plan_type: client.plan_type || 'medicare_advantage',
        effective_date: client.effective_date || '',
        renewal_date: client.renewal_date || '',
        premium: client.premium || '',
        status: client.status || 'prospect',
        lead_source: client.lead_source || 'other',
        satisfaction_score: client.satisfaction_score || '',
        notes: client.notes || '',
        next_follow_up: client.next_follow_up || ''
      });
    } else {
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zip: '',
        date_of_birth: '',
        medicare_id: '',
        current_plan: '',
        carrier: '',
        plan_type: 'medicare_advantage',
        effective_date: '',
        renewal_date: '',
        premium: '',
        status: 'prospect',
        lead_source: 'other',
        satisfaction_score: '',
        notes: '',
        next_follow_up: ''
      });
    }
  }, [client, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      agent_id: agentId,
      premium: formData.premium ? parseFloat(formData.premium) : null,
      satisfaction_score: formData.satisfaction_score ? parseInt(formData.satisfaction_score) : null
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{client ? 'Edit Client' : 'Add New Client'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>First Name *</Label>
              <Input
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Last Name *</Label>
              <Input
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="prospect">Prospect</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="churned">Churned</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Lead Source</Label>
              <Select value={formData.lead_source} onValueChange={(v) => setFormData({ ...formData, lead_source: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="referral">Referral</SelectItem>
                  <SelectItem value="website">Website</SelectItem>
                  <SelectItem value="cold_call">Cold Call</SelectItem>
                  <SelectItem value="event">Event</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Address */}
          <div>
            <Label>Address</Label>
            <Input
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>City</Label>
              <Input
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>
            <div>
              <Label>State</Label>
              <Select value={formData.state} onValueChange={(v) => setFormData({ ...formData, state: v })}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {US_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>ZIP</Label>
              <Input
                value={formData.zip}
                onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
              />
            </div>
          </div>

          {/* Policy Info */}
          <div className="border-t pt-4 mt-4">
            <h4 className="text-sm font-medium text-slate-700 mb-3">Policy Information</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Carrier</Label>
                <Select value={formData.carrier} onValueChange={(v) => setFormData({ ...formData, carrier: v })}>
                  <SelectTrigger><SelectValue placeholder="Select carrier" /></SelectTrigger>
                  <SelectContent>
                    {CARRIERS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Plan Type</Label>
                <Select value={formData.plan_type} onValueChange={(v) => setFormData({ ...formData, plan_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="medicare_advantage">Medicare Advantage</SelectItem>
                    <SelectItem value="supplement">Supplement</SelectItem>
                    <SelectItem value="pdp">PDP</SelectItem>
                    <SelectItem value="ancillary">Ancillary</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-4">
              <div>
                <Label>Premium ($/mo)</Label>
                <Input
                  type="number"
                  value={formData.premium}
                  onChange={(e) => setFormData({ ...formData, premium: e.target.value })}
                />
              </div>
              <div>
                <Label>Effective Date</Label>
                <Input
                  type="date"
                  value={formData.effective_date}
                  onChange={(e) => setFormData({ ...formData, effective_date: e.target.value })}
                />
              </div>
              <div>
                <Label>Renewal Date</Label>
                <Input
                  type="date"
                  value={formData.renewal_date}
                  onChange={(e) => setFormData({ ...formData, renewal_date: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Follow-up */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Next Follow-up</Label>
              <Input
                type="date"
                value={formData.next_follow_up}
                onChange={(e) => setFormData({ ...formData, next_follow_up: e.target.value })}
              />
            </div>
            <div>
              <Label>Satisfaction Score (1-10)</Label>
              <Input
                type="number"
                min="1"
                max="10"
                value={formData.satisfaction_score}
                onChange={(e) => setFormData({ ...formData, satisfaction_score: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isLoading} className="bg-teal-600 hover:bg-teal-700">
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {client ? 'Update Client' : 'Add Client'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}