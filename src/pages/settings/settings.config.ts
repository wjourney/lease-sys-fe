import { cols, Config } from "../../shared/resource-config";
export const SettingConfig: Config = {
  title: "单位类型配置",
  description: "管理单位类型和展示顺序",
  fields: [],
  columns: cols({
    key: "配置项",
    updatedAt: "最近修改",
  }),
};
