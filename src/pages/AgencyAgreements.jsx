import { useState } from 'react'
import { base44 } from '@/api/base44Client'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  FileSignature, Plus, Search, FileText, Clock, 
  CheckCircle, Send, Eye, Edit, MoreVertical
} from 'lucide-react';
import { format } from 'date-fns'
import { toast } from 'sonner'
import AgreementCreationWizard from '../components/agreements/AgreementCreationWizard';
import AddendumCreationModal from '../components/agreements/AddendumCreationModal';
import AgreementDetailModal from '../components/agreements/AgreementDetailModal';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

export default function AgencyAgreements() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreationWizard, setShowCreationWizard] = useState(false);
  const [showAddendumModal, setShowAddendumModal] = useState(false);
  const [selectedAgreement, setSelectedAgreement] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const { data: agreements = [], isLoading } = useQuery({
    queryKey: ['agencyAgreements'],
    queryFn: () => base44.entities.AgencyPartnerAgreement.list('-created_date')
  });

  const { data: addendums = [] } = useQuery({
    queryKey: ['agreementAddendums'],
    queryFn: () => base44.entities.AgreementAddendum.list('-created_date')
  });

  const { data: agencies = [] } = useQuery({
    queryKey: ['agencies'],
    queryFn: () => base44.entities.Agency.list()
  });

  const handleViewDetails = (agreement) => {
    setSelectedAgreement(agreement);
    setShowDetailModal(true);
  };

  const handleCreateAddendum = (agreement) => {
    setSelectedAgreement(agreement);
    setShowAddendumModal(true);
  };

  const getAgencyName = (agencyId) => {
    const agency = agencies.find(a => a.id === agencyId);
    return agency?.name || 'Unknown';
  };

  const filteredAgreements = agreements.filter(agreement =>
    agreement.agreement_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    getAgencyName(agreement.parent_agency_id).toLowerCase().includes(searchQuery.toLowerCase()) ||
    getAgencyName(agreement.partner_agency_id).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: agreements.length,
    active: agreements.filter(a => a.status === 'active').length,
    pending: agreements.filter(a => a.status === 'pending_signature').length,
    draft: agreements.filter(a => a.status === 'draft').length
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'pending_signature': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'draft': return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-400';
      case 'expired': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <FileSignature className="w-8 h-8 text-teal-600" />
              Agency Partner Agreements
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Manage partner agreements and addendums
            </p>
          </div>
          <Button 
            onClick={() => setShowCreationWizard(true)}
            className="bg-teal-600 hover:bg-teal-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Agreement
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="border-0 shadow-sm dark:bg-slate-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Total Agreements</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
                </div>
                <FileText className="w-8 h-8 text-teal-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm dark:bg-slate-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Active</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.active}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm dark:bg-slate-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Pending Signature</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.pending}</p>
                </div>
                <Clock className="w-8 h-8 text-amber-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm dark:bg-slate-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Drafts</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.draft}</p>
                </div>
                <Edit className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search agreements by number or agency name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white dark:bg-slate-800"
          />
        </div>

        {/* Agreements List */}
        <Card className="border-0 shadow-lg dark:bg-slate-800">
          <CardHeader>
            <CardTitle>Agreements</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-slate-500">Loading agreements...</div>
            ) : filteredAgreements.length === 0 ? (
              <div className="text-center py-8 text-slate-500">No agreements found</div>
            ) : (
              <div className="space-y-3">
                {filteredAgreements.map(agreement => {
                  const agreementAddendums = addendums.filter(
                    a => a.parent_agreement_id === agreement.id
                  );
                  
                  return (
                    <div
                      key={agreement.id}
                      className="p-4 rounded-lg border dark:border-slate-700 hover:border-teal-300 dark:hover:border-teal-600 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-medium text-slate-900 dark:text-white">
                              {agreement.agreement_number}
                            </h3>
                            <Badge className={getStatusColor(agreement.status)}>
                              {agreement.status.replace(/_/g, ' ')}
                            </Badge>
                            {agreement.esignature_status !== 'not_sent' && (
                              <Badge variant="outline" className="text-xs">
                                {agreement.esignature_status}
                              </Badge>
                            )}
                            {agreementAddendums.length > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {agreementAddendums.length} Addendum{agreementAddendums.length > 1 ? 's' : ''}
                              </Badge>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-slate-600 dark:text-slate-400">
                            <div>
                              <span className="font-medium">Type:</span> {agreement.agreement_type.replace(/_/g, ' ')}
                            </div>
                            <div>
                              <span className="font-medium">Parent:</span> {getAgencyName(agreement.parent_agency_id)}
                            </div>
                            <div>
                              <span className="font-medium">Partner:</span> {getAgencyName(agreement.partner_agency_id)}
                            </div>
                            <div>
                              <span className="font-medium">Effective:</span> {agreement.effective_date ? format(new Date(agreement.effective_date), 'MMM d, yyyy') : 'Not set'}
                            </div>
                          </div>

                          {agreement.agreement_terms && (
                            <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
                              {agreement.agreement_terms.commission_override_percentage && (
                                <span>Override: {agreement.agreement_terms.commission_override_percentage}%</span>
                              )}
                              {agreement.territories?.length > 0 && (
                                <span>Territories: {agreement.territories.length}</span>
                              )}
                            </div>
                          )}
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDetails(agreement)}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleCreateAddendum(agreement)}>
                              <Plus className="w-4 h-4 mr-2" />
                              Create Addendum
                            </DropdownMenuItem>
                            {agreement.document_url && (
                              <DropdownMenuItem asChild>
                                <a href={agreement.document_url} target="_blank" rel="noopener noreferrer">
                                  <FileText className="w-4 h-4 mr-2" />
                                  View Document
                                </a>
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modals */}
        {showCreationWizard && (
          <AgreementCreationWizard
            open={showCreationWizard}
            onClose={() => setShowCreationWizard(false)}
            onSuccess={() => {
              queryClient.invalidateQueries(['agencyAgreements']);
              setShowCreationWizard(false);
              toast.success('Agreement created successfully');
            }}
          />
        )}

        {showAddendumModal && selectedAgreement && (
          <AddendumCreationModal
            open={showAddendumModal}
            onClose={() => {
              setShowAddendumModal(false);
              setSelectedAgreement(null);
            }}
            agreement={selectedAgreement}
            onSuccess={() => {
              queryClient.invalidateQueries(['agreementAddendums']);
              setShowAddendumModal(false);
              setSelectedAgreement(null);
              toast.success('Addendum created successfully');
            }}
          />
        )}

        {showDetailModal && selectedAgreement && (
          <AgreementDetailModal
            open={showDetailModal}
            onClose={() => {
              setShowDetailModal(false);
              setSelectedAgreement(null);
            }}
            agreement={selectedAgreement}
            addendums={addendums.filter(a => a.parent_agreement_id === selectedAgreement.id)}
          />
        )}
        </div>

        {/* AI Tasks Sidebar */}
        {user && (
        <div>
          <AutoGeneratedTasksWidget agentId={user.email} />
        </div>
        )}
        </div>
        </div>
  );
}