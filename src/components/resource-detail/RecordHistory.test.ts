import { describe, expect, it } from "vitest";
import { changedEntries } from "./RecordHistory";

describe("record history changes", () => {
  it("omits unchanged fields and shows only changed project extra fields", () => {
    expect(
      changedEntries(
        {
          extra: {
            before: { usage: "住宅", salesStatus: "现售" },
            after: { usage: "住宅", salesStatus: "待售" },
          },
          description: { before: "旧介绍", after: "新介绍" },
          revision: { before: 1, after: 2 },
        },
        [{ key: "description", label: "项目介绍" }],
      ),
    ).toEqual([
      {
        key: "extra.salesStatus",
        label: "销售状态",
        before: "现售",
        after: "待售",
      },
      {
        key: "description",
        label: "项目介绍",
        before: "旧介绍",
        after: "新介绍",
      },
    ]);
  });

  it("ignores an unchanged extra object even when its key order differs", () => {
    expect(
      changedEntries(
        {
          extra: {
            before: { usage: "住宅", salesStatus: "现售" },
            after: { salesStatus: "现售", usage: "住宅" },
          },
        },
        [],
      ),
    ).toEqual([]);
  });
});
