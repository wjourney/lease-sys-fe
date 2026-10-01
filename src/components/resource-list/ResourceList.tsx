import { PlusOutlined } from "@ant-design/icons";
import { Alert, Button, Empty, Space, Table } from "antd";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Row } from "../../shared/api";
import { t } from "../../shared/i18n";
import { shouldOpenRow } from "../../shared/row-navigation";
import { valueView } from "../../shared/ui";
import { MaterialEditor } from "../forms/MaterialEditor";
import { Editor } from "../forms/ResourceEditor";
import { ResourceFilters } from "./ResourceFilters";
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
  renderRowActions,
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
    filter,
    setLocalPage,
    refresh,
    searchNow,
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
      c.key === config.columns[0].key ? (
        <Link to={`/${resource}/${row.id}`}>{v || "—"}</Link>
      ) : (
        valueView(
          c.key,
          c.key === "unitTypeCode" ? row.unitTypeName || v : v,
          resource,
        )
      ),
  }));
  columns.push({
    title: t("操作"),
    key: "actions",
    fixed: "right",
    width:
      resource === "sales-companies"
        ? 210
        : resource === "materials"
          ? 145
          : 120,
    render: (_: any, row: Row) => (
      <Space size={10} data-row-action>
        <Button size="small" onClick={() => navigate(`/${resource}/${row.id}`)}>
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
  const newAllowed = root.canWrite(resource) && config.fields.length > 0;
  const toolbar = (
    <ResourceFilters
      q={q}
      setQ={setQ}
      searchNow={searchNow}
      resource={resource}
      status={status}
      setStatus={setStatus}
      embedded={embedded}
      setSearch={setSearch}
      setLocalPage={setLocalPage}
      actions={
        newAllowed || resource === "materials" ? (
          <>
            {newAllowed && (
              <Button
                type="primary"
                icon={<PlusOutlined aria-hidden />}
                onClick={() => setEditor(true)}
              >
                {t(
                  embedded ? "新建" : `新建${config.title.replace("管理", "")}`,
                )}
              </Button>
            )}
            {resource === "materials" && (
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
    />
  );
  return (
    <div className="[&_.ant-table-thead_th]:!text-[11px] [&_.ant-table-thead_th]:!font-medium [&_.ant-table-thead_th]:whitespace-nowrap [&_.ant-table-tbody_td]:text-xs [&_.ant-table-tbody_td_a]:font-medium">
      {store.error && (
        <Alert
          type="error"
          message={t(store.error)}
          showIcon
          action={<Button onClick={refresh}>{t("重试")}</Button>}
          className="mb-4"
        />
      )}
      <div
        className={`surface rounded-[7px] border border-[#e9edf2] bg-white p-[22px] max-[760px]:p-[15px] ${embedded ? "!border-0" : ""}`}
      >
        {listToolbar}
        {t(toolbar)}

        {t(
          renderItems?.({
            store,
            navigate,
            page,
            setSearch,
            query,
          }) ?? (
            <Table
              size="middle"
              rowKey="id"
              onRow={(row) => ({
                className: "cursor-pointer",
                onClick: (event) => {
                  if (shouldOpenRow(event)) navigate(`/${resource}/${row.id}`);
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
              pagination={{
                position: ["bottomRight"],
                current: page,
                pageSize: 12,
                total: store.total,
                showSizeChanger: false,
                showTotal: (n) => `共 ${n} 条`,
                onChange: (v) =>
                  embedded
                    ? setLocalPage(v)
                    : setSearch({
                        q: query,
                        ...(filter
                          ? {
                              status: filter,
                            }
                          : {}),
                        page: String(v),
                      }),
              }}
            />
          ),
        )}
      </div>
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
