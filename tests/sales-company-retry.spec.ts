import { test, expect } from "@playwright/test";

test("company upload retry saves revised bank details and removes prior uploaded image", async ({
  page,
}) => {
  const writes: { method: string; path: string; body: any }[] = [];
  let uploads = 0;
  await page.route("**/api/v1/**", async (route) => {
    const req = route.request();
    const path = new URL(req.url()).pathname.replace("/api/v1", "");
    let data: any = { items: [], total: 0 };
    if (path === "/auth/me")
      data = {
        id: "admin",
        role: "SUPER_ADMIN",
        name: "管理员",
        capabilities: {
          read: ["sales-companies", "materials"],
          write: ["sales-companies", "materials"],
        },
      };
    if (path === "/site-config") data = {};
    if (req.method() !== "GET") {
      const body = path === "/materials/upload" ? null : req.postDataJSON();
      writes.push({ method: req.method(), path, body });
      if (path === "/sales-companies")
        data = { ...body, id: "company", revision: 1 };
      if (path === "/sales-companies/company")
        data = { ...body, id: "company", revision: 2 };
      if (path === "/materials/upload") {
        uploads++;
        if (uploads === 2)
          return route.fulfill({
            status: 500,
            json: { message: "upload failed" },
          });
        data = { id: `image-${uploads}` };
      }
    }
    await route.fulfill({ json: data });
  });
  await page.goto("/sales-companies");
  await page.getByRole("button", { name: "新建销售公司" }).click();
  await page.getByPlaceholder("请输入公司中文名称").fill("图片重试公司");
  await page.getByPlaceholder("请输入银行账号").fill("12345");
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=",
    "base64",
  );
  await page.locator('input[type="file"]').setInputFiles([
    { name: "first.png", mimeType: "image/png", buffer: png },
    { name: "second.png", mimeType: "image/png", buffer: png },
  ]);
  await page.getByRole("button", { name: "创建公司", exact: true }).click();
  await expect(page.getByText(/图片处理失败/)).toBeVisible();
  await page.getByPlaceholder("请输入银行账号").fill("999999");
  await page
    .getByRole("button", { name: "删除 first.png", exact: true })
    .click();
  await page
    .getByRole("button", { name: "保存并重试图片", exact: true })
    .click();
  await expect(page.locator(".ant-drawer-content")).toHaveCount(0);
  expect(writes.filter((w) => w.path === "/sales-companies")).toHaveLength(1);
  expect(
    writes.find(
      (w) => w.method === "PATCH" && w.path === "/sales-companies/company",
    )?.body,
  ).toMatchObject({ payoutAccountNo: "999999", revision: 1 });
  expect(
    writes.some(
      (w) => w.method === "DELETE" && w.path === "/materials/image-1",
    ),
  ).toBe(true);
  expect(
    writes.findLast((w) => w.path === "/sales-companies/company/images/order")
      ?.body,
  ).toEqual({ ids: ["image-3"] });
});
