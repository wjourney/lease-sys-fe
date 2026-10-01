import { Spin } from "antd";
import { observer } from "mobx-react-lite";
import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "../layouts/AppLayout";
import LoginPage from "../pages/login";
import { root } from "../stores/root";
export const Session = observer(function Session() {
  useEffect(() => {
    void root.init();
    const expired = () => root.clear();
    window.addEventListener("session-expired", expired);
    return () => window.removeEventListener("session-expired", expired);
  }, []);
  if (!root.ready)
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <Spin size="large" />
      </div>
    );
  return root.user ? (
    <AppLayout />
  ) : (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
});
