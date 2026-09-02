import React from "react";

interface LogoProps {
  className?: string;
}

export function GoogleSearchLogo({ className = "h-8 w-8" }: LogoProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <path
        d="M23.49 12.28c0-.85-.07-1.68-.21-2.48H12v4.69h6.44c-.28 1.48-1.12 2.74-2.38 3.58v2.98h3.86c2.26-2.09 3.57-5.16 3.57-8.77z"
        fill="#4285F4"
      />
      <path
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-2.98c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.28v3.09C3.26 21.3 7.36 24 12 24z"
        fill="#34A853"
      />
      <path
        d="M5.27 14.31c-.24-.72-.38-1.49-.38-2.31s.14-1.59.38-2.31V6.6H1.28C.46 8.23 0 10.06 0 12s.46 3.77 1.28 5.4l3.99-3.09z"
        fill="#FBBC05"
      />
      <path
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.7 1.28 6.6l3.99 3.09c.95-2.85 3.6-4.94 6.73-4.94z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function YouTubeLogo({ className = "h-8 w-8" }: LogoProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <path
        d="M23.5 6.2a3 3 0 00-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 00.5 6.2 31.4 31.4 0 000 12c0 1.95.17 3.9.5 5.8a3 3 0 002.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 002.1-2.1c.33-1.9.5-3.85.5-5.8 0-1.95-.17-3.9-.5-5.8z"
        fill="#FF0000"
      />
      <path d="M9.6 15.6V8.4l6.3 3.6-6.3 3.6z" fill="#FFFFFF" />
    </svg>
  );
}

export function GmailLogo({ className = "h-8 w-8" }: LogoProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <path d="M2 19h4V9.5L12 14l6-4.5V19h4V6a2 2 0 00-3.2-1.6L12 9.5 5.2 4.4A2 2 0 002 6v13z" fill="#EA4335" />
      <path d="M2 7v12h4V9.5L2 7z" fill="#4285F4" />
      <path d="M18 9.5V19h4V7l-4 2.5z" fill="#34A853" />
      <path d="M18 4.4L12 9 6 4.4A2 2 0 017.2 4h9.6c.4 0 .8.2 1.2.4z" fill="#FBBC04" />
    </svg>
  );
}

export function GoogleMapsLogo({ className = "h-8 w-8" }: LogoProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <path d="M12 2C7.58 2 4 5.58 4 10c0 5.25 7.15 11.53 7.46 11.8a.8.8 0 001.08 0C12.85 21.53 20 15.25 20 10c0-4.42-3.58-8-8-8z" fill="#EA4335" />
      <path d="M12 6.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7z" fill="#FFFFFF" />
      <path d="M12 8a2 2 0 100 4 2 2 0 000-4z" fill="#4285F4" />
    </svg>
  );
}

export function ChromeLogo({ className = "h-8 w-8" }: LogoProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <circle cx="12" cy="12" r="10" fill="#EA4335" />
      <circle cx="12" cy="12" r="5" fill="#FFFFFF" />
      <circle cx="12" cy="12" r="4" fill="#4285F4" />
      <path d="M12 7h9.5A10 10 0 0117 20.3L12 12" fill="#FBBC04" />
      <path d="M12 17l-4.7 8.2A10 10 0 012.3 8.3L12 12" fill="#34A853" />
    </svg>
  );
}

export function GoogleDriveLogo({ className = "h-8 w-8" }: LogoProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <path d="M8 2.5l5.5 9.5-5.5 9.5L2.5 12z" fill="#34A853" />
      <path d="M16 2.5H8l5.5 9.5h8z" fill="#FBBC04" />
      <path d="M13.5 12l5.5 9.5H8l-5.5-9.5z" fill="#4285F4" />
    </svg>
  );
}

export function AndroidLogo({ className = "h-8 w-8" }: LogoProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <path d="M4 11a1 1 0 011-1h14a1 1 0 011 1v8H4v-8z" fill="#34A853" />
      <path d="M6 9a6 6 0 0112 0H6z" fill="#34A853" />
      <circle cx="9" cy="6.5" r="1" fill="#FFFFFF" />
      <circle cx="15" cy="6.5" r="1" fill="#FFFFFF" />
      <path d="M7 3L5.5 1.5M17 3l1.5-1.5" stroke="#34A853" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="2" y="11" width="1.8" height="6" rx="0.9" fill="#34A853" />
      <rect x="20.2" y="11" width="1.8" height="6" rx="0.9" fill="#34A853" />
    </svg>
  );
}

