import {
  cols,
  Config,
  date,
  money,
  opts,
  source,
  text,
} from "../../shared/resource-config";
export const IncomeConfig: Config = {
  title: "账单管理",
  description: "查看应收账单，登记实际收款并进行财务核对",
  fields: [
    source("orderId", "关联订单（可选）", "orders", false),
    source("projectId", "关联项目（可选）", "projects", false),
    {
      key: "feeType",
      label: "收入类型",
      type: "select",
      options: opts({
        RENT: "租金",
        DEPOSIT: "押金",
        OTHER: "其他收入",
      }),
      required: true,
    },
    text("payerName", "付款方", true),
    text("payerEmail", "付款方邮箱"),
    money("amount", "应收金额"),
    date("dueOn", "到期日期"),
    {
      key: "recurrenceRule",
      label: "周期规则",
      type: "select",
      options: opts({
        ONCE: "一次性",
        MONTHLY: "每月",
      }),
      initial: "ONCE",
    },
    {
      key: "remark",
      label: "说明",
      type: "textarea",
      span: 2,
    },
  ],
  columns: cols({
    recordNo: "账单编号",
    payerName: "付款方",
    orderNo: "关联订单",
    feeType: "类型",
    total: "应收金额",
    confirmed: "已收金额",
    remaining: "剩余金额",
    dueOn: "到期日期",
    status: "收款状态",
  }),
};
