import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import tsConfigPath from 'vite-tsconfig-paths'
import windiCSS from 'vite-plugin-windicss'
// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react(),
        tsConfigPath(),
        windiCSS(),
    ],
    css: {
        preprocessorOptions: {
            scss: {
                additionalData: '@use "sass:math"; @import "src/styles/variables.scss";',
            },
        },
    },
})
