import type { Metadata, Viewport } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

import { ServiceWorkerRegister } from "@/components/offline/sw-register";
import { Toaster } from "@/components/ui/use-toast";
import { I18nProvider } from "@/lib/i18n/client";
import { getLocale } from "@/lib/i18n/server";
import { dictionaries } from "@/lib/i18n/messages";

/**
 * Polices auto-hébergées par Next.js (téléchargées au build, servies depuis
 * notre domaine) : aucune requête tierce, disponibles hors ligne.
 */
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const serif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-serif-display",
  weight: ["500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "MissionOps",
  description: "Le système d'exploitation des missions terrain",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icons/icon-192.png", apple: "/icons/apple-touch-icon.png" },
  appleWebApp: { capable: true, title: "MissionOps", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#0b2a22",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = await getLocale();

  return (
    <html lang={locale} className={`${inter.variable} ${serif.variable}`}>
      <body>
        <I18nProvider locale={locale} messages={dictionaries[locale]}>
          <Toaster>{children}</Toaster>
        </I18nProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
