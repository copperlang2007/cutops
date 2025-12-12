import { ReactNode } from 'react';

interface ClayBadgeLightProps {
  children: ReactNode;
  color?: 'purple' | 'pink' | 'blue' | 'cyan' | 'violet';
}

export function ClayBadgeLight({ children, color = 'purple' }: ClayBadgeLightProps) {
  const colors = {
    purple: 'clay-light-badge-purple',
    pink: 'clay-light-badge-pink',
    blue: 'clay-light-badge-blue',
    cyan: 'clay-light-badge-cyan',
    violet: 'clay-light-badge-violet'
  };

  return (
    <span className={`${colors[color]} clay-light-badge-base`}>
      {children}
    </span>
  );
}
