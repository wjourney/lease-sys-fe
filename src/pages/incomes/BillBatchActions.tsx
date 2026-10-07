import { App, Button, Space, Table } from "antd";
import { useRef, useState } from "react";
import { ActionForm } from "../../components/forms/ActionForm";
import { financialFields } from "../../components/resource-detail/financial-fields";
import { exportRows, saveDownload } from "../../components/batch/export";
import { api, errorMessage, type Row } from "../../shared/api";
import { t } from "../../shared/i18n";
import { useRoot } from "../../stores/root";

export function BillBatchActions({ rows }: { rows: Row[] }) {
  const root = useRoot();
  const { message } = App.useApp();
  const [downloading, setDownloading] = useState(false);
  const [bills, setBills] = useState<Row[]>();
  const [results, setResults] = useState<Row[]>([]);
  const keys = useRef(new Map<string, string>());
  const posted = useRef(new Map<string, Row>());
  const available = rows.filter(
    (r) => r.canRegister && Number(r.available) > 0,
  );
  async function downloadInvoices() {
    setDownloading(true);
    try {
      const response = await api.post(
        "/invoices/batch-download",
        { billIds: rows.map((r) => r.id) },
        { responseType: "blob", timeout: 180000 },
      );
      saveDownload(response.data, "账单发票.zip");
      const count = Number(response.headers["x-invoice-count"] || 0);
      const issues = Number(response.headers["x-invoice-issues"] || 0);
      if (issues || !count)
        message.warning(
          t(`已下载 ${count} 张发票，未完成项请查看压缩包内下载结果`),
        );
      else message.success(t(`已下载 ${count} 张发票`));
    } catch (error) {
      message.error(errorMessage(error));
    } finally {
      setDownloading(false);
    }
  }
  const report = results.length ? (
    <Table
      rowKey="id"
      size="small"
      pagination={false}
      dataSource={results}
      columns={[
        { title: t("账单"), dataIndex: "recordNo" },
        {
          title: t("执行结果"),
          render: (_, row) =>
            t(
              row.ok
                ? row.voucherFailed
                  ? "已入账，凭证上传失败，可在收款记录补传"
                  : "已入账"
                : row.message || "失败，请稍后重试",
            ),
        },
      ]}
    />
  ) : null;
  return (
    <>
      <Space wrap className="mb-4">
        <span>{t(`已选 ${rows.length} 条（当前页）`)}</span>
        <Button
          disabled={!rows.length}
          onClick={() =>
            exportRows(
              rows,
              [
                ["recordNo", "账单编号"],
                ["orderNo", "订单编号"],
                ["payerName", "付款方"],
                ["feeType", "类型"],
                ["total", "应收（HKD）"],
                ["confirmed", "已收（HKD）"],
                ["remaining", "剩余（HKD）"],
                ["dueOn", "到期日期"],
                ["status", "状态"],
              ],
              "账单.csv",
            )
          }
        >
          {t("导出所选")}
        </Button>
        <Button
          disabled={!rows.length || rows.length > 20}
          loading={downloading}
          onClick={downloadInvoices}
        >
          {t("批量下载发票")}
        </Button>
        <Button
          type="primary"
          disabled={!available.length}
          onClick={() => {
            keys.current = new Map(
              available.map((row) => [row.id, crypto.randomUUID()]),
            );
            posted.current = new Map();
            setResults([]);
            setBills(available);
          }}
        >
          {t(`批量登记收款（${available.length}）`)}
        </Button>
      </Space>
      {!bills && report}
      {bills && (
        <ActionForm
          title="批量登记收款（提交后直接入账）"
          voucher
          initial={{
            paymentMethod: "BANK",
            ...Object.fromEntries(
              bills.map((b) => [`bill_${b.id}`, b.available]),
            ),
          }}
          fields={[
            ...bills.map((b) => ({
              key: `bill_${b.id}`,
              label: `${b.recordNo} · ${b.payerName}（可收 HK$ ${b.available}）`,
              type: "money" as const,
            })),
            { key: "receivedOn", label: "到账日期", type: "date" },
            ...financialFields.filter((f) => f.key !== "paidOn"),
          ]}
          onClose={() => {
            setBills(undefined);
            root.invalidate();
          }}
          onSubmit={async (values, file) => {
            const entries = bills
              .filter((b) => !posted.current.has(b.id))
              .map((b) => {
                const amount = String(values[`bill_${b.id}`] ?? "0");
                if (
                  !(Number(amount) > 0) ||
                  Number(amount) > Number(b.available)
                )
                  throw new Error(
                    `${b.recordNo}：收款金额须大于 0 且不超过可收金额`,
                  );
                return {
                  billId: b.id,
                  amount,
                  receivedOn: values.receivedOn,
                  fundAccountId: values.fundAccountId,
                  paymentMethod: values.paymentMethod,
                  bankReference: values.bankReference,
                  payerName: b.payerName,
                  sourceKey: keys.current.get(b.id),
                };
              });
            if (entries.length) {
              const { data } = await api.post("/incomes/batch-receipts", {
                entries,
              });
              for (const item of data.results as Row[]) {
                if (!item.ok) continue;
                posted.current.set(item.id, item);
                if (file) {
                  const form = new FormData();
                  form.append("file", file);
                  form.append(
                    "payload",
                    JSON.stringify({
                      incomeId: item.receiptId,
                      category: "VOUCHER",
                      title: file.name,
                      visibility: "SHARED",
                    }),
                  );
                  try {
                    await api.post("/materials/upload", form);
                  } catch {
                    item.voucherFailed = true;
                  }
                }
              }
              const next = bills.map((b) => ({
                recordNo: b.recordNo,
                ...(posted.current.get(b.id) ||
                  data.results.find((r: Row) => r.id === b.id)),
                id: b.id,
              }));
              setResults(next);
              if (next.some((r) => !r.ok))
                throw new Error(
                  "部分账单未成功，成功项已入账，再次提交仅重试失败项",
                );
            }
            if ([...posted.current.values()].some((r) => r.voucherFailed))
              message.warning(
                t("收款已入账，部分凭证上传失败，请在收款记录补传"),
              );
            else message.success(t("所选账单收款已入账"));
          }}
        >
          {report}
        </ActionForm>
      )}
    </>
  );
}
