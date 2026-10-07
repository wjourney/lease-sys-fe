import { test, expect } from "@playwright/test";
test("project types are edited within projects and unit choices use their project", async ({
  page,
}) => {
  const project = {
    id: "project",
    name: "海湾项目",
    code: "P001",
    region: "港岛",
    address: "海湾路",
    unitCount: 0,
    lockedCount: 0,
    occupiedCount: 0,
    availableCount: 0,
    materials: [],
    typeConfigs: [
      {
        code: "LARGE",
        name: "海景大单位",
        building: "A座", floor: "12", area: "48", layout: "两房", age: 5,
        minRent: "10000",
        maxRent: "20000",
      },
    ],
  };
  const calls: string[] = [];
  await page.route("**/api/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname.replace("/api/v1", "");
    calls.push(path);
    if (route.request().method() !== "GET") throw new Error("Unexpected write");
    let data: any = { items: [], total: 0 };
    if (path === "/auth/me")
      data = {
        id: "admin",
        name: "管理员",
        role: "SUPER_ADMIN",
        capabilities: {
          read: ["projects", "units", "fund-accounts", "settings"],
          write: ["projects", "units", "fund-accounts", "settings"],
          manageOrders: true,
        },
      };
    if (path === "/projects")
      data = {
        items: [
          project,
          {
            ...project,
            id: "other",
            name: "另一项目",
            typeConfigs: [
              { ...project.typeConfigs[0], code: "OTHER", name: "别墅" },
            ],
          },
        ],
        total: 2,
      };
    if (path === "/projects/project") data = project;
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify(data),
    });
  });
  await page.goto("/projects");
  await page.getByRole("button", { name: /新建项目/ }).click();
  const editor = page.locator(".record-form-page");
  await expect(page).toHaveURL(/\/projects\/new$/);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(editor.getByText("项目单位类型", { exact: true })).toBeVisible();
  await expect(editor.locator('input[value="大单位"]')).toBeVisible();
  await expect(editor.locator('input[value="小单位"]')).toBeVisible();
  await editor.locator("#typeConfigs_0_area").scrollIntoViewIfNeeded();
  await page.screenshot({
    path: "/tmp/lease-project-unit-types.png",
    animations: "disabled",
  });
  await editor.getByRole("button", { name: /取\s*消/ }).click();
  await page.goto("/projects/project");
  await page.getByRole("button", { name: /新建单位/ }).click();
  await editor.locator("#unitTypeCode").click();
  await page.getByText("海景大单位", { exact: true }).last().click();
  await expect(editor.locator("#referenceRent")).toHaveValue("10000.00");
  await expect(editor.locator("#area")).toHaveCount(0);
  await expect(editor.locator("#floor")).toHaveCount(0);
  await expect(editor.getByText("48 ㎡", { exact: true })).toBeVisible();
  await expect(editor.getByText("类型资料（自动带入）")).toBeVisible();
  expect(calls.some((path) => path.startsWith("/settings"))).toBe(false);
  await expect(page.getByText("单位类型配置", { exact: true })).toHaveCount(0);
});
