import { test, expect } from "@playwright/test";

test("finance starts with order bills, reviews in drawers, and cannot edit bills", async ({
  page,
}) => {
  const user = {
    id: "finance",
    name: "财务",
    role: "FINANCE",
    capabilities: {
      read: ["incomes", "orders", "materials", "fund-accounts"],
      write: ["incomes", "materials", "fund-accounts"],
      finance: true,
      manageOrders: false,
    },
  };
  const bill = {
    id: "bill",
    recordNo: "B-DEMO",
    recordType: "RECEIVABLE",
    feeType: "RENT",
    orderId: "order",
    orderNo: "R-DEMO",
    currency: "HKD",
    canRegister: true,
    offset: "0",
    projectName: "示例项目",
    unitNo: "101",
    receipts: [],
    offsets: [],
    operations: [],
    amount: "100",
    total: "100",
    confirmed: "0",
    pending: "60",
    remaining: "100",
    available: "40",
    payerName: "示例租客",
    status: "OPEN",
    dueOn: "2026-10-01",
  };
  const receipt = {
    id: "receipt",
    recordNo: "RC-DEMO",
    recordType: "RECEIPT",
    parentId: "bill",
    billNo: "B-DEMO",
    orderId: "order",
    orderNo: "R-DEMO",
    currency: "HKD",
    amount: "60",
    receivedOn: "2026-10-01",
    status: "PENDING",
    payerName: "示例租客",
    accountName: "示例收款账户",
    paymentMethod: "BANK",
    vouchers: [{ id: "proof", title: "转账凭证.pdf" }],
  };
  const requests: { method: string; path: string; query: string }[] = [];
  await page.route("**/api/v1/**", async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname.replace("/api/v1", "");
    const method = route.request().method();
    requests.push({ method, path, query: url.search });
    let data: any = { items: [], total: 0, page: 1, pageSize: 12 };
    if (path === "/auth/me") data = user;
    else if (path === "/incomes/bills")
      data = {
        items: [bill],
        total: 1,
        page: 1,
        pageSize: 12,
        pendingCount: 1,
        projects: [],
        units: [],
        summary: {
          rental: bill,
          deposit: {
            total: "0",
            confirmed: "0",
            pending: "0",
            offset: "0",
            remaining: "0",
          },
        },
      };
    else if (path === "/incomes")
      data = {
        ...data,
        items: [
          url.searchParams.get("recordType") === "RECEIPT" ? receipt : bill,
        ],
        total: 1,
      };
    else if (path === "/incomes/receipt") data = receipt;
    else if (path === "/incomes/bill") data = { ...bill, receipts: [receipt] };
    else if (path === "/incomes/bill/receipts")
      data = { ...data, items: [receipt], total: 1 };
    else if (path === "/fund-accounts")
      data = {
        ...data,
        items: [
          {
            id: "account",
            name: "示例收款账户",
            currency: "HKD",
            enabled: true,
            bankName: "示例银行",
            accountIdentifier: "demo",
          },
        ],
        total: 1,
      };
    if (method !== "GET") throw new Error(`Unexpected mutation ${path}`);
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(data),
    });
  });
  await page.goto("/incomes");
  await expect(
    page.getByRole("heading", { name: "账单管理", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "B-DEMO", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("tab", { name: "收款核对", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "待核对收款（1）" }).click();
  await expect(page.getByText("RC-DEMO", { exact: true })).toBeVisible();
  expect(
    requests.some(
      (r) =>
        r.path === "/incomes" &&
        r.query.includes("status=PENDING") &&
        r.query.includes("recordType=RECEIPT"),
    ),
  ).toBeTruthy();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: /^查\s*看$/ })
    .click();
  await expect(
    page
      .getByRole("dialog", { name: "收款详情" })
      .getByText("示例收款账户", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "转账凭证.pdf" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "收款详情" })).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByText("B-DEMO", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /^编\s*辑$/ })).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: /新建|删除|调整/ }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "B-DEMO", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "账单详情" })).toBeVisible();
  await expect(
    page.getByRole("dialog").getByText("RC-DEMO", { exact: true }),
  ).toBeVisible();
  expect(requests.some((r) => r.path.endsWith("/receipts"))).toBeFalsy();
  expect(requests.some((r) => r.path.endsWith("/operations"))).toBeFalsy();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "登记收款", exact: true }).click();
  const drawer = page.getByRole("dialog");
  await expect(drawer.getByText("平台账户", { exact: true })).toBeVisible();
  await expect(drawer.getByText(/^收款凭证（/)).toBeVisible();
  await page.screenshot({
    path: "/tmp/lease-income-registration.png",
    fullPage: true,
    animations: "disabled",
  });
});
