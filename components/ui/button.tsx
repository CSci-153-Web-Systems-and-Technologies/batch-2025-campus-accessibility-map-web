import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-m3-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Material Design 3 Filled Button
        default:
          "bg-m3-primary text-m3-on-primary shadow-sm hover:bg-m3-primary-hover active:bg-m3-primary-pressed active:scale-[0.98]",
        // Material Design 3 Filled Tonal Button
        secondary:
          "bg-m3-secondary-container text-m3-on-secondary-container shadow-sm hover:bg-m3-secondary-hover/20 active:bg-m3-secondary-pressed/30 active:scale-[0.98]",
        // Material Design 3 Outlined Button
        outline:
          "border-2 border-m3-outline bg-transparent text-m3-primary shadow-none hover:bg-m3-primary/8 active:bg-m3-primary/12 active:scale-[0.98]",
        // Material Design 3 Text Button
        ghost: "bg-transparent text-m3-primary shadow-none hover:bg-m3-primary/8 active:bg-m3-primary/12 active:scale-[0.98]",
        // Material Design 3 Destructive Button
        destructive:
          "bg-m3-error text-m3-on-error shadow-sm hover:bg-m3-error-hover active:bg-m3-error-pressed active:scale-[0.98]",
        // Material Design 3 Link Button
        link: "text-m3-primary underline-offset-4 hover:underline active:scale-[0.98]",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
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
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
