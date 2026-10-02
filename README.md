# SUPREME BAY 租赁管理系统 · 前端

按五角色设计 PDF 和已确认的 12 张业务表实现。React + TypeScript + Vite + Ant Design + Tailwind CSS，MobX 管理登录状态、查询缓存及失效，Axios 通过同源 `/api` 代理连接 NestJS 服务。`src/style.css` 仅引入 Tailwind；业务样式写在组件的 `className` 中。

## 本地启动

需要 Node.js 22、pnpm 10；默认连接服务器 API，无需启动本地数据库或后端。

```bash
cd /Users/wenwen/www/learn/lease-sys-fe
pnpm install
pnpm dev
```

访问 http://127.0.0.1:5173 。Vite 将 `/api` 代理到 `https://47.117.136.208`，无需额外配置。可在 `.env.local` 中设置 `VITE_API_PROXY` 覆盖目标地址（命令行环境变量优先），修改后重启开发服务器。

登录、资料上传及预览均通过该代理访问服务器。本地开发使用服务器账号和真实业务数据，提交的修改也会保存到服务器。代理保留 HTTPS 证书校验，将同源开发请求的 Origin 转换为服务器来源，并仅为本机 HTTP 响应移除 Cookie 的 Secure 属性；生产配置不受影响。

## 初始账号

本地开发直接使用服务器上已有的账号和密码。后端新环境初始化时只创建一个超级管理员账号，初始化方式见后端 README。

| 账号  | 角色       |
| ----- | ---------- |
| admin | 超级管理员 |

登录会话 Cookie 为 HttpOnly，切换账号和修改业务数据会使缓存失效。列表查询缓存 30 秒，字典 5 分钟，财务列表每次重新请求；相同进行中请求复用，过期请求不覆盖新查询。

## 已实现页面

- 登录、个人中心和修改密码；五角色菜单、操作权限及服务端数据范围限制。
- 项目卡片、项目资料、单位列表和全盘状况；登录后进入项目管理。
- 订单创建、详情、直接修改、合同生成、关闭、退租、交还、押金结算。
- 收入应收及内嵌收款、到账确认和驳回；支出付款；月度与年度佣金及分次支付。
- 发票预览、PDF 下载、作废、重开、邮件发送和未知发送结果核验。
- 文件与文字资料、业务归属、私有下载和历史版本。
- 销售公司、个人账号、资金账户和单位类型字典；各业务详情内查看增删改记录。
- 简繁体界面切换及小屏菜单。用户录入内容原样存储。

项目封面有上传图片时显示实际图片，没有时显示建筑插画。合同使用项目文字模板生成 PDF；不是任意 DOCX 模板排版引擎。邮件发送需要后端配置 SMTP；未配置时页面明确提示，不模拟发送成功。

## 代码组织

```text
src/
  app/                     # 根组件、显式路由、主题、登录状态边界
  layouts/                 # 菜单、顶栏、个人中心
  pages/
    login/index.tsx + components/
    projects/
      list/index.tsx
      list/components/ProjectGrid.tsx
      detail/index.tsx
      detail/components/ProjectTabs.tsx
      projects.config.ts
    units/
    orders/
      list/index.tsx
      detail/index.tsx
      detail/components/  # OrderActions、OrderTabs
    incomes/
    expenses/
    commissions/
    invoices/
    materials/
    sales-companies/
    users/
    fund-accounts/
    settings/
  components/
    forms/                 # 共用表单、字段控件、资料编辑
    resource-list/         # 通用列表布局、筛选、查询 hook
    resource-detail/       # 通用详情布局、操作记录、数据/action hook
  stores/                  # MobX 状态与缓存
  shared/                  # HTTP、接口类型、字典、配置注册、基础 UI
```

每个列表页、详情页都有独立 TSX 路由入口，按页面懒加载。每个 page 都有自己的目录，专属组件放在 `pages/<业务>/<list|detail>/components/`；登录等单页使用 `pages/<页面>/components/`。同业务列表和详情共用的字段配置保留在业务目录。共用组件通过 props、renderItems 和详情 context 接入业务内容。`components` 不反向导入 `pages`，避免公共层依赖页面。

修改某个页面时先进入对应目录；只有多处共用的布局或行为才提取到 components。请求和状态逻辑放在 hook/store，表单通过字段控件复用，不再维护包含全部页面的大型组件。

前端请求通过 `src/shared/api.ts` 发出。原先的整站 Swagger 类型文件没有被业务代码使用，已移除；需要为某个接口补充类型时，在对应业务目录定义并用于请求与响应，不再把整站接口集中生成到一个文件。接口文档为 https://47.117.136.208/api/docs 。`docs/` 保留已确认的业务方案，实际字段和约束以后端 Prisma schema/SQL 为准。

## 检查与测试

```bash
pnpm typecheck
pnpm test
pnpm build
```

浏览器自动化测试显式覆盖 API 代理，使用独立测试数据库，不连接服务器业务 API。先在另一个终端启动测试 API：

```bash
cd /Users/wenwen/www/learn/lease-sys-be
pnpm test:serve
```

再在前端运行 `pnpm test:e2e`。测试自动启动 Vite 5174，连接测试 API 3002。测试默认使用本机 Chrome，可通过 `CHROME_EXECUTABLE` 指定路径。包含五角色页面权限、项目/单位/订单录入、收款/发票、简繁体和小屏导航。报告在 `playwright-report/`，失败截图在 `test-results/`。

## 部署

`pnpm build` 生成 `dist/`。用 Nginx 等静态服务器托管，为 React Router 配置 `try_files $uri /index.html`，并将 `/api/` 反向代理到后端。前后端保持同一站点；后端 `APP_ORIGIN` 设置为实际 HTTPS 域名。Vite 开发服务器不作为生产服务器。
