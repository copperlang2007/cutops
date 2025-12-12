import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Award, Download, ExternalLink, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useUserRole } from '@/components/shared/RoleGuard';
import { hasTrainingPermission, canViewTrainingResource } from './trainingPermissions';

export default function CertificateViewer({ agentId, showAllAgents = false }) {
  const { user, roleType } = useUserRole();

  const { data: currentAgent } = useQuery({
    queryKey: ['currentAgent', user?.email],
    queryFn: async () => {
      const agents = await base44.entities.Agent.filter({ email: user.email });
      return agents[0];
    },
    enabled: !!user?.email
  });

  const canViewAll = hasTrainingPermission(roleType, 'certificates', 'viewAll');
  const effectiveAgentId = (showAllAgents && canViewAll) ? null : agentId;

  const { data: certificates = [], isLoading } = useQuery({
    queryKey: ['certificates', effectiveAgentId, showAllAgents],
    queryFn: () => {
      if (effectiveAgentId) {
        return base44.entities.Certificate.filter({ agent_id: effectiveAgentId }, '-completion_date');
      }
      return base44.entities.Certificate.list('-completion_date');
    }
  });

  // Filter certificates based on permissions
  const visibleCertificates = certificates.filter(cert => 
    canViewAll || canViewTrainingResource(roleType, 'certificates', cert.agent_id, currentAgent?.id)
  );

  const handleDownload = (certificate) => {
    window.open(certificate.certificate_url, '_blank');
  };

  if (isLoading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="py-12 text-center">
          <Loader2 className="w-8 h-8 mx-auto mb-2 text-teal-600 animate-spin" />
          <p className="text-sm text-slate-500">Loading certificates...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-600" />
          Training Certificates
        </CardTitle>
      </CardHeader>
      <CardContent>
        {visibleCertificates.length === 0 ? (
          <div className="text-center py-8">
            <Award className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="text-slate-500">No certificates earned yet</p>
            <p className="text-xs text-slate-400 mt-1">Complete training modules to earn certificates</p>
          </div>
        ) : (
          <div className="space-y-3">
            {visibleCertificates.map((cert) => (
              <div
                key={cert.id}
                className="p-4 rounded-lg border dark:border-slate-700 hover:border-teal-300 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-slate-900 dark:text-white">
                        {cert.training_title}
                      </h4>
                      <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                        <Award className="w-3 h-3 mr-1" />
                        Certified
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span>ID: {cert.certificate_id}</span>
                      <span>•</span>
                      <span>{format(new Date(cert.completion_date), 'MMM d, yyyy')}</span>
                      {cert.score && (
                        <>
                          <span>•</span>
                          <span className="text-teal-600 font-medium">Score: {cert.score}/100</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownload(cert)}
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Download
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => window.open(cert.certificate_url, '_blank')}
                    >
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {cert.metadata && (
                  <div className="flex gap-2 mt-2">
                    {cert.metadata.duration_hours && (
                      <Badge variant="outline" className="text-xs">
                        {cert.metadata.duration_hours} hours
                      </Badge>
                    )}
                    {cert.metadata.modules_completed && (
                      <Badge variant="outline" className="text-xs">
                        {cert.metadata.modules_completed} modules
                      </Badge>
                    )}
                    {cert.metadata.pathway_name && (
                      <Badge variant="outline" className="text-xs">
                        {cert.metadata.pathway_name}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}