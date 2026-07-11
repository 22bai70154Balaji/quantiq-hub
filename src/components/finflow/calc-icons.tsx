/**
 * Custom SVG icons for each Calculyx AI calculator.
 * Designed as a matching set — 24×24 grid, 1.6 stroke, rounded joins,
 * with a subtle accent fill so they read as bespoke pictograms rather than
 * generic lucide glyphs. All icons inherit `currentColor` so they tint from
 * the parent gradient badge.
 */
import * as React from "react";

type Props = React.SVGProps<SVGSVGElement> & { className?: string };

const base: React.SVGProps<SVGSVGElement> = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  xmlns: "http://www.w3.org/2000/svg",
};

const softFill = "currentColor";
const softOpacity = 0.18;

export function CurrencyIcon(p: Props) {
  return (
    <svg {...base} {...p}>
      <circle cx="8.5" cy="8.5" r="4.75" fill={softFill} fillOpacity={softOpacity} />
      <circle cx="8.5" cy="8.5" r="4.75" />
      <path d="M8.5 6.4v4.2M7 7.6c.4-.6 1-.9 1.6-.9.9 0 1.4.5 1.4 1.1 0 1.4-2.9 1-2.9 2.4 0 .6.5 1.1 1.4 1.1.6 0 1.2-.3 1.6-.9" />
      <circle cx="15.5" cy="15.5" r="4.75" fill={softFill} fillOpacity={softOpacity} />
      <circle cx="15.5" cy="15.5" r="4.75" />
      <path d="M13.7 14.2h3.6M13.7 16.2h3.6M14.6 13v5" />
      <path d="M6 15.5l3-3M18 8.5l-3 3" strokeOpacity="0.55" />
    </svg>
  );
}

export function MortgageIcon(p: Props) {
  return (
    <svg {...base} {...p}>
      <path d="M3.5 11.5 12 4.5l8.5 7" fill={softFill} fillOpacity={softOpacity} />
      <path d="M3.5 11.5 12 4.5l8.5 7" />
      <path d="M5.5 11v8.5h13V11" />
      <path d="M10 19.5v-4h4v4" />
      <path d="M15.5 6V4.5h2.5V8" strokeOpacity="0.6" />
      <circle cx="12" cy="13" r="0.9" fill="currentColor" />
    </svg>
  );
}

export function HomeLoanIcon(p: Props) {
  return (
    <svg {...base} {...p}>
      <path d="M4 11 12 5l8 6v8.5H4z" fill={softFill} fillOpacity={softOpacity} />
      <path d="M4 11 12 5l8 6" />
      <path d="M5.5 11v8.5h13V11" />
      <rect x="9.5" y="13" width="5" height="6.5" rx="0.8" />
      <path d="M12 15.5v1.6M12 17.6l.9.9M12 17.6l-.9.9" strokeOpacity="0.6" />
      <circle cx="17" cy="8" r="1.4" fill="currentColor" fillOpacity="0.35" />
      <path d="M17 7.3v1.4M16.3 8h1.4" strokeOpacity="0.7" />
    </svg>
  );
}

export function IncomeTaxIcon(p: Props) {
  return (
    <svg {...base} {...p}>
      <rect x="4.5" y="3.5" width="15" height="17" rx="2" fill={softFill} fillOpacity={softOpacity} />
      <rect x="4.5" y="3.5" width="15" height="17" rx="2" />
      <path d="M8 8h8M8 11.5h5" />
      <path d="M15.5 14.5l-4 4M15.5 18.5l-4-4" strokeOpacity="0.85" />
      <circle cx="12" cy="14.5" r="0.8" fill="currentColor" />
      <circle cx="15" cy="17.5" r="0.8" fill="currentColor" />
    </svg>
  );
}

export function GstIcon(p: Props) {
  return (
    <svg {...base} {...p}>
      <path d="M6 4h9.5L20 8.5V20a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" fill={softFill} fillOpacity={softOpacity} />
      <path d="M15.5 4v4.5H20" />
      <path d="M6 4h9.5L20 8.5V20a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" />
      <path d="M9 17.5l6-6" />
      <circle cx="9.6" cy="12.1" r="1.2" />
      <circle cx="14.4" cy="16.9" r="1.2" />
    </svg>
  );
}

export function SalaryIcon(p: Props) {
  return (
    <svg {...base} {...p}>
      <rect x="3.5" y="6.5" width="17" height="11" rx="1.8" fill={softFill} fillOpacity={softOpacity} />
      <rect x="3.5" y="6.5" width="17" height="11" rx="1.8" />
      <circle cx="12" cy="12" r="2.6" />
      <path d="M12 10.6v2.8M11 11.6c.2-.4.6-.6 1-.6.6 0 .9.3.9.7 0 .9-1.9.7-1.9 1.6 0 .4.3.7.9.7.4 0 .8-.2 1-.6" />
      <path d="M6 10.5v-.2M6 13.5v.2M18 10.5v-.2M18 13.5v.2" strokeOpacity="0.5" />
    </svg>
  );
}

