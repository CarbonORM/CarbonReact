import {AxiosResponse} from "axios";


export default function setCookies(cookies: string[], req: AxiosResponse | undefined = undefined): void {

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
