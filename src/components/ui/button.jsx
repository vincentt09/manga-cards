import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-transparent text-sm font-semibold transition-all duration-200 active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "border-primary/50 bg-gradient-to-b from-primary to-primary/75 text-primary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,.2),0_8px_22px_hsl(var(--primary)/.2)] hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[inset_0_1px_0_rgba(255,255,255,.24),0_12px_28px_hsl(var(--primary)/.3)]",
        destructive:
          "border-destructive/50 bg-gradient-to-b from-destructive to-destructive/75 text-destructive-foreground shadow-[inset_0_1px_0_rgba(255,255,255,.14),0_8px_20px_hsl(var(--destructive)/.18)] hover:-translate-y-0.5 hover:brightness-110",
        outline:
          "border-input/90 bg-background/35 shadow-[inset_0_1px_0_rgba(255,255,255,.04)] backdrop-blur-sm hover:-translate-y-0.5 hover:border-primary/45 hover:bg-primary/10 hover:text-foreground",
        secondary:
          "border-white/5 bg-gradient-to-b from-secondary to-secondary/75 text-secondary-foreground shadow-sm hover:-translate-y-0.5 hover:border-primary/25 hover:bg-secondary/90",
        ghost: "hover:border-white/5 hover:bg-primary/10 hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    (<Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props} />)
  );
})
Button.displayName = "Button"

export { Button, buttonVariants }
