import { Empty, Tag, Timeline } from "antd";
import type { Row } from "../../shared/api";
import { dateTimeText } from "../../shared/date-time";
import { t } from "../../shared/i18n";
import { changedEntries } from "../resource-detail/RecordHistory";
import { OperationActor } from "../resource-detail/OperationActor";

const actionLabels: Record<string, string> = {
  CREATE: "创建",
  UPDATE: "修改",
  DELETE: "删除",
};

function valueText(value: unknown) {
  return t(
    typeof value === "object" && value !== null
      ? JSON.stringify(value)
      : String(value ?? "—"),
  );
}

export function FinanceOperationHistory({
  logs,
  fields = [],
  recordNo,
}: {
  logs: Row[];
  fields?: { key: string; label: string }[];
  recordNo?: string;
}) {
  const entries = [...logs].sort((left, right) =>
    String(left.operatedAt ?? "").localeCompare(String(right.operatedAt ?? "")),
  );

  return (
    <div className="finance-operation-history">
      {entries.length ? (
        <Timeline
          className="finance-operation-timeline"
          items={entries.map((log, index) => {
            const action = t(actionLabels[log.action] || log.action || "操作");
            const subject = log.subject || recordNo;
            const summary = log.reason || subject || t("记录更新");
            const suffix =
              log.reason && subject && !String(log.reason).includes(subject)
                ? ` · ${subject}`
                : "";
            const changes = changedEntries(log.changes ?? {}, fields);
            return {
              key: log.eventId || log.id || index,
              children: (
                <div className="finance-history-entry">
                  <div className="finance-history-meta">
                    <strong>
                      <OperationActor actor={log} />
                    </strong>
                    <span className="finance-history-time">
                      {dateTimeText(log.operatedAt)}
                    </span>
                  </div>
                  <div className="finance-history-action">
                    <Tag bordered={false} className="finance-history-tag">
                      {action}
                    </Tag>
                    <span>
                      {t(summary)}
                      {suffix}
                    </span>
                  </div>
                  {changes.length > 0 && (
                    <div className="finance-history-changes">
                      {changes.map((change) => (
                        <div key={change.key}>
                          {t(change.label)}：{valueText(change.before)} →{" "}
                          {valueText(change.after)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ),
            };
          })}
        />
      ) : (
        <Empty description={t("暂无操作记录")} />
      )}
    </div>
  );
}
