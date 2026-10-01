import { InfoCircleOutlined } from "@ant-design/icons";
import type { ReactNode } from "react";

export function AccountActionNote({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-md border border-[#dfe7f0] bg-[#f5f8fc] px-3 py-2.5 text-[13px] leading-5 text-[#53647d]">
      <InfoCircleOutlined
        className="mt-0.5 shrink-0 text-[#7186a2]"
        aria-hidden
      />
      <span>{children}</span>
    </div>
  );
}
