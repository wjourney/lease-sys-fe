import { test, expect } from "@playwright/test";

test("older backend shows a service update hint and retry recovers without submitting", async ({
  page,
}) => {
  let available = false;
  await page.route("**/api/v1/**", async (route) => {
    expect(route.request().method()).toBe("GET");
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/auth/me")) {
      return route.fulfill({
        json: {
          id: "admin",
          name: "管理员",
          role: "SUPER_ADMIN",
          capabilities: { read: ["settings"], write: ["settings"] },
        },
      });
    }
    if (path.endsWith("/settings/website") && !available) {
      return route.fulfill({
        status: 400,
        json: { code: "BUSINESS", message: "无效记录 ID" },
      });
    }
    await route.fulfill({ json: {} });
  });
  await page.goto("/settings");
  await expect(
    page.getByText("网站配置服务尚未更新，请联系管理员更新服务后重试", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByText("提交的信息有误，请检查后重试")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "保存配置" })).toBeDisabled();
  available = true;
  await page.getByRole("button", { name: "重新加载" }).click();
  await expect(page.getByLabel("网站名称", { exact: true })).toHaveValue(
    "SUPREME BAY",
  );
  await expect(page.getByRole("button", { name: "保存配置" })).toBeEnabled();
});

test("website branding saves, persists and appears on login; logo can be removed", async ({
  page,
}) => {
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aWZkAAAAASUVORK5CYII=",
    "base64",
  );
  let site: any = {
    siteName: "SUPREME BAY",
    subtitle: "租赁管理系统",
    browserTitle: "SUPREME BAY · 租赁管理系统",
    footer: "SUPREME BAY · 租赁管理系统",
    revision: 0,
    logoUrl: null,
  };
  let signedIn = true;
  let writes = 0;
  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname.replace("/api/v1", "");
    if (path === "/site-config/logo")
      return route.fulfill({ contentType: "image/png", body: png });
    let data: any = { items: [], total: 0 };
    if (path === "/auth/me") {
      if (!signedIn)
        return route.fulfill({
          status: 401,
          json: { message: "unauthenticated" },
        });
      data = {
        id: "admin",
        name: "管理员",
        role: "SUPER_ADMIN",
        capabilities: {
          read: ["settings", "fund-accounts"],
          write: ["settings"],
          manageOrders: true,
        },
      };
    }
    if (path === "/settings/website" && request.method() === "POST") {
      writes++;
      expect(request.headers()["content-type"]).toContain(
        "multipart/form-data",
      );
      const body = request.postDataBuffer()!.toString();
      const match = body.match(/name="payload"\r\n\r\n([^\r]+)/);
      expect(match).toBeTruthy();
      const values = JSON.parse(match![1]);
      expect(values.revision).toBe(site.revision);
      expect(values.siteName).toBe("海湾物业");
      expect(body.includes('filename="brand.png"')).toBe(writes === 1);
      const { removeLogo, ...fields } = values;
      site = {
        ...fields,
        revision: site.revision + 1,
        logoUrl: removeLogo ? null : "/api/v1/site-config/logo?v=1",
      };
    } else expect(request.method()).toBe("GET");
    if (path === "/site-config" || path === "/settings/website") data = site;
    await route.fulfill({ json: data });
  });
  await page.goto("/settings");
  await page.getByLabel("网站名称", { exact: true }).fill("海湾物业");
  await page.getByLabel("网站副标题", { exact: true }).fill("物业租赁平台");
  await page.getByLabel("浏览器标题", { exact: true }).fill("海湾物业管理");
  await page
    .getByLabel("页脚文案", { exact: true })
    .fill("海湾物业 · 服务每一天");
  await page
    .locator('input[type="file"]')
    .setInputFiles({ name: "brand.png", mimeType: "image/png", buffer: png });
  await expect(page.getByAltText("网站 Logo 预览")).toHaveAttribute(
    "src",
    /^blob:/,
  );
  await page.getByRole("button", { name: "保存配置" }).click();
  await expect(page.getByText("网站配置已保存", { exact: true })).toBeVisible();
  await expect(page).toHaveTitle("海湾物业管理");
  await expect(page.locator(".brand")).toContainText("海湾物业");
  await expect(page.locator("footer")).toContainText("海湾物业 · 服务每一天");
  await page.reload();
  await expect(page.getByLabel("网站名称", { exact: true })).toHaveValue(
    "海湾物业",
  );
  await expect(page.getByAltText("网站 Logo 预览")).toHaveAttribute(
    "src",
    "/api/v1/site-config/logo?v=1",
  );
  await page.screenshot({
    path: "/tmp/lease-website-settings.png",
    animations: "disabled",
  });
  await page.getByRole("button", { name: /移\s*除/ }).click();
  await page.getByRole("button", { name: "保存配置" }).click();
  await expect(page.getByText("网站配置已保存", { exact: true })).toBeVisible();
  await expect(page.locator(".brand img")).toHaveCount(0);
  expect(writes).toBe(2);
  signedIn = false;
  await page.goto("/login");
  await expect(page).toHaveTitle("海湾物业管理");
  await expect(page.locator(".brand")).toContainText("海湾物业");
});

test("non-admin cannot access website settings", async ({ page }) => {
  await page.route("**/api/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    expect(route.request().method()).toBe("GET");
    expect(path).not.toContain("/settings/website");
    await route.fulfill({
      json: path.endsWith("/auth/me")
        ? {
            id: "finance",
            name: "财务",
            role: "FINANCE",
            capabilities: { read: ["fund-accounts"], write: ["fund-accounts"] },
          }
        : {},
    });
  });
  await page.goto("/settings");
  await expect(page.getByText("当前账号无权修改网站配置")).toBeVisible();
  await expect(page.getByRole("button", { name: "保存配置" })).toHaveCount(0);
});
