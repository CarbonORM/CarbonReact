import CarbonReact, {iCarbonReactState, isJsonString, tStatefulApiData} from "core/CarbonReact";
import {addAlert} from "../Alert/Alert";
import {useEffectOnce} from "hooks/useEffectOnce";
import {iC6Object, isVerbose} from "@carbonorm/carbonnode";


export interface iCarbonWebSocketProps<P, S extends iCarbonReactState> {
    url?: string,
    timeoutSeconds?: number,
    heartbeatSeconds?: number,
    instance: CarbonReact<P, S>,
    C6?: iC6Object,
}

/**
 * @function connect
 * This function establishes a connection with the websocket and also ensures constant reconnection if connection closes
 **/
export function initiateWebsocket<P, S extends iCarbonReactState>(props: iCarbonWebSocketProps<P, S>) {

    let {
        instance,
        url,
        timeoutSeconds = 250,
        heartbeatSeconds = 60,
        C6
    } = props;

    if (typeof window === "undefined") {
        return;
    }

    if (!url) {
        url = 'ws' + (window.location.protocol === 'https:' ? 's' : '') + '://' + window.location.host + '/carbonorm/websocket';
    }

    const {
        TABLES = undefined,
    } = C6 ?? {};

    const verbose = isVerbose();

    const {websocket} = instance.state;


    if (!("WebSocket" in window)) {

        // todo - store that this has been shown in the state
        addAlert<P, S>({
            title: 'Browser does not support websockets, live updates will fail. You may need to refresh the page to see the newest content.',
            text: 'Please use a modern browser.',
            icon: 'warning',
            instance
        })

    }


    if (false === (undefined === websocket || null === websocket)) {

        return;

    }


    let connectInterval;

    const connection = new WebSocket(url);

    console.log("Connecting websocket url", url);

    instance.setState({
        websocket: connection
    }, () => {

        connection.onopen = () => {

            console.log('WebSocket Client Connected To :: ' + url);
            clearTimeout(connectInterval); // clear Interval on open of websocket connection

            function heartbeat() {
                const {websocket} = instance.state;
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

            instance.setState((prevState: Readonly<any>) => ({
                websocketEvents: prevState.websocketEvents.concat(message),
                websocketData: prevState.websocketData.concat(parsedData), // JSON.parse no good - base64?
            }), () => {

                if (undefined === TABLES) {

                    if (verbose) {
                        console.log('WebSocket updates without the TABLES property passed will not automatically update the state.');
                    }

                    return;

                }

                if (parsedData?.REST) {

                    const TABLE_NAME: string = parsedData?.REST?.TABLE_NAME;

                    const TABLE_PREFIX: string = parsedData?.REST?.TABLE_PREFIX ?? '';

                    const METHOD: string = parsedData?.REST?.METHOD;

                    const REQUEST: { [key: string]: any } = parsedData?.REST?.REQUEST;

                    const REQUEST_PRIMARY_KEY: {
                        [key: string]: string
                    } | null = parsedData?.REST?.REQUEST_PRIMARY_KEY ?? null;
                    const RESPONSE_PRIMARY_KEY: {
                        [key: string]: string
                    } | null = parsedData?.REST?.RESPONSE_PRIMARY_KEY ?? null;
                    const RESPONSE = parsedData?.REST?.RESPONSE ?? null;

                    const TABLE_NAME_SHORT = TABLE_NAME.startsWith(TABLE_PREFIX)
                        ? TABLE_NAME.substring(TABLE_PREFIX.length)
                        : TABLE_NAME;

                    const currentCache: tStatefulApiData<{ [key: string]: any }> = instance.state[TABLE_NAME_SHORT]

                    // just because we have a websocket update, doesn't mean we need the update
                    // check to see if the primary key is in the current cache
                    const c6Table = TABLES[TABLE_NAME_SHORT] ?? null;

                    if (null === c6Table) {

                        if (verbose) {
                            console.error('WebSocket update could not find (' + TABLE_NAME_SHORT + ') in the TABLES property passed.', TABLES);
                        }

                        return;

                    }

                    const columns = c6Table.COLUMNS as Record<string, string>;
                    const validColumns = new Set(Object.values(columns));

                    const normalizeRecord = (record: { [key: string]: any } | null | undefined) => {
                        const normalized: { [key: string]: any } = {};
                        for (const [key, value] of Object.entries(record ?? {})) {
                            const shortKey = columns[key] ?? (key.includes('.') ? key.split('.').pop()! : key);
                            if (validColumns.has(shortKey)) {
                                normalized[shortKey] = value;
                            }
                        }
                        return normalized;
                    };

                    const normalizedPrimaryKey = normalizeRecord(REQUEST_PRIMARY_KEY ?? {});
                    const normalizedResponsePrimaryKey = normalizeRecord(RESPONSE_PRIMARY_KEY ?? {});
                    const primaryKeyKeys = Object.keys(
                        Object.keys(normalizedPrimaryKey).length
                            ? normalizedPrimaryKey
                            : normalizedResponsePrimaryKey
                    );

                    if (primaryKeyKeys.length === 0) {
                        if (verbose) {
                            console.error('WebSocket update could not map primary keys for', TABLE_NAME_SHORT, REQUEST_PRIMARY_KEY, RESPONSE_PRIMARY_KEY);
                        }
                        return;
                    }

                    // todo - which direction should we filter
                    const elementsToUpdate = currentCache?.filter((row: any) =>
                        primaryKeyKeys.every((key) => {
                            const expected =
                                normalizedPrimaryKey[key] ?? normalizedResponsePrimaryKey[key];
                            return expected === row[key];
                        })
                    ) ?? []

                    if (verbose) {
                        console.log('elementsToUpdate', elementsToUpdate);
                    }

                    if (elementsToUpdate.length === 0) {
                        if (RESPONSE) {
                            const responseRows = Array.isArray(RESPONSE) ? RESPONSE : [RESPONSE];
                            const normalizedResponseRows = responseRows.map((row) => normalizeRecord(row as any));
                            instance.updateRestfulObjectArrays({
                                dataOrCallback: normalizedResponseRows,
                                stateKey: TABLE_NAME_SHORT as any,
                                uniqueObjectId: c6Table.PRIMARY_SHORT as any,
                            });
                            return;
                        }

                        if (verbose) {
                            console.error('Could not find any elements to update in the cache.', elementsToUpdate, primaryKeyKeys, REQUEST_PRIMARY_KEY, currentCache);
                        }
                        return;
                    }

                    const normalizedRequest = normalizeRecord(REQUEST);
                    const updatedElements = elementsToUpdate.map((row: any) => ({
                        ...row,
                        ...normalizedRequest,
                    }));

                    switch (METHOD) {
                        case 'POST':
                        case 'PUT':
                            instance.updateRestfulObjectArrays({
                                dataOrCallback: updatedElements,
                                stateKey: TABLE_NAME_SHORT as any,
                                uniqueObjectId: c6Table.PRIMARY_SHORT as any,
                            });
                            break;
                        case 'DELETE':
                            instance.deleteRestfulObjectArrays({
                                dataOrCallback: elementsToUpdate,
                                stateKey: TABLE_NAME_SHORT as any,
                                uniqueObjectId: c6Table.PRIMARY_SHORT as any,
                            });
                            break;
                        default:
                            if (verbose) {
                                console.error('Method not supported', METHOD);
                            }
                    }

                }

            });

        };

        window.addEventListener("focus", () => initiateWebsocket(props));

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

                connectInterval = setTimeout(() => initiateWebsocket(props), retrySeconds);

            }

            if (event.code === 1000) {
                console.log("WebSocket: closed cleanly");
                return;
            }

            switch (event.code) {
                case 1006:
                    reason = "Abnormal closure";
                    break;
                case 1001:
                    reason = "Going away";
                    break;
                case 1011:
                    reason = "Internal server error";
                    break;
                default:
                    reason = "Unknown";
            }

            console.log(`WebSocket: closed with code ${event.code} (${reason})`)

            retry();

        });

        // websocket onerror event listener
        connection.addEventListener('websocket error', (e: Event) => {
            console.error("WebSocket error observed:", e);
        });

    });

}

export default function <P, S extends iCarbonReactState>(props: iCarbonWebSocketProps<P, S>) {

    useEffectOnce(() => {
        initiateWebsocket(props);
    })

    return null;
}
