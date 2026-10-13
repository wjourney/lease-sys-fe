import { Button, Drawer, Spin, Tabs } from "antd";
import { observer } from "mobx-react-lite";
import {
  FinanceFields,
  FinanceRecords,
  FinanceSummaryStrip,
  RelatedOrderPanel,
} from "../../components/finance-detail/FinanceDetailLayout";
import { FinanceOperationHistory } from "../../components/finance-detail/FinanceOperationHistory";
import { OperationActor } from "../../components/resource-detail/OperationActor";
import { RequestError } from "../../components/feedback/RequestError";
import { ReceiptActions } from "../../components/receipts/ReceiptActions";
import { RegisterReceipt } from "../../components/receipts/RegisterReceipt";
import { dateText, type Row } from "../../shared/api";
import { t } from "../../shared/i18n";
import { Status } from "../../shared/ui";
import { useRoot } from "../../stores/root";
import { formatMoney } from "../finance/finance-data";
import { billTypes, useBillRequest } from "./bill-data";
import { DownloadBillInvoices } from "./DownloadBillInvoices";

export function BillStatus({ row }: { row: Row }) {
  return <Status resource="incomes" value={row.status} />;
}

export const BillDrawer = observer(function BillDrawer({
  id,
  onClose,
}: {
  id: string;
  onClose: () => void;
}) {
  const root = useRoot();
  const {
    data: row,
    loading,
    error,
    reload,
  } = useBillRequest<Row>(`/incomes/${id}`, {}, root.epoch);
  const money = (value: string | number) =>
    formatMoney(value, row?.currency || "HKD");
  return (
    <Drawer
      open
      className="finance-detail-drawer"
      width="min(1040px, 61vw)"
      title={t(`账单详情${row?.recordNo ? ` · ${row.recordNo}` : ""}`)}
      onClose={onClose}
    >
      {error ? (
        <RequestError
          type="error"
          showIcon
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
                  label: t("账单资料"),
                  children: (
                    <>
                      <FinanceSummaryStrip
                        status={
                          <Status resource="incomes" value={row.status} />
                        }
                        figures={[
                          { label: "应收金额", value: money(row.total) },
                          { label: "实收金额", value: money(row.confirmed) },
                        ]}
                        actions={
                          <>
                            <DownloadBillInvoices
                              bill={row}
                              disabled={loading}
                              size="middle"
                            />
                            <RegisterReceipt
                              bills={[row]}
                              orderId={row.orderId}
                              payerName={row.payerName}
                              size="middle"
                            />
                          </>
                        }
                      />
                      <FinanceFields
                        items={[
                          {
                            label: "账单类型",
                            value: t(
                              billTypes[row.feeType] || row.feeType || "—",
                            ),
                          },
                          { label: "到期日期", value: dateText(row.dueOn) },
                          {
                            label: "账期",
                            value: row.periodStart
                              ? `${dateText(row.periodStart)} ${t("至")} ${dateText(row.periodEnd)}`
                              : "—",
                          },
                          { label: "付款方", value: row.payerName || "—" },
                          { label: "备注", value: row.remark || "—" },
                        ]}
                      />
                      <RelatedOrderPanel
                        orderId={row.orderId}
                        summary={{
                          orderNo: row.orderNo,
                          tenantName: row.payerName,
                          projectName: row.projectName,
                          unitNo: row.unitNo,
                        }}
                      />
                      <FinanceRecords
                        title="收款记录"
                        rows={row.receipts || []}
                        emptyText="暂无收款记录"
                        columns={[
                          {
                            title: t("收款日期"),
                            dataIndex: "receivedOn",
                            render: dateText,
                          },
                          {
                            title: t("金额"),
                            dataIndex: "amount",
                            render: money,
                          },
                          { title: t("银行账户"), dataIndex: "accountName" },
                          {
                            title: t("方式"),
                            dataIndex: "paymentMethod",
                            render: (value) =>
                              t(
                                (
                                  {
                                    BANK: "银行转账",
                                    CASH: "现金",
                                    CHEQUE: "支票",
                                  } as Row
                                )[value] ||
                                  value ||
                                  "—",
                              ),
                          },
                          {
                            title: t("操作人"),
                            render: (_, receipt) => (
                              <OperationActor actor={receipt} />
                            ),
                          },
                          {
                            title: t("凭证"),
                            render: (_, receipt) => (
                              <ReceiptActions receipt={receipt} />
                            ),
                          },
                        ]}
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
                      recordNo={row.recordNo}
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
});
