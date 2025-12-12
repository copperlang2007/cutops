import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, Loader2, FileText, Sparkles, Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function HealthContentReview({ agentId }) {
  const queryClient = useQueryClient();
  const [editingContent, setEditingContent] = useState(null);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedBody, setEditedBody] = useState('');

  const { data: pendingContent = [], isLoading } = useQuery({
    queryKey: ['pendingHealthContent'],
    queryFn: () => base44.entities.HealthContentSuggestion.filter({ status: 'pending_review' }, '-generated_date')
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, title, body }) => base44.entities.HealthContentSuggestion.update(id, {
      status: 'approved',
      agent_id_reviewed_by: agentId,
      reviewed_date: new Date().toISOString(),
      delivery_date: new Date().toISOString(),
      title: title,
      content_body: body
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['pendingHealthContent']);
      setEditingContent(null);
      toast.success('Content approved and delivered!');
    }
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }) => base44.entities.HealthContentSuggestion.update(id, {
      status: 'rejected',
      agent_id_reviewed_by: agentId,
      reviewed_date: new Date().toISOString(),
      rejection_reason: reason
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['pendingHealthContent']);
      toast.success('Content rejected');
    }
  });

  const openEditor = (content) => {
    setEditingContent(content);
    setEditedTitle(content.title);
    setEditedBody(content.content_body);
  };

  if (isLoading) {
    return (
      <Card className="clay-morphism border-0">
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="clay-morphism border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            Health Content Review ({pendingContent.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {pendingContent.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No content pending review
            </div>
          ) : (
            pendingContent.map(content => (
              <div key={content.id} className="p-4 clay-subtle rounded-xl space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-900 dark:text-white">{content.title}</h3>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="outline">{content.content_type}</Badge>
                      <Badge className="bg-purple-100 text-purple-700">
                        {content.relevance_score}% relevant
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="prose prose-sm max-w-none text-slate-700 dark:text-slate-300">
                  <ReactMarkdown>{content.content_body.substring(0, 200)}...</ReactMarkdown>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => openEditor(content)}
                    variant="outline"
                    size="sm"
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Review & Edit
                  </Button>
                  <Button
                    onClick={() => approveMutation.mutate({ id: content.id, title: content.title, body: content.content_body })}
                    disabled={approveMutation.isPending}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    onClick={() => {
                      const reason = prompt('Reason for rejection (optional):');
                      rejectMutation.mutate({ id: content.id, reason: reason || 'Not suitable' });
                    }}
                    disabled={rejectMutation.isPending}
                    variant="destructive"
                    size="sm"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editingContent} onOpenChange={() => setEditingContent(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review & Edit Content</DialogTitle>
          </DialogHeader>
          {editingContent && (
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                />
              </div>
              <div>
                <Label>Content (Markdown)</Label>
                <Textarea
                  value={editedBody}
                  onChange={(e) => setEditedBody(e.target.value)}
                  rows={15}
                  className="font-mono text-sm"
                />
              </div>
              <div className="p-4 clay-subtle rounded">
                <Label className="mb-2 block">Preview</Label>
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown>{editedBody}</ReactMarkdown>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => approveMutation.mutate({ 
                    id: editingContent.id, 
                    title: editedTitle, 
                    body: editedBody 
                  })}
                  disabled={approveMutation.isPending}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve & Deliver
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setEditingContent(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}