import type { BandModel, BandState } from "@missionops/core";

/**
 * Bande de mission (B5.4) — géométrie unique, deux rendus : SVG (écran) et
 * primitives PDF (documents). Les coordonnées sont calculées une seule fois ;
 * chaque rendu ne fait que les dessiner.
 */
export interface BandShape {
  width: number;
  height: number;
  line: { x1: number; x2: number; y: number; doneUntil: number };
  nodes: { x: number; y: number; r: number; state: BandState; label: string }[];
  balance: { x: number; y: number; text: string } | null;
}

export const BAND_COLORS: Record<BandState | "line" | "ink" | "muted", string> = {
  done: "#1f5c4a",
  current: "#9e521f",
  upcoming: "#d9d6cc",
  stopped: "#b3261e",
  line: "#d9d6cc",
  ink: "#1c1f1c",
  muted: "#6b706b",
};

export function bandShape(
  model: BandModel,
  labels: string[],
  balanceText: string | null,
  width = 520,
): BandShape {
  const height = balanceText ? 74 : 56;
  const padding = 28;
  const step = (width - 2 * padding) / (model.steps.length - 1);
  const nodes = model.steps.map((s, i) => ({
    x: padding + i * step,
    y: 18,
    r: s.state === "current" || s.state === "stopped" ? 8 : 6,
    state: s.state,
    label: labels[i] ?? s.step,
  }));
  const lastDone = model.steps.map((s) => s.state).lastIndexOf("done");
  return {
    width,
    height,
    line: {
      x1: padding,
      x2: width - padding,
      y: 18,
      doneUntil:
        lastDone < 0 ? padding : padding + Math.min(lastDone + 1, model.steps.length - 1) * step,
    },
    nodes,
    balance: balanceText ? { x: width / 2, y: 68, text: balanceText } : null,
  };
}

function escape(text: string): string {
  return text.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}

/** Rendu SVG autonome (aucun script, texte échappé), pour l'interface web. */
export function bandToSvg(shape: BandShape, title: string): string {
  const c = BAND_COLORS;
  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${shape.width} ${shape.height}" role="img" aria-label="${escape(title)}" width="100%">`,
    `<title>${escape(title)}</title>`,
    `<line x1="${shape.line.x1}" y1="${shape.line.y}" x2="${shape.line.x2}" y2="${shape.line.y}" stroke="${c.line}" stroke-width="2"/>`,
    `<line x1="${shape.line.x1}" y1="${shape.line.y}" x2="${shape.line.doneUntil}" y2="${shape.line.y}" stroke="${c.done}" stroke-width="2"/>`,
    ...shape.nodes.map((n) =>
      [
        `<circle cx="${n.x}" cy="${n.y}" r="${n.r}" fill="${n.state === "upcoming" ? "#ffffff" : c[n.state]}" stroke="${c[n.state]}" stroke-width="2"/>`,
        n.state === "done"
          ? `<path d="M${n.x - 3} ${n.y} l2 2 l4 -4" fill="none" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`
          : "",
        `<text x="${n.x}" y="${n.y + 24}" text-anchor="middle" font-family="sans-serif" font-size="10" fill="${n.state === "upcoming" ? c.muted : c.ink}" font-weight="${n.state === "current" ? 700 : 400}">${escape(n.label)}</text>`,
      ].join(""),
    ),
    shape.balance
      ? `<text x="${shape.balance.x}" y="${shape.balance.y}" text-anchor="middle" font-family="sans-serif" font-size="11" font-weight="700" fill="${c.current}">${escape(shape.balance.text)}</text>`
      : "",
    "</svg>",
  ];
  return parts.join("");
}
