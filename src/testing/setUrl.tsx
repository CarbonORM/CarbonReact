// @link https://www.benmvp.com/blog/mocking-window-location-methods-jest-jsdom/
import {axiosInstance} from "@carbonorm/carbonnode";

export default function setUrl(host: string = 'www.example.com', https: boolean = false) {

    if (!global.structuredClone){

        global.structuredClone = function structuredClone(objectToClone: any) {
            const stringify = JSON.stringify(objectToClone);
            return JSON.parse(stringify);
        }

    }

    // noinspection HttpUrlsUsage
    axiosInstance.defaults.baseURL = 'http' + (https ? 's' : '') + '://' + host + '/';

    Object.defineProperty(global.window, 'location', {
        writable: true,
        value: {
            hash: '',
            host: host,
            hostname: host,
            port: '80',
            protocol: 'http:',
            href: axiosInstance.defaults.baseURL,
            origin: axiosInstance.defaults.baseURL,
            pathname: '/',
            search: '',
            toString: () => {
                return global.window.location.href
            }
        }
    });

    console.log(global.window.location)

}