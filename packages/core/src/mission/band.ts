import type { Money } from "../money/money";
import type { MissionStatus } from "./state-machine";

/**
 * Bande de mission (B5.4) : l'élément signature, à l'écran et dans les
 * documents. Six étapes de la boucle argent-justificatif, chacune dans un
 * état, et le solde de l'avance. Modèle pur : les rendus (SVG, PDF) le
 * dessinent sans recalculer.
 */
export const BAND_STEPS = [
  "demande",
  "validation",
  "avance",
  "terrain",
  "reconciliation",
  "cloture",
] as const;
export type BandStep = (typeof BAND_STEPS)[number];
export type BandState = "done" | "current" | "upcoming" | "stopped";

export interface BandInput {
  status: MissionStatus;
  hasAdvance: boolean;
  reconciliationStatus: "ouverte" | "soumise" | "validee" | null;
  balance: Money | null;
}

export interface BandModel {
  steps: { step: BandStep; state: BandState }[];
  balance: Money | null;
}

function progress(input: BandInput): { reached: number; stopped: boolean } {
  switch (input.status) {
    case "BROUILLON":
      return { reached: 0, stopped: false };
    case "SOUMISE":
      return { reached: 1, stopped: false };
    case "REJETEE":
      return { reached: 1, stopped: true };
    case "VALIDEE":
      return { reached: input.hasAdvance ? 3 : 2, stopped: false };
    case "EN_COURS":
      return { reached: 3, stopped: false };
    case "TERMINEE":
      return { reached: 4, stopped: false };
    case "CLOTUREE":
      return { reached: 6, stopped: false };
    case "ANNULEE":
      return { reached: input.hasAdvance ? 3 : 1, stopped: true };
  }
}

export function missionBand(input: BandInput): BandModel {
  const { reached, stopped } = progress(input);
  return {
    steps: BAND_STEPS.map((step, index) => ({
      step,
      state:
        index < reached
          ? "done"
          : index === reached
            ? stopped
              ? "stopped"
              : "current"
            : "upcoming",
    })),
    balance: input.balance,
  };
}
