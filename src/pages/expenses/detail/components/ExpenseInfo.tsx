import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { Button, Tooltip } from "antd";
import {
  FinanceFields,
  FinanceRecords,
  FinanceSummaryStrip,
  RelatedOrderPanel,
} from "../../../../components/finance-detail/FinanceDetailLayout";
import { useRecordDetail } from "../../../../components/resource-detail/DetailContext";
import { OperationActor } from "../../../../components/resource-detail/OperationActor";
import { dateText } from "../../../../shared/api";
import { t } from "../../../../shared/i18n";
import { formatMoney } from "../../../../shared/money-format";
import { Status } from "../../../../shared/ui";
import { ExpenseActions } from "./ExpenseActions";
import { ExpenseFiles } from "./ExpenseFiles";

const feeTypes: Record<string, string> = {
  MAINTENANCE: "维修费用",
  MANAGEMENT: "管理费用",
  OTHER: "其他费用",
  COMMISSION: "佣金",
  DEPOSIT_REFUND: "押金退款",
  RENT_REFUND: "租金退款",
};

export function ExpenseSummary({
  editable,
  onEdit,
  onDelete,
}: {
  editable: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { row, root } = useRecordDetail();
  const reason = "已付款或自动生成的支出不能编辑、删除";
  const write = root.canWrite("expenses");
  return (
    <FinanceSummaryStrip
      status={<Status resource="expenses" value={row.status} />}
      figures={[
        {
          label: "应付金额",
          value: formatMoney(row.amount, row.currency || "HKD"),
        },
        {
          label: "实付金额",
          value: formatMoney(row.paidAmount, row.currency || "HKD"),
        },
      ]}
      actions={
        <>
          {write && (
            <Tooltip title={!editable ? t(reason) : undefined}>
              <span>
                <Button
                  icon={<EditOutlined aria-hidden />}
                  disabled={!editable}
                  onClick={onEdit}
                >
                  {t("编辑支出")}
                </Button>
              </span>
            </Tooltip>
          )}
          {write && (
            <Tooltip title={!editable ? t(reason) : undefined}>
              <span>
                <Button
                  danger
                  icon={<DeleteOutlined aria-hidden />}
                  disabled={!editable}
                  onClick={onDelete}
                >
                  {t("删除支出")}
                </Button>
              </span>
            </Tooltip>
          )}
          <ExpenseActions />
        </>
      }
    />
  );
}

export function ExpenseInfo() {
  const { row, root } = useRecordDetail();
  const paymentMethod: Record<string, string> = {
    BANK: "银行转账",
    CASH: "现金",
    CHEQUE: "支票",
  };
  return (
    <div className="finance-detail-body">
      <FinanceFields
        items={[
          {
            label: "支出来源",
            value:
              row.commissionId || row.feeType === "COMMISSION"
                ? t("佣金自动生成")
                : row.feeType?.includes("REFUND")
                  ? t("退款自动生成")
                  : t("手动创建"),
          },
          {
            label: "支出类型",
            value: t(feeTypes[row.feeType] || row.feeType || "—"),
          },
          { label: "收款方", value: row.payeeName || "—" },
          { label: "到期日期", value: dateText(row.dueOn) },
          { label: "说明", value: row.remark || "—" },
          { label: "创建日期", value: dateText(row.createdAt) },
        ]}
      />
      <RelatedOrderPanel
        orderId={row.orderId}
        summary={{
          orderNo: row.orderNo,
          projectName: row.projectName,
          unitNo: row.unitNo,
        }}
      />
      {root.finance && (
        <FinanceRecords
          title="付款记录"
          rows={row.paymentRecords || []}
          emptyText="暂无付款记录"
          columns={[
            { title: t("付款日期"), dataIndex: "paidOn", render: dateText },
            {
              title: t("金额"),
              dataIndex: "amount",
              render: (value) => formatMoney(value, row.currency || "HKD"),
            },
            { title: t("银行账户"), dataIndex: "accountName" },
            {
              title: t("方式"),
              dataIndex: "paymentMethod",
              render: (value) => t(paymentMethod[value] || value || "—"),
            },
            {
              title: t("操作人"),
              render: (_, record) => <OperationActor actor={record} />,
            },
          ]}
        />
      )}
      <ExpenseFiles />
    </div>
  );
}
