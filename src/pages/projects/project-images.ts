import type { Row } from "../../shared/api";

export function projectImages(materials: Row[]): Row[] {
  return materials
    .filter(
      (item) => ["PHOTO", "LOGO"].includes(item.category) && item.storageKey,
    )
    .sort(
      (a, b) =>
        Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0) ||
        String(a.category).localeCompare(String(b.category)) ||
        String(a.createdAt ?? "").localeCompare(String(b.createdAt ?? "")),
    );
}
