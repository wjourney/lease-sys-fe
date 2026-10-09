import { ThemeConfig } from "antd";

const brandNavy = "#15243f";

export const theme: ThemeConfig = {
  token: {
    colorPrimary: brandNavy,
    colorInfo: brandNavy,
    colorInfoBg: "#f2f6fb",
    colorInfoBorder: "#d9e4f1",
    colorInfoText: "#304e70",
    colorSuccess: "#389780",
    colorSuccessBg: "#edf8f2",
    colorSuccessBorder: "#c7ead7",
    colorSuccessText: "#276b4f",
    colorWarning: "#c08b39",
    colorWarningBg: "#fff8e9",
    colorWarningBorder: "#f5dfaf",
    colorWarningText: "#805c1b",
    colorErrorBg: "#fff2f0",
    colorErrorBorder: "#ffd8d2",
    colorErrorText: "#a61d24",
    colorBgLayout: "#f5f6f8",
    colorText: "#233047",
    colorTextSecondary: "#8590a1",
    controlItemBgActive: "#e9eff6",
    controlItemBgHover: "#f3f6fa",
    borderRadius: 5,
    fontSize: 13,
    fontFamily:
      'Inter, -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif',
    controlHeight: 34,
  },
  components: {
    Table: {
      headerBg: "#f7f8fa",
      headerColor: "#7b8799",
      rowSelectedBg: "#eef4fb",
      rowSelectedHoverBg: "#e4eef9",
      cellPaddingBlock: 15,
    },
    Menu: {
      darkItemBg: brandNavy,
      darkSubMenuItemBg: brandNavy,
      darkItemSelectedBg: "#2b4265",
      darkItemColor: "#aab9cf",
      itemHeight: 43,
    },
    Card: {
      paddingLG: 22,
    },
    Tabs: {
      horizontalItemGutter: 30,
    },
  },
};
