// Shared constants for the application
// Centralized to ensure consistency and maintainability

export const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'
];

export const CARRIERS = [
  'Humana', 'UnitedHealthcare', 'Aetna', 'Cigna', 'Anthem', 'WellCare', 
  'Centene', 'Molina', 'Kaiser', 'Blue Cross Blue Shield'
];

export const DOCUMENT_TYPES = [
  { value: 'eo_certificate', label: 'E&O Certificate' },
  { value: 'background_check', label: 'Background Check' },
  { value: 'ahip_certificate', label: 'AHIP Certificate' },
  { value: 'carrier_certification', label: 'Carrier Certification' },
  { value: 'state_license', label: 'State License Copy' },
  { value: 'compliance_training', label: 'Compliance Training' },
  { value: 'contract', label: 'Contract/Agreement' },
  { value: 'w9', label: 'W-9 Form' },
  { value: 'direct_deposit', label: 'Direct Deposit Form' },
  { value: 'id_verification', label: 'ID Verification' },
  { value: 'other', label: 'Other' }
];

export const ONBOARDING_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'ready_to_sell', label: 'Ready to Sell' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'terminated', label: 'Terminated' }
];

export const CONTRACTING_STATUSES = [
  { value: 'not_started', label: 'Not Started' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'pending_review', label: 'Pending Review' },
  { value: 'completed', label: 'Completed' },
  { value: 'on_hold', label: 'On Hold' }
];

export const CONTRACT_STATUSES = [
  { value: 'not_started', label: 'Not Started' },
  { value: 'pending_submission', label: 'Pending Submission' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'pending_carrier_review', label: 'Pending Carrier Review' },
  { value: 'requires_correction', label: 'Requires Correction' },
  { value: 'contract_sent', label: 'Contract Sent' },
  { value: 'contract_signed', label: 'Contract Signed' },
  { value: 'active', label: 'Active' },
  { value: 'expired', label: 'Expired' },
  { value: 'terminated', label: 'Terminated' }
];

export const CONTRACT_STATUS_CONFIG = {
  not_started: { label: 'Not Started', color: 'bg-slate-100 text-slate-600 border-slate-200' },
  pending_submission: { label: 'Pending Submission', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  submitted: { label: 'Submitted', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  pending_carrier_review: { label: 'Pending Carrier Review', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  requires_correction: { label: 'Requires Correction', color: 'bg-red-100 text-red-700 border-red-200' },
  contract_sent: { label: 'Contract Sent', color: 'bg-teal-100 text-teal-700 border-teal-200' },
  contract_signed: { label: 'Contract Signed', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  active: { label: 'Active', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  expired: { label: 'Expired', color: 'bg-red-100 text-red-700 border-red-200' },
  terminated: { label: 'Terminated', color: 'bg-slate-100 text-slate-600 border-slate-200' }
};

export const CONTRACTING_STATUS_CONFIG = {
  not_started: { label: 'Not Started', color: 'bg-slate-100 text-slate-600 border-slate-200' },
  in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  pending_review: { label: 'Pending Review', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  completed: { label: 'Completed', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  on_hold: { label: 'On Hold', color: 'bg-red-100 text-red-700 border-red-200' }
};

export const STATUS_CONFIG = {
  ready_to_sell: { label: 'Ready to Sell', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  in_progress: { label: 'In Progress', color: 'bg-teal-100 text-teal-700 border-teal-200' },
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  suspended: { label: 'Suspended', color: 'bg-red-100 text-red-700 border-red-200' },
  terminated: { label: 'Terminated', color: 'bg-slate-100 text-slate-600 border-slate-200' }
};

export const ALERT_TYPES = {
  license_expiring: 'License Expiring',
  license_expired: 'License Expired',
  appointment_pending: 'Appointment Pending',
  rts_expired: 'RTS Expired',
  adverse_action: 'Adverse Action',
  ce_due: 'CE Due',
  ahip_expiring: 'AHIP Expiring',
  eo_expiring: 'E&O Expiring',
  background_failed: 'Background Failed',
  nipr_issue: 'NIPR Issue',
  sunfire_issue: 'Sunfire Issue',
  contract_expiring: 'Contract Expiring',
  contract_action_required: 'Contract Action Required',
  onboarding_overdue: 'Onboarding Item Overdue'
};

export const SEVERITY_CONFIG = {
  critical: {
    bg: "bg-red-50",
    border: "border-red-200",
    iconColor: "text-red-500",
    badge: "bg-red-100 text-red-700"
  },
  warning: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    iconColor: "text-amber-500",
    badge: "bg-amber-100 text-amber-700"
  },
  info: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    iconColor: "text-blue-500",
    badge: "bg-blue-100 text-blue-700"
  }
};

// File upload constraints
export const FILE_UPLOAD_CONFIG = {
  maxSize: 10 * 1024 * 1024, // 10MB
  acceptedTypes: '.pdf,.png,.jpg,.jpeg,.doc,.docx',
  acceptedMimeTypes: [
    'application/pdf',
    'image/png',
    'image/jpeg',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
};

// Alert thresholds
export const ALERT_THRESHOLDS = {
  criticalDays: 30,
  warningDays: 60
};

// Document verification statuses
export const VERIFICATION_STATUS_CONFIG = {
  pending: { label: 'Pending Verification', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  verified: { label: 'Verified', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700 border-red-200' }
};