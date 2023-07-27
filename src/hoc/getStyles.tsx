import classNames from "classnames";
import BootstrapStyle from "variables/bootstrap.module.scss"
import DropInGamingStyles from "style.module.scss"

export const getRootStyleValue = (property = '--dig_primary_color') : string => {

    return getComputedStyle(document.documentElement)
        .getPropertyValue(property).trim();

}

interface iStyle {
    [x: string]: any
}

function mergeStyles<iStyleA extends iStyle, iStyleB extends iStyle>(styleA : iStyleA, styleB: iStyleB) : iStyleA & iStyleB {

    let styles : iStyle = {};

    const mergedClassNames = Object.keys(styleA).concat(Object.keys(styleB))

    mergedClassNames.map(className => {
        styles[className] = classNames(styleA[className], styleB[className])
    })

    return styles as (iStyleA & iStyleB)

}

const dropStyles = mergeStyles(BootstrapStyle, DropInGamingStyles);

type tBootstrap = typeof BootstrapStyle

type tDropInGaming = typeof DropInGamingStyles

export default function getStyles<iCSS extends {}>(overrides: iCSS = {} as iCSS): tBootstrap & tDropInGaming & iCSS {

    if (0 === Object.keys(overrides).length) {
        return dropStyles as (typeof dropStyles) & iCSS
    }

    return mergeStyles(dropStyles, overrides)

}