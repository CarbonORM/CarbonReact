import CarbonReact, {isJsonString} from "CarbonReact";
import {addAlert} from "../Alert/Alert";
import {useEffectOnce} from "../../api/hoc/useEffectOnce";
import {tC6Tables, tWsLiveUpdate} from "@carbonorm/carbonnode";


export interface iCarbonWebSocketProps {
    url?: string,
    timeoutSeconds?: number,
    heartbeatSeconds?: number,
    TABLES?: tC6Tables,
    WsLiveUpdates?: tWsLiveUpdate,
}

/**
 * @function connect
 * This function establishes a connection with the websocket and also ensures constant reconnection if connection closes
 **/
export function initiateWebsocket({
                                      TABLES = undefined,
                                      WsLiveUpdates = undefined,
                                      url = 'ws://localhost:8080/ws',
                                      timeoutSeconds = 250,
                                      heartbeatSeconds = 60
                                  }: iCarbonWebSocketProps = {}) {

    const {websocket} = CarbonReact.instance.state;

    if (!("WebSocket" in window)) {

        // todo - store that this has been shown in the state
        addAlert({
            title: 'Browser does not support websockets, live updates will fail. You may need to refresh the page to see the newest content.',
            text: 'Please use a modern browser.',
            icon: 'warning',
        })

    }

    if (false === (undefined === websocket || null === websocket)) {

        return;

    }


    let connectInterval;

    const connection = new WebSocket(url);

    console.log("Connecting websocket url", url);

    CarbonReact.instance.setState({
        websocket: connection
    }, () => {

        connection.onopen = () => {

            console.log('WebSocket Client Connected To :: ' + url);

            clearTimeout(connectInterval); // clear Interval on open of websocket connection

            function heartbeat() {

                const {websocket} = CarbonReact.instance.state;

                if (!websocket) return;

                if (websocket.readyState !== 1) return;

                websocket.send("ping");

                setTimeout(heartbeat, heartbeatSeconds * 1000);

            }

            heartbeat();

        };

        connection.onmessage = (message: MessageEvent<string>) => {

            const parsedData = isJsonString(message?.data) ? JSON.parse(message?.data) : message?.data;

            if (message.data === 'pong') {
                return;
            }

            CarbonReact.instance.setState((prevState: Readonly<any>) => ({
                websocketEvents: prevState.websocketEvents.concat(message),
                websocketData: prevState.websocketData.concat(parsedData), // JSON.parse no good - base64?
            }), () => {

                if (undefined === TABLES) {

                    console.log('WebSocket updates without the TABLES property passed will not automatically update the state.')

                    return;

                }

                if (undefined === WsLiveUpdates) {

                    console.log('WebSocket updates without the WsLiveUpdates property passed will not automatically update the state.')

                    return;

                }

                if (parsedData?.REST) {

                    const TABLE_NAME: string = parsedData?.REST?.TABLE_NAME;

                    const TABLE_PREFIX: string = parsedData?.REST?.TABLE_PREFIX;

                    const METHOD: string = parsedData?.REST?.METHOD;

                    const REQUEST: { [key:string]: any } = parsedData?.REST?.REQUEST;

                    const REQUEST_PRIMARY_KEY: {
                        [key: string]: string
                    } = parsedData?.REST?.REQUEST_PRIMARY_KEY ?? null;

                    if (null === REQUEST_PRIMARY_KEY) {

                        console.log('WebSocket updates without a primary key are not yet supported.')

                        return;

                    }

                    console.log('todo - going to impl REST', TABLE_NAME, METHOD, REQUEST_PRIMARY_KEY, parsedData?.REST)

                    const TABLE_NAME_SHORT = TABLE_NAME.substring(TABLE_PREFIX.length);

                    const currentCache: [] = CarbonReact.instance.state[TABLE_NAME_SHORT]

                    // just because we have a websocket update, doesn't mean we need the update
                    // check to see if the primary key is in the current cache
                    const c6Table = TABLES[TABLE_NAME_SHORT] ?? null;

                    if (null === c6Table) {

                        console.error('WebSocket update could not find (' + TABLE_NAME_SHORT + ') in the TABLES property passed.', TABLES)

                        return;

                    }

                    const primaryKeyKeys = Object.keys(REQUEST_PRIMARY_KEY)

                    const elementsToUpdate = currentCache.filter((row: any) => {
                        for (const element of primaryKeyKeys) {
                            if (REQUEST_PRIMARY_KEY[element] !== row[element]) {
                                return false
                            }
                        }
                        return true
                    })


                    const updatedElements = elementsToUpdate.map((row: any) => {
                        return {
                            ...row,
                            ...REQUEST
                        }
                    })

                    WsLiveUpdates[TABLE_NAME_SHORT][METHOD]({}, updatedElements)

                }

            });

        };

        window.addEventListener("focus", () => initiateWebsocket());

        // websocket onclose event listener
        connection.addEventListener('close', event => {

            let reason;

            console.log(
                `Socket is closed.`,
                event.reason, event);

            const retry = () => {

                const retrySeconds = Math.min(5000, (timeoutSeconds + timeoutSeconds) * 1000)

                timeoutSeconds = retrySeconds;

                console.log(`WebSocket reconnect will be attempted in ${retrySeconds} second(s).`)

                connectInterval = setTimeout(() => initiateWebsocket(), retrySeconds);

            }

            // See https://www.rfc-editor.org/rfc/rfc6455#section-7.4.1
            switch (event.code) {
                case 1000:
                    reason = "Normal closure, meaning that the purpose for which the connection was established has been fulfilled.";
                    break;
                case 1001:
                    retry(); //call check function after timeout
                    reason = "An endpoint is \"going away\", such as a server going down or a browser having navigated away from a page.";
                    break;
                case 1002:
                    reason = "An endpoint is terminating the connection due to a protocol error";
                    break;
                case 1003:
                    reason = "An endpoint is terminating the connection because it has received a type of data it cannot accept (e.g., an endpoint that understands only text data MAY send this if it receives a binary message).";
                    break;
                case 1004:
                    reason = "Reserved. The specific meaning might be defined in the future.";
                    break;
                case 1005:
                    reason = "No status code was actually present.";
                    break;
                case 1006:
                    retry();
                    reason = "The connection was closed abnormally, e.g., without sending or receiving a close control frame";
                    break;
                case 1007:
                    reason = "An endpoint is terminating the connection because it has received data within a message that was not consistent with the type of the message (e.g., non-UTF-8 [https://www.rfc-editor.org/rfc/rfc3629] data within a text message).";
                    break;
                case 1008:
                    reason = "An endpoint is terminating the connection because it has received a message that \"violates its policy\". This reason is given either if there is no other suitable reason, or if there is a need to hide specific details about the policy.";
                    break;
                case 1009:
                    reason = "An endpoint is terminating the connection because it has received a message that is too big for it to process.";
                    break;
                case 1010:
                    reason = "An endpoint (client) is terminating the connection because it has expected the server to negotiate one or more extension, but the server didn't return them in the response message of the WebSocket handshake. <br /> Specifically, the extensions that are needed are: " + event.reason;
                    break;
                case 1011:
                    reason = "A server is terminating the connection because it encountered an un expected condition that prevented it from fulfilling the request.";
                    break;
                case 1015:
                    reason = "The connection was closed due to a failure to perform a TLS handshake (e.g., the server certificate can't be verified).";
                    break;
                default:
                    reason = "Unknown reason";
            }

            console.log("The connection was closed for reason: " + reason);

        });

        // websocket onerror event listener
        connection.addEventListener('websocket error', (e: Event) => {
            console.error("Socket encountered error: ", e, JSON.stringify(e));
            connection.close();
        });

    });

}

export default function (props: iCarbonWebSocketProps) {

    useEffectOnce(() => {

        initiateWebsocket(props)

    })

    return null

}