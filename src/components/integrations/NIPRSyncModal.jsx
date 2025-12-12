import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, AlertTriangle, Loader2, Shield } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export default function NIPRSyncModal({ open, onClose, agent, onComplete }) {
  const [status, setStatus] = useState('idle'); // idle, syncing, complete, error
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);

  const handleSync = async () => {
    setStatus('syncing');
    setProgress(0);

    // Simulate NIPR API sync with progress
    const steps = [
      { progress: 20, message: 'Connecting to NIPR...' },
      { progress: 40, message: 'Verifying NPN...' },
      { progress: 60, message: 'Fetching license data...' },
      { progress: 80, message: 'Checking for adverse actions...' },
      { progress: 100, message: 'Sync complete' }
    ];

    for (const step of steps) {
      await new Promise(resolve => setTimeout(resolve, 800));
      setProgress(step.progress);
    }

    // Simulate results
    const mockResults = {
      licenses_found: Math.floor(Math.random() * 5) + 1,
      licenses_updated: Math.floor(Math.random() * 3) + 1,
      adverse_actions: Math.random() > 0.8,
      states: ['CA', 'TX', 'FL', 'NY', 'AZ'].slice(0, Math.floor(Math.random() * 4) + 1)
    };

    setResults(mockResults);
    setStatus('complete');
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
            <Shield className="w-5 h-5 text-teal-600" />
            NIPR License Sync
          </DialogTitle>
          <DialogDescription>
            Sync license data from the National Insurance Producer Registry for {agent?.first_name} {agent?.last_name}
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
                <div className="w-16 h-16 mx-auto bg-teal-100 rounded-full flex items-center justify-center">
                  <Shield className="w-8 h-8 text-teal-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-800">Ready to sync</p>
                  <p className="text-sm text-slate-500 mt-1">
                    NPN: {agent?.npn}
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
                  <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
                </div>
                <Progress value={progress} className="h-2" />
                <p className="text-center text-sm text-slate-600">
                  {progress < 100 ? 'Syncing with NIPR...' : 'Processing results...'}
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
                    <span className="text-slate-600">Licenses Found</span>
                    <span className="font-semibold text-slate-800">{results.licenses_found}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Licenses Updated</span>
                    <span className="font-semibold text-slate-800">{results.licenses_updated}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">States</span>
                    <span className="font-semibold text-slate-800">{results.states.join(&apos;, &apos;)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Adverse Actions</span>
                    {results.adverse_actions ? (
                      <span className="font-semibold text-red-600 flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4" />
                        Found
                      </span>
                    ) : (
                      <span className="font-semibold text-emerald-600">None</span>
                    )}
                  </div>
                </div>

                {results.adverse_actions && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                      <div>
                        <p className="font-medium text-red-800">Adverse Action Detected</p>
                        <p className="text-sm text-red-600 mt-1">
                          Review the agent's license history for regulatory actions.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <DialogFooter>
          {status === 'idle' && (
            <>
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              <Button onClick={handleSync} className="bg-teal-600 hover:bg-teal-700">
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