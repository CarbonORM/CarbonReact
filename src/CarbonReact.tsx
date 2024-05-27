import { clearCache } from "@carbonorm/carbonnode";
import changed from "hoc/changed";
import { GlobalHistory } from "hoc/GlobalHistory";
import hexToRgb from "hoc/hexToRgb";
import { Component, Context, createContext, ReactElement, ReactNode } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.min.css';
import BackendThrowable from 'components/Errors/BackendThrowable';
import Nest from 'components/Nest/Nest';
import { initialRestfulObjectsState, iRestfulObjectArrayTypes } from "variables/C6";
import CarbonWebSocket, { iCarbonWebSocketProps } from "./components/WebSocket/CarbonWebSocket";
import updateRestfulObjectArrays, { iUpdateRestfulObjectArrays } from "./hoc/updateRestfulObjectArrays";
import deleteRestfulObjectArrays, { iDeleteRestfulObjectArrays } from "./hoc/deleteRestfulObjectArrays";


export type tStatefulApiData<T extends {
    [key: string]: any
} = {}> = T[] | undefined | null;

// our central container, single page application
export interface iCarbonReactState {
    alertsWaiting: any[],
    websocketEvents: MessageEvent[],
    websocketData: any[],
    websocket?: WebSocket,
    backendThrowable: any[],
}

export const initialRequiredCarbonORMState: iCarbonReactState = {
    alertsWaiting: [],
    backendThrowable: [],
    websocketData: [],
    websocketEvents: [],
}

export const initialCarbonReactState: iCarbonReactState & iRestfulObjectArrayTypes = {
    ...initialRequiredCarbonORMState,
    ...initialRestfulObjectsState,
}

// @link https://stackoverflow.com/questions/3710204/how-to-check-if-a-string-is-a-valid-json-string
export function isJsonString(str: string) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

abstract class CarbonReact<P = {}, S extends iCarbonReactState = iCarbonReactState> extends Component<{
    children?: ReactNode | ReactNode[],
    instanceId?: string,
    websocket?: Omit<iCarbonWebSocketProps<P, S>, "instance"> | false
} & P, S> {

    private static persistentStateMap = new Map<string, { [key: string]: any; }>();
    private static activeInstances = new Map<string, CarbonReact<any, any>>();

    context: Context<S & iCarbonReactState> = createContext(this.state);
    protected target: typeof CarbonReact;

    protected static _instance: ThisType<CarbonReact<any, any>>;

    static getInstance<T extends CarbonReact<any, any>>(): T {
        return this._instance as T;
    }
    static get instance() {
        return this.getInstance();
    }
    static set instance(instance: CarbonReact<any, any>) {
        this._instance = instance;
    }

    public updateRestfulObjectArrays = <ObjectType extends { [key: string]: any; } = {}>
    (rest: Omit<iUpdateRestfulObjectArrays<ObjectType, S, P>, "instance">) => updateRestfulObjectArrays<ObjectType, S, P>({
        instance: this,
        ...rest
    });

    public deleteRestfulObjectArrays = <ObjectType extends { [key: string]: any } = {}>
    (rest: Omit<iDeleteRestfulObjectArrays<ObjectType, S, P>, "instance">) => deleteRestfulObjectArrays<ObjectType, S, P>({
        instance: this,
        ...rest
    });

    static lastLocation = window.location.pathname;

    static whyDidYouRender = true;

    protected constructor(props: {
        children?: ReactNode | ReactNode[];
        shouldStatePersist?: boolean | undefined;
        websocket?: boolean | iCarbonWebSocketProps<P, S> | undefined;
        instanceId?: string; // Optional instanceId from props
    } & P) {
        super(props);

        const target = new.target as typeof CarbonReact;
        const identifier = props.instanceId || target.name;

        if (CarbonReact.activeInstances.has(identifier)) {
            throw new Error(`Instance with ID ${identifier} already exists! CarbonReact extended classes can only be referenced once in DOM with the same identifier.`);
        }

        CarbonReact.activeInstances.set(identifier, this);

        this.target = target;
        console.log('CarbonORM TSX CONSTRUCTOR');

        Object.assign(target, {
            _instance: this
        });

        if (CarbonReact.persistentStateMap.has(identifier)) {
            this.state = CarbonReact.persistentStateMap.get(identifier) as S & iCarbonReactState;
        } else {
            clearCache({
                ignoreWarning: true
            });
            this.state = initialCarbonReactState as unknown as S & iCarbonReactState;
        }

        // Save the initial state to the persistent state map with the identifier
        CarbonReact.persistentStateMap.set(identifier, this.state);
    }

    shouldComponentUpdate(
        nextProps: Readonly<P>,
        nextState: Readonly<S>,
        _nextContext: any): boolean {

        const identifier = this.props.instanceId || (this.constructor as typeof CarbonReact).name;
        CarbonReact.persistentStateMap.set(identifier, nextState);

        changed(this.constructor.name + ' (C6Api)', 'props', this.props, nextProps);
        changed(this.constructor.name + ' (C6Api)', 'state', this.state, nextState);

        return true;
    }

    componentDidUpdate(_prevProps: Readonly<P>, _prevState: Readonly<S>, _snapshot?: any) {
        if (CarbonReact.lastLocation !== location.pathname) {
            CarbonReact.lastLocation = location.pathname;
            const websocket = this.state.websocket;
            if (websocket?.readyState === WebSocket.OPEN) {
                websocket.send(location.pathname);
                console.log(location.pathname);
            }
        }
    }

    render(): ReactElement {
        console.log('CarbonORM TSX RENDER');

        const colorHex = '#' + Math.random().toString(16).slice(-6);

        console.log('%c color (' + colorHex + ')', 'color: ' + colorHex);

        const nest = <Nest position={'fixed'} backgroundColor={''} color={hexToRgb(colorHex)} count={100} />;

        if (this.state.backendThrowable.length > 0) {
            return <>
                {nest}
                <BackendThrowable instance={this} />
            </>;
        }

        const Context = this.context.Provider;

        return <>
            <GlobalHistory />
            {this.props.websocket &&
                <CarbonWebSocket<P, S> {...(false !== this.props.websocket ? this.props.websocket : {})}
                                       instance={this} />}
            <Context value={this.state}>
                {this.props.children}
            </Context>
            <ToastContainer />
        </>;
    }

    componentWillUnmount() {
        const identifier = this.props.instanceId || (this.constructor as typeof CarbonReact).name;
        CarbonReact.activeInstances.delete(identifier);
    }
}

export default CarbonReact;
