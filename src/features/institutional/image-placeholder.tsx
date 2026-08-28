import { ImageIcon } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

type ImagePlaceholderProps = {
  hint: string;
  src?: string;
  alt?: string;
  className?: string;
  compact?: boolean;
};

export function ImagePlaceholder({
  hint,
  src,
  alt,
  className,
  compact = false,
}: ImagePlaceholderProps) {
  if (src) {
    return (
      <div
        className={cn(
          "relative w-full overflow-hidden bg-muted",
          compact ? "min-h-32" : "min-h-48 md:min-h-56",
          className,
        )}
      >
        <Image
          src={src}
          alt={alt ?? hint}
          fill
          className="object-cover"
          sizes={compact ? "(max-width: 768px) 100vw, 50vw" : "(max-width: 768px) 100vw, 600px"}
        />
      </div>
    );
  }

  return (
    <div
      role="img"
      aria-label={`Espaço reservado para fotografia: ${hint}`}
      className={cn(
        "flex h-full min-h-40 w-full flex-col items-start justify-end bg-linear-to-br from-navy via-navy to-teal p-4 text-left text-primary-foreground",
        compact ? "min-h-32" : "min-h-48 md:min-h-56",
        className,
      )}
    >
      <ImageIcon className="mb-3 size-6 opacity-80" aria-hidden />
      <p className="text-xs font-medium tracking-wide uppercase opacity-80">
        Fotografia autorizada pendente
      </p>
      <p className="mt-1 max-w-md text-sm leading-relaxed opacity-90">{hint}</p>
    </div>
  );
}
