import { Status } from "../../../../shared/ui";
import { Alert, Button, Card, Space, Steps, Table, Tag } from "antd";
import { useState } from "react";
import { useRecordDetail } from "../../../../components/resource-detail/DetailContext";
import { financialFields } from "../../../../components/resource-detail/financial-fields";
import { amount, dateText, Row } from "../../../../shared/api";
import { t } from "../../../../shared/i18n";
import {
  depositDisplayLabel,
  depositStage,
  depositStages,
} from "../order-state";
import { DepositSettlementForm } from "./DepositSettlementForm";

function Figure({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="min-w-0">
      <div className="text-sm text-[#8793a4]">{t(label)}</div>
      <strong className="mt-1 block text-base font-semibold text-[#263650]">
        {amount(value)}
      </strong>
    </div>
  );
}

export function OrderDepositSummary() {
  const { row, root, openAction, run, modal, setMaterial, setTab } =
    useRecordDetail();
  const [settling, setSettling] = useState(false);
  const [showDeductions, setShowDeductions] = useState(false);
  const d = row.deposit;
  if (row.status === "DRAFT")
    return (
      <Card title={t("押金管理")}>
        {t("完善单位和租金后生成押金账单，再登记实际收款。")}
      </Card>
    );
  if (!d)
    return (
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <Card title={t("押金概况")} className="!border-[#e5eaf0]">
          <div className="grid grid-cols-2 gap-5">
            <Figure label="约定押金" value={row.depositAmount} />
            <div>
              <div className="text-sm text-[#8793a4]">{t("已确认收取")}</div>
              <strong className="mt-1 block text-base font-semibold text-[#263650]">
                —
              </strong>
            </div>
          </div>
          <Alert
            className="mt-5"
            type="info"
            message={t("押金收款与结算数据暂不可用，请稍后重试。")}
          />
        </Card>
        <Card title={t("押金收款记录")} className="!border-[#e5eaf0]">
          <Button type="link" onClick={() => setTab("bills")}>
            {t("查看收款与账单")}
          </Button>
        </Card>
      </div>
    );

  const receipts: Row[] = (row.bills ?? [])
    .filter((bill: Row) => bill.feeType === "DEPOSIT" && bill.status !== "VOID")
    .flatMap((bill: Row) => bill.receipts ?? []);
  const refundTotal = Math.max(0, Number(d.received) - Number(d.deduction));
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
  const settled = Boolean(row.depositSettledAt);
  const refunds: Row[] = d.refunds ?? [];

  return (
    <div className="flex flex-col gap-4">
      {d.state !== "CLOSED" && (
        <div className="overflow-x-auto rounded-lg border border-[#e5eaf0] bg-white px-5 py-4">
          <Steps
            size="small"
            current={depositStage(row)}
            items={depositStages.map((stage) => ({ title: t(stage) }))}
            className="min-w-[660px]"
          />
        </div>
      )}

      {!settled ? (
        <div className="grid items-start gap-4 lg:grid-cols-2">
          <Card
            title={t("押金概况")}
            extra={
              <Space>
                <Tag color={d.state === "COLLECTING" ? "gold" : "blue"}>
                  {t(depositDisplayLabel(row))}
                </Tag>
                {row.actions?.settle && (
                  <Button type="primary" onClick={() => setSettling(true)}>
                    {t("办理押金结算")}
                  </Button>
                )}
              </Space>
            }
            className="!border-[#e5eaf0] [&_.ant-card-head]:!min-h-14 [&_.ant-card-body]:!p-6"
          >
            <div className="grid grid-cols-2 gap-5">
              <Figure label="约定押金" value={d.agreed} />
              <Figure label="已确认收取" value={d.received} />
              {Number(d.pending) > 0 && (
                <Figure label="历史待确认收款" value={d.pending} />
              )}
              <Figure label="当前持有" value={d.held} />
            </div>
            <p className="mb-0 mt-5 border-t border-[#edf0f4] pt-4 text-sm text-[#738198]">
              {t(
                d.state === "COLLECTING" && Number(d.pending) === 0
                  ? "请在押金账单登记实际收款，提交后直接入账。"
                  : Number(d.pending) > 0
                    ? "存在历史待确认记录，请先处理；新登记收款直接入账。"
                    : d.state === "SETTLEMENT_PENDING"
                      ? "单位已交还，请核对扣款并办理押金结算。"
                      : "租赁结束并确认交还后，可办理押金结算与退款。",
              )}
            </p>
          </Card>
          <Card
            title={t("押金收款记录")}
            extra={
              <Button type="link" onClick={() => setTab("bills")}>
                {t("查看账单")}
              </Button>
            }
            className="!border-[#e5eaf0] [&_.ant-card-head]:!min-h-14 [&_.ant-card-body]:!px-5 [&_.ant-card-body]:!py-3"
          >
            <Table<Row>
              size="small"
              rowKey="id"
              pagination={false}
              scroll={{ x: "max-content" }}
              dataSource={receipts}
              locale={{ emptyText: t("暂无押金收款记录") }}
              columns={[
                {
                  title: t("收款日期"),
                  dataIndex: "receivedOn",
                  render: dateText,
                },
                { title: t("金额"), dataIndex: "amount", render: amount },
                {
                  title: t("状态"),
                  render: (_, receipt) => <Status value={receipt.status} />,
                },
                {
                  title: t("操作"),
                  render: (_, receipt) => (
                    <Space size={4}>
                      {root.finance && receipt.status === "PENDING" && (
                        <>
                          <Button
                            size="small"
                            type="link"
                            onClick={() =>
                              modal.confirm({
                                title: t("确认已核对实际到账？"),
                                content: amount(receipt.amount),
                                onOk: () =>
                                  run(`/incomes/${receipt.id}/confirm`),
                              })
                            }
                          >
                            {t("确认到账")}
                          </Button>
                          <Button
                            size="small"
                            type="link"
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
                                `/incomes/${receipt.id}/reject`,
                              )
                            }
                          >
                            {t("驳回")}
                          </Button>
                        </>
                      )}
                      {root.canWrite("materials") && (
                        <Button
                          size="small"
                          type="link"
                          onClick={() => setMaterial({ incomeId: receipt.id })}
                        >
                          {t("凭证")}
                        </Button>
                      )}
                    </Space>
                  ),
                },
              ]}
            />
          </Card>
        </div>
      ) : (
        <>
          <Card
            title={t("押金结算")}
            extra={
              <Tag color={Number(d.refundDue) > 0 ? "gold" : "green"}>
                {t(depositDisplayLabel(row))}
              </Tag>
            }
            className="!border-[#e5eaf0] [&_.ant-card-head]:!min-h-14 [&_.ant-card-body]:!p-6"
          >
            <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-4 max-[640px]:grid-cols-1">
              <Figure label="已确认收取" value={d.received} />
              <span className="text-xl text-[#a1aab8] max-[640px]:hidden">
                −
              </span>
              <Figure label="扣款" value={d.deduction} />
              <span className="text-xl text-[#a1aab8] max-[640px]:hidden">
                =
              </span>
              <Figure label="应退" value={refundTotal} />
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-[#edf0f4] pt-4 text-sm text-[#738198]">
              <span>
                {t("结算说明")}：{t(row.depositDeductionReason || "无扣款")}
              </span>
              {deductions.length > 0 && (
                <Button
                  type="link"
                  size="small"
                  onClick={() => setShowDeductions((v) => !v)}
                >
                  {t(showDeductions ? "收起扣款明细" : "查看扣款明细")}
                </Button>
              )}
            </div>
            {showDeductions && (
              <Table<Row>
                size="small"
                className="mt-3"
                rowKey={(_, i) => String(i)}
                pagination={false}
                dataSource={deductions}
                scroll={{ x: "max-content" }}
                columns={[
                  { title: t("扣款项目"), dataIndex: "label" },
                  { title: t("金额"), dataIndex: "amount", render: amount },
                  { title: t("原因"), dataIndex: "note" },
                  {
                    title: t("关联账单"),
                    dataIndex: "incomeId",
                    render: (value) =>
                      row.bills?.find((bill: Row) => bill.id === value)
                        ?.recordNo || "—",
                  },
                ]}
              />
            )}
          </Card>
          {root.canRead("expenses") && (
            <Card
              title={t("押金退款")}
              className="!border-[#e5eaf0] [&_.ant-card-head]:!min-h-14 [&_.ant-card-body]:!px-5 [&_.ant-card-body]:!py-3"
            >
              {refunds.length === 0 ? (
                <p className="m-0 py-3 text-sm text-[#738198]">
                  {t("押金已结清，无需退款。")}
                </p>
              ) : (
                <>
                  <Table<Row>
                    size="small"
                    rowKey="id"
                    dataSource={refunds}
                    pagination={false}
                    scroll={{ x: "max-content" }}
                    columns={[
                      { title: t("退款单"), dataIndex: "expenseNo" },
                      { title: t("应退"), dataIndex: "amount", render: amount },
                      {
                        title: t("已退"),
                        dataIndex: "paidAmount",
                        render: amount,
                      },
                      {
                        title: t("待退"),
                        render: (_, refund) =>
                          amount(
                            Math.max(
                              0,
                              Number(refund.amount) - Number(refund.paidAmount),
                            ),
                          ),
                      },
                      {
                        title: t("状态"),
                        render: (_, refund) => (
                          <Tag
                            color={refund.status === "PAID" ? "green" : "gold"}
                          >
                            {t(
                              refund.status === "PAID"
                                ? "已退清"
                                : Number(refund.paidAmount) > 0
                                  ? "部分退款"
                                  : "待退款",
                            )}
                          </Tag>
                        ),
                      },
                      {
                        title: t("操作"),
                        render: (_, refund) => (
                          <Space size={4}>
                            {root.finance &&
                              Number(refund.amount) >
                                Number(refund.paidAmount) && (
                                <Button
                                  type="primary"
                                  size="small"
                                  onClick={() =>
                                    openAction(
                                      "登记押金退款",
                                      [
                                        {
                                          key: "amount",
                                          label: "本次退款金额",
                                          type: "money",
                                        },
                                        ...financialFields,
                                      ],
                                      `/expenses/${refund.id}/pay`,
                                      {
                                        amount: String(
                                          (Math.round(
                                            Number(refund.amount) * 100,
                                          ) -
                                            Math.round(
                                              Number(refund.paidAmount) * 100,
                                            )) /
                                            100,
                                        ),
                                        paymentMethod: "BANK",
                                      },
                                      { sourceKey: crypto.randomUUID() },
                                    )
                                  }
                                >
                                  {t("登记退款")}
                                </Button>
                              )}
                            {root.canWrite("materials") && (
                              <Button
                                type="link"
                                size="small"
                                onClick={() =>
                                  setMaterial({ expenseId: refund.id })
                                }
                              >
                                {t("上传凭证")}
                              </Button>
                            )}
                          </Space>
                        ),
                      },
                    ]}
                    expandable={{
                      rowExpandable: (refund) =>
                        (refund.paymentRecords?.length ?? 0) > 0,
                      expandedRowRender: (refund) => (
                        <Table<Row>
                          size="small"
                          pagination={false}
                          rowKey={(_, i) => String(i)}
                          dataSource={refund.paymentRecords}
                          columns={[
                            {
                              title: t("金额"),
                              dataIndex: "amount",
                              render: amount,
                            },
                            {
                              title: t("付款日期"),
                              dataIndex: "paidOn",
                              render: dateText,
                            },
                            { title: t("流水号"), dataIndex: "bankReference" },
                            { title: t("经办人"), dataIndex: "operator" },
                          ]}
                        />
                      ),
                    }}
                  />
                  <p className="mt-2 text-sm text-[#738198]">
                    {t(
                      "登记实际付款后更新退款进度；分次退款显示累计已退与剩余待退。",
                    )}
                  </p>
                </>
              )}
            </Card>
          )}
        </>
      )}
      {settling && <DepositSettlementForm onClose={() => setSettling(false)} />}
    </div>
  );
}
