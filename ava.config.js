export default {
	"files": [
		"./src/tests/**/*"
	],
	"failFast": true,
	"failWithoutAssertions": false,
	"verbose": true,
	"timeout": "2m",
	"typescript": {
		"extensions": [
			"ts"
		],
		"rewritePaths": {
			"src/": "dist/"
		}
	}
}