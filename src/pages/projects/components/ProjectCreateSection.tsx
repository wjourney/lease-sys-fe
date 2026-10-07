import type { ReactNode } from "react";
import { t } from "../../../shared/i18n";

const gridClassName =
  "grid grid-cols-3 gap-x-5 gap-y-1 max-[850px]:grid-cols-2 max-[560px]:grid-cols-1 " +
  "[&_.ant-form-item]:min-w-0 [&_.ant-form-item-label_label]:!text-sm " +
  "[&_.ant-form-item-label_label]:!text-[#73819a] " +
  "[&_input.ant-input]:!h-10 [&_.ant-input]:!w-full " +
  "[&_.ant-input-number]:!h-10 [&_.ant-input-number]:!w-full " +
  "[&_.ant-input-number-input]:!h-10 " +
  "[&_.ant-picker]:!h-10 [&_.ant-picker]:!w-full " +
  "[&_.ant-select]:!h-10 [&_.ant-select]:!w-full";

export function ProjectCreateSection({
  title,
  columns = 2,
  children,
  footer,
}: {
  title: string;
  columns?: 2 | 3;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-[#e0e6ed] bg-white p-6 max-[640px]:p-4">
      <h2 className="mb-4 text-sm font-semibold text-[#25334a]">{t(title)}</h2>
      <div
        className={`${gridClassName} ${columns === 2 ? "!grid-cols-2 max-[560px]:!grid-cols-1" : ""}`}
      >
        {children}
      </div>
      {footer}
    </section>
  );
}
