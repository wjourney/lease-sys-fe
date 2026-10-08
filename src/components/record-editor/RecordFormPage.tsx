import { ArrowLeftOutlined } from "@ant-design/icons";
import { Button } from "antd";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { t } from "../../shared/i18n";

export function RecordFormPage({
  title,
  onBack,
  saving = false,
  contentLabel,
  footer,
  children,
}: {
  title: string;
  onBack: () => void;
  saving?: boolean;
  contentLabel?: string;
  footer?: ReactNode;
  children: ReactNode;
}) {
  const host = document.getElementById("record-detail-header");
  const heading = (
    <div className="flex min-w-0 items-center gap-3">
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        aria-label={t("返回上级")}
        onClick={onBack}
        disabled={saving}
      />
      <h1 className="record-header-title" title={t(title)}>
        {t(title)}
      </h1>
    </div>
  );
  return (
    <div className="record-form-page">
      {host ? createPortal(heading, host) : heading}
      <div
        className="record-form-scroll"
        tabIndex={0}
        aria-label={t(contentLabel ?? title + "表单")}
      >
        {children}
      </div>
      {footer && <div className="record-form-actions">{footer}</div>}
    </div>
  );
}
