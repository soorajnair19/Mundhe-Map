import {
  FileText,
  Lock,
  Package,
  Pause,
  Search,
  Utensils,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  statusToMarkerKind,
  type MarkerKind,
} from "@/lib/data/status";

const STATUS_ICONS: Record<MarkerKind, LucideIcon> = {
  suspended: Pause,
  cancelled: X,
  sealed: Lock,
  notice: FileText,
  inspection: Search,
  seizure: Package,
  other: Utensils,
};

interface StatusIconProps {
  status?: string;
  kind?: MarkerKind;
  size?: number;
  className?: string;
  color?: string;
}

export function StatusIcon({
  status,
  kind,
  size = 14,
  className,
  color,
}: StatusIconProps) {
  const resolved = kind ?? statusToMarkerKind(status ?? "other");
  const Icon = STATUS_ICONS[resolved];

  return (
    <Icon
      size={size}
      strokeWidth={2.25}
      className={className}
      color={color}
      aria-hidden
    />
  );
}
