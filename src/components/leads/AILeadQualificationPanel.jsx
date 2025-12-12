import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Sparkles, TrendingUp, Target, User, DollarSign, Clock, 
  Award, MessageSquare, Loader2, CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function AILeadQualificationPanel() {
  const queryClient = useQueryClient();
  const [showAddLead, setShowAddLead] = useState(false);
  const [leadForm, setLeadForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    age: '',
    annual_income: '',
    current_coverage: '',
    interested_in: [],
    timeline: 'immediate',
    budget_range: '',
    source: 'website',
    notes: ''
  });

  const { data: leads = [] } = useQuery({
    queryKey: ['leads'],
    queryFn: () => base44.entities.Lead.list('-created_date')
  });

  const { data: agents = [] } = useQuery({
    queryKey: ['agents'],
    queryFn: () => base44.entities.Agent.list()
  });

  const qualifyLeadMutation = useMutation({
    mutationFn: (leadData) => base44.functions.invoke('aiLeadQualification', { leadData }),
    onSuccess: (response) => {
      queryClient.invalidateQueries(['leads']);
      toast.success('Lead qualified and assigned', {
        description: `Score: ${response.data.qualification.lead_score}/100`
      });
      setShowAddLead(false);
      setLeadForm({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        age: '',
        annual_income: '',
        current_coverage: '',
        interested_in: [],
        timeline: 'immediate',
        budget_range: '',
        source: 'website',
        notes: ''
      });
    },
    onError: (error) => {
      toast.error('Lead qualification failed', {
        description: error.message
      });
    }
  });

  const handleSubmit = () => {
    qualifyLeadMutation.mutate({
      ...leadForm,
      age: leadForm.age ? parseInt(leadForm.age) : undefined,
      annual_income: leadForm.annual_income ? parseFloat(leadForm.annual_income) : undefined
    });
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-50';
    if (score >= 60) return 'text-teal-600 bg-teal-50';
    if (score >= 40) return 'text-amber-600 bg-amber-50';
    return 'text-red-600 bg-red-50';
  };

  const getStatusColor = (status) => {
    const colors = {
      new: 'bg-blue-100 text-blue-700',
      qualified: 'bg-teal-100 text-teal-700',
      contacted: 'bg-purple-100 text-purple-700',
      nurturing: 'bg-amber-100 text-amber-700',
      converted: 'bg-emerald-100 text-emerald-700',
      lost: 'bg-slate-100 text-slate-600'
    };
    return colors[status] || colors.new;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="clay-morphism border-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">AI Lead Qualification</CardTitle>
                <p className="text-sm text-slate-500 mt-1">
                  Intelligent lead scoring and agent assignment
                </p>
              </div>
            </div>
            <Button
              onClick={() => setShowAddLead(true)}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Add & Qualify Lead
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Leads Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {leads.map(lead => {
          const assignedAgent = agents.find(a => a.id === lead.assigned_agent_id);
          return (
            <Card key={lead.id} className="clay-morphism border-0">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-slate-800">
                      {lead.first_name} {lead.last_name}
                    </h3>
                    <p className="text-xs text-slate-500">{lead.email}</p>
                  </div>
                  <Badge className={getStatusColor(lead.status)}>
                    {lead.status}
                  </Badge>
                </div>

                {/* Lead Score */}
                {lead.lead_score && (
                  <div className={`mb-4 p-3 rounded-lg ${getScoreColor(lead.lead_score)}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Lead Score</span>
                      <span className="text-2xl font-bold">{lead.lead_score}</span>
                    </div>
                    <div className="mt-2 h-2 bg-white/50 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-current rounded-full"
                        style={{ width: `${lead.lead_score}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Qualification Breakdown */}
                {lead.qualification_data && (
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="text-center p-2 bg-slate-50 rounded-lg">
                      <DollarSign className="w-4 h-4 mx-auto text-slate-400 mb-1" />
                      <p className="text-xs text-slate-500">Budget</p>
                      <p className="font-semibold text-sm">{lead.qualification_data.budget_score}/100</p>
                    </div>
                    <div className="text-center p-2 bg-slate-50 rounded-lg">
                      <Target className="w-4 h-4 mx-auto text-slate-400 mb-1" />
                      <p className="text-xs text-slate-500">Need</p>
                      <p className="font-semibold text-sm">{lead.qualification_data.need_score}/100</p>
                    </div>
                    <div className="text-center p-2 bg-slate-50 rounded-lg">
                      <Clock className="w-4 h-4 mx-auto text-slate-400 mb-1" />
                      <p className="text-xs text-slate-500">Timing</p>
                      <p className="font-semibold text-sm">{lead.qualification_data.timing_score}/100</p>
                    </div>
                    <div className="text-center p-2 bg-slate-50 rounded-lg">
                      <Award className="w-4 h-4 mx-auto text-slate-400 mb-1" />
                      <p className="text-xs text-slate-500">Fit</p>
                      <p className="font-semibold text-sm">{lead.qualification_data.fit_score}/100</p>
                    </div>
                  </div>
                )}

                {/* Assigned Agent */}
                {assignedAgent && (
                  <div className="p-3 bg-teal-50 rounded-lg mb-3">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="w-4 h-4 text-teal-600" />
                      <p className="text-xs font-medium text-teal-900">
                        Assigned to {assignedAgent.first_name} {assignedAgent.last_name}
                      </p>
                    </div>
                    {lead.suggested_agent_reasoning && (
                      <p className="text-xs text-teal-700">{lead.suggested_agent_reasoning}</p>
                    )}
                  </div>
                )}

                {/* Outreach Suggestions */}
                {lead.outreach_suggestions && lead.outreach_suggestions.length > 0 && (
                  <div className="border-t pt-3">
                    <p className="text-xs font-medium text-slate-600 mb-2 flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      Suggested Outreach
                    </p>
                    <div className="space-y-2">
                      {lead.outreach_suggestions.slice(0, 1).map((suggestion, idx) => (
                        <div key={idx} className="text-xs p-2 bg-purple-50 rounded">
                          <Badge variant="outline" className="mb-1">{suggestion.channel}</Badge>
                          <p className="text-slate-700 line-clamp-2">{suggestion.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <p className="text-xs text-slate-400 mt-3">
                  Added {format(new Date(lead.created_date), 'MMM d, yyyy')}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add Lead Modal */}
      <Dialog open={showAddLead} onOpenChange={setShowAddLead}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              Add & Qualify New Lead
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">First Name *</label>
                <Input
                  value={leadForm.first_name}
                  onChange={(e) => setLeadForm({...leadForm, first_name: e.target.value})}
                  placeholder="John"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Last Name *</label>
                <Input
                  value={leadForm.last_name}
                  onChange={(e) => setLeadForm({...leadForm, last_name: e.target.value})}
                  placeholder="Doe"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={leadForm.email}
                  onChange={(e) => setLeadForm({...leadForm, email: e.target.value})}
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Phone</label>
                <Input
                  value={leadForm.phone}
                  onChange={(e) => setLeadForm({...leadForm, phone: e.target.value})}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Age</label>
                <Input
                  type="number"
                  value={leadForm.age}
                  onChange={(e) => setLeadForm({...leadForm, age: e.target.value})}
                  placeholder="65"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Annual Income</label>
                <Input
                  type="number"
                  value={leadForm.annual_income}
                  onChange={(e) => setLeadForm({...leadForm, annual_income: e.target.value})}
                  placeholder="50000"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Current Coverage</label>
                <Input
                  value={leadForm.current_coverage}
                  onChange={(e) => setLeadForm({...leadForm, current_coverage: e.target.value})}
                  placeholder="Medicare Part A/B"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Timeline</label>
                <Select value={leadForm.timeline} onValueChange={(value) => setLeadForm({...leadForm, timeline: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">Immediate</SelectItem>
                    <SelectItem value="1-3_months">1-3 Months</SelectItem>
                    <SelectItem value="3-6_months">3-6 Months</SelectItem>
                    <SelectItem value="6+_months">6+ Months</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Budget Range</label>
                <Input
                  value={leadForm.budget_range}
                  onChange={(e) => setLeadForm({...leadForm, budget_range: e.target.value})}
                  placeholder="$200-$400/month"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Source</label>
                <Select value={leadForm.source} onValueChange={(value) => setLeadForm({...leadForm, source: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="website">Website</SelectItem>
                    <SelectItem value="referral">Referral</SelectItem>
                    <SelectItem value="cold_call">Cold Call</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                    <SelectItem value="social_media">Social Media</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Notes</label>
              <Textarea
                value={leadForm.notes}
                onChange={(e) => setLeadForm({...leadForm, notes: e.target.value})}
                placeholder="Additional information about the lead..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowAddLead(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={qualifyLeadMutation.isPending || !leadForm.first_name || !leadForm.last_name}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                {qualifyLeadMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Qualifying...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Qualify & Assign
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}