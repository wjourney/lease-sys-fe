import { test, expect, type Page } from "@playwright/test";
const id = "10000000-0000-4000-8000-000000000001";
const projectId = "20000000-0000-4000-8000-000000000001";
const unitId = "30000000-0000-4000-8000-000000000001";
const accountId = "40000000-0000-4000-8000-000000000001";
const draft = {
  id,
  orderNo: "R001",
  status: "DRAFT",
  projectId: null,
  unitId: null,
  salesUserId: null,
  salesCompanyId: null,
  tenantType: "COMPANY",
  tenantName: "海湾公司",
  startsOn: "2026-10-07",
  endsOn: "2027-10-06",
  depositPlan: "ONE_ONE",
  billingVersion: 2,
  monthlyRent: null,
  depositAmount: null,
  commissionDraft: {},
  revision: 1,
  actions: { edit: true, editLease: true },
};
const bill = {
  id,
  recordNo: "B001",
  orderId: id,
  orderNo: "R001",
  payerName: "海湾公司",
  feeType: "RENT",
  status: "OPEN",
  total: "100",
  remaining: "100",
  available: "100",
  confirmed: "0",
  offset: "0",
  pending: "0",
  currency: "HKD",
  dueOn: "2026-10-07",
  canRegister: true,
};
async function mock(page: Page, role = "SUPER_ADMIN") {
  const writes: { path: string; body: any }[] = [];
  await page.route("**/api/v1/**", async (route) => {
    const req = route.request(),
      path = new URL(req.url()).pathname.replace("/api/v1", "");
    let data: any = { items: [], total: 0 };
    if (path === "/auth/me")
      data = {
        id: "admin",
        name: "管理员",
        role,
        capabilities: {
          read: [
            "projects",
            "units",
            "orders",
            "incomes",
            "users",
            "sales-companies",
            "fund-accounts",
          ],
          write: role === "SUPER_ADMIN" ? ["orders", "incomes"] : [],
          manageOrders: role === "SUPER_ADMIN",
          finance: role === "SUPER_ADMIN",
        },
      };
    if (path === "/site-config") data = {};
    if (path === "/orders") data = { items: [draft], total: 1 };
    if (path === `/orders/${id}`) data = draft;
    if (path === `/orders/${id}/deletion-preview`)
      data = {
        allowed: true,
        bills: 0,
        receipts: 0,
        commissions: 0,
        expenses: 0,
      };
    if (path === "/projects")
      data = {
        items: [{ id: projectId, name: "海湾项目", status: "ACTIVE" }],
        total: 1,
      };
    if (path === "/units")
      data = {
        items: [
          {
            id: unitId,
            projectId,
            unitNo: "A101",
            enabled: true,
            status: "AVAILABLE",
            referenceRent: "15000",
          },
        ],
        total: 1,
      };
    if (path === "/fund-accounts")
      data = {
        items: [
          {
            id: accountId,
            name: "银行账户",
            currency: "HKD",
            bankName: "银行",
            accountIdentifier: "1234",
            enabled: true,
          },
        ],
        total: 1,
      };
    if (path === "/incomes/bills")
      data = {
        items: [bill],
        total: 1,
        projects: [],
        units: [],
        summary: {
          rental: {
            total: "100",
            confirmed: "0",
            offset: "0",
            remaining: "100",
          },
          deposit: { total: "0", confirmed: "0", offset: "0", remaining: "0" },
        },
        pendingCount: 0,
      };
    if (req.method() !== "GET") {
      const body = req.postDataJSON();
      writes.push({ path, body });
      data = { ...draft, ...body };
      if (path === "/incomes/batch-receipts")
        data = { results: [{ id, ok: true, receiptId: "receipt" }] };
    }
    await route.fulfill({ json: data });
  });
  return writes;
}

