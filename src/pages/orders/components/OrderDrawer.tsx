import { CloseOutlined, UploadOutlined } from "@ant-design/icons";
import {
  App,
  Button,
  DatePicker,
  Drawer,
  Form,
  Input,
  InputNumber,
  Select,
  Spin,
  Upload,
} from "antd";
import type { InputNumberProps } from "antd";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";
import { useEffect, useState } from "react";
import { RequestError } from "../../../components/feedback/RequestError";
import { api, errorMessage, options, type Row } from "../../../shared/api";
import { t } from "../../../shared/i18n";
import { initialRentAmount } from "../../../shared/initial-rent";
import { useRoot } from "../../../stores/root";

type Choice = { label: string; value: string };
function withCurrentChoice(choices: Choice[], value?: string, label?: string) {
  if (value && !choices.some((choice) => choice.value === value))
    return [...choices, { value, label: label || value }];
  return choices;
}
type OrderValues = {
  projectId: string;
  unitId: string;
  tenantType: "PERSON" | "COMPANY";
  tenantName: string;
  registrationNoType?: string;
  tenantRegistrationNo?: string;
  tenantContactName?: string;
  tenantPhone: string;
  tenantEmail: string;
  startsOn: Dayjs;
  endsOn: Dayjs;
  rentDueDay: number;
  monthlyRent: string;
  depositAmount: string;
  depositPlan?: string;
  salesCompanyId?: string;
  salesUserId: string;
  paymentDeclaration: "UNPAID" | "PARTIAL" | "PAID";
  initialRentReceived?: string;
  initialDepositReceived?: string;
  initialPaymentReceivedOn?: Dayjs;
  initialFundAccountId?: string;
  initialPaymentMethod?: string;
  initialBankReference?: string;
  reason?: string;
  commissionDueOn: Dayjs;
  commissionAmount: string;
  commissionRemark?: string;
};

const sectionClass = "rounded-lg bg-[#f5f6f8] px-4 py-3.5";
const gridClass = "grid grid-cols-3 gap-x-3 gap-y-0 max-[760px]:grid-cols-1";
const depositMonths: Record<string, number> = {
  ONE_ONE: 1,
  TWO_ONE: 2,
  THREE_ONE: 3,
};

function suggestedDeposit(
  rent: string | number | null | undefined,
  plan?: string,
) {
  const months = plan ? depositMonths[plan] : undefined;
  if (!months || rent == null || rent === "") return undefined;
  const cents = Math.round(Number(rent) * 100);
  return Number.isFinite(cents)
    ? ((cents * months) / 100).toFixed(2)
    : undefined;
}

function initialDeclaration(
  payment: Row | undefined,
): OrderValues["paymentDeclaration"] {
  if (payment?.paymentState === "PARTIAL" || payment?.paymentState === "PAID")
    return payment.paymentState;
  if (!payment?.paid) return "UNPAID";
  return payment.rentPaid && payment.depositPaid ? "PAID" : "PARTIAL";
}

function initialDepositPlan(row?: Row) {
  if (!row) return "ONE_ONE";
  const plan = row.depositPlan || "OTHER";
  const expected = suggestedDeposit(row.monthlyRent, plan);
  if (
    expected !== undefined &&
    (Number(row.depositAmount) !== Number(expected) ||
      Number(row.paymentIntervalMonths || 1) !== 1)
  )
    return "OTHER";
  return plan;
}

function monthlyCommissionCount(start?: Dayjs, end?: Dayjs) {
  if (!start || !end || end.isBefore(start, "day")) return 0;
  let count = 0;
  while (count < 600 && !start.add(count, "month").isAfter(end, "day")) count++;
  return count;
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className={sectionClass}>
      <h3 className="mb-3 text-sm font-semibold text-[#263650]">{t(title)}</h3>
      {children}
    </section>
  );
}

function MoneyInput(props: InputNumberProps<string>) {
  return (
    <InputNumber<string>
      stringMode
      min="0"
      precision={2}
      className="w-full"
      style={{ width: "100%" }}
      placeholder="0.00"
      controls={false}
      {...props}
    />
  );
}

