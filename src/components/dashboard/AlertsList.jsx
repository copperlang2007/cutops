import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, AlertCircle, Info, Check, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

import { SEVERITY_CONFIG } from '../shared/constants';

const severityConfig = {
  critical: { ...SEVERITY_CONFIG.critical, icon: AlertTriangle, badge: SEVERITY_CONFIG.critical.badge + " border-red-200" },
  warning: { ...SEVERITY_CONFIG.warning, icon: AlertCircle, badge: SEVERITY_CONFIG.warning.badge + " border-amber-200" },
  info: { ...SEVERITY_CONFIG.info, icon: Info, badge: SEVERITY_CONFIG.info.badge + " border-blue-200" }
};

export default function AlertsList({ alerts, onResolve, onViewAgent, compact = false }) {
  const unresolvedAlerts = alerts.filter(a => !a.is_resolved);
  
  if (unresolvedAlerts.length === 0) {
    return (
      <Card className="border-0 shadow-sm dark:bg-slate-800 dark:border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white">Active Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-slate-400 dark:text-slate-500">
            <Check className="w-10 h-10 mb-2 text-emerald-400" />
            <p className="text-sm font-medium">No active alerts</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm dark:bg-slate-800 dark:border-slate-700">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white">Active Alerts</CardTitle>
          <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
            {unresolvedAlerts.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <AnimatePresence>
          {unresolvedAlerts.slice(0, compact ? 5 : undefined).map((alert, index) => {
            const config = severityConfig[alert.severity];
            const Icon = config.icon;
            
            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
                className={`p-3 rounded-xl border ${config.bg} ${config.border} dark:bg-opacity-20 dark:border-opacity-40`}
              >
                <div className="flex items-start gap-3">
                  <Icon className={`w-5 h-5 mt-0.5 ${config.iconColor}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-medium text-slate-800 dark:text-white text-sm">{alert.title}</h4>
                      <Badge variant="outline" className={`text-xs ${config.badge}`}>
                        {alert.alert_type.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300 line-clamp-2">{alert.message}</p>
                    {alert.due_date && (
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Due: {format(new Date(alert.due_date), 'MMM d, yyyy')}
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-2">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-7 text-xs text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white"
                        onClick={() => onViewAgent && onViewAgent(alert.agent_id)}
                      >
                        View Agent
                        <ChevronRight className="w-3 h-3 ml-1" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        className="h-7 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
                        onClick={() => onResolve && onResolve(alert)}
                      >
                        <Check className="w-3 h-3 mr-1" />
                        Resolve
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}