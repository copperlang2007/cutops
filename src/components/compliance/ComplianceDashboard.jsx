import { base44 } from '@/api/base44Client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Shield, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

export default function ComplianceDashboard() {
  const queryClient = useQueryClient();

  const { data: flags = [] } = useQuery({
    queryKey: ['complianceFlags'],
    queryFn: () => base44.entities.ComplianceFlag.list('-created_date', 100)
  });

  const updateFlagMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ComplianceFlag.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['complianceFlags']);
      toast.success('Flag updated');
    }
  });

  const pendingFlags = flags.filter(f => f.status === 'pending_review');
  const criticalFlags = flags.filter(f => f.severity === 'critical');
  const resolvedFlags = flags.filter(f => ['corrected', 'dismissed'].includes(f.status));

  const violationTypes = flags.reduce((acc, flag) => {
    acc[flag.violation_type] = (acc[flag.violation_type] || 0) + 1;
    return acc;
  }, {});

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-700';
      case 'high': return 'bg-orange-100 text-orange-700';
      case 'medium': return 'bg-amber-100 text-amber-700';
      default: return 'bg-blue-100 text-blue-700';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'corrected': return 'bg-green-100 text-green-700';
      case 'dismissed': return 'bg-slate-100 text-slate-700';
      case 'escalated': return 'bg-red-100 text-red-700';
      default: return 'bg-amber-100 text-amber-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Pending Review', value: pendingFlags.length, icon: Clock, color: 'amber' },
          { label: 'Critical Issues', value: criticalFlags.length, icon: AlertTriangle, color: 'red' },
          { label: 'Resolved', value: resolvedFlags.length, icon: CheckCircle, color: 'green' },
          { label: 'Total Flags', value: flags.length, icon: Shield, color: 'purple' }
        ].map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            whileHover={{ y: -4, scale: 1.02 }}
          >
            <Card className="clay-morphism border-0">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{stat.label}</p>
                    <p className={`text-3xl font-bold text-${stat.color}-600 dark:text-${stat.color}-400`}>
                      {stat.value}
                    </p>
                  </div>
                  <div className={`w-12 h-12 rounded-2xl clay-morphism bg-gradient-to-br from-${stat.color}-400 to-${stat.color}-600 flex items-center justify-center shadow-lg`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList className="clay-morphism p-1.5 rounded-2xl">
          <TabsTrigger value="pending" className="rounded-xl data-[state=active]:clay-morphism data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg">
            Pending Review
            {pendingFlags.length > 0 && (
              <Badge className="ml-2 bg-amber-600">{pendingFlags.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="critical" className="rounded-xl data-[state=active]:clay-morphism data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg">
            Critical
          </TabsTrigger>
          <TabsTrigger value="all" className="rounded-xl data-[state=active]:clay-morphism data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg">
            All Flags
          </TabsTrigger>
          <TabsTrigger value="analytics" className="rounded-xl data-[state=active]:clay-morphism data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg">
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <div className="space-y-3">
            {pendingFlags.length === 0 ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="py-12 text-center">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-600" />
                  <p className="text-slate-500">No pending flags. All clear!</p>
                </CardContent>
              </Card>
            ) : (
              pendingFlags.map((flag, idx) => (
                <motion.div
                  key={flag.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  whileHover={{ y: -2 }}
                >
                  <Card className="clay-morphism border-0">
                    <CardContent className="pt-6 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getSeverityColor(flag.severity)}>{flag.severity}</Badge>
                          <Badge variant="outline">{flag.violation_type.replace(/_/g, ' ')}</Badge>
                          <Badge variant="outline">{flag.source_type}</Badge>
                        </div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white mb-2">
                          {flag.description}
                        </p>
                        <p className="text-xs text-slate-500 mb-2">{flag.regulation_reference}</p>
                      </div>
                      <Badge variant="outline">{flag.confidence_score}% confidence</Badge>
                    </div>

                    <div className="p-2 rounded bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                      <p className="text-xs font-medium text-red-900 dark:text-red-200 mb-1">Flagged Content:</p>
                      <p className="text-sm text-red-700 dark:text-red-300">"{flag.flagged_content}"</p>
                    </div>

                    {flag.suggested_replacement && (
                      <div className="p-2 rounded bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                        <p className="text-xs font-medium text-green-900 dark:text-green-200 mb-1">Suggested:</p>
                        <p className="text-sm text-green-700 dark:text-green-300">"{flag.suggested_replacement}"</p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => updateFlagMutation.mutate({
                          id: flag.id,
                          data: { status: 'acknowledged', reviewed_by: 'current_user', reviewed_date: new Date().toISOString() }
                        })}
                        variant="outline"
                      >
                        Acknowledge
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => updateFlagMutation.mutate({
                          id: flag.id,
                          data: { status: 'corrected', reviewed_by: 'current_user', reviewed_date: new Date().toISOString() }
                        })}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Mark Corrected
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => updateFlagMutation.mutate({
                          id: flag.id,
                          data: { status: 'dismissed', reviewed_by: 'current_user', reviewed_date: new Date().toISOString() }
                        })}
                        variant="ghost"
                      >
                        Dismiss
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                </motion.div>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="critical">
          <div className="space-y-3">
            {criticalFlags.map((flag) => (
              <Card key={flag.id} className="border-2 border-red-300">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <Badge className="bg-red-100 text-red-700 mb-2">CRITICAL</Badge>
                      <p className="font-medium text-slate-900 dark:text-white">{flag.description}</p>
                      <p className="text-sm text-slate-500 mt-1">{format(new Date(flag.created_date), 'MMM d, yyyy h:mm a')}</p>
                    </div>
                    <Badge className={getStatusColor(flag.status)}>{flag.status.replace(/_/g, ' ')}</Badge>
                  </div>
                  <p className="text-sm text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                    "{flag.flagged_content}"
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="all">
          <div className="space-y-2">
            {flags.map((flag) => (
              <Card key={flag.id} className="border-0 shadow-sm">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge className={getSeverityColor(flag.severity)}>{flag.severity}</Badge>
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{flag.description}</p>
                        <p className="text-xs text-slate-500">{format(new Date(flag.created_date), 'MMM d, yyyy')}</p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(flag.status)}>{flag.status.replace(/_/g, ' ')}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Violations by Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(violationTypes).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <span className="text-sm text-slate-700 dark:text-slate-300">{type.replace(/_/g, ' ')}</span>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Compliance Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-5xl font-bold text-green-600 mb-2">
                    {Math.round((resolvedFlags.length / Math.max(flags.length, 1)) * 100)}%
                  </p>
                  <p className="text-sm text-slate-500">Flags Resolved</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}