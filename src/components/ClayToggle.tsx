import { useState } from 'react';

interface ClayToggleProps {
  label?: string;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
}

export function ClayToggle({ label, defaultChecked = false, onChange }: ClayToggleProps) {
  const [checked, setChecked] = useState(defaultChecked);

  const handleToggle = () => {
    const newValue = !checked;
    setChecked(newValue);
    onChange?.(newValue);
  };

  return (
    <div className="flex items-center justify-between">
      {label && <span className="text-slate-300">{label}</span>}
      <button
        onClick={handleToggle}
        className={`clay-toggle ${checked ? 'clay-toggle-checked' : ''}`}
        role="switch"
        aria-checked={checked}
      >
        <span className={`clay-toggle-thumb ${checked ? 'clay-toggle-thumb-checked' : ''}`} />
      </button>
    </div>
  );
}