export function GooglePhotosLogo({ className = "h-8 w-8" }: LogoProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <path d="M12 12V4.5a3.75 3.75 0 00-7.5 0V12h7.5z" fill="#EA4335" />
      <path d="M12 12h7.5a3.75 3.75 0 000-7.5H12V12z" fill="#FBBC04" />
      <path d="M12 12v7.5a3.75 3.75 0 007.5 0V12H12z" fill="#34A853" />
      <path d="M12 12H4.5a3.75 3.75 0 000 7.5H12V12z" fill="#4285F4" />
    </svg>
  );
}

export function GoogleTranslateLogo({ className = "h-8 w-8" }: LogoProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <rect x="2" y="3" width="13" height="13" rx="2.5" fill="#4285F4" />
      <text x="5" y="12" fill="#FFFFFF" fontSize="9" fontWeight="bold" fontFamily="sans-serif">G</text>
      <rect x="9" y="8" width="13" height="13" rx="2.5" fill="#5F6368" />
      <text x="13.5" y="17.5" fill="#FFFFFF" fontSize="9" fontWeight="bold" fontFamily="sans-serif">文</text>
    </svg>
  );
}

export function GooglePixelLogo({ className = "h-8 w-8" }: LogoProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <rect x="5.5" y="2" width="13" height="20" rx="3" stroke="#5F6368" strokeWidth="1.6" />
      <rect x="6.5" y="5.5" width="11" height="3" fill="#3C4043" rx="0.5" />
      <circle cx="8.5" cy="7" r="0.9" fill="#4285F4" />
      <circle cx="11.5" cy="7" r="0.9" fill="#34A853" />
      <text x="10" y="16" fill="#4285F4" fontSize="7" fontWeight="bold" fontFamily="sans-serif">G</text>
    </svg>
  );
}

export function GoogleMeetLogo({ className = "h-8 w-8" }: LogoProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <rect x="2" y="6" width="12" height="12" rx="2.5" fill="#00AC47" />
      <path d="M14 9l7-4v14l-7-4V9z" fill="#00832D" />
      <path d="M2 14.5L14 18V6L2 9.5v5z" fill="#00AC47" opacity="0.4" />
      <circle cx="8" cy="12" r="2.5" fill="#FFFFFF" />
    </svg>
  );
}

export function GooglePlayLogo({ className = "h-8 w-8" }: LogoProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <path d="M3.5 2.5a1.5 1.5 0 00-.5 1.2v16.6c0 .5.2.9.5 1.2l9.8-9.5-9.8-9.5z" fill="#4285F4" />
      <path d="M16.5 9.3L13.3 12l3.2 2.7 4.2-2.3a1.2 1.2 0 000-2.2l-4.2-2.3z" fill="#FBBC04" />
      <path d="M3.5 2.5l9.8 9.5 3.2-2.7L5.8 2.2a2.3 2.3 0 00-2.3.3z" fill="#00E676" />
      <path d="M3.5 21.5a2.3 2.3 0 002.3.3l10.7-5.9-3.2-2.7-9.8 8.3z" fill="#FF3D00" />
    </svg>
  );
}

export function GoogleDocsLogo({ className = "h-8 w-8" }: LogoProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <path d="M5 2h9l6 6v12a2 2 0 01-2 2H5a2 2 0 01-2-2V4a2 2 0 012-2z" fill="#4285F4" />
      <path d="M14 2v6h6" fill="#A1C2FA" />
      <line x1="7" y1="11" x2="17" y2="11" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="7" y1="14" x2="17" y2="14" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="7" y1="17" x2="13" y2="17" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function GoogleCalendarLogo({ className = "h-8 w-8" }: LogoProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <rect x="3" y="4" width="18" height="17" rx="3" fill="#4285F4" />
      <rect x="3" y="4" width="18" height="5" rx="2" fill="#1A73E8" />
      <rect x="6" y="2" width="2.5" height="3" rx="1" fill="#FFFFFF" />
      <rect x="15.5" y="2" width="2.5" height="3" rx="1" fill="#FFFFFF" />
      <text x="6.5" y="17.5" fill="#FFFFFF" fontSize="9.5" fontWeight="bold" fontFamily="sans-serif">31</text>
    </svg>
  );
}

