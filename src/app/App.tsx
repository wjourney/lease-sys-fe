import { App as AntApp, ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";
import zhTW from "antd/locale/zh_TW";
import { observer } from "mobx-react-lite";
import { BrowserRouter } from "react-router-dom";
import { root, RootContext } from "../stores/root";
import { Session } from "./SessionBoundary";
import { theme } from "./theme";
export default observer(function App() {
  return (
    <RootContext.Provider value={root}>
      <ConfigProvider
        locale={root.locale === "zh_CN" ? zhCN : zhTW}
        theme={theme}
      >
        <AntApp>
          <BrowserRouter>
            <Session />
          </BrowserRouter>
        </AntApp>
      </ConfigProvider>
    </RootContext.Provider>
  );
});
