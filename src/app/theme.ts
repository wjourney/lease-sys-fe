import { ThemeConfig } from "antd";

const brandNavy = "#15243f";

export const theme: ThemeConfig = {
  token: {
    colorPrimary: brandNavy,
    colorInfo: brandNavy,
    colorSuccess: "#389780",
    colorWarning: "#c08b39",
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
