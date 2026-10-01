import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv } from "vite";
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const target = new URL(
    process.env.VITE_API_PROXY ||
      env.VITE_API_PROXY ||
      "https://47.117.136.208",
  );
  const remote = !["localhost", "127.0.0.1", "[::1]"].includes(target.hostname);
  return {
    plugins: [react(), tailwindcss()],
    server: {
      host: "127.0.0.1",
      port: 5173,
      strictPort: true,
      proxy: {
        "/api": {
          target: target.origin,
          changeOrigin: true,
          secure: true,
          cookieDomainRewrite: "",
          configure(proxy) {
            proxy.on("proxyReq", (proxyReq, req) => {
              // Translate only same-origin development requests for the remote API.
              // Leave foreign origins untouched so its CSRF checks still reject them.
              if (remote && req.headers.origin) {
                try {
                  const origin = new URL(req.headers.origin);
                  if (
                    ["http:", "https:"].includes(origin.protocol) &&
                    origin.host === req.headers.host
                  ) {
                    proxyReq.setHeader("Origin", target.origin);
                  }
                } catch {
                  // The upstream API rejects malformed origins.
                }
              }
            });
            proxy.on("proxyRes", (proxyRes, req) => {
              // Only the loopback HTTP development response drops Secure;
              // upstream HTTPS and production cookie settings remain intact.
              const localHost = req.headers.host?.split(":")[0];
              if (
                ["127.0.0.1", "localhost"].includes(localHost || "") &&
                !("encrypted" in req.socket && req.socket.encrypted)
              ) {
                const cookies = proxyRes.headers["set-cookie"];
                if (cookies) {
                  proxyRes.headers["set-cookie"] = cookies.map((cookie) =>
                    cookie.replace(/;\s*Secure\b/gi, ""),
                  );
                }
              }
            });
          },
        },
      },
    },
    build: { chunkSizeWarningLimit: 1200 },
  };
});
