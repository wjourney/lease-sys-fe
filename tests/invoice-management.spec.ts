import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";

const previewPdf = readFileSync(
  new URL("./fixtures/invoice-preview.pdf", import.meta.url),
);

const bill = {
  id: "bill",
  recordNo: "B001",
  orderNo: "R001",
  orderId: "order",
  projectName: "海湾项目",
  unitNo: "A101",
  payerName: "测试租客",
  status: "OPEN",
  feeType: "RENT",
  currency: "HKD",
  total: "5500",
  confirmed: "0",
  remaining: "5500",
  available: "5500",
  pending: "0",
  dueOn: "2026-11-01",
  invoiceCount: 1,
};
const invoice = {
  id: "invoice",
  invoiceNo: "INV001",
  billId: "bill",
  billNo: "B001",
  projectName: "海湾项目",
  unitNo: "A101",
  payerName: "测试租客",
  payerPhone: "12345678",
  issuedOn: "2026-10-14",
  dueOn: "2026-11-01",
  amount: "5500",
  currency: "HKD",
  feeType: "RENT",
  status: "DRAFT",
  emailStatus: "IDLE",
  revision: 1,
  snapshot: { payerEmail: "tenant@example.com", remark: "草稿备注" },
};
async function mock(
  page: Page,
  role = "FINANCE",
  empty = false,
  options: { bill?: Partial<typeof bill>; invoices?: (typeof invoice)[] } = {},
) {
  let rows: any[] =
    options.invoices ||
    (empty
      ? []
      : [
          { ...invoice },
          { ...invoice, id: "issued", invoiceNo: "INV002", status: "ACTIVE" },
        ]);
  const billRow = { ...bill, ...options.bill };
  const writes: { path: string; body: any }[] = [];
  const reads: string[] = [];
  await page.route("**/api/v1/**", async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const path = url.pathname.replace("/api/v1", "");
    let data: any = { items: [], total: 0 };
    if (req.method() === "GET") reads.push(path + url.search);
    else writes.push({ path, body: req.postDataJSON() });
    if (path === "/auth/me")
      data = {
        id: "actor",
        name: "财务",
        role,
        capabilities: {
          read: [
            "projects",
            "units",
            "orders",
            "incomes",
            "invoices",
            "materials",
          ],
          write:
            role === "FINANCE"
              ? ["incomes", "invoices", "materials"]
              : ["projects", "units"],
          finance: role === "FINANCE",
        },
      };
    if (path === "/site-config") data = {};
    if (["/invoices/invoice", "/invoices/issued"].includes(path))
      data = {
        ...rows.find((row) => row.id === path.split("/")[2]),
        orderId: "order",
        orderNo: "R001",
        periodStart: "2026-10-01",
        periodEnd: "2026-10-31",
        operations: [],
      };
    if (path === "/incomes/bill") data = billRow;
    if (path === "/orders/order")
      data = {
        id: "order",
        orderNo: "R001",
        tenantName: "测试租客",
        projectName: "海湾项目",
        unitNo: "A101",
        startsOn: "2026-10-01",
        endsOn: "2027-09-30",
        monthlyRent: "5500",
        currency: "HKD",
      };
    if (path === "/incomes/bills")
      data = {
        items: [billRow],
        total: 1,
        page: 1,
        summary: { rental: {}, deposit: {} },
        pendingCount: 0,
        projects: [],
        units: [],
      };
    if (path === "/invoices" && req.method() === "GET") {
      const status = url.searchParams.get("status");
      const list =
        status && status !== "ALL"
          ? rows.filter((r) => r.status === status)
          : rows;
      data = { items: list, total: list.length, page: 1 };
    }
    if (path === "/invoices" && req.method() === "POST") {
      const body = req.postDataJSON();
      data = {
        ...invoice,
        id: "created",
        invoiceNo: "INV003",
        ...body,
        snapshot: { remark: body.remark },
      };
      rows.push(data);
    }
    if (path.endsWith("/issue")) {
      const id = path.split("/")[2];
      rows = rows.map((r) => (r.id === id ? { ...r, status: "ACTIVE" } : r));
      data = rows.find((r) => r.id === id);
    }
    if (path.endsWith("/pdf"))
      return route.fulfill({
        contentType: "application/pdf",
        body: previewPdf,
      });
    await route.fulfill({ json: data });
  });
  return { writes, reads };
}

