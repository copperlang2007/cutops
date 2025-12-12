import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { 
  Bell, Mail, MessageSquare, Smartphone, Settings,
  CheckCircle, Clock, AlertTriangle, Zap
} from 'lucide-react';
import { toast } from 'sonner'

const NOTIFICATION_TYPES = [
  { id: 'license_expiry', name: 'License Expiration', icon: AlertTriangle, color: 'text-red-500' },
  { id: 'task_due', name: 'Task Due Reminder', icon: Clock, color: 'text-amber-500' },
  { id: 'onboarding_milestone', name: 'Onboarding Milestones', icon: CheckCircle, color: 'text-emerald-500' },
  { id: 'commission_received', name: 'Commission Received', icon: Zap, color: 'text-blue-500' },
  { id: 'compliance_alert', name: 'Compliance Alerts', icon: AlertTriangle, color: 'text-red-500' },
  { id: 'training_reminder', name: 'Training Reminders', icon: Clock, color: 'text-purple-500' }
];

export default function SmartNotifications() {
  const [settings, setSettings] = useState({
    email: {
      enabled: true,
      license_expiry: true,
      task_due: true,
      onboarding_milestone: true,
      commission_received: true,
      compliance_alert: true,
      training_reminder: false
    },
    sms: {
      enabled: false,
      license_expiry: true,
      task_due: false,
      onboarding_milestone: false,
      commission_received: false,
      compliance_alert: true,
      training_reminder: false
    },
    push: {
      enabled: true,
      license_expiry: true,
      task_due: true,
      onboarding_milestone: true,
      commission_received: true,
      compliance_alert: true,
      training_reminder: true
    }
  });

  const [recentNotifications, setRecentNotifications] = useState([
    { type: 'onboarding_milestone', message: 'John Smith completed AHIP certification', time: '5 min ago', read: false },
    { type: 'license_expiry', message: 'Sarah Jones CA license expires in 30 days', time: '1 hour ago', read: false },
    { type: 'commission_received', message: 'Commission payment of $2,450 received', time: '2 hours ago', read: true }
  ]);

  const toggleChannel = (channel) => {
    setSettings(prev => ({
      ...prev,
      [channel]: {
        ...prev[channel],
        enabled: !prev[channel].enabled
      }
    }));
  };

  const toggleNotificationType = (channel, type) => {
    setSettings(prev => ({
      ...prev,
      [channel]: {
        ...prev[channel],
        [type]: !prev[channel][type]
      }
    }));
  };

  const sendTestNotification = async (channel) => {
    try {
      if (channel === 'email') {
        // Simulate sending test email
        toast.success('Test email sent!');
      } else if (channel === 'sms') {
        toast.success('Test SMS sent!');
      } else {
        toast.success('Test push notification sent!');
      }
    } catch (err) {
      toast.error('Failed to send test notification');
    }
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Bell className="w-5 h-5 text-blue-600" />
          Smart Notifications
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Recent Notifications */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-slate-700 mb-2">Recent</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {recentNotifications.map((notif, i) => {
              const type = NOTIFICATION_TYPES.find(t => t.id === notif.type);
              return (
                <div key={i} className={`p-2 rounded-lg flex items-start gap-2 ${notif.read ? 'bg-slate-50' : 'bg-blue-50'}`}>
                  {type && <type.icon className={`w-4 h-4 mt-0.5 ${type.color}`} />}
                  <div className="flex-1">
                    <p className="text-xs text-slate-700">{notif.message}</p>
                    <p className="text-xs text-slate-400">{notif.time}</p>
                  </div>
                  {!notif.read && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Channel Settings */}
        <div className="space-y-4">
          {/* Email */}
          <div className="p-3 bg-slate-50 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-600" />
                <span className="text-sm font-medium">Email Notifications</span>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={settings.email.enabled}
                  onCheckedChange={() => toggleChannel('email')}
                />
                <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => sendTestNotification('email')}>
                  Test
                </Button>
              </div>
            </div>
            {settings.email.enabled && (
              <div className="grid grid-cols-2 gap-2">
                {NOTIFICATION_TYPES.map(type => (
                  <label key={type.id} className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.email[type.id]}
                      onChange={() => toggleNotificationType('email', type.id)}
                      className="rounded text-blue-500"
                    />
                    {type.name}
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* SMS */}
          <div className="p-3 bg-slate-50 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-slate-600" />
                <span className="text-sm font-medium">SMS Notifications</span>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={settings.sms.enabled}
                  onCheckedChange={() => toggleChannel('sms')}
                />
                <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => sendTestNotification('sms')}>
                  Test
                </Button>
              </div>
            </div>
            {settings.sms.enabled && (
              <div className="grid grid-cols-2 gap-2">
                {NOTIFICATION_TYPES.map(type => (
                  <label key={type.id} className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.sms[type.id]}
                      onChange={() => toggleNotificationType('sms', type.id)}
                      className="rounded text-blue-500"
                    />
                    {type.name}
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Push */}
          <div className="p-3 bg-slate-50 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-slate-600" />
                <span className="text-sm font-medium">Push Notifications</span>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={settings.push.enabled}
                  onCheckedChange={() => toggleChannel('push')}
                />
                <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => sendTestNotification('push')}>
                  Test
                </Button>
              </div>
            </div>
            {settings.push.enabled && (
              <div className="grid grid-cols-2 gap-2">
                {NOTIFICATION_TYPES.map(type => (
                  <label key={type.id} className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.push[type.id]}
                      onChange={() => toggleNotificationType('push', type.id)}
                      className="rounded text-blue-500"
                    />
                    {type.name}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        <Button className="w-full mt-4" onClick={() => toast.success('Notification settings saved')}>
          Save Settings
        </Button>
      </CardContent>
    </Card>
  );
}