import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X, Loader2, FileText } from 'lucide-react';
import { toast } from 'sonner';

export default function ArticleSubmissionForm({ onSuccess, editingArticle }) {
  const [formData, setFormData] = useState(editingArticle || {
    title: '',
    category: '',
    subcategory: '',
    content: '',
    summary: '',
    tags: [],
    carrier_specific: '',
    state_specific: '',
    status: 'pending_review'
  });
  const [tagInput, setTagInput] = useState('');
  const queryClient = useQueryClient();

  const submitMutation = useMutation({
    mutationFn: async (data) => {
      const user = await base44.auth.me();
      if (editingArticle) {
        return base44.entities.KnowledgeArticle.update(editingArticle.id, {
          ...data,
          last_updated: new Date().toISOString()
        });
      } else {
        return base44.entities.KnowledgeArticle.create({
          ...data,
          author_email: user.email,
          published_date: new Date().toISOString(),
          last_updated: new Date().toISOString()
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['knowledgeArticles']);
      toast.success(editingArticle ? 'Article updated' : 'Article submitted for review');
      onSuccess?.();
    }
  });

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
      setTagInput('');
    }
  };

  const removeTag = (tag) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    submitMutation.mutate(formData);
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-teal-600" />
          {editingArticle ? 'Edit Article' : 'Submit New Article'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Title *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="How to process Medicare Advantage claims"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Category *</Label>
              <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="policies">Policies</SelectItem>
                  <SelectItem value="compliance">Compliance</SelectItem>
                  <SelectItem value="sales_scripts">Sales Scripts</SelectItem>
                  <SelectItem value="procedures">Procedures</SelectItem>
                  <SelectItem value="product_guides">Product Guides</SelectItem>
                  <SelectItem value="carrier_info">Carrier Info</SelectItem>
                  <SelectItem value="claims">Claims</SelectItem>
                  <SelectItem value="troubleshooting">Troubleshooting</SelectItem>
                  <SelectItem value="training">Training</SelectItem>
                  <SelectItem value="faq">FAQ</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Subcategory</Label>
              <Input
                value={formData.subcategory}
                onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                placeholder="Optional"
              />
            </div>
          </div>

          <div>
            <Label>Summary *</Label>
            <Textarea
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              placeholder="Brief description of what this article covers"
              rows={2}
              required
            />
          </div>

          <div>
            <Label>Content * (Markdown supported)</Label>
            <Textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Write your article content here. You can use markdown formatting."
              rows={12}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Carrier Specific (optional)</Label>
              <Input
                value={formData.carrier_specific}
                onChange={(e) => setFormData({ ...formData, carrier_specific: e.target.value })}
                placeholder="e.g., Humana"
              />
            </div>
            <div>
              <Label>State Specific (optional)</Label>
              <Input
                value={formData.state_specific}
                onChange={(e) => setFormData({ ...formData, state_specific: e.target.value })}
                placeholder="e.g., CA"
              />
            </div>
          </div>

          <div>
            <Label>Tags</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="Add a tag and press Enter"
              />
              <Button type="button" onClick={addTag} variant="outline">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag, i) => (
                <div key={i} className="flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  <span className="text-sm">{tag}</span>
                  <button type="button" onClick={() => removeTag(tag)}>
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <Button
            type="submit"
            disabled={submitMutation.isPending || !formData.title || !formData.category || !formData.content}
            className="w-full bg-teal-600 hover:bg-teal-700"
          >
            {submitMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : null}
            {editingArticle ? 'Update Article' : 'Submit for Review'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}