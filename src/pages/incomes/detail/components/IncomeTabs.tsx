import { Card, Table, TabsProps } from "antd";
import { DetailContextValue } from "../../../../components/resource-detail/DetailContext";
import { amount, dateText, Row } from "../../../../shared/api";
import { t } from "../../../../shared/i18n";
import { Status } from "../../../../shared/ui";
import { ReceiptActions } from "../../../../components/receipts/ReceiptActions";
export function getIncomeTabs(
  ctx: DetailContextValue,
): NonNullable<TabsProps["items"]> {
  if (ctx.resource !== "incomes") return [];
  return [
    {
      key: "receipts",
      label: `收款记录 (${ctx.receipts.length})`,
      children: (
        <Card title={t("收款明细")}>
          <Table<Row>
            rowKey="id"
            pagination={false}
            dataSource={ctx.receipts}
            columns={[
              { title: t("收款编号"), dataIndex: "recordNo" },
              { title: t("金额"), dataIndex: "amount", render: amount },
              {
                title: t("到账日期"),
                dataIndex: "receivedOn",
                render: dateText,
              },
              {
                title: t("状态"),
                dataIndex: "status",
                render: (s) => <Status value={s} />,
              },
              {
                title: t("操作"),
                render: (_, r) => <ReceiptActions receipt={r} />,
              },
            ]}
          />
        </Card>
      ),
    },
  ];
}
