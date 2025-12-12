import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, TrendingDown, Shield } from 'lucide-react';

export default function SentimentComplianceIntegration({ clientId }) {
  const { data: client } = useQuery({
    queryKey: ['client', clientId],
    queryFn: async () => {
      const clients = await base44.entities.Client.filter({ id: clientId });
      return clients[0];
    },
    enabled: !!clientId
  });

  const { data: flags = [] } = useQuery({
    queryKey: ['complianceFlags', clientId],
    queryFn: () => base44.entities.ComplianceFlag.filter({ client_id: clientId }),
    enabled: !!clientId
  });

  if (!client) return null;

  const isNegativeSentiment = ['negative', 'very_negative'].includes(client.current_sentiment);
  const isDeclining = client.sentiment_trend === 'declining';
  const hasComplianceIssues = flags.filter(f => f.status === 'pending_review').length > 0;

  if (!isNegativeSentiment && !isDeclining && !hasComplianceIssues) {
    return null;
  }

  return (
    <Card className="border-2 border-amber-300 bg-amber-50 dark:bg-amber-900/20">
      <CardContent className="pt-4">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
          <p className="font-semibold text-amber-900 dark:text-amber-200">
            Sentiment & Compliance Alert
          </p>
        </div>
        
        <div className="space-y-2">
          {isNegativeSentiment && (
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-red-600" />
              <p className="text-sm text-amber-800 dark:text-amber-300">
                Client has <Badge className="bg-red-600">negative sentiment</Badge> - Extra care needed in communications
              </p>
            </div>
          )}
          
          {isDeclining && (
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-orange-600" />
              <p className="text-sm text-amber-800 dark:text-amber-300">
                Sentiment is <Badge className="bg-orange-600">declining</Badge> - Monitor closely
              </p>
            </div>
          )}
          
          {hasComplianceIssues && (
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-600" />
              <p className="text-sm text-amber-800 dark:text-amber-300">
                <Badge className="bg-purple-600">{flags.length} compliance flags</Badge> detected
              </p>
            </div>
          )}
        </div>

        <div className="mt-3 p-2 rounded bg-amber-100 dark:bg-amber-900/40 text-xs text-amber-900 dark:text-amber-200">
          <strong>Recommendation:</strong> Use empathetic language, avoid pressure tactics, focus on addressing concerns
        </div>
      </CardContent>
    </Card>
  );
}