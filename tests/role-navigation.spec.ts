import { test, expect, type Page } from "@playwright/test";

const all = [
  "projects",
  "units",
  "orders",
  "users",
  "sales-companies",
  "incomes",
  "expenses",
  "commissions",
  "invoices",
  "materials",
  "settings",
  "fund-accounts",
];
const operations = [
  "projects",
  "units",
  "orders",
  "materials",
  "sales-companies",
  "users",
  "incomes",
  "settings",
  "fund-accounts",
];
const sales = [
  "projects",
  "units",
  "orders",
  "incomes",
  "commissions",
  "invoices",
  "materials",
  "users",
  "sales-companies",
];
const roles = [
  {
    role: "SUPER_ADMIN",
    read: all,
    write: all,
    menus: [
      "项目管理",
      "销售公司",
      "订单管理",
      "账号管理",
      "财务管理",
      "系统设置",
    ],
  },
  {
    role: "OPERATIONS",
    read: operations,
    write: operations.filter((r) => r !== "incomes"),
    menus: [
      "项目管理",
      "销售公司",
      "订单管理",
      "账号管理",
      "账单查询",
      "系统设置",
    ],
  },
  {
    role: "FINANCE",
    read: all,
    write: [
      "incomes",
      "expenses",
      "commissions",
      "invoices",
      "fund-accounts",
      "materials",
    ],
    menus: [
      "项目管理",
      "销售公司",
      "订单管理",
      "账号查询",
      "财务管理",
      "系统设置",
    ],
  },
  {
    role: "SALES_COMPANY_ADMIN",
    read: sales,
    write: ["sales-companies"],
    menus: ["可租项目", "本公司资料", "本公司订单", "佣金统计", "佣金明细"],
  },
  {
    role: "SALES",
    read: sales,
    write: [],
    menus: ["可租项目", "所属公司", "我的订单", "佣金统计", "佣金明细"],
  },
];
const receipt = {
  id: "receipt",
  parentId: "bill",
  orderId: "order",
  recordNo: "RC001",
  billNo: "B001",
  orderNo: "R001",
  status: "CONFIRMED",
  amount: "100",
  currency: "HKD",
  receivedOn: "2026-10-01",
  vouchers: [],
};
const bill = {
  id: "bill",
  recordNo: "B001",
  feeType: "RENT",
  status: "OPEN",
  total: "200",
  available: "100",
  remaining: "100",
  confirmed: "100",
  pending: "0",
  offset: "0",
  dueOn: "2026-10-01",
  receipts: [receipt],
};
const order = {
  id: "order",
  orderNo: "R001",
  unitNo: "A101",
  status: "ACTIVE",
  tenantName: "测试租客",
  currency: "HKD",
  startsOn: "2026-10-01",
  endsOn: "2027-09-30",
  monthlyRent: "200",
  depositAmount: "200",
  revision: 1,
  bills: [bill],
  materials: [],
  operations: [],
  commissions: [
    {
      id: "commission",
      commissionNo: "CM001",
      companyName: "测试销售公司",
      salesName: "测试销售员",
      mode: "ONE_TIME",
      status: "OPEN",
      amount: "500",
      paidAmount: "0",
      availableAmount: "500",
      remainingAmount: "500",
      periodStart: "2026-10-01",
      periodEnd: "2027-09-30",
      dueOn: "2026-10-01",
    },
  ],
};

async function mock(page: Page, role: string) {
  const config = roles.find((r) => r.role === role)!;
  const requests: string[] = [];
  await page.route("**/api/v1/**", async (route) => {
    const req = route.request();
    const path = new URL(req.url()).pathname.replace("/api/v1", "");
    requests.push(path);
    expect(req.method()).toBe("GET");
    let data: unknown = { items: [], total: 0 };
    if (path === "/auth/me")
      data = {
        id: "actor",
        name: "测试用户",
        role,
        salesCompanyId: "company",
        capabilities: {
          read: config.read,
          write: config.write,
          finance: ["SUPER_ADMIN", "FINANCE"].includes(role),
          manageOrders: ["SUPER_ADMIN", "OPERATIONS"].includes(role),
        },
      };
    if (path === "/site-config") data = {};
    if (path === "/orders/order") data = order;
    if (path === "/incomes/receipt") data = receipt;
    if (path === "/fund-accounts")
      data = {
        items: [
          {
            id: "account",
            name: "测试账户",
            bankName: "测试银行",
            accountIdentifier: "1234",
            enabled: true,
          },
        ],
        total: 1,
      };
    await route.fulfill({ json: data });
  });
  return requests;
}

