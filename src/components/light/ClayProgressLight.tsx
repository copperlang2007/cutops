interface ClayProgressLightProps {
  value: number;
  color?: 'purple' | 'pink' | 'blue' | 'cyan';
  label?: string;
}

export function ClayProgressLight({ value, color = 'purple', label }: ClayProgressLightProps) {
  const colors = {
    purple: 'clay-light-progress-purple',
    pink: 'clay-light-progress-pink',
    blue: 'clay-light-progress-blue',
    cyan: 'clay-light-progress-cyan'
  };

  return (
    <div>
      {label && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-stone-700 text-sm">{label}</span>
          <span className="text-stone-500 text-sm">{value}%</span>
        </div>
      )}
      <div className="clay-light-progress-track">
        <div
          className={`clay-light-progress-bar ${colors[color]}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
