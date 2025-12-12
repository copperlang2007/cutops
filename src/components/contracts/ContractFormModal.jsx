import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Upload, Sparkles, Loader2, FileText, FileSearch } from 'lucide-react';
import { CONTRACT_STATUSES, US_STATES } from '../shared/constants';
import { base44 } from '@/api/base44Client';
import ContractAIAnalyzer from './ContractAIAnalyzer';

export default function ContractFormModal({ 
  open, 
  onClose, 
  contract, 
  carriers = [], 
  agentId,
  onSubmit, 
  isLoading,
  onCreateTask
}) {
  const [showAnalyzer, setShowAnalyzer] = useState(false);
  const [formData, setFormData] = useState({
    carrier_id: '',
    carrier_name: '',
    contract_status: 'not_started',
    submission_date: '',
    effective_date: '',
    expiration_date: '',
    signed_date: '',
    writing_number: '',
    commission_level: '',
    states: [],
    correction_notes: '',
    notes: ''
  });

  const [selectedState, setSelectedState] = useState('');
  const [documentFile, setDocumentFile] = useState(null);
  const [documentUrl, setDocumentUrl] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (contract) {
      setFormData({
        carrier_id: contract.carrier_id || '',
        carrier_name: contract.carrier_name || '',
        contract_status: contract.contract_status || 'not_started',
        submission_date: contract.submission_date || '',
        effective_date: contract.effective_date || '',
        expiration_date: contract.expiration_date || '',
        signed_date: contract.signed_date || '',
        writing_number: contract.writing_number || '',
        commission_level: contract.commission_level || '',
        states: contract.states || [],
        correction_notes: contract.correction_notes || '',
        notes: contract.notes || ''
      });
    } else {
      setFormData({
        carrier_id: '',
        carrier_name: '',
        contract_status: 'not_started',
        submission_date: '',
        effective_date: '',
        expiration_date: '',
        signed_date: '',
        writing_number: '',
        commission_level: '',
        states: [],
        correction_notes: '',
        notes: ''
      });
    }
  }, [contract, open]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCarrierChange = (carrierId) => {
    const carrier = carriers.find(c => c.id === carrierId);
    setFormData(prev => ({
      ...prev,
      carrier_id: carrierId,
      carrier_name: carrier?.name || ''
    }));
  };

  const addState = () => {
    if (selectedState && !formData.states.includes(selectedState)) {
      handleChange('states', [...formData.states, selectedState]);
      setSelectedState('');
    }
  };

  const removeState = (state) => {
    handleChange('states', formData.states.filter(s => s !== state));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setDocumentFile(file);
    
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setDocumentUrl(file_url);
    } catch (err) {
      console.error('Failed to upload file:', err);
    }
  };

  const extractWithAI = async () => {
    if (!documentUrl) return;
    
    setIsExtracting(true);
    try {
      const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url: documentUrl,
        json_schema: {
          type: "object",
          properties: {
            effective_date: { type: "string", description: "Contract effective/start date in YYYY-MM-DD format" },
            expiration_date: { type: "string", description: "Contract expiration/end date in YYYY-MM-DD format" },
            writing_number: { type: "string", description: "Agent writing number or producer number" },
            commission_level: { type: "string", description: "Commission level, tier, or percentage" },
            states: { type: "array", items: { type: "string" }, description: "List of 2-letter state abbreviations covered" }
          }
        }
      });

      if (result.status === 'success' && result.output) {
        const extracted = result.output;
        setFormData(prev => ({
          ...prev,
          effective_date: extracted.effective_date || prev.effective_date,
          expiration_date: extracted.expiration_date || prev.expiration_date,
          writing_number: extracted.writing_number || prev.writing_number,
          commission_level: extracted.commission_level || prev.commission_level,
          states: extracted.states?.length > 0 ? extracted.states : prev.states
        }));
      }
    } catch (err) {
      console.error('Failed to extract data:', err);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      agent_id: agentId
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{contract ? 'Edit Contract' : 'New Carrier Contract'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Carrier Selection */}
          <div className="space-y-2">
            <Label>Carrier *</Label>
            <Select 
              value={formData.carrier_id} 
              onValueChange={handleCarrierChange}
              disabled={!!contract}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select carrier" />
              </SelectTrigger>
              <SelectContent>
                {carriers.map(carrier => (
                  <SelectItem key={carrier.id} value={carrier.id}>
                    {carrier.name} ({carrier.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* AI Document Upload */}
          <div className="space-y-2">
            <Label>Upload Contract Document (Optional)</Label>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handleFileUpload}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                {documentFile ? documentFile.name : 'Upload PDF'}
              </Button>
              {documentUrl && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={extractWithAI}
                  disabled={isExtracting}
                  className="text-purple-600 border-purple-200 hover:bg-purple-50"
                >
                  {isExtracting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Extracting...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Extract with AI
                    </>
                  )}
                </Button>
              )}
            </div>
            {documentFile && (
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <FileText className="w-3 h-3" />
                AI can extract dates, writing numbers, commission levels, and states from the document
              </p>
            )}
          </div>

          {/* Contract Status */}
          <div className="space-y-2">
            <Label>Contract Status</Label>
            <Select 
              value={formData.contract_status} 
              onValueChange={(v) => handleChange('contract_status', v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONTRACT_STATUSES.map(status => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Submission Date</Label>
              <Input
                type="date"
                value={formData.submission_date}
                onChange={(e) => handleChange('submission_date', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Signed Date</Label>
              <Input
                type="date"
                value={formData.signed_date}
                onChange={(e) => handleChange('signed_date', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Effective Date</Label>
              <Input
                type="date"
                value={formData.effective_date}
                onChange={(e) => handleChange('effective_date', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Expiration Date</Label>
              <Input
                type="date"
                value={formData.expiration_date}
                onChange={(e) => handleChange('expiration_date', e.target.value)}
              />
            </div>
          </div>

          {/* Writing Number & Commission */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Writing Number</Label>
              <Input
                value={formData.writing_number}
                onChange={(e) => handleChange('writing_number', e.target.value)}
                placeholder="Carrier agent/writing number"
              />
            </div>
            <div className="space-y-2">
              <Label>Commission Level</Label>
              <Input
                value={formData.commission_level}
                onChange={(e) => handleChange('commission_level', e.target.value)}
                placeholder="e.g., Standard, Premier"
              />
            </div>
          </div>

          {/* States */}
          <div className="space-y-2">
            <Label>Contract States</Label>
            <div className="flex gap-2">
              <Select value={selectedState} onValueChange={setSelectedState}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="State" />
                </SelectTrigger>
                <SelectContent>
                  {US_STATES.filter(s => !formData.states.includes(s)).map(state => (
                    <SelectItem key={state} value={state}>{state}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" variant="outline" onClick={addState} disabled={!selectedState}>
                <Plus className="w-4 h-4 mr-1" /> Add
              </Button>
            </div>
            {formData.states.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {formData.states.sort().map(state => (
                  <Badge key={state} variant="secondary" className="bg-teal-50 text-teal-700">
                    {state}
                    <button type="button" onClick={() => removeState(state)} className="ml-1">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Correction Notes (if status requires correction) */}
          {formData.contract_status === 'requires_correction' && (
            <div className="space-y-2">
              <Label>Correction Notes</Label>
              <Textarea
                value={formData.correction_notes}
                onChange={(e) => handleChange('correction_notes', e.target.value)}
                placeholder="Describe what corrections are needed..."
                rows={3}
              />
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Additional notes..."
              rows={2}
            />
          </div>

          {/* AI Contract Analyzer */}
          {contract && (
            <div className="pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAnalyzer(!showAnalyzer)}
                className="w-full text-purple-600 border-purple-200 hover:bg-purple-50"
              >
                <FileSearch className="w-4 h-4 mr-2" />
                {showAnalyzer ? 'Hide' : 'Show'} AI Contract Analysis
              </Button>
              {showAnalyzer && (
                <div className="mt-4">
                  <ContractAIAnalyzer
                    contract={{ ...formData, id: contract?.id, agent_id: agentId }}
                    document={documentUrl ? { file_url: documentUrl } : null}
                    onCreateTask={onCreateTask}
                  />
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-teal-600 hover:bg-teal-700" 
              disabled={isLoading || !formData.carrier_id}
            >
              {isLoading ? 'Saving...' : (contract ? 'Update Contract' : 'Create Contract')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}