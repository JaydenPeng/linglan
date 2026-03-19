import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/__tests__/**/*.test.ts'],
    environmentMatchGlobs: [
      // 主进程测试使用 node 环境（无 DOM，避免跨 realm Uint8Array 问题）
      ['src/main/**/*.test.ts', 'node']
    ],
    server: {
      deps: {
        // 内联 jose，确保在同一 realm 中处理 Uint8Array
        inline: ['jose']
      }
    }
  },
  resolve: {
    alias: {
      '@renderer': resolve(__dirname, 'src/renderer'),
      '@shared': resolve(__dirname, 'src/shared')
    }
  }
})
