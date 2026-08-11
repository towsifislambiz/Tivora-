import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';

export const ThemeContext = createContext(null);

const STORAGE_KEY = 'tivora:theme-preference';
const VALID_PREFERENCES = ['system', 'light', 'dark'];

function readStoredPreference() {
  if (typeof window === 'undefined') return 'system';
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return VALID_PREFERENCES.includes(stored) ? stored : 'system';
  } catch {
    // Private mode / storage disabled — fall back to following the OS.
    return 'system';
  }
}

function readSystemTheme() {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }) {
  const [preference, setPreferenceState] = useState(readStoredPreference);
  const [systemTheme, setSystemTheme] = useState(readSystemTheme);

  // Track OS-level changes so 'system' stays live without a reload.
  useEffect(() => {
    if (!window.matchMedia) return undefined;
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (event) => setSystemTheme(event.matches ? 'dark' : 'light');

    query.addEventListener('change', handleChange);
    return () => query.removeEventListener('change', handleChange);
  }, []);

  const resolvedTheme = preference === 'system' ? systemTheme : preference;

  // Paint the resolved theme onto <html> — Tailwind reads `.dark`, our CSS vars read [data-theme].
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', resolvedTheme === 'dark');
    root.dataset.theme = resolvedTheme;
    root.style.colorScheme = resolvedTheme;
  }, [resolvedTheme]);

  const setPreference = useCallback((next) => {
    const value = VALID_PREFERENCES.includes(next) ? next : 'system';
    setPreferenceState(value);
    try {
      window.localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // Non-fatal: the theme still applies for this session.
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setPreference(resolvedTheme === 'dark' ? 'light' : 'dark');
  }, [resolvedTheme, setPreference]);

  const value = useMemo(
    () => ({ preference, resolvedTheme, isDark: resolvedTheme === 'dark', setPreference, toggleTheme }),
    [preference, resolvedTheme, setPreference, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
