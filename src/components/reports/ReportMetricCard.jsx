import { Card } from '@/components/ui/card';

const colorClasses = {
  teal: 'bg-teal-100 text-teal-600',
  green: 'bg-emerald-100 text-emerald-600',
  blue: 'bg-blue-100 text-blue-600',
  red: 'bg-red-100 text-red-600',
  slate: 'bg-slate-100 text-slate-600',
  purple: 'bg-purple-100 text-purple-600'
};

export default function ReportMetricCard({ title, value, subtitle, icon: Icon, color = 'teal' }) {
  return (
    <Card className="border-0 shadow-sm p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </Card>
  );
}