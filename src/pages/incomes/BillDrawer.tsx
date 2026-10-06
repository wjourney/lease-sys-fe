import {
  Alert,
  Button,
  Descriptions,
  Drawer,
  Empty,
  Space,
  Spin,
  Table,
  Tabs,
  Tag,
  Timeline,
} from "antd";
import { observer } from "mobx-react-lite";
import { Link } from "react-router-dom";
import { ReceiptActions } from "../../components/receipts/ReceiptActions";
import { RegisterReceipt } from "../../components/receipts/RegisterReceipt";
import { dateText, Row } from "../../shared/api";
import { dateTimeText } from "../../shared/date-time";
import { t } from "../../shared/i18n";
import { Status } from "../../shared/ui";
import { useRoot } from "../../stores/root";
import { formatMoney } from "../finance/finance-data";
import { billTypes, useBillRequest } from "./bill-data";

export function BillStatus({ row }: { row: Row }) {
  return (
    <Space size={4} wrap>
      <Status resource="incomes" value={row.status} />
      {row.overdue && <Tag color="red">{t("逾期")}</Tag>}
      {Number(row.pending) > 0 && <Tag color="blue">{t("待核对")}</Tag>}
    </Space>
  );
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
  const money = (v: string) => formatMoney(v, row?.currency || "HKD");
  return (
    <Drawer
      open
      width={940}
      title={t("账单详情")}
      onClose={onClose}
      footer={
        row && !error ? (
          <Space>
            {!loading && row.canRegister && (
              <RegisterReceipt
                bills={[row]}
                orderId={row.orderId}
                payerName={row.payerName}
              />
            )}
            {row.orderId && (
              <Link to={`/orders/${row.orderId}`} onClick={onClose}>
                <Button>{t("查看订单")}</Button>
              </Link>
            )}
          </Space>
        ) : null
      }
    >
      {error ? (
        <Alert
          type="error"
          showIcon
          message={error}
          action={<Button onClick={reload}>{t("重试")}</Button>}
        />
      ) : (
        <Spin spinning={loading}>
          {row && (
            <>
              <div className="mb-5 flex items-center justify-between gap-3">
                <strong>{row.recordNo}</strong>
                <BillStatus row={row} />
              </div>
              <Descriptions
                size="small"
                column={2}
                items={[
                  {
                    key: "order",
                    label: t("关联订单"),
                    children: row.orderId ? (
                      <Link to={`/orders/${row.orderId}`}>{row.orderNo}</Link>
                    ) : (
                      "—"
                    ),
                  },
                  {
                    key: "unit",
                    label: t("项目 / 单位"),
                    children: `${row.projectName || "—"} · ${row.unitNo || "—"}`,
                  },
                  { key: "payer", label: t("租客"), children: row.payerName },
                  {
                    key: "type",
                    label: t("账单类型"),
                    children: t(billTypes[row.feeType] || row.feeType),
                  },
                  {
                    key: "period",
                    label: t("账期"),
                    children: row.periodStart
                      ? `${dateText(row.periodStart)} ~ ${dateText(row.periodEnd)}`
                      : "—",
                  },
                  {
                    key: "due",
                    label: t("到期日期"),
                    children: dateText(row.dueOn),
                  },
                  {
                    key: "remark",
                    label: t("费用说明"),
                    children: row.remark || "—",
                    span: 2,
                  },
                ]}
              />
              <div className="bill-detail-summary my-5">
                {[
                  ["应收", "total"],
                  ["已确认收款", "confirmed"],
                  ["待核对", "pending"],
                  ["押金抵扣", "offset"],
                  ["剩余应收", "remaining"],
                ].map(([label, key]) => (
                  <div key={key}>
                    <span>{t(label)}</span>
                    <strong>{money(row[key])}</strong>
                  </div>
                ))}
              </div>
              <Tabs
                items={[
                  {
                    key: "receipts",
                    label: t(`收款记录（${row.receipts?.length || 0}）`),
                    children: (
                      <Table<Row>
                        size="small"
                        rowKey="id"
                        pagination={false}
                        dataSource={row.receipts || []}
                        scroll={{ x: 850 }}
                        columns={[
                          {
                            title: t("收款编号"),
                            dataIndex: "recordNo",
                            width: 190,
                          },
                          {
                            title: t("金额"),
                            dataIndex: "amount",
                            render: money,
                          },
                          {
                            title: t("到账日期"),
                            dataIndex: "receivedOn",
                            render: dateText,
                          },
                          { title: t("平台账户"), dataIndex: "accountName" },
                          {
                            title: t("付款方式"),
                            dataIndex: "paymentMethod",
                            render: (v) =>
                              t(
                                (
                                  {
                                    BANK: "银行转账",
                                    CASH: "现金",
                                    CHEQUE: "支票",
                                  } as Row
                                )[v] ||
                                  v ||
                                  "—",
                              ),
                          },
                          {
                            title: t("状态"),
                            dataIndex: "status",
                            render: (v) => (
                              <Status value={v} resource="receipts" />
                            ),
                          },
                          {
                            title: t("凭证 / 操作"),
                            render: (_, receipt) => (
                              <ReceiptActions receipt={receipt} />
                            ),
                          },
                        ]}
                      />
                    ),
                  },
                  {
                    key: "offsets",
                    label: t("抵扣记录"),
                    children: (
                      <Table<Row>
                        rowKey="id"
                        size="small"
                        pagination={false}
                        dataSource={row.offsets || []}
                        columns={[
                          {
                            title: t("日期"),
                            dataIndex: "date",
                            render: dateText,
                          },
                          {
                            title: t("抵扣金额"),
                            dataIndex: "amount",
                            render: money,
                          },
                          {
                            title: t("来源"),
                            render: () => (
                              <Link to={`/orders/${row.orderId}`}>
                                {t("本订单押金结算")}
                              </Link>
                            ),
                          },
                          { title: t("操作人"), dataIndex: "actorName" },
                          { title: t("说明"), dataIndex: "reason" },
                        ]}
                      />
                    ),
                  },
                  {
                    key: "operations",
                    label: t("操作记录"),
                    children: row.operations?.length ? (
                      <Timeline
                        items={row.operations.map((log: Row) => ({
                          key: log.eventId,
                          children: (
                            <div>
                              <strong>{log.actorName || t("系统")}</strong> ·{" "}
                              {dateTimeText(log.operatedAt)}
                              <div>
                                {log.subject || row.recordNo} ·{" "}
                                {t(
                                  log.action === "CREATE"
                                    ? "创建"
                                    : log.action === "DELETE"
                                      ? "删除"
                                      : "更新",
                                )}
                              </div>
                              <div>{log.reason || "—"}</div>
                            </div>
                          ),
                        }))}
                      />
                    ) : (
                      <Empty description={t("暂无操作记录")} />
                    ),
                  },
                ]}
              />
            </>
          )}
        </Spin>
      )}
    </Drawer>
  );
});
