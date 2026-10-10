import { describe, expect, it } from "vitest";
import { initialRentAmount } from "./initial-rent";

describe("initial rent paid in full", () => {
  it("uses the complete first monthly cycle", () => {
    expect(initialRentAmount("20000", "2026-10-09", "2027-10-08")).toBe(
      "20000.00",
    );
  });
  it("prorates short leases and rounds half up", () => {
    expect(initialRentAmount("100.01", "2026-04-01", "2026-04-15")).toBe(
      "50.01",
    );
    expect(initialRentAmount("3100", "2026-10-09", "2026-10-18")).toBe(
      "1000.00",
    );
  });
  it("handles month-end anchors and explicit historical opt-outs", () => {
    expect(initialRentAmount("2800", "2026-01-31", "2026-02-13")).toBe(
      "1400.00",
    );
    expect(
      initialRentAmount("2800", "2026-01-31", "2026-02-13", {
        lastPeriodProration: false,
      }),
    ).toBe("2800.00");
  });
  it("matches legacy calendar-month proration", () => {
    expect(
      initialRentAmount("3100", "2026-10-09", "2026-11-08", {
        billingVersion: 1,
      }),
    ).toBe("3126.67");
  });
});
