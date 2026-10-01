import { root } from "../stores/root";
let convert: ((value: string) => string) | undefined;
let pending: Promise<void> | undefined;
export async function loadTraditional() {
  if (convert) return;
  pending ??= import("opencc-js/cn2t").then((OpenCC) => {
    convert = OpenCC.Converter({ from: "cn", to: "tw" });
  });
  await pending;
}
/** Only translates presentation strings; stored records and API values are unchanged. */
export function t<T>(value: T): T {
  return (
    typeof value === "string" && root.locale === "zh_TW" && convert
      ? convert(value)
      : value
  ) as T;
}
