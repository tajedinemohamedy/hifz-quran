import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";

const ui = IBM_Plex_Sans_Arabic({ variable: "--font-ui", subsets: ["arabic", "latin"], weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "مصحف الحفظ · ورش",
  description: "Mushaf Warsh: read, listen, memorize, recite and review.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
  appleWebApp: { capable: true, statusBarStyle: "default", title: "مصحف الحفظ" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f5f2" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0b0c" },
  ],
};

/* Applies the saved language and theme before the first paint (no flash, correct direction). */
const BOOT = `try{var s=JSON.parse(localStorage.getItem("hifz_app_v1")||"{}"),l=s.lang||"ar",t=s.theme||(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"),d=document.documentElement;d.lang=l;d.dir=l==="ar"?"rtl":"ltr";d.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ar" dir="rtl" className={`${ui.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: BOOT }} />
      </head>
      <body className="h-full">{children}</body>
    </html>
  );
}
