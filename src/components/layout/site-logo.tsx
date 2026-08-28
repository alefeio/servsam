import Image from "next/image";
import Link from "next/link";
import { company } from "@/data/official/company";
import { brandAssets, getBrandLogoDimensions } from "@/lib/brand/assets";
import { cn } from "@/lib/utils";

type SiteLogoProps = {
  className?: string;
  variant?: "horizontal" | "vertical";
  surface?: "light" | "dark";
  href?: string;
  unlinked?: boolean;
  priority?: boolean;
  homeLabel?: string;
};

export function SiteLogo({
  className,
  variant = "horizontal",
  surface = "light",
  href = "/",
  unlinked = false,
  priority = false,
  homeLabel = "página inicial",
}: SiteLogoProps) {
  const asset =
    variant === "horizontal"
      ? brandAssets.logoHorizontal
      : brandAssets.logoVertical;
  const displayHeight = variant === "horizontal" ? 40 : 128;
  const dimensions = getBrandLogoDimensions(variant, displayHeight);

  const logo = (
    <span
      className={cn(
        "inline-flex items-center justify-center",
        surface === "dark" && "rounded-md bg-white px-2 py-1.5",
      )}
    >
      <Image
        src={asset.src}
        alt={company.fullBrandName}
        width={dimensions.width}
        height={dimensions.height}
        priority={priority}
        className="h-auto max-w-full"
        style={{ height: displayHeight, width: "auto" }}
      />
    </span>
  );

  if (unlinked) {
    return (
      <div className={cn("inline-flex", className)} aria-label={company.fullBrandName}>
        {logo}
      </div>
    );
  }

  return (
    <Link
      href={href}
      className={cn("inline-flex shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2", className)}
    >
      {logo}
      <span className="sr-only"> - {homeLabel}</span>
    </Link>
  );
}
