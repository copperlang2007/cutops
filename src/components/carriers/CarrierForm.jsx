import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';
import { US_STATES } from '../shared/constants';

export default function CarrierForm({ carrier, onSubmit, onCancel, isLoading }) {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    logo_url: '',
    website: '',
    phone: '',
    email: '',
    portal_url: '',
    contracting_email: '',
    certification_url: '',
    certification_required: true,
    states_available: [],
    notes: '',
    status: 'active'
  });

  const [selectedState, setSelectedState] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (carrier) {
      setFormData({
        name: carrier.name || '',
        code: carrier.code || '',
        logo_url: carrier.logo_url || '',
        website: carrier.website || '',
        phone: carrier.phone || '',
        email: carrier.email || '',
        portal_url: carrier.portal_url || '',
        contracting_email: carrier.contracting_email || '',
        certification_url: carrier.certification_url || '',
        certification_required: carrier.certification_required ?? true,
        states_available: carrier.states_available || [],
        notes: carrier.notes || '',
        status: carrier.status || 'active'
      });
    }
  }, [carrier]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const addState = () => {
    if (selectedState && !formData.states_available.includes(selectedState)) {
      handleChange('states_available', [...formData.states_available, selectedState]);
      setSelectedState('');
    }
  };

  const removeState = (state) => {
    handleChange('states_available', formData.states_available.filter(s => s !== state));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.code.trim()) newErrors.code = 'Code is required';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit(formData);
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle>{carrier ? 'Edit Carrier' : 'Add New Carrier'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Carrier Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="e.g., Humana"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">Carrier Code *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
                placeholder="e.g., HUM"
                maxLength={10}
                className={errors.code ? 'border-red-500' : ''}
              />
              {errors.code && <p className="text-xs text-red-500">{errors.code}</p>}
            </div>
          </div>

          {/* Contact Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="(800) 555-1234"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Contact Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="contact@carrier.com"
              />
            </div>
          </div>

          {/* URLs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={formData.website}
                onChange={(e) => handleChange('website', e.target.value)}
                placeholder="https://www.carrier.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="portal_url">Agent Portal URL</Label>
              <Input
                id="portal_url"
                value={formData.portal_url}
                onChange={(e) => handleChange('portal_url', e.target.value)}
                placeholder="https://portal.carrier.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contracting_email">Contracting Email</Label>
              <Input
                id="contracting_email"
                type="email"
                value={formData.contracting_email}
                onChange={(e) => handleChange('contracting_email', e.target.value)}
                placeholder="contracting@carrier.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="certification_url">Certification Portal URL</Label>
              <Input
                id="certification_url"
                value={formData.certification_url}
                onChange={(e) => handleChange('certification_url', e.target.value)}
                placeholder="https://training.carrier.com"
              />
            </div>
          </div>

          {/* States */}
          <div className="space-y-2">
            <Label>States Available</Label>
            <div className="flex gap-2">
              <Select value={selectedState} onValueChange={setSelectedState}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="State" />
                </SelectTrigger>
                <SelectContent>
                  {US_STATES.filter(s => !formData.states_available.includes(s)).map(state => (
                    <SelectItem key={state} value={state}>{state}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" variant="outline" onClick={addState} disabled={!selectedState}>
                <Plus className="w-4 h-4 mr-1" /> Add
              </Button>
            </div>
            {formData.states_available.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {formData.states_available.sort().map(state => (
                  <Badge key={state} variant="secondary" className="bg-teal-50 text-teal-700">
                    {state}
                    <button type="button" onClick={() => removeState(state)} className="ml-1 hover:text-teal-900">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Certification & Status */}
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <Switch
                checked={formData.certification_required}
                onCheckedChange={(checked) => handleChange('certification_required', checked)}
              />
              <Label>Certification Required</Label>
            </div>

            <div className="flex items-center gap-3">
              <Label>Status:</Label>
              <Select value={formData.status} onValueChange={(v) => handleChange('status', v)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Additional notes about this carrier..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" className="bg-teal-600 hover:bg-teal-700" disabled={isLoading}>
              {isLoading ? 'Saving...' : (carrier ? 'Update Carrier' : 'Add Carrier')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}