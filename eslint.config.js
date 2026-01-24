import js from "@eslint/js";
import typescript from "@typescript-eslint/eslint-plugin";
import typescriptParser from "@typescript-eslint/parser";
import prettier from "eslint-config-prettier";

export default [
	js.configs.recommended,
	prettier,
	{
		files: ["**/*.ts", "**/*.tsx"],
		languageOptions: {
			parser: typescriptParser,
			parserOptions: {
				ecmaVersion: "latest",
				sourceType: "module",
			},
			globals: {
				// Cloudflare Workers globals
				Request: "readonly",
				Response: "readonly",
				URL: "readonly",
				ExecutionContext: "readonly",
				fetch: "readonly",
				Headers: "readonly",
				FormData: "readonly",
				Blob: "readonly",
				File: "readonly",
				crypto: "readonly",
				caches: "readonly",
				console: "readonly",
			},
		},
		plugins: {
			"@typescript-eslint": typescript,
		},
		rules: {
			...typescript.configs.recommended.rules,
			"@typescript-eslint/no-explicit-any": "warn",
			"@typescript-eslint/no-unused-vars": [
				"error",
				{ argsIgnorePattern: "^_" },
			],
			"@typescript-eslint/no-empty-object-type": [
				"error",
				{ allowInterfaces: "with-single-extends" },
			],
		},
	},
	{
		ignores: ["node_modules/", "dist/", ".wrangler/"],
	},
];
