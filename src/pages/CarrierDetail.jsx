import { useState } from 'react'
import { base44 } from '@/api/base44Client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { createPageUrl } from '@/utils'
import { 
  ArrowLeft, Building2, Globe, Phone, Mail, ExternalLink, 
  Edit, Users, MapPin, GraduationCap, CheckCircle 
} from 'lucide-react';
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { motion } from 'framer-motion'
import CarrierForm from '../components/carriers/CarrierForm';
import AgentCard from '../components/agents/AgentCard';
import CarrierRelationshipInsights from '../components/carriers/CarrierRelationshipInsights';

export default function CarrierDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const carrierId = urlParams.get('id');
  const queryClient = useQueryClient();
  const [showEditModal, setShowEditModal] = useState(false);

  const { data: carrier, isLoading } = useQuery({
    queryKey: ['carrier', carrierId],
    queryFn: () => base44.entities.Carrier.filter({ id: carrierId }).then(res => res[0]),
    enabled: !!carrierId
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => base44.entities.CarrierAppointment.list()
  });

  const { data: agents = [] } = useQuery({
    queryKey: ['agents'],
    queryFn: () => base44.entities.Agent.list()
  });

  const { data: licenses = [] } = useQuery({
    queryKey: ['licenses'],
    queryFn: () => base44.entities.License.list()
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => base44.entities.Alert.list()
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Carrier.update(carrierId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['carrier', carrierId]);
      setShowEditModal(false);
    }
  });

  if (isLoading || !carrier) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
      </div>
    );
  }

  const carrierAppointments = appointments.filter(a => a.carrier_name === carrier.name);
  const appointedAgentIds = [...new Set(carrierAppointments.map(a => a.agent_id))];
  const appointedAgents = agents.filter(a => appointedAgentIds.includes(a.id));
  const rtsAgents = carrierAppointments.filter(a => a.rts_status === 'ready_to_sell').length;

  const initials = carrier.code?.substring(0, 2).toUpperCase();

  const getLicenseCount = (agentId) => licenses.filter(l => l.agent_id === agentId).length;
  const getAppointmentCount = (agentId) => appointments.filter(a => a.agent_id === agentId).length;
  const getAlertCount = (agentId) => alerts.filter(a => a.agent_id === agentId && !a.is_resolved).length;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link to={createPageUrl('Carriers')}>
            <Button variant="ghost" className="mb-4 text-slate-600 hover:text-slate-800">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Carriers
            </Button>
          </Link>
        </div>

        {/* Carrier Header Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-0 shadow-sm mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-start gap-6">
                <Avatar className="w-20 h-20 rounded-xl border-4 border-white shadow-md">
                  <AvatarImage src={carrier.logo_url} />
                  <AvatarFallback className="bg-gradient-to-br from-teal-500 to-teal-700 text-white text-2xl font-semibold rounded-xl">
                    {initials}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
                    <h1 className="text-2xl font-semibold text-slate-900">{carrier.name}</h1>
                    <Badge variant="outline" className="w-fit bg-slate-100 text-slate-600">
                      {carrier.code}
                    </Badge>
                    <Badge 
                      variant="outline" 
                      className={`w-fit ${carrier.status === 'active' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : 'bg-slate-100 text-slate-600'}`
                      }
                    >
                      {carrier.status || 'active'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    {carrier.phone && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <Phone className="w-4 h-4 text-slate-400" />
                        <span>{carrier.phone}</span>
                      </div>
                    )}
                    {carrier.email && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <Mail className="w-4 h-4 text-slate-400" />
                        <span className="truncate">{carrier.email}</span>
                      </div>
                    )}
                    {carrier.website && (
                      <a 
                        href={carrier.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-teal-600 hover:text-teal-700"
                      >
                        <Globe className="w-4 h-4" />
                        <span>Website</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {carrier.portal_url && (
                      <a 
                        href={carrier.portal_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-teal-600 hover:text-teal-700"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>Agent Portal</span>
                      </a>
                    )}
                  </div>
                </div>

                <Button variant="outline" onClick={() => setShowEditModal(true)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t">
                <div className="text-center p-3 bg-slate-50 rounded-xl">
                  <Users className="w-5 h-5 mx-auto text-teal-600 mb-1" />
                  <p className="text-2xl font-semibold text-slate-800">{appointedAgents.length}</p>
                  <p className="text-xs text-slate-500">Appointed Agents</p>
                </div>
                <div className="text-center p-3 bg-slate-50 rounded-xl">
                  <CheckCircle className="w-5 h-5 mx-auto text-emerald-600 mb-1" />
                  <p className="text-2xl font-semibold text-slate-800">{rtsAgents}</p>
                  <p className="text-xs text-slate-500">Ready to Sell</p>
                </div>
                <div className="text-center p-3 bg-slate-50 rounded-xl">
                  <MapPin className="w-5 h-5 mx-auto text-teal-600 mb-1" />
                  <p className="text-2xl font-semibold text-slate-800">{carrier.states_available?.length || 0}</p>
                  <p className="text-xs text-slate-500">States</p>
                </div>
                <div className="text-center p-3 bg-slate-50 rounded-xl">
                  <GraduationCap className="w-5 h-5 mx-auto text-teal-600 mb-1" />
                  <p className="text-2xl font-semibold text-slate-800">{carrier.certification_required ? 'Yes' : 'No'}</p>
                  <p className="text-xs text-slate-500">Cert Required</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* States */}
        {carrier.states_available?.length > 0 && (
          <Card className="border-0 shadow-sm mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Available States</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {carrier.states_available.sort().map(state => (
                  <Badge key={state} variant="outline" className="bg-teal-50 text-teal-700 border-teal-200">
                    {state}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* AI Relationship Insights */}
        <div className="mb-6">
          <CarrierRelationshipInsights 
            carrierId={carrierId}
            carrierName={carrier.name}
          />
        </div>

        {/* Appointed Agents */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Appointed Agents</CardTitle>
              <Badge variant="secondary" className="bg-slate-100">{appointedAgents.length}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {appointedAgents.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No agents appointed with this carrier yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {appointedAgents.map(agent => (
                  <AgentCard
                    key={agent.id}
                    agent={agent}
                    licenseCount={getLicenseCount(agent.id)}
                    appointmentCount={getAppointmentCount(agent.id)}
                    alertCount={getAlertCount(agent.id)}
                    onClick={() => {
                      window.location.href = createPageUrl('AgentDetail') + `?id=${agent.id}`;
                    }}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <CarrierForm
            carrier={carrier}
            onSubmit={(data) => updateMutation.mutate(data)}
            onCancel={() => setShowEditModal(false)}
            isLoading={updateMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}