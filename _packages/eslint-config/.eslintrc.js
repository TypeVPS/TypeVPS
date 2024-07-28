const path = require("path")
module.exports = {
	extends: [
		"eslint:recommended",
		"plugin:@typescript-eslint/recommended",
		"plugin:@typescript-eslint/recommended-requiring-type-checking",
	],
	parser: "@typescript-eslint/parser",
	parserOptions: {
		tsconfigRootDir: path.join(__dirname, '..', '..'),
		project: [
			"_apps/api/tsconfig.json",
			"_apps/web/tsconfig.json",
			"_packages/db/tsconfig.json",
			"_packages/shared/tsconfig.json",
			"_packages/proxmox/tsconfig.json",
		],
	},
	ignorePatterns: ["**/node_modules/**", "**/dist/**"],
	settings: {
		"import/resolver": {
			"typescript": {
				"tsconfigRootDir": path.join(__dirname, '..', '..'),
				"project": [
					"_apps/api/tsconfig.json",
					"_apps/web/tsconfig.json",
					"_packages/db/tsconfig.json",
					"_packages/shared/tsconfig.json",
					"_packages/proxmox/tsconfig.json",
				],
			}
		}
	},
	rules: {
		"@typescript-eslint/no-unsafe-assignment": "off"
	}
}
