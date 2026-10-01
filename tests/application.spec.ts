import { test, expect, Page } from "@playwright/test";
const login = async (page: Page, username: string) => {
  await page.goto("/");
  await page.getByLabel("登录账号").fill(username);
  await page
    .getByLabel("密码", { exact: true })
    .fill(process.env.SEED_PASSWORD || "ChangeMe123!");
  await page.getByRole("button", { name: "登录系统" }).click();
  await page.waitForURL("**/projects");
  await expect(page.locator(".page-heading")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "项目管理", exact: true }),
  ).toHaveCount(0);
};
for (const username of ["admin", "operations", "finance", "company", "sales"]) {
  test(`${username}: visible modules use real authorized APIs`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("response", (r) => {
      if (r.url().includes("/api/v1/") && r.status() >= 500)
        errors.push(r.status() + " " + r.url());
    });
    await login(page, username);
    const items = await page
      .getByRole("menuitem")
      .evaluateAll((nodes) => nodes.map((n) => n.textContent).filter(Boolean));
    for (const label of [
      "项目管理",
      "订单管理",
      "收入管理",
      "支出管理",
      "佣金管理",
      "发票管理",
      "销售公司",
      "账号管理",
      "文件与资料",
      "资金账户",
      "系统设置",
    ]) {
      if (!items.some((x) => x?.includes(label))) continue;
      await page.getByRole("menuitem", { name: label, exact: true }).click();
      await expect(page.locator(".page-heading")).toBeVisible();
      await expect(
        page.getByRole("heading", { name: label, exact: true }),
      ).toHaveCount(0);
      await expect(page.locator(".ant-spin-spinning")).toHaveCount(0);
      await expect(page.locator(".ant-alert-error")).toHaveCount(0);
    }
    if (username === "sales") {
      await expect(
        page.getByRole("menuitem", { name: "支出管理", exact: true }),
      ).toHaveCount(0);
      await page.goto("/orders");
      await expect(page.locator("tbody")).not.toContainText("林先生");
    }
    expect(errors).toEqual([]);
  });
}
test("admin creates project, unit and order through the UI", async ({
  page,
}) => {
  await login(page, "admin");
  await page.getByRole("menuitem", { name: "项目管理", exact: true }).click();
  await page.getByRole("button", { name: "新建项目", exact: true }).click();
  const drawer = page.locator(".ant-drawer-content");
  const name = "浏览器测试项目 " + Date.now();
  await drawer.getByLabel("项目中文名称", { exact: true }).fill(name);
  await drawer.getByLabel("区域", { exact: true }).click();
  await page.getByTitle("九龙", { exact: true }).click();
  await drawer.getByLabel("物业名称", { exact: true }).fill("浏览器测试物业");
  await drawer.getByLabel("详细地址", { exact: true }).fill("测试地址 88 号");
  await drawer.getByRole("button", { name: "创建项目", exact: true }).click();
  await expect(drawer).toHaveCount(0);
  const card = page.locator(".project-card").filter({ hasText: name });
  await card.getByRole("button", { name: "查看项目" }).click();
  await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "返回上级" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "删除", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "单位", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "编辑项目", exact: true }).click();
  await expect(drawer.getByLabel("项目编号", { exact: true })).toHaveAttribute(
    "readonly",
    "",
  );
  await expect(drawer.getByLabel("项目中文名称", { exact: true })).toHaveValue(
    name,
  );
  await expect(drawer.getByLabel("物业名称", { exact: true })).toHaveValue(
    "浏览器测试物业",
  );
  await expect(drawer.getByText("官方文件", { exact: true })).toBeVisible();
  await drawer.getByLabel("发展商", { exact: true }).fill("浏览器测试发展商");
  await drawer.getByRole("button", { name: "保存修改", exact: true }).click();
  await expect(drawer).toHaveCount(0);
  await page.getByRole("button", { name: "新建单位", exact: true }).click();
  await page.getByLabel("单位编号", { exact: true }).fill("A座 101");
  await page.getByLabel("单位类型", { exact: true }).click();
  await page.getByTitle("公寓", { exact: true }).click();
  await page.getByLabel("面积（㎡）", { exact: true }).fill("38");
  await page.getByLabel("参考月租", { exact: true }).fill("5800");
  await page.getByLabel("最低租金", { exact: true }).fill("5000");
  await page.getByLabel("最高租金", { exact: true }).fill("6500");
  await drawer.getByRole("button", { name: "保存", exact: true }).click();
  await expect(drawer).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "A座 101" })).toBeVisible();
  await page.getByRole("menuitem", { name: "订单管理", exact: true }).click();
  await page.getByRole("button", { name: "新建订单", exact: true }).click();
  await page.getByLabel("租赁单位", { exact: true }).click();
  await page.getByLabel("租赁单位", { exact: true }).fill(name);
  await page.getByTitle(name + " · A座 101", { exact: true }).click();
  await page.getByLabel("负责销售", { exact: true }).click();
  await page.getByTitle("陈浩然", { exact: true }).click();
  await page
    .getByLabel("租客 / 公司名称", { exact: true })
    .fill("浏览器测试租客");
  await page.getByLabel("租期开始", { exact: true }).fill("2026-12-01");
  await page.getByLabel("租期开始", { exact: true }).press("Enter");
  await page.getByLabel("租期结束", { exact: true }).fill("2027-11-30");
  await page.getByLabel("租期结束", { exact: true }).press("Enter");
  await page.getByLabel("成交月租", { exact: true }).fill("5800");
  await page.getByLabel("押金", { exact: true }).fill("11600");
  await drawer.getByRole("button", { name: "保存", exact: true }).click();
  await expect(drawer).toHaveCount(0);
  await expect(page.locator("tbody")).toContainText("浏览器测试租客");
});
test("income form, inline receipt, confirmation and invoice navigation", async ({
  page,
}) => {
  const payer = "浏览器测试付款人 " + Date.now();
  await login(page, "finance");
  await page.getByRole("menuitem", { name: "收入管理", exact: true }).click();
  await page.getByRole("button", { name: "新建收入", exact: true }).click();
  const drawer = page.locator(".ant-drawer-content");
  await page.getByLabel("收入类型", { exact: true }).click();
  await page.getByTitle("其他收入", { exact: true }).click();
  await page.getByLabel("付款方", { exact: true }).fill(payer);
  await page.getByLabel("应收金额", { exact: true }).fill("600");
  await page.getByLabel("到期日期", { exact: true }).fill("2026-10-01");
  await page.getByLabel("到期日期", { exact: true }).press("Enter");
  await drawer.getByRole("button", { name: "保存", exact: true }).click();
  await expect(drawer).toHaveCount(0);
  await page
    .locator("tbody tr")
    .filter({ hasText: payer })
    .getByText("查看", { exact: true })
    .click();
  await page.getByRole("button", { name: "登记收款", exact: true }).click();
  await page.getByLabel("资金账户", { exact: true }).click();
  await page.getByTitle("公司港币账户", { exact: true }).click();
  await drawer.getByRole("button", { name: "确认提交", exact: true }).click();
  await expect(drawer).toHaveCount(0);
  await page.getByRole("button", { name: "确认到账", exact: true }).click();
  await expect(page.getByText("已收齐", { exact: true })).toBeVisible();
  await page.getByRole("menuitem", { name: "发票管理", exact: true }).click();
  await expect(page.locator("tbody")).toContainText("600.00");
});
test("traditional Chinese toggle changes application text", async ({
  page,
}) => {
  await login(page, "admin");
  await page.getByRole("button", { name: "简体中文", exact: true }).hover();
  await page.getByRole("menuitem", { name: "繁體中文", exact: true }).click();
  await expect(
    page.getByRole("menuitem", { name: "項目管理", exact: true }),
  ).toBeVisible();
  await page.getByRole("menuitem", { name: "項目管理", exact: true }).click();
  await expect(page.locator(".page-heading")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "項目管理", exact: true }),
  ).toHaveCount(0);
});

test("mobile navigation remains accessible", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page, "sales");
  await page.getByRole("button", { name: "折叠菜单" }).click();
  await page.getByRole("menuitem", { name: "项目管理", exact: true }).click();
  await expect(page.locator(".page-heading")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "项目管理", exact: true }),
  ).toHaveCount(0);
  await expect(page.locator(".ant-drawer-content")).not.toBeVisible();
});
