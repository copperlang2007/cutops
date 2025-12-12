import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, FileText, Calendar, User } from "lucide-react";
import { format } from "date-fns";
import { DOCUMENT_TYPES, VERIFICATION_STATUS_CONFIG } from '../shared/constants';

export default function DocumentVerificationModal({ 
  open, 
  onClose, 
  document, 
  onVerify, 
  onReject 
}) {
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!document) return null;

  const typeLabel = DOCUMENT_TYPES.find(t => t.value === document.document_type)?.label || document.document_type;
  const currentStatus = VERIFICATION_STATUS_CONFIG[document.verification_status] || VERIFICATION_STATUS_CONFIG.pending;

  const handleVerify = async () => {
    setIsSubmitting(true);
    await onVerify(document);
    setIsSubmitting(false);
    onClose();
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) return;
    setIsSubmitting(true);
    await onReject(document, rejectionReason);
    setIsSubmitting(false);
    setRejectionReason('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-teal-600" />
            Verify Document
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Document Details */}
          <div className="p-4 bg-slate-50 rounded-xl space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-slate-800">{document.name}</h3>
                <Badge variant="secondary" className="mt-1 text-xs">
                  {typeLabel}
                </Badge>
              </div>
              <Badge variant="outline" className={`${currentStatus.color}`}>
                {currentStatus.label}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              {document.issue_date && (
                <div className="flex items-center gap-2 text-slate-600">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>Issued: {format(new Date(document.issue_date), 'MMM d, yyyy')}</span>
                </div>
              )}
              {document.expiration_date && (
                <div className="flex items-center gap-2 text-slate-600">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>Expires: {format(new Date(document.expiration_date), 'MMM d, yyyy')}</span>
                </div>
              )}
              {document.carrier_name && (
                <div className="text-slate-600">Carrier: {document.carrier_name}</div>
              )}
              {document.state && (
                <div className="text-slate-600">State: {document.state}</div>
              )}
            </div>

            {document.file_url && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open(document.file_url, '_blank')}
                className="w-full"
              >
                <FileText className="w-4 h-4 mr-2" />
                View Document
              </Button>
            )}
          </div>

          {/* Previous Verification Info */}
          {document.verification_status === 'rejected' && document.rejection_reason && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm font-medium text-red-700 mb-1">Previous Rejection Reason:</p>
              <p className="text-sm text-red-600">{document.rejection_reason}</p>
            </div>
          )}

          {document.verification_status === 'verified' && document.verified_by && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-emerald-700">
                <User className="w-4 h-4" />
                <span>Verified by {document.verified_by}</span>
                {document.verified_date && (
                  <span>on {format(new Date(document.verified_date), 'MMM d, yyyy')}</span>
                )}
              </div>
            </div>
          )}

          {/* Rejection Reason Input */}
          {document.verification_status !== 'verified' && (
            <div className="space-y-2">
              <Label>Rejection Reason (required to reject)</Label>
              <Textarea
                placeholder="Enter reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
              />
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          {document.verification_status !== 'verified' && (
            <>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={!rejectionReason.trim() || isSubmitting}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject
              </Button>
              <Button
                onClick={handleVerify}
                disabled={isSubmitting}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Verify
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}