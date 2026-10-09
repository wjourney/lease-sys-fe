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
      referenceRent: "150",
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
      referenceRent: "70",
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
          : mode === "visual"
            ? {
                ...project,
                name: "九龙城测试",
                typeConfigs: [
                  {
                    code: "L",
                    name: "总统套房",
                    building: "A座",
                    floor: "12",
                    area: "123",
                    layout: "一室一厅",
                    minRent: "18000",
                    maxRent: "40000",
                    referenceRent: "20000",
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
        mode === "invalid" || mode === "visual"
          ? {
              ok: false,
              issues: [
                {
                  row: mode === "visual" ? 3 : 1,
                  message:
                    mode === "visual"
                      ? "房号已存在"
                      : "该期/座、楼层下已存在此房号",
                },
              ],
            }
          : { ok: true, count: body.rows.length, unitIds: ["u1", "u2"] };
    }
    await route.fulfill({ json: data });
  });
  await page.goto(`/projects/${projectId}/units/batch`);
  return writes;
}
async function chooseType(page: Page) {
  await page.getByRole("combobox", { name: "单位类型", exact: true }).click();
  await page.getByTitle("大单位 · A座 / 3楼").click();
}
test("paste preserves leading zeroes and submission validates a minimal payload", async ({
  page,
}) => {
  const writes = await setup(page);
  await expect(
    page.getByRole("heading", { name: "批量创建单位 · 海湾项目" }),
  ).toBeVisible();
  await chooseType(page);
  await page.getByRole("tab", { name: "粘贴房号", exact: true }).click();
  await page.getByLabel("粘贴房号（换行或逗号分隔）").fill("01，02\n03");
  await expect(
    page.getByText("已识别 3 个房号，添加后可在列表调整"),
  ).toBeVisible();
  await page.getByRole("button", { name: "添加到待创建列表" }).click();
  await expect(page.getByRole("textbox", { name: "第 1 行房号" })).toHaveValue(
    "01",
  );
  await expect(page.getByRole("button", { name: "检查房号" })).toHaveCount(0);
  await page.getByRole("button", { name: "创建 3 套" }).click();
  await expect(page).toHaveURL(`/projects/${projectId}?tab=units`);
  expect(writes).toHaveLength(1);
  expect(writes[0].path).toBe("/units/batch");
  expect(writes[0].body.rows).toEqual(
    ["01", "02", "03"].map((roomNo) => ({ roomNo, unitTypeCode: "L" })),
  );
  expect(writes[0].body.rows[0]).not.toHaveProperty("referenceRent");
});
test("generator, duplicate errors, per-row type prices, removal and limit", async ({
  page,
}) => {
  const writes = await setup(page);
  await chooseType(page);
  await page.getByRole("spinbutton", { name: "数量", exact: true }).fill("2");
  await page.getByRole("button", { name: "生成预览" }).click();
  await page.getByRole("textbox", { name: "第 2 行房号" }).fill("01");
  await expect(page.getByText("与第 1 行房号重复")).toBeVisible();
  await expect(
    page.getByRole("button", { name: /^创建 \d+ 套$/ }),
  ).toBeDisabled();
  await page.getByRole("textbox", { name: "第 2 行房号" }).fill("02");
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
  await expect(
    page.getByRole("spinbutton", { name: "第 2 行月租" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: /^创建 \d+ 套$/ }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "移除第 1 行" }).click();
  await expect(page.getByRole("textbox", { name: "第 1 行房号" })).toHaveValue(
    "02",
  );
  await page.getByRole("tab", { name: "粘贴房号", exact: true }).click();
  await page
    .getByLabel("粘贴房号（换行或逗号分隔）")
    .fill(Array.from({ length: 100 }, (_, i) => `R${i}`).join("\n"));
  await page.getByRole("button", { name: "添加到待创建列表" }).click();
  await expect(page.getByText("每批最多创建 100 个单位")).toBeVisible();
  await expect(
    page.getByRole("textbox", { name: /^第 \d+ 行房号$/ }),
  ).toHaveCount(1);
  expect(writes).toHaveLength(0);
});
test("server conflicts remain editable without any successful subset", async ({
  page,
}) => {
  await setup(page, "SUPER_ADMIN", "invalid");
  await chooseType(page);
  await page.getByRole("spinbutton", { name: "数量", exact: true }).fill("2");
  await page.getByRole("button", { name: "生成预览" }).click();
  await page.getByRole("button", { name: /^创建 \d+ 套$/ }).click();
  await expect(page.getByText("该期/座、楼层下已存在此房号")).toBeVisible();
  await page.getByRole("textbox", { name: "第 2 行房号" }).fill("03");
  await expect(
    page.getByRole("button", { name: /^创建 \d+ 套$/ }),
  ).toBeEnabled();
});
test("network failure survives reload and retries the exact batch once", async ({
  page,
}) => {
  const writes = await setup(page, "OPERATIONS", "timeout");
  await chooseType(page);
  await page.getByRole("spinbutton", { name: "数量", exact: true }).fill("2");
  await page.getByRole("button", { name: "生成预览" }).click();
  await page.getByRole("button", { name: /^创建 \d+ 套$/ }).click();
  await expect(
    page.getByRole("button", { name: "重试并确认创建结果" }),
  ).toBeEnabled();
  await expect(
    page.getByRole("textbox", { name: "第 1 行房号" }),
  ).toBeDisabled();
  await page.reload();
  await page.getByRole("button", { name: "重试并确认创建结果" }).click();
  await expect(page).toHaveURL(`/projects/${projectId}?tab=units`);
  expect(writes).toHaveLength(2);
  expect(writes[0].body).toEqual(writes[1].body);
});
for (const role of ["SALES", "SALES_COMPANY_ADMIN", "FINANCE"])
  test(`${role} cannot open batch creation`, async ({ page }) => {
    const writes = await setup(page, role);
    await expect(page.getByText("当前账号没有此操作权限")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /^创建 \d+ 套$/ }),
    ).toHaveCount(0);
    expect(writes).toHaveLength(0);
  });

