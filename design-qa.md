# 项目详情设计核对（2026-09-30）

- Source visual truth: `/var/folders/bt/4n01wyf90vb8ls2llwvnkff40000gp/T/codex-clipboard-d5248a48-2ce4-4c01-a4fe-ecc202dae101.png`，1970 × 1150 像素。
- Implementation: `http://127.0.0.1:5173/projects/a76160bd-8f2c-45d0-b53b-e7fb8131b62c`。实现截图由 Codex 内置浏览器在本次任务中捕获并内联显示；浏览器工具未提供持久化文件路径。
- Comparison viewport: 1970 × 1140 CSS px，浏览器截图 1970 × 1140 像素，1×。参考图只包含主内容，实现截图包含侧边栏和顶部栏；比较时聚焦项目概览与单位列表内容区。
- State: 超级管理员，真实项目，0 个单位，未打开弹窗。

## Findings and comparison history

1. 初次宽屏比对：项目概览的标题、统计数字与资料入口小于参考图；销售端价格说明缺少浅色层级。已放大相关字号、按钮与入口高度，并把括号说明改为浅色。复查的 1970 × 1140 浏览器截图显示层级、分栏、分割线与入口顺序已对齐。
2. 1250 px 宽度比对：七个资料入口同排时，项目文件的次要文字被截断。已在 1450 px 以下将三个媒体入口与四个资料入口分为两行；复查 1250 px 浏览器截图无截断。
3. 390 px 视口：确认文档宽度等于视口宽度，资料入口按两列排列，无横向溢出。

## Fidelity review

- Typography: 项目概览标题、统计数字、字段、入口与筛选标题使用现有系统字体和加深的海军蓝层级；未发现影响识读的截断。
- Spacing/layout: 概览左侧资料、右侧四项统计、下方七个入口与独立单位列表，顺序和结构与参考图一致；窄屏按内容宽度换行。
- Colors/tokens: 白色卡片、浅灰分隔线、海军蓝主色和四项统计色与现有界面一致。
- Images/assets: 参考图只含标准界面图标与空态插图；实现复用 Ant Design 图标和现有 Ant Design 空态资源。
- Copy/content: 标题、四项统计、七个资料入口、筛选项及空态说明与参考图一致；项目资料来自当前真实记录。
- Focused checks: 已检查媒体入口与资料按钮区域、顶部统计区域和筛选区；无需额外聚焦截图。
- Interaction checks: 基本资料弹窗、项目图片空态弹窗正常打开和关闭；查询与重置按钮仍连接原筛选逻辑。

无剩余 P0–P2 问题。参考图未显示项目非空状态，单位卡片保留既有样式。

final result: passed

## 导航与新建单位抽屉复核（2026-09-30）

- 参考图：`codex-clipboard-00c76423-a631-487a-96f8-a7b6599e4b31.png`、`codex-clipboard-5566e788-581a-4fa2-8ced-692f3186f81a.png`。项目总数图三未随消息提供，按文字要求放在分页左侧。
- 内置浏览器 1440 × 900 视口：侧栏仅有项目管理、销售组织、订单管理、账号管理、财务管理、系统设置六个一级入口；系统设置展开后显示单位类型配置。项目详情的新建单位抽屉按四组、三列表单呈现，底部按钮固定；窄屏自动改为单列。
- 项目列表：实测“共 1 个项目”显示在分页控件左侧，同一行对齐。
- 交互核对：新建单位抽屉可打开，项目已按当前项目选中，字段和三个上传入口可访问；未向现有项目写入测试数据。

final result: passed

## 新建销售公司抽屉核对（2026-10-01）

- Source visual truth: `/var/folders/bt/4n01wyf90vb8ls2llwvnkff40000gp/T/codex-clipboard-1ceedd6f-6e74-4ba7-95a5-4467e9a07c07.png`，1056 × 868 像素。
- Implementation: `http://127.0.0.1:5173/sales-companies` 的“新建销售公司”右侧抽屉。用户随后明确要求抽屉，覆盖了参考图的居中弹窗形式。
- Viewport/state: 浏览器默认视口；已检查右侧展开、表单内容区滚动和底部固定操作区。

### Findings and comparison history

