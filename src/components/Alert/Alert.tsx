import classNames from "classnames";
import CarbonReact from "CarbonReact";
import {ReactNode} from "react";
import Popup from "components/Popup/Popup";
import  getStyles from "hoc/getStyles";
import {faClose} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import isProduction from "variables/isProduction";

//  'digBtnBlue': string;
//   'digBtnGreen': string;
//   'digBtnLightRed': string;
//   'digBtnRed': string;
export interface iAlertButtonOptions {
    text: string,
    value?: string,
    className?: string,
    color: "default" | "primary" | "secondary" | "inherit" | "danger" | "info" | "success" | "warning" | undefined,
}

export function addAlert(props: iAlert) {

    CarbonReact.instance.setState(previousState => ({
        alertsWaiting: previousState.alertsWaiting.length === 0
            ? [props]
            : [...previousState.alertsWaiting, props]
    }))

}

export interface iAlert {
    title: string,
    text: string,
    component?: ReactNode,
    icon?: "warning" | "error" | "success" | "info" | "question" | null,
    buttons?: (iAlertButtonOptions)[] | undefined, //['No thanks!', 'Yes, Delete it'],
    dangerMode?: true,
    then?: (value: string | undefined) => void,
    timeout?: number,
    footerText?: string,

    intercept?: boolean,
    backendThrowable?: { [key: string]: any },
}

export default function Alert() {

    const {alertsWaiting, backendThrowable} = CarbonReact.instance.state

    let alert: iAlert | undefined = undefined;

    const alertWaiting = alertsWaiting.length + backendThrowable.length

    if (backendThrowable.length !== 0) {

        const buttons: iAlertButtonOptions[] = [{
            text: 'Close',
            color: 'danger',
        }];

        const hideExpandInformation = isProduction

        if (false === hideExpandInformation) {
            buttons.push({
                text: 'Expand',
                color: 'primary',
            })
        }

        const backendThrowable = CarbonReact.instance.state.backendThrowable[0]

        alert = {
            title: "Oh no! An issue occurred!",
            text: backendThrowable?.['DropInGaming\\PHP\\Errors\\DropException'] ?? 'An unknown issue occurred. Please try again.',
            timeout: 0,
            footerText: hideExpandInformation ? '' : 'These alert footer options are only shown to admins and in development environments. Click "Expand" to see more details.',
            buttons: buttons,
            // backendThrowable has its own custom component that can be expanded (called in the Bootstrap component)
            // our then function will be called when the user clicks on the button providing the option to expand or close
            backendThrowable: backendThrowable,
            then: (value: string | undefined) => {

                if (value === 'Expand') {

                    CarbonReact.instance.setState(previousState => {

                        let backendThrowable = previousState.backendThrowable.pop()

                        if (backendThrowable === undefined) {
                            return {
                                backendThrowable: []
                            }
                        }

                        backendThrowable.expanded = true

                        return {
                            backendThrowable: [backendThrowable, ...(previousState.backendThrowable ?? [])]
                        }
                    })

                } else {
                    CarbonReact.instance.setState(previousState => ({
                        backendThrowable: previousState.backendThrowable.slice(1)
                    }))
                }
            }
        }

    } else if (alertsWaiting.length !== 0) {

        alert = alertsWaiting[0]

    }

    if (alert === undefined) {

        return null

    }

    const timeout = alert?.timeout || 15000

    const bootstrap = CarbonReact.instance

    const dig = getStyles()

    let cancelTimeout: any = null

    const handleClose = () => {
        if (null !== cancelTimeout) {
            clearTimeout(cancelTimeout)
        }

        if (alert?.backendThrowable === undefined) {
            bootstrap.setState(previousState => ({
                alertsWaiting: previousState.alertsWaiting.slice(1)
            }))
        }

    }

    if (alert?.intercept === false) {
        handleClose()
        return null
    }

    if (0 !== timeout) {

        cancelTimeout = setTimeout(() => {
            handleClose()
        }, timeout)

    }

    return <Popup handleClose={handleClose}>
        <div className={classNames("model-content", dig.rounded0, dig.border0)} style={{
            maxWidth: '75vw',
            maxHeight: '75vh',
        }}>
            <div className={classNames(dig.modalHeader, dig.rounded0, dig.border0, {
                // icon?: "warning" | "error" | "success" | "info" | "question"
                [dig.bg_primary]: "info" === alert.icon || alert.icon === undefined || alert.icon === null,
                [dig.bg_success]: "success" === alert.icon,
                [dig.bg_warning]: "warning" === alert.icon,
                [dig.bg_danger]: "error" === alert.icon, // TODO - change to red
                [dig.bgPrimary]: "question" === alert.icon,
            })}>
                <h3 className={classNames(dig.modalTitle, dig.textDark)} id="staticBackdropLabel">
                    #{alertWaiting} {alert.title}
                </h3>
                <div onClick={handleClose}>
                    <FontAwesomeIcon
                        icon={faClose}
                        size={'xl'}/>
                </div>
            </div>
            <div className={classNames(dig.modalBody, dig.border0, dig.textWhite)}>
                <div className={dig.textCenter}>
                    {alert.text}
                    {alert.component}
                </div>
            </div>
            {undefined !== alert.buttons &&
                <div className={classNames(dig.modalFooter, dig.border0, dig.rounded0)}>
                    {alert.footerText && <div className={classNames(dig.textCenter, dig.textWhite)}>{alert.footerText}</div>}

                    {alert.buttons?.map((button: iAlertButtonOptions, index: number) => {

                        return <button key={index}
                                       className={classNames(dig.btn, dig.btnLg, {
                                           // todo - color: "default" | "primary" | "secondary" | "inherit" | "danger" | "info" | "success" | "warning" | undefined,
                                           [dig.bg_success]: "success" === button.color,
                                           [dig.bg_danger]: "danger" === button.color,
                                           [dig.bg_primary]: "primary" === button.color,
                                           [dig.bg_warning]: "warning" === button.color,
                                       }, "btn-Yes", dig.rounded0)}
                                       onClick={() => {
                                           handleClose()
                                           alert?.then?.(button.value ?? button.text)
                                       }}>{button.text}</button>

                    })}

                </div>}
        </div>
    </Popup>

}

