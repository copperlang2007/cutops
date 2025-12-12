import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Users, Plus, Search, Filter, X, MapPin, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';
import AgentCard from '../components/agents/AgentCard';
import { US_STATES, CARRIERS, ONBOARDING_STATUSES } from '../components/shared/constants';
import RoleGuard from '../components/shared/RoleGuard';

export default function Agents() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stateFilter, setStateFilter] = useState('all');
  const [carrierFilter, setCarrierFilter] = useState('all');

  const { data: agents = [], isLoading } = useQuery({
    queryKey: ['agents'],
    queryFn: () => base44.entities.Agent.list('-created_date')
  });

  const { data: licenses = [] } = useQuery({
    queryKey: ['licenses'],
    queryFn: () => base44.entities.License.list()
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => base44.entities.CarrierAppointment.list()
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => base44.entities.Alert.list()
  });

  // Get unique states from agents and licenses
  const availableStates = useMemo(() => {
    const statesSet = new Set();
    agents.forEach(a => a.state && statesSet.add(a.state));
    licenses.forEach(l => l.state && statesSet.add(l.state));
    return Array.from(statesSet).sort();
  }, [agents, licenses]);

  // Get unique carriers from appointments
  const availableCarriers = useMemo(() => {
    const carriersSet = new Set();
    appointments.forEach(a => a.carrier_name && carriersSet.add(a.carrier_name));
    return Array.from(carriersSet).sort();
  }, [appointments]);

  // Get agent's licensed states
  const getAgentStates = (agentId) => {
    const agentLicenses = licenses.filter(l => l.agent_id === agentId);
    return [...new Set(agentLicenses.map(l => l.state))];
  };

  // Get agent's carriers
  const getAgentCarriers = (agentId) => {
    const agentAppointments = appointments.filter(a => a.agent_id === agentId);
    return [...new Set(agentAppointments.map(a => a.carrier_name))];
  };

  const filteredAgents = agents.filter(agent => {
    // Enhanced search - name, NPN, email
    const matchesSearch = searchTerm === '' || 
      `${agent.first_name} ${agent.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.npn?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || agent.onboarding_status === statusFilter;
    
    // State filter - check agent's state OR licensed states
    const agentStates = getAgentStates(agent.id);
    const matchesState = stateFilter === 'all' || 
      agent.state === stateFilter ||
      agentStates.includes(stateFilter);
    
    // Carrier filter - check agent's appointments
    const agentCarriers = getAgentCarriers(agent.id);
    const matchesCarrier = carrierFilter === 'all' || 
      agentCarriers.includes(carrierFilter);
    
    return matchesSearch && matchesStatus && matchesState && matchesCarrier;
  });

  const activeFiltersCount = [statusFilter, stateFilter, carrierFilter].filter(f => f !== 'all').length;

  const clearFilters = () => {
    setStatusFilter('all');
    setStateFilter('all');
    setCarrierFilter('all');
    setSearchTerm('');
  };

  const getLicenseCount = (agentId) => licenses.filter(l => l.agent_id === agentId).length;
  const getAppointmentCount = (agentId) => appointments.filter(a => a.agent_id === agentId).length;
  const getAlertCount = (agentId) => alerts.filter(a => a.agent_id === agentId && !a.is_resolved).length;

  return (
    <RoleGuard requiredRole="admin" pageName="Agents">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Agents</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">{agents.length} total agents</p>
            </div>
            <Link to={createPageUrl('AddAgent')}>
              <Button className="bg-teal-600 hover:bg-teal-700 shadow-lg hover:shadow-teal-500/30 transition-all duration-300">
                <Plus className="w-4 h-4 mr-2" />
                Add Agent
              </Button>
            </Link>
          </div>

          {/* Filters */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-4 mb-6 border border-slate-200 dark:border-slate-700 hover:shadow-lg hover:shadow-teal-500/10 transition-all duration-300">
            <div className="flex flex-col gap-4">
              {/* Search Row */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search by name, NPN, or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                {/* Status Filter */}
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <Filter className="w-4 h-4 mr-2 text-slate-400" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {ONBOARDING_STATUSES.map(status => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Additional Filters Row */}
              <div className="flex flex-col sm:flex-row gap-4">
                {/* State Filter */}
                <Select value={stateFilter} onValueChange={setStateFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <MapPin className="w-4 h-4 mr-2 text-slate-400" />
                    <SelectValue placeholder="State" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All States</SelectItem>
                    {availableStates.length > 0 ? (
                      availableStates.map(state => (
                        <SelectItem key={state} value={state}>{state}</SelectItem>
                      ))
                    ) : (
                      US_STATES.slice(0, 10).map(state => (
                        <SelectItem key={state} value={state}>{state}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                
                {/* Carrier Filter */}
                <Select value={carrierFilter} onValueChange={setCarrierFilter}>
                  <SelectTrigger className="w-full sm:w-56">
                    <Building2 className="w-4 h-4 mr-2 text-slate-400" />
                    <SelectValue placeholder="Carrier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Carriers</SelectItem>
                    {availableCarriers.length > 0 ? (
                      availableCarriers.map(carrier => (
                        <SelectItem key={carrier} value={carrier}>{carrier}</SelectItem>
                      ))
                    ) : (
                      CARRIERS.map(carrier => (
                        <SelectItem key={carrier} value={carrier}>{carrier}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                
                {/* Clear Filters */}
                {activeFiltersCount > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={clearFilters}
                    className="text-slate-500 hover:text-slate-700"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Clear filters ({activeFiltersCount})
                  </Button>
                )}
              </div>
              
              {/* Active Filters Display */}
              {(searchTerm || activeFiltersCount > 0) && (
                <div className="flex flex-wrap gap-2">
                  {searchTerm && (
                    <Badge variant="secondary" className="bg-teal-50 text-teal-700">
                      Search: "{searchTerm}"
                      <button onClick={() => setSearchTerm('')} className="ml-1 hover:text-teal-900">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  )}
                  {statusFilter !== 'all' && (
                    <Badge variant="secondary" className="bg-teal-50 text-teal-700">
                      Status: {ONBOARDING_STATUSES.find(s => s.value === statusFilter)?.label}
                      <button onClick={() => setStatusFilter('all')} className="ml-1 hover:text-teal-900">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  )}
                  {stateFilter !== 'all' && (
                    <Badge variant="secondary" className="bg-teal-50 text-teal-700">
                      State: {stateFilter}
                      <button onClick={() => setStateFilter('all')} className="ml-1 hover:text-teal-900">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  )}
                  {carrierFilter !== 'all' && (
                    <Badge variant="secondary" className="bg-teal-50 text-teal-700">
                      Carrier: {carrierFilter}
                      <button onClick={() => setCarrierFilter('all')} className="ml-1 hover:text-teal-900">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Agent Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="h-32 bg-white rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filteredAgents.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-xl p-12 text-center"
            >
              <Users className="w-16 h-16 mx-auto text-slate-300 mb-4" />
              {searchTerm || activeFiltersCount > 0 ? (
                <>
                  <p className="text-slate-600 font-medium text-lg">No agents found</p>
                  <p className="text-slate-400 mt-2">Try adjusting your search or filters</p>
                </>
              ) : (
                <>
                  <p className="text-slate-600 font-medium text-lg">No agents yet</p>
                  <p className="text-slate-400 mt-2">Add your first agent to get started</p>
                  <Link to={createPageUrl('AddAgent')}>
                    <Button className="mt-6 bg-teal-600 hover:bg-teal-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Agent
                    </Button>
                  </Link>
                </>
              )}
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAgents.map((agent, index) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  licenseCount={getLicenseCount(agent.id)}
                  appointmentCount={getAppointmentCount(agent.id)}
                  alertCount={getAlertCount(agent.id)}
                  appointments={appointments.filter(a => a.agent_id === agent.id)}
                  onClick={() => {
                    window.location.href = createPageUrl('AgentDetail') + `?id=${agent.id}`;
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </RoleGuard>
  );
}