"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

/* Toasts drop in from the top and can be swiped away in any direction. */
const Toaster = (props: ToasterProps) => (
  <Sonner
    className="toaster group"
    position="top-center"
    swipeDirections={["top", "bottom", "left", "right"]}
    offset={{ top: "calc(env(safe-area-inset-top) + 12px)" }}
    mobileOffset={{ top: "calc(env(safe-area-inset-top) + 8px)" }}
    visibleToasts={3}
    icons={{
      success: <CircleCheckIcon className="size-4 text-primary" />,
      info: <InfoIcon className="size-4" />,
      warning: <TriangleAlertIcon className="size-4 text-warning" />,
      error: <OctagonXIcon className="size-4 text-destructive" />,
      loading: <Loader2Icon className="size-4 animate-spin" />,
    }}
    style={
      {
        "--normal-bg": "var(--popover)",
        "--normal-text": "var(--popover-foreground)",
        "--normal-border": "var(--border)",
        "--border-radius": "var(--radius)",
      } as React.CSSProperties
    }
    toastOptions={{ classNames: { toast: "!shadow-lg !font-sans", actionButton: "!bg-primary !text-primary-foreground" } }}
    {...props}
  />
)

export { Toaster }
