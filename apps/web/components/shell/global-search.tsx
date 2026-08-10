"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";

/**
 * Recherche globale (B1.10). Un déclencheur dans l'en-tête et un raccourci
 * clavier (Ctrl/⌘ + K) ouvrent une boîte de dialogue. La recherche portera sur
 * les missions, dépenses et membres dès que des données existeront ; à ce stade
 * la coque est en place et navigable au clavier.
 */
export function GlobalSearch() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Recherche globale"
        aria-keyshortcuts="Control+K"
        className="flex h-9 items-center gap-2 rounded-md border border-border bg-surface px-2.5 text-sm text-muted transition-colors hover:text-ink md:min-w-56"
      >
        <Search className="size-4 shrink-0" aria-hidden />
        <span className="hidden md:inline">Rechercher…</span>
        <kbd className="ml-auto hidden rounded border border-border px-1.5 py-0.5 text-xs text-subtle md:inline">
          Ctrl K
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="top-24 translate-y-0">
          <DialogHeader>
            <DialogTitle>Recherche globale</DialogTitle>
          </DialogHeader>
          <Input
            autoFocus
            type="search"
            placeholder="Rechercher une mission, une dépense, un membre…"
            aria-label="Terme de recherche"
          />
          <EmptyState
            icon={<Search aria-hidden />}
            title="Rien à rechercher pour l'instant"
            description="La recherche portera sur les missions, les dépenses et les membres dès que des données existeront."
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
