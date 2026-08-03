import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "MissionOps",
  description: "Le système d'exploitation des missions terrain",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
