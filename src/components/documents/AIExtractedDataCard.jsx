import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Calendar, Users, MapPin, FileText, AlertTriangle, CheckCircle, DollarSign } from 'lucide-react';

export default function AIExtractedDataCard({ document }) {
  if (!document.ai_extracted_data) return null;

  const data = document.ai_extracted_data;
  const compliance = data.compliance || {};

  const getComplianceColor = (status) => {
    switch (status) {
      case 'compliant': return 'bg-green-100 text-green-700 border-green-200';
      case 'warning': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'critical': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <Card className="border-0 shadow-sm dark:bg-slate-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="w-5 h-5 text-purple-600" />
          AI-Extracted Information
          <Badge variant="outline" className="text-xs">
            {data.confidence}% confidence
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Document Type */}
        {data.document_type && (
          <div>
            <p className="text-xs text-slate-500 mb-1">Document Type</p>
            <Badge className="bg-purple-100 text-purple-700 border-purple-200">
              {data.document_type}
            </Badge>
          </div>
        )}

        {/* Summary */}
        {data.summary && (
          <div>
            <p className="text-xs text-slate-500 mb-1">Summary</p>
            <p className="text-sm text-slate-700 dark:text-slate-300">{data.summary}</p>
          </div>
        )}

        {/* Key Dates */}
        {data.key_dates && Object.values(data.key_dates).some(v => v) && (
          <div>
            <p className="text-xs text-slate-500 mb-2 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Key Dates
            </p>
            <div className="grid grid-cols-2 gap-2">
              {data.key_dates.issue_date && (
                <div className="text-sm">
                  <span className="text-slate-500">Issue:</span>{' '}
                  <span className="text-slate-700 dark:text-slate-300">{data.key_dates.issue_date}</span>
                </div>
              )}
              {data.key_dates.effective_date && (
                <div className="text-sm">
                  <span className="text-slate-500">Effective:</span>{' '}
                  <span className="text-slate-700 dark:text-slate-300">{data.key_dates.effective_date}</span>
                </div>
              )}
              {data.key_dates.expiration_date && (
                <div className="text-sm">
                  <span className="text-slate-500">Expires:</span>{' '}
                  <span className="text-slate-700 dark:text-slate-300">{data.key_dates.expiration_date}</span>
                </div>
              )}
              {data.key_dates.renewal_date && (
                <div className="text-sm">
                  <span className="text-slate-500">Renewal:</span>{' '}
                  <span className="text-slate-700 dark:text-slate-300">{data.key_dates.renewal_date}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Parties */}
        {data.parties && (
          <div>
            <p className="text-xs text-slate-500 mb-2 flex items-center gap-1">
              <Users className="w-3 h-3" />
              Parties
            </p>
            <div className="space-y-1">
              {data.parties.primary_name && (
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  <span className="font-medium">{data.parties.primary_name}</span>
                </p>
              )}
              {data.parties.carrier && (
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Carrier: {data.parties.carrier}
                </p>
              )}
              {data.parties.agency && (
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Agency: {data.parties.agency}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Identifiers */}
        {data.identifiers && Object.values(data.identifiers).some(v => v) && (
          <div>
            <p className="text-xs text-slate-500 mb-2 flex items-center gap-1">
              <FileText className="w-3 h-3" />
              Identifiers
            </p>
            <div className="space-y-1">
              {Object.entries(data.identifiers).map(([key, value]) => 
                value && (
                  <p key={key} className="text-sm text-slate-600 dark:text-slate-400">
                    {key.replace(/_/g, ' ')}: <span className="font-mono">{value}</span>
                  </p>
                )
              )}
            </div>
          </div>
        )}

        {/* Territories */}
        {data.territories && data.territories.length > 0 && (
          <div>
            <p className="text-xs text-slate-500 mb-2 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              Territories
            </p>
            <div className="flex flex-wrap gap-1">
              {data.territories.map(state => (
                <Badge key={state} variant="outline" className="text-xs">
                  {state}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Financial */}
        {data.financial && Object.values(data.financial).some(v => v) && (
          <div>
            <p className="text-xs text-slate-500 mb-2 flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              Financial Details
            </p>
            <div className="space-y-1">
              {data.financial.coverage_amount && (
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Coverage: {data.financial.coverage_amount}
                </p>
              )}
              {data.financial.commission_rate && (
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Commission: {data.financial.commission_rate}
                </p>
              )}
              {data.financial.premium && (
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Premium: {data.financial.premium}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Compliance Status */}
        <div>
          <p className="text-xs text-slate-500 mb-2 flex items-center gap-1">
            {compliance.status === 'compliant' ? (
              <CheckCircle className="w-3 h-3 text-green-600" />
            ) : (
              <AlertTriangle className="w-3 h-3 text-amber-600" />
            )}
            Compliance Status
          </p>
          <Badge className={getComplianceColor(compliance.status)}>
            {compliance.status || 'unknown'}
          </Badge>

          {compliance.issues && compliance.issues.length > 0 && (
            <div className="mt-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-xs font-medium text-red-700 dark:text-red-400 mb-1">Issues:</p>
              <ul className="list-disc list-inside space-y-1">
                {compliance.issues.map((issue, i) => (
                  <li key={i} className="text-xs text-red-600 dark:text-red-400">{issue}</li>
                ))}
              </ul>
            </div>
          )}

          {compliance.warnings && compliance.warnings.length > 0 && (
            <div className="mt-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-1">Warnings:</p>
              <ul className="list-disc list-inside space-y-1">
                {compliance.warnings.map((warning, i) => (
                  <li key={i} className="text-xs text-amber-600 dark:text-amber-400">{warning}</li>
                ))}
              </ul>
            </div>
          )}

          {compliance.missing_info && compliance.missing_info.length > 0 && (
            <div className="mt-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Missing Info:</p>
              <ul className="list-disc list-inside space-y-1">
                {compliance.missing_info.map((info, i) => (
                  <li key={i} className="text-xs text-slate-600 dark:text-slate-400">{info}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}