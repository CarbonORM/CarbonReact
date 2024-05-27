import {clearCache} from "@carbonorm/carbonnode";
import changed from "hoc/changed";
import {GlobalHistory} from "hoc/GlobalHistory";
import hexToRgb from "hoc/hexToRgb";
import {Component, Context, createContext, ReactElement, ReactNode} from 'react';
import {ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.min.css';
import BackendThrowable from 'components/Errors/BackendThrowable';
import Nest from 'components/Nest/Nest';
import {initialRestfulObjectsState, iRestfulObjectArrayTypes} from "variables/C6";
import CarbonWebSocket, {iCarbonWebSocketProps} from "./components/WebSocket/CarbonWebSocket";
import updateRestfulObjectArrays, {iUpdateRestfulObjectArrays} from "./hoc/updateRestfulObjectArrays";
import deleteRestfulObjectArrays, {iDeleteRestfulObjectArrays} from "./hoc/deleteRestfulObjectArrays";


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
    websocket?: Omit<iCarbonWebSocketProps<P,S>, "instance"> | false
} & P, S> {

    private static persistentStateMap = new Map<string, { [key: string]: any; }>();

    // Context is for functional components to access the state of this class efficiently
    context: Context<S & iCarbonReactState> = createContext(this.state);

    protected target: typeof CarbonReact;

    protected static _instance: typeof this;

    static get instance()  {
        return this;
    }

    static set instance(instance: typeof this) {
        this._instance = instance;
    }


    protected updateRestfulObjectArrays = <ObjectType extends { [key: string]: any; } = {}>
    (rest: Omit<iUpdateRestfulObjectArrays<ObjectType, S, P>, "instance">) => updateRestfulObjectArrays<ObjectType, S, P>({
        instance: this,
        ...rest
    });

    protected deleteRestfulObjectArrays = <ObjectType extends { [key: string]: any } = {}>
    (rest: Omit<iDeleteRestfulObjectArrays<ObjectType, S, P>, "instance">) => deleteRestfulObjectArrays<ObjectType, S, P>({
        instance: this,
        ...rest
    });

    static lastLocation = window.location.pathname;

    // @link https://github.com/welldone-software/why-did-you-render
    // noinspection JSUnusedGlobalSymbols
    static whyDidYouRender = true;


    protected constructor(props: {
        children?: ReactNode | ReactNode[];
        shouldStatePersist?: boolean | undefined;
        websocket?: boolean | iCarbonWebSocketProps<P,S> | undefined;
    } & P) {

        super(props);

        this.target = new.target;

        console.log('CarbonORM TSX CONSTRUCTOR');

        // this is the magic that allows each class that's extends this to have a static instance - a singleton pattern
        // new.target is a meta-property introduced in ES6 that references the constructor that was directly invoked with the new keyword.
        Object.assign(new.target, {
            _instance: this
        })

        if (this.props.instanceId && CarbonReact.persistentStateMap.has(this.props.instanceId)) {

            this.state = CarbonReact.persistentStateMap.get(this.props.instanceId) as S & iCarbonReactState;

        } else {

            // This should only ever be done here, when the full state is being trashed.
            // todo - does this suck in context of multiple instances?
            clearCache({
                ignoreWarning: true
            });

            this.state = initialCarbonReactState as unknown as S & iCarbonReactState;

        }

        /** We can think of our app as having one state; this state.
         * Long-term, I'd like us to store this state to local storage and only load updates on reload...
         * Class based components are far easier to manage state in local storage and pass state down to children.
         * Children, if not faced with a local storage or other complexity should be a functional component. Functional
         * components' tend to be shorter syntactically and bonus points if it's stateless.
         **/

    }


    shouldComponentUpdate(
        nextProps: Readonly<P>,
        nextState: Readonly<S>,
        _nextContext: any): boolean {

        if (this.props.instanceId) {
            CarbonReact.persistentStateMap.set(this.props.instanceId, nextState);
        }

        changed(this.constructor.name + ' (C6Api)', 'props', this.props, nextProps);

        changed(this.constructor.name + ' (C6Api)', 'state', this.state, nextState);

        return true

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

        const nest = <Nest position={'fixed'} backgroundColor={''} color={hexToRgb(colorHex)} count={100}/>;

        if (this.state.backendThrowable.length > 0) {

            return <>
                {nest}
                <BackendThrowable instance={this}/>
            </>;

        }

        const Context = this.context.Provider;

        return <>
            <GlobalHistory/>
            {this.props.websocket &&
                <CarbonWebSocket<P,S> {...(false !== this.props.websocket ? this.props.websocket : {})}
                                 instance={this}/>}
            <Context value={this.state}>
                {this.props.children}
            </Context>
            <ToastContainer/>
        </>;

    }

}

export default CarbonReact;