test("new order accepts company name alone and shows no other required fields", async ({
  page,
}) => {
  const writes = await mock(page);
  await page.goto("/orders");
  await page.getByRole("button", { name: "新建订单" }).click();
  const drawer = page.locator(".ant-drawer-content");
  await drawer.locator("#tenantName").fill("仅名称公司");
  await expect(drawer.locator("#commissionMode")).toHaveCount(0);
  await expect(
    drawer.getByText("每月佣金（HKD）", { exact: true }),
  ).toBeVisible();
  await expect(drawer.locator("label.ant-form-item-required")).toHaveCount(1);
  await expect(drawer.getByText("更多账单设置", { exact: true })).toHaveCount(
    0,
  );
  await expect(
    drawer.locator(
      "#firstPeriodProration, #lastPeriodProration, #moveInOn, #remark",
    ),
  ).toHaveCount(0);
  await drawer.getByRole("button", { name: "提交订单" }).click();
  await expect.poll(() => writes.length).toBe(1);
  expect(writes[0].body.tenantName).toBe("仅名称公司");
  expect(writes[0].body.unitId).toBeUndefined();
  expect(writes[0].body.monthlyRent).toBeUndefined();
  expect(writes[0].body.commission.amount).toBeUndefined();
  expect(writes[0].body.commission.mode).toBe("RECURRING_MONTHLY");
  expect(writes[0].body.initialPayment.paid).toBe(false);
});

test("draft edit shares optional fields, unit prefill and direct first-payment defaults", async ({
  page,
}) => {
  const writes = await mock(page);
  await page.goto("/orders");
  await page.getByRole("button", { name: /编\s*辑/, exact: true }).click();
  const drawer = page.locator(".ant-drawer-content");
  await expect(drawer.locator("#tenantName")).toHaveValue("海湾公司");
  await expect(drawer.locator("label.ant-form-item-required")).toHaveCount(1);
  await expect(drawer.getByText("更多账单设置", { exact: true })).toHaveCount(
    0,
  );
  await expect(
    drawer.locator(
      "#firstPeriodProration, #lastPeriodProration, #moveInOn, #remark",
    ),
  ).toHaveCount(0);
  await drawer.locator("#projectId").click();
  await page.getByTitle("海湾项目", { exact: true }).click();
  await drawer.locator("#unitId").click();
  await page.getByTitle("A101", { exact: true }).click();
  await expect(drawer.locator("#monthlyRent")).toHaveValue("15000.00");
  await drawer
    .locator(".ant-select")
    .filter({ has: page.locator("#paymentDeclaration") })
    .click();
  await page.getByTitle("已付首期租金及押金", { exact: true }).click();
  await expect(drawer.locator("#initialRentReceived")).toHaveValue("15000.00");
  await drawer.getByRole("button", { name: "保存修改" }).click();
  await expect.poll(() => writes.length).toBe(1);
  expect(writes[0].body.unitId).toBe(unitId);
  expect(writes[0].body.initialPayment.paid).toBe(true);
  expect(writes[0].body.initialPayment.fundAccountId).toBe(accountId);
  expect(writes[0].body.salesUserId).toBeUndefined();
  for (const field of [
    "firstPeriodProration",
    "lastPeriodProration",
    "billLeadDays",
    "moveInOn",
    "remark",
  ])
    expect(writes[0].body).not.toHaveProperty(field);
});

test("orders do not expose batch operations even for administrators", async ({
  page,
}) => {
  await mock(page);
  await page.goto("/orders");
  await expect(page.getByRole("button", { name: "新建订单" })).toBeVisible();
  await expect(page.locator(".ant-table-selection-column")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "批量删除" })).toHaveCount(0);
});

test("batch bill receipt sends per-row amounts with a stable submission key", async ({
  page,
}) => {
  const writes = await mock(page);
  await page.goto("/incomes");
  await expect(page.getByText("待付款", { exact: true })).toBeVisible();
  await page.locator(".ant-table-row .ant-checkbox-input").check();
  await page.getByRole("button", { name: "批量登记收款（1）" }).click();
  const drawer = page.locator(".ant-drawer-content");
  await drawer.getByRole("button", { name: "确认提交" }).click();
  await expect.poll(() => writes.length).toBe(1);
  const entry = writes[0].body.entries[0];
  expect(entry.billId).toBe(id);
  expect(entry.amount).toBe("100");
  expect(entry.fundAccountId).toBe(accountId);
  expect(entry.sourceKey).toMatch(/^[0-9a-f-]{36}$/);
  await expect(page.getByText("已入账", { exact: true })).toBeVisible();
});

test("sales cannot create, edit or batch-delete orders", async ({ page }) => {
  await mock(page, "SALES");
  await page.goto("/orders");
  await expect(page.getByRole("button", { name: "新建订单" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "批量删除" })).toHaveCount(0);
  await expect(page.locator(".ant-table-selection-column")).toHaveCount(0);
});
