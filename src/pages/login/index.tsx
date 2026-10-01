import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { Alert, Button, Form, Input, Typography } from "antd";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { errorMessage } from "../../shared/api";
import { t } from "../../shared/i18n";
import { useRoot } from "../../stores/root";
import { LoginVisual } from "./components/LoginVisual";
const { Title, Text, Paragraph } = Typography;
const LoginPage = observer(function LoginPage() {
  const root = useRoot();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  async function submit(v: any) {
    setLoading(true);
    try {
      await root.login(v);
      navigate("/projects", {
        replace: true,
      });
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="grid min-h-screen grid-cols-[47%_53%] bg-white max-[760px]:grid-cols-1">
      <LoginVisual />
      <section className="relative flex items-center justify-center p-[50px] max-[760px]:min-h-screen max-[760px]:p-[25px] [&>div]:w-[360px] [&_h2]:!my-[15px] [&_h2]:!text-[29px] [&_.ant-typography]:mb-[35px] [&_.ant-typography]:text-xs [&_.ant-typography]:text-[#8a95a5] [&_.ant-btn]:mt-3 [&_.ant-btn]:!h-[45px] [&_.ant-form-item-label_label]:text-xs [&_footer]:absolute [&_footer]:bottom-[30px] [&_footer]:text-[10px] [&_footer]:text-[#a2aab6]">
        <div>
          <span className="text-[10px] tracking-[3px] text-[#a88d64]">
            WELCOME BACK
          </span>
          <Title level={2}>{t("欢迎登录")}</Title>
          <Paragraph>{t("使用你的个人账号，进入租赁管理系统。")}</Paragraph>
          {error && (
            <Alert message={t(error)} type="error" showIcon className="mb-5" />
          )}
          <Form layout="vertical" onFinish={submit} requiredMark={false}>
            <Form.Item
              name="username"
              label={t("登录账号")}
              rules={[
                {
                  required: true,
                  message: "请输入登录账号",
                },
              ]}
            >
              <Input
                size="large"
                prefix={<UserOutlined aria-hidden={true} />}
                placeholder={t("请输入登录账号")}
                autoComplete="username"
              />
            </Form.Item>
            <Form.Item
              name="password"
              label={t("密码")}
              rules={[
                {
                  required: true,
                  message: "请输入密码",
                },
              ]}
            >
              <Input.Password
                size="large"
                prefix={<LockOutlined aria-hidden={true} />}
                placeholder={t("请输入密码")}
                autoComplete="current-password"
              />
            </Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              loading={loading}
            >
              {t("登录系统")}
            </Button>
          </Form>
          <Text type="secondary" className="mt-[26px] !block !text-[11px]">
            {t("账号由管理员开通。如需帮助，请联系所属公司管理员。")}
          </Text>
        </div>
        <footer>© {t(new Date().getFullYear())} SUPREME BAY</footer>
      </section>
    </div>
  );
});
export default LoginPage;
