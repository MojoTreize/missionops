import type { MissionStatus } from "@missionops/core";

import { Badge, type BadgeProps } from "@/components/ui/badge";
import type { Translator } from "@/lib/i18n/translate";

const VARIANTS: Record<MissionStatus, BadgeProps["variant"]> = {
  BROUILLON: "muted",
  SOUMISE: "warning",
  VALIDEE: "neutral",
  EN_COURS: "ledger",
  TERMINEE: "outline",
  CLOTUREE: "success",
  REJETEE: "danger",
  ANNULEE: "muted",
};

export function StatusBadge({ status, t }: { status: MissionStatus; t: Translator }) {
  return <Badge variant={VARIANTS[status]}>{t(`missionStatus.${status}`)}</Badge>;
}
