import { App, type AlertProps } from "antd";
import { useEffect } from "react";
import { errorMessage } from "../../shared/api";
import { t } from "../../shared/i18n";

// Request failures belong in transient feedback, not in the page layout.
export function RequestError({ message: cause, action }: AlertProps) {
  const { message } = App.useApp();
  const description = errorMessage(cause);
  useEffect(() => {
    if (!cause) return;
    message.error({
      key: `request-error:${description}`,
      content: (
        <span className="inline-flex items-center gap-2">
          {t(description)}
          {action}
        </span>
      ),
      duration: action ? 6 : 4,
    });
  }, [cause, description, message]);
  return null;
}
