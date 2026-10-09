import { describe, expect, it } from "vitest";
import { normalizeOrderStatusFilter, orderDisplayStatus } from "./order-status";

describe("order status shown to users", () => {
  it("groups old order states into the two visible states", () => {
    for (const status of ["DRAFT", "PENDING", "ACTIVE"])
      expect(orderDisplayStatus(status)).toBe("IN_PROGRESS");
    for (const status of ["COMPLETED", "CLOSED"])
      expect(orderDisplayStatus(status)).toBe("ENDED");
  });

  it("normalizes saved filter links from the old options", () => {
    expect(normalizeOrderStatusFilter("PENDING")).toBe("IN_PROGRESS");
    expect(normalizeOrderStatusFilter("CLOSED")).toBe("ENDED");
  });
});
