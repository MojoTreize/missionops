import type { ReactNode } from "react";

/**
 * Mise en page des écrans non authentifiés (connexion, réinitialisation).
 * Colonne centrée, confortable au pouce sur mobile (375px) comme au bureau.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-paper px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-field">MissionOps</h1>
          <p className="mt-1 text-sm text-muted">
            Le système d&apos;exploitation des missions terrain
          </p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-6 shadow-sm">{children}</div>
      </div>
    </main>
  );
}
