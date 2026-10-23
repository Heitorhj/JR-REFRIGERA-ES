import { useId } from "react";

function BrandLogo({ size = 44 }) {
  const rawId = useId().replace(/:/g, "");
  const backgroundId = `jr-logo-bg-${rawId}`;
  const sunId = `jr-logo-sun-${rawId}`;

  return (
    <svg
      className="brand-logo"
      width={size}
      height={size}
      viewBox="0 0 64 64"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={backgroundId} x1="8" y1="4" x2="58" y2="62" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1c8f7c" />
          <stop offset="1" stopColor="#0c564c" />
        </linearGradient>
        <radialGradient id={sunId} cx="38%" cy="35%" r="70%">
          <stop stopColor="#fff4d8" />
          <stop offset="1" stopColor="#e7a45a" />
        </radialGradient>
      </defs>
      <rect width="64" height="64" rx="18" fill={`url(#${backgroundId})`} />
      <circle cx="49" cy="15" r="6.2" fill={`url(#${sunId})`} />
      <path
        d="M12.5 31.2 32 15.2l19.5 16V48c0 2.4-1.9 4.4-4.3 4.4H16.8c-2.4 0-4.3-2-4.3-4.4V31.2Z"
        fill="#f7fbf8"
      />
      <g
        transform="translate(32 36.5)"
        fill="none"
        stroke="#0e675c"
        strokeWidth="1.8"
        strokeLinecap="round"
      >
        <path d="M0-7.2v14.4M-6.2-3.6 6.2 3.6M-6.2 3.6 6.2-3.6" />
      </g>
      <g fill="#0e675c">
        <circle cx="32" cy="36.5" r="2" />
        <circle cx="32" cy="29.3" r="1.25" />
        <circle cx="32" cy="43.7" r="1.25" />
        <circle cx="25.8" cy="32.9" r="1.25" />
        <circle cx="38.2" cy="40.1" r="1.25" />
        <circle cx="25.8" cy="40.1" r="1.25" />
        <circle cx="38.2" cy="32.9" r="1.25" />
      </g>
    </svg>
  );
}

export default BrandLogo;
