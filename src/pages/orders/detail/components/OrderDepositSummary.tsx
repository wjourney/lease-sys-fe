import { Alert, Button, Card, Space, Table } from "antd";
import { useState } from "react";
import { useRecordDetail } from "../../../../components/resource-detail/DetailContext";
import { financialFields } from "../../../../components/resource-detail/financial-fields";
import { ReceiptActions } from "../../../../components/receipts/ReceiptActions";
import { amount, dateText, Row } from "../../../../shared/api";
import { t } from "../../../../shared/i18n";
import { depositFigures, remainingMoney } from "../order-financials";
import { DepositSettlementForm } from "./DepositSettlementForm";
import { OrderFigures } from "./OrderFigures";
import { MediaGalleryModal } from "../../../projects/detail/components/MediaGalleryModal";

export function OrderDepositSummary() {
  const { row, root, openAction, setTab } = useRecordDetail();
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
  const figures = depositFigures(d, settled);
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
    openAction(
      "登记押金退款",
      [
        { key: "amount", label: "本次退款金额", type: "money" },
        ...financialFields,
      ],
      `/expenses/${refund.id}/pay`,
      { amount: remainingMoney(refund), paymentMethod: "BANK" },
      { sourceKey: crypto.randomUUID() },
    );
  }
  return (
    <>
      <Card
        title={
          <Space wrap size={16}>
            <span>{t("押金结算")}</span>
            {settled && (
              <span className="text-sm font-normal text-[#78869a]">
                {t("结算日期")} {dateText(row.depositSettledAt)}
              </span>
            )}
          </Space>
        }
        extra={
          <Space wrap>
            {settled && figures.refundDue !== null && (
              <span className="text-sm text-[#52627a]">
                {t("剩余应退")}{" "}
                <strong className="ml-2 text-xl font-semibold text-[#b66a16]">
                  {amount(figures.refundDue)}
                </strong>
              </span>
            )}
            {root.finance && payable.length === 1 && (
              <Button type="primary" onClick={() => registerRefund(payable[0])}>
                {t("登记退款")}
              </Button>
            )}
            {root.finance && row.actions?.settle && (
              <Button type="primary" onClick={() => setSettling(true)}>
                {t("办理押金结算")}
              </Button>
            )}
            {!settled && (
              <Button type="link" onClick={() => setTab("bills")}>
                {t("查看押金账单")}
              </Button>
            )}
          </Space>
        }
        className="!border-[#e5eaf0] [&_.ant-card-head]:!min-h-14 [&_.ant-card-body]:!p-5"
      >
        <OrderFigures
          items={
            settled
              ? [
                  { label: "约定押金", value: amount(d.agreed) },
                  { label: "实际收款", value: amount(d.received) },
                  { label: "扣款", value: amount(d.deduction) },
                  { label: "应退总额", value: amount(figures.refundable) },
                  { label: "已退款", value: amount(d.refunded) },
                ]
              : [
                  { label: "约定押金", value: amount(d.agreed) },
                  { label: "实际收款", value: amount(d.received) },
                  { label: "尚未收取", value: amount(figures.unreceived) },
                  { label: "当前持有", value: amount(d.held) },
                ]
          }
        />
        {!settled && (
          <p className="my-4 text-sm text-[#78869a]">
            {t(
              row.actions?.settle
                ? "租约已结束，可核对扣款并办理押金结算。"
                : "租约结束后，可办理押金结算与退款。",
            )}
          </p>
        )}
        {Number(d.pending) > 0 && (
          <Alert
            className="mt-4"
            type="warning"
            showIcon
            message={t(
              `存在历史待核对收款 ${amount(d.pending)}，请先在下方记录中处理。`,
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
                  title: t("剩余应退"),
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
        <section className="mt-5">
          <h3 className="m-0 mb-3 text-base font-semibold text-[#263650]">
            {t("收退款记录")}
          </h3>
          <Table<Row>
            size="small"
            rowKey="id"
            pagination={false}
            dataSource={records}
            locale={{ emptyText: t("暂无押金收退款记录") }}
            scroll={{ x: "max-content" }}
            columns={[
              { title: t("日期"), dataIndex: "date", render: dateText },
              {
                title: t("类型"),
                dataIndex: "kind",
                render: (value, record) => (
                  <>
                    {t(value)}
                    {record.receipt && record.status !== "CONFIRMED" && (
                      <div className="text-xs text-[#78869a]">
                        {t(
                          (
                            {
                              PENDING: "历史收款待核对",
                              REVERSED: "已冲正",
                              REJECTED: "已驳回",
                              WITHDRAWN: "已撤回",
                            } as Row
                          )[record.status] || record.status,
                        )}
                      </div>
                    )}
                  </>
                ),
              },
              {
                title: t("金额"),
                render: (_, record) =>
                  `${record.direction}${amount(record.amount)}`,
              },
              {
                title: t("方式"),
                dataIndex: "paymentMethod",
                render: (value) =>
                  t(
                    ({ BANK: "银行转账", CASH: "现金", CHEQUE: "支票" } as Row)[
                      value
                    ] ||
                      value ||
                      "—",
                  ),
              },
              {
                title: t("凭证 / 记录"),
                render: (_, record) => {
                  const files: Row[] = root.canRead("materials")
                    ? (row.materials ?? []).filter((file: Row) =>
                        record.receipt
                          ? file.incomeId === record.id
                          : file.expenseId === record.expenseId,
                      )
                    : [];
                  return (
                    <Space wrap size={4}>
                      {files.length > 0 && (
                        <Button
                          type="link"
                          size="small"
                          onClick={() => setVouchers(files)}
                        >
                          {t("查看凭证")}
                        </Button>
                      )}
                      {record.receipt ? (
                        <ReceiptActions receipt={record.receipt} />
                      ) : (
                        record.bankReference || "—"
                      )}
                    </Space>
                  );
                },
              },
            ]}
          />
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
