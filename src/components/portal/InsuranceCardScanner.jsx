import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Camera, Upload, CreditCard, CheckCircle, Loader2, 
  Phone, Calendar, DollarSign, Building2, Shield, RefreshCw
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function InsuranceCardScanner({ client, portalUser, onScanComplete }) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const [planDetails, setPlanDetails] = useState(null);

  const userId = client?.id || portalUser?.id;
  const userIdField = client?.id ? 'client_id' : 'portal_user_id';

  const uploadMutation = useMutation({
    mutationFn: async (file) => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      return file_url;
    }
  });

  const scanMutation = useMutation({
    mutationFn: async (imageUrl) => {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert at reading insurance cards. Analyze this insurance card image and extract all visible information.

Extract:
- Member/cardholder name
- Member ID number
- Group number
- Plan name
- Insurance carrier/company
- Effective date
- RxBIN, RxPCN, RxGRP (prescription info)
- Copay amounts (PCP, Specialist, ER, Urgent Care)
- Member services phone number
- Any other relevant information visible

Return as JSON:
{
  "extracted_data": {
    "member_name": "string",
    "member_id": "string",
    "group_number": "string",
    "plan_name": "string",
    "carrier": "string",
    "effective_date": "string",
    "rxbin": "string",
    "rxpcn": "string",
    "rxgrp": "string",
    "copay_pcp": "string",
    "copay_specialist": "string",
    "copay_er": "string",
    "copay_urgent_care": "string",
    "phone_member_services": "string",
    "plan_type": "medicare_advantage|supplement|pdp|commercial|medicaid",
    "additional_info": {}
  },
  "confidence_score": number (0-100),
  "warnings": ["any issues reading the card"]
}`,
        file_urls: [imageUrl],
        response_json_schema: {
          type: 'object',
          properties: {
            extracted_data: { type: 'object' },
            confidence_score: { type: 'number' },
            warnings: { type: 'array', items: { type: 'string' } }
          }
        }
      });
      return response;
    },
    onSuccess: (data) => {
      setScanResult(data);
      if (data.confidence_score > 70) {
        toast.success('Card scanned successfully!');
        fetchPlanDetails(data.extracted_data);
      } else {
        toast.warning('Some information could not be read clearly. Please verify.');
      }
    }
  });

  const fetchPlanDetailsMutation = useMutation({
    mutationFn: async (extractedData) => {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Based on this insurance card data, provide comprehensive plan details:

Card Data:
- Carrier: ${extractedData.carrier}
- Plan: ${extractedData.plan_name}
- Plan Type: ${extractedData.plan_type}
- Member ID: ${extractedData.member_id}

Generate detailed plan information including:
- Full plan benefits summary
- Deductible amounts
- Out-of-pocket maximum
- What's covered (doctor visits, hospital, prescription, dental, vision, hearing)
- Network type (HMO, PPO, etc.)
- Prior authorization requirements
- Special benefits (OTC allowance, fitness, transportation)

Return as JSON:
{
  "plan_summary": {
    "plan_name": "string",
    "carrier": "string",
    "plan_type": "string",
    "network_type": "HMO|PPO|POS|EPO",
    "monthly_premium": number or null,
    "annual_deductible": number,
    "annual_out_of_pocket_max": number
  },
  "benefits": {
    "pcp_visit": "string copay/coinsurance",
    "specialist_visit": "string",
    "hospital_inpatient": "string",
    "hospital_outpatient": "string",
    "emergency_room": "string",
    "urgent_care": "string",
    "preventive_care": "string",
    "prescription_drugs": {
      "tier1": "string",
      "tier2": "string",
      "tier3": "string",
      "tier4": "string",
      "tier5": "string"
    },
    "dental": "string",
    "vision": "string",
    "hearing": "string"
  },
  "special_benefits": [
    {"name": "string", "value": "string", "description": "string"}
  ],
  "important_notes": ["string"],
  "network_info": {
    "description": "string",
    "referral_required": true/false,
    "out_of_network_coverage": true/false
  }
}`,
        response_json_schema: {
          type: 'object',
          properties: {
            plan_summary: { type: 'object' },
            benefits: { type: 'object' },
            special_benefits: { type: 'array' },
            important_notes: { type: 'array' },
            network_info: { type: 'object' }
          }
        }
      });
      return response;
    },
    onSuccess: (data) => {
      setPlanDetails(data);
    }
  });

  const fetchPlanDetails = (extractedData) => {
    fetchPlanDetailsMutation.mutate(extractedData);
  };

  const saveScanMutation = useMutation({
    mutationFn: async (data) => {
      await base44.entities.InsuranceCardScan.create({
        [userIdField]: userId,
        card_image_url: preview,
        extracted_data: data.extracted_data,
        plan_details_fetched: !!planDetails,
        plan_details: planDetails,
        scan_date: new Date().toISOString()
      });
    },
    onSuccess: () => {
      toast.success('Card information saved!');
      onScanComplete?.();
    }
  });

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File must be less than 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);

    const imageUrl = await uploadMutation.mutateAsync(file);
    scanMutation.mutate(imageUrl);
  };

  const isLoading = uploadMutation.isPending || scanMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Scanner Card */}
      <Card className="border-0 shadow-sm dark:bg-slate-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-teal-600" />
            Insurance Card Scanner
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            Take a photo or upload your insurance card to automatically extract your plan information.
          </p>

          {!preview ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:border-teal-400 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
            >
              <Camera className="w-12 h-12 mx-auto text-slate-400 mb-3" />
              <p className="font-medium text-slate-700 dark:text-slate-300">
                Tap to scan your insurance card
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Take a photo or upload an image
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative rounded-xl overflow-hidden">
                <img 
                  src={preview} 
                  alt="Insurance card" 
                  className="w-full max-h-64 object-contain bg-slate-100 dark:bg-slate-900"
                />
                {isLoading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="text-center text-white">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                      <p className="text-sm">Scanning card...</p>
                    </div>
                  </div>
                )}
              </div>
              <Button 
                variant="outline" 
                onClick={() => {
                  setPreview(null);
                  setScanResult(null);
                  setPlanDetails(null);
                }}
                className="w-full"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Scan Different Card
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Extracted Information */}
      {scanResult && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-0 shadow-sm dark:bg-slate-800">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Card Information
                </CardTitle>
                <Badge className={scanResult.confidence_score > 80 
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                  : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
                }>
                  {scanResult.confidence_score}% Confidence
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <InfoField label="Member Name" value={scanResult.extracted_data.member_name} />
                <InfoField label="Member ID" value={scanResult.extracted_data.member_id} icon={<Shield className="w-4 h-4" />} />
                <InfoField label="Group Number" value={scanResult.extracted_data.group_number} />
                <InfoField label="Plan Name" value={scanResult.extracted_data.plan_name} />
                <InfoField label="Insurance Carrier" value={scanResult.extracted_data.carrier} icon={<Building2 className="w-4 h-4" />} />
                <InfoField label="Effective Date" value={scanResult.extracted_data.effective_date} icon={<Calendar className="w-4 h-4" />} />
              </div>

              {(scanResult.extracted_data.copay_pcp || scanResult.extracted_data.copay_specialist) && (
                <>
                  <div className="border-t dark:border-slate-700 pt-4">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Copay Information</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <CopayBadge label="PCP" value={scanResult.extracted_data.copay_pcp} />
                      <CopayBadge label="Specialist" value={scanResult.extracted_data.copay_specialist} />
                      <CopayBadge label="ER" value={scanResult.extracted_data.copay_er} />
                      <CopayBadge label="Urgent Care" value={scanResult.extracted_data.copay_urgent_care} />
                    </div>
                  </div>
                </>
              )}

              {(scanResult.extracted_data.rxbin || scanResult.extracted_data.rxpcn) && (
                <div className="border-t dark:border-slate-700 pt-4">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Prescription Information</p>
                  <div className="grid grid-cols-3 gap-3">
                    <InfoField label="RxBIN" value={scanResult.extracted_data.rxbin} small />
                    <InfoField label="RxPCN" value={scanResult.extracted_data.rxpcn} small />
                    <InfoField label="RxGRP" value={scanResult.extracted_data.rxgrp} small />
                  </div>
                </div>
              )}

              {scanResult.extracted_data.phone_member_services && (
                <div className="p-3 rounded-lg bg-teal-50 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-800">
                  <p className="text-sm text-teal-700 dark:text-teal-300 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Member Services: <strong>{scanResult.extracted_data.phone_member_services}</strong>
                  </p>
                </div>
              )}

              {scanResult.warnings?.length > 0 && (
                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800">
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    ⚠️ {scanResult.warnings.join('. ')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Plan Details */}
      {planDetails && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-0 shadow-sm dark:bg-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                Your Plan Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Plan Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Network Type</p>
                  <p className="font-semibold text-slate-800 dark:text-white">{planDetails.plan_summary?.network_type}</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Annual Deductible</p>
                  <p className="font-semibold text-slate-800 dark:text-white">${planDetails.plan_summary?.annual_deductible}</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Out-of-Pocket Max</p>
                  <p className="font-semibold text-slate-800 dark:text-white">${planDetails.plan_summary?.annual_out_of_pocket_max}</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Referral Required</p>
                  <p className="font-semibold text-slate-800 dark:text-white">
                    {planDetails.network_info?.referral_required ? 'Yes' : 'No'}
                  </p>
                </div>
              </div>

              {/* Benefits */}
              <div className="border-t dark:border-slate-700 pt-4">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Coverage Summary</p>
                <div className="grid grid-cols-2 gap-2">
                  {planDetails.benefits && Object.entries(planDetails.benefits).filter(([key]) => key !== 'prescription_drugs').map(([key, value]) => (
                    <div key={key} className="flex justify-between p-2 rounded bg-slate-50 dark:bg-slate-900/50 text-sm">
                      <span className="text-slate-600 dark:text-slate-400 capitalize">{key.replace(/_/g, ' ')}</span>
                      <span className="font-medium text-slate-800 dark:text-white">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Special Benefits */}
              {planDetails.special_benefits?.length > 0 && (
                <div className="border-t dark:border-slate-700 pt-4">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Special Benefits</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {planDetails.special_benefits.map((benefit, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800">
                        <p className="font-medium text-green-700 dark:text-green-400 text-sm">{benefit.name}</p>
                        <p className="text-sm text-green-600 dark:text-green-500">{benefit.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button 
                onClick={() => saveScanMutation.mutate(scanResult)}
                disabled={saveScanMutation.isPending}
                className="w-full bg-teal-600 hover:bg-teal-700 mt-4"
              >
                {saveScanMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4 mr-2" />
                )}
                Save Card Information
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {fetchPlanDetailsMutation.isPending && (
        <Card className="border-0 shadow-sm dark:bg-slate-800">
          <CardContent className="p-6 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-teal-600 mb-2" />
            <p className="text-sm text-slate-500 dark:text-slate-400">Loading plan details...</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function InfoField({ label, value, icon, small }) {
  if (!value) return null;
  return (
    <div className={small ? '' : 'p-2 rounded-lg bg-slate-50 dark:bg-slate-900/50'}>
      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
        {icon}{label}
      </p>
      <p className={`font-medium text-slate-800 dark:text-white ${small ? 'text-sm' : ''}`}>{value}</p>
    </div>
  );
}

function CopayBadge({ label, value }) {
  if (!value) return null;
  return (
    <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-center">
      <p className="text-xs text-blue-600 dark:text-blue-400">{label}</p>
      <p className="font-bold text-blue-700 dark:text-blue-300">{value}</p>
    </div>
  );
}