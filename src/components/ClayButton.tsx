import { ReactNode } from 'react';

interface ClayButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost';
  onClick?: () => void;
}

export function ClayButton({ children, variant = 'primary', onClick }: ClayButtonProps) {
  const variants = {
    primary: 'clay-button-primary',
    secondary: 'clay-button-secondary',
    accent: 'clay-button-accent',
    ghost: 'clay-button-ghost'
  };

  return (
    <button
      onClick={onClick}
      className={`${variants[variant]} clay-button-base`}
    >
      {children}
    </button>
  );
}
