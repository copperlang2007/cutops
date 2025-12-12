import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { WifiOff, Wifi, RefreshCw, Database, Upload } from 'lucide-react';
import { toast } from 'sonner';

export default function OfflineManager() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSync, setPendingSync] = useState({ interactions: 0, documents: 0 });
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Back online');
      syncOfflineData();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('You are offline. Changes will sync when connection is restored.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check pending items
    checkPendingSync();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const checkPendingSync = async () => {
    try {
      const db = await openIndexedDB();
      const interactions = await getCount(db, 'interactions');
      const documents = await getCount(db, 'documents');
      setPendingSync({ interactions, documents });
    } catch (error) {
      console.error('Error checking pending sync:', error);
    }
  };

  const syncOfflineData = async () => {
    if (!isOnline || syncing) return;

    setSyncing(true);
    try {
      if ('serviceWorker' in navigator && 'SyncManager' in window) {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register('sync-interactions');
        await registration.sync.register('sync-documents');
        toast.success('Syncing offline data...');
      }
      
      // Recheck pending after a delay
      setTimeout(checkPendingSync, 2000);
    } catch (error) {
      console.error('Sync error:', error);
      toast.error('Failed to sync offline data');
    } finally {
      setSyncing(false);
    }
  };

  const openIndexedDB = () => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('AgentHubOffline', 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  };

  const getCount = (db, storeName) => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  };

  const totalPending = pendingSync.interactions + pendingSync.documents;

  if (isOnline && totalPending === 0) return null;

  return (
    <Card className="border-0 shadow-sm dark:bg-slate-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {isOnline ? (
              <Wifi className="w-5 h-5 text-green-600" />
            ) : (
              <WifiOff className="w-5 h-5 text-amber-600" />
            )}
            {isOnline ? 'Online' : 'Offline Mode'}
          </CardTitle>
          {totalPending > 0 && (
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
              {totalPending} pending
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isOnline && (
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Changes are being saved locally and will sync when you're back online.
          </p>
        )}

        {totalPending > 0 && (
          <div className="space-y-2">
            {pendingSync.interactions > 0 && (
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-slate-400" />
                  <span>Interactions</span>
                </div>
                <Badge variant="secondary">{pendingSync.interactions}</Badge>
              </div>
            )}
            {pendingSync.documents > 0 && (
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Upload className="w-4 h-4 text-slate-400" />
                  <span>Documents</span>
                </div>
                <Badge variant="secondary">{pendingSync.documents}</Badge>
              </div>
            )}
          </div>
        )}

        {isOnline && totalPending > 0 && (
          <Button
            onClick={syncOfflineData}
            disabled={syncing}
            className="w-full bg-teal-600 hover:bg-teal-700"
          >
            {syncing ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Sync Now
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}