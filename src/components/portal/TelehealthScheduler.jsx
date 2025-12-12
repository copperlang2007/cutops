import { useState } from 'react'
import { base44 } from '@/api/base44Client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from '@/components/ui/calendar'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Video, Phone, Calendar as CalendarIcon, Clock, User, 
  Stethoscope, Shield, CheckCircle, X, Loader2,
  MapPin, Star, MessageSquare, ExternalLink, Copy,
  AlertCircle, Heart, Brain, Eye, Pill
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { format, addDays, isSameDay } from 'date-fns'

const providerTypes = [
  { id: 'agent', label: 'Insurance Agent', icon: Shield, description: 'Plan questions, benefits help' },
  { id: 'pcp', label: 'Primary Care', icon: Stethoscope, description: 'General health concerns' },
  { id: 'mental', label: 'Mental Health', icon: Brain, description: 'Counseling, therapy' },
  { id: 'specialist', label: 'Specialist', icon: Heart, description: 'Cardiology, endocrinology, etc.' },
  { id: 'pharmacy', label: 'Pharmacist', icon: Pill, description: 'Medication questions' },
  { id: 'vision', label: 'Vision Care', icon: Eye, description: 'Eye health consultations' }
];

const timeSlots = [
  '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM'
];

const appointmentReasons = [
  'Plan Benefits Review',
  'Prescription Questions',
  'New Health Concern',
  'Follow-up Visit',
  'Preventive Care',
  'Mental Health Support',
  'Medication Management',
  'Second Opinion',
  'Other'
];

// Simulated providers
const mockProviders = [
  { id: 1, name: 'Dr. Sarah Johnson', specialty: 'Primary Care', rating: 4.9, nextAvailable: 'Today', image: null, acceptsMedicare: true },
  { id: 2, name: 'Dr. Michael Chen', specialty: 'Cardiology', rating: 4.8, nextAvailable: 'Tomorrow', image: null, acceptsMedicare: true },
  { id: 3, name: 'Dr. Emily Williams', specialty: 'Mental Health', rating: 4.9, nextAvailable: 'Today', image: null, acceptsMedicare: true },
  { id: 4, name: 'Dr. Robert Martinez', specialty: 'Endocrinology', rating: 4.7, nextAvailable: 'In 2 days', image: null, acceptsMedicare: true },
];

