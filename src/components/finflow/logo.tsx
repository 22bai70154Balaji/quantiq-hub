interface LogoProps {
  className?: string;
  wordmarkClassName?: string;
  /** When true, hides the "FinFlow AI" wordmark and shows only the icon mark. */
  iconOnly?: boolean;
  ariaLabel?: string;
}

/**
 * FinFlow AI brand mark. Uses currentColor for the wordmark so it adapts to
 * light/dark themes; the icon keeps its brand gradient.
 */
export function FinFlowLogo({ className, wordmarkClassName, iconOnly = false, ariaLabel = "FinFlow AI" }: LogoProps) {
  if (iconOnly) {
    return (
      <svg
        viewBox="17 19 84 57"
        className={className}
        role="img"
        aria-label={ariaLabel}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="ff-icon-a" x1="33.5" x2="91.3" y1="-577.1" y2="-577.1" gradientTransform="matrix(1 0 0 -1 0 -546)" gradientUnits="userSpaceOnUse">
            <stop stopColor="#014A92" offset="0" />
            <stop stopColor="#0BE8FB" offset="1" />
          </linearGradient>
          <linearGradient id="ff-icon-b" x1="34.44" x2="99.4" y1="-586.7" y2="-586.7" gradientTransform="matrix(1 0 0 -1 0 -546)" gradientUnits="userSpaceOnUse">
            <stop stopColor="#015FA9" offset="0" />
            <stop stopColor="#0BE8FB" offset=".8465" />
          </linearGradient>
        </defs>
        <IconPaths />
      </svg>
    );
  }

  return (
    <svg
      viewBox="6 18.5 247 55"
      className={className ?? wordmarkClassName}
      role="img"
      aria-label={ariaLabel}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="ff-full-a" x1="33.5" x2="91.3" y1="-577.1" y2="-577.1" gradientTransform="matrix(1 0 0 -1 0 -546)" gradientUnits="userSpaceOnUse">
          <stop stopColor="#014A92" offset="0" />
          <stop stopColor="#0BE8FB" offset="1" />
        </linearGradient>
        <linearGradient id="ff-full-b" x1="34.44" x2="99.4" y1="-586.7" y2="-586.7" gradientTransform="matrix(1 0 0 -1 0 -546)" gradientUnits="userSpaceOnUse">
          <stop stopColor="#015FA9" offset="0" />
          <stop stopColor="#0BE8FB" offset=".8465" />
        </linearGradient>
      </defs>
      <IconPaths full />
      {/* Wordmark – uses currentColor so it adapts to theme (dark/light). */}
      <g fill="currentColor">
        <path d="m108.4 55.8v-19h13.6v3.6h-9.2v4.8h8.1v3.8h-8.1v6.8h-4.4z" />
        <path d="m126.3 35c1.3 0 2.3 1 2.3 2.3 0 1.4-1.1 2.3-2.3 2.3-1.4 0-2.3-1-2.3-2.3-0.1-1.3 0.9-2.3 2.3-2.3zm-1.9 20.8v-14.3h3.9v14.3h-3.9z" />
        <path d="m132 41.5h3.8l0.1 1.6c0.7-1 2.2-1.9 4.4-1.9 2.6 0 5.2 1.5 5.2 5.9v8.7h-3.9v-7.8c0-1.8-0.9-3.2-2.7-3.2-2 0-3.1 1.4-3.1 3.5v7.5h-3.9l0.1-14.3z" />
        <path d="m148.5 55.8v-19h13.3v3.6h-9v5.1h8.1v3.5h-8.1v6.8h-4.3z" />
        <path d="m164.4 55.8v-19.9h4v19.9h-4z" />
        <path d="m170.9 48.6c0-4.5 3.1-7.4 7.2-7.4 4.2 0 7.4 2.8 7.4 7.3s-3 7.6-7.3 7.6-7.3-2.9-7.3-7.5zm10.8 0c0-2.3-1.3-3.9-3.3-3.9-2.1 0-3.4 1.5-3.4 4 0 2.3 1.4 3.9 3.4 3.9s3.3-1.7 3.3-4z" />
        <path d="m205.1 41.5h3.9l-4 14.3h-4l-2.8-8.8-2.9 8.8h-3.9l-4.8-14.3h4l3 9.7 3-9.7h3.6l2.8 9.7 2.9-9.7h-0.8z" />
        <path d="m224.4 36.8h3.9l7.7 19h-4.2l-1.5-3.9h-7.8l-1.6 3.9h-4.3l7.8-19zm-1 11.8h5.5l-2.9-7.4-2.7 7.4h0.1z" />
        <path d="m237.3 36.8h4.1v19h-4.1v-19z" />
      </g>
    </svg>
  );
}

