import { useState } from 'react'
import { base44 } from '@/api/base44Client'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Database, Sparkles, Loader2, CheckCircle, XCircle, AlertTriangle,
  RefreshCw, Shield, ExternalLink, Clock
} from 'lucide-react';
import { format } from 'date-fns'
import { toast } from 'sonner'

export default function NIPRVerificationService({ 
  agent, 
  licenses = [],
  onVerificationComplete,
  onFlagLicense,
  onCreateAlert,
  onCreateTask
}) {
  const [verificationResults, setVerificationResults] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const verifyWithNIPR = async () => {
    setIsVerifying(true);
    try {
      // Simulate NIPR API verification with AI analysis
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Simulate a comprehensive NIPR (National Insurance Producer Registry) verification for this agent:

AGENT INFORMATION:
- Name: ${agent.first_name} ${agent.last_name}
- NPN: ${agent.npn}
- State: ${agent.state || 'Not specified'}
- Date of Birth: ${agent.date_of_birth || 'Not provided'}

LICENSES ON FILE:
${licenses.map(l => `- ${l.state}: License #${l.license_number}, Status: ${l.status}, Expires: ${l.expiration_date || 'Unknown'}`).join('\n')}

Perform these verification checks:
1. Validate NPN format and existence (10 digit number)
2. Verify each license number format matches state standards
3. Check license status against expected NIPR statuses (Active, Inactive, Expired, Revoked, Suspended)
4. Verify expiration dates are accurate
5. Check for any regulatory actions or disciplinary history
6. Verify appointment status with carriers
7. Check CE (Continuing Education) compliance status
8. Verify Lines of Authority (LOA) match license types

For each license, provide:
- Verification status (verified, discrepancy, expired, not_found)
- NIPR record status
- Any flags or issues
- Recommended actions`,
        response_json_schema: {
          type: "object",
          properties: {
            npn_verification: {
              type: "object",
              properties: {
                is_valid: { type: "boolean" },
                npn_status: { type: "string" },
                producer_name_match: { type: "boolean" },
                registration_date: { type: "string" }
              }
            },
            license_verifications: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  state: { type: "string" },
                  license_number: { type: "string" },
                  verification_status: { type: "string" },
                  nipr_status: { type: "string" },
                  expiration_date: { type: "string" },
                  lines_of_authority: { type: "array", items: { type: "string" } },
                  ce_status: { type: "string" },
                  discrepancies: { type: "array", items: { type: "string" } },
                  flags: { type: "array", items: { type: "string" } }
                }
              }
            },
            regulatory_actions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: { type: "string" },
                  state: { type: "string" },
                  date: { type: "string" },
                  description: { type: "string" },
                  severity: { type: "string" }
                }
              }
            },
            overall_status: { type: "string" },
            risk_score: { type: "number" },
            recommended_actions: { type: "array", items: { type: "string" } },
            verification_timestamp: { type: "string" }
          }
        }
      });

      setVerificationResults({
        ...result,
        verification_timestamp: new Date().toISOString()
      });

      // Flag licenses with discrepancies
      if (onFlagLicense && result.license_verifications) {
        for (const verification of result.license_verifications) {
          if (verification.verification_status === 'discrepancy' || verification.flags?.length > 0) {
            const license = licenses.find(l => l.state === verification.state);
            if (license) {
              onFlagLicense(license, verification.discrepancies?.join(', ') || 'NIPR verification discrepancy');
            }
          }
        }
      }

      // Create alerts for critical issues
      if (onCreateAlert && result.regulatory_actions?.length > 0) {
        for (const action of result.regulatory_actions) {
          if (action.severity === 'high' || action.severity === 'critical') {
            await onCreateAlert({
              agent_id: agent.id,
              alert_type: 'adverse_action',
              severity: 'critical',
              title: `Regulatory Action: ${action.type}`,
              message: `${action.description} (${action.state}, ${action.date})`
            });
          }
        }
      }

      // Auto-create tasks for flagged issues
      if (onCreateTask && result.recommended_actions?.length > 0) {
        for (const action of result.recommended_actions) {
          await onCreateTask({
            title: `NIPR Verification: ${action}`,
            description: `Auto-generated task from NIPR verification for ${agent.first_name} ${agent.last_name}`,
            task_type: 'compliance',
            priority: result.risk_score > 60 ? 'urgent' : 'high',
            due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          });
        }
      }

      // Create tasks for license discrepancies
      if (onCreateTask && result.license_verifications) {
        for (const verification of result.license_verifications) {
          if (verification.verification_status === 'discrepancy' || verification.flags?.length > 0) {
            await onCreateTask({
              title: `Review License Discrepancy: ${verification.state}`,
              description: `NIPR verification found issues with ${verification.state} license #${verification.license_number}. Issues: ${verification.discrepancies?.join(', ') || verification.flags?.join(', ')}`,
              task_type: 'compliance',
              priority: 'urgent',
              due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            });
          }
        }
      }

      onVerificationComplete?.(result);
      
      if (result.overall_status === 'verified') {
        toast.success('NIPR verification complete - all clear');
      } else {
        toast.warning('NIPR verification found issues requiring attention');
      }
    } catch (err) {
      console.error('NIPR verification failed:', err);
      toast.error('Failed to complete NIPR verification');
    } finally {
      setIsVerifying(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'verified': return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'discrepancy': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'expired': return <Clock className="w-4 h-4 text-red-500" />;
      case 'not_found': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <AlertTriangle className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-600" />
            NIPR License Verification
          </CardTitle>
          <Button
            size="sm"
            onClick={verifyWithNIPR}
            disabled={isVerifying}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isVerifying ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Verifying...
              </>
            ) : verificationResults ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Re-verify
              </>
            ) : (
              <>
                <Shield className="w-4 h-4 mr-2" />
                Verify with NIPR
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!verificationResults && !isVerifying && (
          <div className="text-center py-6 text-slate-400">
            <Database className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Click to verify agent credentials against NIPR database</p>
          </div>
        )}

        {verificationResults && (
          <div className="space-y-4">
            {/* Overall Status */}
            <div className={`p-4 rounded-lg border ${
              verificationResults.overall_status === 'verified' ? 'bg-emerald-50 border-emerald-200' :
              verificationResults.overall_status === 'issues_found' ? 'bg-amber-50 border-amber-200' :
              'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {verificationResults.overall_status === 'verified' ? (
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                  )}
                  <span className="font-medium">
                    {verificationResults.overall_status === 'verified' ? 'All Credentials Verified' : 'Issues Detected'}
                  </span>
                </div>
                <Badge className={
                  verificationResults.risk_score <= 30 ? 'bg-emerald-100 text-emerald-700' :
                  verificationResults.risk_score <= 60 ? 'bg-amber-100 text-amber-700' :
                  'bg-red-100 text-red-700'
                }>
                  Risk Score: {verificationResults.risk_score}/100
                </Badge>
              </div>
              <Progress 
                value={100 - verificationResults.risk_score} 
                className={`h-2 ${
                  verificationResults.risk_score <= 30 ? '[&>div]:bg-emerald-500' :
                  verificationResults.risk_score <= 60 ? '[&>div]:bg-amber-500' :
                  '[&>div]:bg-red-500'
                }`}
              />
            </div>

            {/* NPN Verification */}
            {verificationResults.npn_verification && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <h4 className="text-sm font-medium text-slate-700 mb-2">NPN Verification</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    {verificationResults.npn_verification.is_valid ? (
                      <CheckCircle className="w-3 h-3 text-emerald-500" />
                    ) : (
                      <XCircle className="w-3 h-3 text-red-500" />
                    )}
                    <span>NPN Valid</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {verificationResults.npn_verification.producer_name_match ? (
                      <CheckCircle className="w-3 h-3 text-emerald-500" />
                    ) : (
                      <XCircle className="w-3 h-3 text-red-500" />
                    )}
                    <span>Name Match</span>
                  </div>
                  <div className="col-span-2 text-slate-500">
                    Status: {verificationResults.npn_verification.npn_status}
                  </div>
                </div>
              </div>
            )}

            {/* License Verifications */}
            {verificationResults.license_verifications?.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-slate-700 mb-2">License Verification Results</h4>
                <div className="space-y-2">
                  {verificationResults.license_verifications.map((verification, i) => (
                    <div key={i} className={`p-3 rounded-lg border ${
                      verification.verification_status === 'verified' ? 'bg-emerald-50 border-emerald-200' :
                      verification.verification_status === 'discrepancy' ? 'bg-amber-50 border-amber-200' :
                      'bg-red-50 border-red-200'
                    }`}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(verification.verification_status)}
                          <span className="text-sm font-medium">{verification.state}</span>
                          <span className="text-xs text-slate-500">#{verification.license_number}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {verification.nipr_status}
                        </Badge>
                      </div>
                      <div className="text-xs text-slate-600 mb-1">
                        Expires: {verification.expiration_date} | CE: {verification.ce_status}
                      </div>
                      {verification.lines_of_authority?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-1">
                          {verification.lines_of_authority.map((loa, j) => (
                            <Badge key={j} variant="outline" className="text-[10px]">{loa}</Badge>
                          ))}
                        </div>
                      )}
                      {verification.flags?.length > 0 && (
                        <div className="mt-2 p-2 bg-white rounded">
                          {verification.flags.map((flag, j) => (
                            <p key={j} className="text-xs text-red-600">⚠ {flag}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Regulatory Actions */}
            {verificationResults.regulatory_actions?.length > 0 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="text-sm font-medium text-red-800 mb-2">Regulatory Actions Found</h4>
                <div className="space-y-2">
                  {verificationResults.regulatory_actions.map((action, i) => (
                    <div key={i} className="p-2 bg-white rounded border border-red-100">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-red-700">{action.type}</span>
                        <Badge variant="outline" className={
                          action.severity === 'critical' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                        }>
                          {action.severity}
                        </Badge>
                      </div>
                      <p className="text-xs text-red-600 mt-1">{action.description}</p>
                      <p className="text-xs text-slate-500">{action.state} - {action.date}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommended Actions */}
            {verificationResults.recommended_actions?.length > 0 && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-sm font-medium text-blue-800 mb-2">Recommended Actions</h4>
                <ul className="space-y-1">
                  {verificationResults.recommended_actions.map((action, i) => (
                    <li key={i} className="text-xs text-blue-700">• {action}</li>
                  ))}
                </ul>
              </div>
            )}

            <p className="text-xs text-slate-400 text-center">
              Last verified: {format(new Date(verificationResults.verification_timestamp), 'MMM d, yyyy h:mm a')}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}