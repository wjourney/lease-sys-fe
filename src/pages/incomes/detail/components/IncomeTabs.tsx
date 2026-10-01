import { Button, Card, Space, Table, TabsProps } from "antd";
import { DetailContextValue } from "../../../../components/resource-detail/DetailContext";
import { amount, dateText, Row } from "../../../../shared/api";
import { t } from "../../../../shared/i18n";
import { Status } from "../../../../shared/ui";
export function getIncomeTabs(
  ctx: DetailContextValue,
): NonNullable<TabsProps["items"]> {
  const { resource, receipts, root, run, openAction, setMaterial, navigate } =
    ctx;
  const tabs: NonNullable<TabsProps["items"]> = [];
  if (resource === "incomes")
    tabs.push({
      key: "receipts",
      label: `收款记录 (${receipts.length})`,
      children: (
        <Card title={t("收款明细")}>
          <Table
            rowKey="id"
            pagination={false}
            dataSource={receipts}
            columns={[
              {
                title: t("收款编号"),
                dataIndex: "recordNo",
              },
              {
                title: t("金额"),
                dataIndex: "amount",
                render: (v) => amount(v),
              },
              {
                title: t("收款日期"),
                dataIndex: "receivedOn",
                render: dateText,
              },
              {
                title: t("状态"),
                dataIndex: "status",
                render: (v) => <Status value={v} />,
              },
              {
                title: t("操作"),
                render: (_: any, r: Row) => (
                  <Space wrap>
                    {r.status === "PENDING" && root.finance && (
                      <>
                        <Button
                          size="small"
                          type="primary"
                          onClick={() => run(`/incomes/${r.id}/confirm`)}
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
                                  label: t("驳回原因"),
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
                    <Button
                      size="small"
                      onClick={() =>
                        setMaterial({
                          incomeId: r.id,
                        })
                      }
                    >
                      {t("上传凭证")}
                    </Button>
                    <Button
                      size="small"
                      onClick={() => navigate("/materials?incomeId=" + r.id)}
                    >
                      {t("查看凭证")}
                    </Button>
                  </Space>
                ),
              },
            ]}
          />
        </Card>
      ),
    });
  return tabs;
}
