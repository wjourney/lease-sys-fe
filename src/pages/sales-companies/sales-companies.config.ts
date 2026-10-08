import { cols, Config, date, text } from "../../shared/resource-config";
export const SalesCompanyConfig: Config = {
  title: "销售公司",
  description: "管理合作公司、服务期限及所属销售人员",
  fields: [
    text("name", "公司中文名称", true),
    text("nameEn", "公司英文名称"),
    text("contactName", "联系人"),
    text("phone", "联系电话"),
    text("email", "电子邮箱"),
    text("address", "公司地址"),
    text("serviceArea", "服务区域"),
    text("registrationNo", "商业登记号码"),
    date("registrationExpiresOn", "登记到期日", false),
    date("serviceStartsOn", "服务开始日期", false),
    date("serviceEndsOn", "服务结束日期", false),
    {
      key: "branches",
      label: "分行配置（编码、名称、启用状态）",
      type: "json",
      span: 2,
    },
    {
      key: "positions",
      label: "职位配置（编码、名称、启用状态）",
      type: "json",
      span: 2,
    },
  ],
  columns: cols({
    name: "销售公司",
    registrationNo: "商业登记号码",
    contactName: "联系人",
    phone: "联系电话",
    email: "邮箱",
  }),
};
