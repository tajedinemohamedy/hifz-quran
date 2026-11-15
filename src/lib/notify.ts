/* The single feedback channel: every success, warning and failure in the app is announced here (Sonner, from the top). */
import { toast } from "sonner";
import { prefs } from "./prefs";
import { translator, type Key } from "./i18n";

type Vars = Record<string, string | number>;
const t = (k: Key, v?: Vars) => translator(prefs.get().lang).t(k, v);

/** `id` makes a repeated message update in place instead of stacking. */
export const notify = {
  success: (k: Key, v?: Vars, id?: string, action?: { label: Key; onClick: () => void }) =>
    toast.success(t(k, v), { id, action: action && { label: t(action.label), onClick: action.onClick } }),
  info: (k: Key, v?: Vars, id?: string) => toast(t(k, v), { id }),
  warning: (k: Key, v?: Vars, id?: string) => toast.warning(t(k, v), { id }),
  error: (k: Key, opts: { vars?: Vars; id?: string; retry?: () => void; detail?: Key } = {}) =>
    toast.error(t(k, opts.vars), {
      id: opts.id,
      description: opts.detail ? t(opts.detail) : undefined,
      duration: opts.retry ? 10000 : 6000,
      action: opts.retry ? { label: t("retry"), onClick: opts.retry } : undefined,
    }),
  dismiss: (id: string) => toast.dismiss(id),
};
