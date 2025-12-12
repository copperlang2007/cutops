import { base44 } from '@/api/base44Client'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, AlertTriangle, CheckCircle, Award } from 'lucide-react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { createPageUrl } from '@/utils'

export default function CarrierPerformanceDashboard() {
  const { data: carriers = [] } = useQuery({
    queryKey: ['carriers'],
    queryFn: () => base44.entities.Carrier.list()
  });

  const { data: contracts = [] } = useQuery({
    queryKey: ['contracts'],
    queryFn: () => base44.entities.Contract.list()
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => base44.entities.CarrierAppointment.list()
  });

  // Calculate carrier performance metrics
  const carrierMetrics = carriers.map(carrier => {
    const carrierContracts = contracts.filter(c => c.carrier_id === carrier.id);
    const activeContracts = carrierContracts.filter(c => c.contract_status === 'active').length;
    const expiringContracts = carrierContracts.filter(c => {
      if (!c.expiration_date) return false;
      const daysUntil = Math.floor((new Date(c.expiration_date) - new Date()) / (1000 * 60 * 60 * 24));
      return daysUntil > 0 && daysUntil <= 90;
    }).length;

    const carrierAppointments = appointments.filter(a => a.carrier_name === carrier.name);
    const activeAppointments = carrierAppointments.filter(a => a.status === 'active').length;

    // Simple health score calculation
    let healthScore = 70; // Base score
    if (activeContracts > 0) healthScore += 15;
    if (expiringContracts === 0) healthScore += 10;
    if (activeAppointments > 5) healthScore += 5;

    const hasRisk = expiringContracts > 0;

    return {
      carrier,
      activeContracts,
      expiringContracts,
      activeAppointments,
      healthScore: Math.min(healthScore, 100),
      hasRisk
    };
  });

  // Sort by health score (ascending to show risky carriers first)
  const sortedCarriers = [...carrierMetrics].sort((a, b) => a.healthScore - b.healthScore);
  const topRiskCarriers = sortedCarriers.filter(c => c.hasRisk).slice(0, 5);

  const getHealthColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  const getHealthBadge = (score) => {
    if (score >= 80) return { color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', label: 'Healthy' };
    if (score >= 60) return { color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', label: 'Monitor' };
    return { color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', label: 'At Risk' };
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="clay-subtle border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Total Carriers</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white">{carriers.length}</p>
                </div>
                <Award className="w-10 h-10 text-teal-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="clay-subtle border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Active Contracts</p>
                  <p className="text-3xl font-bold text-green-600">
                    {contracts.filter(c => c.contract_status === 'active').length}
                  </p>
                </div>
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="clay-subtle border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">At Risk</p>
                  <p className="text-3xl font-bold text-red-600">{topRiskCarriers.length}</p>
                </div>
                <AlertTriangle className="w-10 h-10 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="clay-subtle border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Avg Health</p>
                  <p className={`text-3xl font-bold ${getHealthColor(Math.round(carrierMetrics.reduce((sum, c) => sum + c.healthScore, 0) / carrierMetrics.length))}`}>
                    {Math.round(carrierMetrics.reduce((sum, c) => sum + c.healthScore, 0) / carrierMetrics.length)}
                  </p>
                </div>
                <TrendingUp className={`w-10 h-10 ${getHealthColor(Math.round(carrierMetrics.reduce((sum, c) => sum + c.healthScore, 0) / carrierMetrics.length))}`} />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* At-Risk Carriers */}
      {topRiskCarriers.length > 0 && (
        <Card className="clay-morphism border-0 border-l-4 border-l-red-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Carriers Requiring Attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topRiskCarriers.map((metric, idx) => {
                const badge = getHealthBadge(metric.healthScore);
                return (
                  <Link 
                    key={metric.carrier.id}
                    to={`${createPageUrl('CarrierDetail')}?id=${metric.carrier.id}`}
                  >
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="p-4 rounded-lg clay-subtle hover:shadow-lg transition-all cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <p className="font-semibold text-slate-900 dark:text-white">
                              {metric.carrier.name}
                            </p>
                            <Badge className={badge.color}>
                              {badge.label}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-3 text-sm text-slate-600 dark:text-slate-400">
                            <span className="flex items-center gap-1">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              {metric.activeContracts} active
                            </span>
                            {metric.expiringContracts > 0 && (
                              <span className="flex items-center gap-1">
                                <AlertTriangle className="w-4 h-4 text-amber-600" />
                                {metric.expiringContracts} expiring soon
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              {metric.activeAppointments} appointments
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-2xl font-bold ${getHealthColor(metric.healthScore)}`}>
                            {metric.healthScore}
                          </p>
                          <p className="text-xs text-slate-500">Health Score</p>
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}