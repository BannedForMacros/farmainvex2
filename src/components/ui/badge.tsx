import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      tono: {
        neutral: "bg-muted text-muted-foreground",
        primary: "bg-secondary text-secondary-foreground",
        success: "bg-success/15 text-success",
        warning: "bg-warning/15 text-[color:var(--warning)]",
        danger: "bg-danger/15 text-danger",
      },
    },
    defaultVariants: { tono: "neutral" },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, tono, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tono }), className)} {...props} />;
}
