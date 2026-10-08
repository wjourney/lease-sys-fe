import type { MouseEvent } from "react";

// Open the detail only when the click is on non-interactive row content.
export function shouldOpenRow(event: MouseEvent<HTMLElement>) {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  )
    return false;

  const target = event.target;
  return !(
    target instanceof Element &&
    target.closest(
      'a, button, input, select, textarea, label, .ant-table-selection-column, .ant-drawer, .ant-select-dropdown, .ant-picker-dropdown, .ant-dropdown, [role="button"], [role="link"], [data-row-action]',
    )
  );
}
