'use client'

interface CookieConsentTooltipProps {
  isOpen: boolean
}

export function CookieConsentTooltip({ isOpen }: CookieConsentTooltipProps) {
  if (!isOpen) return null

  return (
    <div className="absolute left-0 top-full mt-2 z-50 w-72 bg-popover border border-border rounded-lg shadow-lg p-3 animate-in fade-in-0 zoom-in-95">
      <p className="text-xs text-muted-foreground">
        This will keep you signed in for 30 days using cookies.
      </p>
    </div>
  )
}