1. [P1] 设计稿的管理员账号和姓名是必填可编辑字段；当前实现显示为不可编辑，并指向账号管理单独创建。自动审批拒绝新增“创建销售公司时同步创建管理员账号及初始密码”的后端操作。需要用户明确授权该账号创建行为后，才能完成这部分交互。
2. [P3] 实现采用空表单占位文案，参考图填有示例数据；属于状态差异，不影响字段结构与表单使用。

### Fidelity review

- Fonts/typography: 沿用系统现有字体与深蓝标题、灰色字段名，字段层级与参考图一致。
- Spacing/layout: 两块浅灰分组、公司资料三列与末行两列、账号与服务三列；抽屉内容可滚动，底部按钮固定。
- Colors/tokens: 使用现有白色抽屉、浅灰分组、深蓝主按钮和浅色边框。
- Images/assets: 参考图没有需要另制的图像素材；上传图标使用现有 Ant Design 图标。
- Copy/content: 公司资料、服务期限和说明文案已对应；管理员字段因审批限制呈禁用提示。
- Interaction checks: 抽屉可从页面右侧打开，关闭、服务区域、日期和上传入口可访问；此前已验证空表单必填校验，未写入测试公司。

### Implementation checklist

1. 获得明确授权后，将管理员账号与姓名改为可编辑必填字段，并由后端在创建公司时原子地创建管理员账号、返回一次性初始密码。
2. 重新捕获相同状态并复核账号与服务分组。

final result: blocked

## 销售公司详情页面复核（2026-10-01）

- 参考图：`codex-clipboard-782574ba-143f-496d-85f1-68bc37dc1fb2.png`。实现页：本地浏览器 `/sales-companies/62df348a-81e7-41fc-8e16-c390a4c6b26d`，以现有真实公司记录检查。参考图有两名成员，现有公司没有成员，因此列表内容与行数不可逐项比较。
- 页面已改为顶部公司名称与返回入口、操作按钮、六行公司资料、下方独立成员筛选和表格。原“操作记录”标签及其入口均未出现。
- 字体与颜色沿用现有深蓝/浅灰体系；白色资料卡、表格表头、间距与参考图一致。照片使用已有素材接口，当前公司无照片，不展示空预览入口。
- 已在浏览器检查公司详情、编辑抽屉及新建成员抽屉；新建成员默认选择当前公司和销售员工角色，未提交测试数据。列表接口按当前公司 ID 筛选，真实空态显示“共 0 条”。
- 生产构建和 TypeScript 检查通过。成员行的“查看/编辑”已接到既有页面与抽屉；因当前公司没有成员，未在浏览器点击行操作。

final result: passed

## 个人中心账号详情复核（2026-10-01）

- 参考图：`codex-clipboard-e814463d-49c3-4f57-ae2f-74065add3b6c.png`。实现：本地浏览器销售组织页点击右上角头像，1280 × 720 视口，真实超级管理员账号。
- 对比结果：居中白色弹窗、头像身份区、个人信息与账号信息两块浅灰卡片、三列字段和右下角关闭按钮已按参考图呈现。账号菜单仍保留修改密码与退出登录入口。
- 参考图是销售员工示例，实际核对账号为内部超级管理员，因此所属公司及编号、剩余期限按真实数据展示为「—」。后端用户详情补充了所属公司的编号和服务到期日，销售账号可据此显示真实编号和有效剩余天数。
- 后端没有独立的用户业务编号与开通时间字段；当前账号编号显示实际 UUID，开通时间采用账号创建时间。未向数据库写入测试账号。
- 前后端 TypeScript 检查和前端生产构建通过；浏览器已核对头像直接打开弹窗、关闭弹窗及修改密码入口可打开。

final result: passed

---

# 订单详情页视觉验收

**final result: passed**

对照范围：六个标签页，以及押金的收取、部分退款状态。来源是此前确认的设计稿；实现是本机隔离测试库中 Chrome 渲染的订单详情。设计稿约 1672 × 941 px，实测页面以 1440 × 900 CSS px、deviceScaleFactor 1 截图。对照图将两边分别等比缩放到 1000 px 宽，并列检查；原始尺寸和页面内容不同，不以像素差判定。

