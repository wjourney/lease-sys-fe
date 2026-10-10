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
  for (const id of ids) {
    await expect(drawer.locator(`#commission_${id}`)).toHaveAttribute(
      "readonly",
      "",
    );
    await expect(drawer.locator(`#commission_${id}`)).toHaveValue("100");
  }
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

test("single commission payment records the selected balance and refreshes the list", async ({
  page,
}) => {
  const requests = await mock(page);
  await page.goto("/commissions");
  const row = page.locator(".ant-table-row").filter({ hasText: "C001" });
  await row.getByRole("button", { name: "登记付款", exact: true }).click();
  const drawer = page.locator(".ant-drawer-content");
  await expect(drawer.getByText("登记佣金付款", { exact: true })).toBeVisible();
  await expect(drawer.locator("#amount")).toHaveAttribute("readonly", "");
  await expect(drawer.locator("#amount")).toHaveValue("100");
  await expect(drawer.locator("#fundAccountId")).toBeDisabled();
  const before = requests.filter((r) => r.path === "/commissions").length;
  await drawer.getByRole("button", { name: "确认提交" }).click();
  await expect(drawer).toHaveCount(0);
  const payment = requests.find((r) => r.path.endsWith("/payments"));
  expect(payment?.path).toBe(`/commissions/${ids[0]}/payments`);
  expect(payment?.body).toMatchObject({
    amount: "100",
    fundAccountId: accountId,
    paymentMethod: "BANK",
  });
  expect(payment?.body.sourceKey).toBeTruthy();
  await expect
    .poll(() => requests.filter((r) => r.path === "/commissions").length)
    .toBeGreaterThan(before);
});

test("commission payment method stays in the payment drawer", async ({
  page,
}) => {
  await mock(page);
  await page.goto("/commissions");
  const row = page.locator(".ant-table-row").filter({ hasText: "C001" });
  await row.getByRole("button", { name: "登记付款", exact: true }).click();
  const drawer = page.locator(".ant-drawer-content");
  await drawer.getByText("银行转账", { exact: true }).click();
  await page.locator(".ant-select-dropdown:visible").getByTitle("现金").click();
  await expect(page).toHaveURL(/\/commissions$/);
  await expect(drawer.getByText("登记佣金付款", { exact: true })).toBeVisible();
  await expect(
    drawer.locator(".ant-select-selection-item[title='现金']"),
  ).toBeVisible();
});

test("bill receipt payment method stays in the receipt drawer", async ({
  page,
}) => {
  await mock(page);
  await page.goto("/incomes");
  const row = page.locator(".ant-table-row").filter({ hasText: "B001" });
  await row.getByRole("button", { name: "登记收款", exact: true }).click();
  const drawer = page.locator(".ant-drawer-content");
  await drawer.getByText("银行转账", { exact: true }).click();
  await page.locator(".ant-select-dropdown:visible").getByTitle("现金").click();
  await expect(page).toHaveURL(/\/incomes$/);
  await expect(drawer.getByText("登记收款", { exact: true })).toBeVisible();
  await expect(
    drawer.locator(".ant-select-selection-item[title='现金']"),
  ).toBeVisible();
});

test("reserved pending bill shows disabled receipt action with reason and a compact detail drawer", async ({
  page,
}) => {
  await mock(page);
  const bill = {
    id: billId,
    orderId,
    recordNo: "B002",
    feeType: "RENT",
    status: "OPEN",
    total: "100",
    confirmed: "0",
    pending: "100",
    remaining: "100",
    available: "0",
    canRegister: false,
    registrationBlockedReason:
      "已有收款记录待处理，请在账单详情的收款记录中核对，避免重复登记",
    receipts: [],
    offsets: [],
    operations: [],
  };
  await page.route("**/api/v1/incomes/bills**", (route) =>
    route.fulfill({ json: { items: [bill], total: 1 } }),
  );
  await page.route(`**/api/v1/incomes/${billId}`, (route) =>
    route.fulfill({ json: bill }),
  );
  await page.goto("/incomes");
  const row = page.locator(".ant-table-row");
  await expect(
    row.getByRole("button", { name: "登记收款", exact: true }),
  ).toBeDisabled();
  await row
    .getByRole("button", { name: "登记收款", exact: true })
    .locator("..")
    .hover();
  await expect(page.getByRole("tooltip")).toContainText("已有收款记录待处理");
  await row.getByRole("button", { name: /查\s*看/ }).click();
  const drawer = page.locator(".ant-drawer-content");
  await expect(drawer.getByText("账单详情", { exact: true })).toBeVisible();
  await expect(drawer.getByRole("tab")).toHaveText([
    "收款记录（0）",
    "操作记录",
  ]);
  await expect(drawer.getByText("押金抵扣", { exact: true })).toHaveCount(0);
  await expect(
    drawer.getByRole("button", { name: "登记收款", exact: true }),
  ).toBeDisabled();
});

