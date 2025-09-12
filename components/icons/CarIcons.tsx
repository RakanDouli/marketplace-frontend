import React from 'react';

interface IconProps {
  size?: number;
  title?: string;
  className?: string;
}

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "2",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export const SedanIcon: React.FC<IconProps> = ({ size = 24, title = "سيدان", ...props }) => (
  <svg {...base} width={size} height={size} aria-label={title} role="img" {...props}>
    <path d="M3 14h18M4 14v-1.2a3 3 0 0 1 1.7-2.7l3.3-1.6a6 6 0 0 1 2.6-.6h2.2a6 6 0 0 1 3 .8l1.8 1a3 3 0 0 1 1.4 2.6V14"/>
    <path d="M7.5 8.7h4.2c.5 0 1 .2 1.4.6l1.3 1.4H7.5V8.7z"/>
    <circle cx="7" cy="16" r="2"/><circle cx="17" cy="16" r="2"/>
  </svg>
);

export const SuvIcon: React.FC<IconProps> = ({ size = 24, title = "دفع رباعي", ...props }) => (
  <svg {...base} width={size} height={size} aria-label={title} role="img" {...props}>
    <path d="M2.5 14h19M3.5 14v-1.4a3.5 3.5 0 0 1 1.9-3.1l3.6-1.8a5 5 0 0 1 2.2-.5h2.6a5 5 0 0 1 2.5.7l2.2 1.2a3.5 3.5 0 0 1 1.8 3.1V14"/>
    <path d="M6 7.8h6.5c.5 0 1 .2 1.4.5l2.1 1.7H6V7.8z"/>
    <path d="M7 6h10"/>
    <circle cx="7" cy="16.2" r="2.1"/><circle cx="17" cy="16.2" r="2.1"/>
  </svg>
);

export const HatchbackIcon: React.FC<IconProps> = ({ size = 24, title = "هاتشباك", ...props }) => (
  <svg {...base} width={size} height={size} aria-label={title} role="img" {...props}>
    <path d="M3 14h18M4 14v-1.3a3 3 0 0 1 1.6-2.6l3.4-1.6a6 6 0 0 1 2.5-.5h2c.6 0 1.2.2 1.7.5l3.8 2.1-1.2 1H8.2V9.1"/>
    <circle cx="7" cy="16" r="2"/><circle cx="17" cy="16" r="2"/>
  </svg>
);

export const CoupeIcon: React.FC<IconProps> = ({ size = 24, title = "كوبيه", ...props }) => (
  <svg {...base} width={size} height={size} aria-label={title} role="img" {...props}>
    <path d="M3 14h18M4 14v-1.1c0-1.2.7-2.2 1.8-2.7l4-1.7a6 6 0 0 1 2.2-.4h1.6c.7 0 1.4.2 2 .6l3.4 2.2"/>
    <path d="M8 10h5.2l1.8 2H8v-2z"/>
    <circle cx="7" cy="16" r="2"/><circle cx="17" cy="16" r="2"/>
  </svg>
);

export const ConvertibleIcon: React.FC<IconProps> = ({ size = 24, title = "قابل للطي", ...props }) => (
  <svg {...base} width={size} height={size} aria-label={title} role="img" {...props}>
    <path d="M3 14h18M4 14v-1.2a3 3 0 0 1 1.7-2.7l3.2-1.2a5 5 0 0 1 1.6-.3h1.2c.6 0 1.1.2 1.6.5l2.2 1.5"/>
    <path d="M8 8.8l2.2-1.8M10.2 7l3.2 2.4"/>
    <circle cx="7" cy="16" r="2"/><circle cx="17" cy="16" r="2"/>
  </svg>
);

export const WagonIcon: React.FC<IconProps> = ({ size = 24, title = "عائلية", ...props }) => (
  <svg {...base} width={size} height={size} aria-label={title} role="img" {...props}>
    <path d="M2.5 14h19M3.5 14v-1.4a3.5 3.5 0 0 1 1.9-3.1l4-1.7a6 6 0 0 1 2.4-.5h2.2c.6 0 1.3.2 1.8.5l3.2 1.7a3.5 3.5 0 0 1 1.8 3.1V14"/>
    <path d="M6 8h8.5l3 1.7H6V8z"/>
    <circle cx="7" cy="16.2" r="2.1"/><circle cx="17" cy="16.2" r="2.1"/>
  </svg>
);

export const PickupIcon: React.FC<IconProps> = ({ size = 24, title = "بيك آب", ...props }) => (
  <svg {...base} width={size} height={size} aria-label={title} role="img" {...props}>
    <path d="M3 14h18M4 14v-1.2a2.8 2.8 0 0 1 1.9-2.7l2.1-.7a2 2 0 0 0 1.3-1.3l.5-1.6h3.4c.7 0 1.4.3 1.8.9l1 1.3H20a1.5 1.5 0 0 1 1.5 1.5V14"/>
    <path d="M9.3 7.6h3.9"/><path d="M15.5 11h4.2"/>
    <circle cx="8" cy="16" r="2"/><circle cx="18" cy="16" r="2"/>
  </svg>
);