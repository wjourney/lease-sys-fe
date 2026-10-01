import { Input, InputNumber, Switch, Table } from "antd";
import { observer } from "mobx-react-lite";
import type { Dispatch, SetStateAction } from "react";
import { t } from "../../../shared/i18n";
import type { RootStore } from "../../../stores/root";

export const UnitTypesTable = observer(function UnitTypesTable({
  rows,
  root,
  setting,
  setRows,
}: {
  rows: Record<string, any>[];
  root: RootStore;
  setting: Record<string, any> | undefined;
  setRows: Dispatch<SetStateAction<Record<string, any>[]>>;
}) {
  return (
    <Table
      rowKey={(_, i) => String(i)}
      pagination={false}
      dataSource={rows}
      columns={[
        {
          title: t("类型编码"),
          dataIndex: "code",
          render: (v, _, i) => (
            <Input
              disabled={!root.canWrite("settings") || !!setting?.value?.[i]}
              value={v}
              onChange={(e) =>
                setRows(
                  rows.map((r, n) =>
                    n === i
                      ? {
                          ...r,
                          code: e.target.value,
                        }
                      : r,
                  ),
                )
              }
            />
          ),
        },
        {
          title: t("类型名称"),
          dataIndex: "name",
          render: (v, _, i) => (
            <Input
              disabled={!root.canWrite("settings")}
              value={v}
              onChange={(e) =>
                setRows(
                  rows.map((r, n) =>
                    n === i
                      ? {
                          ...r,
                          name: e.target.value,
                        }
                      : r,
                  ),
                )
              }
            />
          ),
        },
        {
          title: t("排序"),
          dataIndex: "sortOrder",
          render: (v, _, i) => (
            <InputNumber
              disabled={!root.canWrite("settings")}
              value={v}
              onChange={(v) =>
                setRows(
                  rows.map((r, n) =>
                    n === i
                      ? {
                          ...r,
                          sortOrder: v,
                        }
                      : r,
                  ),
                )
              }
            />
          ),
        },
        {
          title: t("启用"),
          dataIndex: "enabled",
          render: (v, _, i) => (
            <Switch
              disabled={!root.canWrite("settings")}
              checked={v}
              onChange={(v) =>
                setRows(
                  rows.map((r, n) =>
                    n === i
                      ? {
                          ...r,
                          enabled: v,
                        }
                      : r,
                  ),
                )
              }
            />
          ),
        },
      ]}
    />
  );
});
