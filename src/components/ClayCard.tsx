import { ReactNode } from 'react';

interface ClayCardProps {
  children: ReactNode;
  title?: string;
}

export function ClayCard({ children, title }: ClayCardProps) {
  return (
    <div className="clay-card group">
      {title && (
        <h2 className="text-slate-200 mb-6 text-xl bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
          {title}
        </h2>
      )}
      {children}
    </div>
  );
}
