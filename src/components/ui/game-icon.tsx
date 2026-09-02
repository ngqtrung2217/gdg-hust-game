import {
  Bomb,
  Keyboard,
  Grid3x3,
  Footprints,
  Disc,
  UserSearch,
  Package,
  Boxes,
  Calculator,
  Palette,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  Bomb,
  Keyboard,
  Grid3x3,
  Footprints,
  Disc,
  UserSearch,
  Package,
  Boxes,
  Calculator,
  Palette,
};

export function GameIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Icon = ICONS[name] ?? Bomb;
  return <Icon className={className} aria-hidden="true" />;
}
