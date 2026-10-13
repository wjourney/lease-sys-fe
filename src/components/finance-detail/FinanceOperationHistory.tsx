import { Empty, Tag, Timeline } from "antd";
import type { Row } from "../../shared/api";
import { dateTimeText } from "../../shared/date-time";
import { t } from "../../shared/i18n";
import { OperationActor } from "../resource-detail/OperationActor";
import {
  financeOperationChanges,
  financeOperationSummary,
  type FinanceHistoryResource,
} from "./finance-operation-text";

const actionLabels: Record<string, string> = {
  CREATE: "创建",
  UPDATE: "修改",
  DELETE: "删除",
};

export function FinanceOperationHistory({
  logs,
  resource,
  currency,
  recordNo,
}: {
  logs: Row[];
  resource: FinanceHistoryResource;
  currency?: string;
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
            const action = t(actionLabels[log.action] || "操作");
            const summary = financeOperationSummary(log, resource, recordNo);
            const changes = financeOperationChanges(log, resource, currency);
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
                    <span>{t(summary)}</span>
                  </div>
                  {changes.length > 0 && (
                    <div className="finance-history-changes">
                      {changes.map((change) => (
                        <div key={change}>{t(change)}</div>
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
