interface GoogleDevLogoProps {
  className?: string;
  size?: number;
}

export function GoogleDevLogo({ className = "h-8 w-8", size = 64 }: GoogleDevLogoProps) {
  return (
    <img
      src="/assets/branding/gdg-logo.png"
      alt="GDG on Campus - HUST"
      width={size}
      height={size}
      loading="eager"
      className={`object-contain select-none pointer-events-none ${className}`}
    />
  );
}
