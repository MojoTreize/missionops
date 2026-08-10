"use client";

import type { ReactNode } from "react";
import { Inbox, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoneyDisplay } from "@/components/ui/money-display";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import type { Money } from "@/lib/money";

const swatches = [
  { name: "ink", className: "bg-ink text-paper" },
  { name: "paper", className: "bg-paper text-ink border border-border" },
  { name: "surface", className: "bg-surface text-ink border border-border" },
  { name: "field", className: "bg-field text-field-fg" },
  { name: "ledger", className: "bg-ledger text-ledger-fg" },
  { name: "muted", className: "bg-muted text-paper" },
  { name: "danger", className: "bg-danger text-danger-fg" },
  { name: "success", className: "bg-success text-paper" },
  { name: "warning", className: "bg-warning text-paper" },
];

const rows: { id: string; mission: string; statut: string; montant: Money }[] = [
  {
    id: "M-001",
    mission: "Conakry — distribution",
    statut: "Validée",
    montant: { amountMinor: 12_500_000n, currency: "GNF" },
  },
  {
    id: "M-002",
    mission: "Kindia — évaluation",
    statut: "En attente",
    montant: { amountMinor: 348_00n, currency: "EUR" },
  },
  {
    id: "M-003",
    mission: "Labé — remboursement",
    statut: "Rejetée",
    montant: { amountMinor: -75_00n, currency: "USD" },
  },
];

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold text-ink">{title}</h2>
        {description ? <p className="text-sm text-muted">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

export default function KitchenSinkPage() {
  const { toast } = useToast();

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-12 px-4 py-10 sm:px-6">
      <header className="flex flex-col gap-2">
        <Badge variant="ledger" className="w-fit">
          Bloc B1.4
        </Badge>
        <h1 className="text-3xl font-semibold text-ink">Kitchen sink</h1>
        <p className="max-w-2xl text-muted">
          Toutes les primitives et les jetons de design de MissionOps. Cette page sert de référence
          visuelle et de banc de test (375&nbsp;px et 1440&nbsp;px, navigation entièrement au
          clavier).
        </p>
      </header>

      <Section
        title="Couleurs"
        description="Palette institutionnelle : vert « field » pour les actions, orange « ledger » pour l'argent."
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {swatches.map((swatch) => (
            <div
              key={swatch.name}
              className={`flex h-20 items-end rounded-lg p-2 text-xs font-medium shadow-xs ${swatch.className}`}
            >
              {swatch.name}
            </div>
          ))}
        </div>
      </Section>

      <Section title="Typographie">
        <div className="flex flex-col gap-2">
          <p className="text-3xl font-semibold">Titre — 3xl</p>
          <p className="text-2xl font-semibold">Titre — 2xl</p>
          <p className="text-xl font-semibold">Titre — xl</p>
          <p className="text-base">
            Corps de texte — base. Le renard brun et rapide saute par-dessus le chien paresseux.
          </p>
          <p className="text-sm text-muted">Texte secondaire — sm.</p>
          <p className="font-mono text-sm tabular-nums">Mono — 1 234 567,89</p>
        </div>
      </Section>

      <Section
        title="Boutons"
        description="Cibles tactiles larges (44 px min) pour l'usage sur le terrain."
      >
        <div className="flex flex-wrap gap-3">
          <Button variant="primary">Primaire</Button>
          <Button variant="ledger">Ledger</Button>
          <Button variant="secondary">Secondaire</Button>
          <Button variant="outline">Contour</Button>
          <Button variant="ghost">Fantôme</Button>
          <Button variant="danger">Danger</Button>
          <Button disabled>Désactivé</Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm">Petit</Button>
          <Button size="md">Moyen</Button>
          <Button size="lg">Grand</Button>
          <Button size="icon" aria-label="Ajouter">
            <Plus />
          </Button>
        </div>
      </Section>

      <Section title="Formulaire">
        <div className="grid max-w-md gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ks-nom">Nom de la mission</Label>
            <Input id="ks-nom" placeholder="Ex. Distribution Conakry" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ks-email">Courriel</Label>
            <Input id="ks-email" type="email" defaultValue="invalide" aria-invalid />
            <p className="text-xs text-danger">Adresse courriel invalide.</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Devise</Label>
            <Select defaultValue="GNF">
              <SelectTrigger aria-label="Devise">
                <SelectValue placeholder="Choisir une devise" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GNF">Franc guinéen (GNF)</SelectItem>
                <SelectItem value="EUR">Euro (EUR)</SelectItem>
                <SelectItem value="USD">Dollar US (USD)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Section>

      <Section title="Badges">
        <div className="flex flex-wrap gap-2">
          <Badge>Neutre</Badge>
          <Badge variant="muted">Discret</Badge>
          <Badge variant="ledger">Montant</Badge>
          <Badge variant="success">Validée</Badge>
          <Badge variant="warning">En attente</Badge>
          <Badge variant="danger">Rejetée</Badge>
          <Badge variant="outline">Contour</Badge>
        </div>
      </Section>

      <Section title="Superpositions" description="Dialog, Sheet et Toast.">
        <div className="flex flex-wrap gap-3">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="secondary">Ouvrir un dialogue</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Valider la dépense ?</DialogTitle>
                <DialogDescription>
                  Cette action enregistrera la dépense dans le grand-livre de la mission.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="ghost">Annuler</Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button>Valider</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="secondary">Ouvrir un panneau</Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Détails de la mission</SheetTitle>
                <SheetDescription>
                  Panneau latéral pour l'édition rapide sur bureau.
                </SheetDescription>
              </SheetHeader>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ks-sheet">Référence</Label>
                <Input id="ks-sheet" defaultValue="M-001" />
              </div>
              <SheetFooter>
                <SheetClose asChild>
                  <Button className="w-full">Enregistrer</Button>
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>

          <Button
            variant="secondary"
            onClick={() =>
              toast({
                title: "Dépense enregistrée",
                description: "M-001 — 125 000 GNF ajoutés au grand-livre.",
                variant: "success",
              })
            }
          >
            Afficher un toast
          </Button>
        </div>
      </Section>

      <Section
        title="Tableau"
        description="Montants alignés (chiffres tabulaires) via MoneyDisplay."
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Réf.</TableHead>
              <TableHead>Mission</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Montant</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-mono text-sm">{row.id}</TableCell>
                <TableCell>{row.mission}</TableCell>
                <TableCell>{row.statut}</TableCell>
                <TableCell className="text-right">
                  <MoneyDisplay money={row.montant} accent />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Section>

      <Section title="État vide">
        <EmptyState
          icon={<Inbox />}
          title="Aucune mission pour le moment"
          description="Créez votre première mission pour commencer à suivre les dépenses terrain."
          action={
            <Button>
              <Plus />
              Nouvelle mission
            </Button>
          }
        />
      </Section>

      <Section title="Chargement">
        <div className="flex flex-col gap-3">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-full max-w-md" />
          <Skeleton className="h-4 w-2/3" />
          <div className="flex gap-3">
            <Skeleton className="size-12 rounded-full" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        </div>
      </Section>
    </main>
  );
}
