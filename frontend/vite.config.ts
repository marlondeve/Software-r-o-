import { writeFileSync } from "fs"
import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv, type Plugin } from "vite"

function hostingerHtaccessPlugin(mode: string, apiProxy?: string): Plugin {
  return {
    name: "hostinger-htaccess-proxy",
    closeBundle() {
      if (mode !== "hostinger") return

      if (!apiProxy?.trim()) {
        console.warn(
          "[hostinger] HOSTINGER_API_PROXY no está definido; el .htaccess no incluirá proxy al API.",
        )
        return
      }

      const htaccessPath = path.resolve(__dirname, "dist/.htaccess")
      const base = apiProxy.replace(/\/$/, "")
      const htaccess = `<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # Proxy del API (generado en build; la URL no se versiona en el repositorio)
  RewriteRule ^api/v1/(.*)$ ${base}/api/v1/$1 [P,L]
  RewriteRule ^health$ ${base}/health [P,L]

  # SPA fallback (React Router)
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>

<IfModule mod_headers.c>
  Header set X-Content-Type-Options "nosniff"
  Header set X-Frame-Options "SAMEORIGIN"
  Header set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>

# Tipos MIME usados por el build de Vite
<IfModule mod_mime.c>
  AddType image/webp .webp
  AddType font/woff2 .woff2
</IfModule>
`

      writeFileSync(htaccessPath, htaccess)
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")
  const apiProxyTarget = env.VITE_DEV_API_PROXY_TARGET ?? "http://localhost:8080"

  return {
    base: "/",
    plugins: [
      react(),
      tailwindcss(),
      hostingerHtaccessPlugin(mode, env.HOSTINGER_API_PROXY),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      proxy: {
        "/api": {
          target: apiProxyTarget,
          changeOrigin: true,
        },
        "/health": {
          target: apiProxyTarget,
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: "dist",
      assetsDir: "assets",
      chunkSizeWarningLimit: 3000,
      rolldownOptions: {
        checks: {
          pluginTimings: false,
        },
      },
    },
  }
})
