import type { ReactNode } from "react";
import "./globals.css";

import { Toaster } from "@/components/ui/use-toast";
import { I18nProvider } from "@/lib/i18n/client";
import { getLocale } from "@/lib/i18n/server";
import { dictionaries } from "@/lib/i18n/messages";

export const metadata = {
  title: "MissionOps",
  description: "Le système d'exploitation des missions terrain",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = await getLocale();

  return (
    <html lang={locale}>
      <body>
        <I18nProvider locale={locale} messages={dictionaries[locale]}>
          <Toaster>{children}</Toaster>
        </I18nProvider>
      </body>
    </html>
  );
}
