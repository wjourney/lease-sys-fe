import { observer } from "mobx-react-lite";
import { t } from "../../../shared/i18n";
import { Brand } from "../../../shared/ui";

export const LoginVisual = observer(function LoginVisual({}: {}) {
  return (
    <section className="relative min-h-screen overflow-hidden bg-[#15243f] max-[760px]:hidden [&_.brand]:!h-auto [&_.brand]:!px-12 [&_.brand]:!py-[35px]">
      <Brand />
      <div className="relative z-[1] mx-[12%] mt-[100px] [&_h1]:my-[25px] [&_h1]:text-[43px] [&_h1]:font-normal [&_h1]:leading-[1.55] [&_h1]:tracking-[3px] [&_h1]:text-[#f5f6f8] [&_p]:text-[13px] [&_p]:tracking-[1px] [&_p]:text-[#9aaac0]">
        <span className="text-[10px] tracking-[3px] text-[#a88d64]">
          PROPERTY · PEOPLE · POSSIBILITIES
        </span>
        <h1>
          {t("连接空间")}
          <br />
          {t("与更好的生活。")}
        </h1>
        <p>{t("从房源到租约，让每一项业务清晰有序。")}</p>
      </div>
      <div className="absolute -right-[30px] -bottom-[60px] left-[15%] flex h-[280px] skew-y-[-10deg] items-end gap-3.5 opacity-20 [&_i]:block [&_i]:h-[70%] [&_i]:w-[24%] [&_i]:border-t [&_i]:border-l [&_i]:border-[#98a5b7] [&_i]:bg-[linear-gradient(100deg,#69809d,#14243d)] [&_i:nth-child(2)]:h-full [&_i:nth-child(3)]:h-[90%] [&_i:nth-child(4)]:h-[120%]">
        <i />
        <i />
        <i />
        <i />
      </div>
      <div className="absolute bottom-8 left-12 z-[1] text-[10px] tracking-[1px] text-[#8b9cb5]">
        {t("SUPREME BAY · 租赁管理平台")}
      </div>
    </section>
  );
});
