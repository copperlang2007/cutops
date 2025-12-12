import { useState } from 'react';

interface ClayToggleLightProps {
  label?: string;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
}

export function ClayToggleLight({ label, defaultChecked = false, onChange }: ClayToggleLightProps) {
  const [checked, setChecked] = useState(defaultChecked);

  const handleToggle = () => {
    const newValue = !checked;
    setChecked(newValue);
    onChange?.(newValue);
  };

  return (
    <div className="flex items-center justify-between">
      {label && <span className="text-stone-700">{label}</span>}
      <button
        onClick={handleToggle}
        className={`clay-light-toggle ${checked ? 'clay-light-toggle-checked' : ''}`}
        role="switch"
        aria-checked={checked}
      >
        <span className={`clay-light-toggle-thumb ${checked ? 'clay-light-toggle-thumb-checked' : ''}`} />
      </button>
    </div>
  );
}
