import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, UserPlus, FileText } from 'lucide-react';
import AIOnboardingWizard from '../components/onboarding/AIOnboardingWizard';
import OnboardingSummaryReport from '../components/onboarding/OnboardingSummaryReport';
import RoleGuard from '../components/shared/RoleGuard';

export default function ClientOnboarding() {
  const [showWizard, setShowWizard] = useState(false);
  const [completedClient, setCompletedClient] = useState(null);
  const [summary, setSummary] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: agents = [] } = useQuery({
    queryKey: ['agents'],
    queryFn: () => base44.entities.Agent.list()
  });

  const currentAgent = agents.find(a => a.email === user?.email) || agents[0];

  const handleComplete = (client, summaryData) => {
    setCompletedClient(client);
    setSummary(summaryData.summary);
    setShowWizard(false);
  };

  return (
    <RoleGuard pageName="ClientManagement">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Client Onboarding</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              AI-powered wizard to streamline new client setup
            </p>
          </div>

          {!showWizard && !completedClient && (
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-purple-600" />
                  Start New Client Onboarding
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-600 dark:text-slate-400">
                  Our AI-powered onboarding wizard will guide you through collecting client information,
                  analyzing their needs, and recommending the perfect plan - all while generating a 
                  comprehensive summary report for your records.
                </p>
                <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                  <div className="text-center">
                    <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center">
                      <UserPlus className="w-6 h-6 text-purple-600" />
                    </div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Smart Forms</p>
                    <p className="text-xs text-slate-500">AI-guided questions</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-teal-600" />
                    </div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Personalization</p>
                    <p className="text-xs text-slate-500">Tailored recommendations</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Auto Reports</p>
                    <p className="text-xs text-slate-500">Detailed summaries</p>
                  </div>
                </div>
                <Button
                  onClick={() => setShowWizard(true)}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  size="lg"
                >
                  <UserPlus className="w-5 h-5 mr-2" />
                  Start Onboarding Wizard
                </Button>
              </CardContent>
            </Card>
          )}

          {showWizard && currentAgent && (
            <AIOnboardingWizard
              agentId={currentAgent.id}
              onComplete={handleComplete}
            />
          )}

          {completedClient && summary && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Onboarding Complete! 🎉
                </h2>
                <Button
                  variant="outline"
                  onClick={() => {
                    setCompletedClient(null);
                    setSummary(null);
                  }}
                >
                  Start Another
                </Button>
              </div>
              <OnboardingSummaryReport
                summary={summary}
                clientName={`${completedClient.first_name} ${completedClient.last_name}`}
              />
            </div>
          )}
        </div>
      </div>
    </RoleGuard>
  );
}