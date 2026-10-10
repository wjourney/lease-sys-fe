import { OperationActor } from "./OperationActor";
import { Card, Empty, Timeline, Typography } from "antd";
import { observer } from "mobx-react-lite";
import { Row } from "../../shared/api";
import { dateTimeText } from "../../shared/date-time";
import { t } from "../../shared/i18n";
const { Text } = Typography;

function sameValue(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (
    a === null ||
    b === null ||
    typeof a !== "object" ||
    typeof b !== "object"
  )
    return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const left = a as Record<string, unknown>;
  const right = b as Record<string, unknown>;
  const keys = Object.keys(left);
  return (
    keys.length === Object.keys(right).length &&
    keys.every((key) => key in right && sameValue(left[key], right[key]))
  );
}

const extraLabels: Record<string, string> = {
  usage: "用途",
  salesStatus: "销售状态",
  buildingStatus: "现况",
  developmentDate: "开发日期",
  areaRange: "面积范围",
  unitInterval: "单位间隔",
  managementFee: "管理费",
  lawyerFirm: "律师事务所",
  nearbySchools: "附近学校",
  website: "网站",
  salesOffice: "售楼处",
};

export function changedEntries(
  changes: Row,
  fields: { key: string; label: string }[],
) {
  return Object.entries(changes || {}).flatMap(([key, change]) => {
    if (["createdBy", "updatedBy", "revision"].includes(key)) return [];
    const { before, after } = (change || {}) as {
      before: unknown;
      after: unknown;
    };
    if (sameValue(before, after)) return [];
    if (
      key === "extra" &&
      before &&
      after &&
      typeof before === "object" &&
      typeof after === "object" &&
      !Array.isArray(before) &&
      !Array.isArray(after)
    ) {
      const previous = before as Record<string, unknown>;
      const next = after as Record<string, unknown>;
      return [...new Set([...Object.keys(previous), ...Object.keys(next)])]
        .filter((child) => !sameValue(previous[child], next[child]))
        .map((child) => ({
          key: `extra.${child}`,
          label: extraLabels[child] || child,
          before: previous[child],
          after: next[child],
        }));
    }
    return [
      {
        key,
        label:
          fields.find((field) => field.key === key)?.label ??
          (
            {
              status: "状态",
              deletedAt: "删除时间",
              paidAmount: "实付金额",
              isCurrent: "当前版本",
            } as Record<string, string>
          )[key] ??
          key,
        before,
        after,
      },
    ];
  });
}

function valueText(value: unknown) {
  return t(
    typeof value === "object" && value !== null
      ? JSON.stringify(value)
      : String(value ?? "—"),
  );
}

export const RecordHistory = observer(function RecordHistory({
  logs,
  fields,
  onlyUpdates = false,
  inModal = false,
}: {
  logs: Row[];
  fields: { key: string; label: string }[];
  onlyUpdates?: boolean;
  inModal?: boolean;
}) {
  const entries = [...logs]
    .reverse()
    .map((log) => ({ log, changes: changedEntries(log.changes, fields) }))
    .filter(({ log, changes }) =>
      onlyUpdates ? log.action === "UPDATE" && changes.length > 0 : true,
    );
  const content = (
    <>
      <Timeline
        items={entries.map(({ log: l, changes }) => ({
          children: (
            <div>
              <strong>
                <OperationActor actor={l} />
              </strong>{" "}
              <Text type="secondary">{dateTimeText(l.operatedAt)}</Text>
              <div>
                {{
                  CREATE: "新增记录",
                  UPDATE: "修改记录",
                  DELETE: "删除记录",
                }[l.action as string] || l.action}{" "}
                {l.reason && " · " + l.reason}
              </div>
              <div className="my-[9px] mb-5 max-h-[220px] overflow-auto break-all text-[11px] leading-[1.8] text-[#8490a2]">
                {changes.map((change) => (
                  <div key={change.key}>
                    {t(change.label)}：{valueText(change.before)} →{" "}
                    {valueText(change.after)}
                  </div>
                ))}
              </div>
            </div>
          ),
        }))}
      />
      {!entries.length && <Empty description={t("暂无操作记录")} />}
    </>
  );
  if (inModal) return content;
  return (
    <Card
      title={t("操作记录")}
      className="mb-5 [&_.ant-descriptions-item-label]:text-xs [&_.ant-descriptions-item-content]:break-words [&_.ant-descriptions-item-content]:text-xs"
    >
      {content}
    </Card>
  );
});
