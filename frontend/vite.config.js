import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src')
      }
    },
    base: '/', // 设置公共基础路径
    // 确保以模块方式处理代码
    build: {
      sourcemap: true,
      // 确保使用 ESM 格式
      target: 'esnext',
    },
    // 设置环境变量
    envPrefix: 'VITE_',
    // 开发服务器配置
    server: {
      host: '0.0.0.0',
      port: 5173,
      strictPort: false,
      // 开启热更新
      hmr: true,
      // 跨域配置
      proxy: {
        '/api': {
          target: env.VITE_API_BASE_URL,
          changeOrigin: true,
          secure: false,
        }
      }
    }
  }
})
