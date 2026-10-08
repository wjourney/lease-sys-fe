import { unitTypeProblems } from "./unit-type-display";
import type { Row } from "../../shared/api";

export type BatchUnitRow = {
  key: string;
  roomNo: string;
  unitTypeCode: string;
  referenceRent: string;
};
export const BATCH_UNIT_LIMIT = 100;
export function parseRoomNumbers(text: string) {
  return text
    .split(/[\n\r,，;；\t]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}
export function generateRoomNumbers(
  prefix: string,
  start: number,
  count: number,
  digits: number,
) {
  if (
    ![start, count, digits].every(Number.isInteger) ||
    start < 0 ||
    count < 1 ||
    count > BATCH_UNIT_LIMIT ||
    digits < 1 ||
    digits > 8 ||
    start + count > 100000000
  )
    return [];
  return Array.from(
    { length: count },
    (_, i) => `${prefix}${String(start + i).padStart(digits, "0")}`,
  );
}
export function validateBatchRows(rows: BatchUnitRow[], types: Row[]) {
  const errors: Record<string, string> = {};
  const seen = new Map<string, number>();
  rows.forEach((row, index) => {
    const type = types.find((t) => t.code === row.unitTypeCode);
    const room = row.roomNo.trim();
    if (!room || room.length > 100) errors[row.key] = "请填写 1–100 字的房号";
    else if (!type) errors[row.key] = "请选择当前项目的单位类型";
    else if (unitTypeProblems(type).length)
      errors[row.key] =
        `请先编辑项目完善类型资料：${unitTypeProblems(type).join("、")}`;
    else if (
      !/^\d{1,12}(\.\d{1,2})?$/.test(row.referenceRent) ||
      Number(row.referenceRent) < Number(type.minRent) ||
      Number(row.referenceRent) > Number(type.maxRent)
    )
      errors[row.key] = "月租须在类型价格范围内，最多两位小数";
    if (type && room) {
      const identity = JSON.stringify([
        type.building,
        String(type.floor).replace(/楼$/, ""),
        room,
      ])
        .normalize("NFKC")
        .toLowerCase();
      const prior = seen.get(identity);
      if (prior !== undefined) errors[row.key] = `与第 ${prior + 1} 行房号重复`;
      else seen.set(identity, index);
    }
  });
  return errors;
}
