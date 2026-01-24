import assert from "assert";

const ensureBrowserGlobals = () => {
	if (!globalThis.window) {
		const stubHead = {
			firstChild: null,
			appendChild() {},
			insertBefore() {}
		};

		const stubDocument = {
			documentElement: {},
			head: stubHead,
			body: { appendChild() {}, removeChild() {} },
			createElement() {
				return {
					style: {},
					styleSheet: null,
					appendChild() {},
					setAttribute() {}
				};
			},
			createTextNode() { return {}; },
			addEventListener() {},
			removeEventListener() {},
			getElementById() { return null; },
			getElementsByTagName() { return [stubHead]; },
			cookie: ""
		};

		globalThis.window = {
			location: {
				host: "localhost",
				protocol: "http:",
				pathname: "/",
				href: "http://localhost/"
			},
			navigator: { userAgent: "node" },
			innerWidth: 1024,
			innerHeight: 768,
			addEventListener() {},
			removeEventListener() {},
			document: stubDocument
		};

		globalThis.document = stubDocument;
		globalThis.location = globalThis.window.location;
		globalThis.getComputedStyle = () => ({ getPropertyValue: () => "" });
	}
};

ensureBrowserGlobals();

const carbon = await import("../dist/index.esm.js");

const {
	changed,
	hexToRgb,
	isJsonString,
	parseMultipleJson
} = carbon;

const tests = [];

const test = (name, fn) => {
	tests.push({ name, fn });
};

test("hexToRgb converts 6-digit hex strings", () => {
	assert.equal(hexToRgb("#ff00aa"), "255,0,170");
	assert.equal(hexToRgb("##00ff00"), "0,255,0");
});

test("isJsonString returns true for valid JSON", () => {
	assert.equal(isJsonString("{\"a\":1}"), true);
});

test("isJsonString returns false for invalid JSON", () => {
	assert.equal(isJsonString("{a:1}"), false);
});

test("parseMultipleJson returns array for non-string input", () => {
	const obj = { a: 1 };
	assert.deepEqual(parseMultipleJson(obj), [obj]);
});

test("parseMultipleJson parses multiple JSON objects", () => {
	const input = "{\"a\":1}\n{\"b\":2}\n";
	assert.deepEqual(parseMultipleJson(input), [{ a: 1 }, { b: 2 }]);
});

test("changed logs only when values differ", () => {
	const originalConsole = {
		group: console.group,
		log: console.log,
		groupEnd: console.groupEnd
	};

	const calls = { group: 0, log: 0, groupEnd: 0 };

	console.group = () => { calls.group += 1; };
	console.log = () => { calls.log += 1; };
	console.groupEnd = () => { calls.groupEnd += 1; };

	try {
		changed("Test", "state", { a: 1, b: 2 }, { a: 1, b: 2 });
		assert.equal(calls.group, 0);
		assert.equal(calls.log, 0);
		assert.equal(calls.groupEnd, 0);

		changed("Test", "state", { a: 1, b: 2 }, { a: 1, b: 3 });
		assert.equal(calls.group, 1);
		assert.equal(calls.log, 1);
		assert.equal(calls.groupEnd, 1);
	} finally {
		console.group = originalConsole.group;
		console.log = originalConsole.log;
		console.groupEnd = originalConsole.groupEnd;
	}
});

let failures = 0;

for (const { name, fn } of tests) {
	try {
		fn();
		console.log(`ok - ${name}`);
	} catch (error) {
		failures += 1;
		console.error(`not ok - ${name}`);
		console.error(error);
	}
}

if (failures > 0) {
	process.exitCode = 1;
}
