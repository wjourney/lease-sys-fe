import { cols, Config } from "../../shared/resource-config";
export const InvoiceConfig: Config = {
  title: "发票管理",
  description: "按账单管理发票草稿、出具、PDF 预览及邮件发送",
  fields: [],
  columns: cols({
    invoiceNo: "发票编号",
    projectName: "项目",
    unitNo: "单位",
    payerName: "付款人",
    billNo: "关联账单",
    amount: "发票金额",
    issuedOn: "出具日期",
    dueOn: "到期日",
    status: "发票状态",
    renderStatus: "文件状态",
    emailStatus: "发送状态",
  }),
};
