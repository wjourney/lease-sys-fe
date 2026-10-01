import {
  cols,
  Config,
  date,
  money,
  opts,
  source,
} from "../../shared/resource-config";
export const CommissionConfig: Config = {
  title: "佣金管理",
  description: "按订单与结算期间管理公司及销售人员佣金",
  fields: [
    source("orderId", "关联订单", "orders"),
    {
      key: "mode",
      label: "结算方式",
      type: "select",
      options: opts({
        MONTHLY: "按月",
        YEARLY: "按年",
      }),
      initial: "MONTHLY",
      required: true,
    },
    date("periodStart", "结算开始"),
    date("periodEnd", "结算结束"),
    date("dueOn", "应付日期"),
    money("amount", "佣金金额（可待填写）", false),
    {
      key: "remark",
      label: "备注",
      type: "textarea",
      span: 2,
    },
  ],
  columns: cols({
    commissionNo: "佣金编号",
    orderNo: "关联订单",
    companyName: "销售公司",
    salesName: "销售人员",
    periodStart: "结算期间",
    amount: "应付佣金",
    paidAmount: "已付金额",
    remainingAmount: "剩余佣金",
    status: "状态",
  }),
};
