import { test, expect, type Page } from "@playwright/test";

const project = {
  id: "project",
  name: "海湾项目",
  propertyName: "海湾住宅",
  code: "P001",
  region: "港岛",
  address: "海湾路",
  status: "ACTIVE",
  revision: 3,
  unitCount: 25,
  availableCount: 25,
  lockedCount: 0,
  occupiedCount: 0,
  materials: [],
  typeConfigs: [
    {
      code: "LARGE",
      name: "大单位",
      building: "A座",
      floor: "12",
      area: "48",
      layout: "两房",
      minRent: "10000",
      maxRent: "20000",
      referenceRent: "15000",
    },
  ],
};
const unit = {
  id: "unit",
  projectId: "project",
  unitNo: "海景居",
  unitTypeCode: "LARGE",
  floor: "12",
  roomNo: "1201",
  area: 48,
  layout: "1室1厅",
  minRent: 10000,
  maxRent: 20000,
  referenceRent: 15000,
  minLeaseMonths: 12,
  revision: 4,
  enabled: true,
  materials: [],
  extra: { phase: "A座", rentCycle: "月付" },
};
async function mockApi(
  page: Page,
  role = "SUPER_ADMIN",
  projectData: any = project,
) {
  const writes: { path: string; method: string; body: any }[] = [];
  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname.replace("/api/v1", "");
    let data: any = { items: [], total: 0 };
    if (path === "/auth/me")
      data = {
        id: "user",
        name: "管理员",
        role,
        capabilities: {
          read: ["projects", "units"],
          write: ["projects", "units"],
          finance: false,
        },
      };
    if (path === "/site-config") data = {};
    if (path === "/projects") data = { items: [projectData], total: 25 };
    if (path === "/projects/project") data = projectData;
    if (path === "/units") data = { items: [unit], total: 25 };
    if (path === "/units/unit") data = unit;
    if (request.method() !== "GET") {
      writes.push({
        path,
        method: request.method(),
        body: request.postDataJSON(),
      });
      data = {
        ...(path.startsWith("/units") ? unit : projectData),
        ...request.postDataJSON(),
      };
    }
    await route.fulfill({ json: data });
  });
  return writes;
}

test("project page replaces drawer, confines scrolling and protects unsaved changes", async ({
  page,
}) => {
  await mockApi(page);
  await page.goto("/projects?q=海湾&page=2");
  await page.getByRole("button", { name: /新建项目/ }).click();
  await expect(page).toHaveURL(/\/projects\/new$/);
  await expect(page.locator("#record-detail-header")).toContainText("新建项目");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.locator("#name").fill("未保存项目");
  const scroll = page.locator(".record-form-scroll");
  await scroll.evaluate((el) => {
    el.scrollTop = el.scrollHeight;
  });
  const geometry = await page.evaluate(() => ({
    height: innerHeight,
    documentHeight: document.documentElement.scrollHeight,
    footerBottom: document
      .querySelector(".record-form-actions")!
      .getBoundingClientRect().bottom,
    headerTop: document
      .querySelector("#record-detail-header")!
      .getBoundingClientRect().top,
  }));
  expect(geometry.documentHeight).toBeLessThanOrEqual(geometry.height + 1);
  expect(geometry.footerBottom).toBeLessThanOrEqual(geometry.height + 1);
  expect(geometry.headerTop).toBeGreaterThanOrEqual(0);
  await page.getByRole("button", { name: /取\s*消/ }).click();
  await expect(page.getByRole("dialog")).toContainText("放弃未保存的修改");
  await page.getByRole("button", { name: "继续填写" }).click();
  await expect(page.locator("#name")).toHaveValue("未保存项目");
  await page.getByRole("button", { name: "返回上级" }).click();
  await page.getByRole("button", { name: "放弃修改" }).click();
  await expect
    .poll(() => decodeURI(page.url()))
    .toMatch(/\/projects\?q=海湾&page=2$/);
});

