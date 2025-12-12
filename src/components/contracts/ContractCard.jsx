import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  FileSignature, Calendar, AlertTriangle, ChevronRight, 
  Clock, CheckCircle, XCircle, Send, Sparkles 
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { motion } from 'framer-motion';
import { CONTRACT_STATUS_CONFIG } from '../shared/constants';

const statusIcons = {
  not_started: Clock,
  pending_submission: Send,
  submitted: Send,
  pending_carrier_review: Clock,
  requires_correction: AlertTriangle,
  contract_sent: FileSignature,
  contract_signed: CheckCircle,
  active: CheckCircle,
  expired: XCircle,
  terminated: XCircle
};

export default function ContractCard({ contract, onEdit, onStatusChange, onAnalyze }) {
  const config = CONTRACT_STATUS_CONFIG[contract.contract_status] || CONTRACT_STATUS_CONFIG.not_started;
  const StatusIcon = statusIcons[contract.contract_status] || Clock;

  const daysUntilExpiration = contract.expiration_date 
    ? differenceInDays(new Date(contract.expiration_date), new Date())
    : null;

  const isExpiringSoon = daysUntilExpiration !== null && daysUntilExpiration <= 60 && daysUntilExpiration > 0;
  const isExpired = daysUntilExpiration !== null && daysUntilExpiration <= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group"
    >
      <Card className="p-4 bg-white border-0 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={`p-2 rounded-lg ${config.color.split(' ')[0]}`}>
              <StatusIcon className={`w-5 h-5 ${config.color.split(' ')[1]}`} />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-slate-800">{contract.carrier_name}</h3>
                <Badge variant="outline" className={config.color}>
                  {config.label}
                </Badge>
                {contract.contract_status === 'requires_correction' && (
                  <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Action Required
                  </Badge>
                )}
              </div>

              {contract.writing_number && (
                <p className="text-sm text-slate-500 mt-1">
                  Writing #: {contract.writing_number}
                </p>
              )}

              <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                {contract.effective_date && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Effective: {format(new Date(contract.effective_date), 'MMM d, yyyy')}</span>
                  </div>
                )}
                {contract.expiration_date && (
                  <div className={`flex items-center gap-1 ${isExpired ? 'text-red-600' : isExpiringSoon ? 'text-amber-600' : ''}`}>
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      Expires: {format(new Date(contract.expiration_date), 'MMM d, yyyy')}
                      {isExpiringSoon && ` (${daysUntilExpiration} days)`}
                      {isExpired && ' (Expired)'}
                    </span>
                  </div>
                )}
              </div>

              {contract.states?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {contract.states.slice(0, 5).map(state => (
                    <Badge key={state} variant="outline" className="text-xs bg-slate-50">
                      {state}
                    </Badge>
                  ))}
                  {contract.states.length > 5 && (
                    <Badge variant="outline" className="text-xs bg-slate-50">
                      +{contract.states.length - 5} more
                    </Badge>
                  )}
                </div>
              )}

              {contract.correction_notes && contract.contract_status === 'requires_correction' && (
                <p className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                  {contract.correction_notes}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onAnalyze && (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => onAnalyze(contract)}
                title="AI Analysis"
              >
                <Sparkles className="w-4 h-4 text-purple-500" />
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => onEdit?.(contract)}
            >
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}