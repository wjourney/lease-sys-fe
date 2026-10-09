import type { UploadFile } from "antd";
import dayjs from "dayjs";
import { Row } from "../../shared/api";
import type {
  ProjectUploadCategory,
  ProjectUploads,
} from "./components/ProjectUploadField";
import { projectImages } from "./project-images";

const extraKeys = [
  "salesStatus",
  "buildingStatus",
  "usage",
  "areaRange",
  "unitInterval",
  "managementFee",
  "lawyerFirm",
  "nearbySchools",
  "website",
  "salesOffice",
  "floorCount",
  "completionYear",
  "ownership",
  "parking",
  "mtrStation",
] as const;

export const projectUploadCategories: ProjectUploadCategory[] = [
  "PHOTO",
  "VIDEO",
  "PROJECT_FILE",
];

export const emptyProjectUploads = (): ProjectUploads => ({
  PHOTO: [],
  VIDEO: [],
  PROJECT_FILE: [],
});

export function projectFormValues(row: Row): Row {
  const extra = row.extra && typeof row.extra === "object" ? row.extra : {};
  return {
    ...extra,
    typeConfigs: row.typeConfigs ?? [],
    name: row.name,
    nameEn: row.nameEn,
    region: row.region,
    propertyName: row.propertyName,
    developer: row.developer,
    address: row.address,
    floorCount: extra.floorCount ?? undefined,
    completionYear:
      extra.completionYear ??
      (row.completionDate ? dayjs(row.completionDate).year() : undefined),
    ownership: extra.ownership ?? undefined,
    parking: extra.parking ?? undefined,
    mtrStation: extra.mtrStation ?? undefined,
    longitude: row.longitude == null ? undefined : Number(row.longitude),
    latitude: row.latitude == null ? undefined : Number(row.latitude),
    landLeaseEndDate: extra.landLeaseEndDate
      ? dayjs(extra.landLeaseEndDate)
      : undefined,
    description: row.description,
    salesCanViewExactRent: row.salesCanViewExactRent,
    status: row.status,
  };
}

export function projectUploadsFromMaterials(materials: Row[]): ProjectUploads {
  const uploads = emptyProjectUploads();
  for (const category of projectUploadCategories) {
    const rows =
      category === "PHOTO"
        ? projectImages(materials)
        : materials
            .filter((row) => row.category === category && row.storageKey)
            .sort((a, b) =>
              String(b.createdAt).localeCompare(String(a.createdAt)),
            );
    uploads[category] = rows.map((row): UploadFile => ({
      uid: row.id,
      name: row.originalName || row.title,
      status: "done",
      url: row.previewUrl || `/api/v1/materials/${row.id}/download`,
    }));
  }
  return uploads;
}

export function projectPayload(values: Row, currentExtra: Row = {}): Row {
  const extra: Row = { ...currentExtra };
  for (const key of extraKeys) {
    if (values[key] === undefined) continue;
    if (values[key] === "") delete extra[key];
    else extra[key] = values[key];
  }
  delete extra.developmentDate;
  if (values.landLeaseEndDate)
    extra.landLeaseEndDate = values.landLeaseEndDate.format("YYYY-MM-DD");
  else if (Object.hasOwn(values, "landLeaseEndDate"))
    delete extra.landLeaseEndDate;
  return {
    name: values.name,
    nameEn: values.nameEn || "",
    region: values.region,
    propertyName: values.propertyName || "",
    developer: values.developer || "",
    address: values.address,
    longitude: values.longitude ?? null,
    latitude: values.latitude ?? null,
    typeConfigs: (values.typeConfigs ?? []).map((item: Row) => ({
      code: item.code,
      name: item.name?.trim(),
      building: item.building?.trim(),
      floor: item.floor?.trim(),
      layout: item.layout?.trim(),
      ...Object.fromEntries(
        ["area", "minRent", "maxRent", "referenceRent"].map((key) => [
          key,
          item[key] == null ? undefined : String(item[key]),
        ]),
      ),
    })),
    description: values.description || "",
    salesCanViewExactRent: !!values.salesCanViewExactRent,
    extra,
    ...(values.status ? { status: values.status } : {}),
  };
}
