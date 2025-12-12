import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Building2, Plus, Search, Filter, X, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import CarrierCard from '../components/carriers/CarrierCard';
import CarrierPerformanceDashboard from '../components/carriers/CarrierPerformanceDashboard';

export default function Carriers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [carrierToDelete, setCarrierToDelete] = useState(null);

  const queryClient = useQueryClient();

  const { data: carriers = [], isLoading } = useQuery({
    queryKey: ['carriers'],
    queryFn: () => base44.entities.Carrier.list('-created_date')
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Carrier.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['carriers']);
      toast.success('Carrier deleted successfully');
      setDeleteModalOpen(false);
      setCarrierToDelete(null);
    },
    onError: () => {
      toast.error('Failed to delete carrier');
    }
  });

  const handleDeleteClick = (carrier, e) => {
    e.stopPropagation();
    setCarrierToDelete(carrier);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (carrierToDelete) {
      deleteMutation.mutate(carrierToDelete.id);
    }
  };

  const { data: appointments = [] } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => base44.entities.CarrierAppointment.list()
  });

  const getAgentCountForCarrier = (carrierName) => {
    const uniqueAgents = new Set(
      appointments.filter(a => a.carrier_name === carrierName).map(a => a.agent_id)
    );
    return uniqueAgents.size;
  };

  const filteredCarriers = carriers.filter(carrier => {
    const matchesSearch = searchTerm === '' || 
      carrier.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      carrier.code?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || carrier.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const hasFilters = searchTerm || statusFilter !== 'all';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Carriers</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">{carriers.length} total carriers</p>
          </div>
          <Link to={createPageUrl('AddCarrier')}>
            <Button className="bg-teal-600 hover:bg-teal-700 shadow-lg hover:shadow-teal-500/30 transition-all duration-300">
              <Plus className="w-4 h-4 mr-2" />
              Add Carrier
            </Button>
          </Link>
        </div>

        {/* Performance Dashboard */}
        <div className="mb-6">
          <CarrierPerformanceDashboard />
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-4 mb-6 border border-slate-200 dark:border-slate-700 hover:shadow-lg hover:shadow-teal-500/10 transition-all duration-300">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by name or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <Filter className="w-4 h-4 mr-2 text-slate-400" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            {hasFilters && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}
                className="text-slate-500"
              >
                <X className="w-4 h-4 mr-1" /> Clear
              </Button>
            )}
          </div>

          {hasFilters && (
            <div className="flex flex-wrap gap-2 mt-3">
              {searchTerm && (
                <Badge variant="secondary" className="bg-teal-50 text-teal-700">
                  Search: "{searchTerm}"
                  <button onClick={() => setSearchTerm('')} className="ml-1"><X className="w-3 h-3" /></button>
                </Badge>
              )}
              {statusFilter !== 'all' && (
                <Badge variant="secondary" className="bg-teal-50 text-teal-700">
                  Status: {statusFilter}
                  <button onClick={() => setStatusFilter('all')} className="ml-1"><X className="w-3 h-3" /></button>
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Carriers Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="h-32 bg-white dark:bg-slate-800 rounded-xl animate-pulse shadow-sm" />
            ))}
          </div>
        ) : filteredCarriers.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-800 rounded-xl p-12 text-center shadow-sm border border-slate-200 dark:border-slate-700"
          >
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center mb-4">
              <Building2 className="w-10 h-10 text-slate-400" />
            </div>
            {hasFilters ? (
              <>
                <p className="text-slate-700 dark:text-slate-200 font-semibold text-lg">No carriers found</p>
                <p className="text-slate-400 mt-2">Try adjusting your search or filters</p>
              </>
            ) : (
              <>
                <p className="text-slate-700 dark:text-slate-200 font-semibold text-lg">No carriers yet</p>
                <p className="text-slate-400 mt-2">Add your first carrier to get started</p>
                <Link to={createPageUrl('AddCarrier')}>
                  <Button className="mt-6 bg-teal-600 hover:bg-teal-700 shadow-lg hover:shadow-teal-500/30">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Carrier
                  </Button>
                </Link>
              </>
            )}
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCarriers.map((carrier, idx) => (
              <motion.div
                key={carrier.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <CarrierCard
                  carrier={carrier}
                  agentCount={getAgentCountForCarrier(carrier.name)}
                  onClick={() => {
                    window.location.href = createPageUrl('CarrierDetail') + `?id=${carrier.id}`;
                  }}
                  onDelete={(e) => handleDeleteClick(carrier, e)}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="max-w-md dark:bg-slate-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Delete Carrier
            </DialogTitle>
            <DialogDescription className="text-slate-600 dark:text-slate-400">
              Are you sure you want to delete <strong className="text-slate-800 dark:text-white">{carrierToDelete?.name}</strong>? 
              This action cannot be undone and will remove all associated data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Carrier'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}