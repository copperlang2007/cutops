import { useState, useEffect } from 'react'
import { base44 } from '@/api/base44Client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  Bell, X, Clock, CheckCircle, ChevronRight, AlertTriangle,
  Heart, Pill, Activity, Shield, Calendar, Dumbbell,
  Eye, Stethoscope, RefreshCw, Volume2, VolumeX,
  ExternalLink, Sparkles, MessageSquare, Mail, Smartphone,
  Settings, ChevronDown, ChevronUp, Ear, Brain, Moon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const priorityConfig = {
  urgent: { color: 'bg-red-500', textColor: 'text-red-700 dark:text-red-400', bgColor: 'bg-red-50 dark:bg-red-900/20', borderColor: 'border-red-200 dark:border-red-800', icon: AlertTriangle, pulseColor: 'animate-pulse' },
  high: { color: 'bg-orange-500', textColor: 'text-orange-700 dark:text-orange-400', bgColor: 'bg-orange-50 dark:bg-orange-900/20', borderColor: 'border-orange-200 dark:border-orange-800', icon: AlertTriangle, pulseColor: '' },
  medium: { color: 'bg-amber-500', textColor: 'text-amber-700 dark:text-amber-400', bgColor: 'bg-amber-50 dark:bg-amber-900/20', borderColor: 'border-amber-200 dark:border-amber-800', icon: Bell, pulseColor: '' },
  low: { color: 'bg-blue-500', textColor: 'text-blue-700 dark:text-blue-400', bgColor: 'bg-blue-50 dark:bg-blue-900/20', borderColor: 'border-blue-200 dark:border-blue-800', icon: Bell, pulseColor: '' }
};

const categoryIcons = {
  preventive: Shield,
  medication: Pill,
  fitness: Dumbbell,
  wellness: Heart,
  benefits: Calendar,
  cardiovascular: Heart,
  diabetes: Activity,
  dental: Stethoscope,
  vision: Eye,
  hearing: Ear,
  mental_health: Brain,
  sleep: Moon,
  nutrition: Activity,
  musculoskeletal: Activity
};

