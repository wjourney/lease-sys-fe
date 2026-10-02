import { SearchOutlined } from "@ant-design/icons";
import { Button, Input, Select } from "antd";
import { observer } from "mobx-react-lite";
import type { ReactNode } from "react";
import { SetURLSearchParams } from "react-router-dom";
import { t } from "../../shared/i18n";
export const ResourceFilters = observer(function ResourceFilters({
  q,
  setQ,
  searchNow,
  resource,
  status,
  setStatus,
  embedded,
  setSearch,
  setLocalPage,
  actions,
  extraFilters,
  onResetExtras,
  hideStatus = false,
}: {
  q: string;
  setQ: (value: string) => void;
  searchNow: () => void;
  resource: string;
  status: string | undefined;
  setStatus: (value: string | undefined) => void;
  embedded: boolean;
  setSearch: SetURLSearchParams;
  setLocalPage: (value: number) => void;
  actions?: ReactNode;
  extraFilters?: ReactNode;
  onResetExtras?: () => void;
  hideStatus?: boolean;
}) {
  return (
    <div
      className={`mb-6 flex items-center gap-4 max-[760px]:flex-wrap ${extraFilters ? "max-[1500px]:flex-wrap" : ""}`}
    >
      <div
        className={`flex min-w-0 flex-1 items-center gap-2.5 max-[760px]:w-full max-[760px]:max-w-none [&_label]:shrink-0 [&_label]:whitespace-nowrap [&_label]:text-[11px] [&_label]:text-[#718095] [&_.ant-input-affix-wrapper]:min-w-0 [&_.ant-input-affix-wrapper]:flex-1 ${hideStatus ? "max-w-[480px]" : extraFilters ? "max-w-[360px]" : "max-w-[450px]"}`}
      >
        <label>{t("关键词")}</label>
        <Input
          allowClear
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onPressEnter={searchNow}
          prefix={<SearchOutlined aria-hidden={true} />}
          placeholder={t("搜索编号、名称或关键词")}
        />
      </div>
      {!hideStatus &&
        !["materials", "settings", "fund-accounts"].includes(resource) && (
          <div
            className={`flex min-w-0 items-center gap-2.5 max-[760px]:w-full max-[760px]:flex-auto [&_label]:shrink-0 [&_label]:whitespace-nowrap [&_label]:text-[11px] [&_label]:text-[#718095] [&_.ant-input-affix-wrapper]:min-w-0 [&_.ant-input-affix-wrapper]:flex-1 [&_.ant-select]:min-w-0 [&_.ant-select]:flex-1 ${extraFilters ? "w-[185px]" : "w-[250px]"}`}
          >
            <label>{t("状态")}</label>
            <Select
              allowClear
              placeholder={t("全部状态")}
              value={status}
              onChange={setStatus}
              options={Object.entries(
                resource === "units"
                  ? {
                      AVAILABLE: "可租",
                      LOCKED: "已锁定",
                      OCCUPIED: "出租中",
                    }
                  : resource === "orders"
                    ? {
                        PENDING: "待确认",
                        ACTIVE: "租赁中",
                        COMPLETED: "已完成",
                        CLOSED: "已关闭",
                      }
                    : resource === "incomes"
                      ? {
                          OPEN: "待收款",
                          PARTIAL: "部分收款",
                          PAID: "已收齐",
                        }
                      : resource === "expenses"
                        ? {
                            UNPAID: "待付款",
                            PAID: "已付款",
                          }
                        : resource === "invoices"
                          ? {
                              ACTIVE: "有效",
                              VOID: "已作废",
                            }
                          : {
                              ACTIVE: "启用",
                              DISABLED: "停用",
                            },
              ).map(([value, label]) => ({
                value,
                label: t(label),
              }))}
            />
          </div>
        )}
      {extraFilters}
      {actions && (
        <div className="flex shrink-0 flex-wrap gap-2 max-[760px]:w-full">
          {actions}
        </div>
      )}
      <div className="ml-auto flex gap-[9px] max-[760px]:ml-0">
        <Button
          onClick={() => {
            setQ("");
            setStatus(undefined);
            onResetExtras?.();
            if (!embedded) setSearch({});
            else setLocalPage(1);
          }}
        >
          {t("重置")}
        </Button>
        <Button type="primary" onClick={searchNow}>
          {t("查询")}
        </Button>
      </div>
    </div>
  );
});
