import { describe, expect, it } from "vitest";
import { dateTimeText } from "./date-time";

describe("dateTimeText", () => {
  it("converts UTC operation times to the requested local time zone", () => {
    expect(dateTimeText("2026-09-30T08:07:22.000Z", "Asia/Shanghai")).toBe(
      "2026-09-30 16:07:22",
    );
  });

  it("does not display an invalid timestamp as a date", () => {
    expect(dateTimeText(undefined)).toBe("—");
    expect(dateTimeText("invalid")).toBe("—");
  });
});
