import { Card, Empty, Timeline, Typography } from "antd";
import { observer } from "mobx-react-lite";
import { Row } from "../../shared/api";
import { dateTimeText } from "../../shared/date-time";
import { t } from "../../shared/i18n";
const { Text } = Typography;
export const RecordHistory = observer(function RecordHistory({
  logs,
  fields,
}: {
  logs: Row[];
  fields: { key: string; label: string }[];
}) {
  return (
    <Card
      title={t("操作记录")}
      className="mb-5 [&_.ant-descriptions-item-label]:text-xs [&_.ant-descriptions-item-content]:break-words [&_.ant-descriptions-item-content]:text-xs"
    >
      <Timeline
        items={[...logs].reverse().map((l) => ({
          children: (
            <div>
              <strong>{t(l.actorName)}</strong>{" "}
              <Text type="secondary">
                {dateTimeText(l.operatedAt)}
              </Text>
              <div>
                {{
                  CREATE: "新增记录",
                  UPDATE: "修改记录",
                  DELETE: "删除记录",
                }[l.action as string] || l.action}{" "}
                {l.reason && " · " + l.reason}
              </div>
              <div className="my-[9px] mb-5 max-h-[220px] overflow-auto break-all text-[11px] leading-[1.8] text-[#8490a2]">
                {Object.entries(l.changes || {})
                  .filter(
                    ([key]) =>
                      !["createdBy", "updatedBy", "revision"].includes(key),
                  )
                  .map(([key, c]: any) => (
                    <div key={key}>
                      {fields.find((f) => f.key === key)?.label ??
                        (
                          {
                            status: "状态",
                            deletedAt: "删除时间",
                            paidAmount: "实付金额",
                            isCurrent: "当前版本",
                          } as any
                        )[key] ??
                        key}
                      ：
                      {t(
                        typeof c.before === "object"
                          ? JSON.stringify(c.before)
                          : String(c.before ?? "—"),
                      )}{" "}
                      →{" "}
                      {t(
                        typeof c.after === "object"
                          ? JSON.stringify(c.after)
                          : String(c.after ?? "—"),
                      )}
                    </div>
                  ))}
              </div>
            </div>
          ),
        }))}
      />
      {!logs.length && <Empty description={t("暂无操作记录")} />}
    </Card>
  );
});
