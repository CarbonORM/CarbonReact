import {clearCache} from "@carbonorm/carbonnode";
import changed from "hoc/changed";
import {GlobalHistory} from "hoc/GlobalHistory";
import hexToRgb from "hoc/hexToRgb";
import {Component, ReactNode} from 'react';
import {BrowserRouter} from 'react-router-dom';
import {ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.min.css';
import BackendThrowable from 'components/Errors/BackendThrowable';
import Nest from 'components/Nest/Nest';
import {initialRestfulObjectsState, iRestfulObjectArrayTypes} from "variables/C6";



// our central container, single page application is best with the DigApi
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

const CarbonReact= class <P = {}, S = {}> extends Component<{
    children?: ReactNode | ReactNode[],
} & P, S & iCarbonReactState> {

    static instance: Component<{
        children?: ReactNode | ReactNode[],
    } & any, any & iCarbonReactState>;

    static lastLocation = window.location.pathname;

    // @link https://github.com/welldone-software/why-did-you-render
    // noinspection JSUnusedGlobalSymbols
    static whyDidYouRender = true;

    constructor(props) {

        super(props);

        this.state = initialCarbonReactState as unknown as S & iCarbonReactState;

        // This should only ever be done here, when the full state is being trashed.
        clearCache({
            ignoreWarning: true
        });

        /** We can think of our app as having one state; this state.
         * Long-term, I'd like us to store this state to local storage and only load updates on reload...
         * Class based components are far easier to manage state in local storage and pass state down to children.
         * Children, if not faced with a local storage or other complexity should be a functional component. Functional
         * components' tend to be shorter syntactically and bonus points if it's stateless.
         **/

    }

    static getState<S>() : S {
        return CarbonReact.instance.state;
    }

    websocketTimeout = 5000;

    shouldComponentUpdate(
        nextProps: Readonly<any>,
        nextState: Readonly<iCarbonReactState>,
        _nextContext: any): boolean {

        changed(this.constructor.name + ' (DigApi)', 'props', this.props, nextProps);
        changed(this.constructor.name + ' (DigApi)', 'state', this.state, nextState);

        return true

    }

    componentDidUpdate(_prevProps: Readonly<any>, _prevState: Readonly<iCarbonReactState>, _snapshot?: any) {
        if (CarbonReact.lastLocation !== location.pathname) {
            CarbonReact.lastLocation = location.pathname;
            const websocket = this.state.websocket;
            if (websocket?.readyState === WebSocket.OPEN) {
                websocket.send(location.pathname);
                console.log(location.pathname);
            }
        }
    }

    render() {

        console.log('CarbonORM TSX RENDER');

        const colorHex = '#' + Math.random().toString(16).slice(-6);

        console.log('%c color (' + colorHex + ')', 'color: ' + colorHex);

        const nest = <Nest position={'fixed'} backgroundColor={''} color={hexToRgb(colorHex)} count={100}/>;

        if (this.state.backendThrowable.length > 0) {

            return <>
                {nest}
                <BackendThrowable/>
            </>;

        }

        return <BrowserRouter>
            <GlobalHistory/>
            {this.props.children}
            <ToastContainer/>
        </BrowserRouter>;

    }

}

export default CarbonReact;
