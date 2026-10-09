import { syncMaterials } from "../../shared/material-sync";
import type { UploadFile } from "antd";
import { Row } from "../../shared/api";
import type { UnitMedia, UnitMediaCategory } from "./components/UnitMediaField";

export const unitMediaCategories: UnitMediaCategory[] = [
  "PHOTO",
  "VIDEO",
  "PROJECT_FILE",
];
export const emptyUnitMedia = (): UnitMedia => ({
  PHOTO: [],
  VIDEO: [],
  PROJECT_FILE: [],
});

export function mediaFromMaterials(materials: Row[]): UnitMedia {
  const media = emptyUnitMedia();
  for (const category of unitMediaCategories)
    media[category] = materials
      .filter((item) => item.category === category && item.storageKey)
      .map((item): UploadFile => ({
        uid: item.id,
        name: item.originalName || item.title,
        status: "done",
        url: item.previewUrl || `/api/v1/materials/${item.id}/download`,
      }));
  return media;
}

export function unitPayload(values: Row): Row {
  return {
    projectId: values.projectId,
    unitTypeCode: values.unitTypeCode,
    roomNo: values.roomNo?.trim(),
  };
}

export async function syncUnitMedia(
  unitId: string,
  media: UnitMedia,
  uploaded: Map<string, string>,
  removed: Set<string>,
) {
  await syncMaterials({ unitId }, media, uploaded, removed);
}
