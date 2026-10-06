import { RequestError as Alert } from "../feedback/RequestError";
import { PlusOutlined } from "@ant-design/icons";
import { Button, Empty, Pagination, Space, Table, Tag, Tooltip } from "antd";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Row } from "../../shared/api";
import { canEditFinancialRecord } from "../../shared/financial-record-actions";
import { t } from "../../shared/i18n";
import { shouldOpenRow } from "../../shared/row-navigation";
import { valueView } from "../../shared/ui";
import { MaterialEditor } from "../forms/MaterialEditor";
import { Editor } from "../forms/ResourceEditor";
import { ResourceFilters } from "./ResourceFilters";
import { ResourceListSurface } from "./ResourceListSurface";
import { ResourceListProps } from "./types";
import { useResourceList } from "./useResourceList";
const EMPTY_FILTERS: Row = {};
export const ResourceList = observer(function ResourceList({
  resource,
  fixed = EMPTY_FILTERS,
  embedded = false,
  pageSize = 12,
  renderItems,
  listToolbar,
  filterExtras,
  onResetExtras,
  hideCreate = false,
  createDisabledReason,
  hideStatus = false,
  renderRowActions,
  onViewRow,
  renderCreateEditor,
  renderEditor,
}: ResourceListProps) {
  const {
    config,
    root,
    navigate,
    setSearch,
    store,
    q,
    setQ,
    status,
    setStatus,
    page,
    query,
    changePage,
    refresh,
    searchNow,
    resetFilters,
  } = useResourceList(resource, fixed, embedded, pageSize);
  const [editor, setEditor] = useState<Row | boolean>(false);
  const [material, setMaterial] = useState(false);
  if (!config || !root.canRead(resource))
    return <Empty description={t("暂无此模块的访问权限")} />;
  const columns: any[] = config.columns.map((c) => ({
    title: t(c.label),
    dataIndex: c.key,
    key: c.key,
    ellipsis: true,
    render: (v: any, row: Row) =>
      c.key === config.columns[0].key && onViewRow ? (
        <span>{v || "—"}</span>
      ) : c.key === config.columns[0].key ? (
        <Link to={`/${resource}/${row.id}`}>{v || "—"}</Link>
      ) : c.key === "status" && resource === "incomes" && row.overdue ? (
        <Space size={4}>
          {valueView(c.key, v, resource)}
          <Tag color="red">{t("逾期")}</Tag>
        </Space>
      ) : (
        valueView(
          c.key,
          c.key === "unitTypeCode"
            ? row.unitTypeName || v
            : c.key === "status" && resource === "orders"
              ? row.lifecycleStatus || v
              : v,
          resource,
        )
      ),
  }));
  columns.push({
    title: t("操作"),
    key: "actions",
    fixed: "right",
    width:
      resource === "sales-companies" || resource === "fund-accounts"
        ? 210
        : resource === "materials"
          ? 145
          : 120,
    render: (_: any, row: Row) => (
      <Space size={10} data-row-action>
        <Button
          size="small"
          onClick={() =>
            onViewRow ? onViewRow(row) : navigate(`/${resource}/${row.id}`)
          }
        >
          {t("查看")}
        </Button>
        {resource === "materials" && row.storageKey ? (
          <Button
            size="small"
            href={`/api/v1/materials/${row.id}/download`}
            target="_blank"
            rel="noreferrer"
          >
            {t("下载")}
          </Button>
        ) : (
          canEditFinancialRecord(resource, row) &&
          root.canWrite(resource) &&
          config.fields.length > 0 && (
            <Button size="small" onClick={() => setEditor(row)}>
              {t("编辑")}
            </Button>
          )
        )}
        {renderRowActions?.(row)}
      </Space>
    ),
  });
  const newAllowed =
    !["incomes", "commissions"].includes(resource) &&
    root.canWrite(resource) &&
    config.fields.length > 0;
  const toolbar = (
    <ResourceFilters
      q={q}
      setQ={setQ}
      searchNow={searchNow}
      resetFilters={resetFilters}
      resource={resource}
      status={status}
      setStatus={setStatus}
      actions={
        (newAllowed && !hideCreate) ||
        (resource === "materials" && !root.salesRole) ? (
          <>
            {newAllowed && !hideCreate && (
              <Tooltip
                trigger={["hover", "focus"]}
                title={
                  createDisabledReason ? t(createDisabledReason) : undefined
                }
              >
                <span tabIndex={createDisabledReason ? 0 : undefined}>
                  <Button
                    disabled={!!createDisabledReason}
                    type="primary"
                    icon={<PlusOutlined aria-hidden />}
                    onClick={() => setEditor(true)}
                  >
                    {t(
                      embedded
                        ? "新建"
                        : `新建${config.title.replace("管理", "")}`,
                    )}
                  </Button>
                </span>
              </Tooltip>
            )}
            {resource === "materials" && !root.salesRole && (
              <Button
                type="primary"
                icon={<PlusOutlined aria-hidden />}
                onClick={() => setMaterial(true)}
              >
                {t(embedded ? "上传资料" : "新增资料")}
              </Button>
            )}
          </>
        ) : undefined
      }
      extraFilters={filterExtras}
      onResetExtras={onResetExtras}
      hideStatus={hideStatus}
    />
  );
  return (
    <div
      className={`[&_.ant-table-thead_th]:!text-[11px] [&_.ant-table-thead_th]:!font-medium [&_.ant-table-thead_th]:whitespace-nowrap [&_.ant-table-tbody_td]:text-xs [&_.ant-table-tbody_td_a]:font-medium ${embedded ? "embedded-resource-list" : "resource-list"}`}
    >
      {store.error && (
        <Alert
          type="error"
          message={t(store.error)}
          showIcon
          action={<Button onClick={refresh}>{t("重试")}</Button>}
          className="mb-4"
        />
      )}
      <ResourceListSurface embedded={embedded}>
        {listToolbar}
        {t(toolbar)}

        <div className="list-results">
          {t(
            renderItems?.({
              store,
              navigate,
              page,
              setSearch,
              query,
              onPageChange: changePage,
            }) ?? (
              <>
                <div className="list-scroll-area">
                  <Table
                    size="middle"
                    rowKey="id"
                    onRow={(row) => ({
                      className: onViewRow ? "" : "cursor-pointer",
                      onClick: (event) => {
                        if (!onViewRow && shouldOpenRow(event))
                          navigate(`/${resource}/${row.id}`);
                      },
                    })}
                    columns={columns}
                    dataSource={store.items.map((x) => ({
                      ...x,
                    }))}
                    loading={store.loading}
                    scroll={{
                      x: "max-content",
                    }}
                    pagination={false}
                  />
                </div>
                <div className="list-pagination flex flex-wrap items-center justify-end gap-x-4 gap-y-2">
                  <span className="whitespace-nowrap text-sm text-[#8491a3]">
                    {t(`共 ${store.total} 条`)}
                  </span>
                  <Pagination
                    current={page}
                    pageSize={pageSize}
                    total={store.total}
                    showSizeChanger={false}
                    onChange={changePage}
                  />
                </div>
              </>
            ),
          )}
        </div>
      </ResourceListSurface>
      {editor &&
        (renderEditor ? (
          renderEditor({
            row: typeof editor === "object" ? editor : undefined,
            initial: fixed,
            onClose: () => setEditor(false),
            onSaved: () => {
              setEditor(false);
              refresh();
            },
          })
        ) : editor === true && renderCreateEditor ? (
          renderCreateEditor({
            onClose: () => setEditor(false),
            onSaved: () => {
              setEditor(false);
              refresh();
            },
          })
        ) : (
          <Editor
            resource={resource}
            lockedFields={
              resource === "commissions"
                ? ["orderId", "mode", "periodStart", "periodEnd"]
                : []
            }
            row={typeof editor === "object" ? editor : undefined}
            initial={fixed}
            onClose={() => setEditor(false)}
            onSaved={() => {
              setEditor(false);
              refresh();
            }}
          />
        ))}
      {material && (
        <MaterialEditor
          owner={Object.keys(fixed).length ? fixed : undefined}
          onClose={() => setMaterial(false)}
          onSaved={() => {
            setMaterial(false);
            refresh();
          }}
        />
      )}
    </div>
  );
});
