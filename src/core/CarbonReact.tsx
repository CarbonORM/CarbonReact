import changed from "utils/changed";
import {GlobalHistory} from "routing/GlobalHistory";
import {Component, Context, createContext, ReactElement, ReactNode} from 'react';
import {ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import BackendThrowable from 'components/Errors/BackendThrowable';
import {initialRestfulObjectsState, iRestfulObjectArrayTypes} from "schema/C6";
import CarbonWebSocket, {iCarbonWebSocketProps} from "components/WebSocket/CarbonWebSocket";
import updateRestfulObjectArrays, {iUpdateRestfulObjectArrays} from "state/updateRestfulObjectArrays";
import deleteRestfulObjectArrays, {iDeleteRestfulObjectArrays} from "state/deleteRestfulObjectArrays";
import { iStateAdapter } from "state/stateAdapter";
import {BrowserRouter, HashRouter, MemoryRouter} from "react-router-dom";

export type tStatefulApiData<T extends { [key: string]: any } = {}> = T[] | undefined | null;

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

export enum eRouterType {
    BrowserRouter,
    HashRouter,
    MemoryRouter,
}

const canUseDom = () => typeof window !== "undefined" && typeof document !== "undefined";

abstract class CarbonReact<P = {}, S extends iCarbonReactState = iCarbonReactState> extends Component<{
    children?: ReactNode | ReactNode[],
    instanceId?: string,
    persistentState?: boolean,
    routerType?: eRouterType,
    websocket?: Omit<iCarbonWebSocketProps<P, S>, "instance"> | false,
    stateAdapter?: iStateAdapter<S>
} & P, S> {

    private static allInstances = new Map<string, CarbonReact<any, any>>();

    context: Context<S & iCarbonReactState> = createContext(this.state);
    protected target: typeof CarbonReact;

    protected static _instance: ThisType<CarbonReact<any, any>>;

    static getInstance<T extends CarbonReact<any, any>>(instanceId?: string): T {

        const identifier = this.generateIdentifier(instanceId);

        if (undefined !== instanceId) {
            if (CarbonReact.allInstances.has(identifier)) {
                return CarbonReact.allInstances.get(identifier) as T;
            }
            throw new Error(`No instance has been instantiated yet for class (${this.name}) with instanceId (${instanceId})`);
        }

        if (!this._instance) {
            throw new Error(`No instance has been instantiated yet for class (${this.name})`);
        }

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

    static lastLocation = typeof window === "undefined" ? "" : window.location.pathname;

    static whyDidYouRender = true;

    protected constructor(props: {
        children?: ReactNode | ReactNode[];
        websocket?: boolean | iCarbonWebSocketProps<P, S> | undefined;
        instanceId?: string; // Optional instanceId from props
        persistentState?: boolean; // Optional persistentState from props
        stateAdapter?: iStateAdapter<S>;
    } & P) {
        super(props);

        const identifier = this.generateIdentifier();

        if (props.persistentState && CarbonReact.allInstances.has(identifier)) {
            // Reuse the state from the existing instance
            this.state = CarbonReact.allInstances.get(identifier)!.state as S & iCarbonReactState;
        } else {
            this.state = initialCarbonReactState as unknown as S & iCarbonReactState;
            CarbonReact.allInstances.set(identifier, this);
        }

        this.target = new.target;
        this.stateAdapter = props.stateAdapter;

        Object.assign(this.target, {
            _instance: this
        });
    }

    public stateAdapter?: iStateAdapter<S>;

    private static generateIdentifier(instanceId?: string): string {
        const className = this.name;
        return instanceId ? `${className}-${instanceId}` : className;
    }

    private generateIdentifier(): string {
        const className = (this.constructor as typeof CarbonReact).name;
        return this.props.instanceId ? `${className}-${this.props.instanceId}` : className;
    }

    shouldComponentUpdate(
        nextProps: Readonly<P>,
        nextState: Readonly<S>,
        _nextContext: any): boolean {

        changed(this.constructor.name + ' (C6Api)', 'props', this.props, nextProps);
        changed(this.constructor.name + ' (C6Api)', 'state', this.state, nextState);

        return true;
    }

    componentDidUpdate(_prevProps: Readonly<P>, _prevState: Readonly<S>, _snapshot?: any) {
        if (typeof location !== "undefined" && CarbonReact.lastLocation !== location.pathname) {
            CarbonReact.lastLocation = location.pathname;
            const websocket = this.state.websocket;
            if (typeof WebSocket !== "undefined" && websocket?.readyState === WebSocket.OPEN) {
                websocket.send(location.pathname);
                console.log(location.pathname);
            }
        }
    }

    reactRouterContext(children: ReactElement) {
        const routerType = this.props.routerType ?? (canUseDom() ? eRouterType.BrowserRouter : eRouterType.MemoryRouter);
        switch (routerType) {
            case eRouterType.BrowserRouter:
                return <BrowserRouter>{children}</BrowserRouter>
            case eRouterType.MemoryRouter:
                return <MemoryRouter initialEntries={['/']}>{children}</MemoryRouter>
            case eRouterType.HashRouter:
                return <HashRouter>{children}</HashRouter>
            default:
                throw new Error('Invalid routerType');
        }
    }

    render(): ReactElement {
        console.log('CarbonORM TSX RENDER');

        const canUseDomNow = canUseDom();

        if (this.state.backendThrowable.length > 0) {
            return <BackendThrowable instance={this}/>;
        }

        this.context = createContext(this.state)
        const Context = this.context.Provider;

        return this.reactRouterContext(<>
            {canUseDomNow && <GlobalHistory/>}
            {canUseDomNow && this.props.websocket &&
                <CarbonWebSocket<P, S> {...(false !== this.props.websocket ? this.props.websocket : {})}
                                       instance={this}/>}
            <Context value={this.state}>
                {this.props.children}
            </Context>
            {canUseDomNow && <ToastContainer/>}
        </>);
    }
}

export default CarbonReact;
