import { Card, Empty, Timeline, Typography } from "antd";
import { observer } from "mobx-react-lite";
import type { Row } from "../../shared/api";
import { dateTimeText } from "../../shared/date-time";
import { t } from "../../shared/i18n";
import {
  changedEntries,
  operationChangeTexts,
  type HistoryField,
} from "../../shared/operation-change-text";
import { OperationActor } from "./OperationActor";

export { changedEntries };

export const RecordHistory = observer(function RecordHistory({
  logs,
  fields,
  onlyUpdates = false,
  inModal = false,
}: {
  logs: Row[];
  fields: HistoryField[];
  onlyUpdates?: boolean;
  inModal?: boolean;
}) {
  const entries = [...logs]
    .reverse()
    .map((log) => ({
      log,
      changes:
        log.action === "UPDATE"
          ? operationChangeTexts(log.changes, fields)
          : [],
    }))
    .filter(({ log, changes }) =>
      onlyUpdates ? log.action === "UPDATE" && changes.length > 0 : true,
    );
  const content = (
    <>
      <Timeline
        items={entries.map(({ log, changes }) => ({
          key: log.eventId || log.id,
          children: (
            <div>
              <strong>
                <OperationActor actor={log} />
              </strong>{" "}
              <Typography.Text type="secondary">
                {dateTimeText(log.operatedAt)}
              </Typography.Text>
              <div>
                {t(
                  (
                    {
                      CREATE: "创建记录",
                      UPDATE: "修改记录",
                      DELETE: "删除记录",
                    } as Record<string, string>
                  )[log.action] || "操作记录",
                )}
                {log.reason && ` · ${t(log.reason)}`}
              </div>
              {changes.length > 0 && (
                <div className="my-[9px] mb-5 max-h-[220px] overflow-auto break-words text-xs leading-[1.8] text-[#8490a2]">
                  {changes.map((change) => (
                    <div key={change}>{t(change)}</div>
                  ))}
                </div>
              )}
            </div>
          ),
        }))}
      />
      {!entries.length && <Empty description={t("暂无操作记录")} />}
    </>
  );
  if (inModal) return content;
  return (
    <Card title={t("操作记录")} className="mb-5">
      {content}
    </Card>
  );
});
