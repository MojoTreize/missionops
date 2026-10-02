"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { useT } from "@/lib/i18n/client";

/**
 * Recherche globale (B1.10). Un déclencheur dans l'en-tête et un raccourci
 * clavier (Ctrl/⌘ + K) ouvrent une boîte de dialogue. La recherche portera sur
 * les missions, dépenses et membres dès que des données existeront ; à ce stade
 * la coque est en place et navigable au clavier.
 */
interface Hit {
  type: "mission" | "expense" | "member";
  id: string;
  title: string;
  subtitle: string;
  href: string;
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<Hit[] | null>(null);
  const t = useT();

  // Recherche serveur (B6.5), avec un délai court pour limiter les requêtes en 3G.
  useEffect(() => {
    if (query.trim().length < 2) {
      setHits(null);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(query.trim())}`, { signal: controller.signal })
        .then((r) => (r.ok ? r.json() : { results: [] }))
        .then((data: { results: Hit[] }) => setHits(data.results))
        .catch(() => undefined);
    }, 250);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query]);

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
        aria-label={t("shell.searchLabel")}
        aria-keyshortcuts="Control+K"
        className="flex h-9 items-center gap-2 rounded-md border border-border bg-surface px-2.5 text-sm text-muted transition-colors hover:text-ink md:min-w-56"
      >
        <Search className="size-4 shrink-0" aria-hidden />
        <span className="hidden md:inline">{t("shell.searchButton")}</span>
        <kbd className="ml-auto hidden rounded border border-border px-1.5 py-0.5 text-xs text-subtle md:inline">
          Ctrl K
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="top-24 translate-y-0">
          <DialogHeader>
            <DialogTitle>{t("shell.searchLabel")}</DialogTitle>
          </DialogHeader>
          <Input
            autoFocus
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("shell.searchPlaceholder")}
            aria-label={t("shell.searchTerm")}
          />
          {hits === null ? (
            <EmptyState icon={<Search aria-hidden />} title={t("searchResults.hint")} />
          ) : hits.length === 0 ? (
            <p className="text-sm text-muted">{t("searchResults.empty")}</p>
          ) : (
            <ul className="flex max-h-80 flex-col divide-y divide-border overflow-y-auto">
              {hits.map((hit) => (
                <li key={`${hit.type}-${hit.id}`}>
                  <Link
                    href={hit.href}
                    onClick={() => setOpen(false)}
                    className="flex flex-col px-1 py-2 hover:bg-field-soft"
                  >
                    <span className="text-sm font-medium text-ink">{hit.title}</span>
                    <span className="text-xs text-muted">
                      {t(`searchResults.${hit.type}`)} · {hit.subtitle}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
