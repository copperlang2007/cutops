import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FileText, MapPin, Eye } from 'lucide-react'
import { format } from 'date-fns'

export default function AgreementDetailModal({ open, onClose, agreement, addendums }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto dark:bg-slate-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-teal-600" />
            {agreement.agreement_number}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details" className="space-y-4">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="signers">Signers</TabsTrigger>
            <TabsTrigger value="addendums">Addendums ({addendums.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-500 mb-1">Type</p>
                <p className="font-medium">{agreement.agreement_type?.replace(/_/g, ' ')}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">Status</p>
                <Badge>{agreement.status}</Badge>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">Effective Date</p>
                <p className="font-medium">
                  {agreement.effective_date ? format(new Date(agreement.effective_date), 'MMM d, yyyy') : 'Not set'}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">Expiration Date</p>
                <p className="font-medium">
                  {agreement.expiration_date ? format(new Date(agreement.expiration_date), 'MMM d, yyyy') : 'Not set'}
                </p>
              </div>
            </div>

            {agreement.agreement_terms && (
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Terms
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-slate-500">Override %:</span>
                    <span className="ml-2 font-medium">{agreement.agreement_terms.commission_override_percentage}%</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Base %:</span>
                    <span className="ml-2 font-medium">{agreement.agreement_terms.base_commission_percentage}%</span>
                  </div>
                </div>
              </div>
            )}

            {agreement.territories?.length > 0 && (
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Territories ({agreement.territories.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {agreement.territories.map(state => (
                    <Badge key={state} variant="outline">{state}</Badge>
                  ))}
                </div>
              </div>
            )}

            {agreement.document_url && (
              <Button asChild className="w-full">
                <a href={agreement.document_url} target="_blank" rel="noopener noreferrer">
                  <Eye className="w-4 h-4 mr-2" />
                  View Document
                </a>
              </Button>
            )}
          </TabsContent>

          <TabsContent value="signers" className="space-y-3">
            {agreement.signers?.length > 0 ? (
              agreement.signers.map((signer, idx) => (
                <div key={idx} className="p-4 rounded-lg border dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{signer.name}</p>
                      <p className="text-sm text-slate-500">{signer.email}</p>
                      <p className="text-xs text-slate-400">{signer.role}</p>
                    </div>
                    <div className="text-right">
                      <Badge className={signer.signed ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}>
                        {signer.signed ? 'Signed' : 'Pending'}
                      </Badge>
                      {signer.signed_date && (
                        <p className="text-xs text-slate-500 mt-1">
                          {format(new Date(signer.signed_date), 'MMM d, yyyy')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-slate-500 py-8">No signers specified</p>
            )}
          </TabsContent>

          <TabsContent value="addendums" className="space-y-3">
            {addendums.length > 0 ? (
              addendums.map(addendum => (
                <div key={addendum.id} className="p-4 rounded-lg border dark:border-slate-700">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">{addendum.addendum_number}</p>
                        <Badge variant="outline">{addendum.status}</Badge>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{addendum.title}</p>
                      <p className="text-xs text-slate-500">{addendum.description}</p>
                      {addendum.effective_date && (
                        <p className="text-xs text-slate-500 mt-2">
                          Effective: {format(new Date(addendum.effective_date), 'MMM d, yyyy')}
                        </p>
                      )}
                    </div>
                    {addendum.document_url && (
                      <Button size="sm" variant="ghost" asChild>
                        <a href={addendum.document_url} target="_blank" rel="noopener noreferrer">
                          <Eye className="w-4 h-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-slate-500 py-8">No addendums</p>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}