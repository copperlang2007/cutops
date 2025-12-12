import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronRight, Shield, Building2, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import AgentCarrierBadges from './AgentCarrierBadges';

const statusConfig = {
  ready_to_sell: { label: 'Ready to Sell', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  in_progress: { label: 'In Progress', color: 'bg-teal-100 text-teal-700 border-teal-200', dot: 'bg-teal-500' },
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  suspended: { label: 'Suspended', color: 'bg-red-100 text-red-700 border-red-200', dot: 'bg-red-500' },
  terminated: { label: 'Terminated', color: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400' }
};

export default function AgentCard({ agent, licenseCount, appointmentCount, alertCount, appointments = [], onClick }) {
  const status = statusConfig[agent.onboarding_status] || statusConfig.pending;
  const initials = `${agent.first_name?.[0] || ''}${agent.last_name?.[0] || ''}`.toUpperCase();

  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.2 }}
    >
      <Card 
        className="clay-morphism relative overflow-hidden cursor-pointer group"
        onClick={onClick}
      >
        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-teal-50/0 via-teal-50/0 to-teal-50/50 dark:from-teal-900/0 dark:via-teal-900/0 dark:to-teal-900/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <div className="relative p-5">
          <div className="flex items-start gap-4">
            {/* Avatar with status indicator */}
            <div className="relative">
              <Avatar className="w-13 h-13 border-2 border-white shadow-md group-hover:shadow-lg transition-shadow">
                <AvatarImage src={agent.photo_url} />
                <AvatarFallback className="bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 text-white font-semibold text-sm">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {/* Status dot */}
              <motion.span 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 ${status.dot} rounded-full border-2 border-white shadow-sm`}
              />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h3 className="font-semibold text-slate-800 dark:text-white group-hover:text-teal-700 dark:group-hover:text-teal-400 transition-colors">
                  {agent.first_name} {agent.last_name}
                </h3>
                {alertCount > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="relative"
                  >
                    <Badge className="bg-red-100 text-red-700 border border-red-200 shadow-sm">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      {alertCount}
                    </Badge>
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full animate-ping" />
                  </motion.div>
                )}
              </div>
              
              <div className="flex items-center gap-2 mb-2">
                <Badge className={`${status.color} font-medium shadow-sm`}>
                  {status.label}
                </Badge>
                <span className="text-xs text-slate-400 dark:text-slate-500">NPN: {agent.npn}</span>
              </div>

              {appointments.length > 0 && (
                <div className="mb-3">
                  <AgentCarrierBadges appointments={appointments} maxDisplay={2} showRtsStatus={false} />
                </div>
              )}
              
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-teal-50/50 dark:bg-teal-900/30">
                  <Shield className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  <span className="text-teal-700 dark:text-teal-300 font-medium">{licenseCount} License{licenseCount !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-700">
                  <Building2 className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  <span className="text-slate-600 dark:text-slate-300 font-medium">{appointmentCount} Carrier{appointmentCount !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>
            
            <motion.div 
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100/0 group-hover:bg-teal-100 dark:group-hover:bg-teal-900/50 transition-colors"
              whileHover={{ x: 3 }}
            >
              <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors" />
            </motion.div>
          </div>
        </div>
        
        {/* Bottom accent line */}
        <motion.div 
          className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-teal-400 to-emerald-400"
          initial={{ width: 0 }}
          whileHover={{ width: '100%' }}
          transition={{ duration: 0.3 }}
        />
      </Card>
    </motion.div>
  );
}