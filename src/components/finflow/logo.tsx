interface LogoProps {
  className?: string;
  wordmarkClassName?: string;
  /** When true, hides the "Calculyx AI" wordmark and shows only the icon mark. */
  iconOnly?: boolean;
  ariaLabel?: string;
}

/**
 * Calculyx AI brand mark. Uses currentColor for the wordmark so it adapts to
 * light/dark themes; the icon keeps its brand gradient.
 *
 * Note: exported as `FinFlowLogo` for backwards-compatible imports across the app.
 */
export function FinFlowLogo({ className, wordmarkClassName, iconOnly = false, ariaLabel = "Calculyx AI" }: LogoProps) {
  if (iconOnly) {
    return (
      <svg
        viewBox="5 3 42 42"
        className={className}
        role="img"
        aria-label={ariaLabel}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <IconGradients prefix="cx-icon" />
        </defs>
        <IconPaths prefix="cx-icon" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 166.8 49"
      className={className ?? wordmarkClassName}
      role="img"
      aria-label={ariaLabel}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <IconGradients prefix="cx-full" />
      </defs>
      <IconPaths prefix="cx-full" />
      {/* "Calculyx" wordmark — currentColor for theme adaptation. */}
      <g fill="currentColor">
        <path d="m49.5 24c0-4.4 3.3-7.9 8.2-7.9 2.7 0 5.1 1.3 6.6 3.7l-2.1 1.3c-0.9-1.5-2.5-2.5-4.5-2.5-3.1 0-5.5 2.3-5.5 5.4 0 3 2.1 5.4 5.3 5.4 2.1 0 3.7-0.9 4.5-2.5l2.3 1.3c-1.3 2.3-3.4 3.6-6.7 3.7-4.4 0-8.1-3.2-8.1-7.9z" />
        <path d="m65.6 26.1c0-3.6 2.6-5.7 5.5-5.7 1.5 0 2.8 0.5 3.6 1.6v-1.4h2.3v11h-2.3v-1.4c-0.8 1.1-2.2 1.6-3.6 1.6-2.9 0-5.5-2.2-5.5-5.7zm9.1 0c0-2-1.4-3.4-3.3-3.4s-3.2 1.4-3.2 3.4 1.3 3.4 3.2 3.4 3.3-1.4 3.3-3.4z" />
        <path d="m79.6 15.8h2.5v15.8h-2.5v-15.8z" />
        <path d="m84.1 26.1c0-3.3 2.5-5.7 5.8-5.7 2 0 3.9 0.9 5 2.9l-2 1.2c-0.5-1-1.6-1.8-3-1.8-1.9 0-3.3 1.4-3.3 3.4 0 1.8 1.2 3.3 3.2 3.3 1.3 0 2.5-0.5 3.1-1.7l2 1.1c-0.8 1.9-2.7 3-5.1 3-3.1 0-5.7-2.2-5.7-5.7z" />
        <path d="m96.6 27.1v-6.5h2.5v6.3c0 1.7 0.8 2.7 2.4 2.7 1.4 0 2.6-1 2.6-3v-6h2.5v10.9h-2.4v-1.3c-0.7 1-1.8 1.6-3.3 1.6-2.9 0-4.3-1.7-4.3-4.7z" />
        <path d="m109.4 15.8h2.5v15.7h-2.5v-15.7z" />
        <path d="m117.8 31.1-4.3-10.5h2.8l3.1 7.8 3-7.8h2.6l-4.4 11.4c-1 2.7-2.7 3.8-5.6 3.8v-2.2c1.5 0 2.4-0.5 3.1-2.1l0.1-0.4z" />
        <path d="m129.2 25.9-3.7-5.3h3l2.4 3.5 2.5-3.5h3l-3.9 5.3 4 5.6h-3l-2.6-3.8-2.7 3.8h-3l4-5.6z" />
      </g>
      {/* "AI" wordmark — muted tone. */}
      <g fill="currentColor" opacity="0.55">
        <path d="m148.5 16.4h1.6l6.3 15.2h-2l-1.4-3.8h-6.9l-1.4 3.8h-2.1l5.9-15.2zm3.9 9.7-2.5-6.5-0.5-1.1-0.2 1.1-2.5 6.5h5.7z" />
        <path d="m158.1 16.4h2v15.1h-1.9l-0.1-15.1z" />
      </g>
    </svg>
  );
}

function IconGradients({ prefix }: { prefix: string }) {
  return (
    <>
      <linearGradient id={`${prefix}-g0`} x1="9.781" x2="39.36" y1="32.13" y2="14.81" gradientUnits="userSpaceOnUse">
        <stop stopColor="#1AE1F3" offset="0.1844" />
        <stop stopColor="#346DF1" offset="1" />
      </linearGradient>
      <linearGradient id={`${prefix}-g1`} x1="21.33" x2="43.74" y1="36.36" y2="36.36" gradientUnits="userSpaceOnUse">
        <stop stopColor="#1A4CB7" offset="0" />
        <stop stopColor="#346CF1" offset="0.932" />
      </linearGradient>
      <linearGradient id={`${prefix}-g2`} x1="28.56" x2="43.51" y1="14.38" y2="14.38" gradientUnits="userSpaceOnUse">
        <stop stopColor="#1B92E8" offset="0" />
        <stop stopColor="#346BF1" offset="0.9902" />
      </linearGradient>
    </>
  );
}

function IconPaths({ prefix }: { prefix: string }) {
  return (
    <>
      <path
        d="m39.4 28-8.6 8.5c-2.3 2.3-5.7 2.3-7.7 0.3l-1.8-1.9c-0.5 2-0.1 4.6 1.7 6.5 1.5 1.6 3.7 2.6 6.4 2.4 2.1-0.4 4.1-1.2 5.6-2.6l8.8-8.7-4.4-4.5zm-2.9-18.6c-2.6-3-5.6-4.9-9.6-4.9-3.2 0-6 1-8.4 3.2l-8.2 8.2c-4.7 4.7-4.7 12.3-0.1 17l7.7 7.5c3 3 6.7 4.1 10.5 3.5-1.9-0.1-3.8-1.1-4.9-2.4-1.9-2.1-2.7-5.8-0.9-8.9l2.7-3c2 0.5 4.1 0.1 5.4-1.3s1.8-3.3 1.3-5l4.4-4.4 4.6 4.5 2.5-15.5-7 1.5zm-7.9 16.9c-1 0.9-2.5 0.9-3.6 0-0.9-1-1.1-2.4-0.1-3.5 0.9-0.9 2.5-1.3 3.7-0.1 1.1 1 1 2.7 0 3.6zm-0.4-15.1 4 3.9-4 4.3c-1.7-0.7-3.6-0.1-4.9 1.1-1.4 1.2-2.1 3.1-1.7 5l-4.9 4.8-2.1-2.1c-1.9-2.1-2.1-5.5-0.1-7.5l8.1-8c2-2 4.2-2.1 6-1.5z"
        fill={`url(#${prefix}-g0)`}
      />
      <path
        d="m29.4 43.8c-2.3 0.2-4.9-0.8-6.4-2.4-1.7-1.8-2.3-4.5-1.7-6.5l1.7 1.5c2 2 5.4 2.3 7.7 0l8.7-8.4 4.3 4.5-8.6 8.5c-1.5 1.4-3.7 2.4-5.7 2.8z"
        fill={`url(#${prefix}-g1)`}
      />
      <path
        d="m28.6 11.2 7.9-1.8 7-1.5-2.5 15.5-4.6-4.4-4.5 4.4-3.7-4 4.3-4.3-3.9-3.9z"
        fill={`url(#${prefix}-g2)`}
      />
    </>
  );
}
