import { useState } from 'react'
import { base44 } from '@/api/base44Client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  FileSignature, DollarSign, Calendar, Clock, 
  CheckCircle, AlertTriangle, Shield, Target,
  Building2, FileText, Download, Eye, Plus,
  TrendingUp, Briefcase, Scale, MapPin
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns'
import { motion } from 'framer-motion'
import AgencyAgreementFormModal from './AgencyAgreementFormModal';

const statusConfig = {
  draft: { label: 'Draft', color: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300', icon: FileText },
  pending_signature: { label: 'Pending Signature', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400', icon: Clock },
  active: { label: 'Active', color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400', icon: CheckCircle },
  expired: { label: 'Expired', color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400', icon: AlertTriangle },
  terminated: { label: 'Terminated', color: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400', icon: AlertTriangle }
};

const obligationCategoryConfig = {
  compliance: { label: 'Compliance', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400', icon: Shield },
  production: { label: 'Production', color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400', icon: Target },
  training: { label: 'Training', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400', icon: FileText },
  reporting: { label: 'Reporting', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400', icon: FileText },
  conduct: { label: 'Conduct', color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400', icon: Scale },
  other: { label: 'Other', color: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300', icon: Briefcase }
};

export default function AgencyAgreementView({ agent }) {
  const queryClient = useQueryClient();
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingAgreement, setEditingAgreement] = useState(null);

  const { data: agreements = [], isLoading } = useQuery({
    queryKey: ['agencyAgreements', agent?.id],
    queryFn: () => base44.entities.AgencyAgreement.filter({ agent_id: agent.id }, '-created_date'),
    enabled: !!agent?.id
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.AgencyAgreement.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['agencyAgreements', agent?.id]);
      setShowFormModal(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.AgencyAgreement.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['agencyAgreements', agent?.id]);
      setShowFormModal(false);
      setEditingAgreement(null);
    }
  });

  const activeAgreement = agreements.find(a => a.status === 'active');
  const hasAgreement = agreements.length > 0;

  const getDaysRemaining = (endDate) => {
    if (!endDate) return null;
    return differenceInDays(new Date(endDate), new Date());
  };

  const handleSubmit = (data) => {
    if (editingAgreement) {
      updateMutation.mutate({ id: editingAgreement.id, data });
    } else {
      createMutation.mutate({ ...data, agent_id: agent.id });
    }
  };

  if (isLoading) {
    return (
      <Card className="border-0 shadow-sm dark:bg-slate-800">
        <CardContent className="py-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto" />
        </CardContent>
      </Card>
    );
  }

  if (!hasAgreement) {
    return (
      <>
        <Card className="border-0 shadow-sm dark:bg-slate-800">
          <CardContent className="py-12 text-center">
            <FileSignature className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">
              No Agency Agreement
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mb-4 max-w-md mx-auto">
              Create an agency agreement to define compensation structure, duration, and contractual obligations.
            </p>
            <Button onClick={() => setShowFormModal(true)} className="bg-teal-600 hover:bg-teal-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Agreement
            </Button>
          </CardContent>
        </Card>
        <AgencyAgreementFormModal
          open={showFormModal}
          onClose={() => setShowFormModal(false)}
          onSubmit={handleSubmit}
          isLoading={createMutation.isPending}
        />
      </>
    );
  }

  const agreement = activeAgreement || agreements[0];
  const status = statusConfig[agreement.status] || statusConfig.draft;
  const daysRemaining = getDaysRemaining(agreement.end_date);
  const StatusIcon = status.icon;

  return (
    <>
      <div className="space-y-6">
        {/* Header Card */}
        <Card className="border-0 shadow-sm overflow-hidden dark:bg-slate-800">
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 p-6 text-white">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <FileSignature className="w-6 h-6" />
                  <h2 className="text-xl font-bold">{agreement.agreement_name}</h2>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <Badge className={`${status.color} border-0`}>
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {status.label}
                  </Badge>
                  {agreement.auto_renew && (
                    <Badge className="bg-white/20 text-white border-0">
                      Auto-Renew
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                {agreement.document_url && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => window.open(agreement.document_url, '_blank')}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Download
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setEditingAgreement(agreement);
                    setShowFormModal(true);
                  }}
                >
                  Edit
                </Button>
              </div>
            </div>
          </div>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <p className="text-xs text-slate-500 dark:text-slate-400">Start Date</p>
                </div>
                <p className="font-semibold text-slate-800 dark:text-white">
                  {agreement.start_date ? format(new Date(agreement.start_date), 'MMM d, yyyy') : 'Not set'}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <p className="text-xs text-slate-500 dark:text-slate-400">End Date</p>
                </div>
                <p className="font-semibold text-slate-800 dark:text-white">
                  {agreement.end_date ? format(new Date(agreement.end_date), 'MMM d, yyyy') : 'Indefinite'}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <p className="text-xs text-slate-500 dark:text-slate-400">Days Remaining</p>
                </div>
                <p className={`font-semibold ${daysRemaining !== null && daysRemaining < 30 ? 'text-amber-600' : 'text-slate-800 dark:text-white'}`}>
                  {daysRemaining !== null ? `${daysRemaining} days` : 'N/A'}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="w-4 h-4 text-slate-400" />
                  <p className="text-xs text-slate-500 dark:text-slate-400">Base Commission</p>
                </div>
                <p className="font-semibold text-slate-800 dark:text-white">
                  {agreement.base_commission_rate ? `${agreement.base_commission_rate}%` : 'See Details'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Tabs */}
        <Tabs defaultValue="compensation" className="space-y-4">
          <TabsList className="bg-white dark:bg-slate-800 shadow-sm p-1 rounded-xl">
            <TabsTrigger value="compensation" className="rounded-lg gap-2">
              <DollarSign className="w-4 h-4" />
              Compensation
            </TabsTrigger>
            <TabsTrigger value="obligations" className="rounded-lg gap-2">
              <Scale className="w-4 h-4" />
              Obligations
            </TabsTrigger>
            <TabsTrigger value="terms" className="rounded-lg gap-2">
              <FileText className="w-4 h-4" />
              Terms
            </TabsTrigger>
          </TabsList>

          <TabsContent value="compensation">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Base Compensation */}
              <Card className="border-0 shadow-sm dark:bg-slate-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    Base Compensation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-100 dark:border-green-800">
                    <p className="text-sm text-green-600 dark:text-green-400 mb-1">Base Commission Rate</p>
                    <p className="text-3xl font-bold text-green-700 dark:text-green-300">
                      {agreement.base_commission_rate || 0}%
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Payment Schedule</p>
                      <p className="font-medium text-slate-800 dark:text-white capitalize">
                        {agreement.payment_schedule?.replace('_', ' ') || 'Monthly'}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Payment Method</p>
                      <p className="font-medium text-slate-800 dark:text-white capitalize">
                        {agreement.payment_method?.replace('_', ' ') || 'Direct Deposit'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Bonus Structure */}
              <Card className="border-0 shadow-sm dark:bg-slate-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                    Bonus Structure
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {agreement.bonus_structure && agreement.bonus_structure.length > 0 ? (
                    <div className="space-y-3">
                      {agreement.bonus_structure.map((tier, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="p-3 rounded-lg border dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-600 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-slate-800 dark:text-white">{tier.tier_name}</span>
                            <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400">
                              +{tier.bonus_rate}%
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            Threshold: ${tier.threshold?.toLocaleString() || 0}
                          </p>
                          {tier.description && (
                            <p className="text-xs text-slate-400 mt-1">{tier.description}</p>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <TrendingUp className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                      <p className="text-sm text-slate-500 dark:text-slate-400">No bonus tiers defined</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Carrier-Specific Rates */}
              {agreement.carrier_specific_rates && agreement.carrier_specific_rates.length > 0 && (
                <Card className="border-0 shadow-sm dark:bg-slate-800 lg:col-span-2">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-blue-600" />
                      Carrier-Specific Commission Rates
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {agreement.carrier_specific_rates.map((rate, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border dark:border-slate-700"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-slate-800 dark:text-white">{rate.carrier_name}</span>
                            <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400">
                              {rate.commission_rate}%
                            </Badge>
                          </div>
                          {rate.notes && (
                            <p className="text-xs text-slate-500 dark:text-slate-400">{rate.notes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="obligations">
            <Card className="border-0 shadow-sm dark:bg-slate-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Scale className="w-5 h-5 text-teal-600" />
                  Contractual Obligations
                </CardTitle>
              </CardHeader>
              <CardContent>
                {agreement.obligations && agreement.obligations.length > 0 ? (
                  <div className="space-y-3">
                    {agreement.obligations.map((obligation, idx) => {
                      const catConfig = obligationCategoryConfig[obligation.category] || obligationCategoryConfig.other;
                      const CatIcon = catConfig.icon;
                      return (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className={`p-4 rounded-xl border ${obligation.is_mandatory ? 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50'}`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${catConfig.color}`}>
                              <CatIcon className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <h4 className="font-medium text-slate-800 dark:text-white">{obligation.title}</h4>
                                <Badge variant="outline" className={catConfig.color}>
                                  {catConfig.label}
                                </Badge>
                                {obligation.is_mandatory && (
                                  <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
                                    Mandatory
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-slate-600 dark:text-slate-300">{obligation.description}</p>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Scale className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                    <p className="text-slate-500 dark:text-slate-400">No specific obligations defined</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="terms">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-0 shadow-sm dark:bg-slate-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="w-5 h-5 text-slate-600" />
                    Agreement Terms
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Termination Notice</p>
                      <p className="font-medium text-slate-800 dark:text-white">
                        {agreement.termination_notice_days || 30} days
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Non-Compete Period</p>
                      <p className="font-medium text-slate-800 dark:text-white">
                        {agreement.non_compete_months ? `${agreement.non_compete_months} months` : 'None'}
                      </p>
                    </div>
                  </div>
                  {agreement.territory_restrictions && (
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                      <div className="flex items-center gap-2 mb-1">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        <p className="text-xs text-slate-500 dark:text-slate-400">Territory Restrictions</p>
                      </div>
                      <p className="text-sm text-slate-700 dark:text-slate-300">{agreement.territory_restrictions}</p>
                    </div>
                  )}
                  {agreement.renewal_terms && (
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Renewal Terms</p>
                      <p className="text-sm text-slate-700 dark:text-slate-300">{agreement.renewal_terms}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm dark:bg-slate-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileSignature className="w-5 h-5 text-indigo-600" />
                    Signature Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${agreement.signed_by_agent ? 'bg-green-100 dark:bg-green-900/40' : 'bg-slate-200 dark:bg-slate-700'}`}>
                      {agreement.signed_by_agent ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <Clock className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-slate-800 dark:text-white">Agent Signature</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {agreement.signed_by_agent ? 'Signed' : 'Pending'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${agreement.signed_by_agency ? 'bg-green-100 dark:bg-green-900/40' : 'bg-slate-200 dark:bg-slate-700'}`}>
                      {agreement.signed_by_agency ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <Clock className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-slate-800 dark:text-white">Agency Signature</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {agreement.signed_by_agency ? 'Signed' : 'Pending'}
                      </p>
                    </div>
                  </div>
                  {agreement.signed_date && (
                    <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800">
                      <p className="text-xs text-green-600 dark:text-green-400 mb-1">Signed Date</p>
                      <p className="font-medium text-green-700 dark:text-green-300">
                        {format(new Date(agreement.signed_date), 'MMMM d, yyyy')}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {agreement.special_terms && (
                <Card className="border-0 shadow-sm dark:bg-slate-800 lg:col-span-2">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Special Terms & Conditions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border dark:border-slate-700">
                      <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                        {agreement.special_terms}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Other Agreements */}
        {agreements.length > 1 && (
          <Card className="border-0 shadow-sm dark:bg-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Agreement History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {agreements.filter(a => a.id !== agreement.id).map((a) => {
                  const s = statusConfig[a.status] || statusConfig.draft;
                  return (
                    <div
                      key={a.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      onClick={() => {
                        setEditingAgreement(a);
                        setShowFormModal(true);
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <FileSignature className="w-5 h-5 text-slate-400" />
                        <div>
                          <p className="font-medium text-slate-800 dark:text-white text-sm">{a.agreement_name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {a.start_date && format(new Date(a.start_date), 'MMM d, yyyy')}
                            {a.end_date && ` - ${format(new Date(a.end_date), 'MMM d, yyyy')}`}
                          </p>
                        </div>
                      </div>
                      <Badge className={s.color}>{s.label}</Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <AgencyAgreementFormModal
        open={showFormModal}
        onClose={() => {
          setShowFormModal(false);
          setEditingAgreement(null);
        }}
        agreement={editingAgreement}
        onSubmit={handleSubmit}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </>
  );
}