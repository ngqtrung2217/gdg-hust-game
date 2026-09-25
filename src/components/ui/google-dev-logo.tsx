import Image from "next/image";

interface LogoProps {
  className?: string;
  size?: number;
}

export function GoogleDevLogo({ className = "h-8 w-auto" }: LogoProps) {
  return (
    <Image
      src="/assets/branding/gdg-hust-logo.png"
      alt="Google Developer Groups On Campus • Hanoi University of Science and Technology"
      width={340}
      height={98}
      priority
      style={{ width: "auto" }}
      className={`object-contain select-none pointer-events-none dark:bg-white dark:rounded-md dark:px-1.5 dark:py-0.5 ${className}`}
    />
  );
}

export function BkSpaceLogo({ className = "h-7 w-auto" }: LogoProps) {
  return (
    <Image
      src="/assets/branding/bk-space-logo.png"
      alt="BK Space Tech - CLB Công nghệ Không gian Bách Khoa"
      width={280}
      height={90}
      priority
      style={{ width: "auto" }}
      className={`object-contain select-none pointer-events-none dark:bg-white dark:rounded-md dark:px-1.5 dark:py-0.5 ${className}`}
    />
  );
}

export function HiecLogo({ className = "h-7 w-auto" }: LogoProps) {
  return (
    <Image
      src="/assets/branding/hiec-logo.png"
      alt="HIEC - HUST Innovation & Entrepreneurship Club"
      width={100}
      height={190}
      priority
      style={{ width: "auto" }}
      className={`object-contain select-none pointer-events-none ${className}`}
    />
  );
}

interface PartnerLogosProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function PartnerLogos({ size = "md", className = "" }: PartnerLogosProps) {
  if (size === "sm") {
    return (
      <div className={`flex items-center gap-2 shrink-0 ${className}`}>
        <Image
          src="/assets/branding/gdg-hust-logo.png"
          alt="GDG on Campus - HUST"
          width={64}
          height={18}
          priority
          style={{ width: "auto" }}
          className="h-4 w-auto max-w-[80px] object-contain select-none pointer-events-none dark:bg-white dark:rounded dark:px-0.5"
        />
        <span className="text-border/80 text-[10px] select-none">•</span>
        <Image
          src="/assets/branding/bk-space-logo.png"
          alt="BK Space Tech"
          width={48}
          height={16}
          priority
          style={{ width: "auto" }}
          className="h-3.5 w-auto max-w-[70px] object-contain select-none pointer-events-none dark:bg-white dark:rounded dark:px-0.5"
        />
        <span className="text-border/80 text-[10px] select-none">•</span>
        <Image
          src="/assets/branding/hiec-logo.png"
          alt="HIEC"
          width={16}
          height={16}
          priority
          style={{ width: "auto" }}
          className="h-4 w-auto object-contain select-none pointer-events-none"
        />
      </div>
    );
  }

  if (size === "lg") {
    return (
      <div className={`flex items-center gap-3 sm:gap-5 md:gap-6 shrink-0 flex-wrap ${className}`}>
        <Image
          src="/assets/branding/gdg-hust-logo.png"
          alt="Google Developer Groups On Campus - Hanoi University of Science and Technology"
          width={280}
          height={80}
          priority
          style={{ width: "auto" }}
          className="h-10 sm:h-12 md:h-14 w-auto max-w-[170px] sm:max-w-[210px] md:max-w-[250px] object-contain select-none pointer-events-none dark:bg-white dark:rounded-xl dark:px-2 dark:py-1 drop-shadow-xs"
        />
        <div className="h-7 sm:h-9 w-px bg-border/80 hidden sm:block" />
        <Image
          src="/assets/branding/bk-space-logo.png"
          alt="BK Space Tech"
          width={240}
          height={77}
          priority
          style={{ width: "auto" }}
          className="h-9 sm:h-11 md:h-13 w-auto max-w-[130px] sm:max-w-[170px] md:max-w-[200px] object-contain select-none pointer-events-none dark:bg-white dark:rounded-xl dark:px-2 dark:py-1 drop-shadow-xs"
        />
        <div className="h-7 sm:h-9 w-px bg-border/80 hidden sm:block" />
        <Image
          src="/assets/branding/hiec-logo.png"
          alt="HIEC"
          width={70}
          height={134}
          priority
          style={{ width: "auto" }}
          className="h-10 sm:h-12 md:h-14 w-auto object-contain select-none pointer-events-none drop-shadow-xs"
        />
      </div>
    );
  }

  // size === "md" (Header)
  return (
    <div className={`flex items-center gap-1.5 sm:gap-2.5 shrink-0 ${className}`}>
      <Image
        src="/assets/branding/gdg-hust-logo.png"
        alt="GDG on Campus - HUST"
        width={130}
        height={38}
        priority
        style={{ width: "auto" }}
        className="h-6 sm:h-7 md:h-8 w-auto max-w-[95px] sm:max-w-[130px] object-contain select-none pointer-events-none transition-transform duration-200 group-hover:scale-105 dark:bg-white dark:rounded dark:px-1 dark:py-0.5"
      />
      <div className="h-4 sm:h-5 w-px bg-border/70" />
      <Image
        src="/assets/branding/bk-space-logo.png"
        alt="BK Space Tech"
        width={100}
        height={32}
        priority
        style={{ width: "auto" }}
        className="h-5 sm:h-6 w-auto max-w-[70px] sm:max-w-[100px] object-contain select-none pointer-events-none transition-transform duration-200 group-hover:scale-105 dark:bg-white dark:rounded dark:px-1 dark:py-0.5"
      />
      <div className="h-4 sm:h-5 w-px bg-border/70" />
      <Image
        src="/assets/branding/hiec-logo.png"
        alt="HIEC"
        width={36}
        height={68}
        priority
        style={{ width: "auto" }}
        className="h-6 sm:h-7 w-auto object-contain select-none pointer-events-none transition-transform duration-200 group-hover:scale-105"
      />
    </div>
  );
}
