import { Card, Empty, Timeline } from "antd";
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
  actualTerminationOn: "退租日期",
  handedOverAt: "交还日期",
  handoverNote: "交还说明",
  depositDeductionAmount: "扣款合计",
  depositDeductionReason: "结算说明",
  depositSettledAt: "押金结算时间",
  bankReference: "交易流水",
  remark: "说明",
  handoverStatus: "交还状态",
};
const states: Record<string, string> = {
  PENDING: "待确认",
  ACTIVE: "租赁中",
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
    .filter((log) => log.action !== "CREATE")
    .map((log) => ({
      log,
      changes: Object.entries(log.changes ?? {})
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
    .filter((x) => x.log.reason || x.changes.length)
    .reverse();
  return (
    <Card
      title={t("订单变更记录")}
      className="!border-[#e5eaf0] [&_.ant-card-head]:!min-h-14 [&_.ant-card-body]:!px-6 [&_.ant-card-body]:!py-6"
    >
      {entries.length ? (
        <Timeline
          className="[&_.ant-timeline-item]:!pb-7 [&_.ant-timeline-item-last]:!pb-0"
          items={entries.map(({ log, changes }) => ({
            key: log.eventId,
            color: "#193a68",
            children: (
              <div className="border-b border-[#edf0f4] pb-5 last:border-0">
                <div className="text-sm text-[#7b8a9e]">
                  {dateTimeText(log.operatedAt)} · {t(log.actorName || "系统")}
                </div>
                <div className="mt-1 font-medium text-[#253650]">
                  {t(log.reason || log.subject || "修改订单信息")}
                </div>
                <div className="mt-1 text-sm leading-6 text-[#718197]">
                  {changes.map((c) => (
                    <div key={c.key}>
                      {t(labels[c.key])}：{t(text(c.before, c.key))} →{" "}
                      {t(text(c.after, c.key))}
                    </div>
                  ))}
                </div>
              </div>
            ),
          }))}
        />
      ) : (
        <Empty description={t("暂无变更记录")} />
      )}
    </Card>
  );
}
