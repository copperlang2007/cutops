import React from 'react';
import AICampaignBuilder from '@/components/campaigns/AICampaignBuilder';
import RoleGuard from '@/components/shared/RoleGuard';

export default function CampaignManager() {
  return (
    <RoleGuard pageName="CampaignManager">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6">
        <div className="max-w-7xl mx-auto">
          <AICampaignBuilder />
        </div>
      </div>
    </RoleGuard>
  );
}