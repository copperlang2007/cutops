import RoleGuard from '@/components/shared/RoleGuard';
import AILeadQualificationPanel from '@/components/leads/AILeadQualificationPanel';

export default function Leads() {
  return (
    <RoleGuard requiredRole="super_admin">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-7xl mx-auto">
          <AILeadQualificationPanel />
        </div>
      </div>
    </RoleGuard>
  );
}