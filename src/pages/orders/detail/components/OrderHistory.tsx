import { OperationActor } from "../../../../components/resource-detail/OperationActor";
import { OrderTable } from "./OrderTable";
import { useRecordDetail } from "../../../../components/resource-detail/DetailContext";
import type { Row } from "../../../../shared/api";
import { dateTimeText } from "../../../../shared/date-time";
import { t } from "../../../../shared/i18n";
import { operationChangeTexts } from "../../../../shared/operation-change-text";
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
function operationText(log: Row) {
  const rawSubject = String(log.subject || "");
  const subject = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(rawSubject)
    ? ""
    : rawSubject;
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
  const fields = [
    ...OrderConfig.fields,
    ...Object.entries(names).map(([key, label]) => ({ key, label })),
  ];
  const entries = logs
    .map((log) => ({
      log,
      changes:
        log.action === "UPDATE"
          ? operationChangeTexts(log.changes, fields)
          : [],
    }))
    .sort((a, b) =>
      String(b.log.operatedAt ?? "").localeCompare(
        String(a.log.operatedAt ?? ""),
      ),
    );
  return (
    <OrderTable
      title="操作记录"
      fillViewport
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
                {log.displayChanges.map((change: string) => (
                  <div key={change}>{t(change)}</div>
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
