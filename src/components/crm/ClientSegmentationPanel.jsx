import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter, Users, TrendingUp, AlertCircle, DollarSign, Loader2, Mail, CheckSquare } from 'lucide-react';
import { toast } from 'sonner';

export default function ClientSegmentationPanel({ agentId }) {
  const [criteria, setCriteria] = useState({
    policyTypes: [],
    minPremium: '',
    maxPremium: '',
    sentimentTrend: '',
    lifecycleStage: '',
    churnRiskLevel: '',
    daysSinceContact: '',
    minSatisfaction: ''
  });
  const [segment, setSegment] = useState(null);

  const segmentMutation = useMutation({
    mutationFn: () => base44.functions.invoke('aiClientSegmentation', { 
      segmentCriteria: criteria, 
      agentId 
    }),
    onSuccess: (response) => {
      setSegment(response.data);
      toast.success('Segment created', {
        description: `Found ${response.data.segment_size} clients`
      });
    }
  });

  const addPolicyType = (type) => {
    if (!criteria.policyTypes.includes(type)) {
      setCriteria({ ...criteria, policyTypes: [...criteria.policyTypes, type] });
    }
  };

  const removePolicyType = (type) => {
    setCriteria({ 
      ...criteria, 
      policyTypes: criteria.policyTypes.filter(t => t !== type) 
    });
  };

  return (
    <div className="space-y-6">
      <Card className="clay-morphism border-0">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <Filter className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl">Dynamic Client Segmentation</CardTitle>
              <p className="text-sm text-slate-500 mt-1">Create targeted segments with custom criteria</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Policy Types */}
            <div>
              <label className="text-sm font-medium mb-2 block">Policy Types</label>
              <Select onValueChange={addPolicyType}>
                <SelectTrigger>
                  <SelectValue placeholder="Add policy type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="medicare_advantage">Medicare Advantage</SelectItem>
                  <SelectItem value="supplement">Supplement</SelectItem>
                  <SelectItem value="pdp">PDP</SelectItem>
                  <SelectItem value="ancillary">Ancillary</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex flex-wrap gap-2 mt-2">
                {criteria.policyTypes.map(type => (
                  <Badge key={type} className="bg-blue-100 text-blue-700">
                    {type}
                    <button onClick={() => removePolicyType(type)} className="ml-1 text-blue-900">×</button>
                  </Badge>
                ))}
              </div>
            </div>

            {/* Premium Range */}
            <div>
              <label className="text-sm font-medium mb-2 block">Premium Range</label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={criteria.minPremium}
                  onChange={(e) => setCriteria({ ...criteria, minPremium: e.target.value })}
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={criteria.maxPremium}
                  onChange={(e) => setCriteria({ ...criteria, maxPremium: e.target.value })}
                />
              </div>
            </div>

            {/* Sentiment Trend */}
            <div>
              <label className="text-sm font-medium mb-2 block">Sentiment Trend</label>
              <Select value={criteria.sentimentTrend} onValueChange={(v) => setCriteria({ ...criteria, sentimentTrend: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select trend" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>All</SelectItem>
                  <SelectItem value="improving">Improving</SelectItem>
                  <SelectItem value="stable">Stable</SelectItem>
                  <SelectItem value="declining">Declining</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Lifecycle Stage */}
            <div>
              <label className="text-sm font-medium mb-2 block">Lifecycle Stage</label>
              <Select value={criteria.lifecycleStage} onValueChange={(v) => setCriteria({ ...criteria, lifecycleStage: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>All</SelectItem>
                  <SelectItem value="prospect">Prospect</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="churned">Churned</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Churn Risk */}
            <div>
              <label className="text-sm font-medium mb-2 block">Churn Risk Level</label>
              <Select value={criteria.churnRiskLevel} onValueChange={(v) => setCriteria({ ...criteria, churnRiskLevel: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select risk level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>All</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Days Since Contact */}
            <div>
              <label className="text-sm font-medium mb-2 block">Days Since Last Contact</label>
              <Input
                type="number"
                placeholder="e.g., 30"
                value={criteria.daysSinceContact}
                onChange={(e) => setCriteria({ ...criteria, daysSinceContact: e.target.value })}
              />
            </div>

            {/* Min Satisfaction */}
            <div>
              <label className="text-sm font-medium mb-2 block">Min Satisfaction Score</label>
              <Input
                type="number"
                placeholder="1-10"
                min="1"
                max="10"
                value={criteria.minSatisfaction}
                onChange={(e) => setCriteria({ ...criteria, minSatisfaction: e.target.value })}
              />
            </div>
          </div>

          <Button
            onClick={() => segmentMutation.mutate()}
            disabled={segmentMutation.isPending}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {segmentMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Filter className="w-4 h-4 mr-2" />
                Create Segment
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Segment Results */}
      {segment && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="clay-subtle border-0">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Segment Size</p>
                    <p className="text-2xl font-bold">{segment.segment_size}</p>
                    <p className="text-xs text-slate-500">{segment.segment_percentage}% of total</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-600/30" />
                </div>
              </CardContent>
            </Card>

            <Card className="clay-subtle border-0">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Avg Premium</p>
                    <p className="text-2xl font-bold">${segment.segment_stats.avg_premium}</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-emerald-600/30" />
                </div>
              </CardContent>
            </Card>

            <Card className="clay-subtle border-0">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Avg Churn Risk</p>
                    <p className="text-2xl font-bold">{segment.segment_stats.avg_churn_risk}%</p>
                  </div>
                  <AlertCircle className="w-8 h-8 text-amber-600/30" />
                </div>
              </CardContent>
            </Card>

            <Card className="clay-subtle border-0">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">High Risk</p>
                    <p className="text-2xl font-bold text-red-600">{segment.segment_stats.high_risk_count}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-red-600/30" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="clay-morphism border-0">
            <CardHeader>
              <CardTitle>Segment Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <Button className="bg-teal-600 hover:bg-teal-700">
                  <Mail className="w-4 h-4 mr-2" />
                  Send Campaign
                </Button>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <CheckSquare className="w-4 h-4 mr-2" />
                  Assign Tasks
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}