import classNames from "classnames";
import getStyles, {getRootStyleValue} from "hoc/getStyles";
import {ReactNode} from "react";
import Skeleton, {SkeletonTheme} from "react-loading-skeleton";

interface iLoading {
    lineHeight?: number,
    count?: number,
    children?: ReactNode,
    message: string|undefined,
}

export default function Loading(props: iLoading) {

    const dig = getStyles();

    const primaryColor = getRootStyleValue()

    return <div className={classNames(dig.my5, dig.px3,dig.pb5, dig.container)} style={{lineHeight: props.lineHeight || 4}}>
        <SkeletonTheme baseColor={primaryColor} highlightColor="#444">
            <Skeleton
                className={classNames(dig.row, dig.my3, dig.justifyContentCenter, dig.mAuto)}
                count={props.count || 1}
                height={60}
                inline={true}/>
            {props.children}
            {undefined !== props?.message && <h2 style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%'
            }}>{props?.message}</h2>}
        </SkeletonTheme>
    </div>;

}

