import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default:     "bg-primary text-primary-foreground",
        secondary:   "bg-secondary text-secondary-foreground border border-border/60",
        outline:     "border border-border text-foreground bg-transparent",
        destructive: "bg-destructive/10 text-destructive border border-destructive/20",
        completed:   "bg-emerald-subtle text-emerald border border-emerald/20",
        running:     "bg-accent/10 text-accent border border-accent/20",
        pending:     "bg-secondary text-muted-foreground border border-border/60",
        failed:      "bg-destructive/8 text-destructive border border-destructive/15",
        amber:       "bg-amber-subtle text-amber-foreground border border-amber/25",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
