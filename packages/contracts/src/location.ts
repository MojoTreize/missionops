import { ORG_LOCATION_KINDS, isNationalCode } from "@missionops/core";
import { z } from "zod";

import { text } from "./common";

export const nationalCode = z.string().refine(isNationalCode, "unknown_location");

export const orgLocationInput = z.object({
  name: text(1, 120),
  parentCode: nationalCode,
  kind: z.enum(ORG_LOCATION_KINDS),
});

export type OrgLocationInput = z.infer<typeof orgLocationInput>;
