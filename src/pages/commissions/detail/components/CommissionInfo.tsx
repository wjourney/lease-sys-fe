import { EditOutlined } from "@ant-design/icons";
import { Button } from "antd";
import {
  FinanceFields,
  FinanceRecords,
  FinanceSummaryStrip,
  RelatedOrderPanel,
} from "../../../../components/finance-detail/FinanceDetailLayout";
import { useRecordDetail } from "../../../../components/resource-detail/DetailContext";
import { OperationActor } from "../../../../components/resource-detail/OperationActor";
import { dateText } from "../../../../shared/api";
import { formatMoney } from "../../../../shared/money-format";
import { t } from "../../../../shared/i18n";
import { Status } from "../../../../shared/ui";
import { RegisterCommissionPayment } from "../../RegisterCommissionPayment";

const text = (value: unknown) =>
  value == null || value === "" ? "—" : String(value);
const money = (value: string | number | null, currency = "HKD") =>
  value == null ? t("待填写") : formatMoney(value, currency);

export function CommissionSummary({
  editable,
  onEdit,
}: {
  editable: boolean;
  onEdit: () => void;
}) {
  const { row } = useRecordDetail();
  return (
    <FinanceSummaryStrip
      status={<Status value={row.status} resource="commissions" />}
      figures={[
        { label: "应付佣金", value: money(row.amount, row.currency) },
        { label: "已付金额", value: money(row.paidAmount, row.currency) },
      ]}
      actions={
        <>
          {editable && (
            <Button icon={<EditOutlined aria-hidden />} onClick={onEdit}>
              {t("编辑")}
            </Button>
          )}
          <RegisterCommissionPayment row={row} size="middle" />
        </>
      }
    />
  );
}

export function CommissionInfo() {
  const { row, root } = useRecordDetail();
  const order = row.orderSummary;
  return (
    <div className="commission-detail-info">
      <FinanceFields
        items={[
          { label: "销售公司", value: text(row.companyName) },
          { label: "销售员工", value: text(row.salesName) },
          {
            label: "结付方式",
            value: t(
              (
                {
                  MONTHLY: "单月佣金",
                  YEARLY: "按年结付",
                  ONE_TIME: "一次性结付",
                  RECURRING_MONTHLY: "按月结付",
                } as Record<string, string>
              )[row.mode] || "—",
            ),
          },
          { label: "预计结付日期", value: dateText(row.dueOn) },
          {
            label: "结算期间",
            value: `${dateText(row.periodStart)} ${t("至")} ${dateText(row.periodEnd)}`,
          },
          { label: "备注", value: text(row.remark) },
        ]}
      />
      <RelatedOrderPanel
        orderId={row.orderId}
        summary={order || { orderNo: row.orderNo }}
      />
      {root.finance && (
        <FinanceRecords
          title="付款记录"
          rows={row.paymentRecords || []}
          emptyText="暂无付款记录"
          columns={[
            {
              title: t("付款日期"),
              dataIndex: "paidOn",
              width: 120,
              render: dateText,
            },
            {
              title: t("金额"),
              width: 140,
              render: (_, record) => money(record.amount, record.currency),
            },
            { title: t("银行账户"), dataIndex: "accountName" },
            {
              title: t("方式"),
              dataIndex: "paymentMethod",
              width: 110,
              render: (value) =>
                t(
                  (
                    {
                      BANK: "银行转账",
                      CASH: "现金",
                      CHEQUE: "支票",
                    } as Record<string, string>
                  )[value] || "—",
                ),
            },
            {
              title: t("操作人"),
              width: 240,
              render: (_, record) => <OperationActor actor={record} />,
            },
          ]}
        />
      )}
    </div>
  );
}
