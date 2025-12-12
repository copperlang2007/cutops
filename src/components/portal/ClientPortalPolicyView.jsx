import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, Calendar, DollarSign, Building2, 
  User, Phone, MapPin, CreditCard, FileText
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

export default function ClientPortalPolicyView({ client, agent }) {
  if (!client) return null;

  const planTypeLabels = {
    medicare_advantage: 'Medicare Advantage',
    supplement: 'Medicare Supplement (Medigap)',
    pdp: 'Prescription Drug Plan (Part D)',
    ancillary: 'Ancillary Coverage',
    other: 'Other Coverage'
  };

  const statusColors = {
    active: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
    prospect: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
    inactive: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
    churned: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
  };

  const daysUntilRenewal = client.renewal_date 
    ? differenceInDays(new Date(client.renewal_date), new Date())
    : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Policy Info */}
      <div className="lg:col-span-2 space-y-6">
        <Card className="border-0 shadow-sm dark:bg-slate-800">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="w-5 h-5 text-teal-600" />
                Policy Information
              </CardTitle>
              <Badge className={statusColors[client.status] || statusColors.prospect}>
                {client.status?.charAt(0).toUpperCase() + client.status?.slice(1) || 'Prospect'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Plan Type</p>
                <p className="font-semibold text-slate-800 dark:text-white">
                  {planTypeLabels[client.plan_type] || 'Not Specified'}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Current Plan</p>
                <p className="font-semibold text-slate-800 dark:text-white">
                  {client.current_plan || 'Not Set'}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Insurance Carrier</p>
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-slate-400" />
                  <p className="font-semibold text-slate-800 dark:text-white">
                    {client.carrier || 'Not Set'}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Medicare ID</p>
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-slate-400" />
                  <p className="font-semibold text-slate-800 dark:text-white font-mono">
                    {client.medicare_id ? `****-${client.medicare_id.slice(-4)}` : 'Not on file'}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t dark:border-slate-700 mt-6 pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="p-4 rounded-xl bg-teal-50 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-teal-600" />
                    <p className="text-xs text-teal-600 dark:text-teal-400 font-medium">Effective Date</p>
                  </div>
                  <p className="text-lg font-bold text-teal-700 dark:text-teal-300">
                    {client.effective_date 
                      ? format(new Date(client.effective_date), 'MMM d, yyyy')
                      : 'Pending'}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Renewal Date</p>
                  </div>
                  <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
                    {client.renewal_date 
                      ? format(new Date(client.renewal_date), 'MMM d, yyyy')
                      : 'N/A'}
                  </p>
                  {daysUntilRenewal !== null && daysUntilRenewal > 0 && daysUntilRenewal <= 90 && (
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      {daysUntilRenewal} days until renewal
                    </p>
                  )}
                </div>
                <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-4 h-4 text-purple-600" />
                    <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">Monthly Premium</p>
                  </div>
                  <p className="text-lg font-bold text-purple-700 dark:text-purple-300">
                    {client.premium ? `$${client.premium.toFixed(2)}` : '$0.00'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Plan Benefits (Placeholder based on plan type) */}
        <Card className="border-0 shadow-sm dark:bg-slate-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-5 h-5 text-slate-400" />
              Plan Benefits Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            {client.plan_type === 'medicare_advantage' && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Doctor Visits', value: 'Covered' },
                  { label: 'Hospital Care', value: 'Covered' },
                  { label: 'Prescription Drugs', value: 'Included' },
                  { label: 'Preventive Care', value: '$0 Copay' },
                  { label: 'Emergency Care', value: 'Covered' },
                  { label: 'Dental', value: 'Basic Included' },
                  { label: 'Vision', value: 'Annual Exam' },
                  { label: 'Hearing', value: 'Routine Covered' },
                ].map((benefit, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                    <p className="text-xs text-slate-500 dark:text-slate-400">{benefit.label}</p>
                    <p className="font-medium text-slate-800 dark:text-white text-sm">{benefit.value}</p>
                  </div>
                ))}
              </div>
            )}
            {client.plan_type === 'supplement' && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Part A Coinsurance', value: 'Covered' },
                  { label: 'Part B Coinsurance', value: 'Covered' },
                  { label: 'Blood (First 3 pints)', value: 'Covered' },
                  { label: 'Part A Hospice', value: 'Covered' },
                  { label: 'Skilled Nursing', value: 'Covered' },
                  { label: 'Part A Deductible', value: 'Covered' },
                  { label: 'Part B Deductible', value: 'See Plan' },
                  { label: 'Part B Excess', value: 'See Plan' },
                ].map((benefit, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                    <p className="text-xs text-slate-500 dark:text-slate-400">{benefit.label}</p>
                    <p className="font-medium text-slate-800 dark:text-white text-sm">{benefit.value}</p>
                  </div>
                ))}
              </div>
            )}
            {client.plan_type === 'pdp' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                  { label: 'Tier 1 (Preferred Generic)', value: 'Low Copay' },
                  { label: 'Tier 2 (Generic)', value: 'Low Copay' },
                  { label: 'Tier 3 (Preferred Brand)', value: 'Mid Copay' },
                  { label: 'Tier 4 (Non-Preferred)', value: 'Higher Copay' },
                  { label: 'Tier 5 (Specialty)', value: 'See Formulary' },
                  { label: 'Mail Order', value: 'Available' },
                ].map((benefit, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                    <p className="text-xs text-slate-500 dark:text-slate-400">{benefit.label}</p>
                    <p className="font-medium text-slate-800 dark:text-white text-sm">{benefit.value}</p>
                  </div>
                ))}
              </div>
            )}
            {!['medicare_advantage', 'supplement', 'pdp'].includes(client.plan_type) && (
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
                Contact your agent for detailed benefit information.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sidebar - Personal Info */}
      <div className="space-y-6">
        <Card className="border-0 shadow-sm dark:bg-slate-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="w-5 h-5 text-slate-400" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Full Name</p>
              <p className="font-medium text-slate-800 dark:text-white">
                {client.first_name} {client.last_name}
              </p>
            </div>
            {client.date_of_birth && (
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Date of Birth</p>
                <p className="font-medium text-slate-800 dark:text-white">
                  {format(new Date(client.date_of_birth), 'MMMM d, yyyy')}
                </p>
              </div>
            )}
            {client.email && (
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Email</p>
                <p className="font-medium text-slate-800 dark:text-white break-all">{client.email}</p>
              </div>
            )}
            {client.phone && (
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Phone</p>
                <p className="font-medium text-slate-800 dark:text-white">{client.phone}</p>
              </div>
            )}
            {(client.address || client.city || client.state) && (
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Address</p>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <p className="font-medium text-slate-800 dark:text-white text-sm">
                    {client.address && <span>{client.address}<br /></span>}
                    {client.city && `${client.city}, `}{client.state} {client.zip}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Important Notes */}
        {client.notes && (
          <Card className="border-0 shadow-sm dark:bg-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
                {client.notes}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}