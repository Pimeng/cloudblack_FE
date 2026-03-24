import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Force new hash for cache busting
        entryFileNames: `assets/[name]-[hash]-v2.js`,
        chunkFileNames: `assets/[name]-[hash]-v2.js`,
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.');
          const ext = info?.[info.length - 1];
          if (/css/i.test(ext || '')) {
            return `assets/[name]-[hash]-v2.css`;
          }
          return `assets/[name]-[hash]-v2.[ext]`;
        },
        // 代码分割策略
        manualChunks: {
          // React 核心库
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // UI 组件库
          'ui-vendor': [
            '@radix-ui/react-accordion',
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-aspect-ratio',
            '@radix-ui/react-avatar',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-collapsible',
            '@radix-ui/react-context-menu',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-hover-card',
            '@radix-ui/react-label',
            '@radix-ui/react-menubar',
            '@radix-ui/react-navigation-menu',
            '@radix-ui/react-popover',
            '@radix-ui/react-progress',
            '@radix-ui/react-radio-group',
            '@radix-ui/react-scroll-area',
            '@radix-ui/react-select',
            '@radix-ui/react-separator',
            '@radix-ui/react-slider',
            '@radix-ui/react-slot',
            '@radix-ui/react-switch',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toggle',
            '@radix-ui/react-toggle-group',
            '@radix-ui/react-tooltip',
          ],
          // 动画库
          'animation-vendor': ['framer-motion', 'gsap', '@gsap/react'],
          // 3D 库
          'three-vendor': ['three', '@react-three/fiber', '@react-three/drei'],
          // 图表库
          'chart-vendor': ['recharts'],
          // 表单和验证
          'form-vendor': ['react-hook-form', '@hookform/resolvers', 'zod'],
          // 工具库
          'utils-vendor': ['date-fns', 'clsx', 'tailwind-merge', 'class-variance-authority'],
          // 其他第三方库
          'other-vendor': [
            'cmdk',
            'embla-carousel-react',
            'input-otp',
            'lenis',
            'lucide-react',
            'next-themes',
            'react-day-picker',
            'react-resizable-panels',
            'sonner',
            'vaul',
          ],
        },
      },
    },
    // 增加 chunk 大小警告阈值（单位：kB）
    chunkSizeWarningLimit: 1000,
  },
});