test("project edits load full data and return to the filtered list after saving", async ({
  page,
}) => {
  const writes = await mockApi(page);
  await page.goto("/projects?page=2");
  await page.getByRole("button", { name: /编\s*辑/, exact: true }).click();
  await expect(page).toHaveURL(/\/projects\/project\/edit$/);
  await expect(page.locator("#name")).toHaveValue("海湾项目");
  await page.locator("#name").fill("海湾花园");
  await page.getByRole("button", { name: "保存修改" }).click();
  await expect(page).toHaveURL(/\/projects\?page=2$/);
  expect(
    writes.find((write) => write.path === "/projects/project")?.body,
  ).toMatchObject({ name: "海湾花园", revision: 3 });
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("existing logo and photos share one gallery and the chosen photo becomes the logo", async ({
  page,
}) => {
  const materials = [
    {
      id: "00000000-0000-4000-8000-000000000001",
      category: "LOGO",
      storageKey: "old-logo",
      sortOrder: 0,
      title: "旧 Logo",
    },
    {
      id: "00000000-0000-4000-8000-000000000002",
      category: "PHOTO",
      storageKey: "first-photo",
      sortOrder: 0,
      title: "外观",
    },
    {
      id: "00000000-0000-4000-8000-000000000003",
      category: "PHOTO",
      storageKey: "second-photo",
      sortOrder: 1,
      title: "大堂",
    },
  ];
  const writes = await mockApi(page, "SUPER_ADMIN", { ...project, materials });
  await page.goto("/projects/project/edit");
  await expect(page.getByText("项目 Logo", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "设为主 Logo" })).toHaveCount(
    2,
  );
  await page.getByRole("button", { name: "设为主 Logo" }).last().click();
  await page.getByRole("button", { name: "保存修改" }).click();
  await expect(page).toHaveURL(/\/projects\/project$/);
  expect(
    writes.find((write) => write.path === "/projects/project/images/order")
      ?.body.ids,
  ).toEqual([materials[2].id, materials[0].id, materials[1].id]);
});

test("unit edit preserves the project's filters and pagination on save", async ({
  page,
}) => {
  const writes = await mockApi(page);
  const origin =
    "/projects/project?status=AVAILABLE&unitTypeCode=LARGE&sort=asc&q=海景&page=2";
  await page.goto(origin);
  await page
    .locator(".project-card")
    .getByRole("button", { name: /编\s*辑/, exact: true })
    .click();
  await expect(page).toHaveURL(/\/projects\/project\/units\/unit\/edit$/);
  await expect(page.locator("#roomNo")).toHaveValue("1201");
  await expect(page.locator("#projectId")).toBeDisabled();
  await page.locator("#roomNo").fill("1203");
  await page.getByRole("button", { name: "保存单位" }).click();
  await expect
    .poll(() =>
      decodeURI(new URL(page.url()).pathname + new URL(page.url()).search),
    )
    .toBe(origin);
  expect(writes[0]).toMatchObject({
    path: "/units/unit",
    method: "PATCH",
    body: { roomNo: "1203", revision: 4, projectId: "project" },
  });
});

test("sales cannot access create or edit pages even with stale write capabilities", async ({
  page,
}) => {
  const writes = await mockApi(page, "SALES");
  for (const path of [
    "/projects/new",
    "/projects/project/edit",
    "/projects/project/units/new",
    "/projects/project/units/unit/edit",
  ]) {
    await page.goto(path);
    await expect(
      page.getByText("当前账号没有此操作权限", { exact: true }),
    ).toBeVisible();
    await expect(page.locator("form")).toHaveCount(0);
  }
  expect(writes).toHaveLength(0);
});

test("create project submits through the independent page", async ({
  page,
}) => {
  const writes = await mockApi(page);
  await page.goto("/projects/new");
  await page.locator("#name").fill("新海湾项目");
  await page.locator("#propertyName").fill("海湾住宅");
  await page.locator("#address").fill("海湾路88号");
  await page.locator("#floorCount").fill("28");
  await page.locator("#completionYear").fill("2023");
  await page.locator("#ownership").fill("单一业权");
  await page.locator("#parking").fill("地下停车场");
  await page.locator("#mtrStation").fill("太古站");
  await page.locator("#region").click();
  await page.getByTitle("港岛", { exact: true }).click();
  await page.getByRole("button", { name: "地图选点" }).click();
  await page.locator(".leaflet-container").click();
  await page.getByRole("button", { name: "确定位置" }).click();
  for (const index of [0, 1]) {
    for (const [field, value] of Object.entries({
      building: "A座",
      floor: "12",
      area: "48",
      layout: "两房",
      minRent: "10000",
      maxRent: "20000",
      referenceRent: "15000",
    })) {
      await page.locator(`#typeConfigs_${index}_${field}`).fill(String(value));
    }
  }
  await page.getByRole("button", { name: "创建项目", exact: true }).click();
  await expect(page).toHaveURL(/\/projects$/);
  expect(writes[0]).toMatchObject({
    path: "/projects",
    method: "POST",
    body: {
      name: "新海湾项目",
      region: "港岛",
      extra: {
        floorCount: 28,
        completionYear: 2023,
        ownership: "单一业权",
        parking: "地下停车场",
        mtrStation: "太古站",
      },
    },
  });
  expect(writes[0].body.latitude).toBeCloseTo(22.3193, 2);
  expect(writes[0].body.longitude).toBeCloseTo(114.1694, 2);
});

test("project detail opens its saved location on a map", async ({ page }) => {
  await mockApi(page, "SUPER_ADMIN", {
    ...project,
    latitude: "22.31930000",
    longitude: "114.16940000",
  });
  await page.goto("/projects/project");
  await expect(page.getByRole("button", { name: "操作记录" })).toHaveCount(0);
  await page.getByRole("button", { name: "查看地图" }).click();
  await expect(page.getByRole("dialog")).toContainText("22.319300");
  await expect(page.getByRole("dialog")).toContainText("114.169400");
  await expect(
    page.getByRole("link", { name: "在 OpenStreetMap 打开" }),
  ).toHaveAttribute("href", /mlat=22\.3193&mlon=114\.1694/);
});

test("new unit keeps project selected and supports narrow-screen creation", async ({
  page,
}) => {
  const writes = await mockApi(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/projects/project/units/new");
  await expect(page.locator("#projectId")).toBeDisabled();
  await expect(page.locator(".record-form-page")).toContainText("海湾项目");

  await page.locator("#unitTypeCode").click();
  await page.getByText("大单位", { exact: true }).last().click();
  await page.locator("#roomNo").fill("1202");
  const geometry = await page.evaluate(() => ({
    height: innerHeight,
    width: innerWidth,
    documentHeight: document.documentElement.scrollHeight,
    documentWidth: document.documentElement.scrollWidth,
    footerBottom: document
      .querySelector(".record-form-actions")!
      .getBoundingClientRect().bottom,
  }));
  expect(geometry.documentHeight).toBeLessThanOrEqual(geometry.height + 1);
  expect(geometry.documentWidth).toBeLessThanOrEqual(geometry.width + 1);
  expect(geometry.footerBottom).toBeLessThanOrEqual(geometry.height + 1);
  await page.getByRole("button", { name: "保存单位" }).click();
  await expect(page).toHaveURL(/\/projects\/project$/);
  expect(writes[0]).toMatchObject({
    path: "/units",
    method: "POST",
    body: { roomNo: "1202", projectId: "project", unitTypeCode: "LARGE" },
  });
  expect(writes[0].body).not.toHaveProperty("referenceRent");
});
