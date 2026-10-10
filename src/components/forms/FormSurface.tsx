import { ArrowLeftOutlined } from "@ant-design/icons";
import { Button, Drawer } from "antd";
import { useEffect, type ReactNode } from "react";
import { t } from "../../shared/i18n";

/** An action can occupy its existing panel or open a standalone drawer. */
export function FormSurface({
  title,
  width,
  saving,
  presentation = "drawer",
  onSavingChange,
  onClose,
  footer,
  children,
}: {
  title: string;
  width: number;
  saving: boolean;
  presentation?: "drawer" | "inline";
  onSavingChange?: (saving: boolean) => void;
  onClose: () => void;
  footer: ReactNode;
  children: ReactNode;
}) {
  useEffect(() => onSavingChange?.(saving), [saving, onSavingChange]);
  useEffect(() => () => onSavingChange?.(false), [onSavingChange]);
  if (presentation === "inline")
    return (
      <section>
        <div className="mb-5 flex items-center gap-3">
          <Button
            icon={<ArrowLeftOutlined />}
            disabled={saving}
            onClick={onClose}
          >
            {t("返回押金详情")}
          </Button>
          <h3 className="m-0 text-base font-semibold">{t(title)}</h3>
        </div>
        <div className="mx-auto max-w-[760px]">
          {children}
          {footer}
        </div>
      </section>
    );
  return (
    <Drawer
      open
      title={t(title)}
      width={width}
      onClose={() => !saving && onClose()}
      closable={!saving}
      maskClosable={!saving}
      keyboard={!saving}
      footer={footer}
    >
      {children}
    </Drawer>
  );
}
