import type { Ad, AdPlacement } from "@/types";
import { AdSlot } from "@/components/atoms/AdSlot";
import { cn } from "@/lib/utils";

export interface SidebarAdsWidgetProps {
  placement?: AdPlacement | null;
  ads?: Ad[];
  className?: string;
}

export function SidebarAdsWidget({
  placement,
  ads,
  className,
}: SidebarAdsWidgetProps) {
  const list =
    ads ??
    placement?.ads?.filter((a) => a.isActive).slice(0, placement.maxAds ?? 3) ??
    [];

  if (list.length === 0) {
    return null;
  }

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {list.map((ad) => (
        <AdSlot key={ad.id} ad={ad} />
      ))}
    </div>
  );
}
