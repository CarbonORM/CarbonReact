import axios, {AxiosInstance, AxiosRequestConfig, AxiosRequestHeaders, AxiosResponse} from "axios";
import {isTest, isVerbose} from "@carbonorm/carbonnode";
import CarbonReact from "CarbonReact";
import {iAlert} from "components/Alert/Alert";
import Qs from "qs";


import {parseMultipleJson} from "hoc/parseMultipleJson";

import addValidSQL from "hoc/addValidSQL";

export function HandleResponseCodes(data: any): void {

    const bootstrap: CarbonReact = CarbonReact.instance;

    if (undefined === data?.data?.alert) {
        return;
    }

    if (Array.isArray(data.data.alert) === false) {

        throw new Error("data.data.alert is not an array (" + JSON.stringify(data.data.alert) + ")");

    }

    console.log("handleResponseCodes ∈ Bootstrap");

    let stack: Array<iAlert> = data.data.alert;

    if (stack.length === 0) {

        return;

    }

    bootstrap.setState(previousState => {

        previousState.alertsWaiting.push(...stack)

        return {

            alertsWaiting: previousState.alertsWaiting

        }
    });

}
export function setCookies(cookies: string[], req: AxiosResponse | undefined = undefined): void {

    console.log("Setting cookies", cookies);

    cookies.map(cookie => {

        const newCookie = cookie
            .replace("HttpOnly", "")
            .replace("secure", "");

        if (document === undefined || document === null) {

            const getStackTrace = function () {
                let obj: any = {};
                Error.captureStackTrace(obj, getStackTrace);
                return obj.stack;
            };

            console.error(req)

            console.log('Testing error, document not defined', req)

            throw new Error("Document is undefined while trying to set cookie: (" + newCookie + ") in axiosInterceptors.tsx after (" + JSON.stringify([req?.config, req?.data], undefined, 4) + ") Please make sure all requests are wrapped in an act() from import {act} from '@testing-library/react'; (" + JSON.stringify(getStackTrace(), undefined, 4) + ")");

        }

        document.cookie = newCookie

    });

}

