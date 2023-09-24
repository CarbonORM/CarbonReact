#!/usr/bin/env node

import {readFile, readFileSync} from "fs";

const c = require('ansi-colors');

// Create an object to store the parsed arguments
const args = {
    inputDir: './logs/rest/',
    outputDir: './logs/rest/',
    verbose: false,
};


// parse command line arguments
for (let i = 2; i < process.argv.length; i++) {

    const arg = process.argv[i];

    switch (arg) {
        case '--input':
        case '-i':
            args.inputDir = process.argv[i + 1];
            i++; // Skip the next argument since it's the value
            break;
        case '--output':
        case '-o':
            args.outputDir = process.argv[i + 1];
            i++; // Skip the next argument since it's the value
            break;
        case '--verbose':
        case '-v':
            args.verbose = true;
            break;
        case '--help':
        case '-h':
            console.log(c.cyan('Usage:'));
            console.log(c.cyan('--input or -i: Input directory'));
            console.log(c.cyan('--output or -o: Output directory'));
            console.log(c.cyan('--verbose or -v: Enable verbose mode'));
            process.exit(0);
            break;
        default:
            console.error(`Unknown argument: ${arg}`);
            process.exit(1);
    }
}

// print parsed arguments if verbose mode is enabled
if (args.verbose) {
    console.log(c.cyan('Parsed arguments:'));
    console.log(c.cyan(JSON.stringify(args, null, 4)));
}

interface iApiResponseLine {
    "method": "GET" | "PUT" | "POST" | "DELETE",
    "table": string,
    "CarbonPHP\\Restful\\RestSettings::$externalRestfulRequestsAPI": boolean,
    "argv": [
        any[],
        any,
        any
    ],
    "stmt": [
        string, // sql
        {
            [key: string]: string,
        }
    ]
}


const util = require('util');

const exec = util.promisify(require('child_process').exec);

const fs = require('fs');

(async () => {


    let jsonValidSqlFiles: any[] = [],
        validExternalRequests: iApiResponseLine[] = [];


    const ManifestFile = 'validSQL.json';

    fs.readdirSync(args.inputDir).forEach((file) => {

        if (file === ManifestFile) {

            return;

        }

        const resource = readFileSync(`${args.outputDir}${file}`, 'utf8');

        const json = JSON.parse(resource)

        if (json === undefined) {

            console.error(`Failed to parse ${file} as JSON`);

            return;

        }

        jsonValidSqlFiles.push(json);

    });

    jsonValidSqlFiles.forEach(apiRequest => {

        Object.keys(apiRequest).forEach(testName => {

            Object.keys(apiRequest[testName]).forEach(restCallInfo => {

                apiRequest[testName][restCallInfo].forEach(singleSqlInfoObject => {

                    if (true === singleSqlInfoObject['CarbonPHP\\Restful\\RestSettings::$externalRestfulRequestsAPI']) {

                        validExternalRequests.push(singleSqlInfoObject)

                    }

                })

            })

        });

    });

    // @link https://stackoverflow.com/questions/12941083/execute-and-get-the-output-of-a-shell-command-in-node-js
    const {stdout} = await exec('git rev-parse HEAD')

    const revision = stdout.trim();

    fs.writeFileSync(args.outputDir + ManifestFile, JSON.stringify({
        "revision": revision,
        "validSQL": validExternalRequests
    }, undefined, 4));

})()