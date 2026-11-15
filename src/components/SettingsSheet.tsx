"use client";
/* All settings in one sheet, in plain groups: language & look, the plan, the recitation check, backup. */
import { useState, type ReactNode } from "react";
import { Minus, Plus } from "lucide-react";
import { useT } from "@/lib/i18n";
import { prefs, updatePrefs, type Lang, type Strictness, type Theme } from "@/lib/prefs";
import { backupCode, restoreBackup, undoRestore } from "@/lib/storage";
import { setNextPage } from "@/lib/plan";
import { pageParts } from "@/lib/quran";
import { send } from "@/lib/recognition";
import { RECITER } from "@/lib/audio";
import { notify } from "@/lib/notify";
import { ui } from "@/lib/ui";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Segmented, Sheet } from "./kit";

const Group = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="mt-6 first:mt-1">
    <h3 className="mb-2 px-1 text-[13px] font-semibold text-muted-foreground">{title}</h3>
    <div className="divide-y divide-border rounded-2xl bg-card px-4">{children}</div>
  </section>
);
const Item = ({ label, meta, children, stack }: { label: string; meta?: ReactNode; children?: ReactNode; stack?: boolean }) => (
  <div className={stack ? "flex flex-col gap-3 py-3.5" : "flex items-center justify-between gap-3 py-3.5"}>
    <div className="min-w-0"><div className="text-[15px]">{label}</div>{meta && <div className="text-[12px] text-muted-foreground">{meta}</div>}</div>
    {children}
  </div>
);

export function SettingsSheet() {
  const { t, n, sura } = useT();
  const open = ui.use((s) => s.overlay === "settings");
  const S = prefs.use((s) => s);
  const [restoring, setRestoring] = useState<string | null>(null);
  const tz = (patch: Partial<typeof S.tz>) => {
    updatePrefs((d) => { d.tz = { ...d.tz, ...patch }; });
    const next = prefs.get().tz;
    send({ type: "opts", opts: { strict: next.strict, stopOnMistake: next.stop } });
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(backupCode()); notify.success("codeCopied", undefined, "backup"); }
    catch { setRestoring(backupCode()); notify.info("copyManually", undefined, "backup"); }
  };
  const restore = () => {
    try { restoreBackup(restoring ?? ""); setRestoring(null); notify.success("restored", undefined, "backup", { label: "undo", onClick: undoRestore }); }
    catch { notify.error("invalidCode", { id: "backup" }); }
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && ui.set({ overlay: null })} title={t("settings")} tall>
      <Group title={t("general")}>
        <Item label={t("language")} stack>
          <Segmented<Lang> value={S.lang} onChange={(lang) => updatePrefs((d) => { d.lang = lang; })} options={[["ar", "العربية"], ["fr", "Français"], ["en", "English"]]} />
        </Item>
        <Item label={t("theme")} stack>
          <Segmented<Theme | "auto"> value={S.theme || "auto"} onChange={(v) => updatePrefs((d) => { d.theme = v === "auto" ? "" : v; })}
            options={[["auto", t("themeAuto")], ["light", t("themeLight")], ["dark", t("themeDark")]]} />
        </Item>
      </Group>

      <Group title={t("plan")}>
        <Item label={t("nextPage")} meta={pageParts(S.next).map((p) => `${sura(p.s)} ${n(p.from)}`).join(" · ")}>
          <div className="flex items-center gap-1">
            <Button variant="secondary" size="icon" className="rounded-full" aria-label="−" onClick={() => setNextPage(S.next - 1)}><Minus /></Button>
            <span className="min-w-10 text-center text-[17px] font-semibold tabular-nums">{n(S.next)}</span>
            <Button variant="secondary" size="icon" className="rounded-full" aria-label="+" onClick={() => setNextPage(S.next + 1)}><Plus /></Button>
          </div>
        </Item>
        <Item label={t("oldPerDay")} stack>
          <Segmented<string> value={String(S.oldPerDay)} onChange={(v) => updatePrefs((d) => { d.oldPerDay = +v; })} options={[5, 10, 15, 20].map((v) => [String(v), n(v)])} />
        </Item>
        <Item label={t("sundayRest")} meta={t("sundayRestMeta")}>
          <Switch checked={S.sundayOff} onCheckedChange={(v) => updatePrefs((d) => { d.sundayOff = v; })} aria-label={t("sundayRest")} />
        </Item>
      </Group>

      <Group title={t("recitation")}>
        <Item label={t("strictness")} stack>
          <Segmented<Strictness> value={S.tz.strict} onChange={(strict) => tz({ strict })} options={[["relaxed", t("relaxed")], ["normal", t("normal")], ["strict", t("strict")]]} />
        </Item>
        <Item label={t("stopOnMistake")}><Switch checked={S.tz.stop} onCheckedChange={(stop) => tz({ stop })} aria-label={t("stopOnMistake")} /></Item>
        <Item label={t("vibrate")}><Switch checked={S.tz.vibrate} onCheckedChange={(vibrate) => tz({ vibrate })} aria-label={t("vibrate")} /></Item>
        <Item label={t("reciter")} meta={RECITER.name} />
      </Group>

      <Group title={t("backup")}>
        <Item label={t("backup")} meta={t("backupHint")} stack>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={copy}>{t("copyCode")}</Button>
            <Button variant="secondary" onClick={() => setRestoring("")}>{t("restore")}</Button>
          </div>
          {restoring != null && (
            <div className="flex flex-col gap-2 duration-200 animate-in fade-in slide-in-from-top-1">
              <textarea dir="ltr" value={restoring} onChange={(e) => setRestoring(e.target.value)} placeholder={t("pasteCode")}
                className="h-24 w-full rounded-xl bg-muted p-3 font-mono text-[11px] outline-none focus:ring-2 focus:ring-ring/40" />
              <Button className="self-start" onClick={restore}>{t("restore")}</Button>
            </div>
          )}
        </Item>
      </Group>

      <Group title={t("about")}>
        <p className="py-3.5 text-[13px] leading-relaxed text-muted-foreground">{t("aboutText")}</p>
      </Group>
    </Sheet>
  );
}