for (const config of roles) {
  test(`${config.role} shows the agreed navigation and matching breadcrumb`, async ({
    page,
  }) => {
    await mock(page, config.role);
    await page.goto("/projects");
    const sidebar = page.locator(".ant-layout-sider");
    await expect(sidebar.locator(".ant-menu-root > li")).toHaveText(
      config.menus,
    );
    await expect(page.locator(".ant-breadcrumb")).toContainText(
      config.menus[0],
    );
    if (config.role.startsWith("SALES")) {
      await sidebar
        .getByRole("menuitem", { name: config.menus[2], exact: true })
        .click();
      await expect(page).toHaveURL(/\/orders$/);
      await expect(page.locator(".ant-breadcrumb")).toContainText(
        config.menus[2],
      );
    } else {
      await sidebar.getByText("系统设置", { exact: true }).click();
      await expect(
        sidebar.getByRole("menuitem", { name: "银行账户", exact: true }),
      ).toBeVisible();
      await expect(
        sidebar.getByRole("menuitem", { name: "网站设置", exact: true }),
      ).toHaveCount(config.role === "FINANCE" ? 0 : 1);
      if (config.role !== "OPERATIONS") {
        await sidebar.getByText("财务管理", { exact: true }).click();
        await sidebar
          .getByRole("menuitem", { name: "发票管理", exact: true })
          .click();
        await expect(page).toHaveURL(/\/invoices$/);
        await expect(page.locator(".ant-breadcrumb")).toHaveText(
          "财务管理/发票管理",
        );
      }
    }
  });
}

test("operations sees order commissions without finance links and gets the direct-entry receipt hint", async ({
  page,
}) => {
  await mock(page, "OPERATIONS");
  await page.goto("/orders/order");
  await page.getByRole("tab", { name: "订单佣金", exact: true }).click();
  await expect(page.getByText("测试销售公司 · 测试销售员")).toBeVisible();
  await expect(page.getByText("暂无此栏目的访问权限")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "查看记录", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "登记付款", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("tab", { name: "押金情况", exact: true }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "收款与账单", exact: true }).click();
  await page.getByRole("button", { name: "登记收款", exact: true }).click();
  await expect(
    page.getByText(
      "核对实际到账后再登记，提交后收款直接入账。每张账单须一次付清剩余金额。",
    ),
  ).toBeVisible();
});

test("sales receipt details keep embedded viewing without inaccessible bill or invoice links", async ({
  page,
}) => {
  await mock(page, "SALES");
  await page.goto("/orders/order");
  await page.getByRole("tab", { name: "收款与账单", exact: true }).click();
  await page.getByRole("button", { name: "查看记录", exact: true }).click();
  await page.getByRole("button", { name: /^查\s*看$/ }).click();
  const drawer = page.locator(".receipt-detail-drawer");
  await expect(drawer).toContainText("RC001");
  await expect(drawer.getByRole("link", { name: "查看账单" })).toHaveCount(0);
  await expect(drawer.getByRole("link", { name: "查看收据" })).toHaveCount(0);
  await expect(drawer.getByRole("link", { name: "查看订单" })).toBeVisible();
});

test("denied finance deep links never fetch data or render editing forms", async ({
  page,
}) => {
  const requests = await mock(page, "FINANCE");
  for (const path of [
    "/settings",
    "/projects/new",
    "/projects/project/edit",
    "/projects/project/units/batch",
  ]) {
    await page.goto(path);
    await expect(
      page.getByText("暂无此页面的访问权限", { exact: true }),
    ).toBeVisible();
    await expect(page.locator("form")).toHaveCount(0);
  }
  expect(requests).not.toContain("/settings/website");
  expect(requests).not.toContain("/projects/project");
});

test("scoped menu labels translate and remain usable in the mobile drawer", async ({
  page,
}) => {
  await mock(page, "SALES_COMPANY_ADMIN");
  await page.goto("/projects");
  await page.getByRole("button", { name: "简体中文", exact: true }).hover();
  await page.getByRole("menuitem", { name: "繁體中文", exact: true }).click();
  await expect(
    page
      .locator(".ant-layout-sider")
      .getByRole("menuitem", { name: "本公司訂單", exact: true }),
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "折叠菜单", exact: true }).click();
  const drawer = page.locator(".ant-drawer");
  await expect(
    drawer.getByRole("menuitem", { name: "佣金統計", exact: true }),
  ).toBeVisible();
  await drawer
    .getByRole("menuitem", { name: "本公司訂單", exact: true })
    .click();
  await expect(page).toHaveURL(/\/orders$/);
  await expect(page.locator(".ant-breadcrumb")).toContainText("本公司訂單");
});
