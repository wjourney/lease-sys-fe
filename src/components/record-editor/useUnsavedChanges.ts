import { App } from "antd";
import { useCallback, useEffect, useRef } from "react";
import { useBeforeUnload, useBlocker } from "react-router-dom";
import { t } from "../../shared/i18n";

export function useUnsavedChanges(saving: boolean) {
  const { modal, message } = App.useApp();
  const dirty = useRef(false);
  const leaving = useRef(false);
  const blocker = useBlocker(
    () => !leaving.current && (dirty.current || saving),
  );
  useBeforeUnload(
    useCallback(
      (event) => {
        if (!leaving.current && (dirty.current || saving)) {
          event.preventDefault();
          event.returnValue = "";
        }
      },
      [saving],
    ),
  );
  useEffect(() => {
    if (blocker.state !== "blocked") return;
    if (saving) {
      message.info(t("正在保存，请稍候再离开"));
      blocker.reset();
      return;
    }
    const dialog = modal.confirm({
      title: t("放弃未保存的修改？"),
      content: t("当前填写的内容尚未全部保存，离开后将丢失未保存的修改。"),
      okText: t("放弃修改"),
      cancelText: t("继续填写"),
      onOk: () => blocker.proceed(),
      onCancel: () => blocker.reset(),
    });
    return () => dialog.destroy();
  }, [blocker, saving, modal, message]);
  return {
    markDirty: () => {
      dirty.current = true;
    },
    allowLeave: () => {
      leaving.current = true;
    },
  };
}
