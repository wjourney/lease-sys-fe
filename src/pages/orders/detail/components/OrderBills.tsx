import { ReceiptActions } from "../../../../components/receipts/ReceiptActions";
import { RegisterReceipt } from "../../../../components/receipts/RegisterReceipt";
import { Button, Select, Space, Table, Tooltip } from "antd";
import { useState, type Key } from "react";
import dayjs from "dayjs";
import { useRecordDetail } from "../../../../components/resource-detail/DetailContext";
import { financialFields } from "../../../../components/resource-detail/financial-fields";
import { amount, dateText, Row } from "../../../../shared/api";
import { t } from "../../../../shared/i18n";
import { Status } from "../../../../shared/ui";
import { OrderTable } from "./OrderTable";
import { OrderFigures } from "./OrderFigures";
import { rentFigures, remainingMoney } from "../order-financials";

const types: Record<string, string> = {
  RENT: "租金",
  DEPOSIT: "押金",
  OTHER: "其他费用",
};
export function OrderBills() {
  const { id, row, root, openAction } = useRecordDetail();
  const [feeType, setFeeType] = useState<string>();
  const [period, setPeriod] = useState<string>();
  const [expanded, setExpanded] = useState<Key[]>([]);
  const bills: Row[] = row.bills ?? [];
  const figures = rentFigures(bills, dayjs().format("YYYY-MM-DD"));
  const periods = [
    ...new Set(
      bills
        .filter((bill) => bill.periodStart)
        .map((bill) => bill.periodStart.slice(0, 7)),
    ),
  ].sort();
  const filtered = bills.filter(
    (bill) =>
      (!feeType || bill.feeType === feeType) &&
      (!period || bill.periodStart?.slice(0, 7) === period),
  );
  const receipts = (bill: Row) => (
    <Table<Row>
      size="small"
      rowKey="id"
      pagination={false}
      dataSource={bill.receipts ?? []}
      columns={[
        { title: t("到账日期"), dataIndex: "receivedOn", render: dateText },
        { title: t("金额"), dataIndex: "amount", render: amount },
        {
          title: t("付款方式"),
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
          title: t("记录说明"),
          dataIndex: "status",
          render: (value) =>
            t(
              (
                {
                  CONFIRMED: "已入账",
                  PENDING: "历史收款待核对",
                  REJECTED: "已驳回",
                  REVERSED: "已撤销",
                  WITHDRAWN: "已撤回",
                } as Row
              )[value] || value,
            ),
        },
        {
          title: t("操作"),
          render: (_, receipt) => <ReceiptActions receipt={receipt} />,
        },
      ]}
    />
  );
  return (
    <div className="flex flex-col gap-4">
      <OrderTable
        title="本订单账单"
        rows={filtered}
        summary={
          <>
            <OrderFigures
              items={[
                {
                  label: "租期租金应收",
                  value: amount(figures.total),
                  hint: "整个租期的有效租金账单合计，不含押金和其他费用。",
                },
                { label: "租金已收", value: amount(figures.received) },
                {
                  label: "到期未收",
                  value: amount(figures.overdue),
                  hint: "到期日为今天或更早的租金账单尚欠金额；已扣除押金抵扣。",
                },
              ]}
            />
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 py-4">
              <label className="flex items-center gap-3 text-sm text-[#52627a]">
                {t("类型")}
                <Select
                  aria-label={t("账单类型")}
                  allowClear
                  placeholder={t("全部类型")}
                  className="w-44"
                  value={feeType}
                  onChange={setFeeType}
                  options={Object.entries(types).map(([value, label]) => ({
                    value,
                    label: t(label),
                  }))}
                />
              </label>
              <label className="flex items-center gap-3 text-sm text-[#52627a]">
                {t("账期")}
                <Select
                  aria-label={t("账期")}
                  allowClear
                  placeholder={t("全部账期")}
                  className="w-44"
                  value={period}
                  onChange={setPeriod}
                  options={periods.map((value) => ({ value, label: value }))}
                />
              </label>
            </div>
          </>
        }
        columns={[
          {
            title: t("账期 / 类型"),
            render: (_, bill) => (
              <div className="min-w-[160px]">
                <div>
                  {bill.periodStart
                    ? `${dateText(bill.periodStart)} 至 ${dateText(bill.periodEnd)}`
                    : t(types[bill.feeType] || bill.feeType)}
                </div>
                <div className="mt-1 text-xs text-[#8793a4]">
                  {bill.periodStart && t(types[bill.feeType] || bill.feeType)}
                  {bill.periodStart && " · "}
                  {bill.recordNo}
                  {bill.status === "VOID" && t(" · 已作废")}
                </div>
              </div>
            ),
          },
          { title: t("应收金额"), dataIndex: "total", render: amount },
          {
            title: t("实收金额"),
            render: (_, bill) => (
              <>
                {amount(bill.confirmed)}
                {Number(bill.offset) > 0 && (
                  <div className="mt-1 text-xs text-[#8793a4]">
                    {t("押金已抵扣")} {amount(bill.offset)}
                  </div>
                )}
              </>
            ),
          },
          { title: t("到期日期"), dataIndex: "dueOn", render: dateText },
          {
            title: t("付款状态"),
            render: (_, bill) => (
              <Status resource="incomes" value={bill.status} />
            ),
          },
          {
            title: t("操作"),
            render: (_, bill) => (
              <Space size={4} wrap>
                {!root.salesRole &&
                  (bill.status !== "VOID" &&
                  Number(bill.available) > 0 &&
                  !(bill.feeType === "DEPOSIT" && row.depositSettledAt) &&
                  row.status !== "CLOSED" ? (
                    <RegisterReceipt
                      buttonType="default"
                      bills={[bill]}
                      orderId={id}
                      payerName={row.tenantName}
                    />
                  ) : (
                    <Tooltip
                      title={t(
                        bill.status === "VOID"
                          ? "账单已作废"
                          : row.status === "CLOSED"
                            ? "订单已关闭"
                            : bill.feeType === "DEPOSIT" && row.depositSettledAt
                              ? "押金已结算"
                              : Number(bill.remaining) <= 0
                                ? "账单已收齐"
                                : "存在历史收款待核对，请先查看记录",
                      )}
                    >
                      <span>
                        <Button disabled size="small">
                          {t("登记收款")}
                        </Button>
                      </span>
                    </Tooltip>
                  ))}
                {(bill.receipts?.length ?? 0) > 0 && (
                  <Button
                    type="link"
                    size="small"
                    onClick={() =>
                      setExpanded((keys) =>
                        keys.includes(bill.id)
                          ? keys.filter((key) => key !== bill.id)
                          : [...keys, bill.id],
                      )
                    }
                  >
                    {t(expanded.includes(bill.id) ? "收起记录" : "查看记录")}
                  </Button>
                )}
                {root.manageOrders &&
                  bill.feeType === "OTHER" &&
                  bill.status !== "VOID" &&
                  Number(bill.confirmed) === 0 &&
                  Number(bill.pending) === 0 &&
                  Number(bill.offset) === 0 && (
                    <Button
                      type="link"
                      size="small"
                      onClick={() =>
                        openAction(
                          "作废其他费用",
                          [
                            {
                              key: "reason",
                              label: "作废原因",
                              type: "textarea",
                            },
                          ],
                          `/orders/${id}/fees/${bill.id}/void`,
                        )
                      }
                    >
                      {t("作废")}
                    </Button>
                  )}
              </Space>
            ),
          },
        ]}
        expandable={{
          showExpandColumn: false,
          expandedRowKeys: expanded,
          expandedRowRender: receipts,
          rowExpandable: (bill) => (bill.receipts?.length ?? 0) > 0,
        }}
      />
      {(row.rentRefunds?.length ?? 0) > 0 && (
        <OrderTable
          title="退租租金退款"
          rows={row.rentRefunds}
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
                root.finance &&
                remainingMoney(refund) > 0 &&
                refund.status !== "VOID" ? (
                  <Button
                    size="small"
                    onClick={() =>
                      openAction(
                        "登记租金退款",
                        [
                          {
                            key: "amount",
                            label: "退款金额（HKD）",
                            type: "money",
                            readOnly: true,
                          },
                          ...financialFields,
                        ],
                        `/expenses/${refund.id}/pay`,
                        {
                          amount: remainingMoney(refund),
                          paymentMethod: "BANK",
                        },
                        { sourceKey: crypto.randomUUID() },
                      )
                    }
                  >
                    {t("登记退款")}
                  </Button>
                ) : (
                  "—"
                ),
            },
          ]}
        />
      )}
    </div>
  );
}
