import { describe, expect, it } from "vitest";
import { orderLabel } from "./order-state";
describe("order detail lifecycle label", () => {
  it("keeps ended orders ended while refunds remain outstanding", () => {
    expect(
      orderLabel({
        status: "COMPLETED",
        settlement: { complete: false, blockers: ["退款未付清"] },
      }),
    ).toBe("已结束");
  });
  it("uses the same simple status for legacy in-progress orders", () => {
    for (const status of ["DRAFT", "PENDING", "ACTIVE"])
      expect(orderLabel({ status })).toBe("进行中");
    expect(orderLabel({ status: "CLOSED" })).toBe("已结束");
  });
});
