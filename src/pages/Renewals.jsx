import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { RefreshCw, Loader2, BarChart3, List } from 'lucide-react';
import RenewalPipeline from '../components/renewals/RenewalPipeline';
import RenewalAnalytics from '../components/renewals/RenewalAnalytics';
import RoleGuard from '../components/shared/RoleGuard';
import { toast } from 'sonner';

export default function Renewals() {
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: agents = [] } = useQuery({
    queryKey: ['agents'],
    queryFn: () => base44.entities.Agent.list()
  });

  const currentAgent = agents.find(a => a.email === user?.email);

  const identifyRenewalsMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('aiRenewalIdentification', {});
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['renewals']);
      toast.success(`Identified ${data.identified_count} renewals`);
    }
  });

  return (
    <RoleGuard>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                Policy Renewals
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">
                AI-powered renewal management and tracking
              </p>
            </div>
            <Button
              onClick={() => identifyRenewalsMutation.mutate()}
              disabled={identifyRenewalsMutation.isPending}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {identifyRenewalsMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Scan for Renewals
            </Button>
          </div>

          <Tabs defaultValue="pipeline" className="space-y-6">
            <TabsList>
              <TabsTrigger value="pipeline">
                <List className="w-4 h-4 mr-2" />
                Pipeline
              </TabsTrigger>
              <TabsTrigger value="analytics">
                <BarChart3 className="w-4 h-4 mr-2" />
                Analytics
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pipeline">
              <RenewalPipeline agentId={currentAgent?.id} />
            </TabsContent>

            <TabsContent value="analytics">
              <RenewalAnalytics agentId={currentAgent?.id} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </RoleGuard>
  );
}