import { expect, test } from "@playwright/test";

const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/2J0AAAAASUVORK5CYII=",
  "base64",
);

test("personal center previews and saves a new avatar", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("登录账号").fill("admin");
  await page
    .getByLabel("密码", { exact: true })
    .fill(process.env.SEED_PASSWORD || "ChangeMe123!");
  await page.getByRole("button", { name: "登录系统" }).click();
  await page.waitForURL("**/projects");

  await page.getByRole("button", { name: "打开个人中心" }).click();
  const dialog = page.getByRole("dialog", { name: "个人中心" });
  await expect(dialog.getByText("当前账号编号")).toHaveCount(0);
  await expect(dialog.getByText("注册日期")).toHaveCount(0);
  await expect(dialog.getByText("账号有效期")).toBeVisible();

  const avatarControl = dialog.locator(
    'label:has(input[aria-label="更换头像"])',
  );
  await avatarControl.hover();
  await expect(avatarControl.getByText("修改")).toHaveCSS("opacity", "1");
  await dialog.getByLabel("更换头像").setInputFiles({
    name: "avatar.png",
    mimeType: "image/png",
    buffer: png,
  });
  await expect(dialog.getByText("预览头像：")).toBeVisible();
  await expect(dialog.getByRole("button", { name: "保存头像" })).toBeVisible();

  const uploaded = page.waitForResponse(
    (response) =>
      response.url().includes("/api/v1/users/") &&
      response.url().endsWith("/avatar") &&
      response.request().method() === "POST",
  );
  await dialog.getByRole("button", { name: "保存头像" }).click();
  expect((await uploaded).status()).toBe(201);
  await expect(dialog.getByRole("button", { name: "保存头像" })).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "打开个人中心" }).locator("img"),
  ).toHaveAttribute("src", /\/avatar\?v=/);
});