export default function HealthAlertNotifications({ client, portalUser, conditions = [], onNavigate, onTalkToCoach }) {
  const queryClient = useQueryClient();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [notificationPreferences, setNotificationPreferences] = useState({
    email: true,
    sms: false,
    inApp: true,
    quietHoursStart: '22:00',
    quietHoursEnd: '07:00'
  });
  
  const userData = client || portalUser;
  const planType = client?.plan_type || portalUser?.plan_type || 'medicare_advantage';

  // Fetch alerts
  const { data: alertsData, isLoading, refetch } = useQuery({
    queryKey: ['healthAlerts', userData?.email],
    queryFn: async () => {
      const response = await base44.functions.invoke('healthAlertEngine', {
        action: 'list'
      });
      return response.data;
    },
    enabled: !!userData?.email,
    refetchInterval: 5 * 60 * 1000 // Refetch every 5 minutes
  });

  // Generate new alerts
  const generateAlertsMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('healthAlertEngine', {
        action: 'generate',
        conditions,
        planType,
        sendNotifications: notificationPreferences.email || notificationPreferences.sms,
        notificationPreferences
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['healthAlerts']);
      if (data.generated > 0) {
        toast.success(`${data.generated} new health alert${data.generated > 1 ? 's' : ''} generated`);
      }
    },
    onError: (error) => {
      toast.error('Failed to check for alerts');
      console.error(error);
    }
  });

  // Dismiss alert
  const dismissMutation = useMutation({
    mutationFn: async (alertId) => {
      await base44.functions.invoke('healthAlertEngine', {
        action: 'dismiss',
        alertId
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['healthAlerts']);
      toast.success('Alert dismissed');
    }
  });

  // Snooze alert
  const snoozeMutation = useMutation({
    mutationFn: async ({ alertId, days }) => {
      await base44.functions.invoke('healthAlertEngine', {
        action: 'snooze',
        alertId,
        days
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['healthAlerts']);
      toast.success(`Alert snoozed for ${variables.days} day${variables.days > 1 ? 's' : ''}`);
    }
  });

  // Complete alert
  const completeMutation = useMutation({
    mutationFn: async (alertId) => {
      await base44.functions.invoke('healthAlertEngine', {
        action: 'complete',
        alertId
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['healthAlerts']);
      toast.success('Marked as complete! Great job! 🎉');
    }
  });

  // Generate alerts on mount and when conditions change
  useEffect(() => {
    if (userData?.email) {
      generateAlertsMutation.mutate();
    }
  }, [userData?.email, JSON.stringify(conditions)]);

  const alerts = alertsData?.alerts || [];
  const urgentAlerts = alerts.filter(a => a.priority === 'urgent' || a.priority === 'high');
  const otherAlerts = alerts.filter(a => a.priority !== 'urgent' && a.priority !== 'high');

  const handleAction = (alert) => {
    if (alert.action_url && onNavigate) {
      onNavigate(alert.action_url);
    }
  };

  const handleTalkToCoach = (alert) => {
    if (onTalkToCoach) {
      onTalkToCoach(alert);
    } else if (onNavigate) {
      onNavigate('coach');
    }
  };

  if (!userData) return null;

  const totalAlerts = alerts.length;
  const urgentCount = urgentAlerts.length;

  return (
    <div className="space-y-4">
      {/* Alert Summary Header */}
      <Card className="border-0 shadow-sm dark:bg-slate-800 overflow-hidden">
        <div className={`p-4 ${urgentCount > 0 ? 'bg-gradient-to-r from-red-500 to-orange-500' : 'bg-gradient-to-r from-teal-500 to-emerald-500'} text-white`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full bg-white/20 flex items-center justify-center ${urgentCount > 0 ? 'animate-pulse' : ''}`}>
                <Bell className="w-6 h-6" />
                {totalAlerts > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-white text-red-600 text-xs font-bold rounded-full flex items-center justify-center">
                    {totalAlerts}
                  </span>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-lg">Health Alerts</h3>
                <p className="text-sm opacity-90">
                  {alerts.length === 0 
                    ? 'All caught up! No pending alerts.' 
                    : urgentCount > 0
                      ? `${urgentCount} urgent alert${urgentCount > 1 ? 's' : ''} need immediate attention`
                      : `${alerts.length} alert${alerts.length !== 1 ? 's' : ''} to review`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white/20"
                onClick={() => setShowSettingsModal(true)}
              >
                <Settings className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white/20"
                onClick={() => generateAlertsMutation.mutate()}
                disabled={generateAlertsMutation.isPending}
              >
                <RefreshCw className={`w-4 h-4 ${generateAlertsMutation.isPending ? 'animate-spin' : ''}`} />
              </Button>
              {totalAlerts > urgentCount && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-white hover:bg-white/20 gap-1"
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  {isExpanded ? 'Collapse' : 'View All'}
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Urgent Alerts Always Visible */}
        {urgentAlerts.length > 0 && (
          <CardContent className="p-4 border-b dark:border-slate-700">
            <p className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Requires Immediate Attention
            </p>
            <div className="space-y-3">
              {urgentAlerts.map((alert, idx) => (
                <AlertCard
                  key={alert.id || idx}
                  alert={alert}
                  onDismiss={() => dismissMutation.mutate(alert.id)}
                  onSnooze={(days) => snoozeMutation.mutate({ alertId: alert.id, days })}
                  onComplete={() => completeMutation.mutate(alert.id)}
                  onAction={() => handleAction(alert)}
                  onTalkToCoach={() => handleTalkToCoach(alert)}
                  showCoachOption={!!alert.coachFollowUp || !!alert.metadata?.coachFollowUp}
                />
              ))}
            </div>
          </CardContent>
        )}

        {/* Expandable Other Alerts */}
        <AnimatePresence>
          {isExpanded && otherAlerts.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <CardContent className="p-4">
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-3">
                  Other Recommendations
                </p>
                <div className="space-y-3">
                  {otherAlerts.map((alert, idx) => (
                    <AlertCard
                      key={alert.id || idx}
                      alert={alert}
                      onDismiss={() => dismissMutation.mutate(alert.id)}
                      onSnooze={(days) => snoozeMutation.mutate({ alertId: alert.id, days })}
                      onComplete={() => completeMutation.mutate(alert.id)}
                      onAction={() => handleAction(alert)}
                      onTalkToCoach={() => handleTalkToCoach(alert)}
                      showCoachOption={!!alert.coachFollowUp || !!alert.metadata?.coachFollowUp}
                    />
                  ))}
                </div>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State */}
        {alerts.length === 0 && !isLoading && (
          <CardContent className="p-6 text-center">
            <Sparkles className="w-12 h-12 mx-auto text-teal-500 mb-3" />
            <h4 className="font-semibold text-slate-800 dark:text-white mb-1">You're All Caught Up!</h4>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              No health alerts at the moment. Keep up the great work!
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => generateAlertsMutation.mutate()}
              disabled={generateAlertsMutation.isPending}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${generateAlertsMutation.isPending ? 'animate-spin' : ''}`} />
              Check for New Alerts
            </Button>
          </CardContent>
        )}

        {isLoading && alerts.length === 0 && (
          <CardContent className="p-6 text-center">
            <RefreshCw className="w-8 h-8 mx-auto text-teal-500 animate-spin mb-3" />
            <p className="text-sm text-slate-600 dark:text-slate-400">Checking your health status...</p>
          </CardContent>
        )}
      </Card>

      {/* Notification Settings Modal */}
      <Dialog open={showSettingsModal} onOpenChange={setShowSettingsModal}>
        <DialogContent className="max-w-md dark:bg-slate-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-teal-600" />
              Notification Settings
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <Label className="font-medium">Email Notifications</Label>
                    <p className="text-xs text-slate-500">Receive urgent alerts via email</p>
                  </div>
                </div>
                <Switch 
                  checked={notificationPreferences.email}
                  onCheckedChange={(checked) => setNotificationPreferences(prev => ({ ...prev, email: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
                    <Smartphone className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <Label className="font-medium">SMS Notifications</Label>
                    <p className="text-xs text-slate-500">Get text alerts for urgent items</p>
                  </div>
                </div>
                <Switch 
                  checked={notificationPreferences.sms}
                  onCheckedChange={(checked) => setNotificationPreferences(prev => ({ ...prev, sms: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center">
                    <Bell className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <Label className="font-medium">In-App Notifications</Label>
                    <p className="text-xs text-slate-500">Show alerts in the portal</p>
                  </div>
                </div>
                <Switch 
                  checked={notificationPreferences.inApp}
                  onCheckedChange={(checked) => setNotificationPreferences(prev => ({ ...prev, inApp: checked }))}
                />
              </div>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                <strong>Note:</strong> Urgent health alerts (like overdue screenings or medication reminders) 
                will always appear in the portal for your safety.
              </p>
            </div>

            <Button 
              onClick={() => {
                toast.success('Notification settings saved');
                setShowSettingsModal(false);
              }}
              className="w-full bg-teal-600 hover:bg-teal-700"
            >
              Save Settings
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AlertCard({ alert, onDismiss, onSnooze, onComplete, onAction, onTalkToCoach, showCoachOption }) {
  const config = priorityConfig[alert.priority] || priorityConfig.medium;
  const CategoryIcon = categoryIcons[alert.category] || Bell;
  const timeAgo = alert.created_date ? formatDistanceToNow(new Date(alert.created_date), { addSuffix: true }) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className={`p-4 rounded-xl border ${config.borderColor} ${config.bgColor} transition-all hover:shadow-md ${config.pulseColor}`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-lg ${config.color} bg-opacity-20 flex items-center justify-center shrink-0`}>
          <CategoryIcon className={`w-5 h-5 ${config.textColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-medium text-slate-800 dark:text-white">{alert.title}</h4>
              <Badge className={`${config.color} text-white text-xs`}>
                {alert.priority}
              </Badge>
            </div>
            <Button size="sm" variant="ghost" onClick={onDismiss} className="shrink-0 h-6 w-6 p-0">
              <X className="w-4 h-4 text-slate-400" />
            </Button>
          </div>
          
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{alert.message}</p>
          
          {timeAgo && (
            <p className="text-xs text-slate-400 mb-3">{timeAgo}</p>
          )}
          
          <div className="flex items-center gap-2 flex-wrap">
            {alert.action_text && (
              <Button size="sm" onClick={onAction} className="gap-1 bg-teal-600 hover:bg-teal-700">
                {alert.action_text}
                <ChevronRight className="w-3 h-3" />
              </Button>
            )}
            
            {showCoachOption && (
              <Button size="sm" variant="outline" onClick={onTalkToCoach} className="gap-1">
                <MessageSquare className="w-3 h-3" />
                Talk to Coach
              </Button>
            )}
            
            <Button size="sm" variant="outline" onClick={onComplete} className="gap-1">
              <CheckCircle className="w-3 h-3" />
              Done
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost">
                  <Clock className="w-3 h-3 mr-1" />
                  Snooze
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => onSnooze(1)}>1 day</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSnooze(3)}>3 days</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSnooze(7)}>1 week</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSnooze(14)}>2 weeks</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </motion.div>
  );
}