test("invoice menu follows bills, list exposes the reference fields and draft filtering", async ({
  page,
}) => {
  await mock(page);
  await page.goto("/invoices");
  const financeMenus = page.locator(".ant-layout-sider .ant-menu-sub");
  await expect(financeMenus.getByRole("menuitem")).toHaveText([
    "账单管理",
    "发票管理",
    "押金管理",
    "资金流水",
    "财务统计",
  ]);
  for (const name of [
    "发票编号",
    "项目 / 单位",
    "付款人",
    "出具日期",
    "到期日",
    "金额",
    "关联费用",
    "状态",
    "邮件状态",
    "操作",
  ])
    await expect(
      page.getByRole("columnheader", { name, exact: true }),
    ).toBeVisible();
  await page.getByRole("tab", { name: "草稿", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "INV001", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "INV002", exact: true }),
  ).toHaveCount(0);
  await page.screenshot({
    path: "/tmp/lease-invoices-list.png",
    animations: "disabled",
  });
});

test("invoice item opens finance detail drawer with linked bill, order, history and PDF preview", async ({
  page,
}) => {
  const { reads } = await mock(page);
  await page.goto("/invoices");
  await page.getByRole("button", { name: "INV001", exact: true }).click();
  await expect(page).toHaveURL(/\/invoices\/invoice$/);
  const drawer = page.locator(".finance-detail-drawer").first();
  await expect(drawer).toContainText("发票详情 · INV001");
  await expect(drawer.getByRole("tab", { name: "发票资料" })).toBeVisible();
  await expect(drawer).toContainText("HK$5,500.00");
  await expect(drawer).toContainText("草稿备注");
  await expect(drawer).toContainText("B001");
  await expect(drawer).toContainText("R001");
  await expect(drawer.getByRole("button", { name: "查看账单" })).toBeVisible();
  await page.screenshot({
    path: "/tmp/lease-invoice-detail-drawer.png",
    animations: "disabled",
  });
  await drawer.getByRole("button", { name: "查看账单" }).click();
  const billDrawer = page.locator(".finance-detail-drawer").last();
  await expect(billDrawer).toContainText("账单详情 · B001");
  await billDrawer.locator(".ant-drawer-close").click();
  await drawer.getByRole("tab", { name: "操作记录" }).click();
  await expect(drawer).toContainText("暂无操作记录");
  await drawer.getByRole("tab", { name: "发票资料" }).click();
  await drawer.getByRole("button", { name: "预览发票" }).click();
  await expect(page.getByTitle("发票 PDF 预览")).toHaveAttribute(
    "src",
    /^blob:/,
  );
  expect(reads).toContain("/invoices/invoice");
  expect(reads).toContain("/incomes/bill");
  expect(reads).toContain("/orders/order");
  await page.goto("/invoices/issued");
  await expect(drawer).toContainText("发票详情 · INV002");
  await expect(drawer).toContainText("已出具");
  await page.screenshot({
    path: "/tmp/lease-invoice-detail-issued.png",
    animations: "disabled",
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(drawer.getByRole("button", { name: "预览发票" })).toBeVisible();
  expect(
    await drawer.evaluate(
      (element) => element.scrollWidth <= element.clientWidth + 1,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "/tmp/lease-invoice-detail-mobile.png",
    animations: "disabled",
  });
});

test("unpaid bill can be selected to create and then issue a draft", async ({
  page,
}) => {
  const { writes } = await mock(page, "FINANCE", true);
  await page.goto("/invoices");
  await page.getByRole("button", { name: "新增发票", exact: true }).click();
  await page.getByLabel("关联账单", { exact: true }).click();
  await page
    .getByText("B001 · 测试租客 · 海湾项目 A101", { exact: true })
    .click();
  await page.getByLabel("发票备注", { exact: true }).fill("账单未收款，先开票");
  await page.getByRole("button", { name: "保存草稿", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "INV003", exact: true }),
  ).toBeVisible();
  expect(writes[0]).toMatchObject({
    path: "/invoices",
    body: { billId: "bill", dueOn: "2026-11-01", remark: "账单未收款，先开票" },
  });
  await page
    .getByRole("button", { name: "发票操作 INV003", exact: true })
    .click();
  await page.getByRole("menuitem", { name: "出具发票", exact: true }).click();
  await page.getByRole("button", { name: /^确\s*定$/ }).click();
  await expect(
    page.getByRole("row").filter({
      has: page.getByRole("button", { name: "INV003", exact: true }),
    }),
  ).toContainText("已出具");
  expect(writes.some((r) => r.path === "/invoices/created/issue")).toBe(true);
});

test("reissuing from invoice detail asks for a reason in a modal over the detail drawer", async ({
  page,
}) => {
  const { writes } = await mock(page);
  await page.goto("/invoices/issued");
  const drawer = page.locator(".finance-detail-drawer");
  await expect(drawer).toContainText("发票详情 · INV002");
  await drawer.getByRole("button", { name: "发票操作 INV002" }).click();
  await page.getByRole("menuitem", { name: "作废重开" }).click();
  const dialog = page.getByRole("dialog", { name: "作废重开发票" });
  await expect(dialog).toBeVisible();
  await expect(page.locator(".ant-drawer-content")).toHaveCount(1);
  await dialog.getByRole("button", { name: "确认重开" }).click();
  await expect(dialog.getByText("请填写重开原因")).toBeVisible();
  await dialog.getByRole("textbox", { name: "重开原因" }).fill("发票信息有误");
  await dialog.getByRole("button", { name: "确认重开" }).click();
  await expect(dialog).toHaveCount(0);
  expect(writes).toContainEqual({
    path: "/invoices/issued/reissue",
    body: { reason: "发票信息有误" },
  });
});

test("voiding an invoice asks for a reason in a modal over the detail drawer", async ({
  page,
}) => {
  const { writes } = await mock(page);
  await page.goto("/invoices/issued");
  const drawer = page.locator(".finance-detail-drawer");
  await expect(drawer).toContainText("发票详情 · INV002");
  await drawer.getByRole("button", { name: "发票操作 INV002" }).click();
  await page.getByRole("menuitem", { name: "作废", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "作废发票" });
  await expect(dialog).toBeVisible();
  await expect(page.locator(".ant-drawer-content")).toHaveCount(1);
  await dialog.getByRole("button", { name: "确认作废" }).click();
  await expect(dialog.getByText("请填写作废原因")).toBeVisible();
  await dialog
    .getByRole("textbox", { name: "作废原因" })
    .fill("  开票信息有误  ");
  await dialog.getByRole("button", { name: "确认作废" }).click();
  await expect(dialog).toHaveCount(0);
  expect(writes).toContainEqual({
    path: "/invoices/issued/void",
    body: { reason: "开票信息有误" },
  });
});

test("bill invoice preview loads authorized associations and lets users switch invoices", async ({
  page,
}) => {
  const { reads } = await mock(page, "FINANCE", false, {
    bill: { confirmed: "100" },
    invoices: [
      { ...invoice, status: "ACTIVE" },
      { ...invoice, id: "issued", invoiceNo: "INV002", status: "ACTIVE" },
    ],
  });
  await page.goto("/incomes");
  await page.getByRole("button", { name: "发票预览", exact: true }).click();
  await expect(page.getByTitle("发票 PDF 预览")).toHaveAttribute(
    "src",
    /^blob:/,
  );
  await expect(page.locator(".ant-drawer-title")).toContainText("INV001");
  await page
    .getByRole("combobox", { name: "选择关联发票" })
    .selectOption("issued");
  await expect(page.locator(".ant-drawer-title")).toContainText("INV002");
  expect(reads.some((r) => r.includes("billId=bill"))).toBe(true);
  expect(reads.some((r) => r.includes("status=ACTIVE"))).toBe(true);
  await expect(page.getByTitle("发票 PDF 预览")).toHaveAttribute(
    "src",
    /^blob:/,
  );
  await page.locator(".ant-drawer-close").last().click();
  await page
    .locator(".ant-table-row")
    .getByRole("button", { name: /查\s*看/ })
    .click();
  const billDrawer = page.locator(".finance-detail-drawer");
  await expect(
    billDrawer.getByRole("button", { name: "下载发票" }),
  ).toBeEnabled();
  await expect(
    billDrawer.getByRole("button", { name: "发票预览" }),
  ).toBeVisible();
});

test("issued invoice before receipt cannot be previewed or downloaded from bill management", async ({
  page,
}) => {
  await mock(page);
  await page.goto("/incomes");
  const row = page.locator(".ant-table-row");
  await expect(row.getByRole("button", { name: "发票预览" })).toHaveCount(0);
  await expect(row.getByRole("button", { name: "下载发票" })).toBeDisabled();
  await row.getByRole("button", { name: /查\s*看/ }).click();
  await expect(page.getByRole("button", { name: "发票预览" })).toHaveCount(0);
});

test("registered receipt without an issued invoice keeps bill preview unavailable", async ({
  page,
}) => {
  await mock(page, "FINANCE", true, {
    bill: { confirmed: "100", invoiceCount: 0 },
  });
  await page.goto("/incomes");
  await expect(page.getByRole("button", { name: "发票预览" })).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "下载发票", exact: true }),
  ).toBeDisabled();
});

test("operations bill query keeps invoice actions hidden", async ({ page }) => {
  await mock(page, "OPERATIONS", false, { bill: { confirmed: "100" } });
  await page.goto("/incomes");
  await expect(
    page.getByRole("button", { name: "发票预览", exact: true }),
  ).toHaveCount(0);
});
