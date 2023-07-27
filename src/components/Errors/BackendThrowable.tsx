import style from './style.module.scss';
import DigApi from 'DigApi';
import OutsideClickHandler from 'react-outside-click-handler';

export default function BackendThrowable() {

    const bootstrap = CarbonORM.instance;

    const currentThrowable = bootstrap.state.backendThrowable[0];

    console.log([bootstrap.state.backendThrowable, currentThrowable]);

    return <div className={style.maintenanceHero}>
        <h1 className={style.httpStatusCode}>{currentThrowable?.status || 500}</h1>
        <OutsideClickHandler
            onOutsideClick={() => bootstrap.setState(currentState => ({ backendThrowable: currentState.backendThrowable.slice(1) }))}>
            <div className={style.centeredContainer}>
                {Object.keys(currentThrowable).map((key, index) => {

                    const valueIsString = typeof currentThrowable[key] === 'string';

                    const valueIsCode = 'THROWN NEAR' === key;

                    return <div key={index}>
                        <div className={style.errorTextGeneral}> &gt; <span className={style.errorKeys}>{key}</span>:
                            {valueIsString
                                ? (valueIsCode ? <div
                                        style={{ backgroundColor: 'black', fontSize: 'xx-small' }}
                                        dangerouslySetInnerHTML={{ __html: currentThrowable[key] }} /> :
                                    <i className={style.errorValues}>&quot;{currentThrowable[key]}&quot;</i>)
                                : ''}
                        </div>
                        {valueIsString
                            ? ''
                            :
                            <pre className={style.errorPre}>{JSON.stringify(currentThrowable[key], undefined, 4)}</pre>}
                    </div>;
                })}
            </div>
        </OutsideClickHandler>
    </div>;

}