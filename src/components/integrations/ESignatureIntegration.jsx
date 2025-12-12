import { useState } from 'react'
import { base44 } from '@/api/base44Client'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  FileSignature, Send, CheckCircle, Clock, AlertTriangle,
  Eye, Download, RefreshCw, Loader2
} from 'lucide-react';
import { format } from 'date-fns'
import { toast } from 'sonner'

const DOCUMENT_TEMPLATES = [
  { id: 'carrier_contract', name: 'Carrier Contract Agreement', fields: ['agent_name', 'carrier_name', 'effective_date'] },
  { id: 'w9', name: 'W-9 Tax Form', fields: ['legal_name', 'ssn', 'address'] },
  { id: 'direct_deposit', name: 'Direct Deposit Authorization', fields: ['bank_name', 'routing', 'account'] },
  { id: 'nda', name: 'Non-Disclosure Agreement', fields: ['agent_name', 'effective_date'] },
  { id: 'compliance', name: 'Compliance Acknowledgment', fields: ['agent_name', 'date'] }
];

export default function ESignatureIntegration({ agent, contracts, onDocumentSigned }) {
  const [pendingSignatures, setPendingSignatures] = useState([
    { id: '1', template: 'carrier_contract', status: 'pending', sent_date: new Date().toISOString(), carrier: 'Humana' },
    { id: '2', template: 'w9', status: 'signed', sent_date: new Date(Date.now() - 86400000).toISOString(), signed_date: new Date().toISOString() }
  ]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [isSending, setIsSending] = useState(false);

  const sendForSignature = async () => {
    if (!selectedTemplate) return;
    
    setIsSending(true);
    try {
      // Simulate sending document for signature
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const template = DOCUMENT_TEMPLATES.find(t => t.id === selectedTemplate);
      setPendingSignatures(prev => [...prev, {
        id: Date.now().toString(),
        template: selectedTemplate,
        template_name: template?.name,
        status: 'pending',
        sent_date: new Date().toISOString()
      }]);

      // Simulate sending email notification
      if (agent?.email) {
        await base44.integrations.Core.SendEmail({
          to: agent.email,
          subject: `Document Ready for Signature: ${template?.name}`,
          body: `Hi ${agent.first_name},\n\nA document "${template?.name}" is ready for your electronic signature.\n\nPlease click the link below to review and sign:\n[Signature Link]\n\nThis document will expire in 7 days.\n\nThank you!`
        });
      }

      toast.success('Document sent for signature');
      setSelectedTemplate('');
    } catch (err) {
      toast.error('Failed to send document');
    } finally {
      setIsSending(false);
    }
  };

  const simulateSign = (docId) => {
    setPendingSignatures(prev => prev.map(doc => 
      doc.id === docId ? { ...doc, status: 'signed', signed_date: new Date().toISOString() } : doc
    ));
    toast.success('Document signed successfully');
    onDocumentSigned?.();
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'signed':
        return <Badge className="bg-emerald-100 text-emerald-700"><CheckCircle className="w-3 h-3 mr-1" />Signed</Badge>;
      case 'pending':
        return <Badge className="bg-amber-100 text-amber-700"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'expired':
        return <Badge className="bg-red-100 text-red-700"><AlertTriangle className="w-3 h-3 mr-1" />Expired</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <FileSignature className="w-5 h-5 text-indigo-600" />
          E-Signature Integration
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Send New Document */}
        <div className="p-4 bg-slate-50 rounded-lg mb-4">
          <h4 className="text-sm font-medium text-slate-700 mb-3">Send Document for Signature</h4>
          <div className="flex gap-2">
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select document template" />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_TEMPLATES.map(template => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              onClick={sendForSignature} 
              disabled={!selectedTemplate || isSending}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Document will be sent to {agent?.email || 'agent email'} via DocuSign/Adobe Sign
          </p>
        </div>

        {/* Pending & Completed Signatures */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-slate-700">Signature Status</h4>
          {pendingSignatures.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">No documents pending signature</p>
          ) : (
            pendingSignatures.map(doc => {
              const template = DOCUMENT_TEMPLATES.find(t => t.id === doc.template);
              return (
                <div key={doc.id} className={`p-3 rounded-lg border ${
                  doc.status === 'signed' ? 'bg-emerald-50 border-emerald-200' :
                  doc.status === 'expired' ? 'bg-red-50 border-red-200' :
                  'bg-white border-slate-200'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-700">
                      {template?.name || doc.template_name}
                    </span>
                    {getStatusBadge(doc.status)}
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Sent: {format(new Date(doc.sent_date), 'MMM d, yyyy')}</span>
                    {doc.signed_date && (
                      <span>Signed: {format(new Date(doc.signed_date), 'MMM d, yyyy')}</span>
                    )}
                  </div>
                  <div className="flex gap-2 mt-2">
                    {doc.status === 'pending' && (
                      <>
                        <Button size="sm" variant="outline" className="h-7 text-xs">
                          <RefreshCw className="w-3 h-3 mr-1" />
                          Remind
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-7 text-xs"
                          onClick={() => simulateSign(doc.id)}
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Mark Signed (Demo)
                        </Button>
                      </>
                    )}
                    {doc.status === 'signed' && (
                      <Button size="sm" variant="outline" className="h-7 text-xs">
                        <Download className="w-3 h-3 mr-1" />
                        Download
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="h-7 text-xs">
                      <Eye className="w-3 h-3 mr-1" />
                      View
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Integration Status */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-blue-700">DocuSign Connected</span>
            </div>
            <Badge variant="outline" className="text-xs">Active</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}