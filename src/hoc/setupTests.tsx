import {axiosInstance, checkAllRequestsComplete, isVerbose} from "@carbonorm/carbonnode";
import {createRequire} from "module";
import ValidSQL, {validSQL} from "./validSQL";

const require = createRequire(import.meta.url);

export default function ({sqlDirectory = './logs/rest/', logsDirectory = './logs/tests/'}: {
    sqlDirectory?: string,
    logsDirectory?: string
} = {}) {

    const fs = require("fs");
    const {inspect} = require("util");
    const {waitFor} = require("@testing-library/react");

    const originalWindowLocation = window.location.href

    const consoleOriginal = console;
    const isVerboseEnabled = isVerbose();

    const testName = () => expect.getState().currentTestName?.replaceAll(" ", "_").toLowerCase()

    const validSqlFile = () => sqlDirectory + testName() + '.json';

    const logsFile = () => logsDirectory + testName() + '.log';

    expect(document).not.toBeNull();

    axiosInstance.interceptors.response.use(
        response => {

            if (Array.isArray(response?.data?.sql)) {

                ValidSQL(response.data.sql)

            }

            return response;
        })

    // @link https://stackoverflow.com/questions/13542667/create-directory-when-writing-to-file-in-node-js
    const asyncFileLogging = async (...args) => fs.writeFileSync(
        logsFile(),
        '\n' + inspect(args.length === 1 ? args.pop() : args, false, 10, true),
        {flag: "a+"});

    global.console = {
        ...console,
        // use jest.fn() to silence, comment out to leave as it is
        debug: (...args) => (isVerboseEnabled && consoleOriginal.debug(...args), asyncFileLogging('debug', ...args)),
        error: (...args) => (isVerboseEnabled && consoleOriginal.error(...args), asyncFileLogging('error', ...args)),
        group: (...args) => (isVerboseEnabled && consoleOriginal.group(...args), asyncFileLogging('group', ...args)),
        groupCollapsed: (...args) => (isVerboseEnabled && consoleOriginal.groupCollapsed(...args), asyncFileLogging('groupCollapsed', ...args)),
        groupEnd: () => (isVerboseEnabled && consoleOriginal.groupEnd(), asyncFileLogging('groupEnd')),
        info: (...args) => (isVerboseEnabled && consoleOriginal.info(...args), asyncFileLogging('info', ...args)),
        log: (...args) => (isVerboseEnabled && consoleOriginal.log(...args), asyncFileLogging('log', ...args)),
        table: (...args) => (isVerboseEnabled && consoleOriginal.table(...args), asyncFileLogging('table', ...args)),
        trace: (...args) => (isVerboseEnabled && consoleOriginal.trace(...args), asyncFileLogging((() => {
            const err = new Error();
            return err.stack;
        })())),
        warn: (...args) => (isVerboseEnabled && consoleOriginal.warn(...args), asyncFileLogging('warn', ...args)),
    };

    afterEach(async () => {

        await waitFor(async () => {

            expect(checkAllRequestsComplete()).toEqual(true);

        }, {timeout: 3000, interval: 1000});

        const jsonSQL = JSON.stringify(validSQL, undefined, 2) ?? '{}';

        console.log('After each Test (' + expect.getState().currentTestName + ')', validSQL, expect.getState());

        // restore `window.location` to the original `jsdom`
        // `Location` object
        window.location.href = originalWindowLocation

        fs.writeFileSync(validSqlFile(), jsonSQL);

    }, 65000)


}
