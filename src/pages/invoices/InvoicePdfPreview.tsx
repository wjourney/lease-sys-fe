import { Alert, Button, Drawer, Empty, Space, Spin } from "antd";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { api, errorMessage, type Row } from "../../shared/api";
import { t } from "../../shared/i18n";
import { useRoot } from "../../stores/root";
import { useBillRequest } from "../incomes/bill-data";

export function InvoicePdfPreview({
  invoice,
  onClose,
  selector,
  autoPrint = false,
}: {
  invoice: Row;
  onClose: () => void;
  selector?: ReactNode;
  autoPrint?: boolean;
}) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const frame = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    const controller = new AbortController();
    let objectUrl = "";
    setUrl("");
    setError("");
    api
      .get<Blob>(`/invoices/${invoice.id}/pdf`, {
        responseType: "blob",
        signal: controller.signal,
        timeout: 180000,
      })
      .then(({ data, headers }) => {
        if (controller.signal.aborted) return;
        if (!String(headers["content-type"]).includes("application/pdf"))
          throw new Error("发票预览未完成，请稍后重试");
        objectUrl = URL.createObjectURL(data);
        setUrl(objectUrl);
      })
      .catch(async (e) => {
        if (controller.signal.aborted) return;
        if (e.response?.data instanceof Blob) {
          try {
            e.response.data = JSON.parse(await e.response.data.text());
          } catch {
            /* Keep the original failure. */
          }
        }
        if (!controller.signal.aborted) setError(errorMessage(e));
      });
    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [invoice.id]);
  return (
    <Drawer
      open
      width="min(100vw, 1000px)"
      title={t(`发票预览 · ${invoice.invoiceNo || ""}`)}
      onClose={onClose}
      extra={
        <Space>
          <Button
            href={`/api/v1/invoices/${invoice.id}/pdf?download=true`}
            target="_blank"
            disabled={!url}
          >
            {t("下载 PDF")}
          </Button>
          <Button
            disabled={!url}
            onClick={() => frame.current?.contentWindow?.print()}
          >
            {t("打印")}
          </Button>
        </Space>
      }
    >
      {selector && <div className="mb-4">{selector}</div>}
      {error ? (
        <Alert type="error" showIcon message={error} />
      ) : url ? (
        <iframe
          ref={frame}
          title={t("发票 PDF 预览")}
          src={url}
          onLoad={() => {
            if (autoPrint) frame.current?.contentWindow?.print();
          }}
          className="h-[calc(100dvh-170px)] w-full border-0"
        />
      ) : (
        <div className="flex h-64 items-center justify-center">
          <Spin />
        </div>
      )}
    </Drawer>
  );
}

export function BillInvoicePreview({
  bill,
  onClose,
}: {
  bill: Row;
  onClose: () => void;
}) {
  const root = useRoot();
  const { data, loading, error } = useBillRequest<{ items: Row[] }>(
    "/invoices",
    { billId: bill.id, pageSize: 100, status: "ACTIVE" },
    root.epoch,
  );
  const [selected, setSelected] = useState<string>();
  const invoices = (data?.items || []).filter(
    (item) => item.status === "ACTIVE",
  );
  const invoice = invoices.find((i) => i.id === selected) || invoices[0];
  if (invoice)
    return (
      <InvoicePdfPreview
        key={invoice.id}
        invoice={invoice}
        onClose={onClose}
        selector={
          invoices.length > 1 ? (
            <select
              aria-label={t("选择关联发票")}
              value={invoice.id}
              className="w-full rounded-md border border-[#d9d9d9] bg-white px-3 py-2 text-sm text-[#15243f]"
              onChange={(event) => setSelected(event.target.value)}
            >
              {invoices.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.invoiceNo} · {t("已出具")}
                </option>
              ))}
            </select>
          ) : undefined
        }
      />
    );
  return (
    <Drawer
      open
      width="min(100vw, 1000px)"
      title={t(`发票预览 · ${bill.recordNo}`)}
      onClose={onClose}
    >
      {loading ? (
        <Spin />
      ) : error ? (
        <Alert type="error" showIcon message={error} />
      ) : (
        <Empty
          description={t("该账单暂无关联发票，请先在发票管理中新建并出具发票")}
        />
      )}
    </Drawer>
  );
}
