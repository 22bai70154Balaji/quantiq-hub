interface LogoProps {
  className?: string;
  wordmarkClassName?: string;
  /** When true, hides the "FinFlow AI" wordmark and shows only the icon mark. */
  iconOnly?: boolean;
  ariaLabel?: string;
}

/**
 * FinFlow AI brand mark. Uses currentColor for the wordmark so it adapts to
 * light/dark themes; the icon keeps its brand blue→cyan gradient.
 */
export function FinFlowLogo({ className, wordmarkClassName, iconOnly = false, ariaLabel = "FinFlow AI" }: LogoProps) {
  if (iconOnly) {
    return (
      <svg
        viewBox="8 8 50 45"
        className={className}
        role="img"
        aria-label={ariaLabel}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <IconGradient id="ff-icon-grad" />
        </defs>
        <IconPaths gradId="ff-icon-grad" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 199.5 58"
      className={className ?? wordmarkClassName}
      role="img"
      aria-label={ariaLabel}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <IconGradient id="ff-full-grad" />
      </defs>
      <IconPaths gradId="ff-full-grad" />
      {/* "FinFlow" wordmark — currentColor for theme adaptation. */}
      <g fill="currentColor">
        <path d="m57.6 19h14.3v3.6h-10.2v5h8.8v3.7h-8.8v8.2h-4.1v-20.5z" />
        <path d="m74.1 19h4.1v4h-4.2l0.1-4zm0 5.5h4.1v15h-4.1v-15z" />
        <path d="m81.5 24.5h3.5l0.1 1.7c0.7-0.9 2-2 4.3-2 3.9 0 5.8 2.3 5.8 6v9.3h-3.8v-8.6c0-1.9-1.1-3.1-2.9-3.1s-2.9 1.4-3.1 3v8.8h-3.9v-15.1z" />
        <path d="m98.5 19h13.6v3.6h-9.6v5.2h8.7v3.5h-8.7v8.2h-4v-20.5z" />
        <path d="m114.8 18.8h3.9v20.6h-3.9v-20.6z" />
        <path d="m129.3 24.2c4.5-0.1 8.2 3.1 8.3 7.6s-2.8 7.9-7.8 7.9c-4.1 0-8.2-2.5-8.3-7.7 0-4 3-7.6 7.8-7.8zm0.2 12.1c2.1 0 4.1-1.4 4.1-4.2 0-2.5-1.7-4.4-4-4.4-2 0-4.1 1.6-4 4.3 0 2.6 1.9 4.3 3.9 4.3z" />
        <path d="m138.5 24.5h4.3l2.9 9.3 3.3-9.3h3.8l3 9.3 2.8-9.3h4.3l-5.3 15h-3.6l-3.1-9.8-3.5 9.8h-3.6l-5.3-15z" />
      </g>
      {/* "AI" wordmark — muted tone. */}
      <g fill="currentColor" opacity="0.55">
        <path d="m175.5 19h2.8l7.3 20.5h-2.6l-1.8-5.2h-9.1l-2 5.2h-2.7l8.1-20.5zm-2.7 13.2h7.6l-3.5-10.4-4.1 10.4z" />
        <path d="m188.2 19h2.5v20.5h-2.5v-20.5z" />
      </g>
    </svg>
  );
}

function IconGradient({ id }: { id: string }) {
  return (
    <linearGradient id={id} x1="11.69" x2="44.13" y1="40.4" y2="13.8" gradientUnits="userSpaceOnUse">
      <stop stopColor="#00B3DE" offset="0.1" />
      <stop stopColor="#1F5AF4" offset="1" />
    </linearGradient>
  );
}

function IconPaths({ gradId }: { gradId: string }) {
  return (
    <>
      <path
        d="m20.8 17.4c1.4-3.1 4.2-6.3 6.9-8h-5.3c-7 0-13.2 5.2-13.2 13.1v11.3c1.9-3 4.7-5.8 7.5-7.6l-0.1-3.6c0-2.3 1.9-4.8 4.2-5.2z"
        fillRule="evenodd"
        clipRule="evenodd"
        fill="#1F5AF4"
      />
      <path
        d="m22.2 38.6v9.8c4.3 0 7.4-3.2 7.4-7.1v-5.2h-0.8c-2.3-0.2-5 1-6.6 2.5z"
        fillRule="evenodd"
        clipRule="evenodd"
        fill="#00B3DA"
      />
      <path
        d="m37.6 9.6c-7.6 0-15.4 6.2-15.4 15.3v1.8c-5 1.3-13 6.8-13 17.4v4.4h7.4v-3.6c0-7.3 5.9-11.5 11.8-11.5h6.8c2.7 0.1 6.4-3.2 6.5-7.6h-11.9v-0.8c0-4.4 3.5-7.8 7.6-7.8h4.1c3.7 0 7.6-2.8 7.6-7.6h-11.5z"
        fill={`url(#${gradId})`}
      />
    </>
  );
}
