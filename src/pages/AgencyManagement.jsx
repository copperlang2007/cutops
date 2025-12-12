import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, Plus, Search, Users, TrendingUp, DollarSign, 
  Edit, Eye, MoreVertical, Loader2, MapPin, Phone, Mail
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import RoleGuard from '@/components/shared/RoleGuard';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function AgencyManagement() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAgency, setEditingAgency] = useState(null);

  const { data: agencies = [], isLoading } = useQuery({
    queryKey: ['agencies'],
    queryFn: () => base44.entities.Agency.list('-created_date')
  });

  const { data: agents = [] } = useQuery({
    queryKey: ['allAgents'],
    queryFn: () => base44.entities.Agent.list()
  });

  const createAgencyMutation = useMutation({
    mutationFn: (data) => base44.entities.Agency.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['agencies']);
      toast.success('Agency created successfully');
      setShowAddModal(false);
    },
    onError: () => toast.error('Failed to create agency')
  });

  const updateAgencyMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Agency.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['agencies']);
      toast.success('Agency updated successfully');
      setEditingAgency(null);
    },
    onError: () => toast.error('Failed to update agency')
  });

  const filteredAgencies = agencies.filter(agency =>
    agency.agency_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agency.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agency.state?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getAgencyStats = (agencyId) => {
    const agencyAgents = agents.filter(a => a.agency_id === agencyId);
    return {
      agentCount: agencyAgents.length,
      activeAgents: agencyAgents.filter(a => a.status === 'active').length
    };
  };

  return (
    <RoleGuard requiredRole="super_admin" pageName="AgencyManagement">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                Agency Management
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Manage agencies and their hierarchies
              </p>
            </div>
            <Button
              onClick={() => setShowAddModal(true)}
              className="bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white shadow-xl"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Agency
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="clay-morphism border-0">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Total Agencies</p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
                      {agencies.length}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="clay-morphism border-0">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Active Agencies</p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
                      {agencies.filter(a => a.status === 'active').length}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="clay-morphism border-0">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Total Agents</p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
                      {agents.length}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="clay-morphism border-0">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Avg Agents/Agency</p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
                      {agencies.length > 0 ? Math.round(agents.length / agencies.length) : 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <Card className="clay-morphism border-0">
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  placeholder="Search agencies by name, city, or state..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Agencies Grid */}
          {isLoading ? (
            <Card className="clay-morphism border-0">
              <CardContent className="py-12 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-teal-600" />
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">Loading agencies...</p>
              </CardContent>
            </Card>
          ) : filteredAgencies.length === 0 ? (
            <Card className="clay-morphism border-0">
              <CardContent className="py-12 text-center">
                <Building2 className="w-12 h-12 mx-auto text-slate-400 mb-3" />
                <p className="text-slate-600 dark:text-slate-400">
                  {searchQuery ? 'No agencies found matching your search' : 'No agencies yet'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAgencies.map((agency, idx) => {
                const stats = getAgencyStats(agency.id);
                return (
                  <motion.div
                    key={agency.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card className="clay-morphism border-0 hover:shadow-xl transition-all">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shrink-0">
                              <Building2 className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-lg mb-1 truncate">
                                {agency.agency_name}
                              </CardTitle>
                              <Badge className={
                                agency.status === 'active' 
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                              }>
                                {agency.status || 'active'}
                              </Badge>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setEditingAgency(agency)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {agency.address && (
                          <div className="flex items-start gap-2 text-sm">
                            <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                            <span className="text-slate-700 dark:text-slate-300">
                              {agency.city && agency.state ? `${agency.city}, ${agency.state}` : agency.address}
                            </span>
                          </div>
                        )}
                        {agency.phone && (
                          <div className="flex items-start gap-2 text-sm">
                            <Phone className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                            <span className="text-slate-700 dark:text-slate-300">{agency.phone}</span>
                          </div>
                        )}
                        {agency.email && (
                          <div className="flex items-start gap-2 text-sm">
                            <Mail className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                            <span className="text-slate-700 dark:text-slate-300">{agency.email}</span>
                          </div>
                        )}
                        
                        <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <p className="text-xs text-slate-500 dark:text-slate-400">Total Agents</p>
                              <p className="text-lg font-bold text-slate-900 dark:text-white">{stats.agentCount}</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500 dark:text-slate-400">Active</p>
                              <p className="text-lg font-bold text-green-600">{stats.activeAgents}</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Add/Edit Modal */}
        <AgencyFormModal
          open={showAddModal || !!editingAgency}
          onClose={() => {
            setShowAddModal(false);
            setEditingAgency(null);
          }}
          agency={editingAgency}
          onSubmit={(data) => {
            if (editingAgency) {
              updateAgencyMutation.mutate({ id: editingAgency.id, data });
            } else {
              createAgencyMutation.mutate(data);
            }
          }}
          isLoading={createAgencyMutation.isPending || updateAgencyMutation.isPending}
        />
      </div>
    </RoleGuard>
  );
}

function AgencyFormModal({ open, onClose, agency, onSubmit, isLoading }) {
  const [formData, setFormData] = useState({
    agency_name: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    phone: '',
    email: '',
    website: '',
    notes: '',
    status: 'active'
  });

  React.useEffect(() => {
    if (agency) {
      setFormData({
        agency_name: agency.agency_name || '',
        address: agency.address || '',
        city: agency.city || '',
        state: agency.state || '',
        zip: agency.zip || '',
        phone: agency.phone || '',
        email: agency.email || '',
        website: agency.website || '',
        notes: agency.notes || '',
        status: agency.status || 'active'
      });
    } else {
      setFormData({
        agency_name: '',
        address: '',
        city: '',
        state: '',
        zip: '',
        phone: '',
        email: '',
        website: '',
        notes: '',
        status: 'active'
      });
    }
  }, [agency, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{agency ? 'Edit Agency' : 'Add New Agency'}</DialogTitle>
          <DialogDescription>
            {agency ? 'Update agency information' : 'Create a new agency in the system'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Agency Name *</Label>
            <Input
              value={formData.agency_name}
              onChange={(e) => setFormData({ ...formData, agency_name: e.target.value })}
              placeholder="Agency name"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="contact@agency.com"
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(555) 555-5555"
              />
            </div>
          </div>

          <div>
            <Label>Address</Label>
            <Input
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="123 Main St"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>City</Label>
              <Input
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="City"
              />
            </div>
            <div>
              <Label>State</Label>
              <Input
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                placeholder="State"
              />
            </div>
            <div>
              <Label>ZIP</Label>
              <Input
                value={formData.zip}
                onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                placeholder="12345"
              />
            </div>
          </div>

          <div>
            <Label>Website</Label>
            <Input
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              placeholder="https://www.agency.com"
            />
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes about this agency..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                agency ? 'Update Agency' : 'Create Agency'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}