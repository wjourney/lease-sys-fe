import { describe, expect, it } from "vitest";
import {
  typeFloor,
  unitTypeDetails,
  unitTypeLabel,
  unitTypeProblems,
} from "./unit-type-display";
import { validateBatchRows } from "./batch-unit-data";
const legacy = {
  code: "ROOM",
  name: "单间",
  minArea: "20",
  maxArea: "40",
  minRent: "1000",
  maxRent: "9000",
};
describe("legacy unit type presentation", () => {
  it("shows missing data without inventing values from historical ranges", () => {
    expect(unitTypeLabel(legacy)).toBe("单间 · 资料待完善");
    expect(unitTypeDetails(legacy)).toContainEqual(["实用面积", "待完善"]);
    expect(JSON.stringify(unitTypeDetails(legacy))).not.toMatch(
      /undefined|NaN|null/,
    );
    expect(unitTypeProblems(legacy)).toEqual([
      "期 / 座",
      "楼层",
      "间隔",
      "实用面积",
      "月租价格",
    ]);
    expect(
      validateBatchRows(
        [
          {
            key: "1",
            unitTypeCode: "ROOM",
            roomNo: "01",
          },
        ],
        [legacy],
      )["1"],
    ).toContain("请先编辑项目完善类型资料");
  });
  it("preserves valid area and a floor suffix only once", () => {
    const type = {
      ...legacy,
      building: "A座",
      floor: "3楼",
      area: "30",
      layout: "一房",
      referenceRent: "1000",
    };
    expect(unitTypeProblems(type)).toEqual([]);
    expect(unitTypeLabel(type)).toBe("单间 · A座 / 3楼");
    expect(unitTypeDetails(type).map(([label]) => label)).not.toContain("楼龄");
    expect(typeFloor(undefined)).toBe("待完善");
  });
  it("does not treat null, blank or invalid numeric fields as complete", () => {
    expect(
      unitTypeProblems({
        ...legacy,
        building: " ",
        floor: null,
        area: "",
        layout: "",
        minRent: "",
        maxRent: "no",
      }),
    ).toContain("价格范围");
    expect(JSON.stringify(unitTypeDetails({ code: "OLD" }))).not.toMatch(
      /undefined|NaN|null/,
    );
  });
});
