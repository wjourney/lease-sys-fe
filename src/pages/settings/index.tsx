import { UploadOutlined } from "@ant-design/icons";
import { App, Button, Card, Form, Input, Result, Spin, Upload } from "antd";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { api, errorMessage } from "../../shared/api";
import { t } from "../../shared/i18n";
import { normalizeSiteConfig, type SiteConfig } from "../../shared/site-config";
import { useRoot } from "../../stores/root";

export default observer(function WebsiteSettings() {
  const root = useRoot();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [saved, setSaved] = useState<SiteConfig>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [file, setFile] = useState<File>();
  const [preview, setPreview] = useState<string>();
  const [removeLogo, setRemoveLogo] = useState(false);
  const [retry, setRetry] = useState(0);
  const allowed = root.canWrite("settings");
  useEffect(() => {
    if (!allowed) return;
    let active = true;
    setLoading(true);
    api
      .get("/settings/website")
      .then(({ data }) => {
        if (!active) return;
        const value = normalizeSiteConfig(data);
        setSaved(value);
        form.setFieldsValue(value);
      })
      .catch((error) => {
        if (!active) return;
        message.error(t(errorMessage(error)));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [allowed, retry, form, message]);
  useEffect(() => {
    if (!file) {
      setPreview(undefined);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  async function save(values: Record<string, string>) {
    if (!saved) return;
    setSaving(true);
    try {
      const body = new FormData();
      body.append(
        "payload",
        JSON.stringify({
          siteName: values.siteName.trim(),
          subtitle: values.subtitle?.trim() ?? "",
          browserTitle: values.browserTitle.trim(),
          footer: values.footer?.trim() ?? "",
          revision: saved.revision,
          removeLogo,
        }),
      );
      if (file) body.append("file", file);
      const { data } = await api.post("/settings/website", body);
      const next = normalizeSiteConfig(data);
      root.setSite(next);
      setSaved(next);
      form.setFieldsValue(next);
      setFile(undefined);
      setRemoveLogo(false);
      message.success(t("公司信息已保存"));
    } catch (error) {
      message.error(t(errorMessage(error)));
    } finally {
      setSaving(false);
    }
  }
  if (!allowed)
    return <Result status="403" title={t("当前账号无权修改公司信息")} />;
  const logo = preview || (!removeLogo ? saved?.logoUrl : null);
  return (
    <Card
      title={t("公司信息")}
      className="mx-auto max-w-[1000px]"
      extra={
        <Button
          type="primary"
          loading={saving}
          disabled={!saved || loading}
          onClick={() => form.submit()}
        >
          {t("保存配置")}
        </Button>
      }
    >
      <Spin spinning={loading}>
        <Form
          form={form}
          layout="vertical"
          onFinish={save}
          disabled={!saved || saving || loading}
        >
          {!loading && !saved ? (
            <Button
              disabled={false}
              onClick={() => setRetry((value) => value + 1)}
            >
              {t("重新加载")}
            </Button>
          ) : (
            <>
              <p className="mb-6 text-sm text-[#73819a]">
                {t("保存后应用于登录页、侧栏品牌区、浏览器标题和页脚。")}
              </p>
              <Form.Item label={t("网站 Logo")}>
                <div className="flex flex-wrap items-center gap-5">
                  <div className="flex h-24 w-36 items-center justify-center rounded-lg border border-[#e0e6ed] bg-[#15243f] p-3">
                    {logo ? (
                      <img
                        src={logo}
                        alt={t("网站 Logo 预览")}
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <span className="text-sm text-white">
                        {t("默认标志")}
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Upload
                        accept="image/png,image/jpeg,image/webp"
                        showUploadList={false}
                        disabled={saving}
                        beforeUpload={(next) => {
                          if (
                            !["image/png", "image/jpeg", "image/webp"].includes(
                              next.type,
                            ) ||
                            next.size > 2 * 1024 * 1024
                          ) {
                            message.error(
                              t("请上传 2MB 以内的 PNG、JPG 或 WebP 图片"),
                            );
                            return Upload.LIST_IGNORE;
                          }
                          setFile(next);
                          setRemoveLogo(false);
                          return false;
                        }}
                      >
                        <Button icon={<UploadOutlined />}>
                          {t(logo ? "替换 Logo" : "上传 Logo")}
                        </Button>
                      </Upload>
                      {logo && (
                        <Button
                          danger
                          onClick={() => {
                            setFile(undefined);
                            setRemoveLogo(true);
                          }}
                        >
                          {t("移除")}
                        </Button>
                      )}
                    </div>
                    <p className="text-sm text-[#73819a]">
                      {t(
                        "支持 PNG、JPG、WebP，最大 2MB，建议使用透明背景图片。",
                      )}
                    </p>
                    <p className="text-sm text-[#73819a]">
                      {t("上传、替换或移除后，点击保存配置生效。")}
                    </p>
                  </div>
                </div>
              </Form.Item>
              <div className="grid grid-cols-2 gap-x-6 max-[640px]:grid-cols-1">
                <Form.Item
                  name="siteName"
                  label={t("网站名称")}
                  rules={[
                    {
                      required: true,
                      whitespace: true,
                      message: t("请填写网站名称"),
                    },
                  ]}
                >
                  <Input maxLength={60} />
                </Form.Item>
                <Form.Item name="subtitle" label={t("网站副标题")}>
                  <Input maxLength={80} />
                </Form.Item>
                <Form.Item
                  name="browserTitle"
                  label={t("浏览器标题")}
                  rules={[
                    {
                      required: true,
                      whitespace: true,
                      message: t("请填写浏览器标题"),
                    },
                  ]}
                  className="col-span-full"
                >
                  <Input maxLength={100} />
                </Form.Item>
                <Form.Item
                  name="footer"
                  label={t("页脚文案")}
                  className="col-span-full"
                >
                  <Input maxLength={200} />
                </Form.Item>
              </div>
            </>
          )}
        </Form>
      </Spin>
    </Card>
  );
});
