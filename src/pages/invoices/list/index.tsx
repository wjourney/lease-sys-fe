import {
  App,
  Button,
  DatePicker,
  Input,
  Pagination,
  Select,
  Table,
  Tabs,
  Tag,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import {
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import dayjs from "dayjs";
import { RequestError } from "../../../components/feedback/RequestError";
import { api, dateText, type Row } from "../../../shared/api";
import { feeLabels } from "../../../shared/resource-config";
import { t } from "../../../shared/i18n";
import { formatMoney } from "../../../shared/money-format";
import { Status } from "../../../shared/ui";
import { useRoot } from "../../../stores/root";
import { useBillRequest } from "../../incomes/bill-data";
import { InvoiceDraftDrawer } from "../InvoiceDraftDrawer";
import { InvoiceDetailDrawer } from "../InvoiceDetailDrawer";
import { InvoicePdfPreview } from "../InvoicePdfPreview";
import { InvoiceRowActions } from "../InvoiceRowActions";

const emailLabels: Record<string, string> = {
  IDLE: "未发送",
  PENDING: "待发送",
  SENDING: "发送中",
  SENT: "已发送",
  UNKNOWN: "待核验",
  FAILED: "发送失败",
};

export default observer(function InvoiceListPage() {
  const root = useRoot();
  const { id: detailId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { message, modal } = App.useApp();
  const [search, setSearch] = useSearchParams();
  const [keyword, setKeyword] = useState(search.get("q") || "");
  const [preview, setPreview] = useState<Row>();
  const [editor, setEditor] = useState<Row | boolean>(false);
  const [selected, setSelected] = useState<React.Key[]>([]);
  const [busy, setBusy] = useState(false);
  const params = Object.fromEntries(search);
  params.pageSize = "20";
  const { data, loading, error, reload } = useBillRequest<{
    items: Row[];
    total: number;
    page: number;
  }>("/invoices", params, root.epoch);
  const change = (values: Row) =>
    setSearch((prev) => {
      const next = new URLSearchParams(prev);
      next.set("page", "1");
      for (const [key, value] of Object.entries(values)) {
        if (value) next.set(key, String(value));
        else next.delete(key);
      }
      return next;
    });
  useEffect(() => {
    const timer = setTimeout(() => {
      if ((search.get("q") || "") !== keyword.trim())
        change({ q: keyword.trim() });
    }, 350);
    return () => clearTimeout(timer);
  }, [keyword]);
  useEffect(() => setKeyword(search.get("q") || ""), [search.get("q")]);
  useEffect(() => setSelected([]), [search.toString(), root.epoch]);
  const selectedRows = loading
    ? []
    : (data?.items || []).filter((r) => selected.includes(r.id));
  async function batchIssue() {
    const drafts = selectedRows.filter((r) => r.status === "DRAFT");
    setBusy(true);
    const failed: string[] = [];
    for (const r of drafts) {
      try {
        await api.post(`/invoices/${r.id}/issue`);
      } catch {
        failed.push(r.invoiceNo);
      }
    }
    root.invalidate();
    setBusy(false);
    if (failed.length)
      message.warning(
        t(
          `已出具 ${drafts.length - failed.length} 张，未完成：${failed.join("、")}`,
        ),
      );
    else message.success(t(`已出具 ${drafts.length} 张发票`));
  }
  return (
    <section className="resource-list">
      <Tabs
        activeKey={search.get("status") || "ALL"}
        onChange={(status) => change({ status })}
        items={[
          ["ALL", "全部"],
          ["DRAFT", "草稿"],
          ["ACTIVE", "已出具"],
        ].map(([key, label]) => ({ key, label: t(label) }))}
      />
      <div className="surface list-surface rounded-lg border border-[#e9edf2] bg-white p-5">
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <Input
            aria-label={t("发票搜索")}
            placeholder={t("搜索发票编号、单位、付款人或订单")}
            className="!w-80"
            allowClear
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <Select
            aria-label={t("邮件状态筛选")}
            placeholder={t("全部邮件状态")}
            className="w-36"
            allowClear
            value={search.get("emailStatus") || undefined}
            onChange={(emailStatus) => change({ emailStatus })}
            options={Object.entries(emailLabels).map(([value, label]) => ({
              value,
              label: t(label),
            }))}
          />
          <DatePicker.RangePicker
            value={
              search.get("from") && search.get("to")
                ? [dayjs(search.get("from")), dayjs(search.get("to"))]
                : null
            }
            onChange={(v) =>
              change({
                from: v?.[0]?.format("YYYY-MM-DD"),
                to: v?.[1]?.format("YYYY-MM-DD"),
              })
            }
          />
          <Button
            onClick={() => {
              setKeyword("");
              setSearch({});
            }}
          >
            {t("重置")}
          </Button>
          <div className="ml-auto flex gap-3">
            <Button
              href={`/api/v1/invoices/export?${new URLSearchParams(params)}`}
            >
              {t("导出")}
            </Button>
            {root.finance && (
              <Button
                disabled={
                  !selectedRows.some((r) => r.status === "DRAFT") || busy
                }
                loading={busy}
                onClick={() =>
                  modal.confirm({
                    title: t("批量出具发票"),
                    content: t("仅处理所选草稿，已出具或作废记录会跳过。"),
                    onOk: batchIssue,
                  })
                }
              >
                {t("批量出具")}
              </Button>
            )}
            {root.finance && (
              <Button
                type="primary"
                icon={<PlusOutlined aria-hidden />}
                onClick={() => setEditor(true)}
              >
                {t("新增发票")}
              </Button>
            )}
          </div>
        </div>
        {error && (
          <RequestError
            type="error"
            message={error}
            action={<Button onClick={reload}>{t("重试")}</Button>}
          />
        )}
        <div className="list-scroll-area">
          <Table<Row>
            rowKey="id"
            loading={loading}
            dataSource={data?.items || []}
            pagination={false}
            scroll={{ x: 1100 }}
            size="middle"
            className="[&_.ant-table-tbody_td]:text-xs [&_.ant-table-thead_th]:text-xs"
            rowSelection={
              root.finance
                ? { selectedRowKeys: selected, onChange: setSelected }
                : undefined
            }
            onChange={(_, __, sorter) => {
              if (!Array.isArray(sorter))
                change({
                  sortBy: sorter.order ? sorter.field : undefined,
                  sort: sorter.order === "ascend" ? "asc" : "desc",
                });
            }}
            columns={[
              {
                title: t("发票编号"),
                dataIndex: "invoiceNo",
                width: 180,
                sorter: true,
                render: (value, row) => (
                  <Button
                    type="link"
                    className="!p-0"
                    onClick={() =>
                      navigate(`/invoices/${row.id}${location.search}`)
                    }
                  >
                    {value}
                  </Button>
                ),
              },
              {
                title: t("项目 / 单位"),
                width: 145,
                render: (_, row) => (
                  <>
                    <div>{row.projectName || "—"}</div>
                    <span className="text-xs text-[#8491a3]">
                      {row.unitNo || "—"}
                    </span>
                  </>
                ),
              },
              {
                title: t("付款人"),
                width: 110,
                render: (_, row) => (
                  <>
                    <div>{row.payerName || "—"}</div>
                    <span className="text-xs text-[#8491a3]">
                      {row.payerPhone || ""}
                    </span>
                  </>
                ),
              },
              {
                title: t("出具日期"),
                dataIndex: "issuedOn",
                sorter: true,
                render: dateText,
                width: 95,
              },
              {
                title: t("到期日"),
                dataIndex: "dueOn",
                render: dateText,
                width: 95,
              },
              {
                title: t("金额"),
                dataIndex: "amount",
                sorter: true,
                width: 115,
                render: (v, row) => formatMoney(v, row.currency),
              },
              {
                title: t("关联费用"),
                width: 110,
                render: (_, row) => (
                  <>
                    <div>{t(feeLabels[row.feeType] || row.feeType || "—")}</div>
                    <span className="text-xs text-[#8491a3]">
                      {row.billNo || "—"}
                    </span>
                  </>
                ),
              },
              {
                title: t("状态"),
                dataIndex: "status",
                width: 80,
                render: (v) => <Status resource="invoices" value={v} />,
              },
              {
                title: t("邮件状态"),
                dataIndex: "emailStatus",
                width: 110,
                render: (v) => (
                  <Tag
                    color={
                      v === "SENT"
                        ? "green"
                        : ["FAILED", "UNKNOWN"].includes(v)
                          ? "red"
                          : "default"
                    }
                  >
                    {t(emailLabels[v] || v || "—")}
                  </Tag>
                ),
              },
              {
                title: t("操作"),
                fixed: "right",
                width: 80,
                render: (_, row) => (
                  <InvoiceRowActions
                    row={row}
                    onPreview={() => setPreview(row)}
                    onEdit={() => setEditor(row)}
                    onPrint={() => setPreview({ ...row, autoPrint: true })}
                  />
                ),
              },
            ]}
          />
        </div>
        <div className="list-pagination flex justify-end pt-4">
          <Pagination
            current={data?.page || Number(search.get("page") || 1)}
            pageSize={20}
            total={data?.total || 0}
            showSizeChanger={false}
            showTotal={(n) => t(`共 ${n} 条`)}
            onChange={(page) =>
              setSearch((prev) => {
                const next = new URLSearchParams(prev);
                next.set("page", String(page));
                return next;
              })
            }
          />
        </div>
      </div>
      {preview && (
        <InvoicePdfPreview
          invoice={preview}
          autoPrint={preview.autoPrint}
          onClose={() => setPreview(undefined)}
        />
      )}
      {detailId && (
        <InvoiceDetailDrawer
          id={detailId}
          onClose={() => navigate(`/invoices${location.search}`)}
          onPreview={setPreview}
          onEdit={setEditor}
          onPrint={(row) => setPreview({ ...row, autoPrint: true })}
        />
      )}
      {editor && (
        <InvoiceDraftDrawer
          row={typeof editor === "object" ? editor : undefined}
          onClose={() => setEditor(false)}
        />
      )}
    </section>
  );
});
