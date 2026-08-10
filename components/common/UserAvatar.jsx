import React, { useState } from 'react';

/**
 * UserAvatar — Facebook-style profile picture with a beautiful gradient
 * initials fallback when no photo is set.
 *
 * @param {string|null} src         - Photo URL (optional)
 * @param {string}      name        - Display name (for initials + alt text)
 * @param {string}      [size]      - Tailwind size class e.g. "w-10 h-10"
 * @param {string}      [className] - Extra classes to add to the root element
 * @param {Function}    [onClick]   - Click handler
 */
export default function UserAvatar({ src, name, size = 'w-10 h-10', className = '', onClick }) {
  const [imgError, setImgError] = useState(false);

  const initials = getInitials(name);
  const colorClass = getColorClass(name);

  const baseClass = `${size} rounded-full object-cover flex-shrink-0 ${className}`;

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={name ? `${name}'s profile photo` : 'Profile photo'}
        className={`${baseClass} border-2 border-brand-border`}
        loading="lazy"
        decoding="async"
        onError={() => setImgError(true)}
        onClick={onClick}
        style={onClick ? { cursor: 'pointer' } : undefined}
      />
    );
  }

  // Facebook-style gradient initials avatar
  return (
    <div
      className={`${baseClass} ${colorClass} flex items-center justify-center font-bold text-white select-none`}
      onClick={onClick}
      style={onClick ? { cursor: 'pointer' } : undefined}
      aria-label={name ? `${name}'s profile picture` : 'Profile picture'}
      role={onClick ? 'button' : undefined}
    >
      <span style={{ fontSize: getFontSize(size) }}>{initials}</span>
    </div>
  );
}

/**
 * Extract up to 2 initials from display name.
 */
function getInitials(name) {
  if (!name || !name.trim()) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.trim().slice(0, 2).toUpperCase();
}

/**
 * Deterministic color based on first character of name — like Facebook/Google.
 */
function getColorClass(name) {
  const colors = [
    'bg-gradient-to-br from-violet-500 to-purple-700',
    'bg-gradient-to-br from-pink-500 to-rose-600',
    'bg-gradient-to-br from-blue-500 to-indigo-600',
    'bg-gradient-to-br from-emerald-500 to-teal-600',
    'bg-gradient-to-br from-amber-500 to-orange-600',
    'bg-gradient-to-br from-cyan-500 to-blue-600',
    'bg-gradient-to-br from-fuchsia-500 to-pink-600',
    'bg-gradient-to-br from-red-500 to-rose-700',
  ];

  if (!name) return colors[0];
  const idx = name.charCodeAt(0) % colors.length;
  return colors[idx];
}

/**
 * Compute font size from the Tailwind size class string.
 */
function getFontSize(sizeClass) {
  if (sizeClass.includes('w-24') || sizeClass.includes('w-28') || sizeClass.includes('w-32')) return '2rem';
  if (sizeClass.includes('w-16') || sizeClass.includes('w-20')) return '1.5rem';
  if (sizeClass.includes('w-12') || sizeClass.includes('w-14')) return '1.1rem';
  if (sizeClass.includes('w-8')  || sizeClass.includes('w-9'))  return '0.7rem';
  return '0.85rem'; // default w-10
}
