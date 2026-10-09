import type { UnitMedia, UnitMediaCategory } from "./components/UnitMediaField";
import { emptyUnitMedia, unitMediaCategories } from "./unit-data";
import type { BatchUnitRow } from "./batch-unit-data";
import type { UploadFile } from "antd";

export type BatchMediaEntry = { category: UnitMediaCategory; file: UploadFile };
export const batchMediaKey = ({ category, file }: BatchMediaEntry) =>
  `${category}:${file.uid}`;

export function collectBatchMedia(shared: UnitMedia, rows: BatchUnitRow[]) {
  const files = new Map<string, BatchMediaEntry>();
  for (const media of [
    shared,
    ...rows
      .map((row) => row.media)
      .filter((value): value is UnitMedia => !!value),
  ]) {
    for (const category of unitMediaCategories)
      for (const file of media[category]) {
        const entry = { category, file };
        files.set(batchMediaKey(entry), entry);
      }
  }
  return [...files.values()];
}
export function batchMediaIndexes(
  media: UnitMedia,
  entries: BatchMediaEntry[],
) {
  const positions = new Map(
    entries.map((entry, index) => [batchMediaKey(entry), index]),
  );
  return unitMediaCategories.flatMap((category) =>
    media[category].map((file) => positions.get(`${category}:${file.uid}`)!),
  );
}
export function restoreBatchMedia(
  indexes: number[],
  entries: BatchMediaEntry[],
): UnitMedia {
  const media = emptyUnitMedia();
  for (const index of indexes) {
    const entry = entries[index];
    if (entry) media[entry.category].push(entry.file);
  }
  return media;
}
