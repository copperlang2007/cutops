import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, Phone, Mail, MessageSquare, Calendar, Filter, 
  Search, Plus, Clock, TrendingUp, AlertCircle, Sparkles, BarChart3
} from 'lucide-react';
import UpsellOpportunitiesPanel from './UpsellOpportunitiesPanel';
import ClientSegmentationPanel from './ClientSegmentationPanel';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { format, differenceInDays } from 'date-fns';

export default function EnhancedCRMModule({ agentId }) {
  const queryClient = useQueryClient();
  const [selectedClient, setSelectedClient] = useState(null);
  const [showInteractionModal, setShowInteractionModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [segmentFilter, setSegmentFilter] = useState('all');
  const [interactionForm, setInteractionForm] = useState({
    interaction_type: 'call',
    direction: 'outbound',
    subject: '',
    notes: '',
    outcome: 'completed',
    duration_minutes: 0
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients', agentId],
    queryFn: () => base44.entities.Client.filter({ agent_id: agentId })
  });

  const { data: interactions = [] } = useQuery({
    queryKey: ['interactions', agentId],
    queryFn: () => base44.entities.ClientInteraction.filter({ agent_id: agentId })
  });

  const { data: policies = [] } = useQuery({
    queryKey: ['policies', agentId],
    queryFn: () => base44.entities.Policy.filter({ agent_id: agentId })
  });

  const logInteractionMutation = useMutation({
    mutationFn: (data) => base44.entities.ClientInteraction.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['interactions']);
      queryClient.invalidateQueries(['clients']);
      toast.success('Interaction logged successfully');
      setShowInteractionModal(false);
      setInteractionForm({
        interaction_type: 'call',
        direction: 'outbound',
        subject: '',
        notes: '',
        outcome: 'completed',
        duration_minutes: 0
      });
    }
  });

  const updateClientMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Client.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['clients']);
    }
  });

  // Client Segmentation
  const segmentClients = () => {
    let filtered = clients;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(c => 
        `${c.first_name} ${c.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Segment filter
    switch (segmentFilter) {
      case 'high_value':
        filtered = filtered.filter(c => c.premium && c.premium > 500);
        break;
      case 'recent':
        filtered = filtered.filter(c => {
          const days = differenceInDays(new Date(), new Date(c.created_date));
          return days <= 30;
        });
        break;
      case 'inactive':
        filtered = filtered.filter(c => {
          if (!c.last_contact_date) return true;
          const days = differenceInDays(new Date(), new Date(c.last_contact_date));
          return days > 60;
        });
        break;
      case 'renewal_due':
        filtered = filtered.filter(c => {
          if (!c.renewal_date) return false;
          const days = differenceInDays(new Date(c.renewal_date), new Date());
          return days > 0 && days <= 60;
        });
        break;
      case 'at_risk':
        filtered = filtered.filter(c => 
          c.satisfaction_score && c.satisfaction_score < 6
        );
        break;
      default:
        break;
    }

    return filtered;
  };

  const segmentedClients = segmentClients();

  const getClientInteractions = (clientId) => {
    return interactions.filter(i => i.client_id === clientId)
      .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  };

  const getClientPolicies = (clientId) => {
    return policies.filter(p => p.client_id === clientId);
  };

  const handleLogInteraction = () => {
    if (!selectedClient) return;

    logInteractionMutation.mutate({
      ...interactionForm,
      client_id: selectedClient.id,
      agent_id: agentId
    });

    // Update last contact date
    updateClientMutation.mutate({
      id: selectedClient.id,
      data: { last_contact_date: new Date().toISOString() }
    });
  };

  const getSegmentColor = (segment) => {
    const colors = {
      high_value: 'bg-purple-100 text-purple-700',
      recent: 'bg-teal-100 text-teal-700',
      inactive: 'bg-red-100 text-red-700',
      renewal_due: 'bg-amber-100 text-amber-700',
      at_risk: 'bg-orange-100 text-orange-700'
    };
    return colors[segment] || 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="space-y-6">
      {/* Segmentation Section */}
      <ClientSegmentationPanel agentId={agentId} />

      {/* Upsell Opportunities Section */}
      <UpsellOpportunitiesPanel agentId={agentId} />

      {/* Header & Filters */}
      <Card className="clay-morphism border-0">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Users className="w-6 h-6 text-teal-600" />
                Client Relationship Management
              </CardTitle>
              <p className="text-sm text-slate-500 mt-1">
                Manage all client interactions and relationships
              </p>
            </div>
            <Button
              onClick={() => {
                setSelectedClient(null);
                setShowInteractionModal(true);
              }}
              className="bg-teal-600 hover:bg-teal-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Log Interaction
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search clients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={segmentFilter} onValueChange={setSegmentFilter}>
              <SelectTrigger className="w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clients</SelectItem>
                <SelectItem value="high_value">High Value ($500+)</SelectItem>
                <SelectItem value="recent">Recent (30 days)</SelectItem>
                <SelectItem value="inactive">Inactive (60+ days)</SelectItem>
                <SelectItem value="renewal_due">Renewal Due</SelectItem>
                <SelectItem value="at_risk">At Risk</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Client List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {segmentedClients.map(client => {
          const clientInteractions = getClientInteractions(client.id);
          const lastInteraction = clientInteractions[0];
          const daysSinceContact = client.last_contact_date 
            ? differenceInDays(new Date(), new Date(client.last_contact_date))
            : null;

          return (
            <Card 
              key={client.id} 
              className="clay-subtle border-0 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setSelectedClient(client)}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-slate-800">
                      {client.first_name} {client.last_name}
                    </h3>
                    <p className="text-xs text-slate-500">{client.email}</p>
                  </div>
                  <Badge className={client.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}>
                    {client.status}
                  </Badge>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3 h-3 text-slate-400" />
                    <span className="text-slate-600">{client.phone || 'No phone'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span className="text-slate-600">
                      Last contact: {daysSinceContact !== null ? `${daysSinceContact} days ago` : 'Never'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-3 h-3 text-slate-400" />
                    <span className="text-slate-600">{clientInteractions.length} interactions</span>
                  </div>
                </div>

                {client.premium && (
                  <div className="mt-3 p-2 bg-purple-50 rounded-lg">
                    <p className="text-xs text-purple-600 font-medium">Premium: ${client.premium}/mo</p>
                  </div>
                )}

                {daysSinceContact && daysSinceContact > 60 && (
                  <Badge className="mt-3 bg-red-100 text-red-700">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Needs Follow-up
                  </Badge>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Client Detail Modal */}
      {selectedClient && (
        <Dialog open={!!selectedClient} onOpenChange={() => setSelectedClient(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">
                {selectedClient.first_name} {selectedClient.last_name}
              </DialogTitle>
            </DialogHeader>

            <Tabs defaultValue="interactions" className="mt-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="interactions">Interactions</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="policies">Policies</TabsTrigger>
              </TabsList>

              <TabsContent value="interactions" className="space-y-3 mt-4">
                <Button
                  onClick={() => setShowInteractionModal(true)}
                  className="w-full bg-teal-600 hover:bg-teal-700"
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Log New Interaction
                </Button>

                {getClientInteractions(selectedClient.id).map(interaction => (
                  <Card key={interaction.id} className="border">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {interaction.interaction_type === 'call' && <Phone className="w-4 h-4 text-teal-600" />}
                          {interaction.interaction_type === 'email' && <Mail className="w-4 h-4 text-blue-600" />}
                          {interaction.interaction_type === 'meeting' && <Calendar className="w-4 h-4 text-purple-600" />}
                          <Badge variant="outline">{interaction.direction}</Badge>
                        </div>
                        <span className="text-xs text-slate-400">
                          {format(new Date(interaction.created_date), 'MMM d, yyyy h:mm a')}
                        </span>
                      </div>
                      <h4 className="font-medium text-sm mb-1">{interaction.subject}</h4>
                      <p className="text-xs text-slate-600">{interaction.notes}</p>
                      {interaction.outcome && (
                        <Badge className="mt-2" variant="outline">
                          Outcome: {interaction.outcome}
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="details" className="mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500">Email</p>
                    <p className="font-medium">{selectedClient.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Phone</p>
                    <p className="font-medium">{selectedClient.phone}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Status</p>
                    <Badge>{selectedClient.status}</Badge>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Premium</p>
                    <p className="font-medium">${selectedClient.premium || 0}/mo</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Plan Type</p>
                    <p className="font-medium">{selectedClient.plan_type}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Satisfaction</p>
                    <p className="font-medium">{selectedClient.satisfaction_score || 'N/A'}/10</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="policies" className="mt-4">
                {getClientPolicies(selectedClient.id).map(policy => (
                  <Card key={policy.id} className="mb-3 border">
                    <CardContent className="pt-4">
                      <h4 className="font-medium mb-2">{policy.policy_name}</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-xs text-slate-500">Carrier</p>
                          <p>{policy.carrier}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Premium</p>
                          <p>${policy.premium}/mo</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}

      {/* Log Interaction Modal */}
      <Dialog open={showInteractionModal} onOpenChange={setShowInteractionModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Client Interaction</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Type</label>
                <Select 
                  value={interactionForm.interaction_type} 
                  onValueChange={(value) => setInteractionForm({...interactionForm, interaction_type: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="call">Call</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="message">Message</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Direction</label>
                <Select 
                  value={interactionForm.direction} 
                  onValueChange={(value) => setInteractionForm({...interactionForm, direction: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inbound">Inbound</SelectItem>
                    <SelectItem value="outbound">Outbound</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Subject</label>
              <Input
                value={interactionForm.subject}
                onChange={(e) => setInteractionForm({...interactionForm, subject: e.target.value})}
                placeholder="Brief subject..."
              />
            </div>

            <div>
              <label className="text-sm font-medium">Notes</label>
              <Textarea
                value={interactionForm.notes}
                onChange={(e) => setInteractionForm({...interactionForm, notes: e.target.value})}
                placeholder="Detailed notes..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Duration (minutes)</label>
                <Input
                  type="number"
                  value={interactionForm.duration_minutes}
                  onChange={(e) => setInteractionForm({...interactionForm, duration_minutes: parseInt(e.target.value) || 0})}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Outcome</label>
                <Select 
                  value={interactionForm.outcome} 
                  onValueChange={(value) => setInteractionForm({...interactionForm, outcome: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="follow_up_needed">Follow-up Needed</SelectItem>
                    <SelectItem value="no_answer">No Answer</SelectItem>
                    <SelectItem value="voicemail">Voicemail</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowInteractionModal(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleLogInteraction}
                disabled={logInteractionMutation.isPending}
                className="bg-teal-600 hover:bg-teal-700"
              >
                Log Interaction
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}