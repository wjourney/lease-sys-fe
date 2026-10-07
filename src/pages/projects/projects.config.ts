import { cols, Config, status, text } from "../../shared/resource-config";
export const ProjectConfig: Config = {
  title: "项目管理",
  description: "集中管理项目、房源及项目资料",
  fields: [
    text("name", "项目中文名称", true),
    text("nameEn", "项目英文名称"),
    text("region", "区域", true),
    text("propertyName", "物业名称"),
    text("address", "详细地址", true),
    text("developer", "发展商"),
    {
      key: "description",
      label: "项目介绍",
      type: "textarea",
      span: 2,
    },
    {
      key: "salesCanViewExactRent",
      label: "允许销售查看具体租金",
      type: "switch",
    },
    status,
  ],
  columns: cols({
    code: "项目编号",
    name: "项目名称",
    region: "区域",
    unitCount: "单位数量",
    availableCount: "可租",
    status: "状态",
  }),
};
