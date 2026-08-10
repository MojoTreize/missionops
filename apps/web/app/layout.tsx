import type { ReactNode } from "react";
import "./globals.css";

import { Toaster } from "@/components/ui/use-toast";

export const metadata = {
  title: "MissionOps",
  description: "Le système d'exploitation des missions terrain",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <Toaster>{children}</Toaster>
      </body>
    </html>
  );
}
