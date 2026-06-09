import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "text-sm font-medium tracking-[-0.01em]",
    "rounded-lg transition-all duration-150 ease-spring",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-45",
    "active:scale-[0.97]",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-border bg-transparent text-foreground hover:bg-secondary hover:border-border/80",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/70",
        ghost:
          "text-muted-foreground hover:bg-secondary hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline p-0 h-auto",
        accent:
          "bg-accent text-accent-foreground shadow-sm hover:bg-accent/85",
        emerald:
          "bg-emerald text-emerald-foreground shadow-sm hover:bg-emerald/85",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 py-1.5 text-xs",
        lg: "h-11 rounded-xl px-6 text-base font-semibold",
        xl: "h-12 rounded-xl px-8 text-base font-semibold",
        icon: "h-9 w-9",
        "icon-sm": "h-7 w-7 rounded-md",
        "icon-lg": "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