export function ChromeDinoLogo({ className = "h-8 w-8" }: LogoProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="#34A853">
      {/* 8-bit Pixel T-Rex Dino */}
      <rect x="13" y="2" width="8" height="7" />
      <rect x="12" y="3" width="2" height="6" />
      <rect x="19" y="4" width="2" height="2" fill="var(--background, #fff)" />
      <rect x="11" y="8" width="8" height="2" />
      <rect x="9" y="9" width="3" height="8" />
      <rect x="7" y="11" width="3" height="6" />
      <rect x="5" y="12" width="3" height="4" />
      <rect x="3" y="13" width="3" height="2" />
      <rect x="12" y="12" width="6" height="5" />
      <rect x="18" y="14" width="2" height="2" />
      <rect x="9" y="17" width="2" height="4" />
      <rect x="9" y="21" width="3" height="1" />
      <rect x="14" y="17" width="2" height="3" />
      <rect x="14" y="20" width="3" height="1" />
    </svg>
  );
}

export function FlutterLogo({ className = "h-8 w-8" }: LogoProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <path d="M13.5 2.5L3.5 12.5l3.1 3.1L19.7 2.5h-6.2z" fill="#42A5F5" />
      <path d="M13.5 12.5l-4.1 4.1 4.1 4.1h6.2l-7.2-7.2 1-1z" fill="#0D47A1" />
      <path d="M9.4 16.6l3.1 3.1 7.2-7.2h-6.2l-4.1 4.1z" fill="#29B6F6" />
    </svg>
  );
}

export function GolangLogo({ className = "h-8 w-8" }: LogoProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <rect x="2" y="6" width="20" height="12" rx="3" fill="#00ADD8" />
      <text x="5" y="15" fill="#FFFFFF" fontSize="8.5" fontWeight="black" fontFamily="monospace">GO</text>
      <circle cx="18" cy="10" r="1.5" fill="#FFFFFF" />
      <circle cx="18.5" cy="9.8" r="0.7" fill="#000000" />
    </svg>
  );
}

export function FirebaseLogo({ className = "h-8 w-8" }: LogoProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <path d="M4.5 17.5L7.2 2.8a.7.7 0 011.3-.2l3.2 6.1L4.5 17.5z" fill="#FFA000" />
      <path d="M4.5 17.5L3.2 9.2a.7.7 0 011.2-.6l2.3 4.4L4.5 17.5z" fill="#F57C00" />
      <path d="M12 21.5l7.5-4-7.5-15-7.5 15 7.5 4z" fill="#FFCA28" opacity="0.6" />
      <path d="M12 21.5l7.5-4-3.8-9.4a.7.7 0 00-1.3-.1L4.5 17.5l7.5 4z" fill="#FFCA28" />
    </svg>
  );
}

export function TensorFlowLogo({ className = "h-8 w-8" }: LogoProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <path d="M12 2l9 5.2v10.4L12 22.8l-9-5.2V7.2L12 2z" fill="#FF6F00" opacity="0.15" />
      <path d="M12 2.5l8 4.6v4.6l-4-2.3V19l-4 2.3V2.5z" fill="#FF6F00" />
      <path d="M12 2.5L4 7.1v4.6l4-2.3V19l4 2.3V2.5z" fill="#FFA000" />
      <path d="M12 9.5l4 2.3-4 2.3-4-2.3 4-2.3z" fill="#FF8F00" />
    </svg>
  );
}

export function GoogleCloudLogo({ className = "h-8 w-8" }: LogoProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <path
        d="M19.35 10.04A7.5 7.5 0 005.5 12.5a6 6 0 00.5 11.96h13a5 5 0 00.35-9.98c0-.16 0-.32 0-.44z"
        fill="#4285F4"
      />
      <circle cx="10" cy="15" r="1.5" fill="#FFFFFF" />
      <circle cx="15" cy="15" r="1.5" fill="#FFFFFF" />
      <line x1="10" y1="15" x2="15" y2="15" stroke="#FFFFFF" strokeWidth="1.2" />
    </svg>
  );
}

