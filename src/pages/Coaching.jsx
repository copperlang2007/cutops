import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Trophy, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AgentCoachingPanel from '../components/coaching/AgentCoachingPanel';
import AgentPerformanceInsights from '../components/performance/AgentPerformanceInsights';
import RoleGuard from '../components/shared/RoleGuard';

export default function Coaching() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: agents = [] } = useQuery({
    queryKey: ['agents'],
    queryFn: () => base44.entities.Agent.list()
  });

  const currentAgent = agents.find(a => a.email === user?.email);

  return (
    <RoleGuard>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-900 to-black flex items-center justify-center">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                  AI Performance Coaching
                </h1>
                <p className="text-slate-500 dark:text-slate-400">
                  Personalized insights to elevate your performance
                </p>
              </div>
            </div>
          </div>

          {currentAgent ? (
            <div className="space-y-6">
              <AgentPerformanceInsights agentId={currentAgent.id} />
              <AgentCoachingPanel agentId={currentAgent.id} />
            </div>
          ) : (
            <Card className="border-0 shadow-sm dark:bg-slate-800">
              <CardContent className="pt-12 pb-12 text-center">
                <Users className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <p className="text-slate-500">
                  Agent profile not found. Please contact your administrator.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </RoleGuard>
  );
}