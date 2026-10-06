import { RequestError } from "../../../components/feedback/RequestError";
import {
  ArrowLeftOutlined,
  PictureOutlined,
  PlusOutlined,
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
import dayjs from "dayjs";
import { observer } from "mobx-react-lite";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router-dom";
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
const remainingDays = (end?: string) =>
  end
    ? `${Math.max(0, dayjs(end).startOf("day").diff(dayjs().startOf("day"), "day"))} 天`
    : "—";

const SalesCompanyDetailPage = observer(function SalesCompanyDetailPage() {
  const { id = "" } = useParams();
  const root = useRoot();
  const navigate = useNavigate();
  const [company, setCompany] = useState<Row>();
  const [summary, setSummary] = useState<{
    memberCount: number;
    admin?: Row;
  }>();
  const [images, setImages] = useState<Row[]>([]);
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
    Promise.all([
      api.get<Row>(`/sales-companies/${id}`),
      api.get<Page>("/users", {
        params: { salesCompanyId: id, page: 1, pageSize: 1 },
      }),
      api.get<Page>("/users", {
        params: {
          salesCompanyId: id,
          role: "SALES_COMPANY_ADMIN",
          page: 1,
          pageSize: 1,
        },
      }),
    ])
      .then(([detail, allMembers, admins]) => {
        if (request !== detailRequest.current) return;
        setCompany(detail.data);
        setSummary({
          memberCount: allMembers.data.total,
          admin: admins.data.items[0],
        });
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
        const available = rows.filter((row) => row.storageKey);
        const latestLogo = available
          .filter((row) => row.category === "LOGO")
          .sort((a, b) =>
            String(b.createdAt).localeCompare(String(a.createdAt)),
          )[0];
        setImages([
          ...(latestLogo ? [latestLogo] : []),
          ...available.filter((row) => row.category === "PHOTO"),
        ]);
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
      <h1 className="!m-0 truncate text-[19px] font-semibold text-[#26334a]">
        {t(company.name)}
      </h1>
    </div>
  );
  const featuredImage =
    images.find((image) => image.category === "PHOTO") || images[0];
  const otherImages = images.filter((image) => image.id !== featuredImage?.id);
  const overviewColumns = [
    [
      {
        label: "公司",
        value: (
          <>
            {t(blank(company.name))}
            {company.nameEn ? ` / ${company.nameEn}` : ""}
          </>
        ),
      },
      { label: "会员编号", value: blank(company.companyNo) },
      { label: "联系人", value: t(blank(company.contactName)) },
      {
        label: "账号统计",
        value: t(
          `子账号 ${summary?.memberCount ?? 0} · 分行 ${company.branches?.length ?? 0} · 职位 ${company.positions?.length ?? 0}`,
        ),
      },
    ],
    [
      { label: "电话", value: maskedPhone(company.phone) },
      { label: "邮箱", value: blank(company.email) },
      {
        label: "地址 / 服务区域",
        value: (
          <>
            {t(blank(company.address))} · {t(blank(company.serviceArea))}
          </>
        ),
      },
      { label: "最后修改", value: dateText(company.updatedAt) },
    ],
    [
      {
        label: "管理员",
        value: summary?.admin
          ? `${t(summary.admin.name)} / ${summary.admin.username}`
          : "—",
      },
      {
        label: "服务期限",
        value: (
          <>
            {dateText(company.serviceStartsOn)} {t("至")}{" "}
            {dateText(company.serviceEndsOn)}（{t("剩余")}{" "}
            {remainingDays(company.serviceEndsOn)}）
          </>
        ),
      },
      { label: "商业登记", value: blank(company.registrationNo) },
      { label: "登记届满", value: dateText(company.registrationExpiresOn) },
    ],
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
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm font-medium text-[#67758b]">
              {t("销售组织")} / {t(company.name)}
            </span>
            <div className="flex flex-wrap gap-2">
              {root.canWrite("sales-companies") && (
                <Button onClick={() => setEditingCompany(true)}>
                  {t("编辑销售公司")}
                </Button>
              )}
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
          <section
            className="rounded-lg border border-[#e1e7ef] bg-white px-5 py-4 max-[700px]:px-4"
            aria-label={t("公司资料")}
          >
            <div className="grid grid-cols-[152px_minmax(0,1fr)] gap-5 max-[700px]:grid-cols-1 max-[700px]:gap-4">
              <div className="min-w-0">
                {featuredImage ? (
                  <Image.PreviewGroup>
                    <div className="relative h-[140px] w-[152px]">
                      <Image
                        src={
                          featuredImage.previewUrl ||
                          `/api/v1/materials/${featuredImage.id}/download`
                        }
                        alt={
                          featuredImage.originalName ||
                          featuredImage.title ||
                          t("公司图片")
                        }
                        width={152}
                        height={140}
                        className="rounded-md border border-[#e1e7ef] object-cover"
                      />
                      {otherImages.length > 0 && (
                        <div className="absolute bottom-2 left-2 flex max-w-[136px] gap-1 overflow-x-auto rounded bg-white/80 p-1">
                          {otherImages.map((image) => (
                            <Image
                              key={image.id}
                              src={
                                image.previewUrl ||
                                `/api/v1/materials/${image.id}/download`
                              }
                              alt={
                                image.originalName ||
                                image.title ||
                                t("公司图片")
                              }
                              width={30}
                              height={28}
                              className="rounded border border-[#e1e7ef] object-cover"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </Image.PreviewGroup>
                ) : (
                  <div className="flex h-[140px] w-[152px] flex-col items-center justify-center gap-2 rounded-md border border-[#e1e7ef] bg-[#f7f8fa] text-xs text-[#9aa6b8]">
                    <PictureOutlined className="text-3xl" />
                    {t("暂无公司图片")}
                  </div>
                )}
              </div>
              <div className="grid min-w-0 grid-cols-3 gap-6 max-[1050px]:grid-cols-1">
                {overviewColumns.map((column, index) => (
                  <dl
                    key={index}
                    className={`m-0 min-w-0 space-y-2 text-sm leading-6 ${index > 0 ? "border-l border-[#e1e7ef] pl-6 max-[1050px]:border-0 max-[1050px]:pl-0" : ""}`}
                  >
                    {column.map(({ label, value }) => (
                      <div
                        key={label}
                        className="grid min-w-0 grid-cols-[max-content_minmax(0,1fr)] gap-x-3 max-[440px]:grid-cols-1"
                      >
                        <dt className="whitespace-nowrap text-[#8190a4]">
                          {t(label)}：
                        </dt>
                        <dd className="m-0 min-w-0 break-words font-medium text-[#26344a]">
                          {value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                ))}
              </div>
            </div>
          </section>
          <section
            className="company-member-section rounded-lg border border-[#e1e7ef] bg-white"
            aria-label={t("公司成员")}
          >
            <div className="flex flex-wrap items-end gap-3 p-5 max-[700px]:p-4">
              <div className="w-[280px] max-[650px]:w-full">
                <label
                  htmlFor="company-member-keyword"
                  className="mb-2 block text-sm text-[#8190a4]"
                >
                  {t("关键词")}
                </label>
                <Input
                  id="company-member-keyword"
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
              <div className="w-[180px] max-[650px]:w-full">
                <label
                  htmlFor="company-member-role"
                  className="mb-2 block text-sm text-[#8190a4]"
                >
                  {t("成员角色")}
                </label>
                <Select
                  id="company-member-role"
                  className="w-full"
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
              <div className="ml-auto flex items-center gap-2 max-[650px]:w-full max-[650px]:justify-end">
                <Button onClick={reset}>{t("重置")}</Button>
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
