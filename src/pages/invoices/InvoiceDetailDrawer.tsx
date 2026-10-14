import { ArrowRightOutlined, EyeOutlined } from "@ant-design/icons";
import { Alert, Button, Drawer, Spin, Tabs, Tag } from "antd";
import { useEffect, useState } from "react";
import {
  FinanceFields,
  FinanceSummaryStrip,
  RelatedOrderPanel,
} from "../../components/finance-detail/FinanceDetailLayout";
import { FinanceOperationHistory } from "../../components/finance-detail/FinanceOperationHistory";
import { RequestError } from "../../components/feedback/RequestError";
import { dateText, type Row } from "../../shared/api";
import { feeLabels } from "../../shared/resource-config";
import { t } from "../../shared/i18n";
import { formatMoney } from "../../shared/money-format";
import { Status } from "../../shared/ui";
import { useRoot } from "../../stores/root";
import { BillDrawer } from "../incomes/BillDrawer";
import { billStates, useBillRequest } from "../incomes/bill-data";
import { InvoiceRowActions } from "./InvoiceRowActions";

const emailLabels: Record<string, string> = {
  IDLE: "未发送",
  PENDING: "待发送",
  SENDING: "发送中",
  SENT: "已发送",
  UNKNOWN: "待核验",
  FAILED: "发送失败",
};

function RelatedBillPanel({ invoice }: { invoice: Row }) {
  const root = useRoot();
  const [showBill, setShowBill] = useState(false);
  const {
    data: bill,
    loading,
    error,
    reload,
  } = useBillRequest<Row>(`/incomes/${invoice.billId}`, {}, root.epoch);
  return (
    <>
      <section className="finance-related-order">
        <div className="finance-related-order-head">
          <h3>{t("关联账单")}</h3>
          <Button type="link" onClick={() => setShowBill(true)}>
            {t("查看账单")} <ArrowRightOutlined aria-hidden />
          </Button>
        </div>
        {error ? (
          <RequestError
            type="error"
            message={error}
            action={<Button onClick={reload}>{t("重试")}</Button>}
          />
        ) : (
          <Spin spinning={loading}>
            <FinanceFields
              items={[
                {
                  label: "账单编号",
                  value: bill?.recordNo || invoice.billNo || "—",
                },
                {
                  label: "账单状态",
                  value: bill?.status ? (
                    <Tag color={bill.status === "PAID" ? "green" : "blue"}>
                      {t(billStates[bill.status] || bill.status)}
                    </Tag>
                  ) : (
                    "—"
                  ),
                },
                {
                  label: "应收金额",
                  value:
                    bill?.total == null
                      ? "—"
                      : formatMoney(
                          bill.total,
                          bill.currency || invoice.currency,
                        ),
                },
                { label: "到期日期", value: dateText(bill?.dueOn) },
              ]}
            />
          </Spin>
        )}
      </section>
      {showBill && (
        <BillDrawer id={invoice.billId} onClose={() => setShowBill(false)} />
      )}
    </>
  );
}

export function InvoiceDetailDrawer({
  id,
  onClose,
  onPreview,
  onEdit,
  onPrint,
}: {
  id: string;
  onClose: () => void;
  onPreview: (invoice: Row) => void;
  onEdit: (invoice: Row) => void;
  onPrint: (invoice: Row) => void;
}) {
  const root = useRoot();
  const {
    data: row,
    loading,
    error,
    reload,
    refresh,
  } = useBillRequest<Row>(`/invoices/${id}`, {}, root.epoch);
  const waitingForEmail = ["PENDING", "SENDING"].includes(row?.emailStatus);
  useEffect(() => {
    if (!waitingForEmail) return;
    const timer = setInterval(refresh, 5000);
    return () => clearInterval(timer);
  }, [id, waitingForEmail]);
  const period = row?.periodStart
    ? `${dateText(row.periodStart)} ${t("至")} ${dateText(row.periodEnd)}`
    : "—";

  return (
    <Drawer
      open
      className="finance-detail-drawer"
      width="min(1040px, 61vw)"
      title={t(`发票详情${row?.invoiceNo ? ` · ${row.invoiceNo}` : ""}`)}
      onClose={onClose}
    >
      {error ? (
        <RequestError
          type="error"
          message={error}
          action={<Button onClick={reload}>{t("重试")}</Button>}
        />
      ) : (
        <Spin spinning={loading}>
          {row && (
            <Tabs
              className="finance-detail-tabs"
              items={[
                {
                  key: "basic",
                  label: t("发票资料"),
                  children: (
                    <>
                      <FinanceSummaryStrip
                        status={
                          <Status resource="invoices" value={row.status} />
                        }
                        figures={[
                          {
                            label: "发票金额",
                            value: formatMoney(row.amount, row.currency),
                          },
                        ]}
                        actions={
                          <>
                            <Button
                              type="primary"
                              icon={<EyeOutlined aria-hidden />}
                              onClick={() => onPreview(row)}
                            >
                              {t("预览发票")}
                            </Button>
                            <Button
                              href={`/api/v1/invoices/${row.id}/pdf?download=true`}
                              target="_blank"
                            >
                              {t("下载 PDF")}
                            </Button>
                            <InvoiceRowActions
                              row={row}
                              showDetail={false}
                              showLabel
                              onPreview={() => onPreview(row)}
                              onEdit={() => onEdit(row)}
                              onPrint={() => onPrint(row)}
                            />
                          </>
                        }
                      />
                      <FinanceFields
                        items={[
                          { label: "发票编号", value: row.invoiceNo },
                          { label: "出具日期", value: dateText(row.issuedOn) },
                          { label: "付款人", value: row.payerName || "—" },
                          { label: "到期日期", value: dateText(row.dueOn) },
                          { label: "联系电话", value: row.payerPhone || "—" },
                          {
                            label: "邮件状态",
                            value: t(
                              emailLabels[row.emailStatus] ||
                                row.emailStatus ||
                                "—",
                            ),
                          },
                          {
                            label: "付款人邮箱",
                            value:
                              row.snapshot?.payerEmail || row.emailTo || "—",
                          },
                          {
                            label: "关联费用",
                            value: t(
                              feeLabels[row.feeType] || row.feeType || "—",
                            ),
                          },
                          { label: "账期", value: period },
                          { label: "备注", value: row.snapshot?.remark || "—" },
                        ]}
                      />
                      {["FAILED", "UNKNOWN"].includes(row.emailStatus) && (
                        <Alert
                          className="mt-4"
                          type={
                            row.emailStatus === "FAILED" ? "error" : "warning"
                          }
                          showIcon
                          message={t(emailLabels[row.emailStatus])}
                          description={
                            row.emailLastError ||
                            t("请联系管理员核查邮件发送记录")
                          }
                        />
                      )}
                      {row.billId && <RelatedBillPanel invoice={row} />}
                      <RelatedOrderPanel
                        orderId={row.orderId}
                        summary={{
                          orderNo: row.orderNo,
                          tenantName: row.payerName,
                          projectName: row.projectName,
                          unitNo: row.unitNo,
                        }}
                      />
                    </>
                  ),
                },
                {
                  key: "logs",
                  label: t("操作记录"),
                  children: (
                    <FinanceOperationHistory
                      logs={row.operations || []}
                      resource="invoices"
                      currency={row.currency}
                      recordNo={row.invoiceNo}
                    />
                  ),
                },
              ]}
            />
          )}
        </Spin>
      )}
    </Drawer>
  );
}