export function OrderDrawer({
  row: initialRow,
  loadDetail = false,
  onClose,
  onSaved,
}: {
  row?: Row;
  loadDetail?: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form] = Form.useForm<OrderValues>();
  const { message } = App.useApp();
  const root = useRoot();
  const [detailRow, setDetailRow] = useState<Row>();
  const [detailError, setDetailError] = useState("");
  const [detailRetry, setDetailRetry] = useState(0);
  const row = loadDetail && initialRow ? detailRow : initialRow;
  const loadingDetail =
    loadDetail && !!initialRow && !detailRow && !detailError;

  useEffect(() => {
    if (!loadDetail || !initialRow?.id) return;
    let active = true;
    api
      .get<Row>(`/orders/${initialRow.id}`)
      .then(({ data }) => {
        if (active) setDetailRow(data);
      })
      .catch((cause) => {
        if (active) setDetailError(errorMessage(cause));
      });
    return () => {
      active = false;
    };
  }, [loadDetail, initialRow?.id, detailRetry]);

  const [unitRows, setUnitRows] = useState<Row[]>([]);
  const monthlyRent = Form.useWatch("monthlyRent", form);
  const projectId = Form.useWatch("projectId", form);
  const salesCompanyId = Form.useWatch("salesCompanyId", form);
  const tenantType = Form.useWatch("tenantType", form);
  const registrationNoType = Form.useWatch("registrationNoType", form);
  const paymentDeclaration = Form.useWatch("paymentDeclaration", form);
  const hasInitialPayment =
    paymentDeclaration === "PARTIAL" || paymentDeclaration === "PAID";
  const depositPlan = Form.useWatch("depositPlan", form);
  const depositAmount = Form.useWatch("depositAmount", form);
  // Historical agreements keep their mode when editing; new and draft orders
  // always create a monthly schedule.
  const commissionMode =
    row?.status !== "DRAFT" && row?.orderCommission?.mode
      ? row.orderCommission.mode
      : "RECURRING_MONTHLY";
  const commissionAmount = Form.useWatch("commissionAmount", form);
  const startsOn = Form.useWatch("startsOn", form);
  const endsOn = Form.useWatch("endsOn", form);
  const commissionMonths = monthlyCommissionCount(
    startsOn ?? (row?.startsOn ? dayjs(row.startsOn) : undefined),
    endsOn ?? (row?.endsOn ? dayjs(row.endsOn) : undefined),
  );
  const commission = row?.orderCommission as Row | undefined;
  const lockedLease = !!row && row.actions?.editLease === false;
  const paymentIntervalMonths =
    row && row.status !== "DRAFT" ? Number(row.paymentIntervalMonths ?? 1) : 1;
  const initialRent = initialRentAmount(
    monthlyRent,
    startsOn?.format("YYYY-MM-DD"),
    endsOn?.format("YYYY-MM-DD"),
    {
      billingVersion:
        row && row.status !== "DRAFT" ? (row.billingVersion ?? 1) : 2,
      paymentIntervalMonths,
      firstPeriodProration: row?.firstPeriodProration,
      lastPeriodProration: row?.lastPeriodProration,
    },
  );
  useEffect(() => {
    if (paymentDeclaration !== "PAID" || lockedLease) return;
    form.setFieldsValue({
      initialRentReceived: initialRent,
      initialDepositReceived: String(depositAmount ?? "0"),
    });
  }, [form, paymentDeclaration, lockedLease, initialRent, depositAmount]);
  const [fundAccounts, setFundAccounts] = useState<Choice[]>([]);
  const [projects, setProjects] = useState<Choice[]>([]);
  const [units, setUnits] = useState<Choice[]>([]);
  const [companies, setCompanies] = useState<Choice[]>([]);
  const [salesUsers, setSalesUsers] = useState<Row[]>([]);
  const [voucherFile, setVoucherFile] = useState<File>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (loadingDetail || detailError) return;
    let active = true;
    Promise.all([
      options("fund-accounts"),
      options("projects"),
      root.canRead("sales-companies")
        ? options("sales-companies")
        : Promise.resolve([]),
      root.canRead("users")
        ? options("users")
        : Promise.resolve(root.user ? [root.user] : []),
    ])
      .then(([accounts, projectRows, companyRows, userRows]) => {
        if (!active) return;
        const availableAccounts = accounts.filter(
          (x) =>
            x.enabled &&
            x.currency === "HKD" &&
            x.bankName?.trim() &&
            x.accountIdentifier?.trim(),
        );
        if (
          availableAccounts.length === 1 &&
          !form.getFieldValue("initialFundAccountId")
        )
          form.setFieldValue("initialFundAccountId", availableAccounts[0].id);
        setFundAccounts(
          availableAccounts.map((x) => ({ value: x.id, label: x.name })),
        );
        setProjects(
          withCurrentChoice(
            projectRows
              .filter(
                (project) =>
                  project.status === "ACTIVE" || project.id === row?.projectId,
              )
              .map((project) => ({ value: project.id, label: project.name })),
            row?.projectId,
            row?.projectName,
          ),
        );
        setCompanies(
          withCurrentChoice(
            root.canRead("sales-companies")
              ? companyRows.map((company) => ({
                  value: company.id,
                  label: company.name,
                }))
              : root.user?.salesCompanyId
                ? [
                    {
                      value: root.user.salesCompanyId,
                      label: root.user.companyName || t("所属销售公司"),
                    },
                  ]
                : row?.salesCompanyId
                  ? [
                      {
                        value: row.salesCompanyId,
                        label: row.companyName || row.salesCompanyId,
                      },
                    ]
                  : [],
            row?.salesCompanyId,
            row?.companyName,
          ),
        );
        setSalesUsers(
          userRows.filter(
            (row) =>
              row.status === "ACTIVE" &&
              ["SALES", "SALES_COMPANY_ADMIN"].includes(row.role),
          ),
        );
      })
      .catch((error) => message.error(errorMessage(error)));
    return () => {
      active = false;
    };
  }, [message, root, row?.projectId, loadingDetail, detailError]);

  useEffect(() => {
    if (!projectId) {
      setUnits([]);
      return;
    }
    let active = true;
    options("units", { projectId })
      .then((rows) => {
        if (active) {
          setUnitRows(rows);
          setUnits(
            withCurrentChoice(
              rows
                .filter(
                  (unit) =>
                    unit.id === row?.unitId ||
                    (unit.enabled && unit.status !== "DISABLED"),
                )
                .map((unit) => ({ value: unit.id, label: unit.unitNo })),
              row?.unitId,
              row?.unitNo,
            ),
          );
        }
      })
      .catch((error) => message.error(errorMessage(error)));
    return () => {
      active = false;
    };
  }, [projectId, message, row?.unitId]);

  const availableSalesUsers = salesUsers
    .filter(
      (user) =>
        user.id === row?.salesUserId ||
        !salesCompanyId ||
        user.salesCompanyId === salesCompanyId,
    )
    .map((user) => ({ value: user.id, label: user.name || user.username }));
  if (
    row?.salesUserId &&
    !availableSalesUsers.some((user) => user.value === row.salesUserId)
  )
    availableSalesUsers.push({
      value: row.salesUserId,
      label: row.salesName || row.salesUserId,
    });

  async function uploadFile(orderId: string, file: File, category: string) {
    const data = new FormData();
    data.append(
      "payload",
      JSON.stringify({
        orderId,
        category,
        title: file.name,
        visibility: "SHARED",
      }),
    );
    data.append("file", file);
    await api.post("/materials/upload", data);
  }

  function acceptFile(file: File) {
    const extension = file.name.split(".").at(-1)?.toLowerCase();
    const allowed = ["pdf", "png", "jpg", "jpeg", "webp"];
    if (!extension || !allowed.includes(extension)) {
      message.error(t("付款凭证支持 PDF 或图片"));
      return Upload.LIST_IGNORE;
    }
    if (file.size > 30 * 1024 * 1024) {
      message.error(t("单个文件不能超过 30 MB"));
      return Upload.LIST_IGNORE;
    }
    return false;
  }

  async function submit(values: OrderValues) {
    const rentReceived = Number(values.initialRentReceived || 0);
    const depositReceived = Number(values.initialDepositReceived || 0);
    if (!lockedLease && values.paymentDeclaration !== "UNPAID") {
      if (
        values.paymentDeclaration !== "PAID" ||
        rentReceived !== Number(initialRent) ||
        depositReceived !== Number(values.depositAmount || 0) ||
        rentReceived + depositReceived <= 0
      ) {
        message.error(t("首期款项须一次付清租金及押金，请核对金额"));
        return;
      }
      if (!values.initialPaymentReceivedOn) {
        message.error(t("请选择到账日期"));
        return;
      }
    }
    setLoading(true);
    try {
      const commissionChanged = form.isFieldsTouched([
        "commissionDueOn",
        "commissionAmount",
        "commissionRemark",
      ]);
      const paymentChanged = form.isFieldsTouched([
        "paymentDeclaration",
        "initialRentReceived",
        "initialDepositReceived",
        "initialPaymentReceivedOn",
        "initialFundAccountId",
        "initialPaymentMethod",
        "initialBankReference",
      ]);
      const leaseDatesChanged = form.isFieldsTouched(["startsOn", "endsOn"]);
      const saveCommission =
        !row ||
        !commission ||
        commissionChanged ||
        (leaseDatesChanged &&
          !lockedLease &&
          ["ONE_TIME", "RECURRING_MONTHLY"].includes(commission?.mode));
      const commissionPayload = saveCommission
        ? {
            mode: commissionMode,
            dueOn: values.commissionDueOn?.format("YYYY-MM-DD"),
            amount: values.commissionAmount ?? undefined,
            remark: values.commissionRemark?.trim(),
          }
        : undefined;
      const payload = lockedLease
        ? {
            tenantPhone: values.tenantPhone?.trim() ?? "",
            tenantEmail: values.tenantEmail?.trim() ?? "",
            tenantContactName: values.tenantContactName?.trim(),
            commission: commissionPayload,
            ...(!row?.salesUserId
              ? {
                  salesUserId: values.salesUserId,
                  salesCompanyId: values.salesCompanyId,
                }
              : {}),
          }
        : {
            ...(!row || row.status === "DRAFT"
              ? {
                  projectId: values.projectId || undefined,
                  unitId: values.unitId || undefined,
                }
              : {}),
            ...(!row || row.status === "DRAFT" || !row.salesUserId
              ? {
                  salesUserId: values.salesUserId,
                  salesCompanyId: values.salesCompanyId,
                }
              : {}),
            tenantType: values.tenantType,
            tenantName: values.tenantName.trim(),
            ...(values.tenantType === "COMPANY"
              ? {
                  registrationNoType: values.registrationNoType,
                  tenantRegistrationNo: values.tenantRegistrationNo?.trim(),
                  tenantContactName: values.tenantContactName?.trim(),
                }
              : row
                ? {
                    registrationNoType: null,
                    tenantRegistrationNo: "",
                    tenantContactName: "",
                  }
                : {}),
            tenantPhone: values.tenantPhone?.trim(),
            tenantEmail: values.tenantEmail?.trim(),
            startsOn: values.startsOn?.format("YYYY-MM-DD"),
            endsOn: values.endsOn?.format("YYYY-MM-DD"),
            monthlyRent: values.monthlyRent ?? undefined,
            depositAmount: values.depositAmount ?? undefined,
            depositPlan: values.depositPlan ?? (row ? null : undefined),
            paymentIntervalMonths,
            rentDueDay: values.rentDueDay ?? undefined,
            ...(!row || paymentChanged
              ? {
                  initialPayment: {
                    paymentState: values.paymentDeclaration,
                    paid:
                      rentReceived + depositReceived > 0 &&
                      values.paymentDeclaration !== "UNPAID",
                    rentPaid:
                      rentReceived > 0 &&
                      values.paymentDeclaration !== "UNPAID",
                    depositPaid:
                      depositReceived > 0 &&
                      values.paymentDeclaration !== "UNPAID",
                    rentReceived:
                      values.paymentDeclaration === "UNPAID"
                        ? "0"
                        : values.initialRentReceived || "0",
                    depositReceived:
                      values.paymentDeclaration === "UNPAID"
                        ? "0"
                        : values.initialDepositReceived || "0",
                    fundAccountId:
                      values.paymentDeclaration !== "UNPAID"
                        ? values.initialFundAccountId
                        : undefined,
                    paymentMethod:
                      values.paymentDeclaration !== "UNPAID"
                        ? values.initialPaymentMethod
                        : undefined,
                    bankReference:
                      values.paymentDeclaration !== "UNPAID"
                        ? values.initialBankReference?.trim()
                        : undefined,
                    receivedOn:
                      values.paymentDeclaration !== "UNPAID"
                        ? values.initialPaymentReceivedOn?.format("YYYY-MM-DD")
                        : undefined,
                  },
                }
              : {}),
            commission: commissionPayload,
          };
      const order = row
        ? (
            await api.patch<Row>(`/orders/${row.id}`, {
              ...payload,
              revision: row.revision,
              reason: values.reason?.trim() || "修改订单资料",
            })
          ).data
        : (await api.post<Row>("/orders", payload)).data;
      root.invalidate();
      try {
        if (values.paymentDeclaration !== "UNPAID" && voucherFile) {
          const receipt = (order.bills ?? [])
            .flatMap((b: Row) => b.receipts ?? [])
            .find(
              (r: Row) =>
                r.sourceKey?.startsWith("initial:") && r.status === "PENDING",
            );
          if (receipt) {
            const data = new FormData();
            data.append(
              "payload",
              JSON.stringify({
                incomeId: receipt.voucherIncomeId || receipt.id,
                category: "VOUCHER",
                visibility: "SHARED",
                title: voucherFile.name,
              }),
            );
            data.append("file", voucherFile);
            await api.post("/materials/upload", data);
          } else await uploadFile(order.id, voucherFile, "VOUCHER");
        }
        message.success(t(row ? "订单修改成功" : "订单创建成功"));
      } catch {
        message.warning(
          t(
            row
              ? "订单已修改，但附件上传失败，请在订单详情补传"
              : "订单已创建，但附件上传失败，请在订单详情补传",
          ),
        );
      }
      if (!row && order.contractGenerationPending)
        message.warning(
          t("订单已创建，合同暂未生成，可在订单详情点击下载合同重试"),
        );
      root.invalidate();
      onSaved();
    } catch (error) {
      message.error(errorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Drawer
      open
      width="min(820px, 100vw)"
      title={t(initialRow ? "编辑订单" : "新建订单")}
      onClose={onClose}
      closable={false}
      extra={
        <Button
          aria-label={t("关闭")}
          icon={<CloseOutlined aria-hidden />}
          onClick={onClose}
        />
      }
      className="order-create-drawer"
      footer={
        loadingDetail || detailError ? null : (
          <div className="flex justify-end gap-2">
            <Button onClick={onClose}>{t("取消")}</Button>
            <Button
              type="primary"
              loading={loading}
              onClick={() => form.submit()}
            >
              {t(row ? "保存修改" : "提交订单")}
            </Button>
          </div>
        )
      }
    >
      {detailError ? (
        <RequestError
          type="error"
          message={t(detailError)}
          action={
            <Button
              onClick={() => {
                setDetailError("");
                setDetailRetry((value) => value + 1);
              }}
            >
              {t("重试")}
            </Button>
          }
        />
      ) : loadingDetail ? (
        <div className="flex min-h-40 items-center justify-center">
          <Spin />
        </div>
      ) : (
        <Form<OrderValues>
          form={form}
          layout="vertical"
          onFinish={submit}
          onValuesChange={(changed) => {
            if (changed.startsOn) {
              form.setFieldValue(
                "endsOn",
                changed.startsOn.add(1, "year").subtract(1, "day"),
              );
              form.setFieldValue("rentDueDay", changed.startsOn.date());
            }
          }}
          requiredMark
          initialValues={{
            projectId: row?.projectId,
            unitId: row?.unitId,
            tenantType: row?.tenantType || "COMPANY",
            tenantName: row?.tenantName,
            registrationNoType: row?.registrationNoType,
            tenantRegistrationNo: row?.tenantRegistrationNo,
            tenantContactName: row?.tenantContactName,
            tenantPhone: row?.tenantPhone,
            tenantEmail: row?.tenantEmail,
            startsOn: row?.startsOn
              ? dayjs(row.startsOn)
              : dayjs().startOf("day"),
            endsOn: row?.endsOn
              ? dayjs(row.endsOn)
              : dayjs().add(1, "year").subtract(1, "day"),
            monthlyRent:
              row?.monthlyRent != null ? String(row.monthlyRent) : undefined,
            depositAmount:
              row?.depositAmount != null
                ? String(row.depositAmount)
                : undefined,
            depositPlan: initialDepositPlan(row),
            rentDueDay: row?.rentDueDay ?? dayjs().date(),
            paymentDeclaration:
              !lockedLease &&
              initialDeclaration(row?.initialPayment) === "PARTIAL"
                ? "UNPAID"
                : initialDeclaration(row?.initialPayment),
            initialRentReceived:
              row?.initialPayment?.rentReceived != null
                ? String(row.initialPayment.rentReceived)
                : undefined,
            initialDepositReceived:
              row?.initialPayment?.depositReceived != null
                ? String(row.initialPayment.depositReceived)
                : undefined,
            initialPaymentReceivedOn: row?.initialPayment?.receivedOn
              ? dayjs(row.initialPayment.receivedOn)
              : undefined,
            initialFundAccountId: row?.initialPayment?.fundAccountId,
            initialPaymentMethod: row?.initialPayment?.paymentMethod || "BANK",
            initialBankReference: row?.initialPayment?.bankReference,
            salesCompanyId: row?.salesCompanyId ?? root.user?.salesCompanyId,
            salesUserId:
              row?.salesUserId ??
              (root.user?.role === "SALES" ? root.user.id : undefined),
            commissionAmount:
              commission?.amount != null
                ? String(commission.amount)
                : undefined,
            commissionDueOn: commission?.dueOn
              ? dayjs(commission.dueOn)
              : undefined,
            commissionRemark: commission?.remark,
          }}
          className="flex flex-col gap-2.5 [&_.ant-form-item]:!mb-2.5"
        >
          <Section title="单位信息">
            <div className="grid grid-cols-2 gap-x-3 max-[760px]:grid-cols-1">
              <Form.Item
                name="projectId"
                label={t("项目")}
                rules={[{ required: true, message: t("请选择项目") }]}
              >
                <Select
                  showSearch
                  optionFilterProp="label"
                  options={projects}
                  placeholder={t("请选择项目")}
                  disabled={!!row && row.status !== "DRAFT"}
                  onChange={() =>
                    form.setFieldsValue({
                      unitId: undefined,
                      monthlyRent: undefined,
                      depositAmount: undefined,
                    })
                  }
                />
              </Form.Item>
              <Form.Item
                name="unitId"
                label={t("单位")}
                rules={[{ required: true, message: t("请选择单位") }]}
              >
                <Select
                  showSearch
                  optionFilterProp="label"
                  options={units}
                  onChange={(id) => {
                    const unit = unitRows.find((u) => u.id === id);
                    const rent =
                      unit?.referenceRent != null
                        ? String(unit.referenceRent)
                        : undefined;
                    form.setFieldsValue({
                      monthlyRent: rent,
                      depositAmount: suggestedDeposit(
                        rent,
                        form.getFieldValue("depositPlan"),
                      ),
                    });
                  }}
                  disabled={(!!row && row.status !== "DRAFT") || !projectId}
                  placeholder={t("请选择单位")}
                />
              </Form.Item>
            </div>
          </Section>

          <Section title="租客信息">
            <div className={gridClass}>
              <Form.Item name="tenantType" label={t("租客类型")}>
                <Select
                  disabled={lockedLease}
                  options={[
                    { value: "COMPANY", label: t("公司") },
                    { value: "PERSON", label: t("个人") },
                  ]}
                  onChange={() => {
                    form.setFieldValue("tenantName", undefined);
                    form.setFieldValue("registrationNoType", undefined);
                    form.setFieldValue("tenantRegistrationNo", undefined);
                    form.setFieldValue("tenantContactName", undefined);
                  }}
                />
              </Form.Item>
              <Form.Item
                name="tenantName"
                label={t(tenantType === "PERSON" ? "租客姓名" : "公司名称")}
                rules={[
                  {
                    required: true,
                    whitespace: true,
                    message: t("请填写名称"),
                  },
                ]}
              >
                <Input disabled={lockedLease} />
              </Form.Item>
              {tenantType === "COMPANY" && (
                <Form.Item
                  name="registrationNoType"
                  label={t("注册号码类型")}

                  preserve={false}
                >
                  <Select
                    disabled={lockedLease}
                    options={[
                      { value: "BR", label: t("商业登记号码") },
                      { value: "CR", label: t("公司注册号码") },
                    ]}
                  />
                </Form.Item>
              )}
              {tenantType === "COMPANY" && (
                <>
                  <Form.Item
                    name="tenantRegistrationNo"
                    label={t(
                      registrationNoType === "CR"
                        ? "公司注册号码"
                        : "商业登记号码",
                    )}

                    preserve={false}
                  >
                    <Input disabled={lockedLease} />
                  </Form.Item>
                  <Form.Item
                    name="tenantContactName"
                    label={t("联系人")}

                    preserve={false}
                  >
                    <Input />
                  </Form.Item>
                </>
              )}
              <Form.Item name="tenantPhone" label={t("联系电话")}>
                <Input />
              </Form.Item>
              <Form.Item
                name="tenantEmail"
                label="Email"
                rules={[{ type: "email", message: t("请输入有效的邮箱地址") }]}
                className="col-span-3 max-[760px]:col-span-1"
              >
                <Input type="email" />
              </Form.Item>
            </div>
          </Section>

          <Section title="租赁与账单">
            <div className={gridClass}>
              <Form.Item name="startsOn" label={t("起租日期")}>
                <DatePicker className="w-full" disabled={lockedLease} />
              </Form.Item>
              <Form.Item
                name="endsOn"
                label={t("到期日期")}
                rules={[
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (
                        !value ||
                        !getFieldValue("startsOn") ||
                        !value.isBefore(getFieldValue("startsOn"))
                      )
                        return Promise.resolve();
                      return Promise.reject(
                        new Error(t("到期日期不能早于起租日期")),
                      );
                    },
                  }),
                ]}
              >
                <DatePicker className="w-full" disabled={lockedLease} />
              </Form.Item>
              <Form.Item name="rentDueDay" label={t("每月交租日")}>
                <InputNumber
                  disabled={lockedLease}
                  min={1}
                  max={31}
                  precision={0}
                  className="w-full"
                  addonAfter={t("日")}
                />
              </Form.Item>
              <Form.Item
                name="monthlyRent"
                label={t("实际成交月租（HKD）")}
                rules={[
                  { required: true, message: t("请填写实际成交月租") },
                  {
                    validator(_, value) {
                      return !value || Number(value) > 0
                        ? Promise.resolve()
                        : Promise.reject(new Error(t("月租必须大于零")));
                    },
                  },
                ]}
              >
                <MoneyInput
                  disabled={lockedLease}
                  onChange={(value) => {
                    const amount = suggestedDeposit(
                      value,
                      form.getFieldValue("depositPlan"),
                    );
                    if (amount !== undefined)
                      form.setFieldValue("depositAmount", amount);
                  }}
                />
              </Form.Item>
              <Form.Item name="depositAmount" label={t("押金（HKD）")}>
                <MoneyInput disabled={lockedLease || depositPlan !== "OTHER"} />
              </Form.Item>
              <Form.Item name="depositPlan" label={t("押付方式")}>
                <Select
                  disabled={lockedLease || paymentIntervalMonths !== 1}
                  options={[
                    { value: "ONE_ONE", label: t("押一付一") },
                    { value: "TWO_ONE", label: t("押二付一") },
                    { value: "THREE_ONE", label: t("押三付一") },
                    { value: "OTHER", label: t("其他") },
                  ]}
                  onChange={(plan: string) => {
                    const amount = suggestedDeposit(
                      form.getFieldValue("monthlyRent"),
                      plan,
                    );
                    if (amount !== undefined)
                      form.setFieldValue("depositAmount", amount);
                  }}
                />
              </Form.Item>
            </div>
            <p className="mb-2 text-xs text-[#63738d]">
              {t(
                paymentIntervalMonths !== 1
                  ? `历史订单：租金每 ${paymentIntervalMonths} 个月支付一次，保留原账单规则。`
                  : "租金按月支付，保存后自动生成整个租期的账单。不足月按天折算：月租 × 实际租用天数 ÷ 完整账期天数（包含起止日）。",
              )}
            </p>
          </Section>

          <Section title="销售归属">
            <div className="grid grid-cols-2 gap-x-3 max-[760px]:grid-cols-1">
              <Form.Item
                name="salesCompanyId"
                label={t("销售公司（筛选销售员）")}
              >
                <Select
                  showSearch
                  optionFilterProp="label"
                  options={companies}
                  onChange={() => form.setFieldValue("salesUserId", undefined)}
                  disabled={
                    (!!row?.salesUserId && row.status !== "DRAFT") ||
                    !!root.user?.salesCompanyId
                  }
                />
              </Form.Item>
              <Form.Item name="salesUserId" label={t("销售员工")}>
                <Select
                  showSearch
                  optionFilterProp="label"
                  options={availableSalesUsers}
                  disabled={!!row?.salesUserId && row.status !== "DRAFT"}
                  onChange={(id: string) => {
                    const user = salesUsers.find((item) => item.id === id);
                    if (user?.salesCompanyId)
                      form.setFieldValue("salesCompanyId", user.salesCompanyId);
                  }}
                />
              </Form.Item>
            </div>
          </Section>

          <Section title="订单佣金">
            <div className={gridClass}>
              <Form.Item
                name="commissionAmount"
                label={t(
                  commissionMode === "RECURRING_MONTHLY"
                    ? "每月佣金（HKD）"
                    : "佣金总额（HKD）",
                )}
                rules={[
                  {
                    validator(_, value) {
                      return !value || Number(value) > 0
                        ? Promise.resolve()
                        : Promise.reject(new Error(t("佣金金额必须大于零")));
                    },
                  },
                ]}
              >
                <MoneyInput />
              </Form.Item>
              <Form.Item
                name="commissionDueOn"
                label={t(
                  commissionMode === "RECURRING_MONTHLY"
                    ? "首笔结付日期"
                    : "结付日期",
                )}
              >
                <DatePicker className="w-full" />
              </Form.Item>
              <Form.Item name="commissionRemark" label={t("佣金备注")}>
                <Input />
              </Form.Item>
            </div>
            <p className="text-xs text-[#63738d]">
              {t(
                commissionMode === "RECURRING_MONTHLY"
                  ? "按租期逐月生成佣金，每月金额相同；首笔日期确定后，后续日期逐月顺延。"
                  : "一次性结付只生成一笔佣金，金额为整笔总额。",
              )}
              {commissionMode === "RECURRING_MONTHLY" &&
                commissionMonths > 0 &&
                Number(commissionAmount) > 0 && (
                  <span className="ml-2 font-medium text-[#263650]">
                    {t(
                      `预计 ${commissionMonths} 笔，合计 HK$ ${((Math.round(Number(commissionAmount) * 100) * commissionMonths) / 100).toFixed(2)}`,
                    )}
                  </span>
                )}
            </p>
          </Section>

          <Section title="首期收款">
            <div className={gridClass}>
              <Form.Item
                name="paymentDeclaration"
                label={t("首期付款情况")}

                className={
                  !hasInitialPayment
                    ? "col-span-3 max-[760px]:col-span-1"
                    : undefined
                }
              >
                <Select
                  disabled={lockedLease}
                  options={[
                    { value: "UNPAID", label: t("未付款") },
                    ...(lockedLease && paymentDeclaration === "PARTIAL"
                      ? [
                          {
                            value: "PARTIAL",
                            label: t("历史部分付款"),
                            disabled: true,
                          },
                        ]
                      : []),
                    { value: "PAID", label: t("已付首期租金及押金") },
                  ]}
                  onChange={(state: OrderValues["paymentDeclaration"]) => {
                    if (state !== "UNPAID") {
                      form.setFieldsValue({
                        initialPaymentReceivedOn: dayjs(),
                      });
                    }
                    if (state === "UNPAID") {
                      form.setFieldsValue({
                        initialRentReceived: undefined,
                        initialDepositReceived: undefined,
                        initialPaymentReceivedOn: undefined,
                      });
                      setVoucherFile(undefined);
                    }
                  }}
                />
              </Form.Item>
              {hasInitialPayment && (
                <>
                  <Form.Item
                    name="initialRentReceived"
                    label={t("首期租金实收（HKD）")}
                  >
                    <MoneyInput readOnly disabled />
                  </Form.Item>
                  <Form.Item
                    name="initialDepositReceived"
                    label={t("押金实收（HKD）")}
                  >
                    <MoneyInput readOnly disabled />
                  </Form.Item>
                  <Form.Item name="initialFundAccountId" label={t("银行账户")}>
                    <Select
                      disabled={lockedLease || fundAccounts.length === 1}
                      options={fundAccounts}
                      placeholder={t("请选择收款账户")}
                    />
                  </Form.Item>
                  <Form.Item name="initialPaymentMethod" label={t("付款方式")}>
                    <Select
                      disabled={lockedLease}
                      options={[
                        { value: "BANK", label: t("银行转账") },
                        { value: "CASH", label: t("现金") },
                        { value: "CHEQUE", label: t("支票") },
                      ]}
                    />
                  </Form.Item>
                  <Form.Item
                    name="initialBankReference"
                    label={t("银行参考号")}
                  >
                    <Input disabled={lockedLease} />
                  </Form.Item>
                  <Form.Item
                    name="initialPaymentReceivedOn"
                    label={t("到账日期")}
                  >
                    <DatePicker className="w-full" disabled={lockedLease} />
                  </Form.Item>
                </>
              )}
            </div>
            {hasInitialPayment && (
              <Form.Item label={t("付款凭证（可选）")}>
                <Upload
                  disabled={lockedLease}
                  maxCount={1}
                  accept=".pdf,.png,.jpg,.jpeg,.webp"
                  beforeUpload={(file) => {
                    const result = acceptFile(file);
                    if (result !== false) return result;
                    setVoucherFile(file);
                    return false;
                  }}
                  onRemove={() => setVoucherFile(undefined)}
                >
                  <Button icon={<UploadOutlined />} disabled={lockedLease}>
                    {t("上传付款凭证")}
                  </Button>
                </Upload>
              </Form.Item>
            )}
          </Section>
          <p className="text-xs text-[#63738d]">
            {t(
              lockedLease
                ? "订单已有收款或租期已生效，单位、租约、销售归属及首期收款仅供查看；可修改联系方式、订单备注及未付款的佣金。"
                : "项目、单位和月租必填；提交后生成租期账单。佣金资料可后补。登记首期付款直接入账，无需财务核对。",
            )}
          </p>
          {row && (
            <Form.Item name="reason" label={t("修改原因")}>
              <Input.TextArea rows={2} maxLength={500} />
            </Form.Item>
          )}
        </Form>
      )}
    </Drawer>
  );
}
