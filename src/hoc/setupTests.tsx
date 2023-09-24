import fs from "fs";
import {inspect} from "util";
import {axiosInstance, checkAllRequestsComplete, isVerbose} from "@carbonorm/carbonnode";
import {waitFor} from "@testing-library/react";
import ValidSQL, {validSQL} from "./validSQL";

export default function ({sqlDirectory = './logs/rest/', logsDirectory = './logs/tests/'}: {
    sqlDirectory?: string,
    logsDirectory?: string
} = {}) {

    const originalWindowLocation = window.location

    const consoleOriginal = console;

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
        debug: (...args) => (isVerbose && consoleOriginal.debug(...args), asyncFileLogging('debug', ...args)),
        error: (...args) => (isVerbose && consoleOriginal.error(...args), asyncFileLogging('error', ...args)),
        group: (...args) => (isVerbose && consoleOriginal.group(...args), asyncFileLogging('group', ...args)),
        groupCollapsed: (...args) => (isVerbose && consoleOriginal.groupCollapsed(args), asyncFileLogging('groupCollapsed', ...args)),
        groupEnd: () => (isVerbose && consoleOriginal.groupEnd(), asyncFileLogging('groupEnd')),
        info: (...args) => (isVerbose && consoleOriginal.info(...args), asyncFileLogging('info', ...args)),
        log: (...args) => (isVerbose && consoleOriginal.log(...args), asyncFileLogging('log', ...args)),
        table: (...args) => (isVerbose && consoleOriginal.table(...args), asyncFileLogging('table', ...args)),
        trace: (...args) => (isVerbose && consoleOriginal.trace(...args), asyncFileLogging((() => {
            const err = new Error();
            return err.stack;
        })())),
        warn: (...args) => (isVerbose && consoleOriginal.warn(...args), asyncFileLogging('warn', ...args)),
    };

    afterEach(async () => {

        await waitFor(async () => {

            expect(checkAllRequestsComplete()).toEqual(true);

        }, {timeout: 3000, interval: 1000});

        const jsonSQL = JSON.stringify(validSQL, undefined, 2) ?? '{}';

        console.log('After each Test (' + expect.getState().currentTestName + ')', validSQL, expect.getState());

        // restore `window.location` to the original `jsdom`
        // `Location` object
        window.location = originalWindowLocation

        fs.writeFileSync(validSqlFile(), jsonSQL);

    }, 65000)


}