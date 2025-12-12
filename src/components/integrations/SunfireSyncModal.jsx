import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, Loader2, Zap } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

const CARRIERS = [
  { name: 'Humana', code: 'HUM' },
  { name: 'UnitedHealthcare', code: 'UHC' },
  { name: 'Aetna', code: 'AET' },
  { name: 'Cigna', code: 'CIG' },
  { name: 'Anthem', code: 'ANT' },
  { name: 'WellCare', code: 'WLC' }
];

export default function SunfireSyncModal({ open, onClose, agent, onComplete }) {
  const [status, setStatus] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);
  const [currentCarrier, setCurrentCarrier] = useState('');

  const handleSync = async () => {
    setStatus('syncing');
    setProgress(0);

    const syncedCarriers = [];
    const totalCarriers = CARRIERS.length;

    for (let i = 0; i < totalCarriers; i++) {
      setCurrentCarrier(CARRIERS[i].name);
      await new Promise(resolve => setTimeout(resolve, 600));
      setProgress(((i + 1) / totalCarriers) * 100);

      // Random appointment status
      if (Math.random() > 0.3) {
        syncedCarriers.push({
          ...CARRIERS[i],
          appointed: Math.random() > 0.4,
          rts: Math.random() > 0.5 ? 'ready_to_sell' : 'pending_training',
          states: ['CA', 'TX', 'FL', 'NY', 'AZ'].slice(0, Math.floor(Math.random() * 4) + 1)
        });
      }
    }

    setResults({
      carriers_synced: syncedCarriers.length,
      carriers_appointed: syncedCarriers.filter(c => c.appointed).length,
      carriers_rts: syncedCarriers.filter(c => c.rts === 'ready_to_sell').length,
      carriers: syncedCarriers
    });
    setStatus('complete');
    setCurrentCarrier('');
  };

  const handleClose = () => {
    if (results && onComplete) {
      onComplete(results);
    }
    setStatus('idle');
    setProgress(0);
    setResults(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-orange-500" />
            Sunfire Appointment Sync
          </DialogTitle>
          <DialogDescription>
            Sync carrier appointment and RTS status from Sunfire for {agent?.first_name} {agent?.last_name}
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          <AnimatePresence mode="wait">
            {status === 'idle' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center space-y-4"
              >
                <div className="w-16 h-16 mx-auto bg-orange-100 rounded-full flex items-center justify-center">
                  <Zap className="w-8 h-8 text-orange-500" />
                </div>
                <div>
                  <p className="font-medium text-slate-800">Ready to sync</p>
                  <p className="text-sm text-slate-500 mt-1">
                    Checking {CARRIERS.length} carriers
                  </p>
                </div>
              </motion.div>
            )}

            {status === 'syncing' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                </div>
                <Progress value={progress} className="h-2" />
                <p className="text-center text-sm text-slate-600">
                  Checking {currentCarrier}...
                </p>
              </motion.div>
            )}

            {status === 'complete' && results && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto bg-emerald-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-emerald-600" />
                  </div>
                  <p className="mt-3 font-medium text-slate-800">Sync Complete</p>
                </div>

                <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Carriers Found</span>
                    <span className="font-semibold text-slate-800">{results.carriers_synced}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Appointed</span>
                    <span className="font-semibold text-emerald-600">{results.carriers_appointed}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Ready to Sell</span>
                    <span className="font-semibold text-emerald-600">{results.carriers_rts}</span>
                  </div>
                </div>

                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {results.carriers.map((carrier, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-white rounded-lg border">
                      <span className="text-sm font-medium text-slate-700">{carrier.name}</span>
                      <div className="flex items-center gap-2">
                        {carrier.appointed ? (
                          <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                            Appointed
                          </span>
                        ) : (
                          <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                            Pending
                          </span>
                        )}
                        {carrier.rts === 'ready_to_sell' && (
                          <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                            RTS
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <DialogFooter>
          {status === 'idle' && (
            <>
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              <Button onClick={handleSync} className="bg-orange-500 hover:bg-orange-600">
                Start Sync
              </Button>
            </>
          )}
          {status === 'complete' && (
            <Button onClick={handleClose} className="bg-teal-600 hover:bg-teal-700">
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}