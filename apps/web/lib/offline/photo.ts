"use client";

import { PHOTO_QUALITY, targetSize } from "@missionops/core";

/**
 * Compression d'un justificatif côté client (ADR-007) : grand côté ramené à
 * 1600 px, JPEG qualité 0,75. Un reçu lisible tient en 200 à 400 Ko au lieu de
 * 4 Mo : c'est ce qui permet l'envoi sur une 3G instable.
 */
export interface CompressedPhoto {
  blob: Blob;
  width: number;
  height: number;
  sha256: string;
}

export async function sha256(blob: Blob): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", await blob.arrayBuffer());
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function compressPhoto(file: File): Promise<CompressedPhoto> {
  if (file.type === "application/pdf") {
    return { blob: file, width: 1, height: 1, sha256: await sha256(file) };
  }
  const bitmap = await createImageBitmap(file);
  const size = targetSize(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("canvas");
  context.drawImage(bitmap, 0, 0, size.width, size.height);
  bitmap.close();
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("toBlob"))),
      "image/jpeg",
      PHOTO_QUALITY,
    ),
  );
  return { blob, width: size.width, height: size.height, sha256: await sha256(blob) };
}
