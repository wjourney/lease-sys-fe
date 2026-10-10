import { Alert, Button, Card, Empty, Space, Table, Tag, Tooltip } from "antd";
import { useState } from "react";
import {
  DetailContextValue,
  useRecordDetail,
} from "../../../../components/resource-detail/DetailContext";
import { financialFields } from "../../../../components/resource-detail/financial-fields";
import { dateText, Row } from "../../../../shared/api";
import { t } from "../../../../shared/i18n";
import { depositSummaryItems, remainingMoney } from "../order-financials";
import { DepositSettlementForm } from "./DepositSettlementForm";
import { OrderFigures } from "./OrderFigures";
import { MediaGalleryModal } from "../../../projects/detail/components/MediaGalleryModal";

import {
  RegisterReceipt,
  type ReceiptFormOptions,
} from "../../../../components/receipts/RegisterReceipt";
import { OperationActor } from "../../../../components/resource-detail/OperationActor";
import {
  depositColors,
  depositStates,
  depositRefundDisabledReason,
} from "../../../deposits/deposit-state";
import { formatMoney } from "../../../finance/finance-data";
import { DepositRecordDetail } from "./DepositRecordDetail";

export function openDepositRefund(
  openAction: DetailContextValue["openAction"],
  refund: Row,
  currency = "HKD",
) {
  openAction(
    "登记押金退款",
    [
      {
        key: "amount",
        label: `退款金额（${currency}）`,
        type: "money",
        readOnly: true,
      },
      ...financialFields,
    ],
    `/expenses/${refund.id}/pay`,
    { amount: remainingMoney(refund), paymentMethod: "BANK" },
    { sourceKey: crypto.randomUUID() },
  );
}