| 标签 | 设计稿 | 实现截图 | 并列对照 |
| --- | --- | --- | --- |
| 基本资料 | [来源](/Users/wenwen/.codex/generated_images/01a0ec57-f308-7bd2-b722-e5822d889eda/exec-dfdc37cd-9a95-42d6-ba44-db8fa5a5deb8.png) | [实测](/Users/wenwen/.codex/visualizations/2026/09/29/01a0ec57-f308-7bd2-b722-e5822d889eda/order-detail-qa/basic.png) | [对照](/Users/wenwen/.codex/visualizations/2026/09/29/01a0ec57-f308-7bd2-b722-e5822d889eda/order-detail-qa/compare-basic.png) |
| 收款与账单 | [来源](/Users/wenwen/.codex/generated_images/01a0ec57-f308-7bd2-b722-e5822d889eda/exec-885f5ffd-7aa3-4235-8e94-749f5578c6bc.png) | [实测](/Users/wenwen/.codex/visualizations/2026/09/29/01a0ec57-f308-7bd2-b722-e5822d889eda/order-detail-qa/bills.png) | [对照](/Users/wenwen/.codex/visualizations/2026/09/29/01a0ec57-f308-7bd2-b722-e5822d889eda/order-detail-qa/compare-bills.png) |
| 押金收取 | [来源](/Users/wenwen/.codex/generated_images/01a0ec57-f308-7bd2-b722-e5822d889eda/exec-1cbc30d3-c99e-490e-a0de-376b1684864b.png) | [实测](/Users/wenwen/.codex/visualizations/2026/09/29/01a0ec57-f308-7bd2-b722-e5822d889eda/order-detail-qa/deposit.png) | [对照](/Users/wenwen/.codex/visualizations/2026/09/29/01a0ec57-f308-7bd2-b722-e5822d889eda/order-detail-qa/compare-deposit.png) |
| 押金部分退款 | [来源](/Users/wenwen/.codex/generated_images/01a0ec57-f308-7bd2-b722-e5822d889eda/exec-3bc0ab3c-372d-42a9-b7a7-049750c29edf.png) | [实测](/Users/wenwen/.codex/visualizations/2026/09/29/01a0ec57-f308-7bd2-b722-e5822d889eda/order-detail-qa/deposit-refund.png) | [对照](/Users/wenwen/.codex/visualizations/2026/09/29/01a0ec57-f308-7bd2-b722-e5822d889eda/order-detail-qa/compare-deposit-refund.png) |
| 订单佣金 | [来源](/Users/wenwen/.codex/generated_images/01a0ec57-f308-7bd2-b722-e5822d889eda/exec-426cdcba-a70f-4b9d-9f00-5ae4f823c891.png) | [实测](/Users/wenwen/.codex/visualizations/2026/09/29/01a0ec57-f308-7bd2-b722-e5822d889eda/order-detail-qa/commissions.png) | [对照](/Users/wenwen/.codex/visualizations/2026/09/29/01a0ec57-f308-7bd2-b722-e5822d889eda/order-detail-qa/compare-commissions.png) |
| 文件与资料 | [来源](/Users/wenwen/.codex/generated_images/01a0ec57-f308-7bd2-b722-e5822d889eda/exec-127897c3-ef12-43c1-8982-370a0c50572d.png) | [实测](/Users/wenwen/.codex/visualizations/2026/09/29/01a0ec57-f308-7bd2-b722-e5822d889eda/order-detail-qa/files.png) | [对照](/Users/wenwen/.codex/visualizations/2026/09/29/01a0ec57-f308-7bd2-b722-e5822d889eda/order-detail-qa/compare-files.png) |
| 操作记录 | [来源](/Users/wenwen/.codex/generated_images/01a0ec57-f308-7bd2-b722-e5822d889eda/exec-1c8f29d8-48ef-453a-9591-aecf7ac8b3d6.png) | [实测](/Users/wenwen/.codex/visualizations/2026/09/29/01a0ec57-f308-7bd2-b722-e5822d889eda/order-detail-qa/history.png) | [对照](/Users/wenwen/.codex/visualizations/2026/09/29/01a0ec57-f308-7bd2-b722-e5822d889eda/order-detail-qa/compare-history.png) |

**视觉检查**：标题、状态、元信息与六个标签的层级与设计稿一致；卡片间距、表格密度、圆角和灰底保持简洁。正文使用现有系统字体与 14 px 左右的标签层级，未出现明显换行或截断。语义色区分待确认、待付款和部分退款，图标沿用应用现有图标库；此页面没有替换设计稿中的真实图片素材。测试库中的订单编号、金额、记录数、空文件状态与设计稿示例不同，属于数据差异。现有应用侧栏和页眉视觉与概念图不完全相同，保留既有系统壳层。

