import { QuestionCircleOutlined } from "@ant-design/icons";
import { DatePicker, Form, Input, Switch, Tooltip } from "antd";
import { t } from "../../../shared/i18n";
import { ProjectCreateSection } from "./ProjectCreateSection";

export function ProjectPropertyFields({
  unitCount = 0,
}: {
  unitCount?: number;
}) {
  return (
    <ProjectCreateSection title="物业与配套">
      <Form.Item label={t("单位总数")}>
        <Input
          disabled
          readOnly
          value={t(`由具体单位自动统计：${unitCount}`)}
        />
      </Form.Item>
      <Form.Item name="areaRange" label={t("面积范围（㎡）")}>
        <Input placeholder={t("请输入面积范围")} />
      </Form.Item>
      <Form.Item name="unitInterval" label={t("单位间隔")}>
        <Input placeholder={t("请输入间隔范围")} />
      </Form.Item>
      <Form.Item name="managementFee" label={t("管理费")}>
        <Input placeholder={t("填写金额及计费单位")} />
      </Form.Item>
      <Form.Item name="landLeaseEndDate" label={t("地契年期")}>
        <DatePicker placeholder={t("请选择到期日")} />
      </Form.Item>
      <Form.Item name="lawyerFirm" label={t("律师楼")}>
        <Input placeholder={t("填写律师楼名称")} />
      </Form.Item>
      <Form.Item name="nearbySchools" label={t("周边学校")}>
        <Input placeholder={t("填写学校及距离")} />
      </Form.Item>
      <Form.Item
        name="website"
        label={t("网址")}
        rules={[{ type: "url", message: "请输入有效网址" }]}
      >
        <Input placeholder="https://" />
      </Form.Item>
      <Form.Item name="salesOffice" label={t("售楼处")}>
        <Input placeholder={t("地址 / 联系电话")} />
      </Form.Item>
      <Form.Item
        name="description"
        label={t("详细资料介绍")}
        className="col-span-full"
      >
        <Input.TextArea
          autoSize={{ minRows: 1, maxRows: 4 }}
          placeholder={t("填写详细介绍及自定义信息")}
        />
      </Form.Item>
      <div className="col-span-full flex items-center gap-2.5 text-sm text-[#74829a] [&_.ant-switch]:ml-3">
        <span>{t("允许销售查看具体租金")}</span>
        <Tooltip title={t("开启后销售人员可查看项目下单位的具体租金")}>
          <QuestionCircleOutlined aria-label={t("说明")} />
        </Tooltip>
        <Form.Item name="salesCanViewExactRent" valuePropName="checked" noStyle>
          <Switch />
        </Form.Item>
      </div>
    </ProjectCreateSection>
  );
}
