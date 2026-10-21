import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const LIMITS = Object.freeze({
	files: 2048,
	entries: 16384,
	fileBytes: 4 * 1024 * 1024,
	bytes: 32 * 1024 * 1024,
});
const LOCAL_ROOTS = Object.freeze([
	"api",
	"components",
	"core",
	"dom",
	"env",
	"hooks",
	"routing",
	"schema",
	"state",
	"styles",
	"testing",
	"types",
	"utils",
	"style.module.css",
	"style.module.scss",
]);

const errors = new WeakSet();
const LIMIT = Object.freeze({
	files: 4096,
	entries: 16384,
	fileBytes: 4 * 1024 ** 2,
	totalBytes: 64 * 1024 ** 2,
});
const fail = (suffix) => {
	const error = Object.freeze(
		Object.assign(Error("Portable declarations refused"), {
			code: `PORTABLE_DECLARATIONS_${suffix}`,
		}),
	);
	errors.add(error);
	throw error;
};
const need = (condition, suffix) => {
	if (!condition) fail(suffix);
};
const safe = (value) =>
	typeof value === "string" &&
	value.length <= 512 &&
	value
		.split("/")
		.every(
			(part) =>
				/^[A-Za-z0-9_][A-Za-z0-9_.-]*$/.test(part) &&
				part !== "." &&
				part !== "..",
		);
function record(value, keys) {
	need(
		value !== null &&
			typeof value === "object" &&
			!Array.isArray(value) &&
			[Object.prototype, null].includes(Object.getPrototypeOf(value)),
		"INPUT",
	);
	const fields = Object.getOwnPropertyDescriptors(value);
	need(
		Reflect.ownKeys(fields).length === keys.length &&
			keys.every(
				(key) =>
					Object.hasOwn(fields, key) && Object.hasOwn(fields[key], "value"),
			),
		"INPUT",
	);
	return Object.fromEntries(keys.map((key) => [key, fields[key].value]));
}
function array(value, maximum) {
	need(Array.isArray(value), "INPUT");
	const fields = Object.getOwnPropertyDescriptors(value),
		count = fields.length?.value;
	need(
		Number.isInteger(count) &&
			count >= 0 &&
			count <= maximum &&
			Reflect.ownKeys(fields).length === count + 1,
		"INPUT",
	);
	return Array.from({ length: count }, (_, index) => {
		need(Object.hasOwn(fields[index] ?? {}, "value"), "INPUT");
		return fields[index].value;
	});
}

