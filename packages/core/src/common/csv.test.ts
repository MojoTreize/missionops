import { describe, expect, it } from "vitest";

import { parseCsv } from "./index";

describe("parseCsv", () => {
  it("lit un CSV Excel français (point-virgule, BOM, CRLF)", () => {
    const table = parseCsv(
      "\uFEFFE-mail;Rôle\r\nawa@crg.gn;manager\r\nsekou@crg.gn;collaborateur\r\n",
    );
    expect(table.headers).toEqual(["e_mail", "role"]);
    expect(table.rows).toEqual([
      { e_mail: "awa@crg.gn", role: "manager" },
      { e_mail: "sekou@crg.gn", role: "collaborateur" },
    ]);
  });

  it("gère les virgules, guillemets et lignes vides", () => {
    const table = parseCsv('name,parent_code\n"Entrepôt ""Nord"", Kindia",GN-KD\n\n,\nBase,GN-NZ');
    expect(table.rows).toEqual([
      { name: 'Entrepôt "Nord", Kindia', parent_code: "GN-KD" },
      { name: "Base", parent_code: "GN-NZ" },
    ]);
  });

  it("borne le nombre de lignes", () => {
    const body = Array.from({ length: 5 }, (_, i) => `a${i}`).join("\n");
    expect(parseCsv(`x\n${body}`, 3).rows).toHaveLength(3);
    expect(parseCsv("").rows).toEqual([]);
  });
});
