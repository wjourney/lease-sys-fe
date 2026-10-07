import { App, Button, Tooltip } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { saveDownload } from "../../components/batch/export";
import { api, errorMessage, type Row } from "../../shared/api";
import { t } from "../../shared/i18n";
import { useRoot } from "../../stores/root";

export const DownloadBillInvoices = observer(function DownloadBillInvoices({
  bill,
  disabled = false,
}: {
  bill: Row;
  disabled?: boolean;
}) {
  const root = useRoot();
  const { message } = App.useApp();
  const [downloading, setDownloading] = useState(false);
  if (!root.finance) return null;
  const hasInvoice = Number(bill.invoiceCount) > 0 && bill.status !== "VOID";
  return (
    <Tooltip title={!hasInvoice ? t("暂无发票，请先登记收款") : undefined}>
      <span>
        <Button
          size="small"
          aria-label={t("下载发票")}
          aria-busy={downloading}
          icon={<DownloadOutlined />}
          disabled={disabled || !hasInvoice}
          loading={downloading}
          onClick={async () => {
            setDownloading(true);
            try {
              const response = await api.post(
                `/invoices/bills/${bill.id}/download`,
                undefined,
                { responseType: "blob", timeout: 180000 },
              );
              const type = String(response.headers["content-type"] || "").split(
                ";",
              )[0];
              if (!["application/pdf", "application/zip"].includes(type))
                throw new Error("下载未完成");
              const ext = type === "application/pdf" ? "pdf" : "zip";
              saveDownload(response.data, `${bill.recordNo}_发票.${ext}`);
            } catch (error) {
              message.error(errorMessage(error));
            } finally {
              setDownloading(false);
            }
          }}
        >
          {t("下载发票")}
        </Button>
      </span>
    </Tooltip>
  );
});
