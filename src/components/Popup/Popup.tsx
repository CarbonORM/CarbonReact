import classNames from "classnames";
import OutsideClickHandler from 'react-outside-click-handler';
import getStyles from "hoc/getStyles";


interface iPopupProperties {
    open?: boolean;
    handleClose: () => any;
    children: any;
    minWidth?: string;
    maxWidth?: string;

}

// @link https://stackoverflow.com/questions/58399637/include-modal-functionality-in-react-higher-order-component
export default function Popup({
                                  open = true,
                                  handleClose,
                                  children,
                                  maxWidth,
                              }: iPopupProperties) {

    if (false === open) {

        return null;

    }

    const dig = getStyles()

    return <>
        <div className={classNames(dig.modal, dig.fade, dig.show, dig.dBlock)}
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
                    <div className={classNames(dig.modalContent, dig.bgTransparent, dig.modalDialogScrollable, dig.walletModal)}>
                        {children}
                    </div>
                </OutsideClickHandler>
            </div>

        </div>
    </>

}

