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
  Upload,
} from "antd";
import type { InputNumberProps } from "antd";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";
import { useEffect, useState } from "react";
import { api, errorMessage, options, type Row } from "../../../shared/api";
import { t } from "../../../shared/i18n";
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
  firstPeriodProration: boolean;
  lastPeriodProration: boolean;
  billLeadDays: number;
  paymentIntervalMonths: number;
  moveInOn?: Dayjs;
  remark?: string;
  salesCompanyId?: string;
  salesUserId: string;
  firstPaymentPaid: boolean;
  initialRentPaid: boolean;
  initialDepositPaid: boolean;
  initialRentReceived?: string;
  initialDepositReceived?: string;
  initialPaymentReceivedOn?: Dayjs;
  reason?: string;
};

const required = [{ required: true, message: "请填写此项" }];
const sectionClass = "rounded-lg bg-[#f5f6f8] px-4 py-3.5";
const gridClass = "grid grid-cols-3 gap-x-3 gap-y-0 max-[760px]:grid-cols-1";

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
  row,
  onClose,
  onSaved,
}: {
  row?: Row;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form] = Form.useForm<OrderValues>();
  const { message } = App.useApp();
  const root = useRoot();
  const projectId = Form.useWatch("projectId", form);
  const salesCompanyId = Form.useWatch("salesCompanyId", form);
  const tenantType = Form.useWatch("tenantType", form);
  const registrationNoType = Form.useWatch("registrationNoType", form);
  const firstPaymentPaid = Form.useWatch("firstPaymentPaid", form);
  const initialRentPaid = Form.useWatch("initialRentPaid", form);
  const initialDepositPaid = Form.useWatch("initialDepositPaid", form);
  const [projects, setProjects] = useState<Choice[]>([]);
  const [units, setUnits] = useState<Choice[]>([]);
  const [companies, setCompanies] = useState<Choice[]>([]);
  const [salesUsers, setSalesUsers] = useState<Row[]>([]);
  const [contractFile, setContractFile] = useState<File>();
  const [voucherFile, setVoucherFile] = useState<File>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([
      options("projects"),
      root.canRead("sales-companies")
        ? options("sales-companies")
        : Promise.resolve([]),
      root.canRead("users")
        ? options("users")
        : Promise.resolve(root.user ? [root.user] : []),
    ])
      .then(([projectRows, companyRows, userRows]) => {
        if (!active) return;
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
              ? companyRows
                  .filter(
                    (company) =>
                      company.status === "ACTIVE" ||
                      company.id === row?.salesCompanyId,
                  )
                  .map((company) => ({
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
  }, [message, root, row?.projectId]);

  useEffect(() => {
    if (!projectId) {
      setUnits([]);
      return;
    }
    let active = true;
    options("units", { projectId })
      .then((rows) => {
        if (active)
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

  function acceptFile(file: File, contract: boolean) {
    const extension = file.name.split(".").at(-1)?.toLowerCase();
    const allowed = contract ? ["pdf"] : ["pdf", "png", "jpg", "jpeg", "webp"];
    if (!extension || !allowed.includes(extension)) {
      message.error(
        t(contract ? "合同仅支持 PDF 文件" : "付款凭证支持 PDF 或图片"),
      );
      return Upload.LIST_IGNORE;
    }
    if (file.size > 30 * 1024 * 1024) {
      message.error(t("单个文件不能超过 30 MB"));
      return Upload.LIST_IGNORE;
    }
    return false;
  }

  async function submit(values: OrderValues) {
    if (
      values.firstPaymentPaid &&
      !values.initialRentPaid &&
      !values.initialDepositPaid
    ) {
      message.error(t("首期款状态须与租金、押金的付款状态一致"));
      return;
    }
    if (
      values.firstPaymentPaid &&
      ((values.initialRentPaid && Number(values.initialRentReceived) <= 0) ||
        (values.initialDepositPaid &&
          Number(values.initialDepositReceived) <= 0) ||
        (!values.initialRentPaid && Number(values.initialRentReceived) > 0) ||
        (!values.initialDepositPaid &&
          Number(values.initialDepositReceived) > 0))
    ) {
      message.error(t("已付款项目请填写对应的实收金额"));
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...(!row
          ? { unitId: values.unitId, salesUserId: values.salesUserId }
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
        tenantPhone: values.tenantPhone.trim(),
        tenantEmail: values.tenantEmail.trim(),
        startsOn: values.startsOn.format("YYYY-MM-DD"),
        endsOn: values.endsOn.format("YYYY-MM-DD"),
        monthlyRent: values.monthlyRent,
        depositAmount: values.depositAmount,
        depositPlan: values.depositPlan ?? (row ? null : undefined),
        paymentIntervalMonths: values.paymentIntervalMonths,
        rentDueDay: values.rentDueDay,
        billLeadDays: values.billLeadDays,
        firstPeriodProration: values.firstPeriodProration,
        lastPeriodProration: values.lastPeriodProration,
        moveInOn:
          values.moveInOn?.format("YYYY-MM-DD") ?? (row ? null : undefined),
        remark: values.remark?.trim(),
        initialPayment: {
          paid: values.firstPaymentPaid,
          rentPaid: values.firstPaymentPaid && values.initialRentPaid,
          depositPaid: values.firstPaymentPaid && values.initialDepositPaid,
          rentReceived: values.firstPaymentPaid
            ? values.initialRentReceived || "0"
            : "0",
          depositReceived: values.firstPaymentPaid
            ? values.initialDepositReceived || "0"
            : "0",
          receivedOn: values.firstPaymentPaid
            ? values.initialPaymentReceivedOn?.format("YYYY-MM-DD")
            : undefined,
        },
      };
      const order = row
        ? (
            await api.patch<Row>(`/orders/${row.id}`, {
              ...payload,
              revision: row.revision,
              reason: values.reason?.trim(),
            })
          ).data
        : (await api.post<Row>("/orders", payload)).data;
      root.invalidate();
      try {
        if (values.firstPaymentPaid && contractFile)
          await uploadFile(order.id, contractFile, "CONTRACT");
        if (values.firstPaymentPaid && voucherFile)
          await uploadFile(order.id, voucherFile, "VOUCHER");
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
      title={t(row ? "编辑订单" : "新建订单")}
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
      }
    >
      <Form<OrderValues>
        form={form}
        layout="vertical"
        onFinish={submit}
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
          startsOn: row?.startsOn ? dayjs(row.startsOn) : undefined,
          endsOn: row?.endsOn ? dayjs(row.endsOn) : undefined,
          monthlyRent:
            row?.monthlyRent != null ? String(row.monthlyRent) : undefined,
          depositAmount:
            row?.depositAmount != null ? String(row.depositAmount) : undefined,
          depositPlan: row?.depositPlan || undefined,
          paymentIntervalMonths: row?.paymentIntervalMonths ?? 1,
          rentDueDay: row?.rentDueDay ?? 1,
          billLeadDays: row?.billLeadDays ?? 7,
          firstPeriodProration: row?.firstPeriodProration ?? true,
          lastPeriodProration: row?.lastPeriodProration ?? true,
          moveInOn: row?.moveInOn ? dayjs(row.moveInOn) : undefined,
          remark: row?.remark,
          firstPaymentPaid: Boolean(row?.initialPayment?.paid),
          initialRentPaid: Boolean(row?.initialPayment?.rentPaid),
          initialDepositPaid: Boolean(row?.initialPayment?.depositPaid),
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
          salesCompanyId: row?.salesCompanyId ?? root.user?.salesCompanyId,
          salesUserId:
            row?.salesUserId ??
            (root.user?.role === "SALES" ? root.user.id : undefined),
        }}
        className="flex flex-col gap-2.5 [&_.ant-form-item]:!mb-2.5"
      >
        <Section title="单位信息">
          <div className="grid grid-cols-2 gap-x-3 max-[760px]:grid-cols-1">
            <Form.Item name="projectId" label={t("项目")} rules={required}>
              <Select
                showSearch
                optionFilterProp="label"
                options={projects}
                placeholder={t("请选择项目")}
                disabled={!!row}
                onChange={() => form.setFieldValue("unitId", undefined)}
              />
            </Form.Item>
            <Form.Item name="unitId" label={t("单位")} rules={required}>
              <Select
                showSearch
                optionFilterProp="label"
                options={units}
                disabled={!!row || !projectId}
                placeholder={t("请选择单位")}
              />
            </Form.Item>
          </div>
        </Section>

        <Section title="租客信息">
          <div className={gridClass}>
            <Form.Item name="tenantType" label={t("租客类型")} rules={required}>
              <Select
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
              rules={required}
            >
              <Input />
            </Form.Item>
            {tenantType === "COMPANY" && (
              <Form.Item
                name="registrationNoType"
                label={t("注册号码类型")}
                rules={required}
                preserve={false}
              >
                <Select
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
                  rules={required}
                  preserve={false}
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  name="tenantContactName"
                  label={t("联系人")}
                  rules={required}
                  preserve={false}
                >
                  <Input />
                </Form.Item>
              </>
            )}
            <Form.Item
              name="tenantPhone"
              label={t("联系电话")}
              rules={required}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="tenantEmail"
              label="Email"
              rules={[
                ...required,
                { type: "email", message: t("请输入有效的邮箱地址") },
              ]}
              className="col-span-3 max-[760px]:col-span-1"
            >
              <Input type="email" />
            </Form.Item>
          </div>
        </Section>

        <Section title="租赁与账单">
          <div className={gridClass}>
            <Form.Item name="startsOn" label={t("起租日期")} rules={required}>
              <DatePicker className="w-full" />
            </Form.Item>
            <Form.Item
              name="endsOn"
              label={t("到期日期")}
              rules={[
                ...required,
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
              <DatePicker className="w-full" />
            </Form.Item>
            <Form.Item
              name="rentDueDay"
              label={t("每月交租日")}
              rules={required}
            >
              <InputNumber
                min={1}
                max={28}
                precision={0}
                className="w-full"
                addonAfter={t("日")}
              />
            </Form.Item>
            <Form.Item
              name="monthlyRent"
              label={t("实际成交月租（HKD）")}
              rules={[
                ...required,
                {
                  validator(_, value) {
                    return !value || Number(value) > 0
                      ? Promise.resolve()
                      : Promise.reject(new Error(t("月租必须大于零")));
                  },
                },
              ]}
            >
              <MoneyInput />
            </Form.Item>
            <Form.Item
              name="depositAmount"
              label={t("押金（HKD）")}
              rules={required}
            >
              <MoneyInput />
            </Form.Item>
            <Form.Item name="depositPlan" label={t("押付方式")}>
              <Select
                allowClear
                options={[
                  { value: "ONE_ONE", label: t("押一付一") },
                  { value: "TWO_ONE", label: t("押二付一") },
                  { value: "THREE_ONE", label: t("押三付一") },
                  { value: "OTHER", label: t("其他") },
                ]}
              />
            </Form.Item>
            <Form.Item name="firstPeriodProration" label={t("首期不足月")}>
              <Select
                options={[
                  { value: true, label: t("按天折算") },
                  { value: false, label: t("按整月计算") },
                ]}
              />
            </Form.Item>
            <Form.Item name="lastPeriodProration" label={t("末期不足月")}>
              <Select
                options={[
                  { value: true, label: t("按天折算") },
                  { value: false, label: t("按整月计算") },
                ]}
              />
            </Form.Item>
            <Form.Item name="billLeadDays" label={t("账单提前生成")}>
              <InputNumber
                min={0}
                max={60}
                precision={0}
                className="w-full"
                addonAfter={t("天")}
              />
            </Form.Item>
            <Form.Item
              name="paymentIntervalMonths"
              label={t("付款频率")}
              rules={required}
            >
              <Select
                options={[1, 2, 3, 6, 12].map((value) => ({
                  value,
                  label: value === 1 ? t("每月") : t(`每 ${value} 个月`),
                }))}
              />
            </Form.Item>
            <Form.Item name="moveInOn" label={t("办理入住日期")}>
              <DatePicker className="w-full" />
            </Form.Item>
            <Form.Item name="remark" label={t("订单备注")}>
              <Input />
            </Form.Item>
          </div>
        </Section>

        <Section title="销售归属">
          <div className="grid grid-cols-2 gap-x-3 max-[760px]:grid-cols-1">
            <Form.Item name="salesCompanyId" label={t("销售公司")}>
              <Select
                showSearch
                optionFilterProp="label"
                options={companies}
                onChange={() => form.setFieldValue("salesUserId", undefined)}
                disabled={!!row || !!root.user?.salesCompanyId}
              />
            </Form.Item>
            <Form.Item
              name="salesUserId"
              label={t("销售员工")}
              rules={required}
            >
              <Select
                showSearch
                optionFilterProp="label"
                options={availableSalesUsers}
                disabled={!!row}
              />
            </Form.Item>
          </div>
        </Section>

        <Section title="首期收款与附件">
          <div className={gridClass}>
            <Form.Item
              name="firstPaymentPaid"
              label={t("是否已付首期款")}
              rules={required}
              className={
                firstPaymentPaid
                  ? undefined
                  : "col-span-3 max-[760px]:col-span-1"
              }
            >
              <Select
                options={[
                  { value: false, label: t("未付款") },
                  { value: true, label: t("已付款") },
                ]}
                onChange={(paid: boolean) => {
                  form.setFieldsValue({
                    initialRentPaid: paid,
                    initialDepositPaid: paid,
                    initialRentReceived: undefined,
                    initialDepositReceived: undefined,
                    initialPaymentReceivedOn: undefined,
                  });
                  if (!paid) {
                    setContractFile(undefined);
                    setVoucherFile(undefined);
                  }
                }}
              />
            </Form.Item>
            {firstPaymentPaid && (
              <>
                <Form.Item
                  name="initialRentPaid"
                  label={t("首期租金")}
                  rules={required}
                >
                  <Select
                    options={[
                      { value: false, label: t("未付款") },
                      { value: true, label: t("已付款") },
                    ]}
                    onChange={(paid: boolean) => {
                      if (!paid)
                        form.setFieldValue("initialRentReceived", undefined);
                    }}
                  />
                </Form.Item>
                <Form.Item
                  name="initialDepositPaid"
                  label={t("押金")}
                  rules={required}
                >
                  <Select
                    options={[
                      { value: false, label: t("未付款") },
                      { value: true, label: t("已付款") },
                    ]}
                    onChange={(paid: boolean) => {
                      if (!paid)
                        form.setFieldValue("initialDepositReceived", undefined);
                    }}
                  />
                </Form.Item>
                <Form.Item
                  name="initialRentReceived"
                  label={t("首期实收（HKD）")}
                  rules={initialRentPaid ? required : undefined}
                  preserve={false}
                >
                  <MoneyInput disabled={!initialRentPaid} />
                </Form.Item>
                <Form.Item
                  name="initialDepositReceived"
                  label={t("押金实收（HKD）")}
                  rules={initialDepositPaid ? required : undefined}
                  preserve={false}
                >
                  <MoneyInput disabled={!initialDepositPaid} />
                </Form.Item>
                <Form.Item
                  name="initialPaymentReceivedOn"
                  label={t("到账日期")}
                  rules={required}
                  preserve={false}
                >
                  <DatePicker className="w-full" />
                </Form.Item>
              </>
            )}
          </div>
          {firstPaymentPaid && (
            <div className="grid grid-cols-2 gap-x-3 max-[760px]:grid-cols-1">
              <Form.Item label={t("租赁合同")}>
                <Upload
                  maxCount={1}
                  accept=".pdf"
                  beforeUpload={(file) => {
                    const result = acceptFile(file, true);
                    if (result !== false) return result;
                    setContractFile(file);
                    return false;
                  }}
                  onRemove={() => setContractFile(undefined)}
                >
                  <Button icon={<UploadOutlined />}>{t("上传合同 PDF")}</Button>
                </Upload>
              </Form.Item>
              <Form.Item label={t("付款凭证（可选）")}>
                <Upload
                  maxCount={1}
                  accept=".pdf,.png,.jpg,.jpeg,.webp"
                  beforeUpload={(file) => {
                    const result = acceptFile(file, false);
                    if (result !== false) return result;
                    setVoucherFile(file);
                    return false;
                  }}
                  onRemove={() => setVoucherFile(undefined)}
                >
                  <Button icon={<UploadOutlined />}>{t("上传付款凭证")}</Button>
                </Upload>
              </Form.Item>
            </div>
          )}
        </Section>
        <p className="text-xs text-[#63738d]">
          {t(
            "此处为首期收款填报，实际到账仍须财务核对；核对后才生成相关单据。提交时会校验同一单位的租期是否冲突。",
          )}
        </p>
        {row && (
          <Form.Item name="reason" label={t("修改原因")} rules={required}>
            <Input.TextArea rows={2} maxLength={500} />
          </Form.Item>
        )}
      </Form>
    </Drawer>
  );
}
