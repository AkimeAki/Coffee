import globals from "globals";
import pluginJs from "@eslint/js";
import pluginAstro from "eslint-plugin-astro";
import configPrettier from "eslint-config-prettier";
import tseslint from "typescript-eslint";
import astroEslintParser from "astro-eslint-parser";

export default [
	{ languageOptions: { globals: { ...globals.browser, ...globals.node } } },
	pluginJs.configs.recommended,
	...tseslint.configs.recommended,
	...pluginAstro.configs.recommended,
	{
		ignores: ["src/env.d.ts", "dist/**/*"]
	},
	{
		files: ["**/*.astro"],
		languageOptions: {
			parser: astroEslintParser,
			parserOptions: {
				parser: "@typescript-eslint/parser",
				extraFileExtensions: [".astro"]
			}
		}
	},
	configPrettier
];
