import { useState } from 'react'
import { base44 } from '@/api/base44Client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  UserX, Mail, Phone, Database, FileText, Key, Shield, 
  CheckCircle, AlertTriangle, Users, DollarSign, MessageSquare,
  Clock, Calendar, Server, Laptop, Wifi
} from 'lucide-react';
import { toast } from 'sonner'
import { format } from 'date-fns'
import OffboardingAuditPanel from './OffboardingAuditPanel';

const SYSTEM_CONFIGS = [
  { key: 'email', label: 'Email Access', icon: Mail, color: 'text-blue-600' },
  { key: 'quote_enroll', label: 'Quote & Enroll Platform', icon: FileText, color: 'text-purple-600' },
  { key: 'ops_platform', label: 'Operations Platform', icon: Database, color: 'text-emerald-600' },
  { key: 'crm', label: 'CRM System', icon: Users, color: 'text-orange-600' },
  { key: 'phone_system', label: 'Phone System', icon: Phone, color: 'text-indigo-600' },
  { key: 'carrier_portals', label: 'Carrier Portals', icon: Shield, color: 'text-red-600' },
  { key: 'vpn', label: 'VPN Access', icon: Wifi, color: 'text-teal-600' },
  { key: 'file_storage', label: 'File Storage', icon: Server, color: 'text-amber-600' }
];

