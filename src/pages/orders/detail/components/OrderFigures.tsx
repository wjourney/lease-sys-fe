import type { ReactNode } from "react";
import { InfoCircleOutlined } from "@ant-design/icons";
import { Tooltip } from "antd";
import { t } from "../../../../shared/i18n";

export function OrderFigures({
  items,
}: {
  items: {
    label: string;
    value: ReactNode;
    hint?: string;
    emphasis?: boolean;
  }[];
}) {
  return (
    <div
      className="order-figures grid gap-y-4 border-b border-[#edf0f4] pb-5"
      style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
    >
      {items.map(({ label, value, hint, emphasis }) => (
        <div
          key={label}
          className="min-w-0 border-l border-[#edf0f4] px-5 first:border-l-0 first:pl-0"
        >
          <div className="mb-2 flex items-center gap-2 text-sm text-[#78869a]">
            {t(label)}
            {hint && (
              <Tooltip title={t(hint)}>
                <InfoCircleOutlined aria-label={t(hint)} />
              </Tooltip>
            )}
          </div>
          <strong
            className={`block break-words text-xl font-semibold tabular-nums ${emphasis ? "text-[#b66a16]" : "text-[#263650]"}`}
          >
            {value}
          </strong>
        </div>
      ))}
    </div>
  );
}
