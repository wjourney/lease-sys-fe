import { ReactNode, useLayoutEffect, useRef, useState } from "react";
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
  fillViewport = false,
}: {
  rows: Row[];
  columns: TableProps<Row>["columns"];
  title: string;
  actions?: ReactNode;
  expandable?: TableProps<Row>["expandable"];
  summary?: ReactNode;
  supplementary?: ReactNode;
  pageSize?: number;
  fillViewport?: boolean;
}) {
  const [page, setPage] = useState(1);
  const area = useRef<HTMLDivElement>(null);
  const rowSize = useRef({ width: 0, height: 0 });
  const [fittedPageSize, setFittedPageSize] = useState(pageSize);
  const limit = fillViewport ? fittedPageSize : pageSize;
  const current = Math.min(page, Math.max(1, Math.ceil(rows.length / limit)));
  useLayoutEffect(() => {
    const element = area.current;
    if (!fillViewport || !element) return;
    const measure = () => {
      if (!element.clientHeight || !element.clientWidth) return;
      const table = element.querySelector(".ant-table");
      if (!table) return;
      const heights = Array.from(
        table.querySelectorAll(".ant-table-tbody > .ant-table-row"),
        (row) => row.getBoundingClientRect().height,
      );
      if (!heights.length) return;
      // Keep the largest measured row at this width so variable-height entries
      // cannot make pagination oscillate as rows enter and leave the page.
      if (rowSize.current.width !== element.clientWidth)
        rowSize.current = { width: element.clientWidth, height: 0 };
      rowSize.current.height = Math.max(rowSize.current.height, ...heights);
      const header = table.querySelector(".ant-table-thead");
      const content = table.querySelector<HTMLElement>(".ant-table-content");
      const scrollbar = content
        ? content.offsetHeight - content.clientHeight
        : 0;
      const available =
        element.clientHeight -
        parseFloat(getComputedStyle(element).paddingTop) -
        (header?.getBoundingClientRect().height ?? 0) -
        scrollbar -
        2;
      setFittedPageSize(
        Math.max(1, Math.floor(available / rowSize.current.height)),
      );
    };
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    const table = element.querySelector(".ant-table");
    if (table) observer.observe(table);
    measure();
    return () => observer.disconnect();
  }, [fillViewport, current, limit, rows.length]);
  return (
    <div
      className={`embedded-resource-list overflow-hidden rounded-lg border border-[#e5eaf0] bg-white ${fillViewport ? "order-table-fill" : ""}`}
    >
      <div className="flex min-h-14 items-center justify-between gap-3 border-b border-[#edf0f4] px-6 py-3">
        <strong className="text-base text-[#263650]">{t(title)}</strong>
        {actions}
      </div>
      {summary && <div className="px-6 pt-4">{summary}</div>}
      <div
        ref={area}
        className="list-scroll-area px-5 pt-3 [&_.ant-table-thead_th]:!bg-[#f8fafc] [&_.ant-table-thead_th]:!text-[#78869a] [&_.ant-table-thead_th]:!font-medium [&_.ant-table-tbody_td]:!text-sm"
      >
        <Table<Row>
          size="small"
          rowKey="id"
          columns={columns}
          dataSource={rows.slice((current - 1) * limit, current * limit)}
          pagination={false}
          scroll={{ x: "max-content" }}
          expandable={expandable}
        />
      </div>
      {supplementary && <div className="px-5 pb-4">{supplementary}</div>}
      {(fillViewport || rows.length > limit) && (
        <div className="flex items-center justify-end gap-4 border-t border-[#edf0f4] px-5 py-3">
          <span className="text-sm text-[#8793a4]">
            {t(`共 ${rows.length} 条`)}
          </span>
          <Pagination
            current={current}
            total={rows.length}
            pageSize={limit}
            showSizeChanger={false}
            onChange={setPage}
          />
        </div>
      )}
    </div>
  );
}
