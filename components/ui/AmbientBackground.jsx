import React from 'react';

/**
 * Fixed, non-interactive colour field that lives behind the entire app.
 *
 * Liquid glass has nothing to bend on a flat background — this supplies the
 * luminance and hue variation that makes refraction and chromatic aberration
 * legible. Pure CSS (transform + opacity only) so it stays on the compositor
 * and costs no main-thread time.
 */
export default function AmbientBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      style={{ backgroundColor: 'rgb(var(--brand-bg))' }}
    >
      <div
        className="aurora-blob animate-aurora-slow absolute -top-[20%] -left-[10%] h-[70vmax] w-[70vmax] rounded-full will-change-transform"
        style={{
          background: 'radial-gradient(circle, rgb(var(--aurora-1) / var(--aurora-opacity)) 0%, transparent 68%)',
          filter: 'blur(var(--aurora-blur))',
        }}
      />
      <div
        className="aurora-blob animate-aurora-slower absolute -bottom-[25%] -right-[15%] h-[75vmax] w-[75vmax] rounded-full will-change-transform"
        style={{
          background: 'radial-gradient(circle, rgb(var(--aurora-2) / var(--aurora-opacity)) 0%, transparent 68%)',
          filter: 'blur(var(--aurora-blur))',
          animationDelay: '-8s',
        }}
      />
      <div
        className="aurora-blob animate-aurora-slow absolute top-[30%] left-[45%] h-[55vmax] w-[55vmax] rounded-full will-change-transform"
        style={{
          background: 'radial-gradient(circle, rgb(var(--aurora-3) / var(--aurora-opacity)) 0%, transparent 68%)',
          filter: 'blur(var(--aurora-blur))',
          animationDelay: '-16s',
        }}
      />

      {/* Fine grain breaks up the gradient banding that large blurs produce. */}
      <div
        className="absolute inset-0 opacity-[0.035] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
    </div>
  );
}
