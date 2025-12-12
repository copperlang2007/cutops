import { useState } from 'react'
import { base44 } from '@/api/base44Client'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar, Phone, Video, CheckCircle, MessageSquare } from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

export default function AppointmentBooking({ clientId, agentId, clientEmail, clientName }) {
  const [requestType, setRequestType] = useState('appointment');
  const [meetingType, setMeetingType] = useState('phone');
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [reason, setReason] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const { data: agent } = useQuery({
    queryKey: ['agent', agentId],
    queryFn: async () => {
      const agents = await base44.entities.Agent.filter({ id: agentId });
      return agents[0];
    },
    enabled: !!agentId
  });

  const bookingMutation = useMutation({
    mutationFn: async () => {
      // Create task for agent
      await base44.entities.Task.create({
        agent_id: agentId,
        title: requestType === 'appointment' 
          ? `Appointment Request: ${clientName}`
          : `Callback Request: ${clientName}`,
        description: `
Type: ${meetingType}
${requestType === 'appointment' ? `Preferred Date: ${preferredDate}` : ''}
${requestType === 'appointment' ? `Preferred Time: ${preferredTime}` : ''}
Reason: ${reason}

Client: ${clientName}
Email: ${clientEmail}
        `,
        priority: 'high',
        status: 'pending',
        due_date: preferredDate || new Date(Date.now() + 86400000).toISOString().split('T')[0],
        related_entity_type: 'client',
        related_entity_id: clientId
      });

      // Send email to agent
      if (agent?.email) {
        await base44.integrations.Core.SendEmail({
          to: agent.email,
          subject: `${requestType === 'appointment' ? 'Appointment' : 'Callback'} Request from ${clientName}`,
          body: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #0d9488;">${requestType === 'appointment' ? 'Appointment' : 'Callback'} Request</h2>
              <p><strong>Client:</strong> ${clientName}</p>
              <p><strong>Email:</strong> ${clientEmail}</p>
              ${requestType === 'appointment' ? `<p><strong>Preferred Date:</strong> ${preferredDate}</p>` : ''}
              ${requestType === 'appointment' ? `<p><strong>Preferred Time:</strong> ${preferredTime}</p>` : ''}
              <p><strong>Meeting Type:</strong> ${meetingType}</p>
              <p><strong>Reason:</strong></p>
              <p>${reason || 'Not specified'}</p>
            </div>
          `
        });
      }

      // Send confirmation to client
      await base44.integrations.Core.SendEmail({
        to: clientEmail,
        subject: `${requestType === 'appointment' ? 'Appointment' : 'Callback'} Request Received`,
        body: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #0d9488;">Request Received</h2>
            <p>Hi ${clientName},</p>
            <p>We've received your ${requestType === 'appointment' ? 'appointment' : 'callback'} request.</p>
            ${agent?.full_name ? `<p>Your agent, ${agent.full_name}, will contact you soon to confirm.</p>` : ''}
            ${requestType === 'appointment' ? `<p><strong>Your Preferred Date:</strong> ${preferredDate}</p>` : ''}
            ${requestType === 'appointment' ? `<p><strong>Your Preferred Time:</strong> ${preferredTime}</p>` : ''}
            <p>Thank you for your patience!</p>
          </div>
        `
      });
    },
    onSuccess: () => {
      setSubmitted(true);
      toast.success('Request submitted successfully');
    },
    onError: () => {
      toast.error('Failed to submit request');
    }
  });

  if (submitted) {
    return (
      <Card className="clay-morphism border-0">
        <CardContent className="py-12 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', duration: 0.6 }}
          >
            <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
          </motion.div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            Request Submitted!
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            Your agent will contact you soon to confirm your {requestType}.
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setSubmitted(false);
              setReason('');
              setPreferredDate('');
              setPreferredTime('');
            }}
          >
            Submit Another Request
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="clay-morphism border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-teal-600" />
          Schedule with Your Agent
        </CardTitle>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Request an appointment or callback
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Request Type</Label>
          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setRequestType('appointment')}
              className={requestType === 'appointment' 
                ? 'bg-teal-100 border-teal-500 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400' 
                : 'clay-subtle'}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Schedule Appointment
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setRequestType('callback')}
              className={requestType === 'callback' 
                ? 'bg-teal-100 border-teal-500 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400' 
                : 'clay-subtle'}
            >
              <Phone className="w-4 h-4 mr-2" />
              Request Callback
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Preferred Method</Label>
          <Select value={meetingType} onValueChange={setMeetingType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="phone">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Phone Call
                </div>
              </SelectItem>
              <SelectItem value="video">
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4" />
                  Video Call
                </div>
              </SelectItem>
              <SelectItem value="in_person">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  In Person
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {requestType === 'appointment' && (
          <>
            <div className="space-y-2">
              <Label>Preferred Date</Label>
              <Input
                type="date"
                value={preferredDate}
                onChange={(e) => setPreferredDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="space-y-2">
              <Label>Preferred Time</Label>
              <Select value={preferredTime} onValueChange={setPreferredTime}>
                <SelectTrigger>
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">Morning (9 AM - 12 PM)</SelectItem>
                  <SelectItem value="afternoon">Afternoon (12 PM - 4 PM)</SelectItem>
                  <SelectItem value="evening">Evening (4 PM - 6 PM)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        <div className="space-y-2">
          <Label>What would you like to discuss?</Label>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Brief description of what you'd like to discuss..."
            className="min-h-24"
          />
        </div>

        <Button
          onClick={() => bookingMutation.mutate()}
          disabled={bookingMutation.isPending || (requestType === 'appointment' && (!preferredDate || !preferredTime))}
          className="w-full bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700"
        >
          {bookingMutation.isPending ? (
            'Submitting...'
          ) : (
            `Submit ${requestType === 'appointment' ? 'Appointment' : 'Callback'} Request`
          )}
        </Button>

        {agent && (
          <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border dark:border-slate-700">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Your Agent</p>
            <p className="text-sm font-medium text-slate-900 dark:text-white">{agent.full_name}</p>
            {agent.phone && (
              <p className="text-xs text-slate-600 dark:text-slate-400">{agent.phone}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}