import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, GraduationCap, Target, Sparkles, Users, Trophy } from 'lucide-react';
import { useUserRole } from '@/components/shared/RoleGuard';
import { hasTrainingPermission } from '../components/training/trainingPermissions';
import TrainingLibrary from '../components/training/TrainingLibrary';
import TrainingPathwayBuilder from '../components/training/TrainingPathwayBuilder';
import AITrainingCreator from '../components/training/AITrainingCreator';
import AgentTrainingView from '../components/training/AgentTrainingView';
import TrainingAssignmentManager from '../components/training/TrainingAssignmentManager';
import TrainingLeaderboard from '../components/training/TrainingLeaderboard';
import TrainingChallengeManager from '../components/training/TrainingChallengeManager';

export default function Training() {
  const { user, roleType, isAgent } = useUserRole();

  const { data: agents = [] } = useQuery({
    queryKey: ['agents'],
    queryFn: () => base44.entities.Agent.list()
  });

  const currentAgent = agents.find(a => a.email === user?.email);

  const canCreateModules = hasTrainingPermission(roleType, 'modules', 'create');
  const canManagePathways = hasTrainingPermission(roleType, 'pathways', 'create');
  const canAssign = hasTrainingPermission(roleType, 'modules', 'assign');
  const canManageChallenges = hasTrainingPermission(roleType, 'challenges', 'manage');
  const canViewReports = hasTrainingPermission(roleType, 'reports', 'view');

  if (isAgent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <GraduationCap className="w-8 h-8 text-slate-900" />
              My Training
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              Your assigned training modules and learning resources
            </p>
          </div>
          <AgentTrainingView agentId={currentAgent?.id} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <GraduationCap className="w-8 h-8 text-purple-600" />
            Training Management
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Manage training modules, pathways, and agent assignments
          </p>
        </div>

        <Tabs defaultValue="library" className="space-y-6">
          <TabsList>
            <TabsTrigger value="library">
              <BookOpen className="w-4 h-4 mr-2" />
              Training Library
            </TabsTrigger>
            {canManagePathways && (
              <TabsTrigger value="pathways">
                <Target className="w-4 h-4 mr-2" />
                Learning Pathways
              </TabsTrigger>
            )}
            {canAssign && (
              <TabsTrigger value="assignments">
                <Users className="w-4 h-4 mr-2" />
                Assignments
              </TabsTrigger>
            )}
            {canManageChallenges && (
              <TabsTrigger value="challenges">
                <Trophy className="w-4 h-4 mr-2" />
                Challenges
              </TabsTrigger>
            )}
            {canViewReports && (
              <TabsTrigger value="leaderboard">
                <Trophy className="w-4 h-4 mr-2" />
                Leaderboard
              </TabsTrigger>
            )}
            {canCreateModules && (
              <TabsTrigger value="ai-create">
                <Sparkles className="w-4 h-4 mr-2" />
                AI Create
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="library">
            <TrainingLibrary />
          </TabsContent>

          {canManagePathways && (
            <TabsContent value="pathways">
              <TrainingPathwayBuilder />
            </TabsContent>
          )}

          {canAssign && (
            <TabsContent value="assignments">
              <TrainingAssignmentManager />
            </TabsContent>
          )}

          {canManageChallenges && (
            <TabsContent value="challenges">
              <TrainingChallengeManager />
            </TabsContent>
          )}

          {canViewReports && (
            <TabsContent value="leaderboard">
              <TrainingLeaderboard />
            </TabsContent>
          )}

          {canCreateModules && (
            <TabsContent value="ai-create">
              <AITrainingCreator />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}