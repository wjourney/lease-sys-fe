export type Field = {
  key: string;
  label: string;
  type?:
    | "text"
    | "number"
    | "money"
    | "date"
    | "select"
    | "textarea"
    | "switch"
    | "password"
    | "json";
  required?: boolean;
  readOnly?: boolean;
  options?: {
    label: string;
    value: string;
  }[];
  source?: string;
  initial?: any;
  createOnly?: boolean;
  span?: number;
};
export type Config = {
  title: string;
  description: string;
  fields: Field[];
  columns: {
    key: string;
    label: string;
    type?: string;
  }[];
};
export const opts = (values: Record<string, string>) =>
  Object.entries(values).map(([value, label]) => ({
    value,
    label,
  }));
export const roleLabels: Record<string, string> = {
  SUPER_ADMIN: "超级管理员",
  OPERATIONS: "内部运营",
  FINANCE: "内部财务",
  SALES_COMPANY_ADMIN: "销售公司管理员",
  SALES: "销售员工",
};
export const statusLabels: Record<string, string> = {
  IN_PROGRESS: "进行中",
  ENDED: "已结束",
  ACTIVE: "启用",
  DISABLED: "停用",
  DRAFT: "待完善",
  PENDING: "待确认",
  OPEN: "待收款",
  PARTIAL: "部分完成",
  PAID: "已完成",
  UNPAID: "待付款",
  CONFIRMED: "已确认",
  REJECTED: "已驳回",
  WITHDRAWN: "已撤回",
  REVERSED: "已撤销",
  SETTLED: "已完结",
  SETTLING: "待结清",
  HANDOVER_PENDING: "待交还",
  VOID: "已作废",
  COMPLETED: "已完成",
  CLOSED: "已关闭",
  AVAILABLE: "可租",
  LOCKED: "已租",
  OCCUPIED: "已租",
  RELEASED: "已释放",
  UNSET: "待填写",
  READY: "已生成",
  FAILED: "失败",
  PROCESSING: "生成中",
  IDLE: "未发送",
  SENT: "已发送",
  SENDING: "发送中",
  UNKNOWN: "待核验",
  DONE: "已交还",
};
export const feeLabels: Record<string, string> = {
  RENT: "租金",
  DEPOSIT: "押金",
  OTHER: "其他",
  MAINTENANCE: "维修费用",
  MANAGEMENT: "管理费用",
  COMMISSION: "佣金",
  DEPOSIT_REFUND: "押金退款",
  RENT_REFUND: "租金退款",
};
export const status: Field = {
  key: "status",
  label: "状态",
  type: "select",
  options: opts({
    ACTIVE: "启用",
    DISABLED: "停用",
  }),
  initial: "ACTIVE",
};
export const money = (key: string, label: string, required = true): Field => ({
  key,
  label,
  type: "money",
  required,
});
export const source = (
  key: string,
  label: string,
  resource: string,
  required = true,
): Field => ({
  key,
  label,
  type: "select",
  source: resource,
  required,
});
export const date = (key: string, label: string, required = true): Field => ({
  key,
  label,
  type: "date",
  required,
});
export const text = (key: string, label: string, required = false): Field => ({
  key,
  label,
  required,
});
export const cols = (values: Record<string, string>) =>
  Object.entries(values).map(([key, label]) => ({
    key,
    label,
  }));
