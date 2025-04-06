import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import buildAiImage from "./src/lib/build-ai-image.ts";

// https://astro.build/config
export default defineConfig({
	server: {
		port: 7001
	},
	experimental: {},
	site: "https://coffee.shikiiro.net",
	trailingSlash: "never",
	integrations: [sitemap(), buildAiImage()],
	build: {
		format: "file"
	}
});
