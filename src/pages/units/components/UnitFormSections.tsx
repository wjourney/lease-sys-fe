import { Form, Input, InputNumber, Select } from "antd";
import type { UploadFile } from "antd";
import { t } from "../../../shared/i18n";
import { UnitMediaCategory, UnitMediaField } from "./UnitMediaField";

type Option = { value: string; label: string };
type Media = Record<UnitMediaCategory, UploadFile[]>;

const field =
  "min-w-0 [&_.ant-input]:!h-10 [&_.ant-input-number]:!w-full [&_.ant-input-number]:!h-10 [&_.ant-input-number-input]:!h-10 [&_.ant-select]:!h-10";
const section = "rounded-lg bg-[#f5f6f8] p-5 max-[640px]:p-4";
const grid =
  "grid grid-cols-3 gap-x-5 gap-y-1 max-[850px]:grid-cols-2 max-[560px]:grid-cols-1";
const required = [{ required: true, message: t("请填写此项") }];

export function UnitFormSections({
  projects,
  unitTypes,
  projectLocked,
  media,
  onMediaChange,
}: {
  projects: Option[];
  unitTypes: Option[];
  projectLocked: boolean;
  media: Media;
  onMediaChange: (category: UnitMediaCategory, files: UploadFile[]) => void;
}) {
  return (
    <div className="space-y-4 [&_.ant-form-item-label_label]:!text-xs [&_.ant-form-item-label_label]:!text-[#73819a]">
      <section className={section}>
        <h2 className="mb-4 text-sm font-semibold text-[#25334a]">
          {t("单位定位")}
        </h2>
        <div className={grid}>
          <Form.Item
            name="projectId"
            label={t("项目")}
            rules={required}
            className={field}
          >
            <Select
              options={projects}
              disabled={projectLocked}
              placeholder={t("请选择项目")}
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>
          <Form.Item
            name="unitNo"
            label={t("单位名称 / 编号")}
            rules={required}
            className={field}
          >
            <Input placeholder={t("例如 A座1201单位")} />
          </Form.Item>
          <Form.Item
            name="unitTypeCode"
            label={t("单位类型")}
            rules={required}
            className={field}
          >
            <Select options={unitTypes} placeholder={t("请选择单位类型")} />
          </Form.Item>
          <Form.Item
            name={["extra", "phase"]}
            label={t("期 / 座")}
            rules={required}
            className={field}
          >
            <Input placeholder={t("例如 1期 / A座")} />
          </Form.Item>
          <Form.Item
            name="floor"
            label={t("楼层")}
            rules={required}
            className={field}
          >
            <Input placeholder={t("例如 12楼")} />
          </Form.Item>
          <Form.Item
            name="roomNo"
            label={t("室号")}
            rules={required}
            className={field}
          >
            <Input placeholder={t("例如 1201")} />
          </Form.Item>
        </div>
      </section>

      <section className={section}>
        <h2 className="mb-4 text-sm font-semibold text-[#25334a]">
          {t("物业属性")}
        </h2>
        <div className={grid}>
          <Form.Item
            name="area"
            label={t("实用面积（㎡）")}
            rules={required}
            className={field}
          >
            <InputNumber min={0.01} precision={2} placeholder="38" />
          </Form.Item>
          <Form.Item
            name="layout"
            label={t("间隔")}
            rules={required}
            className={field}
          >
            <Input placeholder={t("例如 1室1厅")} />
          </Form.Item>
          <Form.Item name="decoration" label={t("装修情况")} className={field}>
            <Select
              options={["毛坯", "简装修", "精装修", "豪华装修"].map(
                (value) => ({ value, label: t(value) }),
              )}
              placeholder={t("请选择")}
            />
          </Form.Item>
          <Form.Item
            name={["extra", "age"]}
            label={t("楼龄")}
            className={field}
          >
            <Input placeholder={t("随项目资料")} />
          </Form.Item>
          <Form.Item
            name={["extra", "currentState"]}
            label={t("现况")}
            className={field}
          >
            <Select
              options={["可租", "已锁定", "出租中"].map((value) => ({
                value,
                label: t(value),
              }))}
            />
          </Form.Item>
          <Form.Item
            name={["extra", "usage"]}
            label={t("用途")}
            className={field}
          >
            <Select
              options={["住宅", "商业", "办公", "其他"].map((value) => ({
                value,
                label: t(value),
              }))}
            />
          </Form.Item>
        </div>
      </section>

      <section className={section}>
        <h2 className="mb-4 text-sm font-semibold text-[#25334a]">
          {t("价格与租赁条件")}
        </h2>
        <div className={grid}>
          <Form.Item
            name={["extra", "askingRent"]}
            label={t("定价（HKD）")}
            className={field}
          >
            <InputNumber min={0} precision={2} placeholder="5,800" />
          </Form.Item>
          <Form.Item
            name={["extra", "discountOne"]}
            label={t("折扣方案一 / 价格")}
            className={field}
          >
            <Input placeholder={t("标准优惠 / 5,600")} />
          </Form.Item>
          <Form.Item
            name={["extra", "discountTwo"]}
            label={t("折扣方案二 / 价格")}
            className={field}
          >
            <Input placeholder={t("限时优惠 / 5,500")} />
          </Form.Item>
          <Form.Item
            name="referenceRent"
            label={t("具体参考月租（HKD）")}
            dependencies={["minRent", "maxRent"]}
            rules={[
              ...required,
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const minRent = getFieldValue("minRent");
                  const maxRent = getFieldValue("maxRent");
                  if (
                    value == null ||
                    minRent == null ||
                    maxRent == null ||
                    (Number(value) >= Number(minRent) &&
                      Number(value) <= Number(maxRent))
                  )
                    return Promise.resolve();
                  return Promise.reject(
                    new Error(t("参考月租须介于最低价和最高价之间")),
                  );
                },
              }),
            ]}
            className={field}
          >
            <InputNumber min={0} precision={2} placeholder="5,800" />
          </Form.Item>
          <Form.Item
            name="minRent"
            label={t("最低价（HKD）")}
            rules={required}
            className={field}
          >
            <InputNumber min={0} precision={2} placeholder="5,500" />
          </Form.Item>
          <Form.Item
            name="maxRent"
            label={t("最高价（HKD）")}
            dependencies={["minRent"]}
            rules={[
              ...required,
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const minRent = getFieldValue("minRent");
                  if (
                    value == null ||
                    minRent == null ||
                    Number(value) >= Number(minRent)
                  )
                    return Promise.resolve();
                  return Promise.reject(new Error(t("最低价不得高于最高价")));
                },
              }),
            ]}
            className={field}
          >
            <InputNumber min={0} precision={2} placeholder="6,200" />
          </Form.Item>
          <Form.Item
            name="minLeaseMonths"
            label={t("最短租期")}
            rules={required}
            className={field}
          >
            <InputNumber
              min={1}
              max={120}
              precision={0}
              addonAfter={t("个月")}
            />
          </Form.Item>
          <Form.Item
            name={["extra", "rentCycle"]}
            label={t("租金周期")}
            rules={required}
            className={field}
          >
            <Select
              options={["月付", "季付", "半年付", "年付"].map((value) => ({
                value,
                label: t(value),
              }))}
            />
          </Form.Item>
          <Form.Item
            name="commissionNote"
            label={t("佣金说明")}
            className={field}
          >
            <Input placeholder={t("按实际订单录入佣金")} />
          </Form.Item>
        </div>
        <p className="mb-0 text-[11px] text-[#8b97a9]">
          {t(
            "参考月租须介于最低价和最高价之间。报价修改不影响既有订单，实际成交价以订单记录为准。",
          )}
        </p>
      </section>

      <section className={section}>
        <h2 className="mb-4 text-sm font-semibold text-[#25334a]">
          {t("单位图片、视频与文件")}
        </h2>
        <div className="grid grid-cols-3 gap-x-5 gap-y-1 max-[850px]:grid-cols-2 max-[560px]:grid-cols-1">
          <UnitMediaField
            label="单位图片"
            prompt="添加图片"
            category="PHOTO"
            files={media.PHOTO}
            onChange={onMediaChange}
          />
          <UnitMediaField
            label="单位视频"
            prompt="添加视频"
            category="VIDEO"
            files={media.VIDEO}
            onChange={onMediaChange}
          />
          <UnitMediaField
            label="单位文件"
            prompt="添加文件"
            category="PROJECT_FILE"
            files={media.PROJECT_FILE}
            onChange={onMediaChange}
          />
        </div>
        <p className="mb-4 mt-0 text-[11px] text-[#8b97a9]">
          {t(
            "可分别上传多张图片、多个 MP4 视频和文件；保存单位后可在详情中预览。",
          )}
        </p>
        <div className="grid grid-cols-2 gap-x-5 max-[560px]:grid-cols-1">
          <Form.Item
            name={["extra", "salesOfficeNote"]}
            label={t("售楼处 / 物业资料")}
            className={field}
          >
            <Input placeholder={t("继承项目资料，可补充")} />
          </Form.Item>
          <Form.Item
            name={["extra", "signingGuideNote"]}
            label={t("开单 / 入票退票方法")}
            className={field}
          >
            <Input placeholder={t("继承项目指南，可补充")} />
          </Form.Item>
        </div>
      </section>
    </div>
  );
}
