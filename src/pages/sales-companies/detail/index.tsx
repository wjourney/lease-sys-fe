import { ArrowLeftOutlined, PlusOutlined } from "@ant-design/icons";
import {
  Alert,
  Button,
  Empty,
  Image,
  Input,
  Modal,
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
import { Editor } from "../../../components/forms/ResourceEditor";
import {
  api,
  dateText,
  errorMessage,
  options,
  type Page,
  type Row,
} from "../../../shared/api";
import { t } from "../../../shared/i18n";
import { roleLabels } from "../../../shared/resource-config";
import { useRoot } from "../../../stores/root";
import { AccountPasswordModal } from "../../users/components/AccountPasswordModal";
import { AccountStatusTag } from "../../users/components/AccountStatusTag";
import { CreateUserDrawer } from "../../users/list/components/CreateUserDrawer";

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
  const [photos, setPhotos] = useState<Row[]>([]);
  const [photoOpen, setPhotoOpen] = useState(false);
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
  const detailRequest = useRef(0);
  const memberRequest = useRef(0);
  const headerHost = document.getElementById("record-detail-header");

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
        if (active)
          setPhotos(
            rows.filter((row) => row.category === "PHOTO" && row.storageKey),
          );
      })
      .catch(() => {
        if (active) setPhotos([]);
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

  function search() {
    setPage(1);
    setFilters({ keyword: keyword.trim(), role });
  }
  function reset() {
    setKeyword("");
    setRole("");
    setPage(1);
    setFilters({ keyword: "", role: "" });
  }

  if (!root.canRead("sales-companies"))
    return <Empty description={t("暂无此模块的访问权限")} />;
  if (error)
    return (
      <Alert
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
  const overview = [
    {
      label: "公司 / 会员编号",
      content: (
        <>
          {t(blank(company.name))}
          {company.nameEn ? ` / ${company.nameEn}` : ""} ·{" "}
          {t(blank(company.companyNo))}
        </>
      ),
    },
    {
      label: "联系人 / 电话 / 邮件",
      content: (
        <>
          {t(blank(company.contactName))} · {maskedPhone(company.phone)} ·{" "}
          {blank(company.email)}
        </>
      ),
    },
    {
      label: "地址 / 服务区域",
      content: (
        <>
          {t(blank(company.address))} · {t(blank(company.serviceArea))}
        </>
      ),
    },
    {
      label: "管理员 / 服务期限",
      content: (
        <>
          {summary?.admin
            ? `${summary.admin.username} / ${t(summary.admin.name)}`
            : "—"}{" "}
          · {dateText(company.serviceStartsOn)} {t("至")}{" "}
          {dateText(company.serviceEndsOn)} · {t("剩余")}{" "}
          {remainingDays(company.serviceEndsOn)}
        </>
      ),
    },
    {
      label: "商业登记 / 届满",
      content: (
        <>
          {t(blank(company.registrationNo))} /{" "}
          {dateText(company.registrationExpiresOn)}
          {photos.length > 0 && (
            <>
              {" "}
              ·{" "}
              <button
                type="button"
                className="text-[#1b355d] underline-offset-2 hover:underline"
                onClick={() => setPhotoOpen(true)}
              >
                {t(`公司照片 ${photos.length} 张`)}
              </button>
            </>
          )}
        </>
      ),
    },
    {
      label: "账号 / 分行 / 职位",
      content: (
        <>
          {t(
            `子账号 ${summary?.memberCount ?? 0} · 分行 ${company.branches?.length ?? 0} · 职位 ${company.positions?.length ?? 0}`,
          )}{" "}
          · {t("最后修改")} {dateText(company.updatedAt)}
        </>
      ),
    },
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
        <div className="flex gap-2">
          <Button size="small" onClick={() => navigate(`/users/${member.id}`)}>
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
        <div className="space-y-5">
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
            className="rounded-lg border border-[#e1e7ef] bg-white px-5 py-5 max-[700px]:px-4"
            aria-label={t("公司资料")}
          >
            <dl className="m-0 grid grid-cols-3 gap-x-7 gap-y-7 text-sm max-[1350px]:grid-cols-2 max-[700px]:grid-cols-1">
              {overview.map(({ label, content }) => (
                <div
                  key={label}
                  className="grid min-w-0 grid-cols-[max-content_minmax(0,1fr)] items-start gap-x-3 leading-6 max-[440px]:grid-cols-1"
                >
                  <dt className="whitespace-nowrap text-[#8190a4]">
                    {t(label)}：
                  </dt>
                  <dd className="m-0 min-w-0 break-words font-medium text-[#26344a]">
                    {content}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
          <section
            className="rounded-lg border border-[#e1e7ef] bg-white"
            aria-label={t("公司成员")}
          >
            <div className="flex flex-wrap items-end gap-3 p-5 max-[700px]:p-4">
              <div className="w-[280px] max-[650px]:w-full">
                <label
                  htmlFor="company-member-keyword"
                  className="mb-2 block text-xs text-[#8190a4]"
                >
                  {t("关键词")}
                </label>
                <Input
                  id="company-member-keyword"
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  onPressEnter={search}
                  placeholder={t("请输入关键词")}
                  allowClear
                />
              </div>
              <div className="w-[180px] max-[650px]:w-full">
                <label
                  htmlFor="company-member-role"
                  className="mb-2 block text-xs text-[#8190a4]"
                >
                  {t("成员角色")}
                </label>
                <Select
                  id="company-member-role"
                  className="w-full"
                  value={role}
                  onChange={setRole}
                  options={[
                    { value: "", label: t("全部角色") },
                    { value: "SALES_COMPANY_ADMIN", label: t("销售管理员") },
                    { value: "SALES", label: t("销售员工") },
                  ]}
                />
              </div>
              <Button onClick={reset}>{t("重置")}</Button>
              <Button type="primary" onClick={search}>
                {t("查询")}
              </Button>
            </div>
            {membersError && (
              <Alert
                className="mx-5 mb-4"
                type="error"
                showIcon
                message={t(membersError)}
              />
            )}
            <Table
              rowKey="id"
              columns={columns}
              dataSource={members.items}
              loading={membersLoading}
              pagination={false}
              scroll={{ x: 760 }}
              locale={{ emptyText: t("暂无成员账号") }}
              className="[&_.ant-table-thead_th]:!bg-[#f6f7f9] [&_.ant-table-thead_th]:!text-[#7b899e]"
            />
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 text-sm text-[#8190a4]">
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
      <Modal
        open={photoOpen}
        title={t("公司照片")}
        onCancel={() => setPhotoOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Image.PreviewGroup>
          <div className="grid grid-cols-3 gap-3 max-[600px]:grid-cols-2">
            {photos.map((photo) => (
              <Image
                key={photo.id}
                src={`/api/v1/materials/${photo.id}/download`}
                alt={photo.originalName || photo.title}
                className="!h-32 !w-full rounded object-cover"
              />
            ))}
          </div>
        </Image.PreviewGroup>
      </Modal>
      {editingCompany && (
        <Editor
          resource="sales-companies"
          row={company}
          onClose={() => setEditingCompany(false)}
          onSaved={() => setEditingCompany(false)}
        />
      )}
      {editingMember && (
        <Editor
          resource="users"
          row={editingMember}
          onClose={() => setEditingMember(undefined)}
          onSaved={() => setEditingMember(undefined)}
        />
      )}
      <CreateUserDrawer
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
