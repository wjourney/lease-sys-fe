export const defaultSiteConfig = {
  siteName: "SUPREME BAY",
  subtitle: "租赁管理系统",
  browserTitle: "SUPREME BAY · 租赁管理系统",
  footer: "SUPREME BAY · 租赁管理系统",
  logoUrl: null as string | null,
  revision: 0,
};
export type SiteConfig = typeof defaultSiteConfig;
export function normalizeSiteConfig(
  value: Partial<SiteConfig> = {},
): SiteConfig {
  return {
    ...defaultSiteConfig,
    ...Object.fromEntries(
      ["siteName", "subtitle", "browserTitle", "footer"].map((key) => [
        key,
        typeof value[key as keyof SiteConfig] === "string"
          ? value[key as keyof SiteConfig]
          : defaultSiteConfig[key as keyof SiteConfig],
      ]),
    ),
    logoUrl: typeof value.logoUrl === "string" ? value.logoUrl : null,
    revision: typeof value.revision === "number" ? value.revision : 0,
  };
}
