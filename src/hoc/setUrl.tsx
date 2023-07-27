// @link https://www.benmvp.com/blog/mocking-window-location-methods-jest-jsdom/
import AxiosContext from "variables/AxiosContext";

export default function setUrl() {

    const isGitHubActions = process.env.REACT_APP_TEST_REMOTE === 'true'

    const host = ( isGitHubActions ? process.env.REACT_APP_REMOTE_SUBDOMAIN : process.env.REACT_APP_LOCAL_SUBDOMAIN ) + '.dropingaming.com' + (isGitHubActions ? '' : ':8080')

    console.log("test host:: ", host, isGitHubActions)

    /*Object.defineProperty(global, 'window', {
        writable: true,
        value: Object.create(window)
    });*/

    if (!global.structuredClone){

        global.structuredClone = function structuredClone(objectToClone: any) {
            const stringify = JSON.stringify(objectToClone);
            return JSON.parse(stringify);
        }

    }

    // noinspection HttpUrlsUsage
    AxiosContext.axiosInstance.defaults.baseURL = 'http' + (isGitHubActions ? 's' : '') + '://' + host + '/';

    Object.defineProperty(global.window, 'location', {
        writable: true,
        value: {
            hash: '',
            host: host,
            hostname: host,
            port: '80',
            protocol: 'http:',
            href: AxiosContext.axiosInstance.defaults.baseURL,
            origin: AxiosContext.axiosInstance.defaults.baseURL,
            pathname: '/',
            search: '',
            toString: () => {
                return global.window.location.href
            }
        }
    });

    console.log(global.window.location)

}