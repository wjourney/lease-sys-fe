import { Button } from "antd";
import { observer } from "mobx-react-lite";
import { useRecordDetail } from "../../../../components/resource-detail/DetailContext";
import { errorMessage, options } from "../../../../shared/api";
import { t } from "../../../../shared/i18n";
export const OrderActions = observer(function OrderActions() {
  const { resource, row, root, modal, run, id, openAction, message } =
    useRecordDetail();
  return (
    <>
      {resource === "orders" && (
        <>
          {row.status === "PENDING" &&
            !row.firstPaymentRegisteredAt &&
            root.canWrite("orders") && (
              <Button
                onClick={() =>
                  modal.confirm({
                    title: t("确认关闭此订单？"),
                    content: "关闭后释放单位占用，并作废未收款的账单。",
                    onOk: () => run(`/orders/${id}/close`),
                  })
                }
              >
                {t("关闭订单")}
              </Button>
            )}
          {root.manageOrders && (
            <>
              <Button
                onClick={async () => {
                  try {
                    const templates = (
                      await options("materials", {
                        projectId: row.projectId,
                        category: "TEMPLATE",
                      })
                    ).filter((m) => m.body);
                    openAction(
                      "生成合同",
                      [
                        {
                          key: "templateMaterialId",
                          label: "选择合同模板",
                          type: "select",
                          required: false,
                          options: templates.map((m) => ({
                            value: m.id,
                            label: m.title,
                          })),
                        },
                      ],
                      `/orders/${id}/contract`,
                    );
                  } catch (e) {
                    message.error(errorMessage(e));
                  }
                }}
              >
                {t("生成合同")}
              </Button>
              {row.status === "ACTIVE" && (
                <Button
                  onClick={() =>
                    openAction(
                      "登记退租",
                      [
                        {
                          key: "date",
                          label: t("实际退租日期"),
                          type: "date",
                        },
                        {
                          key: "reason",
                          label: t("退租原因"),
                          type: "textarea",
                        },
                      ],
                      `/orders/${id}/terminate`,
                    )
                  }
                >
                  {t("登记退租")}
                </Button>
              )}
              {row.status === "COMPLETED" && row.handoverStatus !== "DONE" && (
                <Button
                  type="primary"
                  onClick={() =>
                    openAction(
                      "登记交还",
                      [
                        {
                          key: "note",
                          label: t("交还说明"),
                          type: "textarea",
                        },
                      ],
                      `/orders/${id}/handover`,
                    )
                  }
                >
                  {t("确认交还")}
                </Button>
              )}
            </>
          )}
          {root.finance &&
            row.handoverStatus === "DONE" &&
            !row.depositSettledAt && (
              <Button
                onClick={() =>
                  openAction(
                    "押金结算",
                    [
                      {
                        key: "deductionAmount",
                        label: t("扣除金额"),
                        type: "money",
                      },
                      {
                        key: "reason",
                        label: t("处理说明"),
                        type: "textarea",
                      },
                    ],
                    `/orders/${id}/deposit-settlement`,
                    {
                      deductionAmount: "0",
                    },
                  )
                }
              >
                {t("处理押金")}
              </Button>
            )}
        </>
      )}
    </>
  );
});
