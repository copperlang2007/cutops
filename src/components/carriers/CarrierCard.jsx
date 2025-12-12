import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MapPin, Users, ExternalLink, Trash2 } from 'lucide-react'

export default function CarrierCard({ carrier, agentCount = 0, onClick, onDelete }) {
  const initials = carrier.code?.substring(0, 2).toUpperCase() || carrier.name?.substring(0, 2).toUpperCase();

  return (
    <Card 
      className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-teal-500/20 hover:border-teal-300 dark:hover:border-teal-600 hover:-translate-y-2 hover:scale-[1.02]"
      onClick={onClick}
    >
        <div className="flex items-start gap-4">
          <Avatar className="w-14 h-14 rounded-xl shadow-md transition-transform duration-300 group-hover:scale-110">
            <AvatarImage src={carrier.logo_url} />
            <AvatarFallback className="bg-gradient-to-br from-teal-500 to-emerald-600 text-white font-bold rounded-xl text-lg">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-slate-800 dark:text-white truncate tracking-tight">{carrier.name}</h3>
                <Badge 
                  variant="outline" 
                  className={carrier.status === 'active' 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700 shadow-sm' 
                    : carrier.status === 'pending'
                    ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700'
                    : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-700 dark:text-slate-400'
                  }
                >
                  {carrier.status || 'active'}
                </Badge>
                {carrier.onboarding_status && carrier.onboarding_status !== 'active' && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 text-xs">
                    {carrier.onboarding_status.replace(/_/g, ' ')}
                  </Badge>
                )}
              </div>
              {onDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  onClick={onDelete}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
            
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 font-medium">{carrier.code}</p>

            <div className="flex items-center gap-4 mt-3 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-700/50 px-2 py-1 rounded-full">
                <Users className="w-3.5 h-3.5 text-teal-500" />
                <span className="font-medium">{agentCount} agents</span>
              </div>
              {carrier.states_available?.length > 0 && (
                <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-700/50 px-2 py-1 rounded-full">
                  <MapPin className="w-3.5 h-3.5 text-blue-500" />
                  <span className="font-medium">{carrier.states_available.length} states</span>
                </div>
              )}
              {carrier.website && (
                <a 
                  href={carrier.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="font-medium">Website</span>
                </a>
              )}
            </div>
            {carrier.website && (
              <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                <a 
                  href={carrier.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 truncate block transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  {carrier.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                </a>
              </div>
            )}
          </div>
        </div>
      </Card>
  );
}