export function GDGLogo({ className = "h-8 w-8" }: LogoProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <path d="M8 6L2 12l6 6" stroke="#4285F4" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 6l6 6-6 6" stroke="#EA4335" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="2.2" fill="#FBBC04" />
    </svg>
  );
}

// BOSS 1: Kubernetes (Borg)
export function KubernetesLogo({ className = "h-8 w-8" }: LogoProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <circle cx="12" cy="12" r="10" fill="#326CE5" opacity="0.2" />
      <circle cx="12" cy="12" r="4.5" fill="#326CE5" />
      {[0, 51.4, 102.8, 154.2, 205.6, 257, 308.4].map((deg, i) => (
        <line
          key={i}
          x1="12"
          y1="12"
          x2="12"
          y2="3"
          stroke="#326CE5"
          strokeWidth="2.2"
          strokeLinecap="round"
          transform={`rotate(${deg} 12 12)`}
        />
      ))}
      <circle cx="12" cy="12" r="2.2" fill="#FFFFFF" />
    </svg>
  );
}

// BOSS 2: Transformer ("Attention Is All You Need")
export function TransformerLogo({ className = "h-8 w-8" }: LogoProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <circle cx="12" cy="12" r="10.5" fill="#7C3AED" opacity="0.2" />
      <line x1="5" y1="5" x2="19" y2="19" stroke="#A855F7" strokeWidth="1.8" />
      <line x1="19" y1="5" x2="5" y2="19" stroke="#A855F7" strokeWidth="1.8" />
      <line x1="12" y1="3" x2="12" y2="21" stroke="#C084FC" strokeWidth="1.4" />
      <line x1="3" y1="12" x2="21" y2="12" stroke="#C084FC" strokeWidth="1.4" />
      <rect x="8" y="8" width="8" height="8" rx="2" fill="#7C3AED" />
      <circle cx="12" cy="12" r="2" fill="#FDE047" />
    </svg>
  );
}

// BOSS 3: Google DeepMind (AlphaGo)
export function DeepMindLogo({ className = "h-8 w-8" }: LogoProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <rect x="2" y="2" width="20" height="20" rx="4" fill="#0F172A" />
      <line x1="4" y1="8" x2="20" y2="8" stroke="#334155" strokeWidth="1" />
      <line x1="4" y1="12" x2="20" y2="12" stroke="#334155" strokeWidth="1" />
      <line x1="4" y1="16" x2="20" y2="16" stroke="#334155" strokeWidth="1" />
      <line x1="8" y1="4" x2="8" y2="20" stroke="#334155" strokeWidth="1" />
      <line x1="12" y1="4" x2="12" y2="20" stroke="#334155" strokeWidth="1" />
      <line x1="16" y1="4" x2="16" y2="20" stroke="#334155" strokeWidth="1" />
      <circle cx="8" cy="8" r="2.2" fill="#00E676" />
      <circle cx="16" cy="16" r="2.2" fill="#FFFFFF" />
      <circle cx="16" cy="8" r="2.2" fill="#4285F4" />
      <circle cx="12" cy="12" r="3" fill="#EA4335" />
    </svg>
  );
}

export const BRAND_LOGOS: Record<string, React.FC<LogoProps>> = {
  search: GoogleSearchLogo,
  youtube: YouTubeLogo,
  gmail: GmailLogo,
  maps: GoogleMapsLogo,
  chrome: ChromeLogo,
  drive: GoogleDriveLogo,
  android: AndroidLogo,
  photos: GooglePhotosLogo,
  translate: GoogleTranslateLogo,
  pixel: GooglePixelLogo,
  meet: GoogleMeetLogo,
  play: GooglePlayLogo,
  docs: GoogleDocsLogo,
  calendar: GoogleCalendarLogo,
  dino: ChromeDinoLogo,
  flutter: FlutterLogo,
  golang: GolangLogo,
  firebase: FirebaseLogo,
  tensorflow: TensorFlowLogo,
  google_cloud: GoogleCloudLogo,
  gdg: GDGLogo,
  kubernetes: KubernetesLogo,
  transformer: TransformerLogo,
  deepmind: DeepMindLogo,
};
