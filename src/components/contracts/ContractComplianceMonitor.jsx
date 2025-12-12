import { base44 } from '@/api/base44Client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Shield, AlertTriangle, CheckCircle, RefreshCw, Loader2, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

export default function ContractComplianceMonitor({ agentId }) {
  const queryClient = useQueryClient();

  const { data: contracts = [] } = useQuery({
    queryKey: ['contracts', agentId],
    queryFn: () => agentId 
      ? base44.entities.Contract.filter({ agent_id: agentId })
      : base44.entities.Contract.list(),
    enabled: !!agentId
  });

  const monitorMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('aiContractIntelligence', {
        action: 'monitor_compliance'
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['contracts']);
      queryClient.invalidateQueries(['alerts']);
      toast.success(`Monitored ${data.total_contracts} contracts, found ${data.issues_found} issues`);
    },
    onError: () => {
      toast.error('Failed to monitor contracts');
    }
  });

  // Calculate stats
  const today = new Date();
  const expiringIn30 = contracts.filter(c => {
    if (!c.expiration_date || c.status !== 'active') return false;
    const days = Math.ceil((new Date(c.expiration_date) - today) / (1000 * 60 * 60 * 24));
    return days > 0 && days <= 30;
  }).length;

  const expiringIn90 = contracts.filter(c => {
    if (!c.expiration_date || c.status !== 'active') return false;
    const days = Math.ceil((new Date(c.expiration_date) - today) / (1000 * 60 * 60 * 24));
    return days > 0 && days <= 90;
  }).length;

  const expired = contracts.filter(c => c.status === 'expired').length;
  const active = contracts.filter(c => c.status === 'active').length;

  return (
    <Card className="clay-morphism border-0">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-teal-600" />
            Contract Compliance Monitor
          </CardTitle>
          <Button
            onClick={() => monitorMutation.mutate()}
            disabled={monitorMutation.isPending}
            variant="outline"
            size="sm"
          >
            {monitorMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="clay-subtle rounded-xl p-4 text-center"
          >
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{active}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Active Contracts</p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="clay-subtle rounded-xl p-4 text-center"
          >
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 rounded-full bg-amber-100 dark:bg-amber-900/30">
              <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{expiringIn30}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Expiring in 30 Days</p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="clay-subtle rounded-xl p-4 text-center"
          >
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 rounded-full bg-orange-100 dark:bg-orange-900/30">
              <FileText className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{expiringIn90}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Expiring in 90 Days</p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="clay-subtle rounded-xl p-4 text-center"
          >
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 rounded-full bg-red-100 dark:bg-red-900/30">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{expired}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Expired</p>
          </motion.div>
        </div>

        {(expiringIn30 > 0 || expired > 0) && (
          <div className="mt-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-900 dark:text-amber-300">
                  Action Required
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  {expiringIn30 > 0 && `${expiringIn30} contract${expiringIn30 > 1 ? 's' : ''} expiring soon. `}
                  {expired > 0 && `${expired} contract${expired > 1 ? 's' : ''} expired.`}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}