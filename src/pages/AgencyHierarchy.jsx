import React from 'react';
import RoleGuard from '../components/shared/RoleGuard';
import AgencyHierarchyChart from '../components/hierarchy/AgencyHierarchyChart';

export default function AgencyHierarchy() {
  return (
    <RoleGuard pageName="AgencyManagement">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="max-w-7xl mx-auto p-6 space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Agency Hierarchy</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Visualize and manage your agency network structure
            </p>
          </div>

          <AgencyHierarchyChart />
        </div>
      </div>
    </RoleGuard>
  );
}