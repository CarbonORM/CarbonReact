import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
	makeDeclarationsPortable,
	rewriteDeclaration,
} from "./portable-declarations.mjs";

const require = createRequire(import.meta.url);
// Native npm test resolves the locked compiler; tiny local fixtures may name a retained provider.
const ts = require(process.env.PORTABLE_TYPESCRIPT_MODULE || "typescript");
const repo = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

function fixture(t) {
	const root = fs.mkdtempSync(
		path.join(os.tmpdir(), "carbonreact-declarations-"),
	);
	t.after(() => fs.rmSync(root, { recursive: true, force: true }));
	const put = (name, text) => {
		fs.mkdirSync(path.dirname(path.join(root, name)), { recursive: true });
		fs.writeFileSync(path.join(root, name), text);
	};
	put("package.json", '{"name":"@carbonorm/carbonreact","type":"module"}\n');
	put(
		"tsconfig.json",
		'{"compilerOptions":{"baseUrl":"./src/","declarationDir":"dist"}}\n',
	);
	fs.mkdirSync(path.join(root, "src"));
	fs.mkdirSync(path.join(root, "dist"));
	return {
		root,
		put,
		read: (name) => fs.readFileSync(path.join(root, name), "utf8"),
		run: () => makeDeclarationsPortable({ ts, root }),
	};
}

function diagnostics(root, bundler = false) {
	const options = {
		strict: true,
		skipLibCheck: false,
		noEmit: true,
		types: [],
		target: ts.ScriptTarget.ES2022,
		module: bundler ? ts.ModuleKind.ESNext : ts.ModuleKind.NodeNext,
		moduleResolution: bundler
			? ts.ModuleResolutionKind.Bundler
			: ts.ModuleResolutionKind.NodeNext,
	};
	return ts.getPreEmitDiagnostics(
		ts.createProgram([path.join(root, "consumer.ts")], options),
	);
}

test("same-origin declaration graph and real generated CSS map pass strict NodeNext and Bundler", (t) => {
	const f = fixture(t);
	const css = fs.readFileSync(
		path.join(repo, "src/styles/bootstrap.module.css.d.ts"),
		"utf8",
	);
	f.put("src/styles/bootstrap.module.css.d.ts", css);
	f.put(
		"dist/index.d.ts",
		'export { default as CarbonReact } from "./core/CarbonReact";\nexport type { C6 } from "schema/C6";\nexport { default as Styles } from "styles/bootstrap.module.css";\n',
	);
	f.put(
		"dist/core/CarbonReact.d.ts",
		"export default class CarbonReact { private generateIdentifier; value: string; }\n",
	);
	f.put(
		"dist/schema/C6.d.ts",
		'import CarbonReact from "core/CarbonReact";\nexport interface C6 { reactBootstrap: CarbonReact; }\n',
	);
	f.put(
		"consumer.ts",
		'import { CarbonReact, type C6, Styles } from "./dist/index.js";\nimport Original from "./dist/core/CarbonReact.js";\ndeclare let a: CarbonReact; declare let b: Original; a = b; b = a;\ndeclare let c6: C6; a = c6.reactBootstrap; c6.reactBootstrap = b;\nconst style: string = Styles.btn;\nvoid style;\n',
	);
	const before = diagnostics(f.root);
	assert(before.some((item) => [2307, 2834, 2835].includes(item.code)));
	assert(diagnostics(f.root, true).some((item) => item.code === 2307));
	const result = f.run();
	assert.equal(result.rewrittenEdges, 4);
	assert.equal(result.generatedStyles, 1);
	assert.equal(f.read("dist/styles/bootstrap.module.css.d.ts"), css);
	assert.equal(
		f.read("dist/core/CarbonReact.d.ts"),
		"export default class CarbonReact { private generateIdentifier; value: string; }\n",
	);
	assert.deepEqual(
		diagnostics(f.root).map((item) => item.code),
		[],
	);
	assert.deepEqual(
		diagnostics(f.root, true).map((item) => item.code),
		[],
	);
	assert.equal(f.run().rewrittenEdges, 0);
});

