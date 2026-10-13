import { describe, expect, it } from "vitest";
import { operationChangeTexts } from "./operation-change-text";
import { OrderConfig } from "../pages/orders/orders.config";
import { UserConfig } from "../pages/users/users.config";

describe("operation change descriptions", () => {
  it("shows meaningful order changes without exposing internal identifiers", () => {
    expect(
      operationChangeTexts(
        {
          monthlyRent: { before: "13000", after: "15000" },
          status: { before: "IN_PROGRESS", after: "ENDED" },
          unitId: {
            before: "f210a668-0b58-488c-ab37-9fb35e9b14c6",
            after: "247aee6f-53f3-4af1-bc7f-52f59c47960d",
          },
          unitSnapshot: { before: { room: "101" }, after: { room: "102" } },
          updatedAt: { before: "2026-10-12", after: "2026-10-13" },
        },
        OrderConfig.fields,
      ),
    ).toEqual([
      "成交月租由HK$13,000.00改为HK$15,000.00",
      "状态由进行中改为已结束",
      "调整了租赁单位",
    ]);
  });

  it("translates roles and summarizes structured changes", () => {
    expect(
      operationChangeTexts(
        {
          role: { before: "SALES", after: "FINANCE" },
          branches: { before: [{ code: "A" }], after: [{ code: "B" }] },
          name: { before: "张三", after: "李四" },
        },
        [...UserConfig.fields, { key: "branches", label: "分行配置" }],
      ),
    ).toEqual([
      "角色由销售员工改为内部财务",
      "更新了分行配置",
      "姓名由张三改为李四",
    ]);
  });

  it("hides unknown enum values, UUIDs and unrecognized fields", () => {
    expect(
      operationChangeTexts(
        {
          status: { before: "CUSTOM_INTERNAL_STATE", after: "ACTIVE" },
          name: { before: null, after: "演示项目" },
          secretField: { before: "x", after: "y" },
        },
        [{ key: "name", label: "项目名称" }],
      ),
    ).toEqual(["调整了状态", "设置项目名称为演示项目"]);
  });
});
