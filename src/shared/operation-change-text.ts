import { formatMoney } from "./money-format";
import {
  feeLabels,
  roleLabels,
  statusLabels,
  type Field,
} from "./resource-config";

export type HistoryField = Pick<
  Field,
  "key" | "label" | "type" | "options" | "source"
>;
export type HistoryChange = {
  key: string;
  label: string;
  before: unknown;
  after: unknown;
};

const fallbackFields: Record<string, HistoryField> = {
  status: { key: "status", label: "状态", type: "select" },
  enabled: { key: "enabled", label: "启用状态", type: "switch" },
  actualTerminationOn: {
    key: "actualTerminationOn",
    label: "实际结束日期",
    type: "date",
  },
  depositDeductionAmount: {
    key: "depositDeductionAmount",
    label: "押金扣款",
    type: "money",
  },
  depositDeductionReason: { key: "depositDeductionReason", label: "扣款原因" },
  depositOffsetAmount: {
    key: "depositOffsetAmount",
    label: "押金抵扣",
    type: "money",
  },
  paidAmount: { key: "paidAmount", label: "已付金额", type: "money" },
  adjustmentAmount: {
    key: "adjustmentAmount",
    label: "应收调整",
    type: "money",
  },
  receivedOn: { key: "receivedOn", label: "收款日期", type: "date" },
  paidOn: { key: "paidOn", label: "付款日期", type: "date" },
  bankReference: { key: "bankReference", label: "银行参考号" },
  remark: { key: "remark", label: "备注" },
  roomNo: { key: "roomNo", label: "房号" },
  unitTypeCode: { key: "unitTypeCode", label: "单位类型" },
  floor: { key: "floor", label: "楼层" },
  area: { key: "area", label: "实用面积" },
  referenceRent: { key: "referenceRent", label: "参考月租", type: "money" },
  category: { key: "category", label: "资料分类" },
  title: { key: "title", label: "资料名称" },
  versionNo: { key: "versionNo", label: "版本号", type: "number" },
  isCurrent: { key: "isCurrent", label: "当前版本", type: "switch" },
  logoUrl: { key: "logoUrl", label: "公司 Logo" },
};

const extraLabels: Record<string, string> = {
  usage: "用途",
  salesStatus: "销售状态",
  buildingStatus: "现况",
  developmentDate: "开发日期",
  areaRange: "面积范围",
  unitInterval: "单位间隔",
  managementFee: "管理费",
  lawyerFirm: "律师事务所",
  nearbySchools: "附近学校",
  website: "网站",
  salesOffice: "售楼处",
};

function sameValue(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (!left || !right || typeof left !== "object" || typeof right !== "object")
    return false;
  if (Array.isArray(left) !== Array.isArray(right)) return false;
  const a = left as Record<string, unknown>;
  const b = right as Record<string, unknown>;
  const keys = Object.keys(a);
  return (
    keys.length === Object.keys(b).length &&
    keys.every((key) => key in b && sameValue(a[key], b[key]))
  );
}

function isInternalValue(value: unknown) {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value)
  );
}

function valueText(value: unknown, field: HistoryField): string {
  if (value === null || value === undefined || value === "") return "未填写";
  if (typeof value === "boolean") return value ? "是" : "否";
  if (typeof value === "object" || isInternalValue(value)) return "";
  const raw = String(value);
  const option = field.options?.find((item) => item.value === raw);
  if (option) return option.label;
  if (field.key === "role") return roleLabels[raw] || "";
  if (field.key === "feeType") return feeLabels[raw] || "";
  if (field.key === "status") return statusLabels[raw] || "";
  if (field.type === "date" || /(?:On|At|Date)$/.test(field.key)) {
    return /^\d{4}-\d{2}-\d{2}/.test(raw) ? raw.slice(0, 10) : "";
  }
  if (field.type === "money" || /Amount$/.test(field.key)) {
    return Number.isFinite(Number(value)) ? formatMoney(raw, "HKD") : "";
  }
  // Untranslated machine enum values are not useful in a customer-facing log.
  if (/^[A-Z][A-Z\d_]+$/.test(raw)) return "";
  return raw;
}

export function changedEntries(
  changes: Record<string, unknown> | undefined,
  fields: HistoryField[],
): HistoryChange[] {
  return Object.entries(changes || {}).flatMap(([key, change]) => {
    if (!change || typeof change !== "object") return [];
    const { before, after } = change as { before?: unknown; after?: unknown };
    if (sameValue(before, after)) return [];
    if (
      key === "extra" &&
      before &&
      after &&
      typeof before === "object" &&
      typeof after === "object" &&
      !Array.isArray(before) &&
      !Array.isArray(after)
    ) {
      const previous = before as Record<string, unknown>;
      const next = after as Record<string, unknown>;
      return [...new Set([...Object.keys(previous), ...Object.keys(next)])]
        .filter(
          (child) =>
            extraLabels[child] && !sameValue(previous[child], next[child]),
        )
        .map((child) => ({
          key: `extra.${child}`,
          label: extraLabels[child],
          before: previous[child],
          after: next[child],
        }));
    }
    const field =
      fields.find((item) => item.key === key) || fallbackFields[key];
    if (!field || key === "password" || key === "passwordHash") return [];
    return [{ key, label: field.label, before, after }];
  });
}

export function operationChangeTexts(
  changes: Record<string, unknown> | undefined,
  fields: HistoryField[],
): string[] {
  return changedEntries(changes, fields).flatMap(
    ({ key, label, before, after }) => {
      const field = fields.find((item) => item.key === key) ||
        fallbackFields[key] || { key, label };
      if (
        key.endsWith("Id") ||
        field.source ||
        isInternalValue(before) ||
        isInternalValue(after)
      ) {
        return [`调整了${label}`];
      }
      if (
        (typeof before === "object" && before !== null) ||
        (typeof after === "object" && after !== null)
      ) {
        return [`更新了${label}`];
      }
      const previous = valueText(before, field);
      const next = valueText(after, field);
      if (!previous || !next) return [`调整了${label}`];
      if (previous === "未填写") return [`设置${label}为${next}`];
      if (next === "未填写") return [`清除了${label}`];
      return [`${label}由${previous}改为${next}`];
    },
  );
}
