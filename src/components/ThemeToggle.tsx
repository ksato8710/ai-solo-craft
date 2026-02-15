'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        className="p-2 rounded-lg bg-slate-800/50 text-slate-400"
        aria-label="Toggle theme"
      >
        <span className="w-5 h-5 block">🌙</span>
      </button>
    );
  }

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="p-2 rounded-lg bg-slate-800/50 dark:bg-slate-800/50 light:bg-slate-200/80 text-slate-400 hover:text-slate-200 dark:hover:text-slate-200 hover:bg-slate-700/50 transition-all duration-200"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      title={theme === 'dark' ? 'ライトモードに切り替え' : 'ダークモードに切り替え'}
    >
      <span className="w-5 h-5 block text-lg">
        {theme === 'dark' ? '☀️' : '🌙'}
      </span>
    </button>
  );
}