test("legacy project types show missing fields and cannot create incomplete units", async ({
  page,
}) => {
  const writes = await setup(page, "SUPER_ADMIN", "legacy");
  await page.getByRole("combobox", { name: "单位类型", exact: true }).click();
  await page.getByTitle("单间 · 资料待完善").click();
  await expect(page.getByText(/所选类型资料未完善：/)).toBeVisible();
  await expect(page.locator("body")).not.toContainText("undefined");
  await expect(page.locator("body")).not.toContainText("NaN");
  await page.getByRole("tab", { name: "粘贴房号", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "添加到待创建列表" }),
  ).toBeDisabled();
  await page.getByRole("tab", { name: "连续生成", exact: true }).click();
  await expect(page.getByRole("button", { name: "生成预览" })).toBeDisabled();
  await expect(
    page.getByRole("button", { name: /^创建 \d+ 套$/ }),
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

test("changing the prefix and count replaces the preview instead of appending units", async ({
  page,
}) => {
  const writes = await setup(page);
  await chooseType(page);
  await page.getByRole("textbox", { name: "房号前缀", exact: true }).fill("A");
  await page.getByRole("button", { name: "生成预览", exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: /^第 \d+ 行房号$/ }),
  ).toHaveCount(10);
  await page.getByRole("textbox", { name: "第 1 行房号" }).fill("manual");
  await page.getByRole("textbox", { name: "房号前缀", exact: true }).fill("B");
  await expect(page.getByRole("button", { name: "创建 10 套" })).toBeDisabled();
  await expect(
    page.getByText("生成规则已修改，请更新预览后再创建。"),
  ).toBeVisible();
  await page.getByRole("button", { name: "更新预览" }).click();
  await expect(
    page.getByRole("textbox", { name: /^第 \d+ 行房号$/ }),
  ).toHaveCount(10);
  await expect(page.getByRole("textbox", { name: "第 1 行房号" })).toHaveValue(
    "B01",
  );
  await expect(page.getByRole("textbox", { name: "第 10 行房号" })).toHaveValue(
    "B10",
  );
  await page.getByRole("spinbutton", { name: "数量", exact: true }).fill("5");
  await page.getByRole("button", { name: "更新预览" }).click();
  await expect(
    page.getByRole("textbox", { name: /^第 \d+ 行房号$/ }),
  ).toHaveCount(5);
  await page.getByRole("button", { name: "更新预览" }).click();
  await expect(
    page.getByRole("textbox", { name: /^第 \d+ 行房号$/ }),
  ).toHaveCount(5);
  await page.getByRole("button", { name: "创建 5 套" }).click();
  await expect(page).toHaveURL(`/projects/${projectId}?tab=units`);
  expect(writes).toHaveLength(1);
  expect(writes[0].body.rows.map((r: any) => r.roomNo)).toEqual([
    "B01",
    "B02",
    "B03",
    "B04",
    "B05",
  ]);
});

test("generator can replace the list with 100 rows and clear resets the preview", async ({
  page,
}) => {
  await setup(page);
  await chooseType(page);
  await page.getByRole("button", { name: "生成预览", exact: true }).click();
  await page.getByRole("spinbutton", { name: "数量", exact: true }).fill("100");
  await page.getByRole("button", { name: "更新预览" }).click();
  await expect(
    page.getByRole("textbox", { name: /^第 \d+ 行房号$/ }),
  ).toHaveCount(100);
  await page.getByRole("button", { name: "清空列表" }).click();
  await expect(
    page.getByRole("textbox", { name: /^第 \d+ 行房号$/ }),
  ).toHaveCount(0);
  await expect(page.getByRole("button", { name: "创建 0 套" })).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "生成预览", exact: true }),
  ).toBeEnabled();
});

