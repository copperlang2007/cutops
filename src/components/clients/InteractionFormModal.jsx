import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';

export default function InteractionFormModal({ 
  open, 
  onClose, 
  client,
  agentId,
  onSubmit, 
  isLoading 
}) {
  const [formData, setFormData] = useState({
    interaction_type: 'call',
    direction: 'outbound',
    subject: '',
    notes: '',
    outcome: 'successful',
    duration_minutes: '',
    sentiment: 'neutral',
    follow_up_required: false,
    follow_up_date: '',
    follow_up_notes: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      client_id: client.id,
      agent_id: agentId,
      duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : null
    });
    setFormData({
      interaction_type: 'call',
      direction: 'outbound',
      subject: '',
      notes: '',
      outcome: 'successful',
      duration_minutes: '',
      sentiment: 'neutral',
      follow_up_required: false,
      follow_up_date: '',
      follow_up_notes: ''
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Log Interaction with {client?.first_name} {client?.last_name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Type</Label>
              <Select value={formData.interaction_type} onValueChange={(v) => setFormData({ ...formData, interaction_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="call">Phone Call</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="text">Text Message</SelectItem>
                  <SelectItem value="video_call">Video Call</SelectItem>
                  <SelectItem value="in_person">In Person</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Direction</Label>
              <Select value={formData.direction} onValueChange={(v) => setFormData({ ...formData, direction: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="outbound">Outbound</SelectItem>
                  <SelectItem value="inbound">Inbound</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Subject</Label>
            <Input
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="Brief description..."
            />
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Detailed notes about the interaction..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Outcome</Label>
              <Select value={formData.outcome} onValueChange={(v) => setFormData({ ...formData, outcome: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="successful">Successful</SelectItem>
                  <SelectItem value="no_answer">No Answer</SelectItem>
                  <SelectItem value="callback_requested">Callback Requested</SelectItem>
                  <SelectItem value="not_interested">Not Interested</SelectItem>
                  <SelectItem value="scheduled_appointment">Scheduled Appointment</SelectItem>
                  <SelectItem value="policy_sold">Policy Sold</SelectItem>
                  <SelectItem value="referral_received">Referral Received</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Sentiment</Label>
              <Select value={formData.sentiment} onValueChange={(v) => setFormData({ ...formData, sentiment: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="positive">Positive</SelectItem>
                  <SelectItem value="neutral">Neutral</SelectItem>
                  <SelectItem value="negative">Negative</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Duration (min)</Label>
              <Input
                type="number"
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <Label className="cursor-pointer">Follow-up Required</Label>
            <Switch
              checked={formData.follow_up_required}
              onCheckedChange={(v) => setFormData({ ...formData, follow_up_required: v })}
            />
          </div>

          {formData.follow_up_required && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Follow-up Date</Label>
                <Input
                  type="date"
                  value={formData.follow_up_date}
                  onChange={(e) => setFormData({ ...formData, follow_up_date: e.target.value })}
                />
              </div>
              <div>
                <Label>Follow-up Notes</Label>
                <Input
                  value={formData.follow_up_notes}
                  onChange={(e) => setFormData({ ...formData, follow_up_notes: e.target.value })}
                  placeholder="What to discuss..."
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isLoading} className="bg-teal-600 hover:bg-teal-700">
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Log Interaction
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}