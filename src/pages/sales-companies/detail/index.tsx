import { RequestError } from "../../../components/feedback/RequestError";
import {
  ArrowLeftOutlined,
  BankOutlined,
  LeftOutlined,
  PictureOutlined,
  PlusOutlined,
  RightOutlined,
} from "@ant-design/icons";
import {
  Button,
  Drawer,
  Descriptions,
  Empty,
  Image,
  Input,
  Pagination,
  Select,
  Spin,
  Table,
} from "antd";
import { observer } from "mobx-react-lite";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  api,
  dateText,
  errorMessage,
  options,
  type Page,
  type Row,
} from "../../../shared/api";
import { t } from "../../../shared/i18n";
import { shouldOpenRow } from "../../../shared/row-navigation";
import { roleLabels } from "../../../shared/resource-config";
import { SEARCH_DEBOUNCE_MS } from "../../../shared/search";
import { useRoot } from "../../../stores/root";
import { AccountPasswordModal } from "../../users/components/AccountPasswordModal";
import { AccountStatusTag } from "../../users/components/AccountStatusTag";
import { UserDrawer } from "../../users/list/components/UserDrawer";
import { SalesCompanyDrawer } from "../list/components/SalesCompanyDrawer";

const PAGE_SIZE = 10;
const blank = (value: unknown) =>
  value === null || value === undefined || value === "" ? "—" : String(value);
const maskedPhone = (value?: string) =>
  value && value.length > 7
    ? `${value.slice(0, 3)}****${value.slice(-4)}`
    : blank(value);
