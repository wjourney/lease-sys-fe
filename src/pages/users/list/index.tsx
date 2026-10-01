import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import {
  Alert,
  App,
  Button,
  Empty,
  Input,
  Pagination,
  Select,
  Table,
  Tooltip,
} from "antd";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useResourceList } from "../../../components/resource-list/useResourceList";
import { Row } from "../../../shared/api";
import { t } from "../../../shared/i18n";
import { shouldOpenRow } from "../../../shared/row-navigation";
import { roleLabels } from "../../../shared/resource-config";
import { AccountStatusTag } from "../components/AccountStatusTag";
import { AccountPasswordModal } from "../components/AccountPasswordModal";
import { DisableUserModal } from "../detail/components/DisableUserModal";
import { UserDrawer } from "./components/UserDrawer";
import { DeleteUserModal } from "./components/DeleteUserModal";

const PAGE_SIZE = 10;

const UserListPage = observer(function UserListPage() {
  const {
    root,
    navigate,
    store,
    q,
    setQ,
    status,
    setStatus,
    page,
    query,
    filter,
    setSearch,
    refresh,
    searchNow,
  } = useResourceList("users", {}, false, PAGE_SIZE);
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<Row>();
  const [accountToDisable, setAccountToDisable] = useState<Row>();
  const [accountToDelete, setAccountToDelete] = useState<Row>();
  const { message } = App.useApp();

  if (!root.canRead("users"))
    return <Empty description={t("暂无此模块的访问权限")} />;

  const columns = [
    {
      title: t("姓名"),
      dataIndex: "name",
      key: "name",
      width: 180,
      render: (value: string, row: Row) => (
        <Link to={`/users/${row.id}`}>{t(value || "—")}</Link>
      ),
    },
    {
      title: t("登录账号"),
      dataIndex: "username",
      key: "username",
      width: 190,
    },
    {
      title: t("角色"),
      dataIndex: "role",
      key: "role",
      width: 180,
      render: (value: string) => t(roleLabels[value] || value || "—"),
    },
    {
      title: t("所属公司"),
      dataIndex: "companyName",
      key: "companyName",
      width: 220,
      render: (value: string) => t(value || "内部"),
    },
    {
      title: t("状态"),
      dataIndex: "status",
      key: "status",
      width: 110,
      render: (value: string) => <AccountStatusTag status={value} />,
    },
    {
      title: t("操作"),
      key: "actions",
      width: 210,
      render: (_: unknown, row: Row) => {
        const alreadyDisabled = row.status === "DISABLED";
        const self = row.id === root.user?.id;
        return (
          <div className="flex items-center gap-2" data-row-action>
            <Button size="small" onClick={() => navigate(`/users/${row.id}`)}>
              {t("查看")}
            </Button>
            {root.user?.role === "SUPER_ADMIN" && (
              <Tooltip
                title={
                  self
                    ? t("不能停用当前登录账号")
                    : alreadyDisabled
                      ? t("账号已停用")
                      : undefined
                }
              >
                <span>
                  <Button
                    danger
                    size="small"
                    disabled={self || alreadyDisabled}
                    onClick={() => setAccountToDisable(row)}
                  >
                    {t("停用")}
                  </Button>
                </span>
              </Tooltip>
            )}
            {root.canWrite("users") && (
              <Tooltip title={self ? t("不能删除当前登录账号") : undefined}>
                <span>
                  <Button
                    danger
                    size="small"
                    disabled={self}
                    onClick={() => setAccountToDelete(row)}
                  >
                    {t("删除")}
                  </Button>
                </span>
              </Tooltip>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <>
      <section className="rounded-lg border border-[#e5eaf0] bg-white p-6 max-[700px]:p-4">
        {store.error && (
          <Alert
            className="mb-4"
            type="error"
            showIcon
            message={t(store.error)}
            action={<Button onClick={refresh}>{t("重试")}</Button>}
          />
        )}
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <label
            htmlFor="user-search"
            className="shrink-0 text-sm text-[#73819a]"
          >
            {t("关键词")}
          </label>
          <Input
            id="user-search"
            className="!h-10 !w-[280px] max-[700px]:!w-full"
            value={q}
            onChange={(event) => setQ(event.target.value)}
            onPressEnter={searchNow}
            prefix={<SearchOutlined className="text-[#8c99ac]" />}
            placeholder={t("请输入关键词")}
            allowClear
          />
          <label
            htmlFor="user-status"
            className="shrink-0 text-sm text-[#73819a]"
          >
            {t("状态")}
          </label>
          <Select
            id="user-status"
            className="!w-[180px] max-[700px]:!w-full"
            value={status}
            onChange={setStatus}
            options={[
              { value: "", label: t("全部状态") },
              { value: "ACTIVE", label: t("启用") },
              { value: "DISABLED", label: t("停用") },
            ]}
          />
          {root.canWrite("users") && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setCreating(true)}
            >
              {t("新建账号")}
            </Button>
          )}
          <div className="ml-auto flex gap-2 max-[700px]:ml-0">
            <Button
              onClick={() => {
                setQ("");
                setStatus("");
                setSearch({ page: "1" });
              }}
            >
              {t("重置")}
            </Button>
            <Button onClick={searchNow}>{t("查询")}</Button>
          </div>
        </div>
        <Table
          rowKey="id"
          onRow={(row) => ({
            className: "cursor-pointer",
            onClick: (event) => {
              if (shouldOpenRow(event)) navigate(`/users/${row.id}`);
            },
          })}
          columns={columns}
          dataSource={store.items}
          loading={store.loading}
          pagination={false}
          scroll={{ x: 900 }}
          size="middle"
          locale={{ emptyText: t("暂无账号") }}
          className="[&_.ant-table-thead_th]:!bg-[#f6f7f9] [&_.ant-table-thead_th]:!text-[#7b899e]"
        />
        <div className="mt-5 flex flex-wrap items-center justify-end gap-x-4 gap-y-2">
          <span className="whitespace-nowrap text-sm text-[#8491a3]">
            {t(`共 ${store.total} 条`)}
          </span>
          <Pagination
            current={page}
            pageSize={PAGE_SIZE}
            total={store.total}
            showSizeChanger={false}
            onChange={(next) =>
              setSearch({ q: query, status: filter || "", page: String(next) })
            }
          />
        </div>
      </section>
      <UserDrawer
        open={creating}
        onClose={() => setCreating(false)}
        onCreated={(row) => {
          setCreating(false);
          setCreated(row);
          root.invalidate();
        }}
      />
      <AccountPasswordModal
        open={!!created}
        username={created?.username || ""}
        initialPassword={created?.initialPassword || ""}
        companyName={created?.companyName}
        onClose={() => setCreated(undefined)}
      />
      <DisableUserModal
        id={accountToDisable?.id || ""}
        open={!!accountToDisable}
        onClose={() => setAccountToDisable(undefined)}
        onDisabled={() => {
          setAccountToDisable(undefined);
          root.invalidate();
          message.success(t("账号已停用"));
        }}
      />
      {accountToDelete && (
        <DeleteUserModal
          id={accountToDelete.id}
          name={accountToDelete.name || accountToDelete.username}
          onClose={() => setAccountToDelete(undefined)}
          onDeleted={() => {
            setAccountToDelete(undefined);
            root.invalidate();
            message.success(t("账号已删除"));
          }}
        />
      )}
    </>
  );
});

export default UserListPage;
