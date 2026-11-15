"use client";
/* Shared building blocks: every screen uses these, so spacing, radius and states stay consistent. */
import { useEffect, type ReactNode, type ButtonHTMLAttributes } from "react";
import { Icon } from "./icons";

type Tone = "plain" | "primary" | "ghost" | "danger";
const TONES: Record<Tone, string> = {
  plain: "bg-surface-2 text-ink active:opacity-70",
  primary: "bg-accent text-on-accent font-semibold active:opacity-80",
  ghost: "text-accent active:opacity-60",
  danger: "bg-danger-soft text-danger active:opacity-70",
};

export function Button({ tone = "plain", small, className = "", ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: Tone; small?: boolean }) {
  return (
    <button
      {...p}
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl transition-opacity disabled:opacity-40 ${small ? "h-8 px-3 text-[13px]" : "h-11 px-4 text-[15px]"} ${TONES[tone]} ${className}`}
    />
  );
}

export function Segmented<V extends string | number | boolean>({ value, options, onChange, className = "", label }: {
  value: V; options: [V, ReactNode][]; onChange: (v: V) => void; className?: string; label?: string;
}) {
  return (
    <div role="group" aria-label={label} className={`flex rounded-[10px] bg-surface-2 p-0.5 ${className}`}>
      {options.map(([v, l]) => (
        <button key={String(v)} aria-pressed={v === value} onClick={() => onChange(v)}
          className="min-w-0 flex-1 truncate rounded-lg px-3 py-1.5 text-[13px] font-medium text-muted transition-colors aria-pressed:bg-surface aria-pressed:text-ink aria-pressed:shadow-sm">
          {l}
        </button>
      ))}
    </div>
  );
}

export function Card({ children, className = "", ...p }: { children: ReactNode; className?: string } & React.HTMLAttributes<HTMLDivElement>) {
  return <div {...p} className={`rounded-2xl bg-surface p-4 ${className}`}>{children}</div>;
}

export const SectionTitle = ({ children }: { children: ReactNode }) => (
  <h2 className="mb-2 mt-6 px-1 text-[13px] font-semibold uppercase tracking-wide text-muted">{children}</h2>
);

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${on ? "bg-accent" : "bg-surface-2"}`}>
      <span className={`absolute top-0.5 size-6 rounded-full bg-white shadow transition-all ${on ? "start-[22px]" : "start-0.5"}`} />
    </button>
  );
}

export function Stepper({ value, onChange, label }: { value: ReactNode; onChange: (d: number) => void; label: string }) {
  return (
    <div className="flex items-center gap-1" aria-label={label}>
      <button className="grid size-8 place-items-center rounded-full bg-surface-2 active:opacity-60" onClick={() => onChange(-1)} aria-label="−"><Icon name="minus" className="size-4" /></button>
      <span className="min-w-10 text-center text-[17px] font-semibold tabular-nums">{value}</span>
      <button className="grid size-8 place-items-center rounded-full bg-surface-2 active:opacity-60" onClick={() => onChange(1)} aria-label="+"><Icon name="plus" className="size-4" /></button>
    </div>
  );
}

export function Bar({ value }: { value: number }) {
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
      <div className="h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${Math.round(Math.min(1, Math.max(0, value)) * 100)}%` }} />
    </div>
  );
}

/** Bottom sheet: one presentation for every secondary surface (verse, search, settings, results). */
export function Sheet({ open, onClose, children, title, tall }: { open: boolean; onClose: () => void; children: ReactNode; title?: ReactNode; tall?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    addEventListener("keydown", esc);
    return () => removeEventListener("keydown", esc);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center" role="dialog" aria-modal="true">
      <div className="anim-fade absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />
      <div className={`anim-sheet relative flex w-full max-w-xl flex-col rounded-t-3xl bg-bg shadow-2xl ${tall ? "h-[92dvh]" : "max-h-[85dvh]"}`}>
        <div className="flex items-center gap-2 px-4 pb-2 pt-3">
          <div className="min-w-0 flex-1 truncate text-[17px] font-semibold">{title}</div>
          <button onClick={onClose} aria-label="close" className="grid size-8 place-items-center rounded-full bg-surface-2 text-muted active:opacity-60">
            <Icon name="close" className="size-4" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">{children}</div>
      </div>
    </div>
  );
}

/** Full-screen run (quiz, mutashabihat round): stays above the tab bar until finished. */
export function Session({ children, onEnd, endLabel, label, progress }: { children: ReactNode; onEnd: () => void; endLabel: string; label: ReactNode; progress: number }) {
  return (
    <div className="anim-fade fixed inset-0 z-30 flex flex-col bg-bg">
      <div className="mx-auto w-full max-w-xl px-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="flex items-center justify-between gap-3 py-2">
          <Button small onClick={onEnd}>{endLabel}</Button>
          <span className="truncate text-[13px] text-muted tabular-nums">{label}</span>
        </div>
        <Bar value={progress} />
      </div>
      <div className="mx-auto w-full max-w-xl flex-1 overflow-y-auto px-4 pb-10 pt-4">{children}</div>
    </div>
  );
}

/** Answer option button with result coloring. */
export function Option({ children, state, onClick, disabled }: { children: ReactNode; state?: "ok" | "no"; onClick: () => void; disabled?: boolean }) {
  const s = state === "ok" ? "bg-accent-soft ring-2 ring-accent" : state === "no" ? "bg-danger-soft ring-2 ring-danger" : "bg-surface active:bg-surface-2";
  return (
    <button disabled={disabled} onClick={onClick} className={`quran block w-full rounded-2xl px-4 py-3 text-start text-[21px] leading-[1.9] transition-colors ${s}`}>
      {children}
    </button>
  );
}

export const Feedback = ({ ok, children }: { ok: boolean; children: ReactNode }) => (
  <div className={`rounded-xl px-4 py-2.5 text-[15px] font-semibold ${ok ? "bg-accent-soft text-accent" : "bg-danger-soft text-danger"}`}>{children}</div>
);
