import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createPageUrl } from '@/utils';
import { 
  FileSignature, Search, Filter, X, Users, Building2, 
  AlertTriangle, CheckCircle, Clock, Send, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import ContractCard from '../components/contracts/ContractCard';
import ContractFormModal from '../components/contracts/ContractFormModal';
import { CONTRACT_STATUSES, CONTRACT_STATUS_CONFIG } from '../components/shared/constants';
import ContractComplianceMonitor from '../components/contracts/ContractComplianceMonitor';
import AIContractAnalyzer from '../components/contracts/AIContractAnalyzer';

export default function Contracts() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [carrierFilter, setCarrierFilter] = useState('all');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingContract, setEditingContract] = useState(null);
  const [selectedAgentId, setSelectedAgentId] = useState(null);
  const [analyzingContract, setAnalyzingContract] = useState(null);

  const queryClient = useQueryClient();

  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ['contracts'],
    queryFn: () => base44.entities.Contract.list('-created_date')
  });

  const { data: agents = [] } = useQuery({
    queryKey: ['agents'],
    queryFn: () => base44.entities.Agent.list()
  });

  const { data: carriers = [] } = useQuery({
    queryKey: ['carriers'],
    queryFn: () => base44.entities.Carrier.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Contract.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['contracts']);
      setShowFormModal(false);
      setSelectedAgentId(null);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Contract.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['contracts']);
      setShowFormModal(false);
      setEditingContract(null);
    }
  });

  const getAgentName = (agentId) => {
    const agent = agents.find(a => a.id === agentId);
    return agent ? `${agent.first_name} ${agent.last_name}` : 'Unknown';
  };

  const filteredContracts = contracts.filter(contract => {
    const agentName = getAgentName(contract.agent_id);
    const matchesSearch = searchTerm === '' || 
      agentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.carrier_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.writing_number?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || contract.contract_status === statusFilter;
    const matchesCarrier = carrierFilter === 'all' || contract.carrier_id === carrierFilter;
    
    return matchesSearch && matchesStatus && matchesCarrier;
  });

  // Stats
  const stats = {
    total: contracts.length,
    active: contracts.filter(c => c.contract_status === 'active').length,
    pending: contracts.filter(c => ['pending_submission', 'submitted', 'pending_carrier_review', 'contract_sent'].includes(c.contract_status)).length,
    actionRequired: contracts.filter(c => c.contract_status === 'requires_correction').length
  };

  const handleEdit = (contract) => {
    setEditingContract(contract);
    setSelectedAgentId(contract.agent_id);
    setShowFormModal(true);
  };

  const handleSubmit = (data) => {
    if (editingContract) {
      updateMutation.mutate({ id: editingContract.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const hasFilters = searchTerm || statusFilter !== 'all' || carrierFilter !== 'all';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Contracts</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Manage agent carrier contracts</p>
          </div>
          <div className="flex items-center gap-3">
            {stats.actionRequired > 0 && (
              <Badge variant="secondary" className="bg-red-100 text-red-700">
                <AlertTriangle className="w-3 h-3 mr-1" />
                {stats.actionRequired} Action Required
              </Badge>
            )}
          </div>
        </div>

        {/* Compliance Monitor */}
        <div className="mb-6">
          <ContractComplianceMonitor agentId={null} />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <Card className="border-0 shadow-sm dark:bg-slate-800 hover:shadow-xl hover:shadow-slate-500/10 transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700">
                  <FileSignature className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-slate-800">{stats.total}</p>
                  <p className="text-xs text-slate-500">Total Contracts</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-100">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-slate-800">{stats.active}</p>
                  <p className="text-xs text-slate-500">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-slate-800">{stats.pending}</p>
                  <p className="text-xs text-slate-500">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-100">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-slate-800">{stats.actionRequired}</p>
                  <p className="text-xs text-slate-500">Action Required</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-4 mb-6 border border-slate-200 dark:border-slate-700 hover:shadow-lg hover:shadow-teal-500/10 transition-all duration-300">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by agent, carrier, or writing number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={carrierFilter} onValueChange={setCarrierFilter}>
              <SelectTrigger className="w-full lg:w-48">
                <Building2 className="w-4 h-4 mr-2 text-slate-400" />
                <SelectValue placeholder="Carrier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Carriers</SelectItem>
                {carriers.map(carrier => (
                  <SelectItem key={carrier.id} value={carrier.id}>
                    {carrier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Tabs value={statusFilter} onValueChange={setStatusFilter}>
              <TabsList className="bg-slate-100">
                <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                <TabsTrigger value="requires_correction" className="text-xs">
                  Action Required
                  {stats.actionRequired > 0 && (
                    <Badge variant="secondary" className="ml-1 bg-red-100 text-red-700 text-[10px] px-1">
                      {stats.actionRequired}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="pending_carrier_review" className="text-xs">Pending Review</TabsTrigger>
                <TabsTrigger value="active" className="text-xs">Active</TabsTrigger>
              </TabsList>
            </Tabs>

            {hasFilters && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => { setSearchTerm(''); setStatusFilter('all'); setCarrierFilter('all'); }}
              >
                <X className="w-4 h-4 mr-1" /> Clear
              </Button>
            )}
          </div>
        </div>

        {/* Contracts List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-28 bg-white rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredContracts.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-xl p-12 text-center shadow-sm"
          >
            <FileSignature className="w-16 h-16 mx-auto text-slate-300 mb-4" />
            {hasFilters ? (
              <>
                <p className="text-slate-600 font-medium text-lg">No contracts found</p>
                <p className="text-slate-400 mt-2">Try adjusting your filters</p>
              </>
            ) : (
              <>
                <p className="text-slate-600 font-medium text-lg">No contracts yet</p>
                <p className="text-slate-400 mt-2">Contracts are created from the Agent Detail page</p>
              </>
            )}
          </motion.div>
        ) : (
          <div className="space-y-3">
            {filteredContracts.map(contract => (
              <div key={contract.id}>
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <ContractCard contract={contract} onEdit={handleEdit} />
                    <p className="text-xs text-slate-500 mt-1 ml-14">
                      Agent: {getAgentName(contract.agent_id)}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAnalyzingContract(contract)}
                    className="mt-2"
                  >
                    <Sparkles className="w-4 h-4 mr-1" />
                    AI Analyze
                  </Button>
                </div>
                
                {analyzingContract?.id === contract.id && (
                  <div className="mt-3 ml-14">
                    <AIContractAnalyzer 
                      contract={contract}
                      onAnalysisComplete={() => {
                        queryClient.invalidateQueries(['contracts']);
                      }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form Modal */}
      <ContractFormModal
        open={showFormModal}
        onClose={() => {
          setShowFormModal(false);
          setEditingContract(null);
          setSelectedAgentId(null);
        }}
        contract={editingContract}
        carriers={carriers}
        agentId={selectedAgentId}
        onSubmit={handleSubmit}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}