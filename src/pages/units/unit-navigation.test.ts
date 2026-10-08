import { describe, expect, it } from "vitest";
import {
  unitDetailPath,
  unitEditorReturnTo,
  unitListReturnTo,
} from "./unit-navigation";

describe("unit navigation", () => {
  it("returns to the same project's unit tab with filters intact", () => {
    expect(
      unitListReturnTo(
        "project-a",
        "/projects/project-a?page=2&status=OCCUPIED",
      ),
    ).toBe("/projects/project-a?page=2&status=OCCUPIED&tab=units");
  });

  it("returns from editing to detail, but ignores unrelated paths", () => {
    const detail = unitDetailPath("project-a", "unit-a");
    expect(unitEditorReturnTo("project-a", "unit-a", detail)).toBe(detail);
    expect(
      unitEditorReturnTo(
        "project-a",
        "unit-a",
        "/projects/project-b?tab=units",
      ),
    ).toBe("/projects/project-a?tab=units");
    expect(
      unitListReturnTo("project-a", "//another.site/projects/project-a"),
    ).toBe("/projects/project-a?tab=units");
  });
});