function axiosInterceptors(axios: AxiosInstance): void {


    if (isTest) {

        axios.defaults.adapter = require('axios/lib/adapters/http')

    }

    axios.interceptors.request.use(
        req => {

            setCookies([
                'github_revision=' + process.env.REACT_APP_GITHUB_REVISION + '; path=/',
            ])

            if (isTest) {

                setCookies([
                    'dropDeveloper=554378!@#$(K-asSfdsf-fd!@#$439; path=/',
                    'XDEBUG_SESSION=start; path=/'
                ])

                req.headers ??= ({} as AxiosRequestHeaders)

                req.headers['Cookie'] = document.cookie;

            }

            if (true === isVerbose) {

                console.log(req.method, req.url, req.data)

                const log = {
                    baseURL: req.baseURL,
                    url: req.url,
                    method: req.method,
                    headers: req.headers,
                    data: req.data,
                    params: req.params,
                };

                console.groupCollapsed("Every Axios request is logged in axiosInterceptors.tsx :: <" + req.method + ">(" + req.url + ")");

                console.log(log);

                console.groupEnd();

            }

            return req;

        }
    );

    function logResponseSetCookiesForTests(response: AxiosResponse | any) {

        // axios sets cookies correctly; just not in jest tests
        if (isTest && response?.headers?.['set-cookie']) {

            setCookies(response?.headers?.['set-cookie'], response)

        }

        if (true === isVerbose) {

            if (response?.response) {

                response = response.response;

            }

            // JSON is so it prints completely in intellij run console
            if (isTest && isVerbose) {

                console.debug(
                    "Every Axios response is logged in axiosInterceptors.tsx :: ",
                    JSON.stringify({
                        baseURL: response.config.baseURL,
                        uri: response.config?.url,
                        status: response?.status,
                        statusText: response?.statusText,
                        headers: response?.headers,
                        data: response?.data,
                    }, undefined, 4)
                );

            }

        }

    }

    axios.interceptors.response.use(
        response => {

            logResponseSetCookiesForTests(response);

            if (undefined !== response?.data?.TRACE) {

                if (isTest) {

                    throw new Error(JSON.stringify(response.data, undefined, 4))

                }

                CarbonReact.instance.setState((previous) => (
                    {
                        backendThrowable: [
                            ...previous.backendThrowable,
                            response?.data
                        ]
                    }))

                return response;

            }

            if (isTest) {

                if (Array.isArray(response?.data?.sql)) {

                    addValidSQL(response.data.sql)

                }

            }

            // DO NOT REMOVE THIS - if an alert annoys you, fix it; it annoys our users too
            if (response?.data?.alert) {

                console.log("alert ∈ response");

                HandleResponseCodes(response);

            }

            return response;

        },// @link https://stackoverflow.com/posts/75956421
        async error => {

            // @link https://stackoverflow.com/questions/56074531/how-to-retry-5xx-requests-using-axios/75956421#75956421
            if (error?.config?.headers?.['X-Retry-Count'] !== undefined) {

                console.log('X-Retry-Count', error?.config?.headers?.['X-Retry-Count'])

                if (false === isTest || true === isVerbose) {

                    console.log(error)

                }

                return error;

            }

            logResponseSetCookiesForTests(error);

            error.response ??= {};

            error.response.status ??= 520;

            const shouldRetry = (error) => undefined !== error.config && error?.response?.status >= 500 && error?.response?.status < 600

            const firstRetry = shouldRetry(error)

            if (false === isTest || true === isVerbose) {

                console.group("Retrying request ", error.config?.url ?? error.config);
                console.log(error);
                console.groupEnd();

            } else if (isTest) {

                console.log('AXIOS ERROR', error.code, error.baseURL, error.config?.url, error.headers, error.data, error.params, error.path, error.response?.status, error.response?.statusText, error.response?.headers, error.response?.data)

                if (false === firstRetry) {

                    throw new Error(error?.response?.status + ' ' + JSON.stringify(error?.response?.data, undefined, 4))

                }

            }

            if (false === firstRetry) {

                console.error("Error in axiosInterceptors.tsx (Not attempting retry)", error);

                if (undefined !== error?.response?.data?.TRACE ||
                    undefined === error?.response?.data?.alert) {

                    if (isTest) {

                        throw new Error(error?.response.data['CarbonPHP\\Error\\PublicAlert'] ?? error?.response.data['TRACE'] ?? JSON.stringify(error?.response.data, undefined, 4))

                    }

                    console.log('backend throwable', error?.response?.data || error?.response)

                    if (undefined !== error?.response?.data
                        && Array.isArray(error.response.data)) {

                        error.response.data.status = error?.response?.status

                    }

                    // if string try to see if malformed json
                    const jsonErrors = parseMultipleJson(error?.response?.data || error?.response || error)

                    CarbonReact.instance.setState((previous) => (
                        {
                            backendThrowable: [
                                ...previous.backendThrowable,
                                ...jsonErrors
                            ]
                        }))


                    return Promise.reject(error);

                }

                /* Do something with response error
                   this changes from project to project depending on how your server uses response codes.
                   when you can control all errors universally from a single api, return Promise.reject(error);
                   is the way to go.
                */
                HandleResponseCodes(error.response);


                return Promise.reject(error);

            }

            console.warn("Error in axiosInterceptors.tsx - Attempting retry!!!");

            const config: AxiosRequestConfig = error.config

            // @link https://stackoverflow.com/questions/3561381/custom-http-headers-naming-conventions
            let retries = parseInt(config.headers?.['X-Retry-Count'] ?? '0');

            const maxRetries = isTest ? 5 : 3;

            // todo - handle retries better
            while (retries < maxRetries) {

                config.headers = {
                    ...config.headers,
                    'X-Retry-Count': `${++retries}`
                }

                try {

                    // @link https://stackoverflow.com/questions/51563821/axios-interceptors-retry-original-request-and-access-original-promise
                    return axios(config)

                } catch (err) {

                    error = err;

                    console.log('AXIOS ERROR', error.code, error.baseURL, error.config?.url, error.headers, error.data, error.params, error.path, error.response?.status, error.response?.statusText, error.response?.headers, error.response?.data)

                    if (false === shouldRetry(error)) {

                        break;

                    }

                }

            }

            console.log(`Too many request retries.`);

            return Promise.reject(error);

        });

}





