"use client";
/* All settings in one sheet: language, appearance, plan, recitation check, backup. */
import { useState, type ReactNode } from "react";
import { useT } from "@/lib/i18n";
import { backupCode, prefs, restoreBackup, updatePrefs, type Lang, type Strictness, type Theme } from "@/lib/prefs";
import { setNextPage } from "@/lib/plan";
import { pageParts } from "@/lib/quran";
import { loadModelFile, send } from "@/lib/recognition";
import { RECITER } from "@/lib/audio";
import { ui } from "@/lib/ui";
import { Button, Segmented, Sheet, Stepper, Toggle } from "./ui";

const Group = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="mt-5 first:mt-1">
    <h3 className="mb-2 px-1 text-[13px] font-semibold text-muted">{title}</h3>
    <div className="divide-y divide-line rounded-2xl bg-surface px-4">{children}</div>
  </section>
);
const Item = ({ label, meta, children, stack }: { label: string; meta?: ReactNode; children?: ReactNode; stack?: boolean }) => (
  <div className={`flex gap-3 py-3 ${stack ? "flex-col" : "items-center justify-between"}`}>
    <div className="min-w-0"><div className="text-[15px]">{label}</div>{meta && <div className="text-[12px] text-muted">{meta}</div>}</div>
    {children}
  </div>
);

export function SettingsSheet() {
  const { t, n, sura } = useT();
  const open = ui.use((s) => s.overlay === "settings");
  const S = prefs.use((s) => s);
  const [code, setCode] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const tz = (patch: Partial<typeof S.tz>) => {
    updatePrefs((d) => { d.tz = { ...d.tz, ...patch }; });
    const next = prefs.get().tz;
    send({ type: "opts", opts: { strict: next.strict, stopOnMistake: next.stop } });
  };
  const nextLabel = pageParts(S.next).map((p) => `${sura(p.s)} ${n(p.from)}`).join(" · ");

  return (
    <Sheet open={open} onClose={() => ui.set({ overlay: null })} title={t("settings")} tall>
      <Group title={t("language")}>
        <Item label={t("language")}>
          <Segmented<Lang> value={S.lang} onChange={(lang) => updatePrefs((d) => { d.lang = lang; })} options={[["ar", "العربية"], ["fr", "Français"], ["en", "English"]]} />
        </Item>
        <Item label={t("theme")}>
          <Segmented<Theme> value={S.theme} onChange={(theme) => updatePrefs((d) => { d.theme = theme; })} options={[["", t("themeAuto")], ["light", t("themeLight")], ["dark", t("themeDark")]]} />
        </Item>
      </Group>

      <Group title={t("plan")}>
        <Item label={t("nextPage")} meta={nextLabel}>
          <Stepper label={t("nextPage")} value={n(S.next)} onChange={(d) => setNextPage(S.next + d)} />
        </Item>
        <Item label={t("oldPerDay")}>
          <Segmented<number> value={S.oldPerDay} onChange={(v) => updatePrefs((d) => { d.oldPerDay = v; })} options={[5, 10, 15, 20].map((v) => [v, n(v)])} />
        </Item>
        <Item label={t("sundayRest")} meta={t("sundayRestMeta")}>
          <Toggle label={t("sundayRest")} on={S.sundayOff} onChange={(v) => updatePrefs((d) => { d.sundayOff = v; })} />
        </Item>
      </Group>

      <Group title={t("recitation")}>
        <Item label={t("strictness")}>
          <Segmented<Strictness> value={S.tz.strict} onChange={(strict) => tz({ strict })} options={[["relaxed", t("relaxed")], ["normal", t("normal")], ["strict", t("strict")]]} />
        </Item>
        <Item label={t("stopOnMistake")}><Toggle label={t("stopOnMistake")} on={S.tz.stop} onChange={(stop) => tz({ stop })} /></Item>
        <Item label={t("vibrate")}><Toggle label={t("vibrate")} on={S.tz.vibrate} onChange={(vibrate) => tz({ vibrate })} /></Item>
        <Item label={t("modelFile")} meta={t("modelFileHint")} stack>
          <input type="file" accept=".onnx" className="text-[13px] text-muted file:me-3 file:rounded-lg file:border-0 file:bg-surface-2 file:px-3 file:py-1.5 file:text-ink"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) void loadModelFile(f); }} />
        </Item>
        <Item label={t("reciter")} meta={RECITER.name} />
      </Group>

      <Group title={t("backup")}>
        <Item label={t("backup")} meta={t("backupHint")} stack>
          <div className="flex gap-2">
            <Button small onClick={async () => { const c = backupCode(); try { await navigator.clipboard.writeText(c); setMsg(t("copied")); } catch { setCode(c); } }}>{t("copyCode")}</Button>
            <Button small onClick={() => { setCode(""); setMsg(""); }}>{t("restore")}</Button>
            {msg && <span className="self-center text-[13px] text-muted">{msg}</span>}
          </div>
          {code != null && (
            <div className="flex flex-col gap-2">
              <textarea dir="ltr" value={code} onChange={(e) => setCode(e.target.value)} placeholder={t("pasteCode")}
                className="h-24 w-full rounded-xl bg-surface-2 p-2 font-mono text-[11px] outline-none" />
              <Button small tone="primary" className="self-start" onClick={() => { try { restoreBackup(code); setCode(null); setMsg(""); } catch { setMsg(t("invalidCode")); } }}>{t("restore")}</Button>
            </div>
          )}
        </Item>
      </Group>

      <Group title={t("about")}>
        <p className="py-3 text-[13px] leading-relaxed text-muted">{t("aboutText")}</p>
      </Group>
    </Sheet>
  );
}
