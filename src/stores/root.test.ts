import { beforeEach, expect, it, vi } from "vitest";
import { api } from "../shared/api";
import { ListStore } from "./root";
vi.mock("../shared/api", () => ({
  api: { get: vi.fn(), post: vi.fn() },
  clearLookupCache: vi.fn(),
}));
const response = (id: string) => ({
  data: { items: [{ id }], total: 1, page: 1, pageSize: 20 },
});
beforeEach(() => vi.resetAllMocks());
it("deduplicates requests and reuses nonfinancial cache", async () => {
  vi.mocked(api.get).mockResolvedValue(response("a"));
  const s = new ListStore();
  await Promise.all([
    s.load("projects", {}, 0, "u"),
    s.load("projects", {}, 0, "u"),
  ]);
  await s.load("projects", {}, 0, "u");
  expect(api.get).toHaveBeenCalledTimes(1);
  expect(s.items[0].id).toBe("a");
});
it("separates cache by signed-in identity and mutation revision", async () => {
  vi.mocked(api.get).mockResolvedValue(response("a"));
  const s = new ListStore();
  await s.load("orders", {}, 0, "u");
  await s.load("orders", {}, 0, "v");
  await s.load("orders", {}, 1, "v");
  expect(api.get).toHaveBeenCalledTimes(3);
});
it("never serves a financial page from cache", async () => {
  vi.mocked(api.get).mockResolvedValue(response("a"));
  const s = new ListStore();
  await s.load("incomes", {}, 0, "u");
  await s.load("incomes", {}, 0, "u");
  expect(api.get).toHaveBeenCalledTimes(2);
});
it("a late older response cannot overwrite a newer search result", async () => {
  let finish: (v: any) => void = () => {};
  vi.mocked(api.get)
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }) as any,
    )
    .mockResolvedValueOnce(response("new"));
  const s = new ListStore();
  const old = s.load("projects", { q: "old" }, 0, "u");
  await s.load("projects", { q: "new" }, 0, "u");
  finish(response("old"));
  await old;
  expect(s.items[0].id).toBe("new");
  expect(s.loading).toBe(false);
});
