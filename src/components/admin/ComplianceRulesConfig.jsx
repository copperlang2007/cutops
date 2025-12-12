import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Shield, Plus, Edit, Trash2, Save, AlertTriangle, 
  Clock, FileText, Check, X, Loader2, Settings
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const RULE_CATEGORIES = [
  { value: 'license', label: 'License Compliance' },
  { value: 'contract', label: 'Contract Requirements' },
  { value: 'training', label: 'Training Requirements' },
  { value: 'documentation', label: 'Documentation' },
  { value: 'client_interaction', label: 'Client Interactions' },
  { value: 'data_privacy', label: 'Data Privacy' }
];

const TRIGGER_TYPES = [
  { value: 'expiration', label: 'Expiration Date' },
  { value: 'missing_document', label: 'Missing Document' },
  { value: 'threshold', label: 'Threshold Breach' },
  { value: 'schedule', label: 'Scheduled Check' },
  { value: 'event', label: 'Event Trigger' }
];

const ACTION_TYPES = [
  { value: 'alert', label: 'Create Alert' },
  { value: 'task', label: 'Create Task' },
  { value: 'email', label: 'Send Email' },
  { value: 'block', label: 'Block Action' },
  { value: 'escalate', label: 'Escalate to Manager' }
];

const DEFAULT_RULES = [
  {
    name: 'License Expiration Warning',
    description: 'Alert 60 days before license expires',
    category: 'license',
    trigger_type: 'expiration',
    trigger_days: 60,
    severity: 'warning',
    action: 'alert',
    is_active: true
  },
  {
    name: 'License Expired - Critical',
    description: 'Critical alert when license is expired',
    category: 'license',
    trigger_type: 'expiration',
    trigger_days: 0,
    severity: 'critical',
    action: 'block',
    is_active: true
  },
  {
    name: 'AHIP Certification Required',
    description: 'Require annual AHIP certification',
    category: 'training',
    trigger_type: 'expiration',
    trigger_days: 30,
    severity: 'warning',
    action: 'task',
    is_active: true
  },
  {
    name: 'E&O Insurance Expiring',
    description: 'Alert for E&O insurance renewal',
    category: 'documentation',
    trigger_type: 'expiration',
    trigger_days: 45,
    severity: 'warning',
    action: 'alert',
    is_active: true
  },
  {
    name: 'Client Follow-up Required',
    description: 'Alert when client not contacted in 90 days',
    category: 'client_interaction',
    trigger_type: 'threshold',
    trigger_days: 90,
    severity: 'info',
    action: 'task',
    is_active: true
  }
];

export default function ComplianceRulesConfig() {
  const queryClient = useQueryClient();
  const [rules, setRules] = useState(DEFAULT_RULES);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [newRule, setNewRule] = useState({
    name: '',
    description: '',
    category: 'license',
    trigger_type: 'expiration',
    trigger_days: 30,
    severity: 'warning',
    action: 'alert',
    is_active: true
  });

  const handleAddRule = () => {
    if (!newRule.name) {
      toast.error('Rule name is required');
      return;
    }
    setRules([...rules, { ...newRule, id: Date.now() }]);
    setNewRule({
      name: '',
      description: '',
      category: 'license',
      trigger_type: 'expiration',
      trigger_days: 30,
      severity: 'warning',
      action: 'alert',
      is_active: true
    });
    setShowAddDialog(false);
    toast.success('Compliance rule added');
  };

  const handleToggleRule = (index) => {
    const updated = [...rules];
    updated[index].is_active = !updated[index].is_active;
    setRules(updated);
    toast.success(`Rule ${updated[index].is_active ? 'enabled' : 'disabled'}`);
  };

  const handleDeleteRule = (index) => {
    const updated = rules.filter((_, i) => i !== index);
    setRules(updated);
    toast.success('Rule deleted');
  };

  const handleUpdateRule = (index, field, value) => {
    const updated = [...rules];
    updated[index][field] = value;
    setRules(updated);
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-700 border-red-300';
      case 'warning': return 'bg-amber-100 text-amber-700 border-amber-300';
      case 'info': return 'bg-blue-100 text-blue-700 border-blue-300';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Compliance Rules</h2>
          <p className="text-sm text-slate-500">{rules.filter(r => r.is_active).length} of {rules.length} rules active</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Rule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Compliance Rule</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Rule Name</Label>
                <Input
                  value={newRule.name}
                  onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                  placeholder="e.g., License Expiration Warning"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={newRule.description}
                  onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                  placeholder="Describe what this rule checks..."
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Category</Label>
                  <Select value={newRule.category} onValueChange={(v) => setNewRule({ ...newRule, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {RULE_CATEGORIES.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Trigger Type</Label>
                  <Select value={newRule.trigger_type} onValueChange={(v) => setNewRule({ ...newRule, trigger_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TRIGGER_TYPES.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Days Threshold</Label>
                  <Input
                    type="number"
                    value={newRule.trigger_days}
                    onChange={(e) => setNewRule({ ...newRule, trigger_days: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Severity</Label>
                  <Select value={newRule.severity} onValueChange={(v) => setNewRule({ ...newRule, severity: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="info">Info</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Action</Label>
                  <Select value={newRule.action} onValueChange={(v) => setNewRule({ ...newRule, action: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ACTION_TYPES.map(a => (
                        <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleAddRule} className="w-full bg-purple-600 hover:bg-purple-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Rule
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Rules List */}
      <div className="space-y-3">
        <AnimatePresence>
          {rules.map((rule, idx) => (
            <motion.div
              key={rule.id || idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className={`border-0 shadow-sm ${!rule.is_active ? 'opacity-60' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <Switch
                        checked={rule.is_active}
                        onCheckedChange={() => handleToggleRule(idx)}
                      />
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-slate-800">{rule.name}</p>
                          <Badge variant="outline" className={getSeverityColor(rule.severity)}>
                            {rule.severity}
                          </Badge>
                          <Badge variant="outline" className="bg-slate-50">
                            {RULE_CATEGORIES.find(c => c.value === rule.category)?.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-500">{rule.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {rule.trigger_days} days
                          </span>
                          <span className="flex items-center gap-1">
                            <Settings className="w-3 h-3" />
                            {ACTION_TYPES.find(a => a.value === rule.action)?.label}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Edit className="w-4 h-4 text-slate-400" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-red-400 hover:text-red-600"
                        onClick={() => handleDeleteRule(idx)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}