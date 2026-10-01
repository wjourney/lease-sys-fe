import { describe, expect, it } from "vitest";
import {
  projectFormValues,
  projectPayload,
  projectUploadsFromMaterials,
} from "./project-data";

describe("project edit data", () => {
  it("restores editable fields and clears optional values without changing other metadata", () => {
    const row = {
      name: "江语城",
      code: "P202609001",
      region: "港岛",
      address: "海湾街 26 号",
      completionDate: "2023-01-01T00:00:00.000Z",
      longitude: "114.20000000",
      extra: { developmentDate: "2020-01-01", customNote: "保留" },
    };
    const values = projectFormValues(row);
    expect(values.completionDate.format("YYYY-MM-DD")).toBe("2023-01-01");
    expect(values.longitude).toBe(114.2);
    const payload = projectPayload(
      {
        ...values,
        completionDate: undefined,
        longitude: undefined,
        developmentDate: undefined,
      },
      row.extra,
    );
    expect(payload.completionDate).toBeNull();
    expect(payload.longitude).toBeNull();
    expect(payload.extra).toEqual({ customNote: "保留" });
    expect(payload).not.toHaveProperty("code");
  });

  it("loads existing project files into the matching upload fields", () => {
    const files = projectUploadsFromMaterials([
      {
        id: "second",
        category: "LOGO",
        storageKey: "stored",
        sortOrder: 1,
        title: "次 Logo",
      },
      {
        id: "first",
        category: "LOGO",
        storageKey: "stored",
        sortOrder: 0,
        title: "主 Logo",
      },
      {
        id: "official",
        category: "OFFICIAL",
        storageKey: "stored",
        originalName: "价单.pdf",
      },
      {
        id: "photo",
        category: "PHOTO",
        storageKey: "stored",
        originalName: "项目外观.jpg",
      },
      {
        id: "video",
        category: "VIDEO",
        storageKey: "stored",
        originalName: "项目介绍.mp4",
      },
      {
        id: "project-file",
        category: "PROJECT_FILE",
        storageKey: "stored",
        originalName: "项目资料.pdf",
      },
      { id: "text-only", category: "GUIDE", title: "无附件说明" },
    ]);
    expect(files.LOGO.map((file) => file.uid)).toEqual(["first", "second"]);
    expect(files.OFFICIAL[0].name).toBe("价单.pdf");
    expect(files.PHOTO[0].name).toBe("项目外观.jpg");
    expect(files.VIDEO[0].name).toBe("项目介绍.mp4");
    expect(files.PROJECT_FILE[0].name).toBe("项目资料.pdf");
    expect(files.GUIDE).toEqual([]);
  });
});
