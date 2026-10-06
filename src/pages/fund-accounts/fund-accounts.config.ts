import { cols, Config, text } from "../../shared/resource-config";
export const FundAccountConfig: Config = {
  title: "平台账户",
  description: "维护业务收付款账户",
  fields: [
    text("name", "账户名称", true),
    text("bankName", "银行名称", true),
    text("accountIdentifier", "银行账号", true),
    {
      key: "enabled",
      label: "启用",
      type: "switch",
      initial: true,
    },
    text("remark", "备注"),
  ],
  columns: cols({
    name: "账户名称",
    bankName: "银行名称",
    accountIdentifier: "银行账号",
    currency: "币种",
    enabled: "启用",
  }),
};
