import { describe, expect, it } from "vitest";
import { renewalEndDate } from "./renewal";

describe("续约默认日期", () => {
  it("从原到期日延长一年，不从操作日开始", () => {
    expect(renewalEndDate("2027-10-08")).toBe("2028-10-08");
  });
  it("闰年二月月底不会溢出到三月", () => {
    expect(renewalEndDate("2028-02-29")).toBe("2029-02-28");
  });
});