// Shared pure AST/range-edit contract. All non-module-literal declaration bytes
// (including private class members) remain exactly as emitted by TypeScript.
export function rewriteDeclaration(options) {
	try {
		const { ts, file, text, declarationFiles, localRoots } = record(options, [
			"ts",
			"file",
			"text",
			"declarationFiles",
			"localRoots",
		]);
		need(
			typeof ts?.createSourceFile === "function" &&
				/^5\.(?:8|9)\.\d+$/.test(ts.version),
			"TYPESCRIPT",
		);
		const files = array(declarationFiles, LIMIT.files),
			roots = array(localRoots, 64),
			known = new Set(),
			folded = new Set();
		for (const name of files) {
			need(
				safe(name) && name.endsWith(".d.ts") && !folded.has(name.toLowerCase()),
				"GRAPH",
			);
			known.add(name);
			folded.add(name.toLowerCase());
		}
		need(
			known.has(file) &&
				typeof text === "string" &&
				Buffer.byteLength(text) <= LIMIT.fileBytes &&
				!text.includes("\0") &&
				roots.every((name) => safe(name) && !name.includes("/")),
			"INPUT",
		);
		const parsed = ts.createSourceFile(
			file,
			text,
			ts.ScriptTarget.Latest,
			true,
			ts.ScriptKind.TS,
		);
		need(
			parsed.isDeclarationFile &&
				parsed.parseDiagnostics.length === 0 &&
				parsed.referencedFiles.length === 0 &&
				!parsed.hasNoDefaultLib,
			"PARSE",
		);
		const edits = [];
		const resolve = (specifier) => {
			need(
				typeof specifier === "string" &&
					specifier.length <= 512 &&
					!/[\\%?#\s\0]/.test(specifier),
				"EDGE",
			);
			const relative = specifier.startsWith("."),
				local = roots.some(
					(root) => specifier === root || specifier.startsWith(`${root}/`),
				);
			if (!relative && !local) {
				need(
					/^(?:node:[A-Za-z0-9_./-]+|(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*(?:\/[A-Za-z0-9_][A-Za-z0-9_.-]*)*)$/.test(
						specifier,
					),
					"EXTERNAL_EDGE",
				);
				return null;
			}
			need(!relative || /^(?:\.\/|\.\.\/)/.test(specifier), "EDGE");
			const base = path.posix.normalize(
				relative
					? path.posix.join(path.posix.dirname(file), specifier)
					: specifier,
			);
			need(safe(base), "EDGE_ESCAPE");
			let candidates;
			if (base.endsWith(".d.ts")) candidates = [base];
			else if (base.endsWith(".js")) candidates = [`${base.slice(0, -3)}.d.ts`];
			else if (/\.tsx?$/.test(base))
				candidates = [`${base.replace(/\.tsx?$/, "")}.d.ts`];
			else candidates = [`${base}.d.ts`, `${base}/index.d.ts`];
			const matches = candidates.filter((candidate) => known.has(candidate));
			need(
				matches.length === 1,
				matches.length ? "EDGE_AMBIGUOUS" : "EDGE_MISSING",
			);
			let target = path.posix.relative(
				path.posix.dirname(file),
				`${matches[0].slice(0, -5)}.js`,
			);
			if (!target.startsWith(".")) target = `./${target}`;
			return target;
		};
		const visit = (node) => {
			if (ts.isImportTypeNode(node))
				need(
					ts.isLiteralTypeNode(node.argument) &&
						ts.isStringLiteral(node.argument.literal),
					"EDGE",
				);
			const parent = node.parent;
			const edge =
				ts.isStringLiteral(node) &&
				parent &&
				(((ts.isImportDeclaration(parent) || ts.isExportDeclaration(parent)) &&
					parent.moduleSpecifier === node) ||
					(ts.isLiteralTypeNode(parent) &&
						ts.isImportTypeNode(parent.parent) &&
						parent.parent.argument === parent) ||
					(ts.isExternalModuleReference(parent) &&
						parent.expression === node) ||
					(ts.isModuleDeclaration(parent) && parent.name === node));
			if (edge) {
				const target = resolve(node.text);
				if (target !== null && target !== node.text)
					edits.push({
						start: node.getStart(parsed),
						end: node.end,
						text: JSON.stringify(target),
					});
			}
			ts.forEachChild(node, visit);
		};
		visit(parsed);
		edits.sort((a, b) => b.start - a.start);
		let output = text,
			last = text.length;
		for (const edit of edits) {
			need(edit.end <= last, "EDGE_OVERLAP");
			output = output.slice(0, edit.start) + edit.text + output.slice(edit.end);
			last = edit.start;
		}
		return Object.freeze({ text: output, rewrittenEdges: edits.length });
	} catch (error) {
		if (errors.has(error)) throw error;
		fail("UNAVAILABLE");
	}
}

function scan(root, accept) {
	const files = new Map();
	let bytes = 0;
	let entries = 0;
	const walk = (directory, prefix = "", depth = 0) => {
		need(depth <= 32, "DEPTH");
		for (const name of fs.readdirSync(directory).sort()) {
			need(++entries <= LIMITS.entries, "LIMIT");
			need(/^[A-Za-z0-9_][A-Za-z0-9_.-]*$/.test(name), "PATH");
			const relative = prefix ? `${prefix}/${name}` : name;
			const filename = path.join(directory, name);
			const stat = fs.lstatSync(filename);
			need(!stat.isSymbolicLink(), "LINK");
			if (stat.isDirectory()) walk(filename, relative, depth + 1);
			else {
				need(stat.isFile(), "FILE");
				if (!accept(relative)) continue;
				need(stat.nlink === 1, "FILE");
				need(
					stat.size <= LIMITS.fileBytes && files.size < LIMITS.files,
					"LIMIT",
				);
				bytes += stat.size;
				need(bytes <= LIMITS.bytes, "LIMIT");
				const data = fs.readFileSync(filename);
				const text = new TextDecoder("utf-8", { fatal: true }).decode(data);
				files.set(relative, text);
			}
		}
	};
	walk(root);
	return files;
}

function directory(root, child) {
	need(typeof root === "string" && path.isAbsolute(root), "ROOT");
	const stat = fs.lstatSync(root);
	need(stat.isDirectory() && !stat.isSymbolicLink(), "ROOT");
	const result = path.join(fs.realpathSync(root), child);
	const childStat = fs.lstatSync(result);
	need(childStat.isDirectory() && !childStat.isSymbolicLink(), "ROOT");
	return result;
}

const signature = (stat) =>
	[
		stat.dev,
		stat.ino,
		stat.mode,
		stat.nlink,
		stat.size,
		stat.mtimeMs,
		stat.ctimeMs,
	].join(":");

function singleFile(stat) {
	need(stat.isFile() && !stat.isSymbolicLink() && stat.nlink === 1, "FILE");
}

export function makeDeclarationsPortable({ ts, root }) {
	const source = directory(root, "src");
	const dist = directory(root, "dist");
	const canonicalRoot = fs.realpathSync(root);
	const pkg = JSON.parse(
		fs.readFileSync(path.join(canonicalRoot, "package.json"), "utf8"),
	);
	const config = JSON.parse(
		fs.readFileSync(path.join(canonicalRoot, "tsconfig.json"), "utf8"),
	);
	need(
		pkg.name === "@carbonorm/carbonreact" &&
			path.resolve(canonicalRoot, config.compilerOptions?.baseUrl ?? "") ===
				source &&
			path.resolve(
				canonicalRoot,
				config.compilerOptions?.declarationDir ?? "",
			) === dist,
		"PACKAGE_CONFIG",
	);
	const declarations = scan(dist, (file) => file.endsWith(".d.ts"));
	need(declarations.has("index.d.ts"), "ENTRY");
	const generatedStyles = scan(source, (file) =>
		/\.(css|scss)\.d\.ts$/.test(file),
	);
	for (const [file, text] of generatedStyles) {
		need(
			!declarations.has(file) || declarations.get(file) === text,
			"CSS_CONFLICT",
		);
		declarations.set(file, text);
	}
	const declarationFiles = [...declarations.keys()];
	const outputs = new Map();
	let rewrittenEdges = 0;
	for (const [file, text] of declarations) {
		const rewritten = rewriteDeclaration({
			ts,
			file,
			text,
			declarationFiles,
			localRoots: LOCAL_ROOTS,
		});
		outputs.set(file, rewritten.text);
		rewrittenEdges += rewritten.rewrittenEdges;
	}
	// No declaration is changed until the entire local graph resolves uniquely.
	for (const [file, text] of outputs) {
		const target = path.join(dist, ...file.split("/"));
		const before = fs.existsSync(target) ? fs.lstatSync(target) : null;
		if (before) singleFile(before);
		if (before && fs.readFileSync(target, "utf8") === text) continue;
		fs.mkdirSync(path.dirname(target), { recursive: true });
		const fd = fs.openSync(
			target,
			fs.constants.O_WRONLY |
				(before ? 0 : fs.constants.O_CREAT | fs.constants.O_EXCL) |
				fs.constants.O_NOFOLLOW,
			0o644,
		);
		try {
			const opened = fs.fstatSync(fd);
			const current = fs.lstatSync(target);
			singleFile(opened);
			singleFile(current);
			need(
				signature(opened) === signature(current) &&
					(!before || signature(opened) === signature(before)),
				"FILE_CHANGED",
			);
			fs.ftruncateSync(fd, 0);
			fs.writeFileSync(fd, text);
		} finally {
			fs.closeSync(fd);
		}
	}
	return Object.freeze({
		declarationFiles: declarations.size,
		rewrittenEdges,
		generatedStyles: generatedStyles.size,
	});
}

async function main() {
	need(process.argv.length === 2, "ARGUMENTS");
	const ts = await import("typescript");
	const result = makeDeclarationsPortable({
		ts: ts.default || ts,
		root: process.cwd(),
	});
	process.stdout.write(`${JSON.stringify(result)}\n`);
}

if (
	process.argv[1] &&
	path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
	main().catch(() => {
		process.stderr.write("PORTABLE_DECLARATIONS_FAILED\n");
		process.exitCode = 1;
	});
}
