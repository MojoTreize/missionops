import "server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, normalize } from "node:path";

import type { BlobStore } from "@missionops/services";

/**
 * Stockage des fichiers (justificatifs, documents générés). Pilote local sur
 * disque, dans `STORAGE_DIR` (par défaut `.data/storage`). Un pilote objet
 * compatible S3 (région UE) le remplacera en production sans toucher aux
 * appelants : seule l'interface `BlobStore` est utilisée ailleurs.
 */
class LocalBlobStore implements BlobStore {
  constructor(private readonly root: string) {}

  private path(key: string): string {
    const target = normalize(join(this.root, key));
    if (!target.startsWith(normalize(this.root))) {
      throw new Error("Clé de stockage invalide");
    }
    return target;
  }

  async put(key: string, bytes: Uint8Array): Promise<void> {
    const file = this.path(key);
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, bytes);
  }

  async get(key: string): Promise<Uint8Array | null> {
    try {
      return new Uint8Array(await readFile(this.path(key)));
    } catch {
      return null;
    }
  }
}

let store: BlobStore | undefined;

export function getStore(): BlobStore {
  if (!store) {
    store = new LocalBlobStore(process.env.STORAGE_DIR ?? join(process.cwd(), ".data", "storage"));
  }
  return store;
}
