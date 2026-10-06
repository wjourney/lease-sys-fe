import {
  GlobalOutlined,
  LockOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  App,
  Avatar,
  Button,
  Drawer,
  Dropdown,
  Layout,
  Menu,
  Spin,
} from "antd";
import { observer } from "mobx-react-lite";
import { Suspense, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AppRoutes } from "../app/routes";
import { loadTraditional, t } from "../shared/i18n";
import { Brand } from "../shared/ui";
import { useRoot } from "../stores/root";
import { getNavigation } from "./navigation";
import { ChangePasswordModal, ProfileModal } from "./ProfileModal";
const { Header, Sider, Content } = Layout;
const standaloneListPaths = new Set([
  "/projects",
  "/sales-companies",
  "/orders",
  "/users",
  "/incomes",
  "/expenses",
  "/commissions",
  "/invoices",
  "/materials",
  "/fund-accounts",
  "/fund-ledger",
]);
export const AppLayout = observer(function AppLayout() {
  const root = useRoot();
  const { modal } = App.useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [profile, setProfile] = useState(false);
  const [password, setPassword] = useState(false);
  const nav = getNavigation(root);
  const key = "/" + location.pathname.split("/")[1];
  const defaultOpenKeys = ["/settings", "/fund-accounts"].includes(key)
    ? ["settings"]
    : [
          "/incomes",
          "/expenses",
          "/commissions",
          "/invoices",
          "/fund-ledger",
          "/finance-statistics",
        ].includes(key)
      ? ["finance"]
      : [];
  const isRecordDetail = /^\/[^/]+\/[^/]+\/?$/.test(location.pathname);
  const isStandaloneList = standaloneListPaths.has(
    location.pathname.replace(/\/$/, ""),
  );
  const hasViewportList = /^\/(projects|sales-companies)\/[^/]+\/?$/.test(
    location.pathname,
  );
  const isOrderDetail = /^\/orders\/[^/]+\/?$/.test(location.pathname);
  return (
    <Layout className="app-layout min-h-screen">
      <Drawer
        title={root.site.siteName}
        placement="left"
        width={260}
        open={mobileMenu}
        onClose={() => setMobileMenu(false)}
      >
        <Menu
          className="[&_.ant-menu-title-content]:!text-sm"
          mode="inline"
          selectedKeys={[key]}
          defaultOpenKeys={defaultOpenKeys}
          items={nav}
          onClick={({ key }) => {
            navigate(key);
            setMobileMenu(false);
          }}
        />
      </Drawer>
      <Sider
        width={208}
        collapsed={collapsed}
        className="sidebar !fixed left-0 top-0 bottom-0 z-20 !bg-[#15243f] max-[760px]:hidden [&_.ant-menu]:px-[9px] [&_.ant-menu-item]:!my-[3px] [&_.ant-menu-item]:!mx-0 [&_.ant-menu-item]:!w-full [&_.ant-menu-submenu-title]:!my-[3px] [&_.ant-menu-submenu-title]:!mx-0 [&_.ant-menu-submenu-title]:!w-full [&.ant-layout-sider-collapsed_.brand]:px-[22px] [&.ant-layout-sider-collapsed_.brand_div]:hidden"
        trigger={null}
      >
        <Brand />
        <Menu
          className="!px-[9px] [&_.ant-menu-item]:!mx-0 [&_.ant-menu-submenu-title]:!mx-0 [&_.ant-menu-title-content]:!text-sm"
          theme="dark"
          mode="inline"
          selectedKeys={[key]}
          defaultOpenKeys={defaultOpenKeys}
          items={nav}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout
        className={
          collapsed ? "ml-20 max-[760px]:!ml-0" : "ml-[208px] max-[760px]:!ml-0"
        }
      >
        <Header className="topbar !sticky top-0 z-[15] !flex !h-[54px] items-center justify-between !border-b !border-[#edf0f4] !bg-white !px-7 !leading-normal [&>div]:flex [&>div]:items-center [&>div]:gap-[15px] max-[760px]:!px-3">
          {isRecordDetail ? (
            <div id="record-detail-header" className="min-w-0" />
          ) : (
            <div>
              <Button
                type="text"
                aria-label="折叠菜单"
                icon={
                  collapsed ? (
                    <MenuUnfoldOutlined aria-hidden={true} />
                  ) : (
                    <MenuFoldOutlined aria-hidden={true} />
                  )
                }
                onClick={() =>
                  window.matchMedia("(max-width: 760px)").matches
                    ? setMobileMenu(true)
                    : setCollapsed(!collapsed)
                }
              />
            </div>
          )}
          <div className="!gap-3.5 max-[760px]:!gap-[5px]">
            <Dropdown
              menu={{
                items: [
                  {
                    key: "zh_CN",
                    label: t("简体中文"),
                  },
                  {
                    key: "zh_TW",
                    label: t("繁體中文"),
                  },
                ],
                onClick: async ({ key }) => {
                  if (key === "zh_TW") await loadTraditional();
                  root.setLocale(key as any);
                },
              }}
            >
              <Button type="text" icon={<GlobalOutlined aria-hidden={true} />}>
                {t(root.locale === "zh_CN" ? "简体中文" : "繁體中文")}
              </Button>
            </Dropdown>
            <span className="h-[25px] border-l border-[#e8ecf2] max-[760px]:hidden" />
            <div className="!flex items-center !gap-2.5">
              <button
                type="button"
                aria-label={t("打开个人中心")}
                onClick={() => setProfile(true)}
                className="flex cursor-pointer items-center border-0 bg-transparent p-0 text-[#344059]"
              >
                <Avatar
                  size={32}
                  src={root.user?.avatarUrl}
                  className="!bg-[#edf1f6] !text-[#172942]"
                >
                  {t(root.user?.name?.slice(-2))}
                </Avatar>
              </button>
              <Dropdown
                menu={{
                  items: [
                    {
                      key: "profile",
                      label: t("个人中心"),
                      icon: <UserOutlined aria-hidden />,
                    },
                    {
                      key: "password",
                      label: t("修改密码"),
                      icon: <LockOutlined aria-hidden />,
                    },
                    {
                      key: "logout",
                      label: t("退出登录"),
                      icon: <LogoutOutlined aria-hidden />,
                    },
                  ],
                  onClick: ({ key }) => {
                    if (key === "logout") {
                      modal.confirm({
                        title: t("退出登录"),
                        content: t("确定退出当前账号吗？"),
                        okText: t("退出登录"),
                        cancelText: t("取消"),
                        onOk: () => root.logout(),
                      });
                    } else if (key === "password") setPassword(true);
                    else setProfile(true);
                  },
                }}
              >
                <button
                  type="button"
                  aria-label={t("账号菜单")}
                  className="cursor-pointer border-0 bg-transparent p-0 text-left text-sm font-medium whitespace-nowrap text-[#344059] max-[760px]:hidden"
                >
                  {t(root.user?.name)}
                </button>
              </Dropdown>
            </div>
          </div>
        </Header>
        <Content
          className={`main-content min-w-0 px-[30px] pt-[30px] pb-0 min-[1600px]:mx-auto min-[1600px]:w-full min-[1600px]:max-w-[1600px] max-[1100px]:px-[18px] max-[1100px]:pt-[22px] max-[760px]:px-3 max-[760px]:py-[18px] ${isStandaloneList ? "standalone-list-content" : ""} ${hasViewportList ? "viewport-detail-content" : ""} ${isOrderDetail ? "order-detail-content" : ""}`}
        >
          <Suspense
            fallback={
              <div className="flex h-[70vh] items-center justify-center">
                <Spin size="large" />
              </div>
            }
          >
            <AppRoutes />
          </Suspense>
          <footer className="p-[30px] text-center text-[10px] text-[#a7b0bc]">
            {root.site.footer}
          </footer>
        </Content>
      </Layout>
      <ProfileModal open={profile} onClose={() => setProfile(false)} />
      <ChangePasswordModal open={password} onClose={() => setPassword(false)} />
    </Layout>
  );
});
