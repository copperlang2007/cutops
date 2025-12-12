import { ReactNode } from 'react';

interface ClayInputLightProps {
  placeholder?: string;
  type?: string;
  icon?: ReactNode;
}

export function ClayInputLight({ placeholder, type = 'text', icon }: ClayInputLightProps) {
  return (
    <div className="relative">
      {icon && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none">
          {icon}
        </div>
      )}
      <input
        type={type}
        placeholder={placeholder}
        className={`clay-light-input w-full ${icon ? 'pl-12' : ''}`}
      />
    </div>
  );
}
