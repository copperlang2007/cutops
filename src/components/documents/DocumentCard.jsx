import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  FileText, Download, ExternalLink, Trash2, CheckCircle, 
  Clock, AlertTriangle, MoreVertical, Eye, Shield
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format, differenceInDays } from "date-fns"
import { motion } from "framer-motion"

import { DOCUMENT_TYPES, ALERT_THRESHOLDS, VERIFICATION_STATUS_CONFIG } from '../shared/constants'

// Create lookup map from DOCUMENT_TYPES array
const DOCUMENT_TYPE_LABELS = DOCUMENT_TYPES.reduce((acc, type) => {
  acc[type.value] = type.label;
  return acc;
}, {});

const DOCUMENT_TYPE_COLORS = {
  eo_certificate: 'bg-purple-100 text-purple-700',
  background_check: 'bg-blue-100 text-blue-700',
  ahip_certificate: 'bg-emerald-100 text-emerald-700',
  carrier_certification: 'bg-amber-100 text-amber-700',
  state_license: 'bg-teal-100 text-teal-700',
  compliance_training: 'bg-indigo-100 text-indigo-700',
  contract: 'bg-slate-100 text-slate-700',
  w9: 'bg-orange-100 text-orange-700',
  direct_deposit: 'bg-cyan-100 text-cyan-700',
  id_verification: 'bg-pink-100 text-pink-700',
  other: 'bg-slate-100 text-slate-600'
};

const STATUS_CONFIG = {
  active: { label: 'Active', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  expired: { label: 'Expired', color: 'bg-red-100 text-red-700', icon: AlertTriangle },
  pending_verification: { label: 'Pending Verification', color: 'bg-amber-100 text-amber-700', icon: Clock },
  verified: { label: 'Verified', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: AlertTriangle }
};

export default function DocumentCard({ document, onView, onDelete, onVerify, onReject, showAgent = false }) {
  const typeLabel = DOCUMENT_TYPE_LABELS[document.document_type] || document.document_type;
  const typeColor = DOCUMENT_TYPE_COLORS[document.document_type] || DOCUMENT_TYPE_COLORS.other;
  const status = STATUS_CONFIG[document.status] || STATUS_CONFIG.active;
  const StatusIcon = status.icon;

  const getExpirationStatus = () => {
    if (!document.expiration_date) return null;
    const days = differenceInDays(new Date(document.expiration_date), new Date());
    if (days < 0) return { label: 'Expired', color: 'text-red-600', urgent: true };
    if (days <= ALERT_THRESHOLDS.criticalDays) return { label: `${days}d left`, color: 'text-red-500', urgent: true };
    if (days <= ALERT_THRESHOLDS.warningDays) return { label: `${days}d left`, color: 'text-amber-500', urgent: false };
    return { label: `${days}d left`, color: 'text-slate-500', urgent: false };
  };

  const expirationStatus = getExpirationStatus();

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="p-4 bg-white border-0 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-start gap-4">
          {/* File Icon */}
          <div className={`p-3 rounded-xl ${typeColor.replace('text-', 'bg-').replace('700', '100')}`}>
            <FileText className={`w-6 h-6 ${typeColor.split(' ')[1]}`} />
          </div>

          {/* Document Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-slate-800 truncate">{document.name}</h3>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge variant="secondary" className={`text-xs ${typeColor}`}>
                    {typeLabel}
                  </Badge>
                  {document.carrier_name && (
                    <Badge variant="outline" className="text-xs">
                      {document.carrier_name}
                    </Badge>
                  )}
                  {document.state && (
                    <Badge variant="outline" className="text-xs">
                      {document.state}
                    </Badge>
                  )}
                  {document.verification_status && (
                    <Badge 
                      variant="secondary" 
                      className={`text-xs ${VERIFICATION_STATUS_CONFIG[document.verification_status]?.color || 'bg-slate-100 text-slate-600'}`}
                    >
                      {document.verification_status === 'verified' && <Shield className="w-3 h-3 mr-1" />}
                      {document.verification_status === 'rejected' && <AlertTriangle className="w-3 h-3 mr-1" />}
                      {document.verification_status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                      {VERIFICATION_STATUS_CONFIG[document.verification_status]?.label || 'Unknown'}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Actions Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => window.open(document.file_url, '_blank')}>
                    <Eye className="w-4 h-4 mr-2" />
                    View Document
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => window.open(document.file_url, '_blank')}>
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </DropdownMenuItem>
                  {document.verification_status === 'pending' && onVerify && (
                    <>
                      <DropdownMenuItem onClick={() => onVerify(document)}>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Verify Document
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => onDelete(document)}
                    className="text-red-600"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Document Details */}
            <div className="mt-3 flex items-center gap-4 text-xs text-slate-500 flex-wrap">
              {document.file_size && (
                <span>{formatFileSize(document.file_size)}</span>
              )}
              {document.issue_date && (
                <span>Issued: {format(new Date(document.issue_date), 'MMM d, yyyy')}</span>
              )}
              {document.expiration_date && (
                <div className="flex items-center gap-1">
                  <span>Expires: {format(new Date(document.expiration_date), 'MMM d, yyyy')}</span>
                  {expirationStatus && (
                    <span className={`font-medium ${expirationStatus.color}`}>
                      ({expirationStatus.label})
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Expiration Warning */}
            {expirationStatus?.urgent && (
              <div className={`mt-2 flex items-center gap-1.5 text-xs font-medium ${expirationStatus.color}`}>
                <AlertTriangle className="w-3.5 h-3.5" />
                {expirationStatus.label === 'Expired' ? 'Document has expired' : 'Expiring soon - action required'}
              </div>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}