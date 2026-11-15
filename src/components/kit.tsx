"use client";
/* App-level building blocks on top of shadcn/ui. Every screen composes these, so spacing, radius,
   motion and states are defined once. */
import { useState, type ReactNode } from "react";
import { ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

/** Large page title with an optional trailing action. */
export function PageTitle({ title, subtitle, end }: { title: ReactNode; subtitle?: ReactNode; end?: ReactNode }) {
  return (
    <header className="flex items-end justify-between gap-3 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
      <div className="min-w-0">
        {subtitle && <p className="text-[13px] font-medium text-muted-foreground">{subtitle}</p>}
        <h1 className="truncate text-[28px] font-bold leading-tight tracking-tight">{title}</h1>
      </div>
      {end}
    </header>
  );
}

export const Section = ({ title, children, className }: { title?: ReactNode; children: ReactNode; className?: string }) => (
  <section className={cn("mt-6", className)}>
    {title && <h2 className="mb-2 px-1 text-[13px] font-semibold text-muted-foreground">{title}</h2>}
    {children}
  </section>
);

export const Card = ({ children, className, ...p }: React.HTMLAttributes<HTMLDivElement>) => (
  <div {...p} className={cn("rounded-2xl bg-card p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)]", className)}>{children}</div>
);

/** A tappable row: leading badge, title + subtitle, trailing content or a chevron. */
export function Row({ onClick, lead, title, sub, end, className }: { onClick?: () => void; lead?: ReactNode; title: ReactNode; sub?: ReactNode; end?: ReactNode; className?: string }) {
  return (
    <button onClick={onClick} className={cn("flex w-full items-center gap-3 px-1 py-3 text-start transition-colors active:bg-muted/60", className)}>
      {lead != null && <span className="grid size-9 shrink-0 place-items-center rounded-full bg-muted text-[13px] font-semibold tabular-nums text-muted-foreground">{lead}</span>}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px]">{title}</span>
        {sub && <span className="block truncate text-[12px] text-muted-foreground">{sub}</span>}
      </span>
      {end ?? <ChevronRight className="size-4 shrink-0 text-muted-foreground rtl:-scale-x-100" />}
    </button>
  );
}

/** Segmented control (shadcn Tabs list). */
export function Segmented<V extends string>({ value, options, onChange, className }: { value: V; options: [V, ReactNode][]; onChange: (v: V) => void; className?: string }) {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as V)} className={className}>
      <TabsList className="h-9 w-full">
        {options.map(([v, label]) => <TabsTrigger key={v} value={v} className="text-[13px]">{label}</TabsTrigger>)}
      </TabsList>
    </Tabs>
  );
}

/** Keeps the last non-null value, so a sheet shows its content while it animates closed. */
export function useLast<T>(value: T | null): T | null {
  const [last, setLast] = useState(value);
  if (value != null && value !== last) setLast(value);
  return value ?? last;
}

/** Bottom sheet (Vaul): drag to dismiss with the finger's velocity, never a jump. */
export function Sheet({ open, onOpenChange, title, description, children, tall }: {
  open: boolean; onOpenChange: (open: boolean) => void; title: ReactNode; description?: ReactNode; children: ReactNode; tall?: boolean;
}) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent
        className={cn("mx-auto max-w-xl rounded-t-[24px] border-none bg-background", tall ? "h-[92dvh] max-h-[92dvh]" : "max-h-[88dvh]")}>
        <DrawerHeader className="px-5 pb-2 pt-3 text-start md:text-start">
          <DrawerTitle className="text-[17px]">{title}</DrawerTitle>
          {description ? <DrawerDescription>{description}</DrawerDescription> : <DrawerDescription className="sr-only">{title}</DrawerDescription>}
        </DrawerHeader>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">{children}</div>
      </DrawerContent>
    </Drawer>
  );
}

/** Full-screen run (quiz, mutashabihat round), above the tab bar until finished. */
export function Session({ children, onClose, label, progress }: { children: ReactNode; onClose: () => void; label: ReactNode; progress: number }) {
  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-background duration-300 animate-in fade-in slide-in-from-bottom-4">
      <div className="mx-auto w-full max-w-xl px-4 pt-[calc(env(safe-area-inset-top)+0.5rem)]">
        <div className="flex items-center gap-3 py-2">
          <Button variant="secondary" size="icon" className="rounded-full" onClick={onClose} aria-label="close"><X /></Button>
          <span className="min-w-0 flex-1 truncate text-center text-[13px] tabular-nums text-muted-foreground">{label}</span>
          <span className="size-9" />
        </div>
        <Progress value={progress * 100} />
      </div>
      <div className="mx-auto w-full max-w-xl flex-1 overflow-y-auto px-4 pb-10 pt-5">{children}</div>
    </div>
  );
}

/** Answer option, coloured once answered. */
export function Choice({ children, state, onClick, disabled }: { children: ReactNode; state?: "right" | "wrong"; onClick: () => void; disabled?: boolean }) {
  return (
    <button disabled={disabled} onClick={onClick}
      className={cn("quran block w-full rounded-2xl bg-card px-4 py-3 text-start text-[21px] leading-[1.9] shadow-[0_1px_2px_rgb(0_0_0/0.04)] transition-all duration-200 active:scale-[0.99]",
        state === "right" && "bg-accent text-accent-foreground ring-2 ring-primary", state === "wrong" && "bg-destructive/10 ring-2 ring-destructive")}>
      {children}
    </button>
  );
}

export const Verdict = ({ right, children }: { right: boolean; children: ReactNode }) => (
  <div className={cn("rounded-xl px-4 py-2.5 text-[15px] font-semibold duration-200 animate-in fade-in zoom-in-95", right ? "bg-accent text-accent-foreground" : "bg-destructive/10 text-destructive")}>{children}</div>
);

/** Arabic text block used for verses everywhere outside the mushaf page. */
export const VerseText = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div dir="rtl" className={cn("quran text-[22px] leading-[1.95]", className)}>{children}</div>
);
