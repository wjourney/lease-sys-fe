import { makeAutoObservable, runInAction } from "mobx";
import { createContext, useContext } from "react";
import { api, clearLookupCache, errorMessage, Page, Row } from "../shared/api";
import {
  defaultSiteConfig,
  normalizeSiteConfig,
  type SiteConfig,
} from "../shared/site-config";
export class RootStore {
  site = { ...defaultSiteConfig };
  setSite(value: Partial<SiteConfig>) {
    this.site = normalizeSiteConfig(value);
  }
  async loadSite() {
    try {
      const { data } = await api.get("/site-config");
      runInAction(() => this.setSite(data));
    } catch {
      /* Keep default branding when the service is unavailable. */
    }
  }
  user: Row | null = null;
  ready = false;
  locale: "zh_CN" | "zh_TW" = "zh_CN";
  epoch = 0;
  constructor() {
    makeAutoObservable(this);
  }
  async init() {
    try {
      const { data } = await api.get("/auth/me");
      runInAction(() => {
        this.user = data;
      });
    } catch {
      runInAction(() => {
        this.user = null;
      });
    } finally {
      runInAction(() => {
        this.ready = true;
      });
    }
  }
  async login(values: Row) {
    const { data } = await api.post("/auth/login", values);
    runInAction(() => {
      this.user = data;
      this.epoch++;
      clearLookupCache();
    });
  }
  async logout() {
    try {
      await api.post("/auth/logout");
    } finally {
      this.clear();
    }
  }
  clear() {
    this.user = null;
    this.epoch++;
    clearLookupCache();
  }
  invalidate() {
    this.epoch++;
    clearLookupCache();
  }
  setAvatarUrl(url: string) {
    if (this.user) this.user.avatarUrl = url;
  }
  canRead(r: string) {
    return this.user?.capabilities.read.includes(r) ?? false;
  }
  canWrite(r: string) {
    return this.user?.capabilities.write.includes(r) ?? false;
  }
  get finance() {
    return !!this.user?.capabilities.finance;
  }
  get manageOrders() {
    return !!this.user?.capabilities.manageOrders;
  }
  setLocale(v: "zh_CN" | "zh_TW") {
    this.locale = v;
  }
}
export const root = new RootStore();
export const RootContext = createContext(root);
export const useRoot = () => useContext(RootContext);
export class ListStore {
  items: Row[] = [];
  total = 0;
  loading = false;
  error = "";
  request = 0;
  private cache = new Map<string, { at: number; data: Page }>();
  private pending = new Map<string, Promise<Page>>();
  constructor() {
    makeAutoObservable(this, { cache: false, pending: false } as any);
  }
  async load(
    resource: string,
    params: Row,
    epoch: number,
    identity: string,
    force = false,
  ) {
    const key = JSON.stringify([resource, params, epoch, identity]);
    const seq = ++this.request;
    this.loading = true;
    this.error = "";
    try {
      let data: Page;
      const cached = this.cache.get(key);
      const ttl = ["incomes", "expenses", "commissions", "invoices"].includes(
        resource,
      )
        ? 0
        : resource === "settings"
          ? 300000
          : 30000;
      if (!force && cached && Date.now() - cached.at < ttl) data = cached.data;
      else {
        let promise = this.pending.get(key);
        if (!promise) {
          promise = api
            .get<Page>("/" + resource, { params })
            .then((r) => r.data);
          this.pending.set(key, promise);
        }
        try {
          data = await promise;
          this.cache.set(key, { at: Date.now(), data });
          if (this.cache.size > 30)
            this.cache.delete(this.cache.keys().next().value!);
        } finally {
          this.pending.delete(key);
        }
      }
      if (seq === this.request)
        runInAction(() => {
          this.items = data.items;
          this.total = data.total;
        });
    } catch (e: any) {
      if (seq === this.request)
        runInAction(() => {
          this.error = errorMessage(e);
        });
    } finally {
      if (seq === this.request)
        runInAction(() => {
          this.loading = false;
        });
    }
  }
}