test("finance filters retain date and receipt filtering without heading descriptions", async ({
  page,
}) => {
  const requests = await mock(page);
  await page.route("**/api/v1/finance/**", (route) => {
    const url = new URL(route.request().url());
    requests.push({
      path: url.pathname.replace("/api/v1", ""),
      query: url.searchParams,
      body: undefined,
    });
    return route.fulfill({
      json: {
        items: [],
        total: 0,
        summary: {
          incoming: "0",
          outgoing: "0",
          corrections: "0",
          net: "0",
          income: "0",
          depositReceived: "0",
          depositRefunded: "0",
          commissionPaid: "0",
          orderCount: 0,
          commissionCount: 0,
          commissionDue: "0",
          unsetCommissionCount: 0,
        },
        accounts: [],
        projects: [],
        trend: [],
        expenses: [],
      },
    });
  });
  await page.goto("/fund-ledger");
  await expect(page.locator(".finance-heading")).toHaveCount(0);
  await expect(page.locator(".finance-filter-panel")).toBeVisible();
  await page.getByRole("textbox", { name: "流水关键词" }).fill("R001");
  await expect
    .poll(() =>
      requests
        .filter((r) => r.path === "/finance/ledger")
        .at(-1)
        ?.query.get("q"),
    )
    .toBe("R001");
  await page.getByRole("button", { name: /重\s*置/ }).click();
  await expect(page.getByRole("textbox", { name: "流水关键词" })).toHaveValue(
    "",
  );
  await page.screenshot({
    path: "/tmp/lease-finance-ledger.png",
    fullPage: true,
  });
  await page.goto("/finance-statistics");
  await expect(page.locator(".finance-heading")).toHaveCount(0);
  await expect(page.locator(".finance-filter-panel")).toBeVisible();
  await expect(page.locator(".finance-kpis")).toBeVisible();
  await page.screenshot({
    path: "/tmp/lease-finance-statistics.png",
    fullPage: true,
  });
});

for (const [invoiceCount, contentType, extension] of [
  [1, "application/pdf", "pdf"],
  [2, "application/zip", "zip"],
] as const) {
  test(`bill row downloads ${extension} and its drawer shares the action`, async ({
    page,
  }) => {
    await mock(page);
    const bill = {
      id: billId,
      orderId,
      recordNo: "B001",
      invoiceCount,
      feeType: "RENT",
      status: "PAID",
      total: "100",
      confirmed: "100",
      remaining: "0",
      available: "0",
      receipts: [],
      operations: [],
    };
    await page.route("**/api/v1/incomes/bills**", (route) =>
      route.fulfill({ json: { items: [bill], total: 1 } }),
    );
    await page.route(`**/api/v1/incomes/${billId}`, (route) =>
      route.fulfill({ json: bill }),
    );
    await page.route(`**/api/v1/invoices/bills/${billId}/download`, (route) =>
      route.fulfill({ contentType, body: Buffer.from("mock file") }),
    );
    await page.goto("/incomes");
    await expect(page.getByRole("button", { name: "导出所选" })).toHaveCount(0);
    const row = page.locator(".ant-table-row");
    await expect(
      row.getByRole("button", { name: "登记收款", exact: true }),
    ).toHaveCount(0);
    const download = page.waitForEvent("download");
    await row.getByRole("button", { name: "下载发票", exact: true }).click();
    expect((await download).suggestedFilename()).toBe(`B001_发票.${extension}`);
    await row.getByRole("button", { name: /查\s*看/ }).click();
    await expect(
      page
        .locator(".ant-drawer-content")
        .getByRole("button", { name: "下载发票", exact: true }),
    ).toBeEnabled();
  });
}

test("no-invoice bills disable downloads; commission list keeps only batch payment", async ({
  page,
}) => {
  await mock(page);
  await page.goto("/incomes");
  const button = page
    .locator(".ant-table-row")
    .getByRole("button", { name: "下载发票", exact: true });
  await expect(button).toBeDisabled();
  await button.locator("..").hover();
  await expect(page.getByRole("tooltip")).toHaveText("暂无发票，请先登记收款");
  await page.goto("/commissions");
  await expect(page.getByRole("button", { name: "导出所选" })).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "批量登记付款（0）" }),
  ).toBeVisible();
});

test("invoice download failure shows a toast and allows retry", async ({
  page,
}) => {
  await mock(page);
  await page.route("**/api/v1/incomes/bills**", (route) =>
    route.fulfill({
      json: {
        items: [
          { id: billId, recordNo: "B001", invoiceCount: 1, status: "PAID" },
        ],
        total: 1,
      },
    }),
  );
  await page.route(`**/api/v1/invoices/bills/${billId}/download`, (route) =>
    route.fulfill({ status: 503, json: { message: "internal error" } }),
  );
  await page.goto("/incomes");
  const button = page
    .locator(".ant-table-row")
    .getByRole("button", { name: "下载发票", exact: true });
  await button.click();
  await expect(page.locator(".ant-message")).toContainText(
    "服务暂时不可用，请稍后再试",
  );
  await expect(button).toHaveAttribute("aria-busy", "false");
  await expect(button).toBeEnabled();
});

test("selected bill rows use light highlights and keep selection readable on hover", async ({
  page,
}) => {
  await mock(page);
  await page.goto("/incomes");
  const row = page.getByRole("row").filter({ hasText: "B001" });
  await row.getByRole("checkbox").check();
  await expect(row).toHaveClass(/ant-table-row-selected/);
  const cell = row.locator("td").nth(1);
  await expect(cell).toHaveCSS("background-color", "rgb(228, 238, 249)");
  await page.getByRole("button", { name: /重.*置/ }).hover();
  await expect(cell).toHaveCSS("background-color", "rgb(238, 244, 251)");
  await row.hover();
  await expect(cell).toHaveCSS("background-color", "rgb(228, 238, 249)");
  await page.screenshot({ path: "/tmp/lease-bills-selected-light.png" });
});