const SalesCompanyDetailPage = observer(function SalesCompanyDetailPage() {
  const { id = "" } = useParams();
  const root = useRoot();
  const navigate = useNavigate();
  const location = useLocation();
  const activeTab =
    new URLSearchParams(location.search).get("tab") === "members"
      ? "members"
      : "company";
  const [company, setCompany] = useState<Row>();
  const [images, setImages] = useState<Row[]>([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [members, setMembers] = useState<Page>({
    items: [],
    total: 0,
    page: 1,
    pageSize: PAGE_SIZE,
  });
  const [membersLoading, setMembersLoading] = useState(true);
  const [membersError, setMembersError] = useState("");
  const [keyword, setKeyword] = useState("");
  const [role, setRole] = useState("");
  const [filters, setFilters] = useState({ keyword: "", role: "" });
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<Row>();
  const [editingCompany, setEditingCompany] = useState(false);
  const [editingMember, setEditingMember] = useState<Row>();
  const [viewingMember, setViewingMember] = useState<Row>();
  const viewMember = (member: Row) =>
    root.salesRole ? setViewingMember(member) : navigate(`/users/${member.id}`);
  const detailRequest = useRef(0);
  const memberRequest = useRef(0);
  const memberSearchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const headerHost = document.getElementById("record-detail-header");

  useEffect(() => () => clearTimeout(memberSearchTimer.current), []);

  useEffect(() => {
    const request = ++detailRequest.current;
    setLoading(true);
    setError("");
    api
      .get<Row>(`/sales-companies/${id}`)
      .then(({ data }) => {
        if (request !== detailRequest.current) return;
        setCompany(data);
      })
      .catch((cause) => {
        if (request === detailRequest.current) setError(errorMessage(cause));
      })
      .finally(() => {
        if (request === detailRequest.current) setLoading(false);
      });
    return () => {
      detailRequest.current++;
    };
  }, [id, root.epoch]);

  useEffect(() => {
    if (!root.canRead("materials")) return;
    let active = true;
    options("materials", { salesCompanyId: id })
      .then((rows) => {
        if (!active) return;
        setActiveImageIndex(0);
        setImages(
          rows
            .filter(
              (row) =>
                row.storageKey && ["LOGO", "PHOTO"].includes(row.category),
            )
            .sort(
              (a, b) =>
                Number(a.sortOrder || 0) - Number(b.sortOrder || 0) ||
                Number(b.category === "LOGO") - Number(a.category === "LOGO") ||
                String(a.createdAt).localeCompare(String(b.createdAt)),
            ),
        );
      })
      .catch(() => {
        if (active) setImages([]);
      });
    return () => {
      active = false;
    };
  }, [id, root.epoch]);

  useEffect(() => {
    const request = ++memberRequest.current;
    setMembersLoading(true);
    setMembersError("");
    api
      .get<Page>("/users", {
        params: {
          salesCompanyId: id,
          ...(filters.keyword ? { q: filters.keyword } : {}),
          ...(filters.role ? { role: filters.role } : {}),
          page,
          pageSize: PAGE_SIZE,
        },
      })
      .then(({ data }) => {
        if (request === memberRequest.current) setMembers(data);
      })
      .catch((cause) => {
        if (request === memberRequest.current)
          setMembersError(errorMessage(cause));
      })
      .finally(() => {
        if (request === memberRequest.current) setMembersLoading(false);
      });
    return () => {
      memberRequest.current++;
    };
  }, [id, filters, page, root.epoch]);

  function applyMemberFilters(nextKeyword: string, nextRole: string) {
    clearTimeout(memberSearchTimer.current);
    setPage(1);
    const normalizedKeyword = nextKeyword.trim();
    setFilters((current) =>
      current.keyword === normalizedKeyword && current.role === nextRole
        ? current
        : { keyword: normalizedKeyword, role: nextRole },
    );
  }
  function changeKeyword(value: string) {
    setKeyword(value);
    clearTimeout(memberSearchTimer.current);
    if (!value.trim()) applyMemberFilters("", role);
    else
      memberSearchTimer.current = setTimeout(
        () => applyMemberFilters(value, role),
        SEARCH_DEBOUNCE_MS,
      );
  }
  function reset() {
    setKeyword("");
    setRole("");
    applyMemberFilters("", "");
  }
  function changeTab(tab: "company" | "members") {
    const search = new URLSearchParams(location.search);
    if (tab === "members") search.set("tab", "members");
    else search.delete("tab");
    navigate(
      { pathname: location.pathname, search: search.toString() },
      { replace: true },
    );
  }

  if (!root.canRead("sales-companies"))
    return <Empty description={t("暂无此模块的访问权限")} />;
  if (error)
    return (
      <RequestError
        type="error"
        showIcon
        message={t(error)}
        action={<Button onClick={() => root.invalidate()}>{t("重试")}</Button>}
      />
    );
  if (!company) return <Spin spinning={loading} />;

  const heading = (
    <div className="flex min-w-0 items-center gap-3">
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        aria-label={t("返回上级")}
        onClick={() => navigate("/sales-companies")}
      />
      <h1 className="record-header-title">{t(company.name)}</h1>
    </div>
  );
  const selectedImageIndex = Math.min(activeImageIndex, images.length - 1);
  const selectedImage = images[selectedImageIndex];
  const imageUrl = (image: Row) =>
    image.previewUrl || `/api/v1/materials/${image.id}/download`;
  const overviewColumns = [
    [
      { label: "中文名称", value: company.name },
      { label: "联系人", value: company.contactName },
      { label: "电话", value: company.phone ? maskedPhone(company.phone) : "" },
      { label: "邮箱", value: company.email },
      { label: "公司地址", value: company.address },
      { label: "服务区域", value: company.serviceArea },
    ],
    [
      { label: "英文名称", value: company.nameEn },
      { label: "商业登记号码", value: company.registrationNo },
      {
        label: "商业登记届满日期",
        value: company.registrationExpiresOn
          ? dateText(company.registrationExpiresOn)
          : "",
      },
      {
        label: "开通时间",
        value: company.serviceStartsOn ? dateText(company.serviceStartsOn) : "",
      },
      {
        label: "服务到期日",
        value: company.serviceEndsOn ? dateText(company.serviceEndsOn) : "",
      },
    ],
  ];
  const payoutFields = [
    { label: "开户银行", value: company.payoutBankName },
    { label: "账户名称", value: company.payoutAccountName },
    { label: "银行账号", value: company.payoutAccountNo },
  ];
  const columns = [
    {
      title: t("姓名"),
      dataIndex: "name",
      key: "name",
      render: (value: string) => t(blank(value)),
    },
    { title: t("登录账号"), dataIndex: "username", key: "username" },
    {
      title: t("角色"),
      dataIndex: "role",
      key: "role",
      render: (value: string) => t(roleLabels[value] || value || "—"),
    },
    {
      title: t("手机号"),
      dataIndex: "phone",
      key: "phone",
      render: (value: string) => maskedPhone(value),
    },
    {
      title: t("状态"),
      dataIndex: "status",
      key: "status",
      render: (value: string) => <AccountStatusTag status={value} />,
    },
    {
      title: t("操作"),
      key: "actions",
      render: (_: unknown, member: Row) => (
        <div className="flex gap-2" data-row-action>
          <Button size="small" onClick={() => viewMember(member)}>
            {t("查看")}
          </Button>
          {root.canWrite("users") && (
            <Button size="small" onClick={() => setEditingMember(member)}>
              {t("编辑")}
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      {headerHost ? createPortal(heading, headerHost) : heading}
      <Spin spinning={loading}>
        <div className="sales-company-detail-layout">
          <div className="sales-company-detail-tabs flex shrink-0 items-center gap-3 border-b border-[#dfe6ef]">
            <div
              role="tablist"
              aria-label={t("销售公司详情")}
              className="flex gap-2"
            >
              {(
                [
                  ["company", "公司资料"],
                  ["members", "成员列表"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  id={`sales-company-tab-${key}`}
                  aria-controls={`sales-company-panel-${key}`}
                  aria-selected={activeTab === key}
                  onClick={() => changeTab(key)}
                  className={`min-h-11 border-b-[3px] px-5 text-[14px] font-medium transition-colors hover:text-[#17355d] focus-visible:outline-2 focus-visible:outline-[#17355d] ${activeTab === key ? "border-[#17355d] text-[#17355d]" : "border-transparent text-[#72819a]"}`}
                >
                  {t(label)}
                </button>
              ))}
            </div>
          </div>
          {activeTab === "company" ? (
            <section
              id="sales-company-panel-company"
              role="tabpanel"
              aria-labelledby="sales-company-tab-company"
              className="sales-company-overview rounded-lg border border-[#e1e7ef] bg-white px-5 py-4 max-[700px]:px-4"
            >
              {root.canWrite("sales-companies") && (
                <div className="mb-4 flex justify-start border-b border-[#e4eaf1] pb-4">
                  <Button onClick={() => setEditingCompany(true)}>
                    {t("编辑销售公司")}
                  </Button>
                </div>
              )}
              <div className="sales-company-overview-grid">
                <div className="sales-company-gallery min-w-0">
                  <div
                    className={`sales-company-gallery-body ${images.length > 1 ? "has-thumbnails" : ""}`}
                    aria-label={t(`公司图片（${images.length}）`)}
                  >
                    <div className="sales-company-gallery-main">
                      {selectedImage ? (
                        <Image.PreviewGroup
                          items={images.map(imageUrl)}
                          preview={{
                            current: selectedImageIndex,
                            onChange: (current) => setActiveImageIndex(current),
                          }}
                        >
                          <Image
                            src={imageUrl(selectedImage)}
                            alt={
                              selectedImage.originalName ||
                              selectedImage.title ||
                              t("公司图片")
                            }
                          />
                        </Image.PreviewGroup>
                      ) : (
                        <div className="flex h-full flex-col items-center justify-center gap-2 bg-[#f7f8fa] text-xs text-[#9aa6b8]">
                          <PictureOutlined className="text-3xl" />
                          {t("暂无公司图片")}
                        </div>
                      )}
                      {images.length > 1 && (
                        <>
                          <button
                            type="button"
                            className="sales-company-gallery-arrow left-2"
                            aria-label={t("上一张公司图片")}
                            onClick={() =>
                              setActiveImageIndex(
                                (selectedImageIndex - 1 + images.length) %
                                  images.length,
                              )
                            }
                          >
                            <LeftOutlined />
                          </button>
                          <button
                            type="button"
                            className="sales-company-gallery-arrow right-2"
                            aria-label={t("下一张公司图片")}
                            onClick={() =>
                              setActiveImageIndex(
                                (selectedImageIndex + 1) % images.length,
                              )
                            }
                          >
                            <RightOutlined />
                          </button>
                          <span className="sales-company-gallery-count">
                            {selectedImageIndex + 1}/{images.length}
                          </span>
                        </>
                      )}
                    </div>
                    {images.length > 1 && (
                      <div
                        className="sales-company-gallery-thumbs"
                        aria-label={t("公司图片列表")}
                      >
                        {images.map((image, index) => (
                          <button
                            key={image.id}
                            type="button"
                            className={`sales-company-gallery-thumb ${index === selectedImageIndex ? "is-active" : ""}`}
                            aria-label={t(`查看第 ${index + 1} 张公司图片`)}
                            aria-pressed={index === selectedImageIndex}
                            onClick={() => setActiveImageIndex(index)}
                          >
                            <img src={imageUrl(image)} alt="" loading="lazy" />
                            {index === 0 && <span>{t("封面")}</span>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="sales-company-overview-fields">
                    {overviewColumns.map((column, index) => (
                      <dl
                        key={index}
                        className="m-0 min-w-0 space-y-1.5 text-sm leading-6"
                      >
                        {column.map(({ label, value }) => (
                          <div
                            key={label}
                            className="grid min-w-0 grid-cols-[126px_minmax(0,1fr)] gap-x-3 max-[440px]:grid-cols-[112px_minmax(0,1fr)]"
                          >
                            <dt className="whitespace-nowrap text-[#8190a4]">
                              {t(label)}
                            </dt>
                            <dd
                              className={`m-0 min-w-0 break-words ${value ? "font-medium text-[#26344a]" : "text-[#9aa6b8]"}`}
                            >
                              {value ? t(String(value)) : t("未填写")}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    ))}
                  </div>
                </div>
              </div>
              <div className="sales-company-payout">
                <h3 className="m-0 flex shrink-0 items-center gap-2 text-sm font-semibold text-[#26344a]">
                  <BankOutlined className="text-[#216bd9]" />
                  {t("收款账户")}
                </h3>
                {payoutFields.map(({ label, value }) => (
                  <div
                    key={label}
                    className="sales-company-payout-field flex min-w-0 items-start gap-2 text-sm"
                  >
                    <span className="shrink-0 text-[#8190a4]">{t(label)}</span>
                    <span
                      className={`min-w-0 break-words [overflow-wrap:anywhere] ${value ? "font-medium text-[#26344a]" : "text-[#9aa6b8]"}`}
                    >
                      {value ? t(String(value)) : t("未填写")}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          ) : (
            <section
              id="sales-company-panel-members"
              role="tabpanel"
              aria-labelledby="sales-company-tab-members"
              className="company-member-section rounded-lg border border-[#e1e7ef] bg-white"
            >
              <div className="flex flex-wrap items-center gap-x-5 gap-y-3 px-5 pt-4 pb-4 max-[700px]:px-4">
                <div className="flex min-w-0 items-center gap-3 max-[650px]:w-full">
                  <label
                    htmlFor="company-member-keyword"
                    className="shrink-0 whitespace-nowrap text-sm text-[#8190a4]"
                  >
                    {t("关键词")}
                  </label>
                  <Input
                    id="company-member-keyword"
                    className="w-[280px] max-[650px]:min-w-0 max-[650px]:flex-1"
                    value={keyword}
                    onChange={(event) => changeKeyword(event.target.value)}
                    onPressEnter={(event) => {
                      if (!event.nativeEvent.isComposing)
                        applyMemberFilters(keyword, role);
                    }}
                    placeholder={t("请输入关键词")}
                    allowClear
                  />
                </div>
                <div className="flex min-w-0 items-center gap-3 max-[650px]:w-full">
                  <label
                    htmlFor="company-member-role"
                    className="shrink-0 whitespace-nowrap text-sm text-[#8190a4]"
                  >
                    {t("成员角色")}
                  </label>
                  <Select
                    id="company-member-role"
                    className="w-[180px] max-[650px]:min-w-0 max-[650px]:flex-1"
                    value={role}
                    onChange={(value) => {
                      setRole(value);
                      applyMemberFilters(keyword, value);
                    }}
                    options={[
                      { value: "", label: t("全部角色") },
                      { value: "SALES_COMPANY_ADMIN", label: t("销售管理员") },
                      { value: "SALES", label: t("销售员工") },
                    ]}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button onClick={reset}>{t("重置")}</Button>
                  {root.canWrite("users") && (
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => setCreating(true)}
                    >
                      {t("新建成员账号")}
                    </Button>
                  )}
                </div>
              </div>
              {membersError && (
                <RequestError
                  className="mx-5 mb-4"
                  type="error"
                  showIcon
                  message={t(membersError)}
                />
              )}
              <div className="embedded-list-scroll">
                <Table
                  rowKey="id"
                  onRow={(member) => ({
                    className: "cursor-pointer",
                    onClick: (event) => {
                      if (shouldOpenRow(event)) viewMember(member);
                    },
                  })}
                  columns={columns}
                  dataSource={members.items}
                  loading={membersLoading}
                  pagination={false}
                  scroll={{ x: 760 }}
                  locale={{ emptyText: t("暂无成员账号") }}
                  className="[&_.ant-table-thead_th]:!bg-[#f6f7f9] [&_.ant-table-thead_th]:!text-[#7b899e] [&_.ant-table-placeholder_.ant-table-cell]:!h-36"
                />
              </div>
              <div className="flex flex-wrap items-center justify-end gap-5 px-5 py-4 text-sm text-[#8190a4]">
                <span>{t(`共 ${members.total} 条`)}</span>
                <Pagination
                  current={page}
                  pageSize={PAGE_SIZE}
                  total={members.total}
                  showSizeChanger={false}
                  onChange={setPage}
                />
              </div>
            </section>
          )}
        </div>
      </Spin>
      <Drawer
        open={!!viewingMember}
        title={t("员工资料")}
        onClose={() => setViewingMember(undefined)}
        width={520}
      >
        {viewingMember && (
          <Descriptions
            column={1}
            items={[
              { key: "name", label: t("姓名"), children: viewingMember.name },
              {
                key: "username",
                label: t("登录账号"),
                children: viewingMember.username,
              },
              {
                key: "role",
                label: t("角色"),
                children: t(
                  roleLabels[viewingMember.role] || viewingMember.role,
                ),
              },
              {
                key: "phone",
                label: t("手机号"),
                children: viewingMember.phone || "—",
              },
              {
                key: "email",
                label: "Email",
                children: viewingMember.email || "—",
              },
              {
                key: "status",
                label: t("状态"),
                children: <AccountStatusTag status={viewingMember.status} />,
              },
            ]}
          />
        )}
      </Drawer>
      {editingCompany && (
        <SalesCompanyDrawer
          company={company}
          onClose={() => setEditingCompany(false)}
          onSaved={() => setEditingCompany(false)}
        />
      )}
      {editingMember && (
        <UserDrawer
          open
          account={editingMember}
          onClose={() => setEditingMember(undefined)}
          onSaved={() => setEditingMember(undefined)}
        />
      )}
      <UserDrawer
        open={creating}
        initialSalesCompanyId={id}
        onClose={() => setCreating(false)}
        onCreated={(account) => {
          setCreating(false);
          setCreated(account);
          root.invalidate();
        }}
      />
      <AccountPasswordModal
        open={!!created}
        username={created?.username || ""}
        initialPassword={created?.initialPassword || ""}
        companyName={company.name}
        onClose={() => setCreated(undefined)}
      />
    </>
  );
});

export default SalesCompanyDetailPage;
