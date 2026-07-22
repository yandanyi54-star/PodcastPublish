import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  // 相对 base：同一份构建既可部署到 GitHub Pages 子路径（/jingpai/），
  // 也可部署到 CloudStudio / 任意静态根目录，无需为不同托管改配置。
  base: './',
  plugins: [vue()],
  server: {
    port: 3000
  }
});
