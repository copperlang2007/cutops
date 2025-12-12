import React from 'react';
import RoleGuard from '@/components/shared/RoleGuard';
import WorkflowAutomationDashboard from '@/components/automation/WorkflowAutomationDashboard';

export default function Automation() {
  return (
    <RoleGuard requiredRole="super_admin">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-7xl mx-auto">
          <WorkflowAutomationDashboard />
        </div>
      </div>
    </RoleGuard>
  );
}