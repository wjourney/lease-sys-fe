import { Button } from "antd";
import { observer } from "mobx-react-lite";
import { useRecordDetail } from "../../../../components/resource-detail/DetailContext";
import { t } from "../../../../shared/i18n";
import { useState } from "react";
import { InvoicePdfPreview } from "../../InvoicePdfPreview";
export const InvoiceActions = observer(function InvoiceActions() {
  const { resource, root, row, openAction, id, run } = useRecordDetail();
  const [previewing, setPreviewing] = useState(false);
  return (
    <>
      {resource === "invoices" &&
        root.finance &&
        ["UNKNOWN", "SENDING"].includes(row.emailStatus) && (
          <Button
            onClick={() =>
              openAction(
                "核验发送结果",
                [
                  {
                    key: "resolution",
                    label: "核验结果",
                    type: "select",
                    options: [
                      {
                        label: "确认已发送成功",
                        value: "SENT",
                      },
                      {
                        label: "确认未发送，重新发送",
                        value: "RETRY",
                      },
                    ],
                  },
                  {
                    key: "reason",
                    label: "核验说明",
                    type: "textarea",
                  },
                ],
                `/invoices/${id}/email-resolution`,
              )
            }
          >
            核验发送结果
          </Button>
        )}
      {resource === "invoices" && (
        <>
          <Button onClick={() => setPreviewing(true)}>{t("预览发票")}</Button>
          {root.finance && row.status === "DRAFT" && (
            <Button onClick={() => run(`/invoices/${id}/issue`)}>
              {t("出具发票")}
            </Button>
          )}
          {root.finance && row.status === "ACTIVE" && (
            <>
              <Button
                type="primary"
                onClick={() =>
                  openAction(
                    "发送发票",
                    [
                      {
                        key: "emailTo",
                        label: t("接收邮箱"),
                      },
                      {
                        key: "emailSubject",
                        label: t("邮件主题"),
                      },
                    ],
                    `/invoices/${id}/send`,
                    {
                      emailSubject: row.invoiceNo + " 租赁发票",
                    },
                    {
                      requestId: crypto.randomUUID(),
                    },
                  )
                }
              >
                {t("发送发票")}
              </Button>
              <Button
                onClick={() =>
                  openAction(
                    "作废并重开发票",
                    [
                      {
                        key: "reason",
                        label: t("重开原因"),
                        type: "textarea",
                      },
                    ],
                    `/invoices/${id}/reissue`,
                  )
                }
              >
                {t("作废重开")}
              </Button>
              <Button
                danger
                onClick={() =>
                  openAction(
                    "作废发票",
                    [
                      {
                        key: "reason",
                        label: t("作废原因"),
                        type: "textarea",
                      },
                    ],
                    `/invoices/${id}/void`,
                  )
                }
              >
                {t("作废")}
              </Button>
            </>
          )}
        </>
      )}
      {previewing && (
        <InvoicePdfPreview invoice={row} onClose={() => setPreviewing(false)} />
      )}
    </>
  );
});
