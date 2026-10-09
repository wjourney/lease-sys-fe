import { describe, expect, it } from "vitest";
import { orderLabel, orderNotice } from "./order-state";
describe("financial closure display", () => {
  it("shows ended tenancy as awaiting settlement while money is outstanding", () => {
    const order = {
      status: "COMPLETED",
      handoverStatus: "DONE",
      settlement: { complete: false, blockers: ["1 笔付款单未付清"] },
    };
    expect(orderLabel(order)).toBe("已结束");
    expect(orderNotice(order)).toContain("1 笔付款单未付清");
  });
  it("shows completion only when server confirms closure conditions", () => {
    const order = {
      status: "COMPLETED",
      handoverStatus: "DONE",
      settlement: { complete: true, blockers: [] },
    };
    expect(orderLabel(order)).toBe("已结束");
    expect(orderNotice(order)).toContain("均已结清");
  });
});
