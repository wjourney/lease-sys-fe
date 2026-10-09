import { ReactNode, useState } from "react";
import { Table, Pagination } from "antd";
import type { TableProps } from "antd";
import { Row } from "../../../../shared/api";
import { t } from "../../../../shared/i18n";
export function OrderTable({
  rows,
  columns,
  title,
  actions,
  expandable,
  summary,
  supplementary,
  pageSize = 6,
}: {
  rows: Row[];
  columns: TableProps<Row>["columns"];
  title: string;
  actions?: ReactNode;
  expandable?: TableProps<Row>["expandable"];
  summary?: ReactNode;
  supplementary?: ReactNode;
  pageSize?: number;
}) {
  const [page, setPage] = useState(1);
  const current = Math.min(
    page,
    Math.max(1, Math.ceil(rows.length / pageSize)),
  );
  return (
    <div className="embedded-resource-list overflow-hidden rounded-lg border border-[#e5eaf0] bg-white">
      <div className="flex min-h-14 items-center justify-between gap-3 border-b border-[#edf0f4] px-6 py-3">
        <strong className="text-base text-[#263650]">{t(title)}</strong>
        {actions}
      </div>
      {summary && <div className="px-6 pt-4">{summary}</div>}
      <div className="list-scroll-area px-5 pt-3 [&_.ant-table-thead_th]:!bg-[#f8fafc] [&_.ant-table-thead_th]:!text-[#78869a] [&_.ant-table-thead_th]:!font-medium [&_.ant-table-tbody_td]:!text-sm">
        <Table<Row>
          size="small"
          rowKey="id"
          columns={columns}
          dataSource={rows.slice((current - 1) * pageSize, current * pageSize)}
          pagination={false}
          scroll={{ x: "max-content" }}
          expandable={expandable}
        />
      </div>
      {supplementary && <div className="px-5 pb-4">{supplementary}</div>}
      {rows.length > pageSize && (
        <div className="flex items-center justify-end gap-4 border-t border-[#edf0f4] px-5 py-3">
          <span className="text-sm text-[#8793a4]">
            {t(`共 ${rows.length} 条`)}
          </span>
          <Pagination
            current={current}
            total={rows.length}
            pageSize={pageSize}
            showSizeChanger={false}
            onChange={setPage}
          />
        </div>
      )}
    </div>
  );
}
