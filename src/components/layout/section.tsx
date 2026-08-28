import { cn } from "@/lib/utils";

type SectionProps = {
  children: React.ReactNode;
  className?: string;
  id?: string;
  tone?: "default" | "muted" | "navy";
};

const tones: Record<NonNullable<SectionProps["tone"]>, string> = {
  default: "bg-background",
  muted: "bg-muted/70",
  navy: "bg-navy text-primary-foreground",
};

export function Section({
  children,
  className,
  id,
  tone = "default",
}: SectionProps) {
  return (
    <section id={id} className={cn("py-16 md:py-24", tones[tone], className)}>
      <div className="mx-auto w-full max-w-6xl px-4 md:px-6">{children}</div>
    </section>
  );
}

export function PageHero({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description: string;
}) {
  return (
    <Section tone="navy" className="py-14 md:py-20">
      {eyebrow ? (
        <p className="text-sm font-medium tracking-wide text-teal uppercase">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight md:text-4xl">
        {title}
      </h1>
      <p className="mt-4 max-w-2xl text-base text-primary-foreground/80 md:text-lg">
        {description}
      </p>
    </Section>
  );
}
