import assert from "assert";

const ssrGlobals = {
	hasWindow: typeof globalThis.window !== "undefined",
	hasDocument: typeof globalThis.document !== "undefined"
};

const carbon = await import("../dist/index.esm.js");

const {
	changed,
	hexToRgb,
	isJsonString,
	parseMultipleJson,
	updateRestfulObjectArrays,
	eUpdateInsertMethod,
	InMemoryStateAdapter
} = carbon;

const tests = [];

const test = (name, fn) => {
	tests.push({ name, fn });
};

test("hexToRgb converts 6-digit hex strings", () => {
	assert.equal(hexToRgb("#ff00aa"), "255,0,170");
	assert.equal(hexToRgb("##00ff00"), "0,255,0");
});

test("ssr import does not require DOM globals", () => {
	assert.equal(ssrGlobals.hasWindow, false);
	assert.equal(ssrGlobals.hasDocument, false);
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

const clone = (value) => JSON.parse(JSON.stringify(value));

const createSetStateInstance = (initialState) => ({
	state: clone(initialState),
	props: {},
	setState(updater) {
		const next = typeof updater === "function" ? updater(this.state, this.props) : updater;
		if (next !== null && next !== undefined) {
			this.state = { ...this.state, ...next };
		}
	}
});

const runUpdate = (order, mode) => {
	const initialState = {
		items: [
			{ id: 1, name: "one" },
			{ id: 2, name: "two" }
		]
	};

	const updates = [
		{ id: 2, name: "two-updated" },
		{ id: 3, name: "three" }
	];

	if (mode === "adapter") {
		const adapter = new InMemoryStateAdapter(clone(initialState));
		const instance = { props: {}, stateAdapter: adapter };
		updateRestfulObjectArrays({
			instance,
			dataOrCallback: updates,
			stateKey: "items",
			uniqueObjectId: "id",
			insertUpdateOrder: order
		});
		return adapter.getState().items;
	}

	const instance = createSetStateInstance(initialState);
	updateRestfulObjectArrays({
		instance,
		dataOrCallback: updates,
		stateKey: "items",
		uniqueObjectId: "id",
		insertUpdateOrder: order
	});
	return instance.state.items;
};

test("updateRestfulObjectArrays preserves LAST ordering in adapter mode", () => {
	const setStateResult = runUpdate(eUpdateInsertMethod.LAST, "setState");
	const adapterResult = runUpdate(eUpdateInsertMethod.LAST, "adapter");
	assert.deepEqual(adapterResult, setStateResult);
});

test("updateRestfulObjectArrays preserves FIRST ordering in adapter mode", () => {
	const setStateResult = runUpdate(eUpdateInsertMethod.FIRST, "setState");
	const adapterResult = runUpdate(eUpdateInsertMethod.FIRST, "adapter");
	assert.deepEqual(adapterResult, setStateResult);
});

test("updateRestfulObjectArrays preserves REPLACE ordering in adapter mode", () => {
	const setStateResult = runUpdate(eUpdateInsertMethod.REPLACE, "setState");
	const adapterResult = runUpdate(eUpdateInsertMethod.REPLACE, "adapter");
	assert.deepEqual(adapterResult, setStateResult);
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