// noinspection SpellCheckingInspection
const axiosInstance = axios.create({

    // `baseURL` will be prepended to `url` unless `url` is absolute.
    // It can be convenient to set `baseURL` for an instance of axios to pass relative URLs
    // to methods of that instance.
    baseURL: '',

    /**
     * These headers are important to use here at dig.
     * XMLHttpRequest - is a standard header all jquery ajax requests send by default. This allows our php side to return
     *                  nothing while running the get_header() and get_footer() functions with (bool) DropVariables::$ajax;
     *
     * application/json - is for the error catcher in php; this header will cause a JSON response instead of the default HTML
     */
    headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'X-Drop-In-Developer': '346991',
        'X-Github-Revision': '5671a0b5d2f37a35098327abbf3ed9518c103b88',
        'Content-Type': 'application/json'
    },


    // `paramsSerializer` is an optional function in charge of serializing `params`
    // (e.g. https://www.npmjs.com/package/qs, http://api.jquery.com/jquery.param/)
    paramsSerializer: {
        encode: function(params) {
            // Nested get params [][][,,,] do not serialize correctly without Qs
            return Qs.stringify(params, {
                arrayFormat: 'indices',
                indices: true,
                skipNulls: false,
                strictNullHandling: true
            })
        },
    },

    // `data` is the data to be sent as the request body
    // Only applicable for request methods 'PUT', 'POST', and 'PATCH'
    // When no `transformRequest` is set, must be of one of the following types:
    // - string, plain object, ArrayBuffer, ArrayBufferView, URLSearchParams
    // - Browser only: FormData, File, Blob
    // - Node only: Stream, Buffer
    // data should be default to empty for get request to serialize correctly
    data: {}, // do not change


    // `timeout` specifies the number of milliseconds before the request times out.
    // If the request takes longer than `timeout`, the request will be aborted.
    // Default is 1000, this will fail for DIG
    timeout: 120000, // shit fails

    // `withCredentials` indicates weather cross-site Access-Control requests
    // should be made using credentials
    withCredentials: false,

    // `adapter` allows custom handling of requests which makes testing easier.
    // Return a promise and supply a valid response (see lib/adapters/README.md).
    adapter: isTest ? 'http' : 'xhr',

    // `auth` indicates that HTTP Basic auth should be used, and supplies credentials.
    // This will set an `Authorization` header, overwriting any existing
    // `Authorization` custom headers you have set using `headers`.
    /*
    auth: {
        username: 'janedoe',
        password: 's00pers3cret'
    },
    */
    // `responseType` indicates the type of data that the server will respond with
    // options are 'arraybuffer', 'blob', 'document', 'json', 'text', 'stream'
    // responseType: 'json', // default

    // `responseEncoding` indicates encoding to use for decoding responses
    // Note: Ignored for `responseType` of 'stream' or client-side requests

    // `xsrfCookieName` is the name of the cookie to use as a value for xsrf token
    //xsrfCookieName: 'XSRF-TOKEN', // default

    // `xsrfHeaderName` is the name of the http header that carries the xsrf token value
    //xsrfHeaderName: 'X-XSRF-TOKEN', // default

    // `onUploadProgress` allows handling of progress events for uploads
    onUploadProgress: function () { // progressEvent
        // Do whatever you want with the native progress event
    },

    // `onDownloadProgress` allows handling of progress events for downloads
    onDownloadProgress: function () { // progressEvent
        // Do whatever you want with the native progress event
    },

    // `maxContentLength` defines the max size of the http response content in bytes allowed
    /*maxContentLength: 2000,*/

    // `validateStatus` defines whether to resolve or reject the promise for a given
    // HTTP response status code. If `validateStatus` returns `true` (or is set to `null`
    // or `undefined`), the promise will be resolved; otherwise, the promise will be
    // rejected.
    /* validateStatus: function (status) {
         return status >= 200 && status < 300;
     },*/

    // `maxRedirects` defines the maximum number of redirects to follow in node.js.
    // If set to 0, no redirects will be followed.
    maxRedirects: 2, // default

    // `socketPath` defines a UNIX Socket to be used in node.js.
    // e.g. '/var/run/docker.sock' to send requests to the docker daemon.
    // Only either `socketPath` or `proxy` can be specified.
    // If both are specified, `socketPath` is used.
    socketPath: null, // default

    // `httpAgent` and `httpsAgent` define a custom agent to be used when performing http
    // and https requests, respectively, in node.js. This allows options to be added like
    // `keepAlive` that are not enabled by default.

    /*
    httpAgent: new http.Agent({ keepAlive: true }),
    httpsAgent: new https.Agent({ keepAlive: true }),
    */

});

axiosInterceptors(axiosInstance)

export default axiosInstance



