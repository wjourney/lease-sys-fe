import { ReceiptActions } from "../../../../components/receipts/ReceiptActions";
import { RegisterReceipt } from "../../../../components/receipts/RegisterReceipt";
import { Button, Card, Space, Table, Tag } from "antd";
import { useRecordDetail } from "../../../../components/resource-detail/DetailContext";
import { financialFields } from "../../../../components/resource-detail/financial-fields";
import { amount, dateText, Row } from "../../../../shared/api";
import { t } from "../../../../shared/i18n";
import { Status } from "../../../../shared/ui";
import { OrderTable } from "./OrderTable";
import { cents } from "../order-state";
export function OrderBills() {
  const ctx = useRecordDetail();
  const { id, row, root, openAction } = ctx;
  const bills: Row[] = row.bills ?? [];
  const active = bills.filter((b) => b.status !== "VOID");
  const sum = (key: string, items = active) =>
    amount(items.reduce((n, b) => n + cents(b[key]), 0) / 100);
  const columns = [
    {
      title: t("账单 / 类型"),
      dataIndex: "recordNo",
      render: (v: string, b: Row) => (
        <>
          <div>{v}</div>
          <small>
            {t(
              ({ RENT: "租金", DEPOSIT: "押金", OTHER: "其他费用" } as Row)[
                b.feeType
              ] || b.feeType,
            )}
          </small>
        </>
      ),
    },
    { title: t("应收"), dataIndex: "total", render: amount },
    { title: t("已确认到账"), dataIndex: "confirmed", render: amount },
    { title: t("押金抵扣"), dataIndex: "offset", render: amount },
    { title: t("剩余应收"), dataIndex: "remaining", render: amount },
    { title: t("到期日期"), dataIndex: "dueOn", render: dateText },
    {
      title: t("状态"),
      dataIndex: "status",
      render: (s: string) => <Status value={s} resource="incomes" />,
    },
    {
      title: t("操作"),
      render: (_: unknown, b: Row) => (
        <Space wrap>
          {b.status !== "VOID" &&
            Number(b.available) > 0 &&
            !(b.feeType === "DEPOSIT" && row.depositSettledAt) &&
            row.status !== "CLOSED" && (
              <RegisterReceipt
                bills={[b]}
                orderId={id}
                payerName={row.tenantName}
              />
            )}
          {root.manageOrders &&
            b.feeType === "OTHER" &&
            b.status !== "VOID" &&
            Number(b.confirmed) === 0 &&
            Number(b.pending) === 0 &&
            Number(b.offset) === 0 && (
              <Button
                size="small"
                onClick={() =>
                  openAction(
                    "作废其他费用",
                    [{ key: "reason", label: "作废原因", type: "textarea" }],
                    `/orders/${id}/fees/${b.id}/void`,
                  )
                }
              >
                {t("作废")}
              </Button>
            )}
        </Space>
      ),
    },
  ];
  const receipts = (b: Row) => (
    <Table<Row>
      size="small"
      rowKey="id"
      pagination={false}
      dataSource={b.receipts ?? []}
      columns={[
        { title: t("收款编号"), dataIndex: "recordNo" },
        { title: t("金额"), dataIndex: "amount", render: amount },
        { title: t("到账日期"), dataIndex: "receivedOn", render: dateText },
        {
          title: t("状态"),
          dataIndex: "status",
          render: (v: string) => <Status value={v} />,
        },
        {
          title: t("操作"),
          render: (_: unknown, r: Row) => <ReceiptActions receipt={r} />,
        },
      ]}
    />
  );
  return (
    <div className="flex flex-col gap-4">
      <OrderTable
        title="本订单账单"
        rows={bills}
        columns={columns}
        summary={
          <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-[#52627a]">
            <span>
              {t("押金已收")}{" "}
              <strong>
                {sum(
                  "confirmed",
                  active.filter((b) => b.feeType === "DEPOSIT"),
                )}
              </strong>
            </span>
            <span>
              {t("租金及其他应收")}{" "}
              <strong className="text-[#263650]">
                {sum(
                  "total",
                  active.filter((b) => b.feeType !== "DEPOSIT"),
                )}
              </strong>
            </span>
            <span>
              {t("租金及其他已收")}{" "}
              <strong className="text-[#263650]">
                {sum(
                  "confirmed",
                  active.filter((b) => b.feeType !== "DEPOSIT"),
                )}
              </strong>
            </span>
          </div>
        }
        supplementary={
          row.initialPayment?.paid &&
          !bills.some((b) =>
            (b.receipts ?? []).some(
              (r: Row) =>
                r.sourceKey?.startsWith("initial:") ||
                ["PENDING", "CONFIRMED"].includes(r.status),
            ),
          ) ? (
            <p className="text-sm text-[#738198]">
              {t(
                "历史录单中曾填报付款，但当前没有有效收款记录。请核对实际到账，补齐银行账户后登记收款。",
              )}
            </p>
          ) : undefined
        }
        expandable={{
          expandedRowRender: receipts,
          rowExpandable: (b) => (b.receipts?.length ?? 0) > 0,
        }}
        actions={
          <Space>
            {row.status !== "CLOSED" && (
              <RegisterReceipt
                bills={active.filter(
                  (b) => !(b.feeType === "DEPOSIT" && row.depositSettledAt),
                )}
                orderId={id}
                payerName={row.tenantName}
              />
            )}
            {root.manageOrders && !["DRAFT", "CLOSED"].includes(row.status) ? (
              <Button
                type="primary"
                onClick={() =>
                  openAction(
                    "新增其他费用",
                    [
                      { key: "amount", label: "应收金额", type: "money" },
                      { key: "dueOn", label: "到期日期", type: "date" },
                      { key: "remark", label: "费用说明", type: "textarea" },
                    ],
                    `/orders/${id}/fees`,
                    {},
                    {
                      sourceKey: crypto.randomUUID(),
                    },
                  )
                }
              >
                {t("新增其他费用")}
              </Button>
            ) : null}
          </Space>
        }
      />
      {(row.rentRefunds?.length ?? 0) > 0 && (
        <Card title={t("退租租金退款")}>
          <Table<Row>
            rowKey="id"
            pagination={false}
            dataSource={row.rentRefunds}
            columns={[
              { title: t("退款单"), dataIndex: "expenseNo" },
              { title: t("金额"), dataIndex: "amount", render: amount },
              {
                title: t("状态"),
                dataIndex: "status",
                render: (s) => <Status value={s} />,
              },
              {
                title: t("操作"),
                render: (_, r) =>
                  root.finance && r.status === "UNPAID" ? (
                    <Button
                      onClick={() =>
                        openAction(
                          "登记租金退款",
                          financialFields,
                          `/expenses/${r.id}/pay`,
                          { paymentMethod: "BANK" },
                        )
                      }
                    >
                      {t("登记付款")}
                    </Button>
                  ) : (
                    <Tag>{t(r.status === "PAID" ? "已付款" : "待付款")}</Tag>
                  ),
              },
            ]}
          />
        </Card>
      )}
    </div>
  );
}