export function OrderDepositSummary({
  onSettle,
  onRegisterReceipt,
}: {
  onSettle?: () => void;
  onRegisterReceipt?: (form: ReceiptFormOptions) => void;
} = {}) {
  const { row, root, openAction } = useRecordDetail();
  const amount = (value: any) => formatMoney(value, row.currency);
  const [settling, setSettling] = useState(false);
  const [vouchers, setVouchers] = useState<Row[]>();
  const d = row.deposit;
  if (!d || row.status === "DRAFT")
    return (
      <Card title={t("押金结算")}>
        <Alert
          type="info"
          message={t(
            row.status === "DRAFT"
              ? "完善单位和租金后生成押金账单，再登记实际收款。"
              : "押金收款与结算数据暂不可用，请稍后重试。",
          )}
        />
      </Card>
    );
  const settled = Boolean(row.depositSettledAt);
  const receipts: Row[] = (row.bills ?? [])
    .filter((bill: Row) => bill.feeType === "DEPOSIT" && bill.status !== "VOID")
    .flatMap((bill: Row) => bill.receipts ?? []);
  const refunds: Row[] = root.canRead("expenses")
    ? (d.refunds ?? []).filter((refund: Row) => refund.status !== "VOID")
    : [];
  const payable = refunds.filter((refund) => remainingMoney(refund) > 0);
  const deductions: Row[] = row.depositDeductions?.length
    ? row.depositDeductions
    : Number(row.depositDeductionAmount) > 0
      ? [
          {
            label: "押金扣款",
            amount: row.depositDeductionAmount,
            note: row.depositDeductionReason,
          },
        ]
      : [];
  const records: Row[] = [
    ...receipts.map((receipt) => ({
      ...receipt,
      kind: "收款",
      date: receipt.receivedOn,
      direction: "+",
      receipt,
    })),
    ...refunds.flatMap((refund) =>
      (refund.paymentRecords ?? []).map((payment: Row, index: number) => ({
        ...payment,
        paymentIndex: index,
        id: `${refund.id}:${index}`,
        expenseId: refund.id,
        kind: "退款",
        date: payment.paidOn,
        direction: "−",
      })),
    ),
    // Historical payouts can lack separate payment records; retain their actual paid amount.
    ...refunds
      .filter(
        (refund) =>
          !refund.paymentRecords?.length && Number(refund.paidAmount) > 0,
      )
      .map((refund) => ({
        ...refund,
        id: `legacy:${refund.id}`,
        expenseId: refund.id,
        amount: refund.paidAmount,
        kind: "退款",
        date: refund.paidOn,
        direction: "−",
      })),
  ].sort((a, b) => String(b.date ?? "").localeCompare(String(a.date ?? "")));
  function registerRefund(refund: Row) {
    openDepositRefund(openAction, refund, row.currency);
  }
  const depositBills = (row.bills ?? []).filter(
    (bill: Row) =>
      bill.feeType === "DEPOSIT" &&
      bill.status !== "VOID" &&
      Number(bill.available) > 0,
  );
  const refundDisabledReason =
    depositRefundDisabledReason(row, root.finance) ||
    (settled && !payable.length
      ? "无可登记的押金退款，请刷新后重试"
      : undefined);
  function refundDeposit() {
    if (refundDisabledReason) return;
    if (settled) registerRefund(payable[0]);
    else if (onSettle) onSettle();
    else setSettling(true);
  }
  return (
    <>
      <Card
        title={
          <Space wrap size={16} className="deposit-summary-heading">
            <span>{t("押金结算")}</span>
            <Tag color={depositColors[d.state]}>
              {t(depositStates[d.state] || "—")}
            </Tag>
            <Tooltip
              title={refundDisabledReason ? t(refundDisabledReason) : undefined}
              trigger={["hover", "focus"]}
            >
              <span
                className="inline-flex"
                tabIndex={refundDisabledReason ? 0 : undefined}
              >
                <Button
                  disabled={Boolean(refundDisabledReason)}
                  onClick={refundDeposit}
                >
                  {t("退还押金")}
                </Button>
              </span>
            </Tooltip>
            {settled && (
              <span className="text-sm font-normal text-[#78869a]">
                {t("结算日期")} {dateText(row.depositSettledAt)}
              </span>
            )}
          </Space>
        }
        extra={
          <Space wrap>
            {!settled && row.status !== "CLOSED" && depositBills.length > 0 && (
              <RegisterReceipt
                bills={depositBills}
                orderId={row.id}
                payerName={row.tenantName}
                onOpen={onRegisterReceipt}
              />
            )}
            {root.finance && row.actions?.reviseDeposit && (
              <Button
                onClick={() => (onSettle ? onSettle() : setSettling(true))}
              >
                {t("修正结算")}
              </Button>
            )}
          </Space>
        }
        className="deposit-summary !border-[#e5eaf0] [&_.ant-card-head]:!min-h-16 [&_.ant-card-body]:!p-6"
      >
        <OrderFigures
          items={depositSummaryItems(d, settled).map((item) => ({
            ...item,
            value: amount(item.value),
          }))}
        />
        {Number(d.pending) > 0 && (
          <Alert
            className="mt-4"
            type="warning"
            showIcon
            message={t(
              `存在历史待核对收款 ${amount(d.pending)}，请前往账单核对。`,
            )}
          />
        )}
        {settled && (
          <section className="mt-5">
            <h3 className="m-0 mb-3 text-base font-semibold text-[#263650]">
              {t("扣款明细")}
            </h3>
            <Table<Row>
              size="small"
              rowKey={(_, index) => String(index)}
              pagination={false}
              dataSource={deductions}
              locale={{ emptyText: t("无扣款") }}
              scroll={{ x: "max-content" }}
              columns={[
                { title: t("项目"), dataIndex: "label" },
                { title: t("金额"), dataIndex: "amount", render: amount },
                {
                  title: t("说明"),
                  dataIndex: "note",
                  render: (value) => (
                    <span className="whitespace-normal">{t(value || "—")}</span>
                  ),
                },
                ...(deductions.some((item) => item.incomeId)
                  ? [
                      {
                        title: t("关联账单"),
                        dataIndex: "incomeId",
                        render: (value: string) =>
                          row.bills?.find((bill: Row) => bill.id === value)
                            ?.recordNo || "—",
                      },
                    ]
                  : []),
              ]}
            />
            {row.depositDeductionReason && (
              <p className="mb-0 mt-3 text-sm text-[#78869a]">
                {t("结算说明")}：{t(row.depositDeductionReason)}
              </p>
            )}
          </section>
        )}
        {payable.length > 1 && (
          <section className="mt-5">
            <h3 className="mb-3 text-base font-semibold">{t("退款明细")}</h3>
            <Table<Row>
              size="small"
              rowKey="id"
              pagination={false}
              dataSource={refunds}
              scroll={{ x: "max-content" }}
              columns={[
                { title: t("退款单"), dataIndex: "expenseNo" },
                { title: t("应退"), dataIndex: "amount", render: amount },
                { title: t("已退"), dataIndex: "paidAmount", render: amount },
                {
                  title: t("待退金额"),
                  render: (_, refund) => amount(remainingMoney(refund)),
                },
                {
                  title: t("操作"),
                  render: (_, refund) =>
                    root.finance && remainingMoney(refund) > 0 ? (
                      <Button
                        size="small"
                        onClick={() => registerRefund(refund)}
                      >
                        {t("登记退款")}
                      </Button>
                    ) : (
                      "—"
                    ),
                },
              ]}
            />
          </section>
        )}
        <section className="deposit-records mt-6">
          <h3 className="m-0 mb-4 text-base font-semibold text-[#263650]">
            {t("收退款记录")}
          </h3>
          {records.length ? (
            <div className="flex flex-col gap-3">
              {records.map((record) => (
                <article key={record.id} className="deposit-record">
                  <div className="deposit-record-summary">
                    <time className="tabular-nums">
                      {dateText(record.date)}
                    </time>
                    <div>
                      <Tag color={record.receipt ? "blue" : "green"}>
                        {t(record.kind)}
                      </Tag>
                      {record.receipt && record.status !== "CONFIRMED" && (
                        <div className="mt-1 text-xs text-[#78869a]">
                          {t(
                            (
                              {
                                PENDING: "历史收款待核对",
                                REVERSED: "已撤销",
                                REJECTED: "已驳回",
                                WITHDRAWN: "已撤回",
                              } as Row
                            )[record.status] || record.status,
                          )}
                        </div>
                      )}
                    </div>
                    <strong className="deposit-record-amount">
                      {record.direction}
                      {amount(record.amount)}
                    </strong>
                    <div className="deposit-record-method deposit-record-meta">
                      <span>{t("方式")}</span>
                      <span>
                        {t(
                          (
                            {
                              BANK: "银行转账",
                              CASH: "现金",
                              CHEQUE: "支票",
                            } as Row
                          )[record.paymentMethod] ||
                            record.paymentMethod ||
                            "—",
                        )}
                      </span>
                    </div>
                    <div className="deposit-record-actor deposit-record-meta">
                      <span>{t("操作人")}</span>
                      <OperationActor actor={record} />
                    </div>
                  </div>
                  <DepositRecordDetail
                    record={record}
                    onPreview={setVouchers}
                  />
                </article>
              ))}
            </div>
          ) : (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={t("暂无押金收退款记录")}
            />
          )}
        </section>
      </Card>
      {settling && <DepositSettlementForm onClose={() => setSettling(false)} />}
      <MediaGalleryModal
        category={vouchers ? "PROJECT_FILE" : undefined}
        title="收退款凭证"
        items={vouchers ?? []}
        onClose={() => setVouchers(undefined)}
      />
    </>
  );
}