export default function OffboardingWorkflow({ agent, open, onClose }) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState('initiate');
  const [formData, setFormData] = useState({
    reason: '',
    reason_notes: '',
    target_termination_date: '',
    client_reassignment_required: false,
    reassigned_to_agent_id: ''
  });

  const { data: offboarding } = useQuery({
    queryKey: ['offboarding', agent?.id],
    queryFn: async () => {
      const records = await base44.entities.AgentOffboarding.filter({ agent_id: agent.id });
      return records.find(r => r.status !== 'cancelled') || null;
    },
    enabled: !!agent?.id && open
  });

  const { data: agents = [] } = useQuery({
    queryKey: ['agents'],
    queryFn: () => base44.entities.Agent.list()
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients', agent?.id],
    queryFn: () => base44.entities.Client.filter({ agent_id: agent.id }),
    enabled: !!agent?.id
  });

  const initiateOffboardingMutation = useMutation({
    mutationFn: async (data) => {
      const user = await base44.auth.me();
      return base44.entities.AgentOffboarding.create({
        agent_id: agent.id,
        agent_name: `${agent.first_name} ${agent.last_name}`,
        initiated_by: user.email,
        initiated_date: new Date().toISOString(),
        status: 'initiated',
        reason: data.reason,
        reason_notes: data.reason_notes,
        target_termination_date: data.target_termination_date,
        system_access: {},
        client_reassignment: {
          required: data.client_reassignment_required,
          reassigned_to_agent_id: data.reassigned_to_agent_id,
          clients_count: clients.length,
          reassignment_completed: false
        },
        completion_percentage: 0
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['offboarding', agent.id]);
      toast.success('Offboarding initiated');
      setStep('progress');
    }
  });

  const updateSystemAccessMutation = useMutation({
    mutationFn: async ({ systemKey, notes }) => {
      const user = await base44.auth.me();
      
      // Call backend function to actually deactivate system access
      toast.loading('Deactivating system access...', { id: 'deactivating' });
      
      const deactivationResult = await base44.functions.invoke('deactivateSystemAccess', {
        systemKey,
        agentId: agent.id,
        agentEmail: agent.email,
        notes
      });

      toast.dismiss('deactivating');

      if (!deactivationResult.data.success) {
        throw new Error(deactivationResult.data.message || 'Deactivation failed');
      }

      // Update offboarding record with deactivation details
      const updatedSystemAccess = {
        ...offboarding.system_access,
        [systemKey]: {
          deactivated: true,
          deactivated_date: new Date().toISOString(),
          deactivated_by: user.email,
          notes,
          api_response: deactivationResult.data.log
        }
      };
      
      const totalSystems = SYSTEM_CONFIGS.length;
      const completedSystems = Object.values(updatedSystemAccess).filter(s => s?.deactivated).length;
      const newPercentage = Math.round((completedSystems / totalSystems) * 100);

      return base44.entities.AgentOffboarding.update(offboarding.id, {
        system_access: updatedSystemAccess,
        completion_percentage: newPercentage,
        status: newPercentage === 100 ? 'completed' : 'in_progress'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['offboarding', agent.id]);
      toast.success('System access deactivated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to deactivate: ${error.message}`);
    }
  });

  const completeOffboardingMutation = useMutation({
    mutationFn: async (notes) => {
      const user = await base44.auth.me();
      return base44.entities.AgentOffboarding.update(offboarding.id, {
        status: 'completed',
        completed_by: user.email,
        completed_date: new Date().toISOString(),
        admin_notes: notes
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['offboarding', agent.id]);
      toast.success('Offboarding completed');
      onClose();
    }
  });

  const handleInitiate = () => {
    if (!formData.reason || !formData.target_termination_date) {
      toast.error('Please fill in required fields');
      return;
    }
    initiateOffboardingMutation.mutate(formData);
  };

  if (!agent) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <UserX className="w-6 h-6 text-red-600" />
            Agent Offboarding - {agent.first_name} {agent.last_name}
          </DialogTitle>
          <DialogDescription>
            Manage the complete offboarding process including system access termination
          </DialogDescription>
        </DialogHeader>

        {!offboarding && step === 'initiate' && (
          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <div>
                <Label>Reason for Departure *</Label>
                <Select value={formData.reason} onValueChange={(value) => setFormData({ ...formData, reason: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="resignation">Resignation</SelectItem>
                    <SelectItem value="termination">Termination</SelectItem>
                    <SelectItem value="retirement">Retirement</SelectItem>
                    <SelectItem value="contract_end">Contract End</SelectItem>
                    <SelectItem value="performance">Performance Issues</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Additional Details</Label>
                <Textarea
                  value={formData.reason_notes}
                  onChange={(e) => setFormData({ ...formData, reason_notes: e.target.value })}
                  placeholder="Provide additional context..."
                  rows={3}
                />
              </div>

              <div>
                <Label>Target Termination Date *</Label>
                <Input
                  type="date"
                  value={formData.target_termination_date}
                  onChange={(e) => setFormData({ ...formData, target_termination_date: e.target.value })}
                />
              </div>

              {clients.length > 0 && (
                <div className="space-y-3 p-4 border rounded-lg bg-amber-50 dark:bg-amber-900/20">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                    <span className="font-medium text-amber-900 dark:text-amber-100">
                      Client Reassignment Required
                    </span>
                  </div>
                  <p className="text-sm text-amber-700 dark:text-amber-200">
                    This agent has {clients.length} active clients that need to be reassigned
                  </p>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={formData.client_reassignment_required}
                      onCheckedChange={(checked) => setFormData({ ...formData, client_reassignment_required: checked })}
                    />
                    <Label>I will reassign clients to another agent</Label>
                  </div>
                  {formData.client_reassignment_required && (
                    <div>
                      <Label>Reassign Clients To</Label>
                      <Select
                        value={formData.reassigned_to_agent_id}
                        onValueChange={(value) => setFormData({ ...formData, reassigned_to_agent_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select agent" />
                        </SelectTrigger>
                        <SelectContent>
                          {agents.filter(a => a.id !== agent.id && a.onboarding_status === 'active').map((a) => (
                            <SelectItem key={a.id} value={a.id}>
                              {a.first_name} {a.last_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button 
                onClick={handleInitiate}
                className="bg-red-600 hover:bg-red-700"
                disabled={initiateOffboardingMutation.isPending}
              >
                Initiate Offboarding
              </Button>
            </div>
          </div>
        )}

        {offboarding && (
          <Tabs defaultValue="systems" className="space-y-4">
            <TabsList>
              <TabsTrigger value="systems">System Access</TabsTrigger>
              <TabsTrigger value="audit">
                <Shield className="w-4 h-4 mr-2" />
                Audit
              </TabsTrigger>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="clients">Clients</TabsTrigger>
              <TabsTrigger value="equipment">Equipment</TabsTrigger>
            </TabsList>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Overall Progress</span>
                <span className="text-sm font-medium">{offboarding.completion_percentage}%</span>
              </div>
              <Progress value={offboarding.completion_percentage} className="h-2" />
            </div>

            <TabsContent value="systems" className="space-y-4">
              <div className="grid gap-3">
                {SYSTEM_CONFIGS.map((system) => {
                  const systemData = offboarding.system_access?.[system.key];
                  const isDeactivated = systemData?.deactivated;
                  const Icon = system.icon;

                  return (
                    <Card key={system.key} className={isDeactivated ? 'bg-green-50 dark:bg-green-900/20' : ''}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 flex-1">
                            <Icon className={`w-5 h-5 ${system.color} mt-0.5`} />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold">{system.label}</h4>
                                {isDeactivated && (
                                  <Badge className="bg-green-100 text-green-700 border-green-200">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Deactivated
                                  </Badge>
                                )}
                              </div>
                              {isDeactivated && (
                                <div className="text-xs text-slate-600 dark:text-slate-400 space-y-0.5">
                                  <p>Deactivated by {systemData.deactivated_by}</p>
                                  <p>{format(new Date(systemData.deactivated_date), 'MMM d, yyyy h:mm a')}</p>
                                  {systemData.notes && <p className="italic">{systemData.notes}</p>}
                                  {systemData.api_response && (
                                    <details className="mt-2">
                                      <summary className="cursor-pointer text-blue-600 hover:text-blue-700">
                                        View API Response
                                      </summary>
                                      <pre className="mt-1 p-2 bg-slate-100 dark:bg-slate-800 rounded text-xs overflow-x-auto">
                                        {JSON.stringify(systemData.api_response, null, 2)}
                                      </pre>
                                    </details>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          {!isDeactivated && (
                            <Button
                              size="sm"
                              onClick={() => {
                                const notes = prompt('Add notes (optional):');
                                updateSystemAccessMutation.mutate({ systemKey: system.key, notes: notes || '' });
                              }}
                              disabled={updateSystemAccessMutation.isPending}
                            >
                              Mark Deactivated
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="audit">
              <OffboardingAuditPanel 
                offboardingId={offboarding.id}
                agentId={agent.id}
              />
            </TabsContent>

            <TabsContent value="overview">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Offboarding Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <Label className="text-slate-500">Status</Label>
                        <Badge className={
                          offboarding.status === 'completed' ? 'bg-green-100 text-green-700' :
                          offboarding.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                          'bg-slate-100 text-slate-700'
                        }>
                          {offboarding.status}
                        </Badge>
                      </div>
                      <div>
                        <Label className="text-slate-500">Reason</Label>
                        <p className="font-medium capitalize">{offboarding.reason.replace('_', ' ')}</p>
                      </div>
                      <div>
                        <Label className="text-slate-500">Initiated By</Label>
                        <p className="font-medium">{offboarding.initiated_by}</p>
                      </div>
                      <div>
                        <Label className="text-slate-500">Target Date</Label>
                        <p className="font-medium">{format(new Date(offboarding.target_termination_date), 'MMM d, yyyy')}</p>
                      </div>
                    </div>
                    {offboarding.reason_notes && (
                      <div>
                        <Label className="text-slate-500">Notes</Label>
                        <p className="text-sm">{offboarding.reason_notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="clients">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Client Reassignment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {offboarding.client_reassignment?.required ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <div>
                          <p className="font-medium">{offboarding.client_reassignment.clients_count} clients</p>
                          <p className="text-sm text-slate-600">Need reassignment</p>
                        </div>
                        {offboarding.client_reassignment.reassignment_completed ? (
                          <Badge className="bg-green-100 text-green-700">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Completed
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-700">
                            Pending
                          </Badge>
                        )}
                      </div>
                      {offboarding.client_reassignment.reassigned_to_agent_name && (
                        <p className="text-sm">
                          Reassigned to: <span className="font-medium">{offboarding.client_reassignment.reassigned_to_agent_name}</span>
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-600">No client reassignment required</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="equipment">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Laptop className="w-5 h-5" />
                    Equipment Return
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600">Track equipment return in the admin panel</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {offboarding && offboarding.status !== 'completed' && (
          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button variant="outline" onClick={onClose}>Close</Button>
            {offboarding.completion_percentage === 100 && (
              <Button
                onClick={() => {
                  const notes = prompt('Final notes (optional):');
                  completeOffboardingMutation.mutate(notes || '');
                }}
                className="bg-green-600 hover:bg-green-700"
                disabled={completeOffboardingMutation.isPending}
              >
                Complete Offboarding
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}