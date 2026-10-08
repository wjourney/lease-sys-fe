import { test, expect, type Page } from "@playwright/test";
const projectId = "10000000-0000-4000-8000-000000000001";
const project = {
  id: projectId,
  name: "海湾项目",
  typeConfigs: [
    {
      code: "L",
      name: "大单位",
      building: "A座",
      floor: "3",
      area: "40",
      layout: "两房",
      age: 3,
      minRent: "100",
      maxRent: "200",
    },
    {
      code: "S",
      name: "小单位",
      building: "B座",
      floor: "4",
      area: "20",
      layout: "一房",
      age: 2,
      minRent: "50",
      maxRent: "100",
    },
  ],
};
async function setup(page: Page, role = "SUPER_ADMIN", mode = "ok") {
  const writes: any[] = [];
  let creates = 0;
  await page.route("**/api/v1/**", async (route) => {
    const req = route.request();
    const path = new URL(req.url()).pathname.replace("/api/v1", "");
    let data: any = { items: [], total: 0 };
    if (path === "/auth/me")
      data = {
        id: "admin",
        name: "管理员",
        role,
        capabilities: {
          read: ["projects", "units"],
          write: ["SUPER_ADMIN", "OPERATIONS"].includes(role)
            ? ["projects", "units"]
            : [],
        },
      };
    if (path === "/site-config") data = {};
    if (path === `/projects/${projectId}`)
      data =
        mode === "legacy"
          ? {
              ...project,
              typeConfigs: [
                {
                  code: "OLD",
                  name: "单间",
                  minArea: "20",
                  maxArea: "40",
                  minRent: "1000",
                  maxRent: "9000",
                },
              ],
            }
          : project;
    if (path === "/units/batch" || path === "/units/batch-preview") {
      const body = req.postDataJSON();
      writes.push({ path, body });
      if (path === "/units/batch" && ++creates === 1 && mode === "timeout")
        return route.abort("failed");
      data =
        mode === "invalid"
          ? {
              ok: false,
              issues: [{ row: 1, message: "该期/座、楼层下已存在此房号" }],
            }
          : { ok: true, count: body.rows.length, unitIds: ["u1", "u2"] };
    }
    await route.fulfill({ json: data });
  });
  await page.goto(`/projects/${projectId}/units/batch`);
  return writes;
}
async function chooseType(page: Page) {
  await page
    .getByRole("combobox", { name: "默认单位类型", exact: true })
    .click();
  await page.getByTitle("大单位 · A座 / 3楼").click();
}
test("paste preserves leading zeroes, preview checks server and creates minimal payload", async ({
  page,
}) => {
  const writes = await setup(page);
  await chooseType(page);
  await page.getByLabel("粘贴房号（换行或逗号分隔）").fill("01，02\n03");
  await page.getByRole("button", { name: "添加到预览" }).click();
  await expect(page.getByRole("textbox", { name: "第 1 行房号" })).toHaveValue(
    "01",
  );
  await page.getByRole("button", { name: "检查房号" }).click();
  await expect(page.getByText("校验通过，可以批量创建")).toBeVisible();
  await page.screenshot({
    path: "/tmp/lease-unit-batch-preview.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "确认批量创建" }).click();
  await expect(page).toHaveURL(`/projects/${projectId}`);
  expect(writes[1].body.requestId).toBe(writes[0].body.requestId);
  expect(writes[1].body.rows).toEqual(
    ["01", "02", "03"].map((roomNo) => ({
      roomNo,
      unitTypeCode: "L",
      referenceRent: "100",
    })),
  );
});
test("generator, duplicate errors, per-row type prices, removal and limit", async ({
  page,
}) => {
  const writes = await setup(page);
  await chooseType(page);
  await page.getByRole("spinbutton", { name: "数量", exact: true }).fill("2");
  await page.getByRole("button", { name: "连续生成并添加" }).click();
  await page.getByRole("textbox", { name: "第 2 行房号" }).fill("01");
  await expect(page.getByText("与第 1 行房号重复")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "确认批量创建" }),
  ).toBeDisabled();
  await page.getByRole("textbox", { name: "第 2 行房号" }).fill("02");
  await page.getByRole("spinbutton", { name: "第 2 行月租" }).fill("999");
  await expect(
    page.getByText("月租须在类型价格范围内，最多两位小数"),
  ).toBeVisible();
  const typeSelect = page.getByRole("combobox", { name: "第 2 行类型" });
  await typeSelect
    .locator("xpath=ancestor::div[contains(@class, 'ant-select-selector')]")
    .click();
  const listId = await typeSelect.getAttribute("aria-controls");
  await page
    .locator(".ant-select-dropdown")
    .filter({ has: page.locator(`[id="${listId}"]`) })
    .getByTitle("小单位 · B座 / 4楼")
    .click();
  await page.getByRole("spinbutton", { name: "第 2 行月租" }).fill("70");
  await expect(
    page.getByRole("button", { name: "确认批量创建" }),
  ).toBeEnabled();
  await page.getByRole("spinbutton", { name: "数量", exact: true }).fill("100");
  await page.getByRole("button", { name: "连续生成并添加" }).click();
  await expect(page.getByText("每批最多创建 100 个单位")).toBeVisible();
  await page.getByRole("button", { name: "移除第 1 行" }).click();
  await expect(page.getByRole("textbox", { name: "第 1 行房号" })).toHaveValue(
    "02",
  );
  expect(writes).toHaveLength(0);
});
test("server conflicts remain editable without any successful subset", async ({
  page,
}) => {
  await setup(page, "SUPER_ADMIN", "invalid");
  await chooseType(page);
  await page.getByRole("spinbutton", { name: "数量", exact: true }).fill("2");
  await page.getByRole("button", { name: "连续生成并添加" }).click();
  await page.getByRole("button", { name: "确认批量创建" }).click();
  await expect(page.getByText("该期/座、楼层下已存在此房号")).toBeVisible();
  await page.getByRole("textbox", { name: "第 2 行房号" }).fill("03");
  await expect(
    page.getByRole("button", { name: "确认批量创建" }),
  ).toBeEnabled();
});
test("network failure survives reload and retries the exact batch once", async ({
  page,
}) => {
  const writes = await setup(page, "OPERATIONS", "timeout");
  await chooseType(page);
  await page.getByRole("spinbutton", { name: "数量", exact: true }).fill("2");
  await page.getByRole("button", { name: "连续生成并添加" }).click();
  await page.getByRole("button", { name: "确认批量创建" }).click();
  await expect(
    page.getByRole("button", { name: "重试并确认创建结果" }),
  ).toBeEnabled();
  await expect(
    page.getByRole("textbox", { name: "第 1 行房号" }),
  ).toBeDisabled();
  await page.reload();
  await page.getByRole("button", { name: "重试并确认创建结果" }).click();
  await expect(page).toHaveURL(`/projects/${projectId}`);
  expect(writes).toHaveLength(2);
  expect(writes[0].body).toEqual(writes[1].body);
});
for (const role of ["SALES", "SALES_COMPANY_ADMIN", "FINANCE"])
  test(`${role} cannot open batch creation`, async ({ page }) => {
    const writes = await setup(page, role);
    await expect(page.getByText("当前账号没有此操作权限")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "确认批量创建" }),
    ).toHaveCount(0);
    expect(writes).toHaveLength(0);
  });

test("legacy project types show missing fields and cannot create incomplete units", async ({
  page,
}) => {
  const writes = await setup(page, "SUPER_ADMIN", "legacy");
  await page
    .getByRole("combobox", { name: "默认单位类型", exact: true })
    .click();
  await page.getByTitle("单间 · 资料待完善").click();
  await expect(page.getByText(/所选类型资料未完善：/)).toBeVisible();
  await expect(page.locator("body")).not.toContainText("undefined");
  await expect(page.locator("body")).not.toContainText("NaN");
  await expect(page.getByRole("button", { name: "添加到预览" })).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "连续生成并添加" }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "确认批量创建" }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "编辑项目，完善类型" }),
  ).toBeEnabled();
  await page.screenshot({
    path: "/tmp/lease-unit-batch-legacy-fixed.png",
    fullPage: true,
  });
  expect(writes).toHaveLength(0);
});
