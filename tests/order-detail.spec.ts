import { test, expect, Page } from "@playwright/test";

async function login(page: Page, username = "admin") {
  await page.goto("/login");
  await page.getByLabel("登录账号").fill(username);
  await page.getByLabel("密码", { exact: true }).fill("ChangeMe123!");
  await page.getByRole("button", { name: "登录系统" }).click();
  await page.waitForURL("**/projects");
}
async function call(page: Page, method: string, path: string, data?: unknown) {
  const csrf =
    (await page.context().cookies()).find((c) => c.name === "lease_csrf")
      ?.value || "";
  const res = await page.request.fetch(`/api/v1${path}`, {
    method,
    data,
    headers: { "X-CSRF-Token": csrf },
  });
  expect(res.ok(), `${method} ${path}: ${await res.text()}`).toBeTruthy();
  return res.json();
}

test("order tabs use detail data, remove filters and show readable tenant fields", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await login(page);
  const orders = await call(page, "GET", "/orders");
  const order = orders.items.find((o: any) =>
    ["PENDING", "ACTIVE"].includes(o.status),
  );
  const requests: string[] = [];
  page.on("request", (r) => {
    if (r.method() === "GET" && r.url().includes("/api/v1/"))
      requests.push(new URL(r.url()).pathname);
  });
  await page.goto(`/orders/${order.id}`);
  await expect(
    page.getByRole("button", { name: "编辑", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("tab")).toHaveCount(6);
  await expect(page.getByText("租客与销售归属", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("tabpanel", { name: "基本资料", exact: true }),
  ).not.toContainText("PERSON");
  for (const label of [
    "收款与账单",
    "押金管理",
    "订单佣金",
    "文件与资料",
    "操作记录",
  ]) {
    await page.getByRole("tab", { name: label, exact: true }).click();
    const panel = page.getByRole("tabpanel", { name: label, exact: true });
    await expect(panel).toBeVisible();
    if (label === "押金管理") {
      await expect(panel.getByText("押金概况", { exact: true })).toBeVisible();
      await expect(panel).not.toContainText("押金收款与结算数据暂不可用");
    }
    await expect(panel.getByPlaceholder("搜索编号、名称或关键词")).toHaveCount(
      0,
    );
    await expect(
      panel.getByRole("button", { name: "重置", exact: true }),
    ).toHaveCount(0);
  }
  expect(
    requests.filter(
      (x) =>
        /\/(incomes|expenses|commissions|materials)$/.test(x) ||
        x.endsWith("/operations"),
    ),
  ).toEqual([]);
  await page.getByRole("tab", { name: "基本资料", exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  expect(errors).toEqual([]);
});

test("new order requires project, unit and rent and defaults to one-deposit one-payment", async ({
  page,
}) => {
  await login(page);
  await page.goto("/orders");
  await page.getByRole("button", { name: "新建订单" }).click();
  const drawer = page.locator(".ant-drawer-content");
  await expect(drawer.getByText("订单佣金", { exact: true })).toBeVisible();
  await expect(drawer.getByText("是否设置佣金")).toHaveCount(0);
  await expect(drawer.getByText("结算开始", { exact: true })).toHaveCount(0);
  await expect(drawer.getByText("结算结束", { exact: true })).toHaveCount(0);
  await expect(
    drawer
      .locator(".ant-form-item")
      .filter({ hasText: "押付方式" })
      .getByText("押一付一"),
  ).toBeVisible();
  await drawer.getByRole("button", { name: "提交订单" }).click();
  await expect(drawer.locator("label.ant-form-item-required")).toHaveCount(4);
  await expect(drawer.locator("#projectId_help")).toContainText("请选择项目");
  await expect(drawer.locator("#unitId_help")).toContainText("请选择单位");
});

test("editing contact details does not resend unchanged payment or commission", async ({
  page,
}) => {
  await login(page);
  const orders = await call(page, "GET", "/orders");
  const order = orders.items.find(
    (item: any) =>
      ["PENDING", "ACTIVE"].includes(item.status) &&
      item.tenantType === "PERSON",
  );
  expect(order).toBeTruthy();
  const detail = await call(page, "GET", `/orders/${order.id}`);
  let submitted: Record<string, unknown> | undefined;
  await page.route(`**/api/v1/orders/${order.id}`, async (route) => {
    if (route.request().method() !== "PATCH") return route.continue();
    submitted = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(detail),
    });
  });
  await page.goto(`/orders/${order.id}`);
  await page.getByRole("button", { name: "编辑", exact: true }).click();
  const drawer = page.locator(".ant-drawer-content");
  await drawer.getByLabel("联系电话").fill("12345678");
  await drawer.getByLabel("修改原因").fill("核对联系方式");
  await drawer.getByRole("button", { name: "保存修改" }).click();
  await expect.poll(() => submitted).toBeDefined();
  expect(submitted).not.toHaveProperty("initialPayment");
  expect(submitted).not.toHaveProperty("commission");
});

test("editing payment and commission saves both through the order API", async ({
  page,
}) => {
  await login(page);
  const orders = await call(page, "GET", "/orders");
  const order = orders.items.find(
    (item: any) =>
      ["PENDING", "ACTIVE"].includes(item.status) &&
      item.tenantType === "PERSON",
  );
  expect(order).toBeTruthy();
  await page.goto(`/orders/${order.id}`);
  await page.getByRole("button", { name: "编辑", exact: true }).click();
  const drawer = page.locator(".ant-drawer-content");
  await drawer.getByLabel("佣金总额（HKD）").fill("1350");
  await drawer
    .locator(".ant-form-item")
    .filter({ hasText: "首期付款情况" })
    .locator(".ant-select-selector")
    .click();
  await page.getByText("部分付款", { exact: true }).last().click();
  await drawer.getByLabel("首期租金实收（HKD）").fill("500");
  await drawer.getByLabel("到账日期").fill("2026-10-03");
  await drawer.getByLabel("到账日期").press("Tab");
  await drawer.getByLabel("修改原因").fill("核对首期填报与佣金");
  await drawer.getByRole("button", { name: "保存修改" }).click();
  await expect(drawer).toHaveCount(0);
  const updated = await call(page, "GET", `/orders/${order.id}`);
  expect(updated.initialPayment.paymentState).toBe("PARTIAL");
  expect(Number(updated.initialPayment.rentReceived)).toBe(500);
  expect(Number(updated.orderCommission.amount)).toBe(1350);
});

test("deposit settlement and partial refund are usable from the order", async ({
  page,
}) => {
  await login(page);
  const existing = (await call(page, "GET", "/orders")).items[0];
  const template = await call(page, "GET", `/units/${existing.unitId}`);
  const unit = await call(page, "POST", "/units", {
    projectId: template.projectId,
    roomNo: `结算界面-${Date.now()}`,
    unitTypeCode: template.unitTypeCode,
    minLeaseMonths: 1,
  });
  const order = await call(page, "POST", "/orders", {
    projectId: template.projectId,
    unitId: unit.id,
    salesUserId: existing.salesUserId,
    tenantType: "PERSON",
    tenantName: "结算界面租客",
    monthlyRent: "1000",
    depositAmount: "500",
    depositPlan: "OTHER",
    commission: {
      mode: "ONE_TIME",
      amount: "100",
      dueOn: "2026-11-01",
    },
    startsOn: "2026-11-01",
    endsOn: "2026-11-30",
    initialPayment: {
      paid: false,
      rentPaid: false,
      depositPaid: false,
      rentReceived: "0",
      depositReceived: "0",
    },
  });
  const account = (await call(page, "GET", "/fund-accounts")).items[0];
  for (const bill of order.bills) {
    const receipt = await call(page, "POST", `/incomes/${bill.id}/receipts`, {
      amount: bill.total,
      receivedOn: "2026-11-01",
      fundAccountId: account.id,
      paymentMethod: "BANK",
      payerName: "结算界面租客",
      sourceKey: crypto.randomUUID(),
    });
    await call(page, "POST", `/incomes/${receipt.id}/confirm`);
  }
  await call(page, "POST", `/orders/${order.id}/terminate`, {
    date: "2026-11-30",
    reason: "完成租赁",
  });
  await call(page, "POST", `/orders/${order.id}/handover`, {
    date: "2026-11-30",
    note: "已交还",
  });
  await page.goto(`/orders/${order.id}`);
  await page.getByRole("tab", { name: "收款与账单" }).click();
  await page.getByRole("button", { name: "处理押金", exact: true }).click();
  await page.getByRole("button", { name: "办理押金结算", exact: true }).click();
  const drawer = page.locator(".ant-drawer-content");
  await drawer.getByRole("button", { name: "添加扣款项目" }).click();
  await drawer.getByLabel("扣款项目", { exact: true }).fill("清洁费");
  await drawer.getByLabel("扣款金额", { exact: true }).fill("100");
  await drawer.getByLabel("扣款原因", { exact: true }).fill("清洁费用");
  await drawer.getByLabel("结算说明", { exact: true }).fill("核对完成");
  await drawer.getByRole("button", { name: "确认结算", exact: true }).click();
  await expect(drawer).toHaveCount(0);

  await page.getByRole("button", { name: "登记退款", exact: true }).click();
  await drawer.getByLabel("本次退款金额", { exact: true }).fill("150");
  await expect(drawer.getByLabel("银行账户", { exact: true })).toBeDisabled();
  await expect(drawer.getByText(account.name, { exact: true })).toBeVisible();
  await drawer.getByRole("button", { name: "确认提交", exact: true }).click();
  await expect(drawer).toHaveCount(0);
  await expect(
    page.getByText("部分退款", { exact: true }).first(),
  ).toBeVisible();
  const updated = await call(page, "GET", `/orders/${order.id}`);
  expect(Number(updated.deposit.refundDue)).toBe(250);
  expect(Number(updated.deposit.refunded)).toBe(150);
  await page.screenshot({
    path: "/tmp/order-detail-deposit.png",
    fullPage: true,
  });
});