function IconPaths({ full = false }: { full?: boolean }) {
  const gradA = full ? "url(#ff-full-a)" : "url(#ff-icon-a)";
  const gradB = full ? "url(#ff-full-b)" : "url(#ff-icon-b)";
  return (
    <>
      <path d="m19 19c-0.9 0.6-1.6 1.8-1.6 3.1v50.2c0 1.8 1.4 3.1 3.2 3.1h13.4c4-0.7 6.3-3.5 7.6-4.4h-5.6c-0.6 0.1-1.2-0.4-1.2-1.1v-7.8c0-0.6 0.5-1.2 1.2-1.2h6.3l1.2-3.9h-6.5c-0.7 0-1.3-0.6-1.3-1.3v-5.6c0-0.6 0.5-1.1 1.2-1.1l11.5-0.1-1.2-3.8v-7.2l7.5-1.2c0.6-1.2 1.1-2.6 1.7-3.9 2.1-4.7 5.7-10.6 11.8-13.8h-47.7-1.5zm11.3 48.3c0 0.6-0.5 1.2-1.2 1.2h-6.1c-0.7 0-1.2-0.5-1.2-1.2v-5.3c0-0.6 0.5-1.2 1.2-1.2h6.2c0.6 0 1.2 0.5 1.2 1.2v5.3h-0.1zm0-11.6c0 0.6-0.5 1.2-1.2 1.2h-6.1c-0.7 0-1.2-0.5-1.2-1.2v-5.5c0-0.7 0.5-1.2 1.2-1.2h6.2c0.7 0 1.2 0.5 1.2 1.2v5.5h-0.1zm0-12.1c0 0.6-0.5 1.2-1.2 1.2h-6.1c-0.7 0-1.2-0.5-1.2-1.2v-5.6c0-0.7 0.5-1.2 1.1-1.2h6.1c0.7 0 1.3 0.5 1.3 1.2v5.6zm13.2 23.5c0 0.8-0.6 1.4-1.2 1.4h-6.4c-0.6 0-1.1-0.5-1.1-1.2v-5.3c0-0.7 0.5-1.2 1.2-1.2h6c0.8 0 1.5 0.6 1.5 1.3v5zm-0.4-10.3h-7.2l-0.4-0.5v-6.1l0.6-1.2h5.6c1.3 0 2.1 0.7 2.1 1.4l-0.1 6.1-0.6 0.3zm-0.3-11.8h-6.9l-0.6-0.7v-6.3l0.7-1.2h6l1.1 0.4 0.3 1v6.1l-0.6 0.7zm13.6-13.3c0 0.6-0.5 1.1-1 1.1h-32.7c-0.6 0-1.1-0.5-1.1-1.2v-7.1c0-0.6 0.4-1.1 1-1.1h32.7c0.6 0 1 0.5 1 1.1l0.1 7.2z" fill="#092550" className="dark:fill-[#e2e8f0]" />
      <path d="m89.9 23.9c-2.3-3-6-4.9-10.8-5-9.9-0.2-15.8 5.7-19.4 13.8-3.2 7.5-6.2 11.9-11.3 12.8-3.4 1.2-9.8 1.3-12.7 1v2.7l7.3 1.8 4.4-2.1 1.1 0.3h6.2l7.2 12.6 26.7-13.3c-4.9 0-9.5-3.1-10.6-7.2-1.4-5.2 2.9-9.9 7.5-10.3 2.9-0.2 5.6 1.2 7.6 3.8v-3.2c-0.1-3.3-1.7-6.1-3.2-7.7z" fill={gradA} />
      <path d="m85.3 45c-3.9-0.5-8.1-3.2-8.5-7.8-0.3-4.2 3-8.2 7.4-8.2 3.3 0 5.6 1.7 7.1 2.8-1.3-2.3-5-5.7-10.2-5.7-8.7 0-12 5-15.1 9.9-3.7 6.1-7.3 12.3-14 12.9-2.2 0.1-3.4 0-3.4 0l-3.1 8v7.4c-1.5 1.5-1.9 3.1-2.1 4.5-0.6 1.3-6.4 4.9-9 6.3h18.5c5.5 0 9-1.5 11.9-4 4.5-4.1 6.2-6.7 12.8-6.7h3.6c1.8 0 2.7-0.8 2.7-2.4s-0.9-2.1-2.6-2.1h-14.2l-0.1-3.5 11.3-1.4h4.2c1.5 0 2.5-0.6 2.5-2.2s-1-2.4-2.3-2.4h-8.1l12.4-1.5 10.9-1.9c1.5 0 1.6-2 0-2h-12.6z" fill={gradB} />
      <path d="m54.9 48.8h-6.1c-0.8 0-1.3 0.6-1.3 1.3v17.1c0 0.7 0.5 1.3 1.3 1.3h6c0.8 0 1.4-0.6 1.4-1.3l-0.1-17c0.1-0.7-0.5-1.4-1.2-1.4z" fill="#0CE8F8" />
      <path d="m83.3 52.6h-9.5c-1.1 0-1.8 0.7-1.8 1.7 0 1.1 0.7-1.5 1.6-1.7l-1.5-0.1c0.2 1 0.7 0.1 1.8 0.1h9.4c1 0 1.9 0.9 1.9 2s-0.9 1.9-1.9 1.9h-16.6c-0.8 0-1.6 0.8-1.6 1.8 0 0.9 0.8 1.7 1.6 1.7h13.7c1.2 0 2 0.8 2 2 0 1.1-0.8 1.9-2 1.9h-6c-5.8 0-7.2 1.8-10.9 5l4.5-4.4-3-2.5-0.5-0.8 0.6-4.2v-2l1.4-3.2 4.4-2.9 3.7 0.1h8.7c1.1 0 2 1 2 2s-1 1.6-2 1.6z" fill="#0CE8F8" />
      <path d="m86.2 60.3h4.2c1 0 1.7 0.8 1.7 1.9 0 1.2-0.8 1.9-1.7 1.9h-3.8c-1 0-1.9-0.8-1.9-1.9 0-0.9 0.7-1.9 1.5-1.9z" fill="#0D6BB2" />
      <path d="m88.2 54.1h4.2c1 0 2.7 0.7 2.6 2.1-0.1 1.7-1.3 0-2 0l-3 0.3-1.6-0.1-0.8-0.7v-1l0.6-0.6z" fill="#78DEB6" />
      <path d="m62.5 73c3.5-1.7 6.5-6.5 10.9-6.8h7.2c-1.3 1.7-6.4 6.7-14.3 6.9h-4.3l0.5-0.1z" fill="#78DEB6" />
      <path d="m84.9 48.9h12.9c1.2 0 1.3-3.9-0.9-3.9h-12v3.9z" fill="#0CE8F8" />
      <path d="m47.3 43.5v-5.5l1-1.4 5.6-0.1c-1.3 2.8-4.1 6-6.6 7z" fill="#78DEB6" />
      <path d="m91.5 34.6 1.7 2.1c-2.1 1.2-6.8 4.9-8.7 5.7h8.1l3.7-2.6 1.9 2.5 3.5-8.5-10.2 0.8z" fill="#78DEB6" />
      <path d="m88.5 52.6h4.5c1.1 0 2 0.9 2 1.9s-0.9 1.9-2 1.9h-3.5c-1.1 0-2-0.8-2-1.9s0.8-1.9 1-1.9z" fill="#78DEB6" />
    </>
  );
}
