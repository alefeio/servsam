import { Badge } from "@/components/ui/badge";
import { DEMO_BANNER_LABEL } from "@/lib/content/constants";
import { cn } from "@/lib/utils";

type DemoContentBannerProps = {
  label?: string;
  className?: string;
};

export function DemoContentBanner({
  label = DEMO_BANNER_LABEL,
  className,
}: DemoContentBannerProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "border-teal/40 bg-secondary text-secondary-foreground",
        className,
      )}
    >
      {label}
    </Badge>
  );
}
