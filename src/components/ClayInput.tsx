import { ReactNode } from 'react';

interface ClayInputProps {
  placeholder?: string;
  type?: string;
  icon?: ReactNode;
}

export function ClayInput({ placeholder, type = 'text', icon }: ClayInputProps) {
  return (
    <div className="relative">
      {icon && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          {icon}
        </div>
      )}
      <input
        type={type}
        placeholder={placeholder}
        className={`clay-input w-full ${icon ? 'pl-12' : ''}`}
      />
    </div>
  );
}
