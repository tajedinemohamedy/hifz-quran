/* One stroke icon set (24px grid). Direction-sensitive icons flip in RTL via the `flip` class. */
const PATHS = {
  today: "M4 7h16M4 12h16M4 17h10 M19 15a2 2 0 1 0 0 4a2 2 0 1 0 0-4",
  book: "M12 6c-2-1.5-5-2-8-1.5v13c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5v-13c-3-.5-6 0-8 1.5z M12 6v13",
  practice: "M12 3.5a8.5 8.5 0 1 0 0 17a8.5 8.5 0 1 0 0-17 M9.6 9.5a2.5 2.5 0 1 1 3.4 2.3c-.6.3-1 .8-1 1.5v.4 M12 16.6v.1",
  search: "M11 4a7 7 0 1 0 0 14a7 7 0 1 0 0-14 M20 20l-4-4",
  settings: "M12 9a3 3 0 1 0 0 6a3 3 0 1 0 0-6 M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z",
  play: "M8 5.5v13l10.5-6.5z",
  pause: "M8 5v14 M16 5v14",
  stop: "M7 7h10v10H7z",
  mic: "M9 3h6v11H9z M5.5 11a6.5 6.5 0 0 0 13 0 M12 17.5V21",
  check: "M5 12.5l4.5 4.5L19 7.5",
  close: "M6 6l12 12M18 6L6 18",
  chevron: "M9 6l6 6-6 6",
  bookmark: "M6 4h12v16l-6-4-6 4z",
  star: "M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8-4.3-4.1 5.9-.8z",
  flag: "M5 21V4 M5 4h11l-2 4 2 4H5",
  copy: "M9 9h11v11H9z M5 15H4V4h11v1",
  eye: "M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12z M12 9a3 3 0 1 0 0 6a3 3 0 1 0 0-6",
  minus: "M5 12h14",
  plus: "M12 5v14M5 12h14",
};
export type IconName = keyof typeof PATHS;

export function Icon({ name, className = "size-5", fill = false, flip = false }: { name: IconName; className?: string; fill?: boolean; flip?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={`${className} ${flip ? "rtl:-scale-x-100" : ""} shrink-0`}
      fill={fill ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d={PATHS[name]} />
    </svg>
  );
}
