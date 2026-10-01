import type { UploadFile } from "antd";
import { api, Row } from "../../shared/api";
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
        url: `/api/v1/materials/${item.id}/download`,
      }));
  return media;
}

export function unitPayload(values: Row, previousExtra: Row = {}): Row {
  const extra = { ...previousExtra, ...values.extra };
  for (const [key, value] of Object.entries(extra)) {
    if (value === undefined || value === "") delete extra[key];
    else if (key === "askingRent") extra[key] = String(value);
  }
  return {
    projectId: values.projectId,
    unitNo: values.unitNo?.trim(),
    unitTypeCode: values.unitTypeCode,
    building: values.extra?.phase || values.building || "",
    floor: values.floor || "",
    roomNo: values.roomNo || "",
    area: String(values.area),
    layout: values.layout || "",
    decoration: values.decoration || "",
    referenceRent: String(values.referenceRent),
    minRent: String(values.minRent),
    maxRent: String(values.maxRent),
    minLeaseMonths: values.minLeaseMonths,
    commissionNote: values.commissionNote || "",
    enabled: values.enabled ?? true,
    extra,
  };
}

export async function syncUnitMedia(
  unitId: string,
  media: UnitMedia,
  uploaded: Map<string, string>,
  removed: Set<string>,
) {
  const selected = new Set(
    unitMediaCategories.flatMap((category) =>
      media[category].map((file) => `${category}:${file.uid}`),
    ),
  );
  for (const [key, id] of uploaded) {
    if (selected.has(key) || removed.has(id)) continue;
    await api.delete(`/materials/${id}`, {
      data: { reason: "编辑单位时移除文件" },
    });
    removed.add(id);
  }
  for (const category of unitMediaCategories) {
    for (const file of media[category]) {
      const key = `${category}:${file.uid}`;
      if (!file.originFileObj || uploaded.has(key)) continue;
      const data = new FormData();
      data.append(
        "payload",
        JSON.stringify({
          unitId,
          category,
          title: file.name,
          visibility: "SHARED",
        }),
      );
      data.append("file", file.originFileObj, file.name);
      const { data: item } = await api.post<Row>("/materials/upload", data);
      uploaded.set(key, item.id);
    }
  }
}
