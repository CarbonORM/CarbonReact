import classNames from "classnames";
import OutsideClickHandler from 'react-outside-click-handler';
import getStyles from "hoc/getStyles";
import {PropsWithChildren, ReactElement} from "react";


interface iPopupProperties {
    open?: boolean;
    handleClose: () => any;
    minWidth?: string;
    maxWidth?: string;

}

// @link https://stackoverflow.com/questions/58399637/include-modal-functionality-in-react-higher-order-component
export default function Popup({
                                  open = true,
                                  handleClose,
                                  children,
                                  maxWidth,
                              }: PropsWithChildren<iPopupProperties>) : ReactElement {

    const dig = getStyles()

    return <div className={classNames(dig.modal, dig.fade, { [dig.show]: open}, dig.dBlock)}
             style={{backgroundColor: "rgba(0,0,0,0.8)"}}
             id="exampleModalCenter"
             tabIndex={-1} aria-labelledby="exampleModalCenterTitle"
             aria-modal="true" role="dialog">
            <div
                style={{maxWidth: maxWidth}}
                className={classNames(
                    dig.modalDialog, dig.modalDialogCentered,
                )}
            >
                <OutsideClickHandler onOutsideClick={() => handleClose()}>
                    <div className={classNames(dig.modalContent, dig.bgTransparent, dig.modalDialogScrollable)}>
                        {children}
                    </div>
                </OutsideClickHandler>
            </div>

        </div>

}

