import { customAlphabet } from "nanoid";

// URL-safe, unambiguous alphabet (no 0/O, 1/l/I).
const slugAlpha = customAlphabet("23456789abcdefghjkmnpqrstuvwxyz", 10);
const idAlpha = customAlphabet("23456789ABCDEFGHJKMNPQRSTUVWXYZ", 6);

export function newShareSlug(): string {
  return slugAlpha();
}

/** Human-friendly report id printed on PDFs, e.g. "FF-2026-7A9K2M". */
export function newReportId(): string {
  const yr = new Date().getFullYear();
  return `FF-${yr}-${idAlpha()}`;
}
