import React from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

const OPTIONS = [
  { value: 'light', label: 'Light', Icon: Sun },
  { value: 'system', label: 'System', Icon: Monitor },
  { value: 'dark', label: 'Dark', Icon: Moon },
];

/**
 * Segmented light / system / dark control.
 *
 * `variant="icon"` collapses to a single round button that cycles the three
 * preferences — used in the topbar where space is tight.
 */
export default function ThemeToggle({ variant = 'segmented', className = '' }) {
  const { preference, resolvedTheme, setPreference } = useTheme();

  if (variant === 'icon') {
    const activeIndex = OPTIONS.findIndex((o) => o.value === preference);
    const next = OPTIONS[(activeIndex + 1) % OPTIONS.length];
    const Current = OPTIONS[activeIndex === -1 ? 1 : activeIndex].Icon;

    return (
      <button
        onClick={() => setPreference(next.value)}
        className={`w-10 h-10 rounded-full bg-brand-lavender text-brand-mainText hover:text-brand-purple hover:bg-brand-purple/10 flex items-center justify-center transition-colors ${className}`}
        title={`Theme: ${preference} (${resolvedTheme}) — click for ${next.label}`}
        aria-label={`Switch theme, currently ${preference}`}
      >
        <Current className="w-4 h-4" />
      </button>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-1 p-1 rounded-full bg-brand-lavender border border-brand-border ${className}`}
      role="radiogroup"
      aria-label="Colour theme"
    >
      {OPTIONS.map(({ value, label, Icon }) => {
        const isActive = preference === value;
        return (
          <button
            key={value}
            role="radio"
            aria-checked={isActive}
            onClick={() => setPreference(value)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              isActive
                ? 'bg-primary-gradient text-white shadow-gradient-glow'
                : 'text-brand-mutedText hover:text-brand-purple'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
