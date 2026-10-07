import { test, expect, type Page } from "@playwright/test";
const orderId = "10000000-0000-4000-8000-000000000001";
const billId = "20000000-0000-4000-8000-000000000001";
const accountId = "30000000-0000-4000-8000-000000000001";
const ids = [
  "40000000-0000-4000-8000-000000000001",
  "40000000-0000-4000-8000-000000000002",
];
async function mock(page: Page) {
  const requests: { path: string; query: URLSearchParams; body: any }[] = [];
  let secondAttempts = 0;
  await page.route("**/api/v1/**", async (route) => {
    const request = route.request(),
      url = new URL(request.url()),
      path = url.pathname.replace("/api/v1", "");
    const body =
      request.method() === "GET" ? undefined : request.postDataJSON();
    requests.push({ path, query: url.searchParams, body });
    let data: any = { items: [], total: 0 };
    if (path === "/auth/me")
      data = {
        id: "admin",
        name: "管理员",
        role: "SUPER_ADMIN",
        capabilities: {
          read: [
            "orders",
            "projects",
            "commissions",
            "incomes",
            "invoices",
            "fund-accounts",
          ],
          write: ["commissions", "incomes", "orders", "projects"],
          finance: true,
          manageOrders: true,
        },
      };
    if (path === "/site-config") data = {};
    if (path === "/orders")
      data = {
        items: [{ id: orderId, orderNo: "R001", tenantName: "海湾公司" }],
        total: 1,
      };
    if (path === `/orders/${orderId}`)
      data = { id: orderId, orderNo: "R001", tenantName: "海湾公司" };
    if (path === "/incomes/bills")
      data = {
        items: [
          {
            id: billId,
            recordNo: "B001",
            orderId,
            orderNo: "R001",
            feeType: "RENT",
            status: "OPEN",
            overdue: true,
            total: "100",
            remaining: "100",
            available: "100",
            canRegister: true,
          },
        ],
        total: 1,
      };
    if (path === "/commissions")
      data = {
        items: ids.map((id, i) => ({
          id,
          commissionNo: `C00${i + 1}`,
          orderId,
          orderNo: "R001",
          status: "OPEN",
          amount: "100",
          availableAmount: "100",
          remainingAmount: "100",
        })),
        total: 2,
      };
    if (path === "/fund-accounts")
      data = {
        items: [
          {
            id: accountId,
            name: "银行账户",
            enabled: true,
            bankName: "银行",
            accountIdentifier: "1234",
            currency: "HKD",
          },
        ],
        total: 1,
      };
    if (path.endsWith("/payments")) {
      if (path.includes(ids[1]) && secondAttempts++ === 0) {
        await route.fulfill({ status: 503, json: { message: "Unavailable" } });
        return;
      }
      data = { id: "expense" };
    }
    if (path === "/invoices/batch-download") {
      await route.fulfill({
        contentType: "application/zip",
        headers: {
          "Content-Disposition": 'attachment; filename="invoices.zip"',
          "X-Invoice-Count": "1",
          "X-Invoice-Issues": "0",
        },
        body: Buffer.from("mock zip"),
      });
      return;
    }
    await route.fulfill({ json: data });
  });
  return requests;
}
test("bill filters are compact, order-scoped, resettable and support invoice ZIP downloads", async ({
  page,
}) => {
  const requests = await mock(page);
  await page.goto("/incomes");
  const main = page.locator(".bills-page");
  await expect(main.getByRole("heading")).toHaveCount(0);
  await expect(main.locator(".bill-summary")).toHaveCount(0);
  await expect(
    main.locator(".ant-table-row").getByText("待付款", { exact: true }),
  ).toBeVisible();
  await expect(
    main.locator(".ant-table-row").getByText("逾期", { exact: true }),
  ).toHaveCount(0);
  await expect(
    main.getByRole("combobox", { name: "项目", exact: true }),
  ).toHaveCount(0);
  await main.getByRole("combobox", { name: "订单筛选" }).click();
  await page.getByTitle("R001 · 海湾公司", { exact: true }).click();
  await expect
    .poll(() =>
      requests
        .filter((r) => r.path === "/incomes/bills")
        .at(-1)
        ?.query.get("orderId"),
    )
    .toBe(orderId);
  await main.locator(".ant-table-row .ant-checkbox-input").check();
  const download = page.waitForEvent("download");
  await main.getByRole("button", { name: "批量下载发票" }).click();
  expect((await download).suggestedFilename()).toBe("账单发票.zip");
  expect(
    requests.find((r) => r.path === "/invoices/batch-download")?.body,
  ).toEqual({ billIds: [billId] });
  await main.getByRole("button", { name: /重\s*置/ }).click();
  await expect
    .poll(() =>
      requests
        .filter((r) => r.path === "/incomes/bills")
        .at(-1)
        ?.query.get("orderId"),
    )
    .toBe(null);
  await expect(
    main.getByRole("button", { name: "批量下载发票" }),
  ).toBeDisabled();
});
test("projects ignore obsolete status filter URLs", async ({ page }) => {
  const requests = await mock(page);
  await page.goto("/projects?status=DISABLED");
  await expect(page.getByPlaceholder("全部状态")).toHaveCount(0);
  await expect
    .poll(() => requests.filter((r) => r.path === "/projects").length)
    .toBeGreaterThan(0);
  expect(
    requests
      .filter((r) => r.path === "/projects")
      .every((r) => !r.query.get("status")),
  ).toBe(true);
});
test("commission filter clears selection; batch payment retries only failed items with the same key", async ({
  page,
}) => {
  const requests = await mock(page);
  await page.goto("/commissions");
  await expect(
    page.getByRole("link", { name: "C001", exact: true }),
  ).toBeVisible();
  await page.locator(".ant-table-thead .ant-checkbox-input").check();
  await page.getByRole("combobox", { name: "订单筛选" }).click();
  await page.getByTitle("R001 · 海湾公司", { exact: true }).click();
  await expect
    .poll(() =>
      requests
        .filter((r) => r.path === "/commissions")
        .at(-1)
        ?.query.get("orderId"),
    )
    .toBe(orderId);
  await expect(
    page.getByRole("button", { name: "批量登记付款（0）" }),
  ).toBeDisabled();
  await page.locator(".ant-table-thead .ant-checkbox-input").check();
  await page.getByRole("button", { name: "批量登记付款（2）" }).click();
  const drawer = page.locator(".ant-drawer-content");
  await expect(drawer.locator("#fundAccountId")).toBeDisabled();
  await drawer.getByRole("button", { name: "确认提交" }).click();
  await expect(
    drawer.getByText("服务暂时不可用，请稍后再试", { exact: true }),
  ).toBeVisible();
  await drawer.getByRole("button", { name: "确认提交" }).click();
  await expect(drawer).toHaveCount(0);
  const payments = requests.filter((r) => r.path.endsWith("/payments"));
  expect(payments).toHaveLength(3);
  expect(payments.map((r) => r.path)).toEqual([
    `/commissions/${ids[0]}/payments`,
    `/commissions/${ids[1]}/payments`,
    `/commissions/${ids[1]}/payments`,
  ]);
  expect(payments[1].body.sourceKey).toBe(payments[2].body.sourceKey);
  expect(payments[0].body.amount).toBe("100");
});

test("commission order selection survives reloading its URL", async ({
  page,
}) => {
  await mock(page);
  await page.goto(`/commissions?orderId=${orderId}`);
  await expect(
    page
      .locator(".ant-select-selection-item")
      .filter({ hasText: "R001 · 海湾公司" }),
  ).toBeVisible();
});

test("commission page ignores obsolete mode filters and combines partial payments under pending", async ({
  page,
}) => {
  const requests = await mock(page);
  await page.goto("/commissions?mode=ONE_TIME&status=PARTIAL");
  await expect(page.locator(".ant-segmented")).toHaveCount(0);
  await expect
    .poll(() => requests.filter((r) => r.path === "/commissions").length)
    .toBeGreaterThan(0);
  const query = requests.filter((r) => r.path === "/commissions").at(-1)!.query;
  expect(query.get("mode")).toBe(null);
  expect(query.get("status")).toBe("OPEN");
  await page
    .locator(".ant-select")
    .filter({ has: page.getByRole("combobox", { name: "佣金状态" }) })
    .click();
  const options = page.locator(
    ".ant-select-dropdown:visible .ant-select-item-option-content",
  );
  await expect(options).toHaveText(["待付款", "已付款"]);
});
