import { Loader2 } from 'lucide-react';

/**
 * Reusable loading spinner component
 * @param {object} props
 * @param {string} props.size - Size variant: 'sm', 'md', 'lg'
 * @param {string} props.message - Optional loading message
 * @param {boolean} props.fullScreen - Whether to display full screen
 */
export default function LoadingSpinner({ 
  size = 'md', 
  message = '', 
  fullScreen = false 
}) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center gap-3">
      <Loader2 className={`${sizeClasses[size]} text-teal-600 animate-spin`} />
      {message && (
        <p className="text-sm text-slate-500">{message}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        {spinner}
      </div>
    );
  }

  return spinner;
}