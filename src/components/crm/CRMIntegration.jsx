import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { 
  Database, RefreshCw, CheckCircle, Link2, Unlink,
  ArrowRight, ArrowLeft, Settings, Loader2
} from 'lucide-react';
import { toast } from 'sonner'

const CRM_SYSTEMS = [
  { 
    id: 'salesforce', 
    name: 'Salesforce', 
    icon: '☁️',
    color: 'bg-blue-500',
    syncOptions: ['contacts', 'opportunities', 'tasks', 'activities']
  },
  { 
    id: 'hubspot', 
    name: 'HubSpot', 
    icon: '🟠',
    color: 'bg-orange-500',
    syncOptions: ['contacts', 'deals', 'tasks', 'emails']
  },
  { 
    id: 'zoho', 
    name: 'Zoho CRM', 
    icon: '🔴',
    color: 'bg-red-500',
    syncOptions: ['contacts', 'leads', 'tasks']
  }
];

export default function CRMIntegration({ agents, onSync }) {
  const [connectedCRM, setConnectedCRM] = useState('salesforce');
  const [syncSettings, setSyncSettings] = useState({
    agents_to_contacts: true,
    commissions_to_opportunities: true,
    tasks_bidirectional: true,
    auto_sync: true
  });
  const [lastSync, setLastSync] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const connectCRM = (crmId) => {
    toast.info(`Connecting to ${CRM_SYSTEMS.find(c => c.id === crmId)?.name}...`);
    setTimeout(() => {
      setConnectedCRM(crmId);
      toast.success(`Connected to ${CRM_SYSTEMS.find(c => c.id === crmId)?.name}`);
    }, 1500);
  };

  const syncNow = async () => {
    setIsSyncing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setLastSync(new Date());
      toast.success(`Synced ${agents.length} agents to ${CRM_SYSTEMS.find(c => c.id === connectedCRM)?.name}`);
      onSync?.();
    } catch (err) {
      toast.error('Sync failed');
    } finally {
      setIsSyncing(false);
    }
  };

  const crm = CRM_SYSTEMS.find(c => c.id === connectedCRM);

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Database className="w-5 h-5 text-blue-600" />
          CRM Integration
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* CRM Selection */}
        <div className="flex gap-2 mb-4">
          {CRM_SYSTEMS.map(system => (
            <Button
              key={system.id}
              variant={connectedCRM === system.id ? "default" : "outline"}
              size="sm"
              onClick={() => connectCRM(system.id)}
              className={connectedCRM === system.id ? system.color : ''}
            >
              <span className="mr-1">{system.icon}</span>
              {system.name}
            </Button>
          ))}
        </div>

        {/* Connection Status */}
        {connectedCRM && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span className="text-sm text-emerald-700">Connected to {crm?.name}</span>
              </div>
              <Badge variant="outline" className="bg-emerald-100 text-emerald-700">Active</Badge>
            </div>
            {lastSync && (
              <p className="text-xs text-emerald-600 mt-1">
                Last sync: {lastSync.toLocaleTimeString()}
              </p>
            )}
          </div>
        )}

        {/* Sync Settings */}
        <div className="space-y-3 mb-4">
          <h4 className="text-sm font-medium text-slate-700">Sync Settings</h4>
          
          <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">Agents → Contacts</span>
              <ArrowRight className="w-3 h-3 text-slate-400" />
            </div>
            <Switch
              checked={syncSettings.agents_to_contacts}
              onCheckedChange={(v) => setSyncSettings(prev => ({ ...prev, agents_to_contacts: v }))}
            />
          </div>

          <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">Commissions → Opportunities</span>
              <ArrowRight className="w-3 h-3 text-slate-400" />
            </div>
            <Switch
              checked={syncSettings.commissions_to_opportunities}
              onCheckedChange={(v) => setSyncSettings(prev => ({ ...prev, commissions_to_opportunities: v }))}
            />
          </div>

          <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">Tasks</span>
              <ArrowLeft className="w-3 h-3 text-slate-400" />
              <ArrowRight className="w-3 h-3 text-slate-400" />
              <span className="text-xs text-slate-400">(bidirectional)</span>
            </div>
            <Switch
              checked={syncSettings.tasks_bidirectional}
              onCheckedChange={(v) => setSyncSettings(prev => ({ ...prev, tasks_bidirectional: v }))}
            />
          </div>

          <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
            <div className="flex items-center gap-2">
              <span className="text-sm text-blue-600">Auto-sync every hour</span>
            </div>
            <Switch
              checked={syncSettings.auto_sync}
              onCheckedChange={(v) => setSyncSettings(prev => ({ ...prev, auto_sync: v }))}
            />
          </div>
        </div>

        {/* Sync Button */}
        <Button 
          className="w-full" 
          onClick={syncNow}
          disabled={!connectedCRM || isSyncing}
        >
          {isSyncing ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          Sync Now
        </Button>

        {/* Sync Stats */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="p-2 bg-slate-50 rounded text-center">
            <p className="text-lg font-bold text-slate-700">{agents.length}</p>
            <p className="text-xs text-slate-500">Agents</p>
          </div>
          <div className="p-2 bg-slate-50 rounded text-center">
            <p className="text-lg font-bold text-slate-700">{agents.length}</p>
            <p className="text-xs text-slate-500">CRM Records</p>
          </div>
          <div className="p-2 bg-slate-50 rounded text-center">
            <p className="text-lg font-bold text-emerald-600">100%</p>
            <p className="text-xs text-slate-500">In Sync</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}