export function SipIcon(p: Props) {
  return (
    <svg {...base} {...p}>
      <path d="M4 19h16" />
      <path d="M4 19c1-6 3.5-9 6-9s3.5 3 5 3 3-2 5-6" fill={softFill} fillOpacity={softOpacity} />
      <path d="M4 19c1-6 3.5-9 6-9s3.5 3 5 3 3-2 5-6" />
      <circle cx="10" cy="10" r="1.3" fill="currentColor" />
      <circle cx="15" cy="13" r="1.3" fill="currentColor" />
      <path d="M18 4h2v2" />
      <path d="M20 4l-4 4" strokeOpacity="0.6" />
    </svg>
  );
}

export function FdIcon(p: Props) {
  return (
    <svg {...base} {...p}>
      <rect x="3.5" y="7.5" width="17" height="10" rx="1.6" fill={softFill} fillOpacity={softOpacity} />
      <rect x="3.5" y="7.5" width="17" height="10" rx="1.6" />
      <path d="M3.5 10.5h17M3.5 14.5h17" strokeOpacity="0.5" />
      <path d="M12 4.5v3M12 16.5v3" strokeOpacity="0.6" />
      <circle cx="12" cy="12.5" r="1.8" />
      <path d="M12 11.4v2.2" />
    </svg>
  );
}

export function CompoundIcon(p: Props) {
  return (
    <svg {...base} {...p}>
      <path d="M3.5 20V4M3.5 20h17" />
      <path d="M6 17l2-1 2 1 2-3 2 0 2-4 2-1 2-3" fill="none" />
      <path d="M6 17l2-1 2 1 2-3 2 0 2-4 2-1 2-3" />
      <path d="M6 17v3h13V9" fill={softFill} fillOpacity={softOpacity} stroke="none" />
      <circle cx="8" cy="16" r="1" fill="currentColor" />
      <circle cx="12" cy="14" r="1" fill="currentColor" />
      <circle cx="16" cy="8" r="1" fill="currentColor" />
    </svg>
  );
}

export function InflationIcon(p: Props) {
  return (
    <svg {...base} {...p}>
      <path d="M12 3.5c3.5 3.6 5.5 6.4 5.5 9.5a5.5 5.5 0 1 1-11 0c0-3.1 2-5.9 5.5-9.5z" fill={softFill} fillOpacity={softOpacity} />
      <path d="M12 3.5c3.5 3.6 5.5 6.4 5.5 9.5a5.5 5.5 0 1 1-11 0c0-3.1 2-5.9 5.5-9.5z" />
      <path d="M9 15c.4 1 1.4 1.6 2.4 1.6" strokeOpacity="0.7" />
      <path d="M14.5 8.5l-5 5M10 9.5v0M14 13v0" strokeOpacity="0.85" />
    </svg>
  );
}

export function RetirementIcon(p: Props) {
  return (
    <svg {...base} {...p}>
      <circle cx="9" cy="6.5" r="2" fill={softFill} fillOpacity={softOpacity} />
      <circle cx="9" cy="6.5" r="2" />
      <path d="M9 8.5v5.5M9 14l-2.5 5.5M9 14l2.5 5.5" />
      <path d="M9 10.5l3 1.2 3-1" />
      <path d="M17.5 20c0-3.5-1.5-8-4-11M13.5 15c1.5-.5 3-.5 4.5 0M17.5 20c1-2 2.5-3.5 3-4M13 20h9" />
    </svg>
  );
}

export function PropertyIcon(p: Props) {
  return (
    <svg {...base} {...p}>
      <rect x="3.5" y="8.5" width="7" height="12" rx="0.8" fill={softFill} fillOpacity={softOpacity} />
      <rect x="3.5" y="8.5" width="7" height="12" rx="0.8" />
      <rect x="10.5" y="4.5" width="10" height="16" rx="0.8" />
      <path d="M5.5 11.5h3M5.5 14.5h3M5.5 17.5h3" strokeOpacity="0.65" />
      <path d="M12.5 7.5h2M16.5 7.5h2M12.5 10.5h2M16.5 10.5h2M12.5 13.5h2M16.5 13.5h2M12.5 16.5h2M16.5 16.5h2" strokeOpacity="0.65" />
      <path d="M14.5 20.5v-3h2v3" />
    </svg>
  );
}

export const CALC_ICONS = {
  currency: CurrencyIcon,
  mortgage: MortgageIcon,
  "home-loan": HomeLoanIcon,
  "income-tax": IncomeTaxIcon,
  gst: GstIcon,
  salary: SalaryIcon,
  sip: SipIcon,
  fd: FdIcon,
  "compound-interest": CompoundIcon,
  inflation: InflationIcon,
  retirement: RetirementIcon,
  property: PropertyIcon,
} as const;
