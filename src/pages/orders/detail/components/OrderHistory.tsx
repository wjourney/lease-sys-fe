import { OperationActor } from "../../../../components/resource-detail/OperationActor";
import { OrderTable } from "./OrderTable";
import { useRecordDetail } from "../../../../components/resource-detail/DetailContext";
import { amount, Row } from "../../../../shared/api";
import { dateTimeText } from "../../../../shared/date-time";
import { t } from "../../../../shared/i18n";
import { OrderConfig } from "../../orders.config";
const names: Record<string, string> = {
  status: "状态",
  amount: "金额",
  adjustmentAmount: "应收调整",
  depositOffsetAmount: "押金抵扣",
  paidAmount: "已付金额",
  receivedOn: "收款日期",
  paidOn: "付款日期",
  actualTerminationOn: "实际结束日期",
  depositDeductionAmount: "扣款合计",
  depositDeductionReason: "结算说明",
  depositSettledAt: "押金结算时间",
  bankReference: "交易流水",
  remark: "说明",
};
const states: Record<string, string> = {
  PENDING: "待确认",
  ACTIVE: "进行中",
  COMPLETED: "已结束",
  CLOSED: "已关闭",
  CONFIRMED: "已确认",
  REJECTED: "已驳回",
  VOID: "已作废",
  OPEN: "待收款",
  PAID: "已完成",
  PARTIAL: "部分完成",
  UNPAID: "待付款",
  DONE: "已交还",
  PERSON: "个人",
  COMPANY: "公司",
};
function text(value: unknown, key: string) {
  if (value == null || value === "") return "未填写";
  if (typeof value === "boolean") return value ? "是" : "否";
  if (/amount/i.test(key) || key === "monthlyRent") return amount(value);
  return states[String(value)] ?? String(value);
}
function operationText(log: Row) {
  const subject = String(log.subject || "");
  const resource = subject.startsWith("CM")
    ? "佣金"
    : subject.startsWith("B")
      ? "账单"
      : subject.startsWith("E")
        ? "支出"
        : "订单";
  const action =
    { CREATE: "创建", UPDATE: "修改", DELETE: "删除" }[String(log.action)] ||
    "更新";
  return `${log.reason || `${action}${resource}`}${subject ? ` · ${subject}` : ""}`;
}
export function OrderHistory() {
  const { logs } = useRecordDetail();
  const labels = {
    ...Object.fromEntries(
      OrderConfig.fields
        .filter((f) => !f.key.endsWith("Id"))
        .map((f) => [f.key, f.label]),
    ),
    ...names,
  };
  const entries = logs
    .map((log) => ({
      log,
      changes: Object.entries(
        log.action === "CREATE" ? {} : (log.changes ?? {}),
      )
        .filter(
          ([key, c]) =>
            labels[key] &&
            (c as Row).before !== (c as Row).after &&
            ((c as Row).after == null ||
              typeof (c as Row).after !== "object") &&
            ((c as Row).before == null ||
              typeof (c as Row).before !== "object"),
        )
        .map(([key, c]) => ({
          key,
          before: (c as Row).before,
          after: (c as Row).after,
        })),
    }))
    .sort((a, b) =>
      String(b.log.operatedAt ?? "").localeCompare(
        String(a.log.operatedAt ?? ""),
      ),
    );
  return (
    <OrderTable
      title="操作记录"
      rows={entries.map(({ log, changes }, index) => ({
        ...log,
        id: log.eventId || `${log.operatedAt}:${index}`,
        displayChanges: changes,
      }))}
      actions={
        <span className="text-sm text-[#78869a]">
          {t(`共 ${entries.length} 条`)}
        </span>
      }
      columns={[
        {
          title: t("时间"),
          dataIndex: "operatedAt",
          width: 180,
          render: (value) => dateTimeText(value),
        },
        {
          title: t("操作内容"),
          render: (_, log) => (
            <div className="max-w-[700px] whitespace-normal leading-6">
              <div>{t(operationText(log))}</div>
              <div className="text-xs text-[#78869a]">
                {log.displayChanges.map((change: Row) => (
                  <div key={change.key}>
                    {t(labels[change.key])}：
                    {t(text(change.before, change.key))} →{" "}
                    {t(text(change.after, change.key))}
                  </div>
                ))}
              </div>
            </div>
          ),
        },
        {
          title: t("操作人"),
          width: 250,
          render: (_, log) => <OperationActor actor={log} />,
        },
      ]}
      supplementary={
        <p className="mb-0 mt-4 border-t border-[#edf0f4] pt-4 text-xs text-[#8793a4]">
          {t("操作记录由系统自动保存")}
        </p>
      }
    />
  );
}
