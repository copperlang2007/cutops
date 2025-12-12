import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, Upload, FileText, CheckCircle, AlertCircle,
  Building2, User, DollarSign, FileCheck, X, ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const steps = [
  { id: 1, title: 'Basic Information', icon: Building2 },
  { id: 2, title: 'Contact Details', icon: User },
  { id: 3, title: 'Documents', icon: FileText },
  { id: 4, title: 'Commission Structure', icon: DollarSign },
  { id: 5, title: 'Review & Submit', icon: FileCheck }
];

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

export default function CarrierOnboardingForm({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    website: '',
    phone: '',
    email: '',
    tax_id: '',
    business_type: 'corporation',
    year_established: new Date().getFullYear(),
    primary_contact_name: '',
    primary_contact_title: '',
    primary_contact_phone: '',
    primary_contact_email: '',
    contracting_email: '',
    portal_url: '',
    states_available: [],
    certification_required: true,
    certification_url: '',
    commission_structure: {
      initial_rate: 0,
      renewal_rate: 0,
      override_available: false
    },
    notes: '',
    onboarding_status: 'pending_docs'
  });

  const [uploadingW9, setUploadingW9] = useState(false);
  const [uploadingAgreement, setUploadingAgreement] = useState(false);
  const [w9Url, setW9Url] = useState('');
  const [agreementUrl, setAgreementUrl] = useState('');
  const [additionalDocs, setAdditionalDocs] = useState([]);

  const submitMutation = useMutation({
    mutationFn: async (data) => {
      // Generate carrier ID
      const carrierId = `CAR-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      
      const carrierData = {
        ...data,
        carrier_id: carrierId,
        w9_document_url: w9Url,
        carrier_agreement_url: agreementUrl,
        additional_documents: additionalDocs,
        onboarding_started_date: new Date().toISOString(),
        status: 'pending'
      };

      return await base44.entities.Carrier.create(carrierData);
    },
    onSuccess: (result) => {
      toast.success('Carrier onboarding submitted successfully!');
      if (onComplete) onComplete(result);
    },
    onError: (error) => {
      toast.error('Failed to submit carrier onboarding');
      console.error(error);
    }
  });

  const handleFileUpload = async (file, type) => {
    try {
      if (type === 'w9') setUploadingW9(true);
      if (type === 'agreement') setUploadingAgreement(true);

      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      if (type === 'w9') {
        setW9Url(file_url);
        toast.success('W9 uploaded successfully');
      } else if (type === 'agreement') {
        setAgreementUrl(file_url);
        toast.success('Agreement uploaded successfully');
      } else if (type === 'additional') {
        setAdditionalDocs([...additionalDocs, {
          name: file.name,
          url: file_url,
          uploaded_date: new Date().toISOString()
        }]);
        toast.success('Document uploaded successfully');
      }
    } catch (error) {
      toast.error('Failed to upload file');
    } finally {
      if (type === 'w9') setUploadingW9(false);
      if (type === 'agreement') setUploadingAgreement(false);
    }
  };

  const toggleState = (state) => {
    setFormData(prev => ({
      ...prev,
      states_available: prev.states_available.includes(state)
        ? prev.states_available.filter(s => s !== state)
        : [...prev.states_available, state]
    }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.name && formData.code && formData.website;
      case 2:
        return formData.primary_contact_name && formData.primary_contact_email;
      case 3:
        return w9Url && agreementUrl;
      case 4:
        return true;
      case 5:
        return true;
      default:
        return false;
    }
  };

  const handleSubmit = () => {
    submitMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-between">
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
      <Card className="border-0 shadow-lg dark:bg-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {steps[currentStep - 1].title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Carrier Name *</Label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="e.g., United Healthcare"
                      />
                    </div>
                    <div>
                      <Label>Carrier Code *</Label>
                      <Input
                        value={formData.code}
                        onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                        placeholder="e.g., UHC"
                        maxLength={10}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Website *</Label>
                    <Input
                      value={formData.website}
                      onChange={(e) => setFormData({...formData, website: e.target.value})}
                      placeholder="https://..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Tax ID</Label>
                      <Input
                        value={formData.tax_id}
                        onChange={(e) => setFormData({...formData, tax_id: e.target.value})}
                        placeholder="XX-XXXXXXX"
                      />
                    </div>
                    <div>
                      <Label>Business Type</Label>
                      <Select value={formData.business_type} onValueChange={(v) => setFormData({...formData, business_type: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="corporation">Corporation</SelectItem>
                          <SelectItem value="llc">LLC</SelectItem>
                          <SelectItem value="partnership">Partnership</SelectItem>
                          <SelectItem value="sole_proprietor">Sole Proprietor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Year Established</Label>
                    <Input
                      type="number"
                      value={formData.year_established}
                      onChange={(e) => setFormData({...formData, year_established: parseInt(e.target.value)})}
                      min={1900}
                      max={new Date().getFullYear()}
                    />
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Primary Contact Name *</Label>
                      <Input
                        value={formData.primary_contact_name}
                        onChange={(e) => setFormData({...formData, primary_contact_name: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Title</Label>
                      <Input
                        value={formData.primary_contact_title}
                        onChange={(e) => setFormData({...formData, primary_contact_title: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Contact Email *</Label>
                      <Input
                        type="email"
                        value={formData.primary_contact_email}
                        onChange={(e) => setFormData({...formData, primary_contact_email: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Contact Phone</Label>
                      <Input
                        value={formData.primary_contact_phone}
                        onChange={(e) => setFormData({...formData, primary_contact_phone: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Contracting Email</Label>
                      <Input
                        type="email"
                        value={formData.contracting_email}
                        onChange={(e) => setFormData({...formData, contracting_email: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Agent Portal URL</Label>
                      <Input
                        value={formData.portal_url}
                        onChange={(e) => setFormData({...formData, portal_url: e.target.value})}
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="mb-2 block">States Available</Label>
                    <div className="border dark:border-slate-700 rounded-lg p-4 max-h-48 overflow-y-auto">
                      <div className="grid grid-cols-6 sm:grid-cols-10 gap-2">
                        {US_STATES.map(state => (
                          <button
                            key={state}
                            type="button"
                            onClick={() => toggleState(state)}
                            className={`px-2 py-1 text-xs rounded transition-colors ${
                              formData.states_available.includes(state)
                                ? 'bg-teal-500 text-white'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
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

              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      Upload required documents to complete carrier onboarding. All documents should be in PDF format.
                    </p>
                  </div>

                  {/* W9 Upload */}
                  <div>
                    <Label className="mb-2 flex items-center gap-2">
                      W-9 Form * 
                      {w9Url && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                    </Label>
                    <div className="border-2 border-dashed rounded-lg p-4 text-center">
                      {w9Url ? (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileText className="w-8 h-8 text-emerald-500" />
                            <span className="text-sm text-slate-600 dark:text-slate-400">W-9 uploaded</span>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => setW9Url('')}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-10 h-10 mx-auto text-slate-400 mb-2" />
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Upload W-9</p>
                          <input
                            type="file"
                            accept=".pdf"
                            onChange={(e) => e.target.files[0] && handleFileUpload(e.target.files[0], 'w9')}
                            className="hidden"
                            id="w9-upload"
                          />
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => document.getElementById('w9-upload').click()}
                            disabled={uploadingW9}
                          >
                            {uploadingW9 ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Choose File'}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Carrier Agreement Upload */}
                  <div>
                    <Label className="mb-2 flex items-center gap-2">
                      Carrier Agreement * 
                      {agreementUrl && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                    </Label>
                    <div className="border-2 border-dashed rounded-lg p-4 text-center">
                      {agreementUrl ? (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileText className="w-8 h-8 text-emerald-500" />
                            <span className="text-sm text-slate-600 dark:text-slate-400">Agreement uploaded</span>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => setAgreementUrl('')}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-10 h-10 mx-auto text-slate-400 mb-2" />
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Upload Signed Agreement</p>
                          <input
                            type="file"
                            accept=".pdf"
                            onChange={(e) => e.target.files[0] && handleFileUpload(e.target.files[0], 'agreement')}
                            className="hidden"
                            id="agreement-upload"
                          />
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => document.getElementById('agreement-upload').click()}
                            disabled={uploadingAgreement}
                          >
                            {uploadingAgreement ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Choose File'}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Additional Documents */}
                  <div>
                    <Label className="mb-2 block">Additional Documents (Optional)</Label>
                    <div className="space-y-2">
                      {additionalDocs.map((doc, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-900">
                          <span className="text-sm text-slate-600 dark:text-slate-400">{doc.name}</span>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setAdditionalDocs(additionalDocs.filter((_, i) => i !== idx))}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => e.target.files[0] && handleFileUpload(e.target.files[0], 'additional')}
                        className="hidden"
                        id="additional-upload"
                      />
                      <Button 
                        variant="outline" 
                        onClick={() => document.getElementById('additional-upload').click()}
                        className="w-full"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Add Document
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Initial Commission Rate (%)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={formData.commission_structure.initial_rate}
                        onChange={(e) => setFormData({
                          ...formData,
                          commission_structure: {
                            ...formData.commission_structure,
                            initial_rate: parseFloat(e.target.value) || 0
                          }
                        })}
                      />
                    </div>
                    <div>
                      <Label>Renewal Commission Rate (%)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={formData.commission_structure.renewal_rate}
                        onChange={(e) => setFormData({
                          ...formData,
                          commission_structure: {
                            ...formData.commission_structure,
                            renewal_rate: parseFloat(e.target.value) || 0
                          }
                        })}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={formData.commission_structure.override_available}
                      onCheckedChange={(v) => setFormData({
                        ...formData,
                        commission_structure: {
                          ...formData.commission_structure,
                          override_available: v
                        }
                      })}
                    />
                    <Label>Override Commissions Available</Label>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={formData.certification_required}
                      onCheckedChange={(v) => setFormData({...formData, certification_required: v})}
                    />
                    <Label>Product Certification Required</Label>
                  </div>
                  {formData.certification_required && (
                    <div>
                      <Label>Certification URL</Label>
                      <Input
                        value={formData.certification_url}
                        onChange={(e) => setFormData({...formData, certification_url: e.target.value})}
                        placeholder="https://..."
                      />
                    </div>
                  )}
                  <div>
                    <Label>Notes</Label>
                    <Textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      rows={4}
                      placeholder="Additional information..."
                    />
                  </div>
                </div>
              )}

              {currentStep === 5 && (
                <div className="space-y-6">
                  <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                    <p className="text-sm text-emerald-800 dark:text-emerald-200 font-medium mb-1">
                      Review carrier information before submitting
                    </p>
                    <p className="text-xs text-emerald-700 dark:text-emerald-300">
                      A unique carrier ID will be automatically generated upon submission.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-500 mb-1">Carrier Name</p>
                      <p className="font-medium text-slate-800 dark:text-white">{formData.name}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 mb-1">Code</p>
                      <p className="font-medium text-slate-800 dark:text-white">{formData.code}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 mb-1">Primary Contact</p>
                      <p className="font-medium text-slate-800 dark:text-white">{formData.primary_contact_name}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 mb-1">Contact Email</p>
                      <p className="font-medium text-slate-800 dark:text-white">{formData.primary_contact_email}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 mb-1">States Available</p>
                      <p className="font-medium text-slate-800 dark:text-white">{formData.states_available.length} states</p>
                    </div>
                    <div>
                      <p className="text-slate-500 mb-1">Documents</p>
                      <div className="flex items-center gap-2">
                        {w9Url && <Badge className="bg-emerald-100 text-emerald-700 text-xs">W-9</Badge>}
                        {agreementUrl && <Badge className="bg-emerald-100 text-emerald-700 text-xs">Agreement</Badge>}
                        {additionalDocs.length > 0 && <Badge variant="outline" className="text-xs">+{additionalDocs.length}</Badge>}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
          disabled={currentStep === 1 || submitMutation.isPending}
        >
          Previous
        </Button>
        {currentStep < 5 ? (
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
            disabled={submitMutation.isPending}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {submitMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Submit Onboarding
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}