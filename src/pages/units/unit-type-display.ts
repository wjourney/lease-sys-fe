import { amount, type Row } from "../../shared/api";

export function typeValue(value: unknown, suffix = "") {
  return value == null || String(value).trim() === ""
    ? "待完善"
    : `${value}${suffix}`;
}
export function typeFloor(value: unknown) {
  return value == null || String(value).trim() === ""
    ? "待完善"
    : `${value}${/楼$/.test(String(value)) ? "" : "楼"}`;
}
const hasNumber = (value: unknown) =>
  value != null &&
  String(value).trim() !== "" &&
  Number.isFinite(Number(value));
export function unitTypeProblems(type?: Row): string[] {
  if (!type) return ["单位类型"];
  const missing = (
    [
      ["name", "类型名称"],
      ["building", "期 / 座"],
      ["floor", "楼层"],
      ["layout", "间隔"],
    ] as const
  )
    .filter(([key]) => typeof type[key] !== "string" || !type[key].trim())
    .map(([, label]) => String(label));
  if (!hasNumber(type.area) || Number(type.area) <= 0) missing.push("实用面积");
  if (!Number.isInteger(type.age) || type.age < 0) missing.push("楼龄");
  if (
    !hasNumber(type.minRent) ||
    !hasNumber(type.maxRent) ||
    Number(type.minRent) < 0 ||
    Number(type.maxRent) < Number(type.minRent)
  )
    missing.push("价格范围");
  if (
    !hasNumber(type.referenceRent) ||
    Number(type.referenceRent) < Number(type.minRent) ||
    Number(type.referenceRent) > Number(type.maxRent)
  )
    missing.push("月租价格");
  return missing;
}
export function typePriceRange(type: Row) {
  return [type.minRent, type.maxRent]
    .map((value) => (hasNumber(value) ? amount(value) : "待完善"))
    .join(" – ");
}
export function unitTypeLabel(type: Row) {
  const name = type.name || type.code || "未命名类型";
  if (unitTypeProblems(type).length) return `${name} · 资料待完善`;
  return `${name} · ${type.building} / ${typeFloor(type.floor)}`;
}
export function unitTypeDetails(type: Row) {
  return [
    ["期 / 座", typeValue(type.building)],
    ["楼层", typeFloor(type.floor)],
    ["实用面积", typeValue(type.area, " ㎡")],
    ["间隔", typeValue(type.layout)],
    ["楼龄", typeValue(type.age, " 年")],
    ["价格范围", typePriceRange(type)],
    [
      "月租价格（HKD）",
      hasNumber(type.referenceRent) ? amount(type.referenceRent) : "待完善",
    ],
  ];
}