**重点区域检查**：并列对照中的押金步骤、押金收款与退款表格、佣金状态、操作记录内容均可辨认。浏览器逐页打开六个标签，未出现页面脚本错误；390 px 宽度端到端检查无横向溢出。押金结算和部分退款端到端用例通过。

**对照迭代**：首次比对发现押金收取阶段的两张卡片在桌面端上下堆叠，现改为并列；[修正后对照](/Users/wenwen/.codex/visualizations/2026/09/29/01a0ec57-f308-7bd2-b722-e5822d889eda/order-detail-qa/compare-deposit.png)确认首屏结构匹配。佣金记录的未付状态原显示“待收款”，现改为“待付款”；[修正后对照](/Users/wenwen/.codex/visualizations/2026/09/29/01a0ec57-f308-7bd2-b722-e5822d889eda/order-detail-qa/compare-commissions.png)及浏览器可访问文本均确认。押金待收取时的说明同步改为先登记并确认收款。

**剩余项**：无阻断性视觉差异。设计稿中示例文件和多条变更记录尚未在隔离测试库中构造，因此用空状态和单条记录检查了这两页的版式；文件行与多条时间线的布局已由现有组件实现。
# 销售公司详情紧凑布局核对（2026-10-09）

- 参考图：`/Users/wenwen/.codex/generated_images/01a0ec57-f308-7bd2-b722-e5822d889eda/exec-42104a0b-eda5-466a-882f-b13c6b50658f.png`。
- 实现：销售公司详情页上方改为左侧图片主图与竖排缩略图、右侧两列基本资料及收款账户；成员标题与新建按钮同排，关键词及角色的标题与控件横排。
- 静态核对：图片切换按钮和缩略图选择均有名称与键盘焦点样式；无图片和单张图片状态可渲染；窄屏布局按断点改为单列。TypeScript、33 个单元测试及生产构建通过。
- 运行时核对受阻：本地预览需登录，仓库现有测试账号在当前代理环境登录失败，因此无法捕获真实详情页截图，也无法逐项核对不同宽度下的实际渲染和图片切换。后续需用可访问的测试会话复核。

final result: blocked

## 第二版紧凑布局跟进（2026-10-09）

- 选定参考图：`/Users/wenwen/.codex/generated_images/01a0ec57-f308-7bd2-b722-e5822d889eda/exec-c9e65e9f-6a00-4823-b1b9-d1fedcc10ec3.png`。
- 代码调整：公司信息标题合并到卡片顶部；缩小主图、缩略图与列间距；资料行距收紧；收款账户改为右侧横排，银行账号在自身字段内完整换行，不再截断。
- 静态检查：`pnpm build` 通过；资料卡在 1250、950、650 px 断点下有对应的列数调整。
- 视觉对照仍受登录限制：当前本地预览没有可用的测试会话，无法捕获相同数据状态下的实现截图。需要可访问的测试会话复核精确间距与窄屏换行。

final result: blocked

## 销售公司详情标题与筛选行（2026-10-09）

- 移除公司资料和公司成员的可见标题；保留区域的无障碍名称。
- “新建成员账号”移入成员筛选行，与“重置”并排，权限控制与点击行为保持不变。
- `pnpm build`、Prettier 检查和 `git diff --check` 通过。运行时视觉检查仍受本地预览登录限制。

final result: blocked

## 销售公司详情左右宽度（2026-10-09）

- 桌面端图片区最大宽度由 430 px 缩至 350 px；中等宽度下由 360 px 缩至 300 px，剩余宽度分配给右侧资料及收款账户。
- 单列断点下图片区最大宽度同步缩至 350 px，图片与银行账号的换行规则保持不变。
- `pnpm build` 和 `git diff --check` 通过；本地预览登录限制仍阻碍实际截图核对。

final result: blocked

## 销售公司图片布局（2026-10-09）

- 缩略图从主图右侧改为主图下方的一行，可横向滚动；选择和预览交互保持不变。
- 主图比例从 16:9 调整为 2:1，缩略图设为 56 px，限制顶部资料区高度。
- “编辑销售公司”移至上方资料卡右上角，保留原有权限与点击行为。
- 生产构建和差异检查通过；本地预览登录限制仍阻碍实际截图核对。

final result: blocked

## 销售公司详情双标签布局（2026-10-09）

