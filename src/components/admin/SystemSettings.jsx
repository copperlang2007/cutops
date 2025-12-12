import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Settings, Save, Mail, Bell, Shield, Database, 
  Clock, Globe, Lock, Users, Zap, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function SystemSettings() {
  const [settings, setSettings] = useState({
    // Email Settings
    email_notifications_enabled: true,
    email_digest_frequency: 'daily',
    email_from_name: 'AgentHub',
    
    // Security Settings
    session_timeout_minutes: 60,
    require_2fa_admins: true,
    require_2fa_all: false,
    password_min_length: 8,
    password_expiry_days: 90,
    
    // System Settings
    maintenance_mode: false,
    auto_backup_enabled: true,
    backup_frequency: 'daily',
    data_retention_days: 365,
    
    // Notification Settings
    alert_on_license_expiry: true,
    alert_days_before_expiry: 60,
    alert_on_compliance_issue: true,
    alert_on_new_agent: true,
    
    // Integration Settings
    nipr_auto_sync: true,
    nipr_sync_frequency: 'weekly',
    sunfire_integration: true,
    
    // Display Settings
    timezone: 'America/New_York',
    date_format: 'MM/DD/YYYY',
    currency: 'USD'
  });

  const handleChange = (key, value) => {
    setSettings({ ...settings, [key]: value });
  };

  const saveSettings = () => {
    // In production, save to backend
    toast.success('System settings saved successfully');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">System Settings</h2>
          <p className="text-sm text-slate-500">Configure system-wide settings and preferences</p>
        </div>
        <Button onClick={saveSettings} className="bg-purple-600 hover:bg-purple-700">
          <Save className="w-4 h-4 mr-2" />
          Save All Settings
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Email Settings */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-600" />
              Email Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Enable Email Notifications</Label>
              <Switch
                checked={settings.email_notifications_enabled}
                onCheckedChange={(v) => handleChange('email_notifications_enabled', v)}
              />
            </div>
            <div>
              <Label>Digest Frequency</Label>
              <Select 
                value={settings.email_digest_frequency} 
                onValueChange={(v) => handleChange('email_digest_frequency', v)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="realtime">Real-time</SelectItem>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>From Name</Label>
              <Input
                value={settings.email_from_name}
                onChange={(e) => handleChange('email_from_name', e.target.value)}
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Lock className="w-5 h-5 text-red-600" />
              Security Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Session Timeout (minutes)</Label>
              <Input
                type="number"
                value={settings.session_timeout_minutes}
                onChange={(e) => handleChange('session_timeout_minutes', parseInt(e.target.value))}
                className="mt-1"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Require 2FA for Admins</Label>
              <Switch
                checked={settings.require_2fa_admins}
                onCheckedChange={(v) => handleChange('require_2fa_admins', v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Require 2FA for All Users</Label>
              <Switch
                checked={settings.require_2fa_all}
                onCheckedChange={(v) => handleChange('require_2fa_all', v)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Min Password Length</Label>
                <Input
                  type="number"
                  value={settings.password_min_length}
                  onChange={(e) => handleChange('password_min_length', parseInt(e.target.value))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Password Expiry (days)</Label>
                <Input
                  type="number"
                  value={settings.password_expiry_days}
                  onChange={(e) => handleChange('password_expiry_days', parseInt(e.target.value))}
                  className="mt-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alert Settings */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-600" />
              Alert Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Alert on License Expiry</Label>
              <Switch
                checked={settings.alert_on_license_expiry}
                onCheckedChange={(v) => handleChange('alert_on_license_expiry', v)}
              />
            </div>
            <div>
              <Label>Days Before Expiry to Alert</Label>
              <Input
                type="number"
                value={settings.alert_days_before_expiry}
                onChange={(e) => handleChange('alert_days_before_expiry', parseInt(e.target.value))}
                className="mt-1"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Alert on Compliance Issues</Label>
              <Switch
                checked={settings.alert_on_compliance_issue}
                onCheckedChange={(v) => handleChange('alert_on_compliance_issue', v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Alert on New Agent Registration</Label>
              <Switch
                checked={settings.alert_on_new_agent}
                onCheckedChange={(v) => handleChange('alert_on_new_agent', v)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Data & Backup Settings */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-600" />
              Data & Backup
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Maintenance Mode</Label>
              <Switch
                checked={settings.maintenance_mode}
                onCheckedChange={(v) => handleChange('maintenance_mode', v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Auto Backup</Label>
              <Switch
                checked={settings.auto_backup_enabled}
                onCheckedChange={(v) => handleChange('auto_backup_enabled', v)}
              />
            </div>
            <div>
              <Label>Backup Frequency</Label>
              <Select 
                value={settings.backup_frequency} 
                onValueChange={(v) => handleChange('backup_frequency', v)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Data Retention (days)</Label>
              <Input
                type="number"
                value={settings.data_retention_days}
                onChange={(e) => handleChange('data_retention_days', parseInt(e.target.value))}
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Integration Settings */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-600" />
              Integrations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>NIPR Auto-Sync</Label>
              <Switch
                checked={settings.nipr_auto_sync}
                onCheckedChange={(v) => handleChange('nipr_auto_sync', v)}
              />
            </div>
            <div>
              <Label>NIPR Sync Frequency</Label>
              <Select 
                value={settings.nipr_sync_frequency} 
                onValueChange={(v) => handleChange('nipr_sync_frequency', v)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label>Sunfire Integration</Label>
              <Switch
                checked={settings.sunfire_integration}
                onCheckedChange={(v) => handleChange('sunfire_integration', v)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Display Settings */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="w-5 h-5 text-teal-600" />
              Display Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Timezone</Label>
              <Select 
                value={settings.timezone} 
                onValueChange={(v) => handleChange('timezone', v)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/New_York">Eastern Time</SelectItem>
                  <SelectItem value="America/Chicago">Central Time</SelectItem>
                  <SelectItem value="America/Denver">Mountain Time</SelectItem>
                  <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Date Format</Label>
              <Select 
                value={settings.date_format} 
                onValueChange={(v) => handleChange('date_format', v)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                  <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Currency</Label>
              <Select 
                value={settings.currency} 
                onValueChange={(v) => handleChange('currency', v)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}