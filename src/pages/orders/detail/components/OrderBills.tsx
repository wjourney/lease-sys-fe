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
  const { id, row, root, openAction, run, setMaterial, modal } = ctx;
  const bills: Row[] = row.bills ?? [];
  const active = bills.filter((b) => b.status !== "VOID");
  function receipt(b: Row) {
    const p = row.initialPayment ?? {};
    const filled = b.feeType === "DEPOSIT" ? p.depositReceived : p.rentReceived;
    openAction(
      "登记收款",
      [
        { key: "amount", label: "本次收款金额", type: "money" },
        { key: "receivedOn", label: "到账日期", type: "date" },
        ...financialFields.filter((f) => f.key !== "paidOn"),
        { key: "payerName", label: "付款方" },
        { key: "remark", label: "说明", type: "textarea", required: false },
      ],
      `/incomes/${b.id}/receipts`,
      {
        amount: String(
          Math.min(Number(b.available), Number(filled) || Number(b.available)),
        ),
        receivedOn: p.receivedOn,
        payerName: row.tenantName,
        paymentMethod: "BANK",
      },
      { sourceKey: crypto.randomUUID() },
    );
  }
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
    { title: t("待确认"), dataIndex: "pending", render: amount },
    { title: t("剩余应收"), dataIndex: "remaining", render: amount },
    { title: t("到期日期"), dataIndex: "dueOn", render: dateText },
    {
      title: t("状态"),
      dataIndex: "status",
      render: (s: string) => <Status value={s} />,
    },
    {
      title: t("操作"),
      render: (_: unknown, b: Row) => (
        <Space wrap>
          {b.status !== "VOID" &&
            Number(b.available) > 0 &&
            !(b.feeType === "DEPOSIT" && row.depositSettledAt) &&
            row.status !== "CLOSED" && (
              <Button size="small" type="primary" onClick={() => receipt(b)}>
                {t("登记收款")}
              </Button>
            )}
          {root.finance && b.status !== "VOID" && b.feeType !== "DEPOSIT" && (
            <Button
              size="small"
              onClick={() =>
                openAction(
                  "调整应收",
                  [
                    { key: "amount", label: "调整后的应收总额", type: "money" },
                    { key: "reason", label: "调整原因", type: "textarea" },
                  ],
                  `/incomes/${b.id}/adjust`,
                  { amount: b.total },
                  { revision: b.revision },
                )
              }
            >
              {t("财务调整")}
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
          render: (_: unknown, r: Row) => (
            <Space wrap>
              {root.finance && r.status === "PENDING" && (
                <>
                  <Button
                    size="small"
                    type="primary"
                    onClick={() =>
                      modal.confirm({
                        title: t("确认已核对实际到账？"),
                        content: amount(r.amount),
                        onOk: () => run(`/incomes/${r.id}/confirm`),
                      })
                    }
                  >
                    {t("确认到账")}
                  </Button>
                  <Button
                    size="small"
                    onClick={() =>
                      openAction(
                        "驳回收款",
                        [
                          {
                            key: "reason",
                            label: "驳回原因",
                            type: "textarea",
                          },
                        ],
                        `/incomes/${r.id}/reject`,
                      )
                    }
                  >
                    {t("驳回")}
                  </Button>
                </>
              )}
              {(root.canWrite("materials") || r.status === "PENDING") && (
                <Button
                  size="small"
                  onClick={() => setMaterial({ incomeId: r.id })}
                >
                  {t("上传凭证")}
                </Button>
              )}
            </Space>
          ),
        },
      ]}
    />
  );
  const p = row.initialPayment;
  const paymentDeclaration = p?.paid
    ? p.paymentState === "PARTIAL"
      ? "已填报部分付款"
      : p.paymentState === "PAID"
        ? "已填报首期租金及押金付款"
        : p.rentPaid && p.depositPaid
          ? "已填报首期租金及押金付款"
          : p.rentPaid
            ? "已填报首期租金付款"
            : "已填报押金付款"
    : "未付款";
  const declaration =
    p && Object.keys(p).length > 0 ? (
      <div className="mt-2 rounded-md border border-[#e5eaf0] px-4 py-3 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <strong className="text-[#263650]">{t("录单时的首期填报")}</strong>
          <span className="text-[#8793a4]">{t(paymentDeclaration)}</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-[#64748b]">
          <span>
            {t("填报租金")}：{amount(p.rentReceived ?? 0)}
          </span>
          <span>
            {t("填报押金")}：{amount(p.depositReceived ?? 0)}
          </span>
          <span>
            {t("填报到账日期")}：{dateText(p.receivedOn)}
          </span>
          <span>{t("仅为录单声明，不代表财务确认")}</span>
        </div>
      </div>
    ) : undefined;
  return (
    <div className="flex flex-col gap-4">
      <OrderTable
        title="本订单账单"
        rows={bills}
        columns={columns}
        summary={
          <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-[#52627a]">
            <span>
              {t("应收")}{" "}
              <strong className="text-[#263650]">{sum("total")}</strong>
            </span>
            <span>
              {t("已确认到账")}{" "}
              <strong className="text-[#263650]">{sum("confirmed")}</strong>
            </span>
            <span>
              {t("待确认到账")}{" "}
              <strong className="text-[#263650]">{sum("pending")}</strong>
            </span>
          </div>
        }
        expandable={{
          expandedRowRender: receipts,
          rowExpandable: (b) => (b.receipts?.length ?? 0) > 0,
        }}
        supplementary={declaration}
        actions={
          root.canWrite("incomes") && row.status !== "CLOSED" ? (
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
                  "/incomes",
                  {},
                  {
                    orderId: id,
                    feeType: "OTHER",
                    payerName: row.tenantName,
                    payerEmail: row.tenantEmail || undefined,
                  },
                )
              }
            >
              {t("新增其他费用")}
            </Button>
          ) : null
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
