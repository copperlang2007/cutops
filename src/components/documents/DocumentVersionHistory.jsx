import { base44 } from '@/api/base44Client'
import { useQuery } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { History, Download, Eye, CheckCircle, Clock } from 'lucide-react'
import { format } from 'date-fns'

export default function DocumentVersionHistory({ document, open, onClose }) {
  const { data: versions = [], isLoading } = useQuery({
    queryKey: ['documentVersions', document?.id],
    queryFn: async () => {
      if (!document?.id) return [];
      
      // Get all versions of this document
      const allVersions = await base44.entities.Document.filter({
        parent_document_id: document.parent_document_id || document.id
      }, '-version');

      // If this is the parent, include it
      if (!document.parent_document_id) {
        return [document, ...allVersions];
      }

      // Get the parent document too
      const parents = await base44.entities.Document.filter({
        id: document.parent_document_id
      });

      return [...parents, ...allVersions].sort((a, b) => b.version - a.version);
    },
    enabled: !!document && open
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto dark:bg-slate-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="w-5 h-5 text-teal-600" />
            Version History: {document?.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {isLoading ? (
            <div className="text-center py-8 text-slate-500">Loading versions...</div>
          ) : versions.length === 0 ? (
            <div className="text-center py-8 text-slate-500">No version history available</div>
          ) : (
            versions.map((version, idx) => (
              <div
                key={version.id}
                className={`p-4 rounded-lg border ${
                  version.is_latest_version
                    ? 'border-teal-300 dark:border-teal-700 bg-teal-50 dark:bg-teal-900/20'
                    : 'border-slate-200 dark:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="font-mono">
                        v{version.version}
                      </Badge>
                      {version.is_latest_version && (
                        <Badge className="bg-teal-500 text-white">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Latest
                        </Badge>
                      )}
                      {version.status === 'superseded' && (
                        <Badge variant="outline" className="text-slate-500">
                          <Clock className="w-3 h-3 mr-1" />
                          Superseded
                        </Badge>
                      )}
                    </div>

                    <p className="text-sm font-medium text-slate-900 dark:text-white mb-1">
                      {version.file_name}
                    </p>

                    <div className="text-xs text-slate-500 space-y-1">
                      <p>Uploaded: {format(new Date(version.created_date), 'MMM d, yyyy h:mm a')}</p>
                      <p>Size: {(version.file_size / 1024).toFixed(1)} KB</p>
                      {version.notes && <p className="mt-2 text-slate-600">{version.notes}</p>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="ghost" asChild>
                      <a href={version.file_url} target="_blank" rel="noopener noreferrer">
                        <Eye className="w-4 h-4" />
                      </a>
                    </Button>
                    <Button size="sm" variant="ghost" asChild>
                      <a href={version.file_url} download>
                        <Download className="w-4 h-4" />
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}