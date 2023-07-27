
export default function Localhost() {

    const center = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        '&:hover': {color: 'blue !important'},
    };

    const onMouseEnter = (e) => {
        const target = e.target as HTMLElement;
        target.style.backgroundColor = '#e13570';
        target.style.border = '2px solid rgb(31, 0, 69)';
        target.style.boxShadow = '-2px 0px 7px 2px #e13570';
    };

    const onMouseLeave = (e) => {
        const target = e.target as HTMLElement;
        target.style.backgroundColor = 'rgb(31, 0, 69)';
        target.style.border = '2px solid #593676';
        target.style.boxShadow = '-2px 0px 7px 2px #e13570';
    };

    return <>
        <h1 style={center}>Whoa, where we dropping?</h1>
        <a onMouseEnter={onMouseEnter}
           onMouseLeave={onMouseLeave}
           style={center} href={'//local.dropingaming.gg:3000/'}>GG</a>
        <a onMouseEnter={onMouseEnter}
           onMouseLeave={onMouseLeave}
           style={center} href={'//local.dropingaming.com:3000/'}>COM</a>
    </>;

}