interface ClayProgressProps {
  value: number;
  color?: 'purple' | 'pink' | 'blue' | 'cyan';
  label?: string;
}

export function ClayProgress({ value, color = 'purple', label }: ClayProgressProps) {
  const colors = {
    purple: 'clay-progress-purple',
    pink: 'clay-progress-pink',
    blue: 'clay-progress-blue',
    cyan: 'clay-progress-cyan'
  };

  return (
    <div>
      {label && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-slate-300 text-sm">{label}</span>
          <span className="text-slate-400 text-sm">{value}%</span>
        </div>
      )}
      <div className="clay-progress-track">
        <div
          className={`clay-progress-bar ${colors[color]}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
