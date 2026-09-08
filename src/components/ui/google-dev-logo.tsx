interface GoogleDevLogoProps {
  className?: string;
}

export function GoogleDevLogo({ className = "h-8 w-8" }: GoogleDevLogoProps) {
  return (
    <svg
      viewBox="0 0 192 192"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Google Developers Logo"
    >
      {/* Left Bracket < */}
      {/* Top Red Arm */}
      <polygon points="43.06,32 27.07,59.72 48,96 84.92,32" fill="#EA4335" />
      {/* Bottom Blue Arm */}
      <path
        d="M 9.61,90 c -2.14,3.71 -2.14,8.28 0,11.99 l 33.46,58 41.85,0 L 27.07,59.72 9.61,90 Z"
        fill="#4285F4"
      />

      {/* Right Bracket > */}
      {/* Bottom Yellow Arm */}
      <polygon points="148.94,160 164.93,132.28 144,96 107.08,160" fill="#FBBC04" />
      {/* Top Green Arm */}
      <path
        d="m 182.39,102 c 2.14,-3.71 2.14,-8.28 0,-11.99 l -33.46,-58 -41.85,0 57.85,100.28 17.46,-30.29 z"
        fill="#34A853"
      />
    </svg>
  );
}
