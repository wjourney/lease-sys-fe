import type { PropsWithChildren } from "react";

export function ResourceListSurface({
  children,
  embedded = false,
}: PropsWithChildren<{ embedded?: boolean }>) {
  return (
    <div
      className={`surface list-surface rounded-[7px] border border-[#e9edf2] bg-white p-[22px] max-[760px]:p-[15px] ${embedded ? "!border-0" : ""}`}
    >
      {children}
    </div>
  );
}
