import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CheckCircle, Clock, XCircle } from 'lucide-react';

const rtsConfig = {
  ready_to_sell: { icon: CheckCircle, color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  pending_training: { icon: Clock, color: 'bg-amber-100 text-amber-700 border-amber-200' },
  pending_certification: { icon: Clock, color: 'bg-amber-100 text-amber-700 border-amber-200' },
  not_ready: { icon: XCircle, color: 'bg-slate-100 text-slate-600 border-slate-200' },
  expired: { icon: XCircle, color: 'bg-red-100 text-red-700 border-red-200' }
};

export default function AgentCarrierBadges({ appointments, maxDisplay = 3, showRtsStatus = true }) {
  if (!appointments || appointments.length === 0) {
    return <span className="text-xs text-slate-400">No carriers</span>;
  }

  const displayedAppointments = appointments.slice(0, maxDisplay);
  const remainingCount = appointments.length - maxDisplay;

  return (
    <TooltipProvider>
      <div className="flex flex-wrap gap-1">
        {displayedAppointments.map((appt, idx) => {
          const config = rtsConfig[appt.rts_status] || rtsConfig.not_ready;
          const Icon = config.icon;
          
          return (
            <Tooltip key={idx}>
              <TooltipTrigger asChild>
                <Badge 
                  variant="outline" 
                  className={`text-xs cursor-default ${showRtsStatus ? config.color : 'bg-slate-50 text-slate-600 border-slate-200'}`}
                >
                  {showRtsStatus && <Icon className="w-3 h-3 mr-1" />}
                  {appt.carrier_name}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">
                  <strong>{appt.carrier_name}</strong><br />
                  Status: {appt.appointment_status || 'pending'}<br />
                  RTS: {appt.rts_status?.replace(/_/g, ' ') || 'not ready'}
                </p>
              </TooltipContent>
            </Tooltip>
          );
        })}
        {remainingCount > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="text-xs bg-slate-50 text-slate-600 cursor-default">
                +{remainingCount} more
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-xs">
                {appointments.slice(maxDisplay).map((appt, idx) => (
                  <div key={idx}>{appt.carrier_name}</div>
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}