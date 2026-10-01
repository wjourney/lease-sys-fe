import { cols, Config } from "../../shared/resource-config";
export const InvoiceConfig: Config = {
  title: "发票管理",
  description: "管理已确认收款对应的发票、文件和发送记录",
  fields: [],
  columns: cols({
    invoiceNo: "发票号码",
    amount: "发票金额",
    issuedOn: "开具日期",
    status: "发票状态",
    renderStatus: "文件状态",
    emailStatus: "发送状态",
  }),
};
