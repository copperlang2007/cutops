import { ReactNode } from 'react';

interface ClayCardLightProps {
  children: ReactNode;
  title?: string;
}

export function ClayCardLight({ children, title }: ClayCardLightProps) {
  return (
    <div className="clay-light-card group">
      {title && (
        <h2 className="text-stone-800 mb-6 text-xl bg-gradient-to-r from-stone-700 to-neutral-600 bg-clip-text text-transparent">
          {title}
        </h2>
      )}
      {children}
    </div>
  );
}