test("AST edits preserve comments, string types, external imports and declaration payload", () => {
	const text =
		'// core/CarbonReact must stay comment text\nimport External from "react";\nexport type Text = "core/CarbonReact";\nexport type C = import("core/CarbonReact").default;\nexport { default } from "../core/CarbonReact.tsx";\n';
	const result = rewriteDeclaration({
		ts,
		file: "state/adapter.d.ts",
		text,
		declarationFiles: ["state/adapter.d.ts", "core/CarbonReact.d.ts"],
		localRoots: ["core"],
	});
	assert.equal(result.rewrittenEdges, 2);
	assert.equal(
		result.text,
		text
			.replace('import("core/CarbonReact")', 'import("../core/CarbonReact.js")')
			.replace(
				'from "../core/CarbonReact.tsx"',
				'from "../core/CarbonReact.js"',
			),
	);
});

test("missing, ambiguous and escaping local declarations refuse before output changes", (t) => {
	for (const [specifier, extra] of [
		["core/missing", []],
		["./item", ["dist/item.d.ts", "dist/item/index.d.ts"]],
		["../escape", []],
	]) {
		const f = fixture(t);
		const original = `export * from ${JSON.stringify(specifier)};\n`;
		f.put("dist/index.d.ts", original);
		for (const file of extra) f.put(file, "export interface Item {}\n");
		assert.throws(f.run, (error) =>
			error.code?.startsWith("PORTABLE_DECLARATIONS_"),
		);
		assert.equal(f.read("dist/index.d.ts"), original);
	}
});

test("real relative import-equals targets are rewritten and unrelated external targets remain bare", () => {
	const text =
		'import Local = require("./item");\nimport External = require("@scope/pkg");\nexport { Local, External };\n';
	const result = rewriteDeclaration({
		ts,
		file: "index.d.ts",
		text,
		declarationFiles: ["index.d.ts", "item.d.ts"],
		localRoots: [],
	});
	assert.equal(result.rewrittenEdges, 1);
	assert.equal(
		result.text,
		text.replace('require("./item")', 'require("./item.js")'),
	);
});

test("symlinked output or source classmap refuses without touching runtime files", (t) => {
	const f = fixture(t);
	f.put("dist/index.d.ts", 'export * from "./item";\n');
	f.put("dist/index.esm.js", "export const unchanged = 1;\n");
	f.put("src/item.d.ts", "export interface Item {}\n");
	fs.symlinkSync(
		path.join(f.root, "src/item.d.ts"),
		path.join(f.root, "dist/item.d.ts"),
	);
	assert.throws(f.run, { code: "PORTABLE_DECLARATIONS_LINK" });
	assert.equal(f.read("dist/index.esm.js"), "export const unchanged = 1;\n");
});

test("conflicting emitted CSS declarations refuse instead of replacing the generated contract", (t) => {
	const f = fixture(t);
	f.put("dist/index.d.ts", "export interface Root {}\n");
	f.put(
		"src/style.module.css.d.ts",
		"export default interface Styles { exact: string; }\n",
	);
	f.put(
		"dist/style.module.css.d.ts",
		"export default interface Styles { different: string; }\n",
	);
	assert.throws(f.run, { code: "PORTABLE_DECLARATIONS_CSS_CONFLICT" });
});

test("hardlinked declaration cannot truncate an aliased runtime module", (t) => {
	const f = fixture(t);
	const runtime = 'export * from "./item";\n';
	f.put("dist/index.esm.js", runtime);
	f.put("dist/item.d.ts", "export interface Item {}\n");
	fs.linkSync(
		path.join(f.root, "dist/index.esm.js"),
		path.join(f.root, "dist/index.d.ts"),
	);
	let refused = false;
	try {
		f.run();
	} catch (error) {
		refused = error.code === "PORTABLE_DECLARATIONS_FILE";
	}
	assert.equal(f.read("dist/index.esm.js"), runtime);
	assert.equal(refused, true);
});
