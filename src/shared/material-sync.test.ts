import { beforeEach, expect, test, vi } from "vitest";
import type { UploadFile } from "antd";
import { api } from "./api";
import { syncMaterials } from "./material-sync";
vi.mock("./api", () => ({
  api: { post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));
beforeEach(() => vi.clearAllMocks());
const file = (uid: string): UploadFile => ({
  uid,
  name: `${uid}.png`,
  originFileObj: new File([uid], `${uid}.png`) as any,
});
test("a failed second upload can retry with changed selection without duplicates or orphan images", async () => {
  const uploaded = new Map<string, string>();
  const removed = new Set<string>();
  vi.mocked(api.post)
    .mockResolvedValueOnce({ data: { id: "first-id" } })
    .mockRejectedValueOnce(new Error("network failure"));
  await expect(
    syncMaterials(
      { salesCompanyId: "company" },
      { PHOTO: [file("first"), file("second")] },
      uploaded,
      removed,
    ),
  ).rejects.toThrow("network failure");
  expect(api.patch).not.toHaveBeenCalled();
  vi.mocked(api.post).mockResolvedValueOnce({ data: { id: "second-id" } });
  await syncMaterials(
    { salesCompanyId: "company" },
    { PHOTO: [file("second")] },
    uploaded,
    removed,
  );
  expect(api.delete).toHaveBeenCalledWith(
    "/materials/first-id",
    expect.anything(),
  );
  expect(api.patch).toHaveBeenLastCalledWith(
    "/sales-companies/company/images/order",
    { ids: ["second-id"] },
  );
  await syncMaterials(
    { salesCompanyId: "company" },
    { PHOTO: [file("second")] },
    uploaded,
    removed,
  );
  expect(api.post).toHaveBeenCalledTimes(3);
  expect(api.delete).toHaveBeenCalledTimes(1);
});
test("failed ordering retries without reuploading files and preserves the chosen cover", async () => {
  const uploaded = new Map([["PHOTO:old", "old-id"]]);
  const removed = new Set<string>();
  vi.mocked(api.post).mockResolvedValueOnce({ data: { id: "new-id" } });
  vi.mocked(api.patch)
    .mockRejectedValueOnce(new Error("order failure"))
    .mockResolvedValueOnce({ data: {} });
  const files = { PHOTO: [file("new"), { uid: "old", name: "old.png" }] };
  await expect(
    syncMaterials({ projectId: "project" }, files, uploaded, removed),
  ).rejects.toThrow("order failure");
  await syncMaterials({ projectId: "project" }, files, uploaded, removed);
  expect(api.post).toHaveBeenCalledTimes(1);
  expect(api.patch).toHaveBeenLastCalledWith("/projects/project/images/order", {
    ids: ["new-id", "old-id"],
  });
});
