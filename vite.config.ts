import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // GitHub Pages 子路径部署：生产构建用 /music-theory-lab/，本地开发保持根路径
  base: process.env.NODE_ENV === 'production' ? '/music-theory-lab/' : '/',
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
})
