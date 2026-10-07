import { t } from "../../shared/i18n";
import { Field } from "../../shared/resource-config";
export const financialFields: Field[] = [
  {
    key: "paidOn",
    label: t("付款日期"),
    type: "date",
  },
  {
    key: "fundAccountId",
    label: t("银行账户"),
    source: "fund-accounts",
    type: "select",
  },
  {
    key: "paymentMethod",
    label: t("付款方式"),
    type: "select",
    options: [
      {
        label: t("银行转账"),
        value: "BANK",
      },
      {
        label: t("现金"),
        value: "CASH",
      },
      {
        label: t("支票"),
        value: "CHEQUE",
      },
    ],
  },
  {
    key: "bankReference",
    label: t("银行参考号"),
    required: false,
  },
];
