import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import ClientSatisfactionSurvey from '../components/portal/ClientSatisfactionSurvey';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, AlertCircle } from 'lucide-react';

export default function Survey() {
  const [searchParams] = useSearchParams();
  const surveyId = searchParams.get('id');

  const { data: survey, isLoading } = useQuery({
    queryKey: ['survey', surveyId],
    queryFn: async () => {
      const surveys = await base44.entities.ClientSurvey.filter({ id: surveyId });
      return surveys[0];
    },
    enabled: !!surveyId
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <Card className="max-w-md border-0 shadow-lg dark:bg-slate-800">
          <CardContent className="pt-8 pb-6 text-center">
            <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
            <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">Survey Not Found</h2>
            <p className="text-slate-500 dark:text-slate-400">
              This survey link may be invalid or expired.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (survey.status === 'completed') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <Card className="max-w-md border-0 shadow-lg dark:bg-slate-800">
          <CardContent className="pt-8 pb-6 text-center">
            <AlertCircle className="w-12 h-12 mx-auto text-amber-500 mb-4" />
            <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">Already Completed</h2>
            <p className="text-slate-500 dark:text-slate-400">
              You've already completed this survey. Thank you for your feedback!
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (survey.status === 'expired' || new Date(survey.expires_date) < new Date()) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <Card className="max-w-md border-0 shadow-lg dark:bg-slate-800">
          <CardContent className="pt-8 pb-6 text-center">
            <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
            <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">Survey Expired</h2>
            <p className="text-slate-500 dark:text-slate-400">
              This survey link has expired. Please contact your agent if you'd like to provide feedback.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-12 px-4">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center mb-4">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Client Satisfaction Survey
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Help us improve our service
        </p>
      </div>

      <ClientSatisfactionSurvey 
        surveyId={surveyId}
        onComplete={() => {
          // Survey completed, component will show thank you message
        }}
      />
    </div>
  );
}