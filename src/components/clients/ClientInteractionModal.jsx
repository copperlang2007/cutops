import { useState } from 'react'
import { base44 } from '@/api/base44Client'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function ClientInteractionModal({ clientId, interaction, open, onClose }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState(interaction || {
    interaction_type: 'call',
    direction: 'outbound',
    subject: '',
    notes: '',
    outcome: '',
    duration_minutes: 0,
    interaction_date: new Date().toISOString().slice(0, 16),
    follow_up_required: false,
    follow_up_date: '',
    sentiment: 'neutral',
    tags: []
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: agents = [] } = useQuery({
    queryKey: ['agents'],
    queryFn: () => base44.entities.Agent.list()
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      // Get agent_id from current user
      const userAgent = agents.find(a => a.email === user?.email);
      
      const interactionData = {
        ...data,
        client_id: clientId,
        agent_id: userAgent?.id || agents[0]?.id,
        interaction_date: new Date(data.interaction_date).toISOString()
      };

      if (interaction?.id) {
        return await base44.entities.ClientInteraction.update(interaction.id, interactionData);
      } else {
        return await base44.entities.ClientInteraction.create(interactionData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['clientInteractions']);
      toast.success(interaction ? 'Interaction updated' : 'Interaction logged');
      onClose();
    },
    onError: () => {
      toast.error('Failed to save interaction');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.subject) {
      toast.error('Please enter a subject');
      return;
    }
    saveMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto dark:bg-slate-800">
        <DialogHeader>
          <DialogTitle>{interaction ? 'Edit Interaction' : 'Log Client Interaction'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Type *</Label>
              <Select value={formData.interaction_type} onValueChange={(v) => setFormData({...formData, interaction_type: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="call">Phone Call</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="text_message">Text Message</SelectItem>
                  <SelectItem value="video_call">Video Call</SelectItem>
                  <SelectItem value="note">Note</SelectItem>
                  <SelectItem value="follow_up">Follow-up</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Direction</Label>
              <Select value={formData.direction} onValueChange={(v) => setFormData({...formData, direction: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="inbound">Inbound</SelectItem>
                  <SelectItem value="outbound">Outbound</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Subject *</Label>
            <Input
              value={formData.subject}
              onChange={(e) => setFormData({...formData, subject: e.target.value})}
              placeholder="Brief description of the interaction"
            />
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder="Detailed notes about the interaction..."
              rows={4}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Outcome</Label>
              <Select value={formData.outcome} onValueChange={(v) => setFormData({...formData, outcome: v})}>
                <SelectTrigger><SelectValue placeholder="Select outcome" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="successful">Successful</SelectItem>
                  <SelectItem value="no_answer">No Answer</SelectItem>
                  <SelectItem value="voicemail">Voicemail</SelectItem>
                  <SelectItem value="callback_requested">Callback Requested</SelectItem>
                  <SelectItem value="issue_resolved">Issue Resolved</SelectItem>
                  <SelectItem value="follow_up_needed">Follow-up Needed</SelectItem>
                  <SelectItem value="meeting_scheduled">Meeting Scheduled</SelectItem>
                  <SelectItem value="sale_closed">Sale Closed</SelectItem>
                  <SelectItem value="not_interested">Not Interested</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Duration (minutes)</Label>
              <Input
                type="number"
                value={formData.duration_minutes}
                onChange={(e) => setFormData({...formData, duration_minutes: parseInt(e.target.value) || 0})}
              />
            </div>
            <div>
              <Label>Sentiment</Label>
              <Select value={formData.sentiment} onValueChange={(v) => setFormData({...formData, sentiment: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="positive">Positive</SelectItem>
                  <SelectItem value="neutral">Neutral</SelectItem>
                  <SelectItem value="negative">Negative</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Interaction Date/Time</Label>
              <Input
                type="datetime-local"
                value={formData.interaction_date}
                onChange={(e) => setFormData({...formData, interaction_date: e.target.value})}
              />
            </div>
            <div>
              <Label>Follow-up Date (if needed)</Label>
              <Input
                type="date"
                value={formData.follow_up_date}
                onChange={(e) => setFormData({...formData, follow_up_date: e.target.value, follow_up_required: !!e.target.value})}
              />
            </div>
          </div>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saveMutation.isPending}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={saveMutation.isPending}
            className="bg-teal-600 hover:bg-teal-700"
          >
            {saveMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Interaction'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}