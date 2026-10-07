import { cols, Config } from "../../shared/resource-config";
export const SettingConfig: Config = {
  title: "公司信息",
  description: "管理网站品牌与展示信息",
  fields: [],
  columns: cols({
    key: "配置项",
    updatedAt: "最近修改",
  }),
};
