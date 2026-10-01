import {
  cols,
  Config,
  date,
  money,
  opts,
  source,
  text,
} from "../../shared/resource-config";
export const ExpenseConfig: Config = {
  title: "支出管理",
  description: "记录应付费用、实际付款及付款凭证",
  fields: [
    source("orderId", "关联订单（可选）", "orders", false),
    source("projectId", "关联项目（可选）", "projects", false),
    {
      key: "feeType",
      label: "支出类型",
      type: "select",
      options: opts({
        MAINTENANCE: "维修费用",
        MANAGEMENT: "管理费用",
        OTHER: "其他费用",
      }),
      required: true,
    },
    text("payeeName", "收款方", true),
    money("amount", "应付金额"),
    date("dueOn", "到期日期"),
    {
      key: "remark",
      label: "说明",
      type: "textarea",
      span: 2,
    },
  ],
  columns: cols({
    expenseNo: "支出编号",
    payeeName: "收款方",
    feeType: "支出类型",
    orderNo: "关联订单",
    amount: "应付金额",
    paidAmount: "实付金额",
    dueOn: "到期日期",
    status: "付款状态",
  }),
};
