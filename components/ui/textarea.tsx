import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
        className={cn(
          "flex min-h-[60px] w-full rounded-md border border-m3-outline bg-m3-surface px-3 py-2 text-base text-m3-on-surface shadow-sm placeholder:text-m3-on-surface-variant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-m3-primary focus-visible:border-m3-primary disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }

