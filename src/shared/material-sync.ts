import type { UploadFile } from "antd";
import { api, type Row } from "./api";

type Owner =
  { projectId: string } | { unitId: string } | { salesCompanyId: string };

// Keep this ledger across retries: successful uploads/deletions must not repeat.
export async function syncMaterials(
  owner: Owner,
  files: Record<string, UploadFile[]>,
  uploaded: Map<string, string>,
  removed: Set<string>,
  onProgress?: (completed: number, total: number) => void,
) {
  const entries = Object.entries(files).flatMap(([category, items]) =>
    items.map((file, index) => ({
      category,
      file,
      index,
      key: `${category}:${file.uid}`,
    })),
  );
  const selected = new Set(entries.map(({ key }) => key));
  for (const [key, id] of uploaded) {
    if (selected.has(key) || removed.has(id)) continue;
    await api.delete(`/materials/${id}`, {
      data: { reason: "编辑时移除文件" },
    });
    removed.add(id);
  }
  const total = entries.filter(({ file }) => file.originFileObj).length;
  let completed = 0;
  onProgress?.(completed, total);
  for (const { category, file, index, key } of entries) {
    if (!file.originFileObj) continue;
    if (!uploaded.has(key) || removed.has(uploaded.get(key)!)) {
      const payload = new FormData();
      payload.append(
        "payload",
        JSON.stringify({
          ...owner,
          category,
          title: file.name,
          visibility: "SHARED",
          ...(category === "PHOTO" ? { sortOrder: index } : {}),
        }),
      );
      payload.append("file", file.originFileObj, file.name);
      const { data } = await api.post<Row>("/materials/upload", payload);
      uploaded.set(key, data.id);
    }
    onProgress?.(++completed, total);
  }
  const resource =
    "projectId" in owner
      ? "projects"
      : "salesCompanyId" in owner
        ? "sales-companies"
        : null;
  if (resource) {
    const id =
      "projectId" in owner
        ? owner.projectId
        : (owner as { salesCompanyId: string }).salesCompanyId;
    const ids = (files.PHOTO ?? []).map((file) =>
      uploaded.get(`PHOTO:${file.uid}`),
    );
    if (ids.some((value) => !value)) throw new Error("图片上传未完成");
    await api.patch(`/${resource}/${id}/images/order`, { ids });
  }
}
