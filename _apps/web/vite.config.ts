import suidPlugin from "@suid/vite-plugin"
import { defineConfig } from "vite"
import solidPlugin from "vite-plugin-solid"
import tsconfigPaths from 'vite-tsconfig-paths'
const API_URL = "http://0.0.0.0:5001"
const VNC_URL = "http://0.0.0.0:5003"

export default defineConfig({
	plugins: [suidPlugin(), solidPlugin() /* , basicSsl() */, tsconfigPaths()],
	build: {
		target: "esnext",
	},
	server: {
		port: 5000,
		host: "0.0.0.0",
		proxy: {
			"/api": {
				target: API_URL,
				rewrite: (path) => path.replace(/^\/api/, ""),
			},
			"/apiws": {
				target: API_URL,
				rewrite: (path) => path.replace(/^\/apiws/, ""),
				ws: true,
			},
			"/vnc": {
				target: VNC_URL,
				rewrite: (path) => path.replace(/^\/vnc/, "")
			},
		},
	},
	preview: {
		port: 5000,
		host: "0.0.0.0",
		proxy: {
			"/api": {
				target: API_URL,
				rewrite: (path) => path.replace(/^\/api/, ""),
			},
			"/vnc": {
				target: VNC_URL,
				rewrite: (path) => path.replace(/^\/vnc/, "")
			},
		},
	},
})
