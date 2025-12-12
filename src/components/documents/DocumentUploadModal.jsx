import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { base44 } from '@/api/base44Client';
import { Upload, X, CheckCircle, Loader2, FileText, Calendar, AlertCircle, Camera } from "lucide-react";
import CameraCapture from '../mobile/CameraCapture';
import { motion, AnimatePresence } from "framer-motion";
import { DOCUMENT_TYPES, CARRIERS, US_STATES, FILE_UPLOAD_CONFIG, ALERT_THRESHOLDS } from '../shared/constants';
import { validateFileUpload } from '../shared/validation';
import { getDocumentEventType, triggerChecklistCompletion } from '../onboarding/checklistAutomation';

export default function DocumentUploadModal({ 
  open, 
  onClose, 
  agentId, 
  onSuccess,
  relatedEntityType = 'agent',
  relatedEntityId = null,
  checklistItems = [],
  onChecklistUpdate
}) {
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    document_type: '',
    issue_date: '',
    expiration_date: '',
    carrier_name: '',
    state: '',
    notes: ''
  });

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const validation = validateFileUpload(selectedFile, FILE_UPLOAD_CONFIG);
      if (!validation.isValid) {
        setFileError(validation.error);
        return;
      }
      setFileError(null);
      setFile(selectedFile);
      if (!formData.name) {
        setFormData(prev => ({ ...prev, name: selectedFile.name.replace(/\.[^/.]+$/, '') }));
      }
    }
  };

  const handleCameraCapture = (capturedFile) => {
    const validation = validateFileUpload(capturedFile, FILE_UPLOAD_CONFIG);
    if (!validation.isValid) {
      setFileError(validation.error);
      return;
    }
    setFileError(null);
    setFile(capturedFile);
    if (!formData.name) {
      setFormData(prev => ({ ...prev, name: `Document-${Date.now()}` }));
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      const validation = validateFileUpload(droppedFile, FILE_UPLOAD_CONFIG);
      if (!validation.isValid) {
        setFileError(validation.error);
        return;
      }
      setFileError(null);
      setFile(droppedFile);
      if (!formData.name) {
        setFormData(prev => ({ ...prev, name: droppedFile.name.replace(/\.[^/.]+$/, '') }));
      }
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleUpload = async () => {
    if (!file || !formData.document_type) return;

    setUploading(true);
    setUploadProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => Math.min(prev + 10, 90));
    }, 200);

    try {
      // Upload file
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      // Check for existing document to create version
      let existingDoc = null;
      if (formData.name) {
        const existing = await base44.entities.Document.filter({
          agent_id: agentId,
          name: formData.name,
          is_latest_version: true
        });
        existingDoc = existing[0];
      }

      // Auto-generate tags
      const autoTags = {
        document_type: formData.document_type,
        date: new Date().toISOString().split('T')[0]
      };
      if (formData.carrier_name) autoTags.carrier = formData.carrier_name;
      if (formData.state) autoTags.state = formData.state;
      if (formData.expiration_date) {
        const daysUntilExpiry = Math.ceil(
          (new Date(formData.expiration_date) - new Date()) / (1000 * 60 * 60 * 24)
        );
        if (daysUntilExpiry <= 30) autoTags.expiry_status = 'expiring_soon';
        else if (daysUntilExpiry <= 90) autoTags.expiry_status = 'expiring';
      }

      const version = existingDoc ? existingDoc.version + 1 : 1;
      const parentDocId = existingDoc?.parent_document_id || existingDoc?.id || null;

      // Create document record
      const documentData = {
        agent_id: agentId,
        name: formData.name || file.name,
        document_type: formData.document_type,
        file_url: file_url,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        parent_document_id: parentDocId,
        version: version,
        is_latest_version: true,
        auto_tags: autoTags,
        tags: [formData.document_type, ...(formData.carrier_name ? [formData.carrier_name] : [])],
        related_entity_type: relatedEntityType,
        related_entity_id: relatedEntityId || agentId,
        issue_date: formData.issue_date || null,
        expiration_date: formData.expiration_date || null,
        carrier_name: formData.carrier_name || null,
        state: formData.state || null,
        notes: formData.notes || null,
        status: 'pending_verification',
        verification_status: 'pending'
      };

      const newDoc = await base44.entities.Document.create(documentData);

      // If this is a new version, mark old version as superseded
      if (existingDoc) {
        await base44.entities.Document.update(existingDoc.id, {
          is_latest_version: false,
          status: 'superseded'
        });
      }

      // Trigger AI extraction and OCR processing for PDFs and images
      if (['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) {
        base44.functions.invoke('aiDocumentExtractor', {
          document_id: newDoc.id,
          file_url: file_url
        }).catch(err => console.error('AI extraction failed:', err));
      }

      // Auto-complete checklist items based on document type
      const eventType = getDocumentEventType(formData.document_type);
      if (eventType && checklistItems.length > 0) {
        const user = await base44.auth.me();
        await triggerChecklistCompletion(
          eventType,
          agentId,
          checklistItems,
          (id, data) => base44.entities.OnboardingChecklist.update(id, data),
          user.email
        );
        onChecklistUpdate?.();
      }

      // Create alert if document has expiration date
      if (formData.expiration_date) {
        const expirationDate = new Date(formData.expiration_date);
        const today = new Date();
        const daysUntilExpiration = Math.ceil((expirationDate - today) / (1000 * 60 * 60 * 24));
        
        if (daysUntilExpiration <= ALERT_THRESHOLDS.warningDays && daysUntilExpiration > 0) {
          const docTypeLabel = DOCUMENT_TYPES.find(t => t.value === formData.document_type)?.label || formData.document_type;
          await base44.entities.Alert.create({
            agent_id: agentId,
            alert_type: formData.document_type === 'eo_certificate' ? 'eo_expiring' : 
                        formData.document_type === 'ahip_certificate' ? 'ahip_expiring' : 'license_expiring',
            severity: daysUntilExpiration <= ALERT_THRESHOLDS.criticalDays ? 'critical' : 'warning',
            title: `${docTypeLabel} Expiring Soon`,
            message: `${formData.name || docTypeLabel} expires in ${daysUntilExpiration} days on ${formData.expiration_date}.`,
            due_date: formData.expiration_date,
            is_read: false,
            is_resolved: false,
            related_entity_type: 'document'
          });
        }
      }

      setUploadComplete(true);
      setTimeout(() => {
        onSuccess?.();
        handleClose();
      }, 1500);

    } catch (error) {
      clearInterval(progressInterval);
      console.error('Upload failed:', error);
      setUploadError('Failed to upload document. Please try again.');
      setUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setFileError(null);
    setUploading(false);
    setUploadProgress(0);
    setUploadComplete(false);
    setUploadError(null);
    setFormData({
      name: '',
      document_type: '',
      issue_date: '',
      expiration_date: '',
      carrier_name: '',
      state: '',
      notes: ''
    });
    onClose();
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const showCarrierField = ['carrier_certification', 'contract'].includes(formData.document_type);
  const showStateField = ['state_license', 'carrier_certification'].includes(formData.document_type);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-teal-600" />
            Upload Document
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* File Upload Area */}
          <div
            className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
              file ? 'border-teal-300 bg-teal-50' : 'border-slate-200 hover:border-teal-300'
            }`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            <AnimatePresence mode="wait">
              {!file ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Upload className="w-10 h-10 mx-auto text-slate-400 mb-3" />
                  <p className="text-sm text-slate-600 mb-2">
                    Drag and drop your file here, or
                  </p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="w-4 h-4 mr-1" />
                      Browse Files
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCamera(true)}
                    >
                      <Camera className="w-4 h-4 mr-1" />
                      Take Photo
                    </Button>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    PDF, PNG, JPG up to 10MB
                  </p>
                  {fileError && (
                    <p className="text-xs text-red-500 mt-2 flex items-center justify-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {fileError}
                    </p>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-3"
                >
                  <div className="p-3 bg-teal-100 rounded-lg">
                    <FileText className="w-6 h-6 text-teal-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-slate-800 truncate">{file.name}</p>
                    <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-slate-400 hover:text-slate-600"
                    onClick={() => setFile(null)}
                    disabled={uploading}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
              onChange={handleFileSelect}
            />
          </div>

          {/* Upload Progress */}
          {uploading && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-2"
            >
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">
                  {uploadComplete ? 'Upload complete!' : 'Uploading...'}
                </span>
                <span className="text-slate-500">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </motion.div>
          )}

          {/* Upload Error */}
          {uploadError && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-3 bg-red-50 border border-red-200 rounded-lg"
            >
              <p className="text-sm text-red-600 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {uploadError}
              </p>
            </motion.div>
          )}

          {/* Document Details */}
          {!uploading && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label>Document Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="Enter document name"
                  />
                </div>

                <div className="col-span-2 space-y-2">
                  <Label>Document Type *</Label>
                  <Select
                    value={formData.document_type}
                    onValueChange={(value) => handleChange('document_type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {DOCUMENT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {showCarrierField && (
                  <div className="space-y-2">
                    <Label>Carrier</Label>
                    <Select
                      value={formData.carrier_name}
                      onValueChange={(value) => handleChange('carrier_name', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select carrier" />
                      </SelectTrigger>
                      <SelectContent>
                        {CARRIERS.map((carrier) => (
                          <SelectItem key={carrier} value={carrier}>
                            {carrier}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {showStateField && (
                  <div className="space-y-2">
                    <Label>State</Label>
                    <Select
                      value={formData.state}
                      onValueChange={(value) => handleChange('state', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        {US_STATES.map((state) => (
                          <SelectItem key={state} value={state}>
                            {state}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Issue Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      type="date"
                      value={formData.issue_date}
                      onChange={(e) => handleChange('issue_date', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Expiration Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      type="date"
                      value={formData.expiration_date}
                      onChange={(e) => handleChange('expiration_date', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="col-span-2 space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => handleChange('notes', e.target.value)}
                    placeholder="Add any notes about this document..."
                    rows={2}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {uploadComplete ? (
            <div className="flex items-center gap-2 text-emerald-600">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Document uploaded successfully!</span>
            </div>
          ) : (
            <>
              <Button variant="outline" onClick={handleClose} disabled={uploading}>
                Cancel
              </Button>
              <Button 
                onClick={handleUpload} 
                disabled={!file || !formData.document_type || uploading}
                className="bg-teal-600 hover:bg-teal-700"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Document
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>

      <CameraCapture
        open={showCamera}
        onClose={() => setShowCamera(false)}
        onCapture={handleCameraCapture}
      />
    </Dialog>
  );
}