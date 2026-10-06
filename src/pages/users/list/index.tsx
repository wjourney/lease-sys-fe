import { RequestError } from "../../../components/feedback/RequestError";
import { PlusOutlined } from "@ant-design/icons";
import { App, Button, Empty, Pagination, Table, Tooltip } from "antd";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useResourceList } from "../../../components/resource-list/useResourceList";
import { ResourceFilters } from "../../../components/resource-list/ResourceFilters";
import { ResourceListSurface } from "../../../components/resource-list/ResourceListSurface";
import { Row, api, errorMessage } from "../../../shared/api";
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
    changePage,
    refresh,
    searchNow,
    resetFilters,
  } = useResourceList("users", {}, false, PAGE_SIZE);
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<Row>();
  const [accountToDisable, setAccountToDisable] = useState<Row>();
  const [accountToDelete, setAccountToDelete] = useState<Row>();
  const [enablingId, setEnablingId] = useState<string>();
  const { message, modal } = App.useApp();

  async function enableAccount(row: Row) {
    setEnablingId(row.id);
    try {
      await api.patch(`/users/${row.id}`, {
        status: "ACTIVE",
        revision: row.revision,
        reason: "重新启用账号",
      });
      root.invalidate();
      message.success(t("账号已启用"));
    } catch (cause) {
      message.error(t(errorMessage(cause)));
    } finally {
      setEnablingId(undefined);
    }
  }

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
            {["SUPER_ADMIN", "OPERATIONS"].includes(root.user?.role) && (
              <Tooltip title={self ? t("不能停用当前登录账号") : undefined}>
                <span>
                  <Button
                    danger={!alreadyDisabled}
                    size="small"
                    disabled={self}
                    loading={enablingId === row.id}
                    onClick={() => {
                      if (alreadyDisabled)
                        modal.confirm({
                          title: t("启用账号"),
                          content: t("确定重新启用此账号？"),
                          okText: t("确认启用"),
                          cancelText: t("取消"),
                          onOk: () => enableAccount(row),
                        });
                      else setAccountToDisable(row);
                    }}
                  >
                    {t(alreadyDisabled ? "启用" : "停用")}
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
      <ResourceListSurface>
        {store.error && (
          <RequestError
            className="mb-4"
            type="error"
            showIcon
            message={t(store.error)}
            action={<Button onClick={refresh}>{t("重试")}</Button>}
          />
        )}
        <ResourceFilters
          q={q}
          setQ={setQ}
          searchNow={searchNow}
          resetFilters={resetFilters}
          resource="users"
          status={status}
          setStatus={setStatus}
          actions={
            root.canWrite("users") && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setCreating(true)}
              >
                {t("新建账号")}
              </Button>
            )
          }
        />
        <div className="list-scroll-area">
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
        </div>
        <div className="list-pagination flex flex-wrap items-center justify-end gap-x-4 gap-y-2">
          <span className="whitespace-nowrap text-sm text-[#8491a3]">
            {t(`共 ${store.total} 条`)}
          </span>
          <Pagination
            current={page}
            pageSize={PAGE_SIZE}
            total={store.total}
            showSizeChanger={false}
            onChange={changePage}
          />
        </div>
      </ResourceListSurface>
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
