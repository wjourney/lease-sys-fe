import { cols, Config } from "../../shared/resource-config";
export const MaterialConfig: Config = {
  title: "文件与资料",
  description: "项目、单位与订单资料统一管理，按业务归属查看",
  fields: [],
  columns: cols({
    title: "资料名称",
    category: "分类",
    projectName: "所属项目",
    orderNo: "关联订单",
    versionNo: "版本",
    mimeType: "文件类型",
    createdAt: "上传时间",
    status: "状态",
  }),
};
