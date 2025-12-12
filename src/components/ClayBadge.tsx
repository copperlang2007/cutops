import { ReactNode } from 'react';

interface ClayBadgeProps {
  children: ReactNode;
  color?: 'purple' | 'pink' | 'blue' | 'cyan' | 'violet';
}

export function ClayBadge({ children, color = 'purple' }: ClayBadgeProps) {
  const colors = {
    purple: 'clay-badge-purple',
    pink: 'clay-badge-pink',
    blue: 'clay-badge-blue',
    cyan: 'clay-badge-cyan',
    violet: 'clay-badge-violet'
  };

  return (
    <span className={`${colors[color]} clay-badge-base`}>
      {children}
    </span>
  );
}
