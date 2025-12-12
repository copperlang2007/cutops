import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check localStorage and system preference on mount
    const stored = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = stored === 'dark' || (!stored && prefersDark);
    
    setIsDark(shouldBeDark);
    if (shouldBeDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    
    if (newIsDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "relative h-9 w-[4.5rem] rounded-full transition-all duration-500",
        "clay-morphism p-0.5",
        "hover:scale-105"
      )}
      aria-label="Toggle theme"
    >
      {/* Sliding Orb */}
      <div
        className={cn(
          "absolute top-0.5 h-8 w-8 rounded-full transition-all duration-500",
          "bg-gradient-to-br from-slate-800 to-slate-900 dark:from-slate-700 dark:to-slate-800 shadow-lg",
          "flex items-center justify-center",
          isDark ? "left-[calc(100%-2.125rem)]" : "left-0.5"
        )}
      >
        {isDark ? (
          <Moon className="w-4 h-4 text-blue-200" />
        ) : (
          <Sun className="w-4 h-4 text-amber-500" />
        )}
      </div>
      
      {/* Background Icons */}
      <div className="absolute inset-0 flex items-center justify-between px-2.5 pointer-events-none">
        <Sun className={cn(
          "w-4 h-4 transition-opacity duration-300",
          isDark ? "opacity-20" : "opacity-0",
          "text-amber-500"
        )} />
        <Moon className={cn(
          "w-4 h-4 transition-opacity duration-300",
          isDark ? "opacity-0" : "opacity-20",
          "text-blue-400"
        )} />
      </div>
    </button>
  );
}