import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Plug, RefreshCw, CheckCircle, AlertTriangle, Clock,
  DollarSign, FileText, GraduationCap, Users, Loader2,
  Link2, Unlink
} from 'lucide-react';
import { format } from 'date-fns'
import { toast } from 'sonner'

const CARRIERS = [
  { 
    id: 'humana', 
    name: 'Humana', 
    logo: '🏥',
    color: 'bg-green-500',
    features: ['policies', 'commissions', 'appointments', 'training']
  },
  { 
    id: 'uhc', 
    name: 'UnitedHealthcare', 
    logo: '💙',
    color: 'bg-blue-500',
    features: ['policies', 'commissions', 'appointments', 'training']
  },
  { 
    id: 'aetna', 
    name: 'Aetna', 
    logo: '❤️',
    color: 'bg-purple-500',
    features: ['policies', 'commissions', 'appointments']
  },
  { 
    id: 'cigna', 
    name: 'Cigna', 
    logo: '🧡',
    color: 'bg-orange-500',
    features: ['policies', 'commissions', 'appointments']
  },
  { 
    id: 'anthem', 
    name: 'Anthem BCBS', 
    logo: '💜',
    color: 'bg-indigo-500',
    features: ['policies', 'commissions']
  }
];

export default function CarrierAPIHub({ agentId, onDataSynced }) {
  const [connectedCarriers, setConnectedCarriers] = useState(['humana', 'uhc']);
  const [syncStatus, setSyncStatus] = useState({});
  const [syncResults, setSyncResults] = useState({});
  const [isSyncing, setIsSyncing] = useState(false);

  const connectCarrier = async (carrierId) => {
    // Simulate OAuth connection
    toast.info(`Connecting to ${CARRIERS.find(c => c.id === carrierId)?.name}...`);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setConnectedCarriers(prev => [...prev, carrierId]);
    toast.success(`Connected to ${CARRIERS.find(c => c.id === carrierId)?.name}`);
  };

  const disconnectCarrier = (carrierId) => {
    setConnectedCarriers(prev => prev.filter(id => id !== carrierId));
    toast.info(`Disconnected from ${CARRIERS.find(c => c.id === carrierId)?.name}`);
  };

  const syncCarrierData = async (carrierId, dataType) => {
    const carrier = CARRIERS.find(c => c.id === carrierId);
    setSyncStatus(prev => ({ ...prev, [`${carrierId}_${dataType}`]: 'syncing' }));

    try {
      // Simulate API sync with AI-generated mock data
      await new Promise(resolve => setTimeout(resolve, 2000));

      let result;
      switch (dataType) {
        case 'policies':
          result = {
            synced: Math.floor(Math.random() * 20) + 5,
            new: Math.floor(Math.random() * 5),
            updated: Math.floor(Math.random() * 10),
            errors: 0
          };
          break;
        case 'commissions':
          result = {
            statements: Math.floor(Math.random() * 3) + 1,
            total_amount: Math.floor(Math.random() * 10000) + 5000,
            pending_review: Math.floor(Math.random() * 5),
            discrepancies: Math.floor(Math.random() * 2)
          };
          break;
        case 'appointments':
          result = {
            verified: Math.floor(Math.random() * 5) + 2,
            pending: Math.floor(Math.random() * 3),
            expired: Math.floor(Math.random() * 2),
            new_states: Math.floor(Math.random() * 2)
          };
          break;
        case 'training':
          result = {
            available: Math.floor(Math.random() * 10) + 5,
            completed: Math.floor(Math.random() * 8),
            required: Math.floor(Math.random() * 3) + 1,
            upcoming_deadlines: Math.floor(Math.random() * 2)
          };
          break;
      }

      setSyncResults(prev => ({ 
        ...prev, 
        [`${carrierId}_${dataType}`]: {
          ...result,
          timestamp: new Date().toISOString()
        }
      }));
      setSyncStatus(prev => ({ ...prev, [`${carrierId}_${dataType}`]: 'success' }));
      toast.success(`${carrier.name} ${dataType} synced`);
      onDataSynced?.();
    } catch (err) {
      setSyncStatus(prev => ({ ...prev, [`${carrierId}_${dataType}`]: 'error' }));
      toast.error(`Failed to sync ${dataType}`);
    }
  };

  const syncAllCarriers = async () => {
    setIsSyncing(true);
    for (const carrierId of connectedCarriers) {
      const carrier = CARRIERS.find(c => c.id === carrierId);
      for (const feature of carrier.features) {
        await syncCarrierData(carrierId, feature);
      }
    }
    setIsSyncing(false);
    toast.success('All carrier data synced');
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'syncing': return <Loader2 className="w-3 h-3 animate-spin text-blue-500" />;
      case 'success': return <CheckCircle className="w-3 h-3 text-emerald-500" />;
      case 'error': return <AlertTriangle className="w-3 h-3 text-red-500" />;
      default: return <Clock className="w-3 h-3 text-slate-400" />;
    }
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Plug className="w-5 h-5 text-blue-600" />
            Carrier API Hub
          </CardTitle>
          <Button
            size="sm"
            onClick={syncAllCarriers}
            disabled={isSyncing || connectedCarriers.length === 0}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            <span className="ml-1">Sync All</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="connections">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="connections">Connections</TabsTrigger>
            <TabsTrigger value="sync">Sync Status</TabsTrigger>
            <TabsTrigger value="data">Data</TabsTrigger>
          </TabsList>

          <TabsContent value="connections" className="space-y-2">
            {CARRIERS.map(carrier => {
              const isConnected = connectedCarriers.includes(carrier.id);
              return (
                <div key={carrier.id} className={`p-3 rounded-lg border ${
                  isConnected ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg ${carrier.color} flex items-center justify-center text-xl`}>
                        {carrier.logo}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-700">{carrier.name}</p>
                        <div className="flex gap-1 mt-0.5">
                          {carrier.features.map(f => (
                            <Badge key={f} variant="outline" className="text-[10px]">{f}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant={isConnected ? "outline" : "default"}
                      onClick={() => isConnected ? disconnectCarrier(carrier.id) : connectCarrier(carrier.id)}
                    >
                      {isConnected ? (
                        <>
                          <Unlink className="w-3 h-3 mr-1" />
                          Disconnect
                        </>
                      ) : (
                        <>
                          <Link2 className="w-3 h-3 mr-1" />
                          Connect
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </TabsContent>

          <TabsContent value="sync" className="space-y-3">
            {connectedCarriers.map(carrierId => {
              const carrier = CARRIERS.find(c => c.id === carrierId);
              return (
                <div key={carrierId} className="p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{carrier.logo}</span>
                    <span className="text-sm font-medium">{carrier.name}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {carrier.features.map(feature => {
                      const status = syncStatus[`${carrierId}_${feature}`];
                      const result = syncResults[`${carrierId}_${feature}`];
                      return (
                        <div key={feature} className="p-2 bg-white rounded border">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs capitalize text-slate-600">{feature}</span>
                            {getStatusIcon(status)}
                          </div>
                          {result && (
                            <p className="text-[10px] text-slate-400">
                              {format(new Date(result.timestamp), 'h:mm a')}
                            </p>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 text-xs w-full mt-1"
                            onClick={() => syncCarrierData(carrierId, feature)}
                            disabled={status === 'syncing'}
                          >
                            Sync
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            {connectedCarriers.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-4">
                Connect carriers to start syncing data
              </p>
            )}
          </TabsContent>

          <TabsContent value="data" className="space-y-3">
            {Object.entries(syncResults).map(([key, data]) => {
              const [carrierId, dataType] = key.split('_');
              const carrier = CARRIERS.find(c => c.id === carrierId);
              return (
                <div key={key} className="p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span>{carrier?.logo}</span>
                    <span className="text-sm font-medium capitalize">{carrier?.name} - {dataType}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(data).filter(([k]) => k !== 'timestamp').map(([k, v]) => (
                      <div key={k} className="p-2 bg-white rounded">
                        <p className="text-xs text-slate-500 capitalize">{k.replace('_', ' ')}</p>
                        <p className="text-sm font-medium text-slate-700">
                          {typeof v === 'number' && k.includes('amount') ? `$${v.toLocaleString()}` : v}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            {Object.keys(syncResults).length === 0 && (
              <p className="text-sm text-slate-400 text-center py-4">
                Sync carriers to see data here
              </p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}