- 参考项目详情，将页面拆为“公司资料”和“成员列表”两个 tab，切换状态保存在 `tab=members` 查询参数中。公司资料与成员表格不再同时堆叠。
- 公司资料补齐表单中的中英文名称、联系信息、商业登记、服务区域及服务起止日期；图片主图加宽至 430 px，缩略图横排在下方。
- 编辑入口位于公司资料内容区顶部；成员创建入口位于成员筛选行。收款账户移至图片和基本资料两列下方，整行展示；标题独占上行，三项银行资料列于下方，长账号在自身字段内换行。
- `pnpm test` 的 33 项测试、`pnpm build` 与差异检查通过。当前本地预览登录限制仍阻碍实际截图核对。

final result: blocked

---

# 批量创建单位页面设计核对（2026-10-09）

- Source visual truth: `/Users/wenwen/.codex/generated_images/01a0ec57-f308-7bd2-b722-e5822d889eda/exec-bd55cb77-86c7-4dab-9bc9-fb645ff25bce.png`
- Implementation screenshot: `/Users/wenwen/.codex/visualizations/2026/09/29/01a0ec57-f308-7bd2-b722-e5822d889eda/batch-units/desktop.png`
- Narrow viewport screenshot: `/Users/wenwen/.codex/visualizations/2026/09/29/01a0ec57-f308-7bd2-b722-e5822d889eda/batch-units/mobile.png`
- Viewport: 1744 × 1024 CSS px; narrow viewport 390 × 844 CSS px; deviceScaleFactor 1.
- Density normalization: source 1536 × 1024 px; desktop implementation cropped to the 1536 × 1024 content region after the existing 208 px sidebar, without scaling.
- State: continuous generation, A-prefix, 4 preview rows, fourth row server conflict; source count text was illustrative (10 with only 4 rows). Implementation counts actual rows.

## Findings and comparison history

1. First desktop comparison: [P2] Generate and clear actions did not align right because Ant Design's margin rule overrode utility styles. Applied explicit margin utilities; final screenshot shows both actions aligned with the right content edge.
2. User-approved refinements: project name added to the shared 16 px header, project/type field labels placed horizontally, generation action changed to update/replace rather than append, replacement explanation added. Existing sidebar, typography, primary button color and public header retained.
3. Full-view comparison: three white sections follow the reference hierarchy, a compact type strip precedes input-mode tabs, horizontal table fields are visible, and fixed footer shows quantity/error counts and create/cancel actions.
4. Focused review: field label/control alignment, type strip, generator controls, table columns and error row inspected at full resolution. Duplicate room is red; readonly rent is inherited from the chosen type. No clipped desktop columns or page-width overflow on the narrow viewport. Narrow table scrolls inside its own region.

## Required fidelity surfaces

- Fonts/typography: existing system sans-serif, 14 px form/table content and 16 px shared header. Header size verified in browser regression; narrow titles truncate with full title available.
- Spacing/layout rhythm: 20 px card padding, 16 px section gaps, compact horizontal inputs and fixed actions. Type fields reflow at smaller widths.
- Colors/tokens: existing navy, pale gray, white cards and subtle borders; green local format checks, red conflicts and amber changed-generation notice.
- Image quality/assets: no new raster assets are required; public header retains the existing avatar and icon library. Information and return icons use Ant Design icons.
- Copy/content: generation replaces the preview, paste appends, monthly rent is readonly, and local format checks are distinguished from server duplicate checks at submission.

## Interaction verification

- 11 browser regressions passed: paste leading zeroes, duplicate detection, changing per-row type/rent inheritance, removal/100-row limit, generator prefix/count replacement, repeat update without accumulation, server conflicts without partial success, failed submission/reload with identical retry payload, write permissions, incomplete legacy types, project-aware header, tab panels and desktop/narrow layout.
- Browser page errors: none in the layout regression.
- 38 unit tests passed; TypeScript and production build passed.
- Real local preview was opened through the in-app browser with the server account; project types and preview generation verified. Preview operations did not create real units. Browser regression API responses are mocked.
- Development frontend remains connected to the server API via the existing default proxy.

## Implementation checklist

- [x] Reference layout with approved changes implemented.
- [x] Replacement behavior and duplicate-safe submission verified.
- [x] Desktop and narrow screenshots reviewed.
- [x] No actionable P0/P1/P2 findings remain.

final result: passed
