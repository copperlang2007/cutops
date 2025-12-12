import { ReactNode } from 'react';

interface ClayButtonLightProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost';
  onClick?: () => void;
}

export function ClayButtonLight({ children, variant = 'primary', onClick }: ClayButtonLightProps) {
  const variants = {
    primary: 'clay-light-button-primary',
    secondary: 'clay-light-button-secondary',
    accent: 'clay-light-button-accent',
    ghost: 'clay-light-button-ghost'
  };

  return (
    <button
      onClick={onClick}
      className={`${variants[variant]} clay-light-button-base`}
    >
      {children}
    </button>
  );
}