test("desktop and narrow layout show project title, all type fields and fixed actions", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 1744, height: 1024 });
  await setup(page, "SUPER_ADMIN", "visual");
  await page.getByRole("combobox", { name: "单位类型", exact: true }).click();
  await page.getByTitle("总统套房 · A座 / 12楼").click();
  await page.getByRole("textbox", { name: "房号前缀", exact: true }).fill("A");
  await page.getByRole("spinbutton", { name: "数量", exact: true }).fill("4");
  await page.getByRole("button", { name: "生成预览", exact: true }).click();
  await page.getByRole("button", { name: "创建 4 套" }).click();
  await expect(page.getByText("房号已存在", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "更新预览" })).toBeEnabled();
  await page.locator(".record-form-scroll").evaluate((el) => {
    el.scrollTop = 0;
  });
  await expect(
    page.getByRole("heading", { name: "批量创建单位 · 九龙城测试" }),
  ).toBeVisible();
  await expect(page.getByRole("columnheader")).toHaveText([
    "序号",
    "房号",
    "单位类型",
    "期 / 座",
    "楼层",
    "实用面积",
    "间隔",
    "月租（HKD）",
    "校验结果",
    "操作",
  ]);
  await expect(
    page.getByRole("tab", { name: "连续生成", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tabpanel")).toContainText("房号前缀");
  expect(
    await page
      .locator(".record-header-title")
      .evaluate((el) => getComputedStyle(el).fontSize),
  ).toBe("16px");
  await page.screenshot({
    path: "/tmp/lease-batch-design-desktop.png",
    clip: { x: 208, y: 0, width: 1536, height: 1024 },
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole("button", { name: "创建 4 套" })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.locator(".record-form-scroll").evaluate((el) => {
    el.scrollTop = 0;
  });
  await page.screenshot({ path: "/tmp/lease-batch-design-mobile.png" });
  expect(errors).toEqual([]);
});
