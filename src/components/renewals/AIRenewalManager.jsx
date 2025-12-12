import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2, Mail, Calendar, TrendingUp, Send, Copy, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function AIRenewalManager({ policy, clientEmail }) {
  const [renewalComm, setRenewalComm] = useState(null);

  const daysUntilRenewal = policy.expiration_date 
    ? Math.ceil((new Date(policy.expiration_date) - new Date()) / (1000 * 60 * 60 * 24))
    : null;

  const generateRenewalMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('aiRenewalCommunication', {
        policyId: policy.id,
        daysUntilRenewal
      });
      return response.data;
    },
    onSuccess: (data) => {
      setRenewalComm(data.renewal_communication);
      toast.success('Renewal communication generated');
    },
    onError: () => toast.error('Generation failed')
  });

  const sendEmailMutation = useMutation({
    mutationFn: async () => {
      await base44.integrations.Core.SendEmail({
        to: clientEmail,
        subject: renewalComm.renewal_email.subject,
        body: renewalComm.renewal_email.body
      });
    },
    onSuccess: () => {
      toast.success('Renewal email sent!');
    }
  });

  return (
    <div className="space-y-4">
      <Card className="clay-morphism border-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-teal-600" />
              AI Renewal Management
            </CardTitle>
            {daysUntilRenewal !== null && (
              <Badge className={
                daysUntilRenewal <= 30 ? 'bg-red-100 text-red-700' :
                daysUntilRenewal <= 60 ? 'bg-amber-100 text-amber-700' :
                'bg-blue-100 text-blue-700'
              }>
                {daysUntilRenewal} days until renewal
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={() => generateRenewalMutation.mutate()}
            disabled={generateRenewalMutation.isPending}
            className="w-full bg-gradient-to-r from-teal-500 to-emerald-600"
          >
            {generateRenewalMutation.isPending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating...</>
            ) : (
              <><Sparkles className="w-4 h-4 mr-2" />Generate Renewal Plan</>
            )}
          </Button>

          {renewalComm && (
            <div className="space-y-4">
              {/* Renewal Likelihood */}
              <div className="p-4 clay-subtle rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-slate-900 dark:text-white">Renewal Likelihood</h3>
                  <Badge className={
                    renewalComm.renewal_likelihood >= 80 ? 'bg-green-100 text-green-700' :
                    renewalComm.renewal_likelihood >= 60 ? 'bg-amber-100 text-amber-700' :
                    'bg-red-100 text-red-700'
                  }>
                    {renewalComm.renewal_likelihood}%
                  </Badge>
                </div>
                {renewalComm.risk_factors?.length > 0 && (
                  <div className="space-y-1 mb-3">
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">Risk Factors:</p>
                    {renewalComm.risk_factors.map((risk, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <AlertTriangle className="w-3 h-3 text-amber-600 mt-0.5 shrink-0" />
                        <span className="text-xs text-slate-700 dark:text-slate-300">{risk}</span>
                      </div>
                    ))}
                  </div>
                )}
                {renewalComm.opportunities?.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">Opportunities:</p>
                    {renewalComm.opportunities.map((opp, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <TrendingUp className="w-3 h-3 text-green-600 mt-0.5 shrink-0" />
                        <span className="text-xs text-slate-700 dark:text-slate-300">{opp}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Renewal Email */}
              <Card className="border-0 shadow-sm dark:bg-slate-800">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Renewal Email
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          navigator.clipboard.writeText(renewalComm.renewal_email.body);
                          toast.success('Email copied');
                        }}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => sendEmailMutation.mutate()}
                        disabled={sendEmailMutation.isPending}
                        className="bg-teal-600 hover:bg-teal-700"
                      >
                        {sendEmailMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <><Send className="w-4 h-4 mr-1" />Send</>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                    <p className="text-xs text-slate-500 mb-1">Subject:</p>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {renewalComm.renewal_email.subject}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                    <p className="text-xs text-slate-500 mb-2">Body:</p>
                    <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap max-h-64 overflow-y-auto">
                      {renewalComm.renewal_email.body}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline">{renewalComm.renewal_email.tone} tone</Badge>
                    <Badge variant="outline">Send: {renewalComm.renewal_email.send_timing}</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Talking Points */}
              {renewalComm.talking_points?.length > 0 && (
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white mb-2">Key Talking Points</h3>
                  <div className="space-y-2">
                    {renewalComm.talking_points.map((point, i) => (
                      <div key={i} className="p-3 clay-subtle rounded-lg">
                        <h4 className="font-medium text-sm text-slate-900 dark:text-white mb-1">{point.topic}</h4>
                        <p className="text-xs text-slate-700 dark:text-slate-300 mb-2">{point.key_message}</p>
                        {point.supporting_facts?.length > 0 && (
                          <ul className="space-y-1">
                            {point.supporting_facts.map((fact, fi) => (
                              <li key={fi} className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-1">
                                <span className="text-teal-600">•</span> {fact}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Retention Strategies */}
              {renewalComm.retention_strategies?.length > 0 && (
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white mb-2">Retention Strategies</h3>
                  <div className="space-y-2">
                    {renewalComm.retention_strategies.map((strategy, i) => (
                      <div key={i} className="p-3 clay-subtle rounded-lg">
                        <div className="flex items-start justify-between mb-1">
                          <h4 className="font-medium text-sm text-slate-900 dark:text-white">{strategy.strategy}</h4>
                          <Badge variant="outline" className="text-xs">{strategy.expected_effectiveness}</Badge>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400">{strategy.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}