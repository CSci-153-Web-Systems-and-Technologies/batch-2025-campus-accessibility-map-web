import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border border-m3-outline bg-m3-surface px-3 py-1 text-base text-m3-on-surface shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-m3-on-surface placeholder:text-m3-on-surface-variant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-m3-primary focus-visible:border-m3-primary disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
