import { useState } from 'react'
import { base44 } from '@/api/base44Client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Calendar } from '@/components/ui/calendar'
import { 
  CalendarDays, Clock, Video, Phone, MapPin, Plus,
  CheckCircle, XCircle, AlertCircle, Loader2, User
} from 'lucide-react';
import { format, addDays, isBefore, isAfter, startOfDay } from 'date-fns'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

const appointmentTypes = [
  { value: 'initial_consultation', label: 'Initial Consultation', duration: 30, icon: User },
  { value: 'plan_review', label: 'Plan Review', duration: 30, icon: CalendarDays },
  { value: 'enrollment', label: 'Enrollment Help', duration: 45, icon: CheckCircle },
  { value: 'claims_help', label: 'Claims Assistance', duration: 30, icon: AlertCircle },
  { value: 'benefits_question', label: 'Benefits Question', duration: 20, icon: Phone },
  { value: 'annual_review', label: 'Annual Review', duration: 45, icon: CalendarDays },
];

const timeSlots = [
  '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM'
];

const statusConfig = {
  scheduled: { label: 'Scheduled', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' },
  confirmed: { label: 'Confirmed', color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' },
  completed: { label: 'Completed', color: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' },
  rescheduled: { label: 'Rescheduled', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' },
};

export default function AppointmentScheduler({ client, portalUser, agent }) {
  const queryClient = useQueryClient();
  const [showBooking, setShowBooking] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [meetingType, setMeetingType] = useState('phone');
  const [notes, setNotes] = useState('');
  const [editingAppointment, setEditingAppointment] = useState(null);

  const userId = client?.id || portalUser?.id;
  const userIdField = client?.id ? 'client_id' : 'portal_user_id';

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['appointments', userId],
    queryFn: () => base44.entities.Appointment.filter({ [userIdField]: userId }, '-scheduled_date'),
    enabled: !!userId
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Appointment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['appointments', userId]);
      toast.success('Appointment scheduled successfully!');
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Appointment.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['appointments', userId]);
      toast.success('Appointment updated!');
      resetForm();
    }
  });

  const cancelMutation = useMutation({
    mutationFn: (id) => base44.entities.Appointment.update(id, { status: 'cancelled' }),
    onSuccess: () => {
      queryClient.invalidateQueries(['appointments', userId]);
      toast.success('Appointment cancelled');
    }
  });

  const resetForm = () => {
    setShowBooking(false);
    setSelectedDate(null);
    setSelectedTime('');
    setSelectedType('');
    setMeetingType('phone');
    setNotes('');
    setEditingAppointment(null);
  };

  const handleSubmit = () => {
    if (!selectedDate || !selectedTime || !selectedType) {
      toast.error('Please fill in all required fields');
      return;
    }

    const typeInfo = appointmentTypes.find(t => t.value === selectedType);
    const data = {
      [userIdField]: userId,
      agent_id: agent?.id || client?.agent_id,
      title: typeInfo?.label || 'Appointment',
      appointment_type: selectedType,
      scheduled_date: format(selectedDate, 'yyyy-MM-dd'),
      scheduled_time: selectedTime,
      duration_minutes: typeInfo?.duration || 30,
      meeting_type: meetingType,
      notes,
      status: 'scheduled'
    };

    if (editingAppointment) {
      updateMutation.mutate({ id: editingAppointment.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const upcomingAppointments = appointments.filter(a => 
    ['scheduled', 'confirmed'].includes(a.status) && 
    isAfter(new Date(a.scheduled_date), startOfDay(new Date()))
  );

  const pastAppointments = appointments.filter(a => 
    a.status === 'completed' || isBefore(new Date(a.scheduled_date), startOfDay(new Date()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-0 shadow-sm dark:bg-slate-800">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-slate-800 dark:text-white">Appointments</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Schedule time with your agent
              </p>
            </div>
            <Button onClick={() => setShowBooking(true)} className="bg-teal-600 hover:bg-teal-700">
              <Plus className="w-4 h-4 mr-2" />
              Book Appointment
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Appointments */}
      <Card className="border-0 shadow-sm dark:bg-slate-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-teal-600" />
            Upcoming Appointments
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingAppointments.length === 0 ? (
            <div className="text-center py-8">
              <CalendarDays className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
              <p className="text-slate-500 dark:text-slate-400 mb-3">No upcoming appointments</p>
              <Button variant="outline" onClick={() => setShowBooking(true)}>
                Schedule Now
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingAppointments.map((apt, idx) => {
                const status = statusConfig[apt.status] || statusConfig.scheduled;
                return (
                  <motion.div
                    key={apt.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="p-4 rounded-xl border dark:border-slate-700 hover:border-teal-300 dark:hover:border-teal-600 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-lg bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center">
                          {apt.meeting_type === 'video' && <Video className="w-5 h-5 text-teal-600" />}
                          {apt.meeting_type === 'phone' && <Phone className="w-5 h-5 text-teal-600" />}
                          {apt.meeting_type === 'in_person' && <MapPin className="w-5 h-5 text-teal-600" />}
                        </div>
                        <div>
                          <h4 className="font-medium text-slate-800 dark:text-white">{apt.title}</h4>
                          <div className="flex items-center gap-2 mt-1 text-sm text-slate-500 dark:text-slate-400">
                            <CalendarDays className="w-4 h-4" />
                            {format(new Date(apt.scheduled_date), 'EEEE, MMMM d, yyyy')}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                            <Clock className="w-4 h-4" />
                            {apt.scheduled_time} ({apt.duration_minutes} min)
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge className={status.color}>{status.label}</Badge>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingAppointment(apt);
                              setSelectedDate(new Date(apt.scheduled_date));
                              setSelectedTime(apt.scheduled_time);
                              setSelectedType(apt.appointment_type);
                              setMeetingType(apt.meeting_type);
                              setNotes(apt.notes || '');
                              setShowBooking(true);
                            }}
                          >
                            Reschedule
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => cancelMutation.mutate(apt.id)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Past Appointments */}
      {pastAppointments.length > 0 && (
        <Card className="border-0 shadow-sm dark:bg-slate-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-5 h-5 text-slate-400" />
              Past Appointments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pastAppointments.slice(0, 5).map((apt) => (
                <div key={apt.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                  <div>
                    <p className="font-medium text-slate-800 dark:text-white text-sm">{apt.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {format(new Date(apt.scheduled_date), 'MMM d, yyyy')} at {apt.scheduled_time}
                    </p>
                  </div>
                  <Badge className={statusConfig[apt.status]?.color}>{statusConfig[apt.status]?.label}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Booking Modal */}
      <Dialog open={showBooking} onOpenChange={() => resetForm()}>
        <DialogContent className="max-w-lg dark:bg-slate-800">
          <DialogHeader>
            <DialogTitle>
              {editingAppointment ? 'Reschedule Appointment' : 'Book an Appointment'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Appointment Type *</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {appointmentTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label} ({type.duration} min)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Select Date *</Label>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => isBefore(date, startOfDay(new Date())) || isAfter(date, addDays(new Date(), 60))}
                className="rounded-md border dark:border-slate-700 mt-1"
              />
            </div>

            <div>
              <Label>Select Time *</Label>
              <div className="grid grid-cols-4 gap-2 mt-1">
                {timeSlots.map(slot => (
                  <Button
                    key={slot}
                    type="button"
                    variant={selectedTime === slot ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedTime(slot)}
                    className={selectedTime === slot ? 'bg-teal-600 hover:bg-teal-700' : ''}
                  >
                    {slot}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label>Meeting Type</Label>
              <div className="flex gap-2 mt-1">
                {[
                  { value: 'phone', label: 'Phone', icon: Phone },
                  { value: 'video', label: 'Video', icon: Video },
                  { value: 'in_person', label: 'In Person', icon: MapPin }
                ].map(type => (
                  <Button
                    key={type.value}
                    type="button"
                    variant={meetingType === type.value ? 'default' : 'outline'}
                    onClick={() => setMeetingType(type.value)}
                    className={meetingType === type.value ? 'bg-teal-600 hover:bg-teal-700' : ''}
                  >
                    <type.icon className="w-4 h-4 mr-2" />
                    {type.label}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label>Notes (Optional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any specific topics you'd like to discuss?"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
              <Button 
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="bg-teal-600 hover:bg-teal-700"
              >
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {editingAppointment ? 'Update Appointment' : 'Book Appointment'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}