export default function TelehealthScheduler({ client, portalUser, agent }) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('schedule');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedProviderType, setSelectedProviderType] = useState(null);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [appointmentType, setAppointmentType] = useState('video');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [step, setStep] = useState(1);

  const userData = client || portalUser;

  // Fetch existing telehealth appointments
  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['telehealthAppointments', userData?.id],
    queryFn: async () => {
      if (!userData) return [];
      const filter = client 
        ? { client_id: client.id, meeting_type: 'video' }
        : { portal_user_id: portalUser?.id, meeting_type: 'video' };
      return await base44.entities.Appointment.filter(filter, '-scheduled_date');
    },
    enabled: !!userData
  });

  // Create appointment mutation
  const createAppointmentMutation = useMutation({
    mutationFn: async (appointmentData) => {
      // Generate a mock meeting link
      const meetingId = Math.random().toString(36).substring(2, 15);
      const meetingLink = `https://meet.medicare-portal.com/${meetingId}`;

      const newAppointment = {
        client_id: client?.id,
        portal_user_id: portalUser?.id,
        agent_id: selectedProviderType === 'agent' ? agent?.id : null,
        title: `Telehealth: ${reason || 'Virtual Visit'}`,
        description: notes,
        appointment_type: selectedProviderType === 'agent' ? 'plan_review' : 'other',
        scheduled_date: format(selectedDate, 'yyyy-MM-dd'),
        scheduled_time: selectedTime,
        duration_minutes: 30,
        meeting_type: appointmentType,
        meeting_link: meetingLink,
        status: 'scheduled',
        notes: `Provider: ${selectedProvider?.name || agent?.first_name + ' ' + agent?.last_name}\nReason: ${reason}\n${notes}`
      };

      await base44.entities.Appointment.create(newAppointment);

      // Send confirmation email
      if (userData?.email) {
        await base44.integrations.Core.SendEmail({
          to: userData.email,
          subject: `Telehealth Appointment Confirmed - ${format(selectedDate, 'MMMM d, yyyy')} at ${selectedTime}`,
          body: `
            <h2>Your Telehealth Appointment is Confirmed!</h2>
            <p>Hello ${userData.first_name},</p>
            <p>Your virtual appointment has been scheduled:</p>
            <ul>
              <li><strong>Date:</strong> ${format(selectedDate, 'EEEE, MMMM d, yyyy')}</li>
              <li><strong>Time:</strong> ${selectedTime}</li>
              <li><strong>Type:</strong> ${appointmentType === 'video' ? 'Video Call' : 'Phone Call'}</li>
              <li><strong>Provider:</strong> ${selectedProvider?.name || agent?.first_name + ' ' + agent?.last_name}</li>
              <li><strong>Reason:</strong> ${reason}</li>
            </ul>
            <p><strong>Join your appointment:</strong> <a href="${meetingLink}">${meetingLink}</a></p>
            <p>Please join 5 minutes early to test your connection.</p>
          `
        });
      }

      return { meetingLink };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['telehealthAppointments']);
      toast.success('Telehealth appointment scheduled!');
      resetBooking();
      setShowBookingModal(false);
    },
    onError: (error) => {
      toast.error('Failed to schedule appointment');
      console.error(error);
    }
  });

  // Cancel appointment mutation
  const cancelAppointmentMutation = useMutation({
    mutationFn: async (appointmentId) => {
      await base44.entities.Appointment.update(appointmentId, { status: 'cancelled' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['telehealthAppointments']);
      toast.success('Appointment cancelled');
    }
  });

  const resetBooking = () => {
    setStep(1);
    setSelectedProviderType(null);
    setSelectedProvider(null);
    setSelectedDate(null);
    setSelectedTime(null);
    setReason('');
    setNotes('');
  };

  const handleBookAppointment = () => {
    if (!selectedDate || !selectedTime || !reason) {
      toast.error('Please complete all required fields');
      return;
    }
    createAppointmentMutation.mutate();
  };

  const copyMeetingLink = (link) => {
    navigator.clipboard.writeText(link);
    toast.success('Meeting link copied!');
  };

  const upcomingAppointments = appointments.filter(a => 
    a.status === 'scheduled' && new Date(a.scheduled_date) >= new Date()
  );
  const pastAppointments = appointments.filter(a => 
    a.status === 'completed' || new Date(a.scheduled_date) < new Date()
  );

  const getStatusBadge = (status) => {
    const configs = {
      scheduled: { color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300', label: 'Scheduled' },
      confirmed: { color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300', label: 'Confirmed' },
      completed: { color: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300', label: 'Completed' },
      cancelled: { color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300', label: 'Cancelled' }
    };
    const config = configs[status] || configs.scheduled;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-0 shadow-sm dark:bg-slate-800 overflow-hidden">
        <div className="bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
                <Video className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Telehealth Services</h2>
                <p className="text-blue-100 text-sm">Connect with providers from the comfort of home</p>
              </div>
            </div>
            <Button 
              onClick={() => setShowBookingModal(true)}
              className="bg-white text-blue-600 hover:bg-blue-50"
            >
              <Video className="w-4 h-4 mr-2" />
              Schedule Visit
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50">
              <Video className="w-5 h-5 mx-auto text-blue-600 mb-1" />
              <p className="text-lg font-bold text-slate-800 dark:text-white">{upcomingAppointments.length}</p>
              <p className="text-xs text-slate-500">Upcoming</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50">
              <CheckCircle className="w-5 h-5 mx-auto text-green-600 mb-1" />
              <p className="text-lg font-bold text-slate-800 dark:text-white">{pastAppointments.length}</p>
              <p className="text-xs text-slate-500">Completed</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50">
              <Clock className="w-5 h-5 mx-auto text-purple-600 mb-1" />
              <p className="text-lg font-bold text-slate-800 dark:text-white">$0</p>
              <p className="text-xs text-slate-500">Copay</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appointments Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white dark:bg-slate-800 shadow-sm p-1 rounded-xl">
          <TabsTrigger value="schedule" className="rounded-lg gap-2">
            <CalendarIcon className="w-4 h-4" />
            Upcoming
          </TabsTrigger>
          <TabsTrigger value="history" className="rounded-lg gap-2">
            <Clock className="w-4 h-4" />
            History
          </TabsTrigger>
          <TabsTrigger value="providers" className="rounded-lg gap-2">
            <Stethoscope className="w-4 h-4" />
            Providers
          </TabsTrigger>
        </TabsList>

        <TabsContent value="schedule" className="mt-6">
          {upcomingAppointments.length === 0 ? (
            <Card className="border-0 shadow-sm dark:bg-slate-800">
              <CardContent className="py-12 text-center">
                <Video className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">
                  No Upcoming Telehealth Visits
                </h3>
                <p className="text-slate-500 dark:text-slate-400 mb-4 max-w-md mx-auto">
                  Schedule a virtual visit with your agent or a healthcare provider.
                </p>
                <Button onClick={() => setShowBookingModal(true)} className="bg-blue-600 hover:bg-blue-700">
                  <Video className="w-4 h-4 mr-2" />
                  Schedule Your First Visit
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {upcomingAppointments.map((apt) => (
                <AppointmentCard 
                  key={apt.id} 
                  appointment={apt} 
                  onCancel={() => cancelAppointmentMutation.mutate(apt.id)}
                  onCopyLink={copyMeetingLink}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          {pastAppointments.length === 0 ? (
            <Card className="border-0 shadow-sm dark:bg-slate-800">
              <CardContent className="py-12 text-center">
                <Clock className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                <p className="text-slate-500 dark:text-slate-400">No past telehealth visits</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pastAppointments.map((apt) => (
                <AppointmentCard 
                  key={apt.id} 
                  appointment={apt}
                  isPast
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="providers" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mockProviders.map((provider) => (
              <Card key={provider.id} className="border-0 shadow-sm dark:bg-slate-800">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-lg font-semibold">
                      {provider.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-800 dark:text-white">{provider.name}</h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{provider.specialty}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                          <span className="text-sm font-medium">{provider.rating}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          Next: {provider.nextAvailable}
                        </Badge>
                        {provider.acceptsMedicare && (
                          <Badge className="bg-green-100 text-green-700 text-xs">Medicare</Badge>
                        )}
                      </div>
                    </div>
                    <Button 
                      size="sm"
                      onClick={() => {
                        setSelectedProvider(provider);
                        setSelectedProviderType('specialist');
                        setStep(3);
                        setShowBookingModal(true);
                      }}
                    >
                      Book
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Booking Modal */}
      <Dialog open={showBookingModal} onOpenChange={(open) => {
        if (!open) resetBooking();
        setShowBookingModal(open);
      }}>
        <DialogContent className="max-w-2xl dark:bg-slate-800 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Video className="w-5 h-5 text-blue-600" />
              Schedule Telehealth Visit
            </DialogTitle>
          </DialogHeader>

          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-6">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= s 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                }`}>
                  {step > s ? <CheckCircle className="w-4 h-4" /> : s}
                </div>
                {s < 4 && (
                  <div className={`w-16 h-1 mx-2 ${step > s ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`} />
                )}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* Step 1: Provider Type */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <h3 className="font-medium text-slate-800 dark:text-white">Who would you like to meet with?</h3>
                <div className="grid grid-cols-2 gap-3">
                  {providerTypes.map((type) => {
                    const TypeIcon = type.icon;
                    return (
                      <button
                        key={type.id}
                        onClick={() => {
                          setSelectedProviderType(type.id);
                          if (type.id === 'agent' && agent) {
                            setSelectedProvider({ name: `${agent.first_name} ${agent.last_name}`, specialty: 'Insurance Agent' });
                            setStep(3);
                          } else {
                            setStep(2);
                          }
                        }}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          selectedProviderType === type.id
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-slate-200 dark:border-slate-700 hover:border-blue-300'
                        }`}
                      >
                        <TypeIcon className={`w-6 h-6 mb-2 ${
                          selectedProviderType === type.id ? 'text-blue-600' : 'text-slate-400'
                        }`} />
                        <p className="font-medium text-slate-800 dark:text-white">{type.label}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{type.description}</p>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Step 2: Select Provider */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <h3 className="font-medium text-slate-800 dark:text-white">Select a provider</h3>
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {mockProviders
                    .filter(p => {
                      if (selectedProviderType === 'pcp') return p.specialty === 'Primary Care';
                      if (selectedProviderType === 'mental') return p.specialty === 'Mental Health';
                      return true;
                    })
                    .map((provider) => (
                    <button
                      key={provider.id}
                      onClick={() => {
                        setSelectedProvider(provider);
                        setStep(3);
                      }}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-4 ${
                        selectedProvider?.id === provider.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-slate-200 dark:border-slate-700 hover:border-blue-300'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold">
                        {provider.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-800 dark:text-white">{provider.name}</p>
                        <p className="text-sm text-slate-500">{provider.specialty}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                          <span className="text-sm">{provider.rating}</span>
                        </div>
                        <p className="text-xs text-slate-400">{provider.nextAvailable}</p>
                      </div>
                    </button>
                  ))}
                </div>
                <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
              </motion.div>
            )}

            {/* Step 3: Date & Time */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center">
                    {selectedProvider?.name?.split(' ').map(n => n[0]).join('') || 'P'}
                  </div>
                  <div>
                    <p className="font-medium text-slate-800 dark:text-white">{selectedProvider?.name}</p>
                    <p className="text-sm text-slate-500">{selectedProvider?.specialty}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="mb-2 block">Select Date</Label>
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      disabled={(date) => date < new Date() || date > addDays(new Date(), 30)}
                      className="rounded-lg border dark:border-slate-700"
                    />
                  </div>
                  <div>
                    <Label className="mb-2 block">Select Time</Label>
                    <div className="grid grid-cols-2 gap-2 max-h-[280px] overflow-y-auto">
                      {timeSlots.map((time) => (
                        <button
                          key={time}
                          onClick={() => setSelectedTime(time)}
                          className={`p-2 text-sm rounded-lg border transition-all ${
                            selectedTime === time
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700'
                              : 'border-slate-200 dark:border-slate-700 hover:border-blue-300'
                          }`}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <Label>Visit Type:</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={appointmentType === 'video' ? 'default' : 'outline'}
                      onClick={() => setAppointmentType('video')}
                      className={appointmentType === 'video' ? 'bg-blue-600' : ''}
                    >
                      <Video className="w-4 h-4 mr-1" />
                      Video
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={appointmentType === 'phone' ? 'default' : 'outline'}
                      onClick={() => setAppointmentType('phone')}
                      className={appointmentType === 'phone' ? 'bg-blue-600' : ''}
                    >
                      <Phone className="w-4 h-4 mr-1" />
                      Phone
                    </Button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(selectedProviderType === 'agent' ? 1 : 2)}>Back</Button>
                  <Button 
                    onClick={() => setStep(4)}
                    disabled={!selectedDate || !selectedTime}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    Continue
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 4: Reason & Confirm */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                  <h4 className="font-medium text-slate-800 dark:text-white mb-3">Appointment Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Provider:</span>
                      <span className="font-medium text-slate-800 dark:text-white">{selectedProvider?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Date:</span>
                      <span className="font-medium text-slate-800 dark:text-white">
                        {selectedDate ? format(selectedDate, 'EEEE, MMMM d, yyyy') : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Time:</span>
                      <span className="font-medium text-slate-800 dark:text-white">{selectedTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Type:</span>
                      <span className="font-medium text-slate-800 dark:text-white">
                        {appointmentType === 'video' ? 'Video Call' : 'Phone Call'}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="mb-2 block">Reason for Visit *</Label>
                  <Select value={reason} onValueChange={setReason}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a reason" />
                    </SelectTrigger>
                    <SelectContent>
                      {appointmentReasons.map((r) => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="mb-2 block">Additional Notes (Optional)</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Describe any symptoms or questions you'd like to discuss..."
                    rows={3}
                  />
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(3)}>Back</Button>
                  <Button 
                    onClick={handleBookAppointment}
                    disabled={!reason || createAppointmentMutation.isPending}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    {createAppointmentMutation.isPending ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Scheduling...</>
                    ) : (
                      <><CheckCircle className="w-4 h-4 mr-2" /> Confirm Appointment</>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AppointmentCard({ appointment, onCancel, onCopyLink, isPast = false }) {
  const isToday = isSameDay(new Date(appointment.scheduled_date), new Date());

  return (
    <Card className={`border-0 shadow-sm dark:bg-slate-800 ${isToday && !isPast ? 'ring-2 ring-blue-500' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              isPast ? 'bg-slate-100 dark:bg-slate-700' : 'bg-blue-100 dark:bg-blue-900/40'
            }`}>
              {appointment.meeting_type === 'video' ? (
                <Video className={`w-6 h-6 ${isPast ? 'text-slate-500' : 'text-blue-600'}`} />
              ) : (
                <Phone className={`w-6 h-6 ${isPast ? 'text-slate-500' : 'text-blue-600'}`} />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium text-slate-800 dark:text-white">{appointment.title}</h4>
                {isToday && !isPast && <Badge className="bg-blue-600 text-white">Today</Badge>}
              </div>
              <div className="space-y-1 text-sm text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4" />
                  {format(new Date(appointment.scheduled_date), 'EEEE, MMMM d, yyyy')}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {appointment.scheduled_time} ({appointment.duration_minutes} min)
                </div>
              </div>
            </div>
          </div>
          <div className="text-right space-y-2">
            {!isPast && appointment.meeting_link && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => window.open(appointment.meeting_link, '_blank')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Video className="w-4 h-4 mr-1" />
                  Join
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onCopyLink?.(appointment.meeting_link)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            )}
            {!isPast && onCancel && (
              <Button size="sm" variant="ghost" className="text-red-600" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}