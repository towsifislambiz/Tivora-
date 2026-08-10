import React, { useEffect, useState } from 'react';
import LiquidGlass from 'liquid-glass-react';

/**
 * Detects whether the real displacement effect is worth mounting.
 *
 * liquid-glass-react drives its refraction through an SVG feDisplacementMap
 * fed into `filter` alongside `backdrop-filter`. Only Chromium composites that
 * combination — Firefox skips the filter entirely (the library nulls it out)
 * and Safari renders the backdrop blur without any displacement. On those
 * engines the extra DOM, the resize observer and the mousemove listener buy
 * nothing, so we skip straight to the CSS pane.
 */
function detectLiquidGlassSupport() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;

  const ua = navigator.userAgent.toLowerCase();
  const isFirefox = ua.includes('firefox');
  const isChromium = ua.includes('chrome') || ua.includes('chromium') || ua.includes('edg');
  // Safari advertises "safari" but not "chrome"; Chrome advertises both.
  const isSafari = ua.includes('safari') && !isChromium;

  if (isFirefox || isSafari || !isChromium) return false;

  const supportsBackdrop =
    typeof CSS !== 'undefined' &&
    typeof CSS.supports === 'function' &&
    (CSS.supports('backdrop-filter', 'blur(1px)') || CSS.supports('-webkit-backdrop-filter', 'blur(1px)'));

  if (!supportsBackdrop) return false;

  // Heavy per-frame filter work is a poor trade for anyone asking for less motion.
  const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  return !prefersReducedMotion;
}

export function useLiquidGlassSupport() {
  // Start false so the server-safe / first paint is always the cheap pane,
  // then upgrade after mount once we can read the UA and media queries.
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported(detectLiquidGlassSupport());
  }, []);

  return supported;
}

/**
 * A floating glass panel.
 *
 * Layout contract: `className` styles the OUTER positioning box (give it a
 * size and a `fixed`/`absolute` placement). The glass itself is centred inside
 * that box, because liquid-glass-react hard-codes `top:50%; left:50%` with a
 * `translate(-50%, -50%)` transform. The CSS fallback centres identically, so
 * both branches occupy exactly the same pixels.
 *
 * The outer box is click-through; `children` get pointer events back.
 */
export default function GlassSurface({
  children,
  className = '',
  contentClassName = '',
  cornerRadius = 28,
  padding = '8px 16px',
  displacementScale = 64,
  // The library computes backdrop blur as (overLight ? 12 : 4) + blurAmount*32,
  // so its 0.0625 default is only ~6px — far too sheer to keep icons legible
  // over photos. ~0.4 lands around 17px, which reads as real frosted glass.
  blurAmount = 0.4,
  saturation = 160,
  aberrationIntensity = 2,
  elasticity = 0.1,
  mode = 'standard',
  onClick,
  style,
  ...rest
}) {
  // No theme subscription needed: every themed value below is a CSS custom
  // property, so a [data-theme] swap repaints without re-rendering.
  const supported = useLiquidGlassSupport();

  const centered = 'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2';

  if (!supported) {
    return (
      <div className={`pointer-events-none ${className}`} {...rest}>
        <div
          className={`glass-pane pointer-events-auto relative ${centered} ${contentClassName}`}
          style={{ borderRadius: `${cornerRadius}px`, padding, ...style }}
          onClick={onClick}
          role={onClick ? 'button' : undefined}
          tabIndex={onClick ? 0 : undefined}
          onKeyDown={onClick ? (e) => (e.key === 'Enter' || e.key === ' ') && onClick() : undefined}
        >
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className={`pointer-events-none ${className}`} {...rest}>
      <LiquidGlass
        cornerRadius={cornerRadius}
        padding={padding}
        displacementScale={displacementScale}
        blurAmount={blurAmount}
        saturation={saturation}
        aberrationIntensity={aberrationIntensity}
        elasticity={elasticity}
        mode={mode}
        // Deliberately off in both themes. `overLight` stacks two black
        // scrims so the library's own white text stays readable on pale
        // backdrops — but our light theme uses dark text on a light plate,
        // so it would only mute the panel into a grey slab. Our own themed
        // tint below does the legibility work instead.
        overLight={false}
        onClick={onClick}
        // top/left must be passed explicitly: the library forwards them to its
        // two shadow layers but spreads only `style` onto the glass container
        // itself, which already carries a translate(-50%, -50%). Without these
        // the panel anchors at 0,0 and is dragged half off-screen.
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          // The library ships no tint control, but `style` lands on its outer
          // container, which shrink-wraps the glass. The warp layer's
          // backdrop-filter samples this fill, so it sets the plate's base
          // tone — without it the panel resolves to a flat grey.
          backgroundColor: 'rgb(var(--glass-fill) / var(--glass-fill-alpha))',
          borderRadius: `${cornerRadius}px`,
          ...style,
        }}
      >
        {/* The library stamps `text-white` and a `font: 500 20px/1 system-ui`
            shorthand on its content wrapper. Reassert our own type and colour
            so light mode and the brand font survive. */}
        <div className={`pointer-events-auto font-sans text-brand-mainText [font-size:initial] [line-height:initial] ${contentClassName}`}>
          {children}
        </div>
      </LiquidGlass>
    </div>
  );
}
